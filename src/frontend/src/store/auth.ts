import { create } from "zustand";
import { Role, type UserProfile } from "../backend";

interface AuthStore {
  profile: UserProfile | null;
  isLoadingProfile: boolean;
  isProfileChecked: boolean;
  setProfile: (profile: UserProfile | null) => void;
  setLoadingProfile: (loading: boolean) => void;
  setProfileChecked: (checked: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  profile: null,
  isLoadingProfile: false,
  isProfileChecked: false,
  setProfile: (profile) => set({ profile }),
  setLoadingProfile: (isLoadingProfile) => set({ isLoadingProfile }),
  setProfileChecked: (isProfileChecked) => set({ isProfileChecked }),
  clearAuth: () =>
    set({ profile: null, isLoadingProfile: false, isProfileChecked: false }),
}));

export { Role };
