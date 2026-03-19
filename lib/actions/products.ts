'use server'

import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const ORG_ID = '00000000-0000-0000-0000-000000000001'

export async function upsertProduct(params: {
  id?: string
  name: string
  sku: string
  barcode?: string
  category_id?: string
  unit: string
  cost_price: number
  selling_price: number
  description?: string
  is_active: boolean
}): Promise<void> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const supabase = getAdminClient()

  const payload = {
    name: params.name,
    sku: params.sku,
    barcode: params.barcode || null,
    category_id: params.category_id || null,
    unit: params.unit,
    cost_price: params.cost_price,
    selling_price: params.selling_price,
    description: params.description || null,
    is_active: params.is_active,
  }

  if (params.id) {
    const { error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', params.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('products')
      .insert({ ...payload, org_id: ORG_ID })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/inventory/products')
}

export async function deleteProduct(id: string): Promise<void> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const supabase = getAdminClient()
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/inventory/products')
}

export async function toggleProductActive(id: string, isActive: boolean): Promise<void> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const supabase = getAdminClient()
  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/inventory/products')
}
