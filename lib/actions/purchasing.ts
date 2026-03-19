'use server'

import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import type { Database, PurchaseOrder as PurchaseOrderRow } from '@/types/database'

export type POWithRelations = PurchaseOrderRow & {
  suppliers: { name: string } | null
  branches: { name: string } | null
  profiles: { full_name: string } | null
  purchase_order_items: Array<{ id: string }>
}

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Create a new purchase order with line items
export async function createPurchaseOrder(params: {
  supplier_id: string
  branch_id: string
  notes: string
  items: Array<{
    product_id: string
    quantity_ordered: number
    unit_cost: number
  }>
}) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const supabase = getAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()
  if (!profile) throw new Error('Profile not found')

  const total = params.items.reduce((sum, item) => sum + item.quantity_ordered * item.unit_cost, 0)

  // Create the PO
  const { data: poRaw, error: poErr } = await supabase
    .from('purchase_orders')
    .insert({
      supplier_id: params.supplier_id,
      branch_id: params.branch_id,
      status: 'draft',
      total,
      notes: params.notes || null,
      created_by: profile.id,
    })
    .select()
    .single()
  if (poErr) throw new Error(poErr.message)
  const po = poRaw as unknown as PurchaseOrderRow

  // Insert line items
  const { error: itemErr } = await supabase
    .from('purchase_order_items')
    .insert(
      params.items.map((item) => ({
        po_id: po.id,
        product_id: item.product_id,
        quantity_ordered: item.quantity_ordered,
        quantity_received: 0,
        unit_cost: item.unit_cost,
      }))
    )
  if (itemErr) throw new Error(itemErr.message)

  revalidatePath('/purchasing/orders')
  return po
}

// Update PO status
export async function updatePurchaseOrderStatus(poId: string, status: 'ordered' | 'cancelled') {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const supabase = getAdminClient()
  const { error } = await supabase
    .from('purchase_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', poId)
  if (error) throw new Error(error.message)
  revalidatePath('/purchasing/orders')
}

// Get all purchase orders with related data
export async function getPurchaseOrders(filters?: { status?: string; branch_id?: string }): Promise<POWithRelations[]> {
  const supabase = getAdminClient()
  let query = supabase
    .from('purchase_orders')
    .select(`
      *,
      suppliers(name),
      branches(name),
      profiles(full_name),
      purchase_order_items(id)
    `)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status as any)
  if (filters?.branch_id) query = query.eq('branch_id', filters.branch_id)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as POWithRelations[]
}

// Get suppliers
export async function getSuppliers() {
  const supabase = getAdminClient()
  const { data } = await supabase
    .from('suppliers')
    .select('id, name')
    .order('name')
  return data ?? []
}

// Get branches
export async function getBranches() {
  const supabase = getAdminClient()
  const { data } = await supabase
    .from('branches')
    .select('id, name')
    .eq('is_active', true)
    .order('name')
  return data ?? []
}

// Upsert a supplier
export async function upsertSupplier(params: {
  id?: string
  name: string
  contact_name: string
  email: string
  phone: string
}) {
  const supabase = getAdminClient()
  const orgId = '00000000-0000-0000-0000-000000000001'
  if (params.id) {
    const { error } = await supabase
      .from('suppliers')
      .update({
        name: params.name,
        contact_name: params.contact_name || null,
        email: params.email || null,
        phone: params.phone || null,
      })
      .eq('id', params.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('suppliers')
      .insert({
        org_id: orgId,
        name: params.name,
        contact_name: params.contact_name || null,
        email: params.email || null,
        phone: params.phone || null,
      })
    if (error) throw new Error(error.message)
  }
  revalidatePath('/purchasing/suppliers')
}
