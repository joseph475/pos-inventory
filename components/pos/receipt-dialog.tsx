"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Printer, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

export interface ReceiptData {
  transactionId: string
  timestamp: Date
  branchName: string
  branchAddress: string | null
  branchPhone: string | null
  cashierName: string
  items: Array<{
    name: string
    qty: number
    unitPrice: number
    discountAmount: number
    lineTotal: number
  }>
  subtotal: number
  discountAmount: number
  taxAmount: number
  taxRate: number
  total: number
  paymentMethod: "cash" | "card" | "split"
  cashTendered?: number
  change?: number
  splitCash?: number
  splitCard?: number
  formatCurrency: (n: number) => string
}

interface ReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: ReceiptData
}

function pad(str: string, width: number, align: "left" | "right" = "left") {
  const s = str.slice(0, width)
  return align === "left" ? s.padEnd(width) : s.padStart(width)
}

function ReceiptLine({ children }: { children: React.ReactNode }) {
  return <div style={{ whiteSpace: "pre" }}>{children}</div>
}

function Divider({ char = "=" }: { char?: string }) {
  return <ReceiptLine>{char.repeat(42)}</ReceiptLine>
}

function ReceiptContent({ data }: { data: ReceiptData }) {
  const shortId = data.transactionId.slice(0, 8).toUpperCase()
  const date = data.timestamp.toLocaleDateString()
  const time = data.timestamp.toLocaleTimeString()
  const taxPct = `${Math.round(data.taxRate * 10000) / 100}%`

  function row(label: string, value: string) {
    return (
      <ReceiptLine>
        {pad(label, 28)}
        {value.padStart(14)}
      </ReceiptLine>
    )
  }

  return (
    <div
      style={{
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "12px",
        lineHeight: "1.4",
        color: "#000",
        background: "#fff",
        width: "100%",
        maxWidth: "300px",
        margin: "0 auto",
        padding: "8px 0",
      }}
    >
      {/* Header */}
      <Divider />
      <ReceiptLine>{"".padStart(Math.floor((42 - data.branchName.length) / 2)) + data.branchName}</ReceiptLine>
      {data.branchAddress && (
        <ReceiptLine>
          {"".padStart(Math.floor((42 - data.branchAddress.length) / 2))}
          {data.branchAddress.slice(0, 42)}
        </ReceiptLine>
      )}
      {data.branchPhone && (
        <ReceiptLine>
          {"".padStart(Math.floor((42 - data.branchPhone.length) / 2))}
          {data.branchPhone}
        </ReceiptLine>
      )}
      <Divider />

      {/* Meta */}
      <ReceiptLine>{`Date: ${date}  Time: ${time}`}</ReceiptLine>
      <ReceiptLine>{`Receipt #: ${shortId}`}</ReceiptLine>
      <ReceiptLine>{`Cashier: ${data.cashierName}`}</ReceiptLine>
      <Divider char="-" />

      {/* Column headers */}
      <ReceiptLine>{pad("Item", 28)}{pad("Qty", 6, "right")}{pad("Total", 8, "right")}</ReceiptLine>
      <Divider char="-" />

      {/* Items */}
      {data.items.map((item, i) => (
        <React.Fragment key={i}>
          <ReceiptLine>
            {pad(item.name.length > 22 ? item.name.slice(0, 21) + "…" : item.name, 28)}
            {String(item.qty).padStart(6)}
            {data.formatCurrency(item.lineTotal).padStart(8)}
          </ReceiptLine>
          {item.discountAmount > 0 && (
            <ReceiptLine>{`  (Discount: -${data.formatCurrency(item.discountAmount)})`}</ReceiptLine>
          )}
        </React.Fragment>
      ))}

      <Divider char="-" />

      {/* Totals */}
      {row("Subtotal:", data.formatCurrency(data.subtotal))}
      {data.discountAmount > 0 && row("Discount:", `-${data.formatCurrency(data.discountAmount)}`)}
      {row(`Tax (${taxPct}):`, data.formatCurrency(data.taxAmount))}
      <Divider char="-" />
      <ReceiptLine>
        <strong>{pad("TOTAL:", 28)}{data.formatCurrency(data.total).padStart(14)}</strong>
      </ReceiptLine>
      <Divider />

      {/* Payment */}
      <ReceiptLine>{`Payment: ${data.paymentMethod.charAt(0).toUpperCase() + data.paymentMethod.slice(1)}`}</ReceiptLine>
      {data.paymentMethod === "cash" && data.cashTendered !== undefined && (
        <>
          {row("Tendered:", data.formatCurrency(data.cashTendered))}
          {row("Change:", data.formatCurrency(data.change ?? 0))}
        </>
      )}
      {data.paymentMethod === "split" && (
        <>
          {data.splitCash !== undefined && row("  Cash:", data.formatCurrency(data.splitCash))}
          {data.splitCard !== undefined && row("  Card:", data.formatCurrency(data.splitCard))}
        </>
      )}
      <Divider />

      {/* Footer */}
      <ReceiptLine>{"".padStart(9)}Thank you for your purchase!</ReceiptLine>
      <Divider />
    </div>
  )
}

export function ReceiptDialog({ open, onOpenChange, data }: ReceiptDialogProps) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => { setMounted(true) }, [])

  function handlePrint() {
    window.print()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Printer className="h-5 w-5 text-primary" />
              Receipt
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable receipt preview — mimics thermal paper slip */}
          <div className="max-h-[60vh] overflow-y-auto rounded-lg bg-muted/40 p-4">
            <div
              className="mx-auto overflow-hidden rounded-sm shadow-md"
              style={{ width: "300px", background: "#fff" }}
            >
              {/* Torn-edge top */}
              <div style={{
                height: "8px",
                background: "repeating-linear-gradient(90deg, #fff 0px, #fff 6px, #f0f0f0 6px, #f0f0f0 8px)",
                borderBottom: "1px dashed #ccc",
              }} />
              <div style={{ padding: "4px 8px 4px" }}>
                <ReceiptContent data={data} />
              </div>
              {/* Torn-edge bottom */}
              <div style={{
                height: "8px",
                background: "repeating-linear-gradient(90deg, #fff 0px, #fff 6px, #f0f0f0 6px, #f0f0f0 8px)",
                borderTop: "1px dashed #ccc",
              }} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden portal for printing — only visible via @media print */}
      {mounted && open && createPortal(
        <div id="pos-receipt">
          <ReceiptContent data={data} />
        </div>,
        document.body
      )}
    </>
  )
}
