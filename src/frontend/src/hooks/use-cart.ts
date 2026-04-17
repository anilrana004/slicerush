import { useCartStore } from "@/store/cart";
import type { CartAddOn } from "@/store/cart";
import { toast } from "sonner";

export interface AddToCartPayload {
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

export function useCart() {
  const {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
  } = useCartStore();

  const handleAddToCart = (payload: AddToCartPayload) => {
    addToCart(payload);
    toast.success(`${payload.name} added to cart!`, {
      description: `${payload.size} · ${payload.crust}${payload.addOns.length > 0 ? ` · ${payload.addOns.map((a) => a.name).join(", ")}` : ""}`,
      duration: 3000,
    });
  };

  return {
    items,
    addToCart: handleAddToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems: getTotalItems(),
    totalPrice: getTotalPrice(),
  };
}
