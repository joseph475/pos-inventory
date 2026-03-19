"use client"

import * as React from "react"
import { SlidersHorizontal, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { NewAdjustmentDialog } from "./new-adjustment-dialog"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type AdjType = "sale" | "purchase" | "adjustment" | "damage" | "transfer_in" | "transfer_out"

interface AdjRow {
  id: string
  date: string
  product: string
  sku: string
  branch: string
  type: AdjType
  quantity: number
  reference: string | null
  notes: string | null
  created_by: string
}

interface Props {
  initialRows: AdjRow[]
  products: Array<{ id: string; name: string; sku: string; unit: string }>
  branches: Array<{ id: string; name: string }>
  defaultBranchId: string
}

const TYPE_LABELS: Record<AdjType, string> = {
  sale: "Sale",
  purchase: "Purchase",
  adjustment: "Adjustment",
  damage: "Damage",
  transfer_in: "Transfer In",
  transfer_out: "Transfer Out",
}

const TYPE_COLORS: Record<AdjType, string> = {
  sale: "bg-blue-500/15 text-blue-500 border-transparent",
  purchase: "bg-emerald-500/15 text-emerald-500 border-transparent",
  adjustment: "bg-violet-500/15 text-violet-500 border-transparent",
  damage: "bg-red-500/15 text-red-500 border-transparent",
  transfer_in: "bg-sky-500/15 text-sky-500 border-transparent",
  transfer_out: "bg-amber-500/15 text-amber-500 border-transparent",
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function AdjustmentsClient({ initialRows, products, branches, defaultBranchId }: Props) {
  const [rows, setRows] = React.useState<AdjRow[]>(initialRows)
  const [typeFilter, setTypeFilter] = React.useState("all")
  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")

  // Sync when server re-renders with fresh data via router refresh
  React.useEffect(() => {
    setRows(initialRows)
  }, [initialRows])

  const filtered = rows.filter((r) => {
    const matchType = typeFilter === "all" || r.type === typeFilter
    const rowDate = r.date.slice(0, 10)
    const matchFrom = !dateFrom || rowDate >= dateFrom
    const matchTo = !dateTo || rowDate <= dateTo
    return matchType && matchFrom && matchTo
  })

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Stock Adjustments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View all inventory movement history
          </p>
        </div>
        <NewAdjustmentDialog
          products={products}
          branches={branches}
          defaultBranchId={defaultBranchId}
          onSuccess={() => {}}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select
                value={typeFilter}
                onValueChange={(v) => { if (v !== null) setTypeFilter(v) }}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="damage">Damage</SelectItem>
                  <SelectItem value="transfer_in">Transfer In</SelectItem>
                  <SelectItem value="transfer_out">Transfer Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-1.5">
                <div className="space-y-0.5">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-36 h-8"
                  />
                </div>
                <span className="text-muted-foreground text-sm mt-4">–</span>
                <div className="space-y-0.5">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-36 h-8"
                  />
                </div>
              </div>
            </div>
            {(typeFilter !== "all" || dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setTypeFilter("all"); setDateFrom(""); setDateTo("") }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <p className="text-sm">No inventory movements found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="pl-4">Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="pr-4">By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id} className="border-b border-border/50">
                    <TableCell className="pl-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {row.date.slice(0, 10)}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">{row.product}</p>
                      <p className="text-xs text-muted-foreground font-mono">{row.sku}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.branch}
                    </TableCell>
                    <TableCell>
                      <Badge className={TYPE_COLORS[row.type]}>
                        {TYPE_LABELS[row.type]}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono font-semibold tabular-nums ${
                        row.quantity > 0 ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {row.quantity > 0 ? `+${row.quantity}` : row.quantity}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {row.reference ?? <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {row.notes ?? <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                    <TableCell className="pr-4 text-sm text-muted-foreground">
                      {row.created_by}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-right">
        Showing {filtered.length} of {rows.length} records
      </p>
    </div>
  )
}
