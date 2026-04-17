import { Button } from "@/components/ui/button";
import { useActor } from "@caffeineai/core-infrastructure";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createActor } from "../backend";
import type { OrderOut } from "../backend.d";

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const { actor, isFetching } = useActor(createActor);

  const search = useSearch({ strict: false }) as {
    payment_intent?: string;
    session_id?: string;
  };
  const paymentIntentId = search.payment_intent ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [order, setOrder] = useState<OrderOut | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current || isFetching || !actor) return;
    hasVerified.current = true;

    const orderId = localStorage.getItem("pendingOrderId");

    if (!orderId) {
      // No pending order — navigate to orders list (payment may have been processed already)
      setStatus("success");
      return;
    }

    const verify = async () => {
      try {
        const success = await actor.verifyAndConfirmOrder(
          orderId,
          paymentIntentId,
        );
        if (success) {
          localStorage.removeItem("pendingOrderId");
          // Fetch the confirmed order for summary display
          const confirmed = await actor.getOrder(orderId);
          setOrder(confirmed);
          setStatus("success");
          // Navigate to order tracking after a short delay
          setTimeout(() => {
            void navigate({
              to: "/orders/$orderId",
              params: { orderId },
            });
          }, 3500);
        } else {
          setErrorMsg(
            "Payment verification failed — order could not be confirmed.",
          );
          setStatus("error");
        }
      } catch (err) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Verification failed. Please contact support.",
        );
        setStatus("error");
      }
    };

    void verify();
  }, [actor, isFetching, paymentIntentId, navigate]);

  const handleRetry = () => {
    hasVerified.current = false;
    setStatus("loading");
    setErrorMsg("");
  };

  if (status === "loading") {
    return (
      <div
        className="max-w-lg mx-auto px-4 py-20 text-center"
        data-ocid="payment_success.loading_state"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Verifying Payment…
            </h1>
            <p className="text-muted-foreground">
              Please wait while we confirm your order.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className="max-w-lg mx-auto px-4 py-20 text-center"
        data-ocid="payment_success.error_state"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-12 h-12 text-destructive" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Verification Failed
            </h1>
            <p className="text-muted-foreground">{errorMsg}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              className="bg-primary text-primary-foreground"
              onClick={handleRetry}
              data-ocid="payment_success.retry_button"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Retry Verification
            </Button>
            <Button
              variant="outline"
              onClick={() => void navigate({ to: "/orders" })}
              data-ocid="payment_success.view_orders_button"
            >
              View My Orders
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="max-w-lg mx-auto px-4 py-20 text-center"
      data-ocid="payment_success.page"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="space-y-6"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 18,
            delay: 0.1,
          }}
          className="w-24 h-24 rounded-full bg-primary/15 flex items-center justify-center mx-auto"
        >
          <CheckCircle2 className="w-12 h-12 text-primary" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
        >
          <h1 className="font-display text-4xl font-bold text-foreground mb-3">
            Order Confirmed!
          </h1>
          <p className="text-muted-foreground text-lg">
            Your payment was successful. Your delicious order is being prepared!
          </p>
        </motion.div>

        {order && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.4 }}
            className="bg-card border border-border rounded-2xl px-6 py-4 text-left space-y-2"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono font-semibold text-foreground">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Items</span>
              <span className="font-medium text-foreground">
                {order.items.length}{" "}
                {order.items.length === 1 ? "item" : "items"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-primary">
                ${(Number(order.total) / 100).toFixed(2)}
              </span>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.5 }}
          className="bg-card border border-border rounded-2xl px-6 py-5 text-left space-y-3"
        >
          {[
            { label: "Order received & confirmed", active: true },
            { label: "Preparing your food", active: false },
            { label: "Out for delivery", active: false },
          ].map((step) => (
            <div key={step.label} className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  step.active
                    ? "bg-primary animate-pulse"
                    : "bg-muted-foreground/30"
                }`}
              />
              <span
                className={`text-sm ${
                  step.active
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Button
            className="flex-1 bg-primary text-primary-foreground font-semibold"
            onClick={() => void navigate({ to: "/orders" })}
            data-ocid="payment_success.track_order_button"
          >
            Track Your Order
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => void navigate({ to: "/menu" })}
            data-ocid="payment_success.back_to_menu_button"
          >
            <ShoppingBag className="w-4 h-4 mr-1.5" />
            Order More
          </Button>
        </motion.div>

        <p className="text-xs text-muted-foreground">
          Redirecting to order tracking…
        </p>
      </motion.div>
    </div>
  );
}

export function PaymentCancelPage() {
  const navigate = useNavigate();

  return (
    <div
      className="max-w-lg mx-auto px-4 py-20 text-center"
      data-ocid="payment_cancel.page"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto">
          <ShoppingBag className="w-12 h-12 text-muted-foreground" />
        </div>

        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">
            Payment Cancelled
          </h1>
          <p className="text-muted-foreground">
            No worries — your cart is still saved. You can return whenever
            you're ready.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            className="flex-1 bg-primary text-primary-foreground font-semibold"
            onClick={() => void navigate({ to: "/checkout" })}
            data-ocid="payment_cancel.retry_button"
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => void navigate({ to: "/cart" })}
            data-ocid="payment_cancel.back_to_cart_button"
          >
            Back to Cart
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
