import { ReviewModal } from "@/components/ReviewModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCancelOrder } from "@/hooks/use-cancel-order";
import { useOrder } from "@/hooks/use-orders";
import { useOrderReview } from "@/hooks/use-reviews";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  Star,
  Truck,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { OrderStatus } from "../backend.d";

const CANCEL_REASONS = [
  "Changed my mind",
  "Wrong items selected",
  "Taking too long",
  "Ordered by mistake",
];

const STATUS_STEPS = [
  {
    key: OrderStatus.placed,
    label: "Order Placed",
    desc: "We received your order",
    icon: Package,
  },
  {
    key: OrderStatus.confirmed,
    label: "Confirmed",
    desc: "Restaurant confirmed your order",
    icon: CheckCircle2,
  },
  {
    key: OrderStatus.preparing,
    label: "Preparing",
    desc: "Chef is cooking your meal",
    icon: UtensilsCrossed,
  },
  {
    key: OrderStatus.out_for_delivery,
    label: "Out for Delivery",
    desc: "Driver is on the way",
    icon: Truck,
  },
  {
    key: OrderStatus.delivered,
    label: "Delivered",
    desc: "Enjoy your meal!",
    icon: CheckCircle2,
  },
];

const STATUS_ORDER = [
  OrderStatus.placed,
  OrderStatus.confirmed,
  OrderStatus.preparing,
  OrderStatus.out_for_delivery,
  OrderStatus.delivered,
];

const CANCELLABLE_STATUSES = new Set([
  OrderStatus.placed,
  OrderStatus.confirmed,
]);

function getStepIndex(status: OrderStatus): number {
  return STATUS_ORDER.indexOf(status);
}

function formatPrice(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

function DeliveryCountdown({ estimatedMinutes }: { estimatedMinutes: bigint }) {
  const [remaining, setRemaining] = useState(Number(estimatedMinutes));

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining((p) => Math.max(0, p - 1));
    }, 60000);
    return () => clearInterval(timer);
  }, [remaining]);

  if (remaining <= 0) {
    return <span className="text-primary font-semibold">Arriving soon!</span>;
  }

  return (
    <span className="text-primary font-semibold">~{remaining} min away</span>
  );
}

function StaticMapPin({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div className="rounded-xl overflow-hidden border border-border bg-muted h-36 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-muted-foreground text-sm">
        <MapPin className="w-6 h-6 text-primary" />
        <span>
          Driver at {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
      </div>
    </div>
  );
}

function CancelModal({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const cancelOrder = useCancelOrder();

  const handleConfirm = async () => {
    await cancelOrder.mutateAsync({ orderId, reason });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="relative z-10 bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        data-ocid="order_tracking.cancel_dialog"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
            <h3 className="font-display font-semibold text-foreground">
              Cancel Order?
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="order_tracking.cancel_close_button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Please select a reason for cancellation.
        </p>

        <div className="space-y-2 mb-5">
          {CANCEL_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all duration-150 ${
                reason === r
                  ? "border-destructive/60 bg-destructive/5 text-foreground font-medium"
                  : "border-border hover:border-border/80 text-muted-foreground hover:text-foreground"
              }`}
              data-ocid={`order_tracking.cancel_reason.${CANCEL_REASONS.indexOf(r) + 1}`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => void handleConfirm()}
            disabled={cancelOrder.isPending}
            data-ocid="order_tracking.confirm_cancel_button"
          >
            {cancelOrder.isPending ? "Cancelling…" : "Yes, Cancel Order"}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={cancelOrder.isPending}
            data-ocid="order_tracking.cancel_button"
          >
            Keep Order
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export function OrderTrackingPage() {
  const { orderId } = useParams({ strict: false });
  const navigate = useNavigate();
  const { data: order, isLoading, isError } = useOrder(orderId ?? "");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { data: existingReview } = useOrderReview(orderId ?? "");

  if (isLoading) {
    return (
      <div
        className="max-w-2xl mx-auto px-4 py-8 space-y-6"
        data-ocid="order_tracking.loading_state"
      >
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div
        className="max-w-2xl mx-auto px-4 py-16 text-center"
        data-ocid="order_tracking.error_state"
      >
        <p className="text-muted-foreground mb-4">Order not found.</p>
        <Button onClick={() => void navigate({ to: "/orders" })}>
          Back to Orders
        </Button>
      </div>
    );
  }

  const currentStepIdx = getStepIndex(order.status);
  const isCancelled = order.status === OrderStatus.cancelled;
  const canCancel = CANCELLABLE_STATUSES.has(order.status);

  return (
    <div
      className="max-w-2xl mx-auto px-4 py-8 space-y-6"
      data-ocid="order_tracking.page"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-3"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void navigate({ to: "/orders" })}
          data-ocid="order_tracking.back_button"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Track Order
          </h1>
          <p className="text-muted-foreground text-sm font-mono">
            #{order.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge status={order.status} />
          {canCancel && (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 px-2"
              onClick={() => setShowCancelModal(true)}
              data-ocid="order_tracking.cancel_order_button"
            >
              Cancel
            </Button>
          )}
        </div>
      </motion.div>

      {/* Status Timeline */}
      {!isCancelled && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6"
          data-ocid="order_tracking.timeline"
        >
          <h2 className="font-display text-lg font-semibold mb-5">
            Order Progress
          </h2>
          <div className="space-y-0">
            {STATUS_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isDone = idx < currentStepIdx;
              const isActive = idx === currentStepIdx;
              const isFuture = idx > currentStepIdx;

              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + idx * 0.07 }}
                  className="flex gap-4"
                  data-ocid={`order_tracking.step.${idx + 1}`}
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300
                        ${isDone ? "bg-primary text-primary-foreground" : ""}
                        ${isActive ? "bg-primary text-primary-foreground ring-4 ring-primary/25" : ""}
                        ${isFuture ? "bg-muted text-muted-foreground" : ""}
                      `}
                    >
                      {isActive ? (
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-foreground" />
                        </span>
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div
                        className={`w-0.5 h-8 my-1 transition-colors duration-500 ${
                          isDone ? "bg-primary" : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-6 min-w-0">
                    <p
                      className={`font-semibold text-sm ${
                        isFuture ? "text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Delivery Info */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-card border border-border rounded-2xl p-6 space-y-4"
        data-ocid="order_tracking.delivery_info"
      >
        <h2 className="font-display text-lg font-semibold">Delivery Info</h2>
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {order.deliveryAddress}
            </p>
          </div>
        </div>
        {order.status !== OrderStatus.delivered &&
          order.status !== OrderStatus.cancelled && (
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Estimated time:</p>
                <DeliveryCountdown
                  estimatedMinutes={order.estimatedDeliveryMinutes}
                />
              </div>
            </div>
          )}

        {order.status === OrderStatus.out_for_delivery &&
          order.deliveryPartnerLocation && (
            <div data-ocid="order_tracking.map_section">
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-primary" />
                Driver Location
              </p>
              <StaticMapPin
                lat={order.deliveryPartnerLocation.lat}
                lng={order.deliveryPartnerLocation.lng}
              />
            </div>
          )}
      </motion.div>

      {/* Order Summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-card border border-border rounded-2xl p-6 space-y-4"
        data-ocid="order_tracking.summary"
      >
        <h2 className="font-display text-lg font-semibold">Order Summary</h2>
        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <motion.div
              key={`${item.productId}-${item.size}-${item.crust}-${idx}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + idx * 0.06 }}
              className="flex gap-3 items-start"
              data-ocid={`order_tracking.item.${idx + 1}`}
            >
              <img
                src={item.imageUrl || "/assets/generated/food-placeholder.jpg"}
                alt={item.productName}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-muted"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/assets/generated/food-placeholder.jpg";
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
                  {item.productName}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {item.size} · {item.crust}
                  {item.addOns.length > 0 && ` · ${item.addOns.join(", ")}`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Qty: {String(item.quantity)}
                </p>
              </div>
              <span className="text-sm font-semibold text-foreground flex-shrink-0">
                {formatPrice(item.totalPrice)}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="border-t border-border pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Delivery Fee</span>
            <span>{formatPrice(order.deliveryFee)}</span>
          </div>
          {order.discountAmount > 0n && (
            <div className="flex justify-between text-primary">
              <span>
                Discount
                {order.couponCode && (
                  <span className="ml-1 text-xs opacity-70">
                    ({order.couponCode})
                  </span>
                )}
              </span>
              <span>-{formatPrice(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-foreground text-base pt-1 border-t border-border">
            <span>Total</span>
            <span className="text-primary">{formatPrice(order.total)}</span>
          </div>
        </div>
      </motion.div>

      {/* Review Section — only for delivered orders */}
      {order.status === OrderStatus.delivered && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-card border border-border rounded-2xl p-6"
          data-ocid="order_tracking.review_section"
        >
          {existingReview ? (
            <div className="flex flex-col items-center text-center gap-3 py-2">
              <p className="font-display text-base font-semibold text-foreground">
                Your Review
              </p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-6 h-6 ${
                      s <= existingReview.overallRating
                        ? "fill-accent text-accent"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              {existingReview.comment && (
                <p className="text-sm text-muted-foreground italic">
                  "{existingReview.comment}"
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Thanks for your feedback!
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-3 py-2">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="font-display text-base font-semibold text-foreground mb-1">
                  How was your order?
                </p>
                <p className="text-sm text-muted-foreground">
                  Your feedback helps us improve.
                </p>
              </div>
              <Button
                className="bg-primary text-primary-foreground font-semibold gap-2"
                onClick={() => setShowReviewModal(true)}
                data-ocid="order_tracking.leave_review_button"
              >
                <Star className="w-4 h-4" />
                Leave a Review
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {/* Cancel Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <CancelModal
            orderId={order.id}
            onClose={() => setShowCancelModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <ReviewModal
            orderId={order.id}
            onClose={() => setShowReviewModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const configs: Record<OrderStatus, { label: string; className: string }> = {
    [OrderStatus.placed]: {
      label: "Placed",
      className: "bg-muted text-muted-foreground border-border",
    },
    [OrderStatus.confirmed]: {
      label: "Confirmed",
      className:
        "bg-status-confirmed/15 text-status-confirmed border-status-confirmed/30",
    },
    [OrderStatus.preparing]: {
      label: "Preparing",
      className:
        "bg-status-preparing/15 text-status-preparing border-status-preparing/30",
    },
    [OrderStatus.out_for_delivery]: {
      label: "Out for Delivery",
      className:
        "bg-status-delivery/15 text-status-delivery border-status-delivery/30",
    },
    [OrderStatus.delivered]: {
      label: "Delivered",
      className:
        "bg-status-delivered/15 text-status-delivered border-status-delivered/30",
    },
    [OrderStatus.cancelled]: {
      label: "Cancelled",
      className: "bg-destructive/15 text-destructive border-destructive/30",
    },
  };

  const config = configs[status] ?? configs[OrderStatus.placed];
  return (
    <Badge
      variant="outline"
      className={`text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </Badge>
  );
}
