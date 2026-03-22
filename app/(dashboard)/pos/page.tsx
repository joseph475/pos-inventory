import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { getPOSProducts } from "@/lib/actions/inventory"
import { POSClient } from "./pos-client"

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function POSPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const supabase = getAdminClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("branch_id, role")
    .eq("clerk_user_id", userId)
    .single()

  if (profile?.role === "super_admin" || profile?.role === "owner") {
    redirect("/dashboard")
  }

  const products = await getPOSProducts(profile?.branch_id ?? null)

  return <POSClient initialProducts={products} />
}
