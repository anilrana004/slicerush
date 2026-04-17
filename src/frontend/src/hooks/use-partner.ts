import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { OrderStatus, createActor } from "../backend";

export { OrderStatus };

export function usePartnerStats() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["partnerStats"],
    queryFn: async () => {
      if (!actor)
        return { totalDelivered: 0n, activeOrders: 0n, todayDeliveries: 0n };
      return actor.getPartnerStats();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000,
    staleTime: 8000,
  });
}

export function useAvailableOrders() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["availableOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAvailableOrders();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
    staleTime: 5000,
  });
}

export function useMyAssignedOrders() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["myAssignedOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyAssignedOrders();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 8000,
    staleTime: 4000,
  });
}

export function useAcceptOrder() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<boolean, Error, string>({
    mutationFn: async (orderId) => {
      if (!actor) throw new Error("Not connected");
      return actor.acceptOrder(orderId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["availableOrders"] });
      qc.invalidateQueries({ queryKey: ["myAssignedOrders"] });
      qc.invalidateQueries({ queryKey: ["partnerStats"] });
      toast.success("Order accepted! Get ready to deliver.");
    },
    onError: (err) => {
      toast.error("Failed to accept order", { description: err.message });
    },
  });
}

export function useRejectOrder() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<boolean, Error, string>({
    mutationFn: async (orderId) => {
      if (!actor) throw new Error("Not connected");
      return actor.rejectOrder(orderId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myAssignedOrders"] });
      qc.invalidateQueries({ queryKey: ["partnerStats"] });
      toast.success("Order rejected.");
    },
    onError: (err) => {
      toast.error("Failed to reject order", { description: err.message });
    },
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<boolean, Error, { orderId: string; status: OrderStatus }>({
    mutationFn: async ({ orderId, status }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateOrderStatus(orderId, status);
    },
    onSuccess: (_data, { orderId }) => {
      qc.invalidateQueries({ queryKey: ["myAssignedOrders"] });
      qc.invalidateQueries({ queryKey: ["partnerStats"] });
      qc.invalidateQueries({ queryKey: ["partnerOrder", orderId] });
      toast.success("Order status updated.");
    },
    onError: (err) => {
      toast.error("Failed to update status", { description: err.message });
    },
  });
}

export function useUpdateDeliveryLocation() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation<
    boolean,
    Error,
    { orderId: string; lat: number; lng: number }
  >({
    mutationFn: async ({ orderId, lat, lng }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateDeliveryLocation(orderId, lat, lng);
    },
    onSuccess: (_data, { orderId }) => {
      qc.invalidateQueries({ queryKey: ["partnerOrder", orderId] });
      toast.success("Location updated successfully.");
    },
    onError: (err) => {
      toast.error("Failed to update location", { description: err.message });
    },
  });
}

export function usePartnerOrder(id: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["partnerOrder", id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getOrder(id);
    },
    enabled: !!actor && !isFetching && !!id,
    refetchInterval: 10000,
    staleTime: 5000,
  });
}
