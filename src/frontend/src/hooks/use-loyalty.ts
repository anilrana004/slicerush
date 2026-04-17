import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { createActor } from "../backend";
import type {
  PointsTransaction as BackendTxn,
  LoyaltyAccountPublic,
} from "../backend.d";
import type { LoyaltyAccount, PointsTransaction } from "../types";

function mapLoyaltyAccount(a: LoyaltyAccountPublic): LoyaltyAccount {
  const tierMap: Record<string, "bronze" | "silver" | "gold"> = {
    bronze: "bronze",
    silver: "silver",
    gold: "gold",
  };
  return {
    userId: a.userId.toString(),
    points: Number(a.points),
    totalPointsEarned: Number(a.totalPointsEarned),
    tier: tierMap[a.tier as unknown as string] ?? "bronze",
    joinedAt: a.joinedAt,
  };
}

function mapTransaction(t: BackendTxn): PointsTransaction {
  const txnTypeStr = String(t.txnType);
  return {
    id: t.id,
    userId: t.userId.toString(),
    points: Number(t.points),
    txnType: (txnTypeStr === "redeemed" ? "redeemed" : "earned") as
      | "earned"
      | "redeemed",
    orderId: t.orderId ?? null,
    description: t.description,
    createdAt: t.createdAt,
  };
}

export function useLoyaltyAccount() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<LoyaltyAccount | null>({
    queryKey: ["loyaltyAccount"],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getLoyaltyAccount();
      return result ? mapLoyaltyAccount(result) : null;
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

export function usePointsHistory() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<PointsTransaction[]>({
    queryKey: ["pointsHistory"],
    queryFn: async () => {
      if (!actor) return [];
      const txns = await actor.getPointsHistory();
      return txns.map(mapTransaction);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}
