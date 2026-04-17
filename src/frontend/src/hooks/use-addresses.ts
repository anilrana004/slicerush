import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";
import type { AddressPublic } from "../backend.d";

export type { AddressPublic as Address };

export interface NewAddressPayload {
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  lat?: number;
  lng?: number;
}

export function useAddresses() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();

  const addressesQuery = useQuery<AddressPublic[]>({
    queryKey: ["addresses"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const results = await actor.getAddresses();
        return results.map((a) => ({
          ...a,
          lat: Number(a.lat),
          lng: Number(a.lng),
        }));
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });

  const saveAddressMutation = useMutation({
    mutationFn: async (payload: NewAddressPayload): Promise<AddressPublic> => {
      if (!actor) throw new Error("Not connected");
      try {
        return await actor.saveAddress(
          payload.label,
          payload.street,
          payload.city,
          payload.state ?? "",
          payload.zipCode ?? "",
          payload.lat ?? 0,
          payload.lng ?? 0,
        );
      } catch {
        // Fallback: create a local address object
        const localAddr: AddressPublic = {
          id: `local-${Date.now()}`,
          displayName: payload.label,
          street: payload.street,
          city: payload.city,
          state: payload.state ?? "",
          zipCode: payload.zipCode ?? "",
          lat: payload.lat ?? 0,
          lng: payload.lng ?? 0,
          isDefault: false,
          principal: "" as unknown as AddressPublic["principal"],
        };
        return localAddr;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!actor) return;
      try {
        await actor.setDefaultAddress(id);
      } catch {
        // silently ignore
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  return {
    addresses: addressesQuery.data ?? [],
    isLoadingAddresses: addressesQuery.isLoading,
    saveAddress: saveAddressMutation.mutateAsync,
    isSavingAddress: saveAddressMutation.isPending,
    setDefaultAddress: setDefaultMutation.mutate,
  };
}

export function useCreateCheckoutSession() {
  const { actor } = useActor(createActor);

  return useMutation({
    mutationFn: async (
      items: Array<{
        currency: string;
        productName: string;
        productDescription: string;
        priceInCents: number;
        quantity: number;
      }>,
    ): Promise<{ id: string; url: string }> => {
      if (!actor) throw new Error("Actor not available");
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/payment-success`;
      const cancelUrl = `${baseUrl}/payment-cancel`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).createCheckoutSession(
        items,
        successUrl,
        cancelUrl,
      );
      const session = JSON.parse(result as string) as {
        id: string;
        url: string;
      };
      if (!session?.url) {
        throw new Error("Stripe session missing url");
      }
      return session;
    },
  });
}
