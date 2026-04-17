import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateCheckoutSession } from "@/hooks/use-addresses";
import { useCart } from "@/hooks/use-cart";
import { usePlaceOrder } from "@/hooks/use-orders";
import { useCartStore } from "@/store/cart";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Lock,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

function OrderLineItem({
  name,
  size,
  crust,
  addOns,
  quantity,
  totalPrice,
  imageUrl,
  index,
}: {
  name: string;
  size: string;
  crust: string;
  addOns: Array<{ id: string; name: string; price: number }>;
  quantity: number;
  totalPrice: number;
  imageUrl: string;
  index: number;
}) {
  const sizeLabel = size ? size.charAt(0).toUpperCase() + size.slice(1) : "";
  const crustLabel = crust
    ? crust.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";
  const addOnNames = addOns.map((a) => a.name).join(", ");

  return (
    <div
      className="flex gap-3 py-3 border-b border-border last:border-0"
      data-ocid={`checkout.item.${index}`}
    >
      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "/assets/images/placeholder.svg";
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-display font-semibold text-foreground text-sm truncate">
            {name}
          </p>
          <span className="text-xs text-muted-foreground shrink-0">
            ×{quantity}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {[sizeLabel, crustLabel].filter(Boolean).join(" · ")}
          {addOnNames && ` · ${addOnNames}`}
        </p>
        <p className="text-sm font-semibold text-foreground mt-1">
          ${totalPrice.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice } = useCart();
  const createCheckoutSession = useCreateCheckoutSession();
  const placeOrderMutation = usePlaceOrder();

  const selectedAddressId = useCartStore((s) => s.selectedAddressId);
  const deliveryFee = useCartStore((s) => s.deliveryFee);
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);

  const [isRedirecting, setIsRedirecting] = useState(false);

  const subtotal = totalPrice;
  const discount = appliedCoupon?.discountAmount ?? 0;
  const fee = selectedAddressId ? deliveryFee : 3.99;
  const total = Math.max(0, subtotal + fee - discount);

  const handleStripeCheckout = async () => {
    if (items.length === 0) return;
    setIsRedirecting(true);

    try {
      // Step 1: Place the order first to get an orderId
      const order = await placeOrderMutation.mutateAsync({
        subtotal,
        deliveryFee: fee,
        discountAmount: discount,
        total,
        couponCode: appliedCoupon?.code ?? null,
        deliveryAddress: selectedAddressId ?? "Delivery address",
      });

      // Step 2: Store orderId for verification after redirect
      localStorage.setItem("pendingOrderId", order.id);

      // Step 3: Create Stripe session
      const shoppingItems = items.map((item) => ({
        currency: "usd",
        productName: item.name,
        productDescription: `${item.size} · ${item.crust}${
          item.addOns.length > 0
            ? ` · ${item.addOns.map((a) => a.name).join(", ")}`
            : ""
        }`,
        priceInCents: Math.round(item.unitPrice * 100),
        quantity: item.quantity,
      }));

      const session = await createCheckoutSession.mutateAsync(shoppingItems);

      if (!session?.url) {
        throw new Error("Stripe session missing url");
      }

      // Redirect to Stripe
      window.location.href = session.url;
    } catch (err) {
      setIsRedirecting(false);
      const msg =
        err instanceof Error
          ? err.message
          : "Payment failed. Please try again.";
      toast.error(msg, { duration: 5000 });
    }
  };

  if (items.length === 0) {
    return (
      <div
        className="max-w-2xl mx-auto px-4 py-16 text-center"
        data-ocid="checkout.empty_state"
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
            Nothing to checkout
          </h1>
          <p className="text-muted-foreground mb-8">
            Your cart is empty. Add some items before proceeding to checkout.
          </p>
          <Button
            className="bg-primary text-primary-foreground px-8"
            onClick={() => void navigate({ to: "/menu" })}
            data-ocid="checkout.browse_menu_button"
          >
            Browse Menu
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" data-ocid="checkout.page">
      <motion.button
        type="button"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        onClick={() => void navigate({ to: "/cart" })}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 mb-6"
        data-ocid="checkout.back_button"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Cart
      </motion.button>

      <motion.h1
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="font-display text-3xl font-bold text-foreground mb-8"
      >
        Checkout
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Payment */}
        <div className="lg:col-span-3 space-y-6">
          {/* Delivery Address Summary */}
          {selectedAddressId ? (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="bg-card rounded-2xl border border-border p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-primary" />
                <h2 className="font-display font-semibold text-base text-foreground">
                  Delivery Address
                </h2>
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-primary/5 rounded-xl border border-primary/20">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Address confirmed
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    ID: {selectedAddressId.slice(0, 16)}…
                  </p>
                </div>
              </div>
            </motion.section>
          ) : (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="bg-card rounded-2xl border border-destructive/30 p-5"
              data-ocid="checkout.address_warning"
            >
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                No delivery address selected. Please go back and select one.
              </p>
            </motion.section>
          )}

          {/* Stripe Payment CTA */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="font-display font-semibold text-xl text-foreground">
                Payment
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 border border-border">
                <Lock className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Secure Payment with Stripe
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your payment is encrypted and secured. You will be
                    redirected to Stripe's secure checkout page.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {["Visa", "Mastercard", "AmEx", "Discover"].map((card) => (
                  <span
                    key={card}
                    className="text-xs px-2.5 py-1 bg-muted rounded border border-border text-muted-foreground font-mono"
                  >
                    {card}
                  </span>
                ))}
              </div>

              <AnimatePresence>
                {(createCheckoutSession.isError ||
                  placeOrderMutation.isError) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive"
                    data-ocid="checkout.error_state"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      {(placeOrderMutation.error ??
                        createCheckoutSession.error) instanceof Error
                        ? (placeOrderMutation.error ??
                            createCheckoutSession.error)!.message
                        : "Payment failed. Please try again."}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                onClick={() => void handleStripeCheckout()}
                disabled={
                  isRedirecting ||
                  createCheckoutSession.isPending ||
                  placeOrderMutation.isPending
                }
                className="w-full py-3 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                data-ocid="checkout.pay_button"
              >
                {isRedirecting ||
                createCheckoutSession.isPending ||
                placeOrderMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                      className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                    />
                    {placeOrderMutation.isPending
                      ? "Placing Order..."
                      : "Redirecting to Stripe..."}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Pay ${total.toFixed(2)} with Stripe
                  </span>
                )}
              </Button>
            </div>
          </motion.section>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="flex items-start gap-3 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm text-muted-foreground"
          >
            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p>
              After payment, your order will be confirmed and you'll receive
              real-time status updates. Estimated delivery:{" "}
              <span className="font-medium text-foreground">25–40 minutes</span>
              .
            </p>
          </motion.div>
        </div>

        {/* Right: Order recap */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="bg-card rounded-2xl border border-border p-5 sticky top-24"
            data-ocid="checkout.order_summary"
          >
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">
              Order Summary
            </h2>

            {placeOrderMutation.isPending ? (
              <div className="space-y-3" data-ocid="checkout.items_loading">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-3 py-2">
                    <Skeleton className="w-14 h-14 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div data-ocid="checkout.items_list">
                {items.map((item, index) => (
                  <OrderLineItem
                    key={item.id}
                    name={item.name}
                    size={item.size}
                    crust={item.crust}
                    addOns={item.addOns}
                    quantity={item.quantity}
                    totalPrice={item.totalPrice}
                    imageUrl={item.imageUrl}
                    index={index + 1}
                  />
                ))}
              </div>
            )}

            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
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
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-base text-foreground">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
