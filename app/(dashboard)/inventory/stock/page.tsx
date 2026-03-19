import { createClient } from "@supabase/supabase-js";
import type { Database, Branch } from "@/types/database";
import { StockClient, type StockRow } from "./stock-client";

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function StockPage() {
  const supabase = getAdminClient();

  const [inventoryResult, branchesResult] = await Promise.all([
    supabase
      .from("inventory")
      .select("*, products(name, sku), branches(name)")
      .order("updated_at", { ascending: false }),
    supabase
      .from("branches")
      .select("*")
      .eq("is_active", true)
      .order("name"),
  ]);

  const branches: Branch[] = (branchesResult.data ?? []) as Branch[];

  const rows: StockRow[] = (inventoryResult.data ?? []).map((inv: any) => ({
    id: inv.id,
    product_name: inv.products?.name ?? "Unknown Product",
    sku: inv.products?.sku ?? "—",
    branch_name: inv.branches?.name ?? "Unknown Branch",
    branch_id: inv.branch_id,
    quantity: inv.quantity,
    threshold: inv.low_stock_threshold,
    updated_at: inv.updated_at,
  }));

  return <StockClient initialRows={rows} branches={branches} />;
}
