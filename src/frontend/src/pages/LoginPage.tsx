import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Role } from "../backend";
import { OnboardingModal } from "./OnboardingModal";

export function LoginPage() {
  const {
    isAuthenticated,
    isInitializing,
    isLoadingProfile,
    isProfileChecked,
    profile,
    login,
  } = useAuth();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Once auth + profile is resolved, redirect or show onboarding
  useEffect(() => {
    if (!isAuthenticated || isInitializing || isLoadingProfile) return;
    if (!isProfileChecked) return;

    if (!profile) {
      setShowOnboarding(true);
    } else {
      const dest =
        profile.role === Role.delivery_partner ? "/partner" : "/menu";
      void navigate({ to: dest });
    }
  }, [
    isAuthenticated,
    isInitializing,
    isLoadingProfile,
    isProfileChecked,
    profile,
    navigate,
  ]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Profile is now set in store via OnboardingModal → redirect will happen via useEffect
  };

  return (
    <div className="min-h-screen bg-background flex" data-ocid="login.page">
      {/* Left panel — hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="/assets/generated/pizza-hero.dim_1200x800.jpg"
          alt="Delicious pizza"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
        <div className="absolute bottom-12 left-10 right-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h1 className="font-display text-5xl font-bold text-foreground leading-tight mb-3">
              Great food,
              <br />
              <span className="text-primary">delivered fast.</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-sm">
              Freshly baked pizzas, crispy wings, and more — at your door in
              minutes.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right panel — login */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
        {/* Mobile hero (small screens) */}
        <div className="lg:hidden w-full max-w-xs mb-8 rounded-2xl overflow-hidden shadow-xl aspect-video">
          <img
            src="/assets/generated/pizza-hero.dim_1200x800.jpg"
            alt="Pizza"
            className="w-full h-full object-cover"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <img
              src="/assets/generated/slicerush-icon-transparent.dim_120x120.png"
              alt="SliceRush"
              className="w-12 h-12 object-contain"
            />
            <span className="font-display text-3xl font-bold">
              <span className="text-primary">Slice</span>
              <span className="text-accent-foreground">Rush</span>
            </span>
          </div>

          <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
            Sign in to continue
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            Use your Internet Identity to securely access your account.
          </p>

          {/* Login button */}
          {isInitializing ? (
            <div
              className="flex items-center gap-3 py-3 text-muted-foreground"
              data-ocid="login.loading_state"
            >
              <span className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              Restoring session…
            </div>
          ) : (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base h-12 shadow-lg"
                onClick={login}
                disabled={isLoadingProfile}
                data-ocid="login.login_button"
              >
                {isLoadingProfile ? (
                  <span
                    className="flex items-center gap-2"
                    data-ocid="login.profile_loading_state"
                  >
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Loading profile…
                  </span>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                      className="w-5 h-5 mr-2 opacity-90"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                    </svg>
                    Continue with Internet Identity
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Features list */}
          <ul className="mt-8 space-y-2.5">
            {[
              "🍕  Browse our full menu with customization",
              "🛒  Cart, coupons & Stripe checkout",
              "📍  Real-time order tracking",
              "🛵  Delivery partner portal",
            ].map((item) => (
              <li
                key={item}
                className="text-sm text-muted-foreground flex items-start gap-2"
              >
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Footer branding */}
        <p className="absolute bottom-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.hostname : "",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground underline underline-offset-2 transition-colors duration-200"
          >
            Built with love using caffeine.ai
          </a>
        </p>
      </div>

      {/* Onboarding modal */}
      <OnboardingModal
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}
