import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createActor } from "../backend";
import type { OrderReview as BackendReview } from "../backend.d";

function mapReview(r: BackendReview) {
  return {
    id: r.id,
    orderId: r.orderId,
    customerId: r.customerId.toString(),
    overallRating: Number(r.overallRating),
    comment: r.comment ?? null,
    createdAt: r.createdAt,
  };
}

export function useOrderReview(orderId: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["orderReview", orderId],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getOrderReview(orderId);
      return result ? mapReview(result) : null;
    },
    enabled: !!actor && !isFetching && !!orderId,
    staleTime: 60000,
  });
}

export function useAllReviews() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["allReviews"],
    queryFn: async () => {
      if (!actor) return [];
      const reviews = await actor.getAllReviews();
      return reviews.map(mapReview);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

interface SubmitReviewPayload {
  orderId: string;
  rating: number;
  comment: string | null;
}

export function useSubmitReview() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, rating, comment }: SubmitReviewPayload) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.submitOrderReview(
        orderId,
        BigInt(rating),
        comment,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return mapReview(result.ok);
    },
    onSuccess: (review) => {
      queryClient.setQueryData(["orderReview", review.orderId], review);
      queryClient.invalidateQueries({ queryKey: ["allReviews"] });
      toast.success("Review submitted!", {
        description: "Thanks for your feedback.",
      });
    },
    onError: (err: Error) => {
      toast.error("Failed to submit review", { description: err.message });
    },
  });
}
