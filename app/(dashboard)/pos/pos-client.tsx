"use client"

import * as React from "react"
import {
  Search,
  Trash2,
  X,
  Plus,
  Minus,
  Percent,
  CreditCard,
  Banknote,
  SplitSquareHorizontal,
  ShoppingCart,
  Package,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCartStore } from "@/lib/store/cart"
import { useCurrency } from "@/lib/context/currency"
import { PaymentDialog } from "@/components/pos/payment-dialog"
import { HoldOrderDialog } from "@/components/pos/hold-order-dialog"
import { HeldOrdersSheet } from "@/components/pos/held-orders-sheet"
import type { POSProduct } from "@/lib/actions/inventory"
import { cn } from "@/lib/utils"

type PaymentMethod = "cash" | "card" | "split"

type CategoryTab = { id: string; label: string }

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <Badge variant="destructive" className="text-[10px]">
        Out of stock
      </Badge>
    )
  }
  if (stock <= 10) {
    return (
      <Badge className="border-transparent bg-yellow-500/15 text-[10px] text-yellow-600 dark:bg-yellow-400/15 dark:text-yellow-400">
        Low: {stock}
      </Badge>
    )
  }
  return (
    <Badge className="border-transparent bg-green-500/15 text-[10px] text-green-600 dark:bg-green-400/15 dark:text-green-400">
      In stock
    </Badge>
  )
}

function buildCategoryTabs(products: POSProduct[]): CategoryTab[] {
  const seen = new Set<string>()
  const tabs: CategoryTab[] = [{ id: "all", label: "All" }]
  for (const p of products) {
    if (p.category_id && p.category_name && !seen.has(p.category_id)) {
      seen.add(p.category_id)
      tabs.push({ id: p.category_id, label: p.category_name })
    }
  }
  return tabs
}

export function POSClient({ initialProducts }: { initialProducts: POSProduct[] }) {
  const { formatCurrency, taxRate } = useCurrency()

  const {
    items,
    discount,
    addItem,
    removeItem,
    updateQuantity,
    setDiscount,
    clearCart,
    subtotal,
    totalDiscount,
    tax,
    total,
  } = useCartStore()

  const categories = React.useMemo(() => buildCategoryTabs(initialProducts), [initialProducts])

  const [search, setSearch] = React.useState("")
  const [activeCategory, setActiveCategory] = React.useState("all")
  const tabsScrollRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)

  // Mobile cart drawer state
  const [cartOpen, setCartOpen] = React.useState(false)

  function updateScrollState() {
    const el = tabsScrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  React.useEffect(() => {
    updateScrollState()
  }, [categories])

  function scrollTabs(dir: "left" | "right") {
    const el = tabsScrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === "left" ? -160 : 160, behavior: "smooth" })
  }

  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("cash")
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false)
  const [holdDialogOpen, setHoldDialogOpen] = React.useState(false)
  const [discountInput, setDiscountInput] = React.useState("")

  React.useEffect(() => {
    setDiscountInput(discount > 0 ? String(discount) : "")
  }, [discount])

  const filteredProducts = React.useMemo(() => {
    let list = initialProducts
    if (activeCategory !== "all") {
      list = list.filter((p) => p.category_id === activeCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode ?? "").includes(q)
      )
    }
    return list
  }, [search, activeCategory, initialProducts])

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  function handleDiscountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setDiscountInput(val)
    const num = parseFloat(val)
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setDiscount(num)
    } else if (val === "" || val === "0") {
      setDiscount(0)
    }
  }

  function handleQuantityInput(
    productId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val)) updateQuantity(productId, val)
  }

  const paymentMethods: {
    value: PaymentMethod
    label: string
    icon: React.ReactNode
  }[] = [
    { value: "cash", label: "Cash", icon: <Banknote className="h-4 w-4" /> },
    { value: "card", label: "Card", icon: <CreditCard className="h-4 w-4" /> },
    {
      value: "split",
      label: "Split",
      icon: <SplitSquareHorizontal className="h-4 w-4" />,
    },
  ]

  // Shared cart panel content
  const cartPanel = (
    <div className="flex flex-col h-full">
      {/* Cart Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            Current Order
          </span>
          {itemCount > 0 && (
            <Badge className="h-5 min-w-5 justify-center px-1.5 text-xs">
              {itemCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={clearCart}
              aria-label="Clear cart"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {/* Close button — mobile only */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCartOpen(false)}
            aria-label="Close cart"
            className="lg:hidden text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Cart items */}
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
          <div>
            <p className="text-sm font-medium text-foreground">Cart is empty</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Click a product to add it
            </p>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-0 divide-y divide-border">
            {items.map((item) => {
              const itemTotal = item.unit_price * item.quantity - item.discount_amount
              return (
                <div key={item.product.id} className="flex flex-col gap-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex-1 text-sm font-medium leading-snug text-foreground">
                      {item.product.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeItem(item.product.id)}
                      aria-label={`Remove ${item.product.name}`}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => handleQuantityInput(item.product.id, e)}
                        className="h-6 w-12 px-1 text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(item.unit_price)} each
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(itemTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}

      {/* Totals + Payment section */}
      <div className="shrink-0 border-t border-border">
        {/* Totals */}
        <div className="space-y-2 px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(subtotal())}</span>
          </div>

          {/* Discount row */}
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="shrink-0 text-muted-foreground">Discount</span>
            <div className="flex items-center gap-1.5">
              <div className="relative w-20">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  placeholder="0"
                  value={discountInput}
                  onChange={handleDiscountChange}
                  className="h-6 pr-6 text-right text-sm"
                />
                <Percent className="pointer-events-none absolute inset-y-0 right-1.5 my-auto h-3 w-3 text-muted-foreground" />
              </div>
              {totalDiscount() > 0 && (
                <span className="text-destructive">
                  −{formatCurrency(totalDiscount())}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Tax ({Math.round(taxRate * 10000) / 100}%)
            </span>
            <span>{formatCurrency(tax())}</span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-base font-semibold">Total</span>
            <span className="text-xl font-bold text-foreground">
              {formatCurrency(total())}
            </span>
          </div>
        </div>

        {/* Payment method selector */}
        <div className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-1.5">
            {paymentMethods.map((method) => (
              <button
                key={method.value}
                onClick={() => setPaymentMethod(method.value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium transition-all",
                  paymentMethod === method.value
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-ring/50 hover:bg-muted hover:text-foreground"
                )}
              >
                {method.icon}
                {method.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 px-4 pb-4">
          <Button
            size="lg"
            className="h-10 w-full text-sm font-semibold"
            disabled={items.length === 0}
            onClick={() => {
              setPaymentDialogOpen(true)
              setCartOpen(false)
            }}
          >
            Process Payment
          </Button>
          <Button
            variant="outline"
            className="w-full text-sm"
            disabled={items.length === 0}
            onClick={() => {
              setHoldDialogOpen(true)
              setCartOpen(false)
            }}
          >
            Hold Order
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className="flex h-[calc(100dvh-3.5rem)] overflow-hidden">
        {/* LEFT PANEL: Products */}
        <div className="flex flex-1 flex-col overflow-hidden border-r border-border">
          {/* Search bar */}
          <div className="shrink-0 border-b border-border p-3 sm:p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute inset-y-0 left-2.5 my-auto h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products or scan barcode…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <HeldOrdersSheet />
            </div>
          </div>

          {/* Category tabs */}
          <div className="relative shrink-0 border-b border-border">
            {canScrollLeft && (
              <button
                onClick={() => scrollTabs("left")}
                className="absolute left-0 top-0 z-10 flex h-full items-center bg-gradient-to-r from-background via-background/90 to-transparent pl-1 pr-4"
              >
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            {canScrollRight && (
              <button
                onClick={() => scrollTabs("right")}
                className="absolute right-0 top-0 z-10 flex h-full items-center bg-gradient-to-l from-background via-background/90 to-transparent pl-4 pr-1"
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <div
                ref={tabsScrollRef}
                onScroll={updateScrollState}
                className="overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <TabsList
                  variant="line"
                  className="w-max justify-start gap-0 rounded-none bg-transparent p-0"
                >
                  {categories.map((cat) => (
                    <TabsTrigger key={cat.id} value={cat.id} className="shrink-0 px-3">
                      {cat.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          </div>

          {/* Product grid — adds bottom padding on mobile so FAB doesn't overlap */}
          <ScrollArea className="flex-1">
            <div className="p-3 pb-24 sm:p-4 sm:pb-24 lg:pb-4">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                  <Package className="h-10 w-10 text-muted-foreground/40" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      No products found
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Try a different search or category
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => product.stock > 0 && addItem(product)}
                      disabled={product.stock === 0}
                      className={cn(
                        "group relative flex flex-col gap-2 rounded-xl border border-border bg-card p-3 text-left shadow-xs transition-all",
                        product.stock > 0
                          ? "cursor-pointer hover:border-ring/50 hover:shadow-sm active:scale-[0.98]"
                          : "cursor-not-allowed opacity-60"
                      )}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                          {product.name}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {product.sku}
                      </span>
                      <div className="mt-auto flex items-end justify-between">
                        <span className="text-base font-semibold text-foreground">
                          {formatCurrency(product.selling_price)}
                        </span>
                        <StockBadge stock={product.stock} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* RIGHT PANEL: Cart — desktop sidebar */}
        <div className="hidden lg:flex lg:w-96 lg:shrink-0 lg:flex-col bg-card">
          {cartPanel}
        </div>
      </div>

      {/* ── Mobile cart bottom sheet ───────────────────────────────────────────── */}

      {/* Backdrop */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setCartOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex flex-col bg-card shadow-2xl lg:hidden",
          "rounded-t-2xl border-t border-border",
          "transition-transform duration-300 ease-in-out",
          "h-[85dvh]",
          cartOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Drag handle */}
        <div className="flex shrink-0 justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
        {cartPanel}
      </div>

      {/* Mobile FAB — view cart button */}
      <div className="fixed bottom-0 inset-x-0 z-30 lg:hidden">
        <div className="border-t border-border bg-background/95 backdrop-blur px-4 py-3 safe-area-pb">
          <button
            onClick={() => setCartOpen(true)}
            className={cn(
              "flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all",
              itemCount > 0
                ? "bg-primary text-primary-foreground shadow-md active:scale-[0.98]"
                : "bg-muted text-muted-foreground cursor-default"
            )}
            disabled={itemCount === 0}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              {itemCount > 0 ? (
                <span>
                  View Cart
                  <span className="ml-1.5 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-xs">
                    {itemCount}
                  </span>
                </span>
              ) : (
                <span>Cart is empty</span>
              )}
            </div>
            {itemCount > 0 && (
              <div className="flex items-center gap-1.5">
                <span>{formatCurrency(total())}</span>
                <ChevronUp className="h-4 w-4 opacity-70" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Dialogs */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        paymentMethod={paymentMethod}
      />
      <HoldOrderDialog
        open={holdDialogOpen}
        onOpenChange={setHoldDialogOpen}
      />
    </>
  )
}
