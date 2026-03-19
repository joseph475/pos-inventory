import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"
import { getPurchaseOrders, getSuppliers, getBranches } from "@/lib/actions/purchasing"
import { getProductsForBranch } from "@/lib/actions/inventory"
import { OrdersClient } from "./orders-client"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function PurchaseOrdersPage() {
  const { userId } = await auth()

  // Resolve user's branch
  let userBranchId: string | null = null

  if (userId) {
    const supabase = getAdminClient()
    const { data: profile } = await supabase
      .from("profiles")
      .select("branch_id")
      .eq("clerk_user_id", userId)
      .single()

    userBranchId = profile?.branch_id ?? null
  }

  // Fetch all data in parallel
  const [orders, suppliers, branches, products] = await Promise.all([
    getPurchaseOrders(),
    getSuppliers(),
    getBranches(),
    getProductsForBranch(),
  ])

  // Map PO rows
  const orderRows = orders.map((o) => {
    const supplier = o.suppliers as { name: string } | null
    const branch = o.branches as { name: string } | null
    const creator = o.profiles as { full_name: string } | null
    const items = o.purchase_order_items as Array<{ id: string }> | null
    return {
      id: o.id,
      supplier: supplier?.name ?? "Unknown supplier",
      branch: branch?.name ?? "Unknown branch",
      status: o.status,
      items: items?.length ?? 0,
      total: o.total,
      created_by: creator?.full_name ?? "—",
      created_at: o.created_at,
    }
  })

  const productList = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    cost_price: p.cost_price,
  }))

  // Unique supplier names for the filter dropdown
  const supplierNames = Array.from(new Set(orderRows.map((o) => o.supplier).filter(Boolean)))

  return (
    <OrdersClient
      initialOrders={orderRows}
      suppliers={suppliers}
      branches={branches}
      products={productList}
      userBranchId={userBranchId}
      supplierNames={supplierNames}
    />
  )
}
