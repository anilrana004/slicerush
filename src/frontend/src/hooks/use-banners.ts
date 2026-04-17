import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createActor } from "../backend";
import type { PromoBannerPublic } from "../backend.d";
import type { PromoBanner } from "../types";

function mapBanner(b: PromoBannerPublic): PromoBanner {
  return {
    id: b.id,
    title: b.title,
    description: b.description,
    imageUrl: b.imageUrl,
    ctaText: b.ctaText,
    ctaLink: b.ctaLink,
    couponCode: b.couponCode ?? null,
    isActive: b.isActive,
    priority: Number(b.priority),
    createdAt: b.createdAt,
  };
}

export function useActiveBanners() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<PromoBanner[]>({
    queryKey: ["activeBanners"],
    queryFn: async () => {
      if (!actor) return [];
      const banners = await actor.getActiveBanners();
      return banners.map(mapBanner).sort((a, b) => b.priority - a.priority);
    },
    enabled: !!actor && !isFetching,
    staleTime: 60000,
  });
}

/**
 * Admin hook: returns all banners including inactive ones.
 * The backend only exposes getActiveBanners(), so we maintain a merged
 * list using React Query's cache. Inactive banners are preserved in
 * the "allBanners" cache when mutations update them.
 */
export function useAllBanners() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();

  return useQuery<PromoBanner[]>({
    queryKey: ["allBanners"],
    queryFn: async () => {
      if (!actor) return [];
      const activeBanners = await actor.getActiveBanners();
      const active = activeBanners
        .map(mapBanner)
        .sort((a, b) => b.priority - a.priority);

      // Merge with existing cached list so previously-inactive banners aren't lost
      const existing =
        queryClient.getQueryData<PromoBanner[]>(["allBanners"]) ?? [];
      const activeIds = new Set(active.map((b) => b.id));
      const inactiveFromCache = existing.filter(
        (b) => !b.isActive && !activeIds.has(b.id),
      );
      return [...active, ...inactiveFromCache].sort(
        (a, b) => b.priority - a.priority,
      );
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

interface CreateBannerPayload {
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  couponCode: string | null;
  priority: number;
}

export function useCreateBanner() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateBannerPayload) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.createBanner(
        payload.title,
        payload.description,
        payload.imageUrl,
        payload.ctaText,
        payload.ctaLink,
        payload.couponCode,
        BigInt(payload.priority),
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return mapBanner(result.ok);
    },
    onSuccess: (created) => {
      queryClient.setQueryData<PromoBanner[]>(["allBanners"], (prev) =>
        prev ? [created, ...prev] : [created],
      );
      queryClient.invalidateQueries({ queryKey: ["activeBanners"] });
      toast.success("Banner created successfully");
    },
    onError: (err: Error) => {
      toast.error("Failed to create banner", { description: err.message });
    },
  });
}

interface UpdateBannerPayload {
  id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  couponCode?: string | null;
  priority?: number;
}

export function useUpdateBanner() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateBannerPayload) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.updateBanner(
        payload.id,
        payload.title ?? null,
        payload.description ?? null,
        payload.imageUrl ?? null,
        payload.ctaText ?? null,
        payload.ctaLink ?? null,
        payload.couponCode !== undefined ? payload.couponCode : null,
        payload.priority !== undefined ? BigInt(payload.priority) : null,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return mapBanner(result.ok);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<PromoBanner[]>(["allBanners"], (prev) =>
        prev ? prev.map((b) => (b.id === updated.id ? updated : b)) : [updated],
      );
      queryClient.invalidateQueries({ queryKey: ["activeBanners"] });
      toast.success("Banner updated");
    },
    onError: (err: Error) => {
      toast.error("Failed to update banner", { description: err.message });
    },
  });
}

export function useDeleteBanner() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.deleteBanner(id);
      if (result.__kind__ === "err") throw new Error(result.err);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<PromoBanner[]>(["allBanners"], (prev) =>
        prev ? prev.filter((b) => b.id !== deletedId) : [],
      );
      queryClient.invalidateQueries({ queryKey: ["activeBanners"] });
      toast.success("Banner deleted");
    },
    onError: (err: Error) => {
      toast.error("Failed to delete banner", { description: err.message });
    },
  });
}

export function useToggleBannerActive() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.toggleBannerActive(id);
      if (result.__kind__ === "err") throw new Error(result.err);
      return mapBanner(result.ok);
    },
    onSuccess: (updated) => {
      // Update the allBanners cache in place so inactive banners remain visible
      queryClient.setQueryData<PromoBanner[]>(["allBanners"], (prev) => {
        if (!prev) return [updated];
        const exists = prev.some((b) => b.id === updated.id);
        return exists
          ? prev.map((b) => (b.id === updated.id ? updated : b))
          : [...prev, updated];
      });
      queryClient.invalidateQueries({ queryKey: ["activeBanners"] });
    },
    onError: (err: Error) => {
      toast.error("Failed to toggle banner", { description: err.message });
    },
  });
}
