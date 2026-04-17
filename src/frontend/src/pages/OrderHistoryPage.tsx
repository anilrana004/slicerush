import { ReviewModal } from "@/components/ReviewModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCancelOrder } from "@/hooks/use-cancel-order";
import { useMyOrders } from "@/hooks/use-orders";
import { useReorder } from "@/hooks/use-reorder";
import { useOrderReview } from "@/hooks/use-reviews";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ChevronRight,
  ClipboardList,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Star,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { OrderOut } from "../backend.d";
import { OrderStatus } from "../backend.d";
import { StatusBadge } from "./OrderTrackingPage";

const CANCEL_REASONS = [
  "Changed my mind",
  "Wrong items selected",
  "Taking too long",
  "Ordered by mistake",
];

function formatPrice(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

function formatDate(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  const d = new Date(ms);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function itemsSummary(order: OrderOut): string {
  if (order.items.length === 0) return "No items";
  const first = order.items[0];
  const rest = order.items.length - 1;
  let label = `${String(first.quantity)}x ${first.productName}`;
  if (rest > 0) label += ` +${rest} more`;
  return label;
}

function OrderRowSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
      <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

const ACTIVE_STATUSES = new Set([
  OrderStatus.placed,
  OrderStatus.confirmed,
  OrderStatus.preparing,
  OrderStatus.out_for_delivery,
]);

const CANCELLABLE_STATUSES = new Set([
  OrderStatus.placed,
  OrderStatus.confirmed,
]);

function isActiveOrder(status: OrderStatus) {
  return ACTIVE_STATUSES.has(status);
}

function isCancellable(status: OrderStatus) {
  return CANCELLABLE_STATUSES.has(status);
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
        data-ocid="order_history.cancel_dialog"
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
            data-ocid="order_history.cancel_close_button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          This action cannot be undone. Please select a reason for cancellation.
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
              data-ocid={`order_history.cancel_reason.${CANCEL_REASONS.indexOf(r) + 1}`}
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
            data-ocid="order_history.confirm_cancel_button"
          >
            {cancelOrder.isPending ? "Cancelling…" : "Yes, Cancel Order"}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={cancelOrder.isPending}
            data-ocid="order_history.cancel_button"
          >
            Keep Order
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export function OrderHistoryPage() {
  const navigate = useNavigate();
  const { data: orders, isLoading } = useMyOrders();
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null,
  );
  const [reviewingOrderId, setReviewingOrderId] = useState<string | null>(null);

  const sorted = orders
    ? [...orders].sort((a, b) => Number(b.placedAt - a.placedAt))
    : [];

  const active = sorted.filter((o) => isActiveOrder(o.status));
  const past = sorted.filter((o) => !isActiveOrder(o.status));

  return (
    <div
      className="max-w-2xl mx-auto px-4 py-8 space-y-6"
      data-ocid="order_history.page"
    >
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-3"
      >
        <ClipboardList className="w-7 h-7 text-primary" />
        <h1 className="font-display text-2xl font-bold text-foreground">
          My Orders
        </h1>
      </motion.div>

      {isLoading && (
        <div className="space-y-3" data-ocid="order_history.loading_state">
          {["sk-1", "sk-2", "sk-3", "sk-4"].map((k) => (
            <OrderRowSkeleton key={k} />
          ))}
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center py-20 text-center space-y-4"
          data-ocid="order_history.empty_state"
        >
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground mb-1">
              No orders yet
            </h2>
            <p className="text-muted-foreground text-sm">
              Hungry? Your first order is one tap away.
            </p>
          </div>
          <Button
            className="bg-primary text-primary-foreground font-semibold"
            onClick={() => void navigate({ to: "/menu" })}
            data-ocid="order_history.browse_menu_button"
          >
            Browse Menu
          </Button>
        </motion.div>
      )}

      {/* Active orders */}
      {!isLoading && active.length > 0 && (
        <section data-ocid="order_history.active_section">
          <h2 className="font-display text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block" />
            Active Orders
          </h2>
          <div className="space-y-3">
            {active.map((order, idx) => (
              <OrderRow
                key={order.id}
                order={order}
                index={idx + 1}
                onTrack={() =>
                  void navigate({
                    to: "/orders/$orderId",
                    params: { orderId: order.id },
                  })
                }
                onCancel={
                  isCancellable(order.status)
                    ? () => setCancellingOrderId(order.id)
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* Past orders */}
      {!isLoading && past.length > 0 && (
        <section data-ocid="order_history.past_section">
          <h2 className="font-display text-base font-semibold text-muted-foreground mb-3">
            Past Orders
          </h2>
          <div className="space-y-3">
            {past.map((order, idx) => (
              <OrderRow
                key={order.id}
                order={order}
                index={active.length + idx + 1}
                onTrack={() =>
                  void navigate({
                    to: "/orders/$orderId",
                    params: { orderId: order.id },
                  })
                }
                onReview={
                  order.status === OrderStatus.delivered
                    ? () => setReviewingOrderId(order.id)
                    : undefined
                }
                showReorder={
                  order.status === OrderStatus.delivered ||
                  order.status === OrderStatus.cancelled
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* Cancel modal */}
      <AnimatePresence>
        {cancellingOrderId && (
          <CancelModal
            orderId={cancellingOrderId}
            onClose={() => setCancellingOrderId(null)}
          />
        )}
      </AnimatePresence>

      {/* Review modal */}
      <AnimatePresence>
        {reviewingOrderId && (
          <ReviewModal
            orderId={reviewingOrderId}
            onClose={() => setReviewingOrderId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ReviewButton({
  orderId,
  onClick,
}: {
  orderId: string;
  onClick: () => void;
}) {
  const { data: review, isLoading } = useOrderReview(orderId);

  if (isLoading) return null;
  if (review) {
    // Already reviewed — show read-only stars
    return (
      <div
        className="flex items-center gap-0.5"
        title={`Your rating: ${review.overallRating}/5`}
        data-ocid={`order_history.review_stars.${orderId}`}
      >
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-3.5 h-3.5 ${
              s <= review.overallRating
                ? "fill-accent text-accent"
                : "text-muted-foreground/40"
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 px-2 text-xs text-accent hover:bg-accent/10 hover:text-accent gap-1"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      data-ocid={`order_history.review_button.${orderId}`}
    >
      <Star className="w-3.5 h-3.5" />
      Review
    </Button>
  );
}

function ReorderButton({ orderId, index }: { orderId: string; index: number }) {
  const reorder = useReorder();
  const navigate = useNavigate();

  const handleReorder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await reorder.mutateAsync(orderId);
    void navigate({ to: "/cart" });
  };

  return (
    <button
      type="button"
      className="quick-reorder-btn text-xs font-medium h-7"
      disabled={reorder.isPending}
      onClick={(e) => void handleReorder(e)}
      data-ocid={`order_history.reorder_button.${index}`}
    >
      {reorder.isPending ? (
        <Loader2 className="quick-reorder-icon animate-spin" />
      ) : (
        <RefreshCw className="quick-reorder-icon" />
      )}
      {reorder.isPending ? "Adding…" : "Reorder"}
    </button>
  );
}

function OrderRow({
  order,
  index,
  onTrack,
  onCancel,
  onReview,
  showReorder,
}: {
  order: OrderOut;
  index: number;
  onTrack: () => void;
  onCancel?: () => void;
  onReview?: () => void;
  showReorder?: boolean;
}) {
  const firstImage = order.items[0]?.imageUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 hover:border-primary/40 transition-all duration-200 cursor-pointer group"
      onClick={onTrack}
      data-ocid={`order_history.item.${index}`}
    >
      {/* Thumb */}
      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
        {firstImage ? (
          <img
            src={firstImage}
            alt="order"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs text-muted-foreground">
            #{order.id.slice(0, 8).toUpperCase()}
          </span>
          <StatusBadge status={order.status} />
        </div>
        <p className="text-sm font-medium text-foreground mt-1 truncate">
          {itemsSummary(order)}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDate(order.placedAt)}
        </p>
      </div>

      {/* Price + actions */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="font-bold text-foreground text-sm">
          {formatPrice(order.total)}
        </span>
        <div
          className="flex items-center gap-1.5 flex-wrap justify-end"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          {onCancel && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              data-ocid={`order_history.cancel_button.${index}`}
            >
              Cancel
            </Button>
          )}
          {onReview && <ReviewButton orderId={order.id} onClick={onReview} />}
          {showReorder && <ReorderButton orderId={order.id} index={index} />}
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-xs group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onTrack();
            }}
            data-ocid={`order_history.track_button.${index}`}
          >
            {isActiveOrder(order.status) ? "Track" : "View"}
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
