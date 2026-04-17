import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@caffeineai/core-infrastructure";
import { CheckCircle2, MapPin, Plus, Star, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { createActor } from "../backend";
import type { Address } from "../hooks/use-addresses";
import { useAddresses } from "../hooks/use-addresses";
import { useCartStore } from "../store/cart";

interface AddressPickerProps {
  onClose: () => void;
}

interface NewAddrForm {
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

const EMPTY_FORM: NewAddrForm = {
  label: "Home",
  street: "",
  city: "",
  state: "",
  zipCode: "",
};

export function AddressPicker({ onClose }: AddressPickerProps) {
  const { actor } = useActor(createActor);
  const {
    addresses,
    isLoadingAddresses,
    saveAddress,
    isSavingAddress,
    setDefaultAddress,
  } = useAddresses();

  const selectedAddressId = useCartStore((s) => s.selectedAddressId);
  const setSelectedAddress = useCartStore((s) => s.setSelectedAddress);
  const setDeliveryFee = useCartStore((s) => s.setDeliveryFee);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewAddrForm>(EMPTY_FORM);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [fetchingFeeId, setFetchingFeeId] = useState<string | null>(null);

  const setField = (k: keyof NewAddrForm, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSelect = async (addr: Address) => {
    setFetchingFeeId(addr.id);
    try {
      if (actor) {
        const feeResult = await actor.getDeliveryFee(addr.id);
        if (feeResult) {
          setDeliveryFee(Number(feeResult.feeInCents) / 100);
        } else {
          setDeliveryFee(3.99);
        }
      } else {
        setDeliveryFee(3.99);
      }
    } catch {
      setDeliveryFee(3.99);
    } finally {
      setFetchingFeeId(null);
    }
    setSelectedAddress(addr.id);
    onClose();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.street || !form.city || !form.state || !form.zipCode) {
      toast.error("Please fill in all address fields.");
      return;
    }
    try {
      const saved = await saveAddress({
        label: form.label,
        street: form.street,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
        lat: 0,
        lng: 0,
      });
      toast.success("Address saved!");
      setForm(EMPTY_FORM);
      setShowForm(false);
      void handleSelect(saved);
    } catch {
      toast.error("Failed to save address.");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      if (actor) {
        await actor.deleteAddress(id);
        toast.success("Address removed.");
        if (selectedAddressId === id) {
          setSelectedAddress(null);
          setDeliveryFee(0);
        }
      }
    } catch {
      toast.error("Failed to delete address.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDefaultAddress(id);
    toast.success("Default address updated.");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      data-ocid="address_picker.dialog"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="relative z-10 w-full sm:max-w-md bg-card border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold text-base text-foreground">
              Delivery Address
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {!showForm && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowForm(true)}
                className="h-8 px-2 text-primary hover:text-primary/80"
                data-ocid="address_picker.add_button"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add New
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="address_picker.close_button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {/* Add form */}
          <AnimatePresence>
            {showForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSave}
                className="bg-muted/40 border border-border rounded-xl p-4 space-y-3 overflow-hidden"
                data-ocid="address_picker.new_address_form"
              >
                <p className="font-semibold text-sm text-foreground">
                  New Address
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="ap-label" className="text-xs">
                      Label
                    </Label>
                    <Input
                      id="ap-label"
                      value={form.label}
                      onChange={(e) => setField("label", e.target.value)}
                      placeholder="Home / Work"
                      className="h-8 text-sm"
                      data-ocid="address_picker.label_input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ap-zip" className="text-xs">
                      ZIP Code
                    </Label>
                    <Input
                      id="ap-zip"
                      value={form.zipCode}
                      onChange={(e) => setField("zipCode", e.target.value)}
                      placeholder="10001"
                      className="h-8 text-sm"
                      data-ocid="address_picker.zip_input"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ap-street" className="text-xs">
                    Street
                  </Label>
                  <Input
                    id="ap-street"
                    value={form.street}
                    onChange={(e) => setField("street", e.target.value)}
                    placeholder="123 Main St"
                    className="h-8 text-sm"
                    data-ocid="address_picker.street_input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="ap-city" className="text-xs">
                      City
                    </Label>
                    <Input
                      id="ap-city"
                      value={form.city}
                      onChange={(e) => setField("city", e.target.value)}
                      placeholder="New York"
                      className="h-8 text-sm"
                      data-ocid="address_picker.city_input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ap-state" className="text-xs">
                      State
                    </Label>
                    <Input
                      id="ap-state"
                      value={form.state}
                      onChange={(e) => setField("state", e.target.value)}
                      placeholder="NY"
                      className="h-8 text-sm"
                      data-ocid="address_picker.state_input"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSavingAddress}
                    className="flex-1 bg-primary text-primary-foreground"
                    data-ocid="address_picker.save_button"
                  >
                    {isSavingAddress ? "Saving…" : "Save & Select"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setForm(EMPTY_FORM);
                    }}
                    data-ocid="address_picker.cancel_button"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Addresses list */}
          {isLoadingAddresses ? (
            <div className="space-y-2" data-ocid="address_picker.loading_state">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : addresses.length === 0 && !showForm ? (
            <div
              className="flex flex-col items-center justify-center py-10 text-center gap-3"
              data-ocid="address_picker.empty_state"
            >
              <MapPin className="w-8 h-8 text-muted-foreground/40" />
              <div>
                <p className="font-medium text-sm text-foreground">
                  No saved addresses
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add an address to start your order
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowForm(true)}
                data-ocid="address_picker.add_first_button"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Address
              </Button>
            </div>
          ) : (
            <div className="space-y-2" data-ocid="address_picker.list">
              {addresses.map((addr, idx) => {
                const isSelected = selectedAddressId === addr.id;
                const isFetchingFee = fetchingFeeId === addr.id;
                const isDeleting = deletingId === addr.id;

                return (
                  <motion.button
                    key={addr.id}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => void handleSelect(addr)}
                    disabled={isFetchingFee || isDeleting}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 group ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                    }`}
                    data-ocid={`address_picker.item.${idx + 1}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">
                            {addr.displayName || "Address"}
                          </span>
                          {addr.isDefault && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-primary/15 text-primary border-0">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {addr.street}, {addr.city}, {addr.state}{" "}
                          {addr.zipCode}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isFetchingFee ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 0.8,
                              repeat: Number.POSITIVE_INFINITY,
                              ease: "linear",
                            }}
                            className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full"
                          />
                        ) : isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        ) : null}

                        {!addr.isDefault && (
                          <button
                            type="button"
                            title="Set as default"
                            onClick={(e) => handleSetDefault(addr.id, e)}
                            className="p-1 rounded text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                            data-ocid={`address_picker.set_default.${idx + 1}`}
                          >
                            <Star className="w-3 h-3" />
                          </button>
                        )}

                        <button
                          type="button"
                          title="Delete address"
                          onClick={(e) => void handleDelete(addr.id, e)}
                          disabled={isDeleting}
                          className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                          data-ocid={`address_picker.delete_button.${idx + 1}`}
                        >
                          {isDeleting ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 0.8,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "linear",
                              }}
                              className="w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full"
                            />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
