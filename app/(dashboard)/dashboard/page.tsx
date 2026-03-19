"use client";

import * as React from "react";
import {
  DollarSign,
  ShoppingBag,
  Package,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Static data ─────────────────────────────────────────────────────────────

const STATS = [
  {
    label: "Today's Sales",
    value: "$14,382.50",
    trend: +12.4,
    icon: DollarSign,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
  },
  {
    label: "Total Transactions",
    value: "248",
    trend: +8.1,
    icon: ShoppingBag,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
  },
  {
    label: "Items Sold",
    value: "1,039",
    trend: +5.7,
    icon: Package,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
  {
    label: "Active Products",
    value: "3,214",
    trend: -2.3,
    icon: Activity,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
  },
];

type PaymentMethod = "Cash" | "Card" | "GCash" | "PayMaya";
type TxStatus = "Completed" | "Voided" | "Pending";

interface Transaction {
  id: string;
  time: string;
  cashier: string;
  items: number;
  amount: string;
  method: PaymentMethod;
  status: TxStatus;
}

const RECENT_TRANSACTIONS: Transaction[] = [
  { id: "TXN-0248", time: "3:41 PM", cashier: "Maria S.", items: 7, amount: "$182.00", method: "Card", status: "Completed" },
  { id: "TXN-0247", time: "3:29 PM", cashier: "Juan D.", items: 2, amount: "$38.50", method: "Cash", status: "Completed" },
  { id: "TXN-0246", time: "3:17 PM", cashier: "Ana R.", items: 14, amount: "$394.75", method: "GCash", status: "Completed" },
  { id: "TXN-0245", time: "3:05 PM", cashier: "Pedro L.", items: 1, amount: "$12.00", method: "Cash", status: "Voided" },
  { id: "TXN-0244", time: "2:58 PM", cashier: "Maria S.", items: 5, amount: "$110.25", method: "PayMaya", status: "Completed" },
  { id: "TXN-0243", time: "2:44 PM", cashier: "Juan D.", items: 9, amount: "$267.00", method: "Card", status: "Completed" },
  { id: "TXN-0242", time: "2:30 PM", cashier: "Ana R.", items: 3, amount: "$55.00", method: "Cash", status: "Completed" },
  { id: "TXN-0241", time: "2:15 PM", cashier: "Pedro L.", items: 6, amount: "$148.90", method: "GCash", status: "Pending" },
  { id: "TXN-0240", time: "2:03 PM", cashier: "Maria S.", items: 11, amount: "$329.50", method: "Card", status: "Completed" },
  { id: "TXN-0239", time: "1:47 PM", cashier: "Juan D.", items: 4, amount: "$82.00", method: "Cash", status: "Completed" },
];

interface LowStockItem {
  name: string;
  sku: string;
  stock: number;
  threshold: number;
  category: string;
}

const LOW_STOCK_ITEMS: LowStockItem[] = [
  { name: "Premium Arabica Coffee 250g", sku: "COF-001", stock: 4, threshold: 20, category: "Beverages" },
  { name: "Mineral Water 500ml (case)", sku: "WTR-012", stock: 7, threshold: 30, category: "Beverages" },
  { name: "A4 Bond Paper (ream)", sku: "STN-034", stock: 2, threshold: 10, category: "Stationery" },
  { name: "Ballpen Blue (box of 12)", sku: "STN-008", stock: 5, threshold: 15, category: "Stationery" },
  { name: "Thermal Receipt Roll", sku: "POS-003", stock: 3, threshold: 25, category: "POS Supplies" },
];

const SALES_BY_BRANCH = [
  { branch: "Main", sales: 14382 },
  { branch: "North", sales: 9841 },
  { branch: "South", sales: 7263 },
  { branch: "East", sales: 11045 },
  { branch: "West", sales: 6512 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function TrendBadge({ trend }: { trend: number }) {
  const positive = trend >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        positive
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-red-500/10 text-red-400"
      }`}
    >
      {positive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {positive ? "+" : ""}
      {trend}%
    </span>
  );
}

function StatusBadge({ status }: { status: TxStatus }) {
  const styles: Record<TxStatus, string> = {
    Completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Voided: "bg-red-500/10 text-red-400 border-red-500/20",
    Pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function PaymentBadge({ method }: { method: PaymentMethod }) {
  const styles: Record<PaymentMethod, string> = {
    Cash: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    Card: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    GCash: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    PayMaya: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[method]}`}
    >
      {method}
    </span>
  );
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 shadow-xl">
        <p className="text-xs font-medium text-zinc-400">{label} Branch</p>
        <p className="text-sm font-semibold text-zinc-100">
          ${payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page heading */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Overview for today — {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {stat.label}
                    </span>
                    <span className="text-2xl font-bold tracking-tight text-foreground">
                      {stat.value}
                    </span>
                    <TrendBadge trend={stat.trend} />
                  </div>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.iconBg}`}>
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Middle row: transactions + low stock */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent transactions */}
        <Card className="xl:col-span-2">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Last 10 transactions across all cashiers</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableHead className="pl-4 text-xs">Time</TableHead>
                  <TableHead className="text-xs">Cashier</TableHead>
                  <TableHead className="text-xs text-right">Items</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs">Payment</TableHead>
                  <TableHead className="pr-4 text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RECENT_TRANSACTIONS.map((tx) => (
                  <TableRow key={tx.id} className="border-border/50">
                    <TableCell className="pl-4">
                      <span className="font-mono text-xs text-muted-foreground">
                        {tx.time}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-foreground">
                          {tx.cashier}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground/60">
                          {tx.id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                      {tx.items}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-medium text-foreground">
                      {tx.amount}
                    </TableCell>
                    <TableCell>
                      <PaymentBadge method={tx.method} />
                    </TableCell>
                    <TableCell className="pr-4">
                      <StatusBadge status={tx.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Low stock alerts */}
        <Card>
          <CardHeader className="border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <CardTitle>Low Stock Alerts</CardTitle>
            </div>
            <CardDescription>{LOW_STOCK_ITEMS.length} products below threshold</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {LOW_STOCK_ITEMS.map((item) => {
                const pct = Math.round((item.stock / item.threshold) * 100);
                const urgent = pct <= 25;
                return (
                  <div key={item.sku} className="flex flex-col gap-1.5 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium leading-tight text-foreground">
                          {item.name}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground/60">
                          {item.sku}
                        </span>
                      </div>
                      <span
                        className={`shrink-0 font-mono text-sm font-bold tabular-nums ${
                          urgent ? "text-red-400" : "text-amber-400"
                        }`}
                      >
                        {item.stock}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all ${
                          urgent ? "bg-red-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="h-4 border-zinc-700 px-1.5 text-[10px] text-muted-foreground">
                        {item.category}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground/60">
                        threshold: {item.threshold}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales by branch chart */}
      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle>Sales by Branch</CardTitle>
          <CardDescription>Today's revenue across all branches</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={SALES_BY_BRANCH}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              barSize={40}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="oklch(1 0 0 / 6%)"
              />
              <XAxis
                dataKey="branch"
                tick={{ fill: "oklch(0.708 0 0)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />
              <YAxis
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fill: "oklch(0.708 0 0)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                dx={-8}
                width={44}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "oklch(1 0 0 / 4%)" }}
              />
              <Bar
                dataKey="sales"
                fill="oklch(0.488 0.243 264.376)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
