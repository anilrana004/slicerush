import { AddressPicker } from "@/components/AddressPicker";
import { CartItem } from "@/components/CartItem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/use-cart";
import { useAutoApplyCoupon, useCoupon } from "@/hooks/use-coupon";
import { useCartStore } from "@/store/cart";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronRight,
  MapPin,
  ShoppingBag,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart();

  const selectedAddressId = useCartStore((s) => s.selectedAddressId);
  const deliveryFee = useCartStore((s) => s.deliveryFee);

  const {
    appliedCoupon,
    couponError,
    isValidating,
    validateCoupon,
    removeCoupon,
    applyAutoApplied,
  } = useCoupon();

  const [couponInput, setCouponInput] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  // Auto-apply best coupon when no manual coupon is set
  const hasManualCoupon = !!appliedCoupon && !appliedCoupon.autoApplied;
  useAutoApplyCoupon(applyAutoApplied, hasManualCoupon);

  const discount = appliedCoupon?.discountAmount ?? 0;
  const subtotal = totalPrice;
  const fee = items.length > 0 ? deliveryFee : 0;
  const total = Math.max(0, subtotal + fee - discount);

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    validateCoupon(couponInput.trim());
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    void navigate({ to: "/checkout" });
  };

  if (items.length === 0) {
    return (
      <div
        className="max-w-2xl mx-auto px-4 py-16 text-center"
        data-ocid="cart.empty_state"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">
            Your cart is empty
          </h1>
          <p className="text-muted-foreground mb-8">
            Looks like you haven't added anything yet. Browse our menu to find
            something delicious!
          </p>
          <Button
            className="bg-primary text-primary-foreground px-8 py-2.5 text-base font-semibold"
            onClick={() => void navigate({ to: "/menu" })}
            data-ocid="cart.browse_menu_button"
          >
            Browse Menu
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" data-ocid="cart.page">
      <motion.h1
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="font-display text-3xl font-bold text-foreground mb-8"
      >
        Your Cart
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Items + Coupon + Address */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cart Items */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-card rounded-2xl border border-border p-5"
          >
            <h2 className="font-display font-semibold text-lg text-foreground mb-1">
              Items ({items.reduce((s, i) => s + i.quantity, 0)})
            </h2>
            <div data-ocid="cart.list">
              {items.map((item, index) => (
                <CartItem
                  key={item.id}
                  item={item}
                  index={index + 1}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                />
              ))}
            </div>
          </motion.section>

          {/* Coupon */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="bg-card rounded-2xl border border-border p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4 text-primary" />
              <h2 className="font-display font-semibold text-lg text-foreground">
                Coupon Code
              </h2>
            </div>

            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground text-sm">
                    <span className="font-mono font-bold">
                      {appliedCoupon.code}
                    </span>
                    {" — "}-${appliedCoupon.discountAmount.toFixed(2)} off
                  </span>
                  {appliedCoupon.autoApplied && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-secondary/20 text-secondary border-0 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      Auto-applied best deal
                    </Badge>
                  )}
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-muted-foreground hover:text-destructive transition-colors duration-200 ml-2"
                  data-ocid="cart.coupon_remove_button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code (e.g. SLICE10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    className="flex-1 font-mono uppercase placeholder:normal-case placeholder:font-sans"
                    data-ocid="cart.coupon_input"
                  />
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={isValidating || !couponInput.trim()}
                    className="bg-primary text-primary-foreground shrink-0"
                    data-ocid="cart.coupon_apply_button"
                  >
                    {isValidating ? "Checking..." : "Apply"}
                  </Button>
                </div>
                {couponError && (
                  <p
                    className="text-sm text-destructive"
                    data-ocid="cart.coupon_error_state"
                  >
                    {couponError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Try: SLICE10 · PIZZA20 · RUSH5
                </p>
              </div>
            )}
          </motion.section>

          {/* Delivery Address */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.16 }}
            className="bg-card rounded-2xl border border-border p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h2 className="font-display font-semibold text-lg text-foreground">
                  Delivery Address
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="text-sm text-primary hover:text-primary/80 transition-colors duration-200"
                data-ocid="cart.change_address_button"
              >
                {selectedAddressId ? "Change" : "Select Address"}
              </button>
            </div>

            <AddressDisplay
              onOpen={() => setShowPicker(true)}
              deliveryFee={fee}
            />
          </motion.section>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="bg-card rounded-2xl border border-border p-5 sticky top-24"
            data-ocid="cart.order_summary"
          >
            <h2 className="font-display font-semibold text-lg text-foreground mb-5">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Fee</span>
                <span>{fee === 0 ? "Free" : `$${fee.toFixed(2)}`}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-primary font-medium">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-border flex justify-between font-bold text-base text-foreground">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              className="w-full mt-6 bg-primary text-primary-foreground font-semibold py-3 text-base flex items-center justify-center gap-1.5"
              onClick={handleCheckout}
              disabled={items.length === 0}
              data-ocid="cart.checkout_button"
            >
              Checkout
              <ChevronRight className="w-4 h-4" />
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-3">
              Secure checkout powered by Stripe
            </p>
          </motion.div>
        </div>
      </div>

      {/* Address Picker Modal */}
      <AnimatePresence>
        {showPicker && <AddressPicker onClose={() => setShowPicker(false)} />}
      </AnimatePresence>
    </div>
  );
}

function AddressDisplay({
  onOpen,
  deliveryFee,
}: {
  onOpen: () => void;
  deliveryFee: number;
}) {
  const selectedAddressId = useCartStore((s) => s.selectedAddressId);

  if (!selectedAddressId) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="w-full flex flex-col items-center justify-center py-6 border-2 border-dashed border-border rounded-xl hover:border-primary/40 hover:bg-muted/20 transition-all duration-200 gap-2"
        data-ocid="cart.address_empty_state"
      >
        <MapPin className="w-6 h-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No address selected. Tap to add one.
        </p>
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl">
        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            Address selected
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            ID: {selectedAddressId.slice(0, 12)}…
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Delivery fee:</span>
        <span className="font-semibold text-foreground">
          {deliveryFee === 0 ? (
            <span className="text-primary">Free</span>
          ) : (
            `$${deliveryFee.toFixed(2)}`
          )}
        </span>
      </div>
    </div>
  );
}
