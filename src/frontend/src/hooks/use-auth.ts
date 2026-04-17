import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useCallback, useEffect } from "react";
import { createActor } from "../backend";
import { useAuthStore } from "../store/auth";

export function useAuth() {
  const { identity, login, clear, isAuthenticated, isInitializing } =
    useInternetIdentity();
  const { actor } = useActor(createActor);
  const {
    profile,
    isLoadingProfile,
    isProfileChecked,
    setProfile,
    setLoadingProfile,
    setProfileChecked,
    clearAuth,
  } = useAuthStore();

  const fetchProfile = useCallback(async () => {
    if (!actor) return;
    setLoadingProfile(true);
    try {
      // getProfile() returns UserProfile | null directly (not AuthResult)
      const result = await actor.getProfile();
      setProfile(result ?? null);
    } catch {
      setProfile(null);
    } finally {
      setLoadingProfile(false);
      setProfileChecked(true);
    }
  }, [actor, setProfile, setLoadingProfile, setProfileChecked]);

  useEffect(() => {
    if (isAuthenticated && actor && !isProfileChecked && !isLoadingProfile) {
      fetchProfile();
    }
    if (!isAuthenticated && !isInitializing) {
      clearAuth();
    }
  }, [
    isAuthenticated,
    isInitializing,
    actor,
    isProfileChecked,
    isLoadingProfile,
    fetchProfile,
    clearAuth,
  ]);

  const logout = useCallback(() => {
    clear();
    clearAuth();
  }, [clear, clearAuth]);

  return {
    identity,
    profile,
    isAuthenticated,
    isInitializing,
    isLoadingProfile,
    isProfileChecked,
    login,
    logout,
    fetchProfile,
    actor,
  };
}
