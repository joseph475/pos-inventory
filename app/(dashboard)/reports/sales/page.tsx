"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, ShoppingCart, CreditCard, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrency } from "@/lib/context/currency";

// ---------------------------------------------------------------------------
// Dummy data helpers
// ---------------------------------------------------------------------------
function generateDailySales(days: number) {
  const result = [];
  const base = new Date(2024, 4, 12); // May 12 2024
  for (let i = 0; i < days; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    result.push({
      date: label,
      revenue: Math.round(800 + Math.random() * 1200 + (i % 7 < 2 ? 400 : 0)),
      transactions: Math.round(30 + Math.random() * 50),
    });
  }
  return result;
}

const DAILY_SALES = generateDailySales(30);

const TOP_PRODUCTS = [
  { name: "Mineral Water 500ml", revenue: 3240 },
  { name: "Full Cream Milk 2L",  revenue: 2810 },
  { name: "Orange Juice 1L",     revenue: 2490 },
  { name: "Bananas 1kg",          revenue: 1980 },
  { name: "Cola 330ml Can",       revenue: 1560 },
];

const RECENT_TRANSACTIONS = [
  { id: "TXN-0041", branch: "Main Branch",  cashier: "Alice K.", items: 5, total: 18.75, method: "card",  time: "14:32" },
  { id: "TXN-0040", branch: "East Branch",  cashier: "Carol R.", items: 2, total:  6.48, method: "cash",  time: "14:28" },
  { id: "TXN-0039", branch: "Main Branch",  cashier: "Alice K.", items: 8, total: 42.10, method: "card",  time: "14:15" },
  { id: "TXN-0038", branch: "West Branch",  cashier: "Dave S.",  items: 3, total: 12.99, method: "cash",  time: "14:01" },
  { id: "TXN-0037", branch: "Main Branch",  cashier: "Bob M.",   items: 6, total: 27.55, method: "split", time: "13:58" },
  { id: "TXN-0036", branch: "East Branch",  cashier: "Carol R.", items: 1, total:  3.29, method: "card",  time: "13:44" },
  { id: "TXN-0035", branch: "West Branch",  cashier: "Dave S.",  items: 4, total: 15.80, method: "cash",  time: "13:39" },
];

const BRANCH_COMPARISON = [
  { branch: "Main Branch",  revenue: 14820, transactions: 312 },
  { branch: "East Branch",  revenue: 9640,  transactions: 198 },
  { branch: "West Branch",  revenue: 7290,  transactions: 151 },
];

const DATE_RANGES = ["Today", "This Week", "This Month", "Custom"] as const;
type DateRange = (typeof DATE_RANGES)[number];

const totalRevenue = DAILY_SALES.reduce((s, d) => s + d.revenue, 0);
const totalTransactions = DAILY_SALES.reduce((s, d) => s + d.transactions, 0);
const avgOrderValue = totalRevenue / totalTransactions;
const itemsSold = 3748;


const METHOD_CONFIG: Record<string, string> = {
  card:  "bg-blue-500/15 text-blue-500 border-transparent",
  cash:  "bg-emerald-500/15 text-emerald-500 border-transparent",
  split: "bg-violet-500/15 text-violet-500 border-transparent",
};

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  const { formatCurrency } = useCurrency();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-muted-foreground">
          {p.name === "revenue" ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function SalesPage() {
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = React.useState(true);
  const [range, setRange] = React.useState<DateRange>("This Month");

  const STAT_CARDS = [
    { label: "Revenue",          value: formatCurrency(totalRevenue),    icon: TrendingUp,   color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Transactions",     value: totalTransactions.toLocaleString(), icon: ShoppingCart, color: "text-blue-500",    bg: "bg-blue-500/10" },
    { label: "Avg. Order Value", value: formatCurrency(avgOrderValue),   icon: CreditCard,   color: "text-violet-500",  bg: "bg-violet-500/10" },
    { label: "Items Sold",       value: itemsSold.toLocaleString(),      icon: Package,      color: "text-amber-500",   bg: "bg-amber-500/10" },
  ];

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Sales Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Performance overview across all branches
          </p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {DATE_RANGES.map((r) => (
            <Button
              key={r}
              variant={range === r ? "default" : "ghost"}
              size="sm"
              className="h-6 text-xs"
              onClick={() => setRange(r)}
            >
              {r}
            </Button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          : STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label}>
                <CardContent className="flex items-center gap-3 py-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-foreground truncate">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Line chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-medium">Daily Revenue (30 days)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <Skeleton className="h-56 w-full rounded-md" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={DAILY_SALES} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bar chart */}
        <Card>
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-medium">Top 5 Products</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <Skeleton className="h-56 w-full rounded-md" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={TOP_PRODUCTS}
                  layout="vertical"
                  margin={{ top: 0, right: 8, bottom: 0, left: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions + branch comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Transactions table */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-medium">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-md" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="pl-4">ID</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="pr-4">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {RECENT_TRANSACTIONS.map((txn) => (
                    <TableRow key={txn.id} className="border-b border-border/50">
                      <TableCell className="pl-4 font-mono text-xs text-foreground">{txn.id}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{txn.branch}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{txn.cashier}</TableCell>
                      <TableCell className="text-center text-sm tabular-nums text-muted-foreground">{txn.items}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium">{formatCurrency(txn.total)}</TableCell>
                      <TableCell>
                        <Badge className={METHOD_CONFIG[txn.method] ?? ""}>
                          {txn.method.charAt(0).toUpperCase() + txn.method.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-4 font-mono text-xs text-muted-foreground">{txn.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Branch comparison */}
        <Card>
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-medium">Branch Comparison</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-md" />)
              : BRANCH_COMPARISON.map((b, i) => {
                  const maxRevenue = Math.max(...BRANCH_COMPARISON.map((x) => x.revenue));
                  const pct = Math.round((b.revenue / maxRevenue) * 100);
                  return (
                    <div key={b.branch} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{b.branch}</span>
                        <span className="font-mono text-muted-foreground">
                          {formatCurrency(b.revenue)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            i === 0 ? "bg-primary" : i === 1 ? "bg-blue-500" : "bg-violet-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {b.transactions} transactions
                      </p>
                    </div>
                  );
                })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
