import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createActor } from "../backend";

export interface CancelOrderPayload {
  orderId: string;
  reason: string;
}

export function useCancelOrder() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation<string, Error, CancelOrderPayload>({
    mutationFn: async ({ orderId, reason }) => {
      if (!actor) throw new Error("Not connected");
      return actor.cancelOrder(orderId, reason);
    },
    onSuccess: (_data, variables) => {
      toast.success("Order cancelled successfully.");
      void queryClient.invalidateQueries({ queryKey: ["myOrders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", variables.orderId],
      });
    },
    onError: (err) => {
      toast.error("Could not cancel order.", { description: err.message });
    },
  });
}
