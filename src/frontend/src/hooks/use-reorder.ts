import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createActor } from "../backend";
import type { OrderItem } from "../backend.d";
import { useCartStore } from "../store/cart";
import type { CartAddOn } from "../store/cart";

export function useReorder() {
  const { actor } = useActor(createActor);
  const addToCart = useCartStore((s) => s.addToCart);
  const clearCart = useCartStore((s) => s.clearCart);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.getOrderForReorder(orderId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (items: OrderItem[]) => {
      clearCart();
      for (const item of items) {
        const addOns: CartAddOn[] = item.addOns.map((name, idx) => ({
          id: `reorder-addon-${idx}`,
          name,
          price: 0,
        }));
        addToCart({
          productId: item.productId,
          name: item.productName,
          imageUrl: item.imageUrl,
          size: item.size,
          crust: item.crust,
          addOns,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice) / 100,
          totalPrice: (Number(item.unitPrice) / 100) * Number(item.quantity),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Items added to cart!", {
        description: `${items.length} item(s) ready for reorder.`,
      });
    },
    onError: (err: Error) => {
      toast.error("Reorder failed", { description: err.message });
    },
  });
}
