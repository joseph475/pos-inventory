'use server'

import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { Database } from '@/types/database'
import { CACHE_TAGS } from '@/lib/cache-tags'

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface TxItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  discount_amount: number
}

async function getProfile() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const supabase = getAdminClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, branch_id')
    .eq('clerk_user_id', userId)
    .single()

  if (error || !profile) throw new Error('Profile not found')
  if (!profile.branch_id) throw new Error('No branch assigned to your account')

  return profile as { id: string; branch_id: string }
}

export async function createTransaction(params: {
  items: TxItem[]
  subtotal: number
  discount_amount: number
  tax_amount: number
  total: number
  payment_method: 'cash' | 'card' | 'split'
  notes?: string
}): Promise<void> {
  const profile = await getProfile()
  const supabase = getAdminClient()

  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      branch_id: profile.branch_id,
      cashier_id: profile.id,
      subtotal: params.subtotal,
      discount_amount: params.discount_amount,
      tax_amount: params.tax_amount,
      total: params.total,
      payment_method: params.payment_method,
      status: 'completed',
      notes: params.notes ?? null,
    })
    .select('id')
    .single()

  if (txError || !transaction) throw new Error(txError?.message ?? 'Failed to create transaction')

  const { error: itemsError } = await supabase.from('transaction_items').insert(
    params.items.map((item) => ({
      transaction_id: transaction.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_amount: item.discount_amount,
      total: item.unit_price * item.quantity - item.discount_amount,
    }))
  )
  if (itemsError) throw new Error(itemsError.message)

  // Deduct inventory for each item
  for (const item of params.items) {
    const { data: inv } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('product_id', item.product_id)
      .eq('branch_id', profile.branch_id)
      .single()

    if (inv) {
      await supabase
        .from('inventory')
        .update({ quantity: Math.max(0, inv.quantity - item.quantity) })
        .eq('product_id', item.product_id)
        .eq('branch_id', profile.branch_id)
    }

    await supabase.from('inventory_movements').insert({
      product_id: item.product_id,
      branch_id: profile.branch_id,
      type: 'sale',
      quantity: -item.quantity,
      reference_id: transaction.id,
      notes: `Sale #${transaction.id.slice(0, 8)}`,
      created_by: profile.id,
    })
  }

  revalidateTag(CACHE_TAGS.INVENTORY, {})
  revalidateTag(CACHE_TAGS.INVENTORY_MOVEMENTS, {})
  revalidatePath('/inventory')
  revalidatePath('/inventory/adjustments')
}

export async function createHeldTransaction(params: {
  items: TxItem[]
  subtotal: number
  discount_amount: number
  tax_amount: number
  total: number
  notes?: string
}): Promise<void> {
  const profile = await getProfile()
  const supabase = getAdminClient()

  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      branch_id: profile.branch_id,
      cashier_id: profile.id,
      subtotal: params.subtotal,
      discount_amount: params.discount_amount,
      tax_amount: params.tax_amount,
      total: params.total,
      payment_method: 'cash',
      status: 'held',
      notes: params.notes ?? null,
    })
    .select('id')
    .single()

  if (txError || !transaction) throw new Error(txError?.message ?? 'Failed to hold transaction')

  const { error: itemsError } = await supabase.from('transaction_items').insert(
    params.items.map((item) => ({
      transaction_id: transaction.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_amount: item.discount_amount,
      total: item.unit_price * item.quantity - item.discount_amount,
    }))
  )
  if (itemsError) throw new Error(itemsError.message)
}

export type HeldTransaction = {
  id: string
  notes: string | null
  total: number
  created_at: string
  items: Array<{
    id: string
    product_id: string
    product_name: string
    quantity: number
    unit_price: number
    discount_amount: number
  }>
}

export async function getHeldTransactions(): Promise<HeldTransaction[]> {
  const { userId } = await auth()
  if (!userId) return []

  const supabase = getAdminClient()
  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, branch_id')
    .eq('clerk_user_id', userId)
    .single()

  if (!profileData?.branch_id) return []

  const profile = profileData as { id: string; branch_id: string }

  const { data, error } = await supabase
    .from('transactions')
    .select('id, notes, total, created_at, transaction_items(id, product_id, product_name, quantity, unit_price, discount_amount)')
    .eq('status', 'held')
    .eq('branch_id', profile.branch_id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return ((data ?? []) as any[]).map((tx) => ({
    id: tx.id as string,
    notes: tx.notes as string | null,
    total: tx.total as number,
    created_at: tx.created_at as string,
    items: (Array.isArray(tx.transaction_items) ? tx.transaction_items : []) as HeldTransaction['items'],
  }))
}

export async function deleteHeldTransaction(id: string): Promise<void> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const supabase = getAdminClient()
  await supabase.from('transaction_items').delete().eq('transaction_id', id)
  await supabase.from('transactions').delete().eq('id', id).eq('status', 'held')
}
