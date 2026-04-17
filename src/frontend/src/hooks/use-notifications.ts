import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createActor } from "../backend";
import type { NotificationPublic } from "../backend.d";
import { useNotificationStore } from "../store/notifications";
import type { Notification } from "../types";

function mapNotification(n: NotificationPublic): Notification {
  return {
    id: n.id,
    userId: n.userId.toString(),
    notifType: n.notifType as string,
    title: n.title,
    message: n.message,
    orderId: n.orderId ?? null,
    read: n.read,
    createdAt: n.createdAt,
  };
}

export function useNotifications() {
  const { actor, isFetching } = useActor(createActor);
  const setNotifications = useNotificationStore((s) => s.setNotifications);

  return useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!actor) return [];
      const raw = await actor.getMyNotifications();
      const mapped = raw.map(mapNotification);
      setNotifications(mapped);
      return mapped;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

export function useUnreadCount() {
  const { actor, isFetching } = useActor(createActor);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  return useQuery<number>({
    queryKey: ["notifUnreadCount"],
    queryFn: async () => {
      if (!actor) return 0;
      const count = await actor.getUnreadCount();
      const num = Number(count);
      setUnreadCount(num);
      return num;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

export function useMarkRead() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const markRead = useNotificationStore((s) => s.markRead);

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.markNotificationRead(id);
      if (result.__kind__ === "err") throw new Error(result.err);
      return id;
    },
    onSuccess: (id) => {
      markRead(id);
      queryClient.invalidateQueries({ queryKey: ["notifUnreadCount"] });
    },
  });
}

export function useMarkAllRead() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.markAllNotificationsRead();
    },
    onSuccess: () => {
      markAllRead();
      queryClient.invalidateQueries({ queryKey: ["notifUnreadCount"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
    onError: (err: Error) => {
      toast.error("Failed to mark all read", { description: err.message });
    },
  });
}
