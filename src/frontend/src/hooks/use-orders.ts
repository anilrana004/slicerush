import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createActor } from "../backend";
import type { OrderItem, OrderOut, OrderStatus } from "../backend.d";
import { useCartStore } from "../store/cart";

export type { OrderOut, OrderItem, OrderStatus };

export function useOrder(id: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<OrderOut | null>({
    queryKey: ["order", id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getOrder(id);
    },
    enabled: !!actor && !isFetching && !!id,
    refetchInterval: 8000,
    staleTime: 4000,
  });
}

export function useMyOrders() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<OrderOut[]>({
    queryKey: ["myOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyOrders();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000,
    staleTime: 8000,
  });
}

export interface PlaceOrderPayload {
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  couponCode: string | null;
  deliveryAddress: string;
}

export function usePlaceOrder() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const cartItems = useCartStore((s) => s.items);

  return useMutation<OrderOut, Error, PlaceOrderPayload>({
    mutationFn: async (payload) => {
      if (!actor) throw new Error("Not connected");
      const backendItems: OrderItem[] = cartItems.map((item) => ({
        productId: item.productId,
        productName: item.name,
        imageUrl: item.imageUrl,
        size: item.size,
        crust: item.crust,
        addOns: item.addOns.map((a) => a.name),
        quantity: BigInt(item.quantity),
        unitPrice: BigInt(Math.round(item.unitPrice * 100)),
        totalPrice: BigInt(Math.round(item.totalPrice * 100)),
      }));
      return actor.placeOrder(
        backendItems,
        BigInt(Math.round(payload.subtotal * 100)),
        BigInt(Math.round(payload.deliveryFee * 100)),
        BigInt(Math.round(payload.discountAmount * 100)),
        BigInt(Math.round(payload.total * 100)),
        payload.couponCode,
        payload.deliveryAddress,
        BigInt(30), // estimated delivery minutes
      );
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["myOrders"] });
      queryClient.setQueryData(["order", order.id], order);
      useCartStore.getState().clearCart();
    },
    onError: (err) => {
      toast.error("Failed to place order", { description: err.message });
    },
  });
}
