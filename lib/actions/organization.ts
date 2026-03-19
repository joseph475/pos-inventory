'use server'

import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

const ORG_ID = '00000000-0000-0000-0000-000000000001'

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function getOrgSettings() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const supabase = getAdminClient()
  const { data } = await supabase
    .from('organizations')
    .select('currency_code, currency_locale')
    .eq('id', ORG_ID)
    .single()

  return data ?? { currency_code: 'USD', currency_locale: 'en-US' }
}

export async function updateOrgSettings(settings: {
  currency_code: string
  currency_locale: string
}) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  // Only super_admin may update org settings
  const supabase = getAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (profile?.role !== 'super_admin') throw new Error('Forbidden')

  const { error: updateError } = await supabase
    .from('organizations')
    .update(settings)
    .eq('id', ORG_ID)

  if (updateError) throw new Error(updateError.message)

  revalidatePath('/settings/organization')
}
