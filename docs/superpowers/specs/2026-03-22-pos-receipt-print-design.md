# POS Receipt Printing — Design Spec

**Date:** 2026-03-22
**Status:** Approved

---

## Overview

After a cashier confirms payment at the POS, a thermal-style receipt automatically triggers `window.print()`. No extra clicks required. The receipt renders into `document.body` via a React portal; `@media print` CSS ensures only the receipt is visible when printing. This works with 80mm thermal POS printers and regular printers alike.

---

## Approach

**Portal + `window.print()` + CSS `@media print`** (no new dependencies)

- After `createTransaction` resolves successfully, receipt data is assembled from existing in-scope state (cart, user profile, currency context) plus the returned transaction ID.
- A `<ReceiptPrint>` component portals a `<div id="pos-receipt">` into `document.body`.
- A `useEffect` watching the receipt data calls `window.print()`.
- `@media print` hides all body children except `#pos-receipt`; in normal view `#pos-receipt` is `display: none`.

---

## Files Changed

### 1. `lib/actions/transactions.ts`

**Change:** `createTransaction` return type changes from `Promise<void>` to `Promise<{ id: string }>`.

The final `.select('id').single()` already fetches the transaction ID. Return it:

```ts
export async function createTransaction(params: { ... }): Promise<{ id: string }> {
  // ... existing logic unchanged ...
  return { id: transaction.id }
}
```

No other logic changes.

---

### 2. `app/globals.css`

**Add** at the end of the file:

```css
/* Receipt print */
#pos-receipt {
  display: none;
}

@media print {
  body > *:not(#pos-receipt) {
    display: none !important;
  }
  #pos-receipt {
    display: block !important;
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    color: #000;
    background: #fff;
    width: 100%;
    max-width: 300px;
    margin: 0 auto;
    padding: 8px 0;
  }
}
```

---

### 3. `components/pos/receipt-print.tsx` (new file)

A `'use client'` component. Renders via `createPortal` into `document.body`.

**`ReceiptData` interface:**

```ts
export interface ReceiptData {
  transactionId: string        // full UUID — display short (first 8 chars)
  timestamp: Date
  branchName: string
  branchAddress: string | null
  branchPhone: string | null
  cashierName: string
  items: Array<{
    name: string
    qty: number
    unitPrice: number
    discountAmount: number     // per-item discount (already applied to unit_price * qty)
    lineTotal: number          // unit_price * qty - discountAmount
  }>
  subtotal: number
  discountAmount: number       // order-level discount
  taxAmount: number
  taxRate: number              // e.g. 0.12 → display as "12%"
  total: number
  paymentMethod: 'cash' | 'card' | 'split'
  cashTendered?: number        // only for cash
  change?: number              // only for cash (cashTendered - total)
  splitCash?: number           // only for split
  splitCard?: number           // only for split
  formatCurrency: (n: number) => string
}
```

**Receipt layout (thermal, ~42 chars wide, monospace):**

```
========================================
           BRANCH NAME HERE
      123 Main Street, Downtown
          +1-555-0100
========================================
Date: 2026-03-22       Time: 14:30:05
Receipt #: ABCD1234
Cashier: John Doe
----------------------------------------
Item Name              Qty    Total
----------------------------------------
Widget A x2             2    20.00
  (Discount: -2.00)
Widget B                1     5.00
----------------------------------------
Subtotal:                     23.00
Discount:                     -2.00
Tax (12%):                     2.52
----------------------------------------
TOTAL:                        23.52
========================================
Payment: Cash
Tendered:                     30.00
Change:                        6.48
========================================
      Thank you for your purchase!
========================================
```

**Rules:**
- All text is black on white, monospace
- `=` rows are section dividers, `-` rows are sub-dividers
- Item name is truncated to fit within the ~28-char name column if needed
- Per-item discounts shown as indented line only when `discountAmount > 0`
- Order-level discount row shown only when `discountAmount > 0`
- Change row shown only for cash payments
- Split breakdown shows two rows: `Cash: X.XX` and `Card: X.XX`
- Timestamp formatted as local date + time using `toLocaleDateString` / `toLocaleTimeString`
- Transaction ID displayed as uppercase first 8 chars of UUID

**SSR guard:** Component returns `null` during SSR (`typeof document === 'undefined'`).

---

### 4. `components/pos/payment-dialog.tsx`

**Changes:**

1. Import `useUserProfile` and `ReceiptPrint` / `ReceiptData`.
2. Add state: `const [receiptData, setReceiptData] = React.useState<ReceiptData | null>(null)`.
3. Add `useEffect` that calls `window.print()` when `receiptData` is set:
   ```ts
   React.useEffect(() => {
     if (receiptData) window.print()
   }, [receiptData])
   ```
4. In `handleConfirm`, after `createTransaction` resolves, build and set receipt data before calling `clearCart()`:
   ```ts
   const result = await createTransaction({ ... })
   setReceiptData({
     transactionId: result.id,
     timestamp: new Date(),
     branchName: branch?.name ?? 'Store',
     branchAddress: branch?.address ?? null,
     branchPhone: branch?.phone ?? null,
     cashierName: profile?.full_name ?? 'Cashier',
     items: items.map(i => ({
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
     cashTendered: paymentMethod === 'cash' ? cashTenderedNum : undefined,
     change: paymentMethod === 'cash' ? change : undefined,
     splitCash: paymentMethod === 'split' ? splitCashNum : undefined,
     splitCard: paymentMethod === 'split' ? splitCardNum : undefined,
     formatCurrency,
   })
   clearCart()
   onOpenChange(false)
   // ... reset input state, show toast
   ```
5. Render at bottom of dialog return: `{receiptData && <ReceiptPrint data={receiptData} />}`
6. Clear `receiptData` when dialog closes (in `handleOpenChange`) to avoid stale receipt on next transaction.

---

## Data Sources (no extra fetches)

| Receipt Field | Source |
|---|---|
| Branch name, address, phone | `useUserProfile().branch` |
| Cashier name | `useUserProfile().profile.full_name` |
| Transaction ID | returned from `createTransaction` |
| Timestamp | `new Date()` at time of confirmation |
| Items, totals | cart store state already in `PaymentDialog` |
| Currency formatter | `useCurrency().formatCurrency` |
| Tax rate | `useCurrency().taxRate` |

---

## Out of Scope

- Email / SMS receipt delivery
- PDF download
- Receipt logo/image
- Org name in header (branch name is sufficient; org name not in any client context)
- Configurable receipt footer message
- Receipt numbering (sequential) — UUID short ID is sufficient

---

## Testing Notes

- Verify `window.print()` fires after a completed transaction (not on cancel or error)
- Verify the portal is removed / data is cleared on dialog close so next transaction starts fresh
- Verify cash change and split breakdown render correctly per payment method
- Print preview in Chrome/Safari should show only the receipt with no app chrome
