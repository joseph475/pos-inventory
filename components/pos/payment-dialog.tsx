"use client"

import * as React from "react"
import { toast } from "sonner"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useCartStore } from "@/lib/store/cart"
import { useCurrency } from "@/lib/context/currency"
import { useUserProfile } from "@/lib/context/user-profile"
import { createTransaction } from "@/lib/actions/transactions"
import { ReceiptDialog, type ReceiptData } from "@/components/pos/receipt-dialog"

type PaymentMethod = "cash" | "card" | "split"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentMethod: PaymentMethod
}

export function PaymentDialog({
  open,
  onOpenChange,
  paymentMethod,
}: PaymentDialogProps) {
  const { items, clearCart, subtotal, totalDiscount, tax, total } = useCartStore()
  const { formatCurrency, taxRate, currencySymbol } = useCurrency()
  const { profile, branch } = useUserProfile()

  const [cashTendered, setCashTendered] = React.useState("")
  const [splitCash, setSplitCash] = React.useState("")
  const [splitCard, setSplitCard] = React.useState("")
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [receiptData, setReceiptData] = React.useState<ReceiptData | null>(null)
  const [receiptOpen, setReceiptOpen] = React.useState(false)

  const orderTotal = total()
  const orderSubtotal = subtotal()
  const orderDiscount = totalDiscount()
  const orderTax = tax()
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  const cashTenderedNum = parseFloat(cashTendered) || 0
  const change = cashTenderedNum - orderTotal

  const splitCashNum = parseFloat(splitCash) || 0
  const splitCardNum = parseFloat(splitCard) || 0
  const splitTotal = splitCashNum + splitCardNum
  const splitRemaining = orderTotal - splitTotal

  const isCashValid =
    paymentMethod === "cash" ? cashTenderedNum >= orderTotal : true
  const isSplitValid =
    paymentMethod === "split"
      ? Math.abs(splitRemaining) < 0.01
      : true
  const canConfirm =
    paymentMethod === "card" ||
    (paymentMethod === "cash" && isCashValid) ||
    (paymentMethod === "split" && isSplitValid)

  async function handleConfirm() {
    if (!canConfirm) return
    setIsProcessing(true)
    try {
      const result = await createTransaction({
        items: items.map((i) => ({
          product_id: i.product.id,
          product_name: i.product.name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount_amount: i.discount_amount,
        })),
        subtotal: orderSubtotal,
        discount_amount: orderDiscount,
        tax_amount: orderTax,
        total: orderTotal,
        payment_method: paymentMethod,
      })

      // Capture receipt data before clearing cart
      setReceiptData({
        transactionId: result.id,
        timestamp: new Date(),
        branchName: branch?.name ?? "Store",
        branchAddress: branch?.address ?? null,
        branchPhone: branch?.phone ?? null,
        cashierName: profile?.full_name ?? "Cashier",
        items: items.map((i) => ({
          name: i.product.name,
          qty: i.quantity,
          unitPrice: i.unit_price,
          discountAmount: i.discount_amount,
          lineTotal: i.unit_price * i.quantity - i.discount_amount,
        })),
        subtotal: orderSubtotal,
        discountAmount: orderDiscount,
        taxAmount: orderTax,
        taxRate,
        total: orderTotal,
        paymentMethod,
        cashTendered: paymentMethod === "cash" ? cashTenderedNum : undefined,
        change: paymentMethod === "cash" ? change : undefined,
        splitCash: paymentMethod === "split" ? splitCashNum : undefined,
        splitCard: paymentMethod === "split" ? splitCardNum : undefined,
        formatCurrency,
      })
      setReceiptOpen(true)

      clearCart()
      onOpenChange(false)
      setCashTendered("")
      setSplitCash("")
      setSplitCard("")
      toast.success("Transaction completed", {
        description: `${itemCount} item${itemCount !== 1 ? "s" : ""} — ${formatCurrency(orderTotal)}`,
      })
    } catch (err) {
      toast.error("Transaction failed", {
        description: err instanceof Error ? err.message : "Something went wrong",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  function handleOpenChange(value: boolean) {
    if (!isProcessing) {
      if (!value) {
        setCashTendered("")
        setSplitCash("")
        setSplitCard("")
      }
      onOpenChange(value)
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isProcessing}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Confirm Payment
          </DialogTitle>
        </DialogHeader>

        {/* Order Summary */}
        <div className="space-y-1 rounded-lg bg-muted/50 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </span>
            <span className="font-medium capitalize">{paymentMethod}</span>
          </div>
          <Separator className="my-2" />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(orderSubtotal)}</span>
            </div>
            {orderDiscount > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Discount</span>
                <span>−{formatCurrency(orderDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Tax ({Math.round(taxRate * 10000) / 100}%)
              </span>
              <span>{formatCurrency(orderTax)}</span>
            </div>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(orderTotal)}</span>
          </div>
        </div>

        {/* Cash payment */}
        {paymentMethod === "cash" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cash-tendered">Amount Tendered</Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-muted-foreground">
                  {currencySymbol}
                </span>
                <Input
                  id="cash-tendered"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="pl-6"
                  autoFocus
                />
              </div>
            </div>

            {cashTenderedNum > 0 && (
              <div
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${
                  change >= 0
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                <span>{change >= 0 ? "Change" : "Insufficient"}</span>
                <span>
                  {change >= 0
                    ? formatCurrency(change)
                    : `${formatCurrency(Math.abs(change))} short`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Card payment */}
        {paymentMethod === "card" && (
          <div className="rounded-lg bg-muted/50 p-3 text-center text-sm text-muted-foreground">
            Card terminal ready. Please swipe, tap, or insert card to proceed.
          </div>
        )}

        {/* Split payment */}
        {paymentMethod === "split" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="split-cash">Cash Amount</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-muted-foreground">
                    {currencySymbol}
                  </span>
                  <Input
                    id="split-cash"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={splitCash}
                    onChange={(e) => setSplitCash(e.target.value)}
                    className="pl-6"
                    autoFocus
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="split-card">Card Amount</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-muted-foreground">
                    {currencySymbol}
                  </span>
                  <Input
                    id="split-card"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={splitCard}
                    onChange={(e) => setSplitCard(e.target.value)}
                    className="pl-6"
                  />
                </div>
              </div>
            </div>

            <div
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${
                Math.abs(splitRemaining) < 0.01
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : splitRemaining > 0
                  ? "bg-muted text-muted-foreground"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              <span>
                {Math.abs(splitRemaining) < 0.01
                  ? "Balanced"
                  : splitRemaining > 0
                  ? "Remaining"
                  : "Over by"}
              </span>
              <span>
                {Math.abs(splitRemaining) < 0.01
                  ? "Ready to process"
                  : formatCurrency(Math.abs(splitRemaining))}
              </span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm || isProcessing}
            className="min-w-[120px]"
          >
            {isProcessing ? "Processing…" : "Confirm Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {receiptData && (
      <ReceiptDialog
        open={receiptOpen}
        onOpenChange={(val) => {
          setReceiptOpen(val)
          if (!val) setReceiptData(null)
        }}
        data={receiptData}
      />
    )}
  </>
  )
}
