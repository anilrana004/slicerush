import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@caffeineai/core-infrastructure";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Role, createActor } from "../backend";
import { useAuthStore } from "../store/auth";

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const { actor } = useActor(createActor);
  const { setProfile } = useAuthStore();
  const [step, setStep] = useState<"role" | "details">("role");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setStep("details");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !selectedRole) return;
    setError("");
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    setIsLoading(true);
    try {
      // createProfile returns AuthResult: { __kind__: "ok", ok: UserProfile } | { __kind__: "err", err: string }
      const result = await actor.createProfile(
        selectedRole,
        name.trim(),
        phone.trim(),
      );
      if (result.__kind__ === "ok") {
        setProfile(result.ok);
        onComplete();
      } else {
        setError(result.err || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          data-ocid="onboarding.dialog"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary px-6 py-5">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/generated/slicerush-icon-transparent.dim_120x120.png"
                  alt="SliceRush"
                  className="w-8 h-8 object-contain"
                />
                <div>
                  <h2 className="font-display font-bold text-xl text-primary-foreground">
                    Welcome to SliceRush
                  </h2>
                  <p className="text-primary-foreground/80 text-sm">
                    Let's set up your account
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {step === "role" && (
                  <motion.div
                    key="role"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="font-display font-semibold text-lg text-foreground mb-1">
                      How will you use SliceRush?
                    </h3>
                    <p className="text-muted-foreground text-sm mb-5">
                      Choose your role to continue.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleRoleSelect(Role.customer)}
                        className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-border hover:border-primary bg-muted/40 hover:bg-primary/5 transition-smooth text-center"
                        data-ocid="onboarding.customer_role_button"
                      >
                        <span className="text-3xl">🍕</span>
                        <div>
                          <div className="font-semibold text-foreground text-sm">
                            Customer
                          </div>
                          <div className="text-muted-foreground text-xs mt-0.5">
                            Order delicious food
                          </div>
                        </div>
                      </motion.button>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleRoleSelect(Role.delivery_partner)}
                        className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-border hover:border-primary bg-muted/40 hover:bg-primary/5 transition-smooth text-center"
                        data-ocid="onboarding.delivery_partner_role_button"
                      >
                        <span className="text-3xl">🛵</span>
                        <div>
                          <div className="font-semibold text-foreground text-sm">
                            Delivery Partner
                          </div>
                          <div className="text-muted-foreground text-xs mt-0.5">
                            Deliver orders
                          </div>
                        </div>
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {step === "details" && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      type="button"
                      onClick={() => setStep("role")}
                      className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1 transition-colors duration-200"
                      data-ocid="onboarding.back_button"
                    >
                      ← Back
                    </button>

                    <h3 className="font-display font-semibold text-lg text-foreground mb-1">
                      Your details
                    </h3>
                    <p className="text-muted-foreground text-sm mb-5">
                      Signing up as a{" "}
                      <span className="text-primary font-medium">
                        {selectedRole === Role.customer
                          ? "Customer"
                          : "Delivery Partner"}
                      </span>
                    </p>

                    <form
                      onSubmit={(e) => void handleSubmit(e)}
                      className="space-y-4"
                    >
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="onboard-name"
                          className="text-sm font-medium"
                        >
                          Full Name
                        </Label>
                        <Input
                          id="onboard-name"
                          placeholder="e.g. Alex Johnson"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bg-muted/40"
                          data-ocid="onboarding.name_input"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="onboard-phone"
                          className="text-sm font-medium"
                        >
                          Phone Number
                        </Label>
                        <Input
                          id="onboard-phone"
                          placeholder="e.g. +1 555 000 1234"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="bg-muted/40"
                          data-ocid="onboarding.phone_input"
                        />
                      </div>

                      {error && (
                        <p
                          className="text-destructive text-sm"
                          data-ocid="onboarding.error_state"
                        >
                          {error}
                        </p>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                        disabled={isLoading}
                        data-ocid="onboarding.submit_button"
                      >
                        {isLoading ? (
                          <span
                            className="flex items-center gap-2"
                            data-ocid="onboarding.loading_state"
                          >
                            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            Creating account…
                          </span>
                        ) : (
                          "Get Started"
                        )}
                      </Button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
