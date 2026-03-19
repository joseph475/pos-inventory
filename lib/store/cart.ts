import { create } from "zustand";
import type { Product } from "@/types/database";

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount_amount: number;
}

interface CartStore {
  items: CartItem[];
  discount: number; // overall discount percentage
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemDiscount: (productId: string, discount: number) => void;
  setDiscount: (discount: number) => void;
  clearCart: () => void;
  loadHeldOrder: (heldItems: Array<{ product_id: string; product_name: string; quantity: number; unit_price: number; discount_amount: number }>) => void;
  // Computed
  subtotal: () => number;
  totalDiscount: () => number;
  tax: () => number;
  total: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  discount: 0,

  addItem: (product) => {
    const items = get().items;
    const existing = items.find((i) => i.product.id === product.id);
    if (existing) {
      set({
        items: items.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      });
    } else {
      set({
        items: [
          ...items,
          {
            product,
            quantity: 1,
            unit_price: product.selling_price,
            discount_amount: 0,
          },
        ],
      });
    }
  },

  removeItem: (productId) =>
    set({ items: get().items.filter((i) => i.product.id !== productId) }),

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      ),
    });
  },

  updateItemDiscount: (productId, discount) =>
    set({
      items: get().items.map((i) =>
        i.product.id === productId ? { ...i, discount_amount: discount } : i
      ),
    }),

  setDiscount: (discount) => set({ discount }),

  clearCart: () => set({ items: [], discount: 0 }),

  loadHeldOrder: (heldItems) =>
    set({
      discount: 0,
      items: heldItems.map((item) => ({
        product: { id: item.product_id, name: item.product_name } as Product,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount,
      })),
    }),

  subtotal: () =>
    get().items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0),

  totalDiscount: () => {
    const itemDiscounts = get().items.reduce(
      (sum, i) => sum + i.discount_amount,
      0
    );
    const overallDiscount = get().subtotal() * (get().discount / 100);
    return itemDiscounts + overallDiscount;
  },

  tax: () => (get().subtotal() - get().totalDiscount()) * 0.12, // 12% tax

  total: () => get().subtotal() - get().totalDiscount() + get().tax(),
}));
