# Inventory POS — Claude Project Context

## What This Is
A multi-branch inventory and point-of-sale system. Businesses can manage products, stock, purchases, and sales across multiple branches. Users have role-based access (super_admin, manager, cashier).

## Tech Stack
- **Framework**: Next.js 16 (App Router), React 19
- **Auth**: Clerk (`@clerk/nextjs` v7) — `proxy.ts` handles auth middleware
- **Database**: Supabase (Postgres) via `@supabase/supabase-js` — always use the **service role admin client** (bypasses RLS)
- **UI**: shadcn/ui components built on **Base UI** (`@base-ui/react` v1.3), NOT Radix UI
- **Styling**: Tailwind CSS v4
- **Forms**: React Hook Form + Zod v4 (`zod/v4`)
- **State**: Zustand (cart store at `lib/store/cart.ts`)
- **Charts**: Recharts
- **Toasts**: Sonner

## Project Structure
```
app/
  (dashboard)/          # All authenticated pages
    pos/                # Point of sale
    inventory/
      products/         # Product catalog
      stock/            # Stock levels
      transfers/        # Branch-to-branch stock transfers
      adjustments/      # Manual stock adjustments
    purchasing/
      orders/           # Purchase orders
      suppliers/        # Supplier management
    reports/sales/      # Sales reports
    settings/
      branches/         # Branch management
      categories/       # Product categories
      users/            # User management
      organization/     # Org settings
  api/                  # Route handlers (webhooks etc.)
components/
  ui/                   # shadcn/ui component wrappers
  pos/                  # POS-specific components
  layout/               # Sidebar, nav
lib/
  actions/              # Server actions ('use server')
  store/                # Zustand stores
  supabase/             # Supabase client helpers
  utils/                # Shared utilities
types/
  database.ts           # Full DB type definitions
supabase/migrations/    # SQL migration files
```

## Loading Skeletons
Every route has a `loading.tsx` file — Next.js wraps it in Suspense automatically, giving instant visual feedback while server data loads. Do not remove these. When adding a new route, always create a matching `loading.tsx` with a skeleton that mirrors the page's visual structure.

Existing `loading.tsx` files:
- `app/(dashboard)/dashboard/loading.tsx`
- `app/(dashboard)/pos/loading.tsx`
- `app/(dashboard)/inventory/products/loading.tsx`
- `app/(dashboard)/inventory/stock/loading.tsx`
- `app/(dashboard)/inventory/adjustments/loading.tsx`
- `app/(dashboard)/inventory/transfers/loading.tsx`
- `app/(dashboard)/purchasing/orders/loading.tsx`
- `app/(dashboard)/purchasing/suppliers/loading.tsx`
- `app/(dashboard)/settings/branches/loading.tsx`
- `app/(dashboard)/settings/users/loading.tsx`
- `app/(dashboard)/settings/categories/loading.tsx`
- `app/(dashboard)/settings/organization/loading.tsx`
- `app/(dashboard)/reports/sales/loading.tsx`

All skeletons import `Skeleton` from `@/components/ui/skeleton`.

## Database
Single-org setup. All tables have `org_id` that references `'00000000-0000-0000-0000-000000000001'` (hardcoded constant `ORG_ID` in server actions).

Key tables: `organizations`, `branches`, `profiles`, `categories`, `products`, `inventory`, `inventory_movements`, `transactions`, `transaction_items`, `stock_transfers`, `stock_transfer_items`, `purchase_orders`, `purchase_order_items`, `suppliers`

The `profiles` table links Clerk users (`clerk_user_id`) to roles and branches. Roles: `super_admin`, `manager`, `cashier`.

**Important**: The `Database` type in `types/database.ts` has empty `Relationships: []` for all tables. Supabase join queries (e.g. `.select('*, transaction_items(...)')`) return `never` type — always cast with `as any[]` and re-type manually.

## Server Actions Pattern
All DB writes go through `lib/actions/*.ts` files marked `'use server'`.

```ts
// Standard pattern for every server action file
function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function someAction(params) {
  const { userId } = await auth()  // Clerk auth check
  if (!userId) throw new Error('Unauthorized')
  const supabase = getAdminClient()
  // ... do work ...
  revalidatePath('/some/path')
}
```

## Client Components Pattern
Pages are server components that fetch data and pass it to `*-client.tsx` client components.

```ts
// Standard client mutation pattern
const router = useRouter()
const [isPending, startTransition] = useTransition()

function handleSave(values) {
  startTransition(async () => {
    await someServerAction(values)
    router.refresh()  // Re-fetches server component data
  })
}
```

## Base UI Gotchas (CRITICAL)
This project uses `@base-ui/react`, NOT Radix UI. Key differences:

1. **DropdownMenu items use `onClick`, NOT `onSelect`**
   ```tsx
   <DropdownMenuItem onClick={() => doSomething()}>Edit</DropdownMenuItem>
   ```

2. **SelectValue needs explicit children for display label** — it does NOT auto-reflect `SelectItem` text
   ```tsx
   <SelectValue placeholder="Select category">
     {categories.find(c => c.id === watch('category_id'))?.name ?? 'Select category'}
   </SelectValue>
   ```

3. **SheetTrigger with a Button child** — use `render` prop + `nativeButton={true}` to avoid nested-button warning
   ```tsx
   <SheetTrigger render={<Button />} nativeButton={true}>
     Button Label
   </SheetTrigger>
   ```
   Or wrap children in SheetTrigger using `render`:
   ```tsx
   <SheetTrigger render={<Button />}>
     <Plus className="h-4 w-4" />
     Open Sheet
   </SheetTrigger>
   ```

4. **Controlled Sheets/Dialogs** — always make them controlled when you need to close them programmatically after a save:
   ```tsx
   const [open, setOpen] = React.useState(false)
   // In onSubmit: setOpen(false)
   ```

5. **Zod import** — use `import { z } from 'zod/v4'` (not `'zod'`)

## Supabase Join Disambiguation
When a table has multiple FK columns pointing to the same table, Supabase requires explicit FK disambiguation:
```ts
// WRONG — ambiguous, returns null
.select('profiles(full_name)')

// CORRECT — specify which FK
.select('creator:profiles!created_by(full_name)')
```

## Role-Based Access
- `cashier`: POS only, cannot approve transfers, cannot access settings
- `manager`: All operations except user/branch management
- `super_admin`: Full access

Role checks should be done **server-side** in server actions (throw error) AND **client-side** (hide UI). Get role from the `profiles` table via `clerk_user_id`.

## Cart Store (`lib/store/cart.ts`)
Zustand store for POS cart. Key methods:
- `addItem(product)` — adds or increments
- `loadHeldOrder(items)` — restores a held transaction into the cart
- `subtotal()`, `totalDiscount()`, `tax()`, `total()` — computed values (call as functions)
- Cart `discount` is a percentage (0–100); `totalDiscount()` includes both per-item and overall discounts

## UserProfileProvider
`lib/context/user-profile.tsx` — provides `useUserProfile()` hook with `{ profile, branch, loading, refetch }`.

**SSR-seeded (no client fetch on page load):** `app/(dashboard)/layout.tsx` fetches the full profile via `ensureProfile()` (selects `"*, branches(*)"`) and passes it to the provider:
```tsx
<UserProfileProvider initialProfile={profile?.profile ?? null} initialBranch={profile?.branch ?? null}>
```
When `initialProfile` is provided, the client-side `getMyProfile()` fetch is skipped. `refetch()` still works for post-update scenarios (e.g. after saving profile changes).

`ensureProfile()` returns `{ profile: Profile, branch: Branch | null } | null`. The `branches` join result is split out from the profile row before returning.

## Key Files Reference
| File | Purpose |
|------|---------|
| `lib/actions/transactions.ts` | POS sale + hold transactions, inventory deduction |
| `lib/actions/products.ts` | Product CRUD |
| `lib/actions/categories.ts` | Category CRUD |
| `lib/actions/transfers.ts` | Stock transfer create + status updates |
| `lib/actions/inventory.ts` | Stock adjustments, `getPOSProducts` |
| `lib/actions/purchasing.ts` | Purchase orders |
| `lib/actions/users.ts` | User profile management |
| `lib/context/user-profile.tsx` | `useUserProfile()` hook — SSR-seeded profile + branch, no client fetch on load |
| `types/database.ts` | All DB row types + convenience exports |
| `components/pos/payment-dialog.tsx` | POS payment confirmation → calls `createTransaction` |
| `components/pos/hold-order-dialog.tsx` | Hold order → calls `createHeldTransaction` |
| `components/pos/held-orders-sheet.tsx` | Resume/delete held orders from DB |

## Commands
```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Production build
npm run lint     # ESLint
```

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
```
