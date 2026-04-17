import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAddresses } from "@/hooks/use-addresses";
import { useAuth } from "@/hooks/use-auth";
import { useLoyaltyAccount, usePointsHistory } from "@/hooks/use-loyalty";
import { useAuthStore } from "@/store/auth";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Award,
  CheckCircle,
  LogOut,
  MapPin,
  Plus,
  Star,
  Trash2,
  User,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { createActor } from "../backend";

// ─── Tier constants ────────────────────────────────────────────────────────────
const TIER_LABELS: Record<string, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
};

const TIER_BADGE_CLASSES: Record<string, string> = {
  bronze: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  silver: "bg-slate-400/15 text-slate-300 border-slate-400/30",
  gold: "bg-yellow-400/15 text-yellow-400 border-yellow-400/30",
};

const TIER_BAR_CLASSES: Record<string, string> = {
  bronze: "bg-amber-500",
  silver: "bg-slate-400",
  gold: "bg-yellow-400",
};

// Points needed to reach silver / gold
const TIER_THRESHOLDS = { bronze: 500, silver: 2000 };

// ─── Section wrapper ────────────────────────────────────────────────────────────
function ProfileSection({
  title,
  icon: Icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="profile-section"
    >
      <div className="flex items-center gap-2 mb-5">
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="profile-section-title mb-0">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

// ─── Add Address Form ────────────────────────────────────────────────────────────
interface AddressFormState {
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  lat: string;
  lng: string;
}

const emptyForm: AddressFormState = {
  label: "",
  street: "",
  city: "",
  state: "",
  zipCode: "",
  lat: "",
  lng: "",
};

function AddAddressForm({ onClose }: { onClose: () => void }) {
  const { saveAddress, isSavingAddress } = useAddresses();
  const [form, setForm] = useState<AddressFormState>(emptyForm);

  function field(key: keyof AddressFormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.label.trim() || !form.street.trim() || !form.city.trim()) {
      toast.error("Label, street and city are required");
      return;
    }
    try {
      await saveAddress({
        label: form.label.trim(),
        street: form.street.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zipCode: form.zipCode.trim(),
        lat: form.lat ? Number.parseFloat(form.lat) : undefined,
        lng: form.lng ? Number.parseFloat(form.lng) : undefined,
      });
      toast.success("Address saved");
      onClose();
    } catch {
      toast.error("Failed to save address");
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      onSubmit={handleSubmit}
      className="mt-4 p-4 rounded-lg bg-muted/40 border border-border space-y-3"
      data-ocid="profile.add_address_form"
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-foreground">New Address</p>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
          data-ocid="profile.add_address_form.close_button"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="profile-field-group">
        <div className="space-y-1">
          <Label htmlFor="addr-label">Label *</Label>
          <Input
            id="addr-label"
            value={form.label}
            onChange={field("label")}
            placeholder="Home, Work…"
            className="profile-field h-9"
            data-ocid="profile.address_label_input"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="addr-street">Street *</Label>
          <Input
            id="addr-street"
            value={form.street}
            onChange={field("street")}
            placeholder="123 Main St"
            className="profile-field h-9"
            data-ocid="profile.address_street_input"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="addr-city">City *</Label>
          <Input
            id="addr-city"
            value={form.city}
            onChange={field("city")}
            placeholder="New York"
            className="profile-field h-9"
            data-ocid="profile.address_city_input"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="addr-state">State</Label>
          <Input
            id="addr-state"
            value={form.state}
            onChange={field("state")}
            placeholder="NY"
            className="profile-field h-9"
            data-ocid="profile.address_state_input"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="addr-zip">ZIP Code</Label>
          <Input
            id="addr-zip"
            value={form.zipCode}
            onChange={field("zipCode")}
            placeholder="10001"
            className="profile-field h-9"
            data-ocid="profile.address_zip_input"
          />
        </div>
      </div>

      <div className="profile-field-group">
        <div className="space-y-1">
          <Label htmlFor="addr-lat" className="text-muted-foreground">
            Latitude (optional)
          </Label>
          <Input
            id="addr-lat"
            type="number"
            step="any"
            value={form.lat}
            onChange={field("lat")}
            placeholder="40.7128"
            className="profile-field h-9"
            data-ocid="profile.address_lat_input"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="addr-lng" className="text-muted-foreground">
            Longitude (optional)
          </Label>
          <Input
            id="addr-lng"
            type="number"
            step="any"
            value={form.lng}
            onChange={field("lng")}
            placeholder="-74.0060"
            className="profile-field h-9"
            data-ocid="profile.address_lng_input"
          />
        </div>
      </div>

      <Button
        type="submit"
        size="sm"
        disabled={isSavingAddress}
        className="w-full sm:w-auto"
        data-ocid="profile.address_submit_button"
      >
        {isSavingAddress ? "Saving…" : "Save Address"}
      </Button>
    </motion.form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function ProfilePage() {
  const { profile } = useAuth();
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();

  const { addresses, isLoadingAddresses, setDefaultAddress } = useAddresses();
  const { data: loyalty, isLoading: loyaltyLoading } = useLoyaltyAccount();
  const { data: history, isLoading: historyLoading } = usePointsHistory();

  // Profile edit form
  const [name, setName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const hasChanges =
    name.trim() !== (profile?.name ?? "") ||
    phone.trim() !== (profile?.phone ?? "");

  const initials = (profile?.name ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const memberSince = profile?.createdAt
    ? new Date(Number(profile.createdAt) / 1_000_000).toLocaleDateString(
        "en-US",
        { month: "long", year: "numeric" },
      )
    : null;

  // Tier progress
  const tier = loyalty?.tier ?? "bronze";
  const points = loyalty?.points ?? 0;
  const nextTier =
    tier === "bronze" ? "silver" : tier === "silver" ? "gold" : null;
  const progressMax =
    tier === "bronze" ? TIER_THRESHOLDS.bronze : TIER_THRESHOLDS.silver;
  const progressPct = nextTier
    ? Math.min(100, Math.round((points / progressMax) * 100))
    : 100;
  const ptsToNext = nextTier ? Math.max(0, progressMax - points) : 0;

  async function handleSaveProfile() {
    if (!actor || !hasChanges) return;
    setIsSaving(true);
    try {
      const result = await actor.updateProfile(name.trim(), phone.trim());
      if ("err" in result) throw new Error(result.err as string);
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully");
    } catch (e) {
      toast.error("Update failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAddress(id: string) {
    if (!actor) return;
    try {
      await actor.deleteAddress(id);
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address removed");
    } catch {
      toast.error("Failed to remove address");
    }
  }

  function handleLogout() {
    clearAuth();
    void navigate({ to: "/login" });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" data-ocid="profile.page">
      {/* ── Profile Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-8"
      >
        <div className="profile-header">
          {/* Decorative gradient strips */}
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-8 right-8 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
          </div>
        </div>

        {/* Avatar + info row */}
        <div className="flex items-end gap-4 -mt-10 px-6 pb-4">
          <div
            className="profile-avatar bg-gradient-to-br from-primary/40 to-accent/30 text-foreground font-display font-bold flex-shrink-0"
            aria-label="Profile avatar"
          >
            {initials}
          </div>
          <div className="mb-2 min-w-0">
            <h1 className="font-display font-bold text-2xl text-foreground leading-tight truncate">
              {profile?.name || "Your Profile"}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {profile?.phone && (
                <span className="text-sm text-muted-foreground">
                  {profile.phone}
                </span>
              )}
              <Badge variant="secondary" className="capitalize text-xs">
                {profile?.role as string}
              </Badge>
              {memberSince && (
                <span className="text-xs text-muted-foreground">
                  Member since {memberSince}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Edit Profile ───────────────────────────────────────────────── */}
      <ProfileSection title="Profile Info" icon={User} delay={0.05}>
        <div className="profile-field-group">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Full Name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="profile-field"
              data-ocid="profile.name_input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-phone">Phone Number</Label>
            <Input
              id="profile-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
              className="profile-field"
              data-ocid="profile.phone_input"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button
            onClick={handleSaveProfile}
            disabled={isSaving || !hasChanges}
            data-ocid="profile.save_button"
          >
            {isSaving ? "Saving…" : "Save Changes"}
          </Button>
          {!hasChanges && (
            <p className="text-xs text-muted-foreground">No changes to save</p>
          )}
        </div>
      </ProfileSection>

      {/* ── Saved Addresses ────────────────────────────────────────────── */}
      <ProfileSection title="Saved Addresses" icon={MapPin} delay={0.1}>
        {isLoadingAddresses ? (
          <div
            className="space-y-3"
            data-ocid="profile.addresses.loading_state"
          >
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : addresses.length === 0 && !showAddressForm ? (
          <div
            className="text-center py-8 text-muted-foreground"
            data-ocid="profile.addresses.empty_state"
          >
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No saved addresses yet.</p>
          </div>
        ) : (
          <div className="space-y-3" data-ocid="profile.addresses.list">
            {addresses.map((addr, idx) => (
              <motion.div
                key={addr.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/40 border border-border"
                data-ocid={`profile.address.item.${idx + 1}`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {addr.displayName}
                      </span>
                      {addr.isDefault && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                          data-ocid={`profile.address.default_badge.${idx + 1}`}
                        >
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {[addr.street, addr.city, addr.state, addr.zipCode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!addr.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={() => setDefaultAddress(addr.id)}
                      data-ocid={`profile.address.set_default_button.${idx + 1}`}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Set Default
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        aria-label="Delete address"
                        data-ocid={`profile.address.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent data-ocid="profile.delete_address_dialog">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Address?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete{" "}
                          <strong>{addr.displayName}</strong> from your saved
                          addresses.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-ocid="profile.delete_address_dialog.cancel_button">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          data-ocid="profile.delete_address_dialog.confirm_button"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {showAddressForm && (
          <AddAddressForm onClose={() => setShowAddressForm(false)} />
        )}

        {!showAddressForm && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4 border-dashed"
            onClick={() => setShowAddressForm(true)}
            data-ocid="profile.add_address_button"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add New Address
          </Button>
        )}
      </ProfileSection>

      {/* ── Loyalty Rewards ────────────────────────────────────────────── */}
      <ProfileSection title="Loyalty Rewards" icon={Award} delay={0.15}>
        {loyaltyLoading ? (
          <Skeleton
            className="h-28 w-full"
            data-ocid="profile.loyalty.loading_state"
          />
        ) : loyalty ? (
          <>
            {/* Tier badge + points summary */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-sm font-bold px-2.5 py-0.5 rounded-full border capitalize ${TIER_BADGE_CLASSES[tier]}`}
                    data-ocid="profile.loyalty.tier_badge"
                  >
                    {TIER_LABELS[tier]} Member
                  </span>
                </div>
                <p className="text-4xl font-display font-bold text-primary leading-none">
                  {loyalty.points.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Available points
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">
                  {loyalty.totalPointsEarned.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total earned</p>
              </div>
            </div>

            {/* Progress bar */}
            {nextTier && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-muted-foreground capitalize">
                    Progress to{" "}
                    <span
                      className={`font-semibold ${TIER_BADGE_CLASSES[nextTier].split(" ")[1]}`}
                    >
                      {TIER_LABELS[nextTier]}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ptsToNext > 0
                      ? `${ptsToNext.toLocaleString()} pts away`
                      : "Almost there!"}
                  </p>
                </div>
                <div
                  className="w-full bg-muted rounded-full h-2 overflow-hidden"
                  data-ocid="profile.loyalty.progress_bar"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                    className={`h-full rounded-full ${TIER_BAR_CLASSES[tier]}`}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">0</span>
                  <span className="text-[10px] text-muted-foreground">
                    {progressMax.toLocaleString()} pts
                  </span>
                </div>
              </div>
            )}

            <Separator className="my-4" />

            {/* Points history */}
            <p className="text-sm font-semibold text-foreground mb-3">
              Recent Transactions
            </p>
            {historyLoading ? (
              <div
                className="space-y-2"
                data-ocid="profile.points_history.loading_state"
              >
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : history && history.length > 0 ? (
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {history.slice(0, 5).map((txn, idx) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                    data-ocid={`profile.points_history.item.${idx + 1}`}
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="text-sm text-foreground truncate">
                        {txn.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(
                          Number(txn.createdAt) / 1_000_000,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Star
                        className={`w-3 h-3 ${txn.txnType === "earned" ? "text-amber-400" : "text-muted-foreground"}`}
                        fill={
                          txn.txnType === "earned" ? "currentColor" : "none"
                        }
                      />
                      <span
                        className={`text-sm font-semibold ${txn.txnType === "earned" ? "text-amber-400" : "text-muted-foreground"}`}
                      >
                        {txn.txnType === "earned" ? "+" : "-"}
                        {txn.points.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p
                className="text-sm text-muted-foreground"
                data-ocid="profile.points_history.empty_state"
              >
                No transactions yet. Place your first order to start earning
                points!
              </p>
            )}
          </>
        ) : (
          <div
            className="text-center py-6 text-muted-foreground"
            data-ocid="profile.loyalty.empty_state"
          >
            <Award className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">
              No loyalty account yet. Place your first order to start earning!
            </p>
          </div>
        )}
      </ProfileSection>

      {/* ── Danger Zone ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="profile-section border-destructive/30"
        data-ocid="profile.danger_zone"
      >
        <div className="flex items-center gap-2 mb-4">
          <LogOut className="w-5 h-5 text-destructive" />
          <h2 className="profile-section-title mb-0 text-destructive">
            Danger Zone
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Logging out will end your current session. You can log back in at any
          time.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              data-ocid="profile.logout_button"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent data-ocid="profile.logout_dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>Log out?</AlertDialogTitle>
              <AlertDialogDescription>
                You'll need to sign in again with Internet Identity to access
                your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-ocid="profile.logout_dialog.cancel_button">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-ocid="profile.logout_dialog.confirm_button"
              >
                Log Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </div>
  );
}
