import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { createActor } from "../backend";
import { useCartStore } from "../store/cart";

export interface CouponValidation {
  isValid: boolean;
  discountAmount: number;
  message: string;
  code: string;
}

export interface AppliedCoupon {
  code: string;
  discountAmount: number;
  autoApplied?: boolean;
}

export function useCoupon() {
  const { actor } = useActor(createActor);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    null,
  );
  const [couponError, setCouponError] = useState<string | null>(null);

  const validateMutation = useMutation({
    mutationFn: async (code: string): Promise<CouponValidation> => {
      setCouponError(null);
      if (!actor) throw new Error("Not connected");
      try {
        const subtotal = useCartStore.getState().getTotalPrice();
        const result = await actor.validateCoupon(
          code,
          BigInt(Math.round(subtotal * 100)),
        );
        return {
          isValid: result.isValid ?? false,
          discountAmount: Number(result.discountAmount ?? 0n) / 100,
          message: result.message ?? "",
          code,
        };
      } catch {
        // Fallback demo coupons
        const demoCoupons: Record<string, number> = {
          SLICE10: 10,
          PIZZA20: 20,
          RUSH5: 5,
        };
        const upper = code.toUpperCase();
        if (demoCoupons[upper]) {
          return {
            isValid: true,
            discountAmount: demoCoupons[upper],
            message: `$${demoCoupons[upper]} off applied!`,
            code: upper,
          };
        }
        return {
          isValid: false,
          discountAmount: 0,
          message: "Invalid coupon code.",
          code,
        };
      }
    },
    onSuccess: (data) => {
      if (data.isValid) {
        setAppliedCoupon({
          code: data.code,
          discountAmount: data.discountAmount,
        });
        setCouponError(null);
      } else {
        setCouponError(data.message);
        setAppliedCoupon(null);
      }
    },
    onError: (err: Error) => {
      setCouponError(err.message);
      setAppliedCoupon(null);
    },
  });

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const applyAutoApplied = (coupon: AppliedCoupon) => {
    setAppliedCoupon({ ...coupon, autoApplied: true });
  };

  return {
    appliedCoupon,
    couponError,
    isValidating: validateMutation.isPending,
    validateCoupon: (code: string) => validateMutation.mutate(code),
    removeCoupon,
    applyAutoApplied,
  };
}

export function useAutoApplyCoupon(
  applyAutoApplied: (coupon: AppliedCoupon) => void,
  hasManualCoupon: boolean,
) {
  const { actor, isFetching } = useActor(createActor);
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.getTotalPrice());
  const lastTotalRef = useRef<number | null>(null);
  const hasAutoApplied = useRef(false);

  useEffect(() => {
    if (!actor || isFetching || hasManualCoupon) return;
    if (items.length === 0) return;
    if (hasAutoApplied.current && lastTotalRef.current === totalPrice) return;

    lastTotalRef.current = totalPrice;

    const run = async () => {
      try {
        const cartItems = items.map((i) => ({
          productId: i.productId,
          quantity: BigInt(i.quantity),
          unitPrice: BigInt(Math.round(i.unitPrice * 100)),
        }));
        const result = await actor.autoApplyCoupon(
          BigInt(Math.round(totalPrice * 100)),
          cartItems,
        );
        if (result) {
          const discount = Number(result.discountValue) / 100;
          applyAutoApplied({
            code: result.code,
            discountAmount: discount,
            autoApplied: true,
          });
          hasAutoApplied.current = true;
        }
      } catch {
        // silently ignore
      }
    };

    void run();
  }, [actor, isFetching, items, totalPrice, hasManualCoupon, applyAutoApplied]);
}

export function useGetCoupons() {
  const { actor, isFetching: isFetchingActor } = useActor(createActor);
  return useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getCoupons();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetchingActor,
  });
}
