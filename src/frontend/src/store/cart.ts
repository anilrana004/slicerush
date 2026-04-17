import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartAddOn {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string; // unique per line (productId + size + crust + sorted addOnIds)
  productId: string;
  name: string;
  imageUrl: string;
  size: string;
  crust: string;
  addOns: CartAddOn[];
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface AppliedCoupon {
  code: string;
  discountAmount: number;
  type: string;
}

interface CartStore {
  items: CartItem[];
  selectedAddressId: string | null;
  deliveryFee: number;
  appliedCoupon: AppliedCoupon | null;

  addToCart: (item: Omit<CartItem, "id">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  setSelectedAddress: (id: string | null) => void;
  setDeliveryFee: (fee: number) => void;
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void;
}

function buildLineId(
  productId: string,
  size: string,
  crust: string,
  addOns: CartAddOn[],
): string {
  const addOnKey = addOns
    .map((a) => a.id)
    .sort()
    .join("+");
  return `${productId}|${size}|${crust}|${addOnKey}`;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      selectedAddressId: null,
      deliveryFee: 0,
      appliedCoupon: null,

      addToCart: (item) => {
        const id = buildLineId(
          item.productId,
          item.size,
          item.crust,
          item.addOns,
        );
        set((state) => {
          const existing = state.items.find((i) => i.id === id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === id
                  ? {
                      ...i,
                      quantity: i.quantity + item.quantity,
                      totalPrice: i.unitPrice * (i.quantity + item.quantity),
                    }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, id }] };
        });
      },

      removeFromCart: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQuantity: (id, quantity) => {
        if (quantity < 1) {
          get().removeFromCart(id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id
              ? { ...i, quantity, totalPrice: i.unitPrice * quantity }
              : i,
          ),
        }));
      },

      clearCart: () => set({ items: [], appliedCoupon: null, deliveryFee: 0 }),

      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce((sum, i) => sum + i.totalPrice, 0),

      setSelectedAddress: (id) => set({ selectedAddressId: id }),

      setDeliveryFee: (fee) => set({ deliveryFee: fee }),

      setAppliedCoupon: (coupon) => set({ appliedCoupon: coupon }),
    }),
    {
      name: "slicerush-cart",
    },
  ),
);
