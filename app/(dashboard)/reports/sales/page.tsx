import { getSalesReport } from "@/lib/actions/reports";
import SalesClient from "./sales-client";

export default async function SalesPage() {
  const data = await getSalesReport("month");
  return <SalesClient initialData={data} initialRange="This Month" />;
}
