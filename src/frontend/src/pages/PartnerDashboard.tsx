import type { OrderOut } from "@/backend.d";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAcceptOrder,
  useAvailableOrders,
  useMyAssignedOrders,
  usePartnerStats,
  useRejectOrder,
  useUpdateOrderStatus,
} from "@/hooks/use-partner";
import { OrderStatus } from "@/hooks/use-partner";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  Package,
  Truck,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

// ─── Status badge ────────────────────────────────────────────────────────────
function statusColor(status: OrderStatus) {
  switch (status) {
    case OrderStatus.placed:
      return "bg-muted text-muted-foreground";
    case OrderStatus.confirmed:
      return "bg-primary/20 text-primary border-primary/30";
    case OrderStatus.preparing:
      return "bg-accent/20 text-accent-foreground border-accent/30";
    case OrderStatus.out_for_delivery:
      return "bg-secondary/20 text-secondary-foreground border-secondary/30";
    case OrderStatus.delivered:
      return "bg-emerald-600/20 text-emerald-400 border-emerald-600/30";
    case OrderStatus.cancelled:
      return "bg-destructive/20 text-destructive border-destructive/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function statusLabel(status: OrderStatus) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Confirm modal ───────────────────────────────────────────────────────────
function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  variant = "primary",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  variant?: "primary" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      data-ocid="confirm.dialog"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl"
      >
        <h3 className="font-display font-bold text-lg text-foreground mb-2">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">{body}</p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            data-ocid="confirm.cancel_button"
          >
            Cancel
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            className="flex-1"
            onClick={onConfirm}
            data-ocid="confirm.confirm_button"
          >
            {confirmLabel}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Stats bar ───────────────────────────────────────────────────────────────
function StatsBar() {
  const { data, isLoading } = usePartnerStats();

  const stats = [
    {
      icon: CheckCircle2,
      label: "Total Delivered",
      value: data ? Number(data.totalDelivered) : "-",
      color: "text-emerald-400",
    },
    {
      icon: Truck,
      label: "Active Orders",
      value: data ? Number(data.activeOrders) : "-",
      color: "text-primary",
    },
    {
      icon: Clock,
      label: "Today's Deliveries",
      value: data ? Number(data.todayDeliveries) : "-",
      color: "text-accent-foreground",
    },
  ];

  return (
    <div
      className="grid grid-cols-3 gap-3 mb-6"
      data-ocid="partner.stats_panel"
    >
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <Card
            key={s.label}
            className="bg-card border-border p-4 flex flex-col gap-2"
          >
            <div className={`flex items-center gap-2 ${s.color}`}>
              <Icon className="w-4 h-4" />
              <span className="text-xs font-medium text-muted-foreground">
                {s.label}
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <span className="font-display font-bold text-2xl text-foreground">
                {s.value}
              </span>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ─── Available order card ─────────────────────────────────────────────────────
function AvailableOrderCard({
  order,
  index,
}: {
  order: OrderOut;
  index: number;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { mutate: accept, isPending } = useAcceptOrder();
  const navigate = useNavigate();

  const placed = new Date(Number(order.placedAt) / 1_000_000);
  const elapsed = Math.floor((Date.now() - placed.getTime()) / 60000);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.07, duration: 0.35, ease: "easeOut" }}
        data-ocid={`partner.available_order.item.${index + 1}`}
      >
        <Card className="bg-card border-border rounded-2xl p-4 hover:border-primary/40 transition-colors duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-display font-semibold text-foreground text-sm truncate">
                  Order #{order.id.slice(-6).toUpperCase()}
                </span>
                <Badge className="text-[10px] h-5 bg-muted text-muted-foreground border-0 shrink-0">
                  {elapsed}m ago
                </Badge>
              </div>
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-2">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                <span className="line-clamp-2 min-w-0">
                  {order.deliveryAddress}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  {order.items.length} item
                  {order.items.length !== 1 ? "s" : ""}
                </span>
                <span className="font-semibold text-foreground">
                  ${(Number(order.total) / 100).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Button
                size="sm"
                className="h-8 text-xs px-3"
                onClick={() => setConfirmOpen(true)}
                disabled={isPending}
                data-ocid={`partner.available_order.accept_button.${index + 1}`}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs px-3 text-muted-foreground"
                onClick={() =>
                  void navigate({
                    to: "/partner/$orderId",
                    params: { orderId: order.id },
                  })
                }
                data-ocid={`partner.available_order.detail_button.${index + 1}`}
              >
                Details
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      <AnimatePresence>
        <ConfirmModal
          open={confirmOpen}
          title="Accept this order?"
          body={`You'll be responsible for delivering Order #${order.id.slice(-6).toUpperCase()} to ${order.deliveryAddress}.`}
          confirmLabel="Accept Order"
          onConfirm={() => {
            accept(order.id);
            setConfirmOpen(false);
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      </AnimatePresence>
    </>
  );
}

// ─── Assigned order card ──────────────────────────────────────────────────────
function AssignedOrderCard({
  order,
  index,
}: {
  order: OrderOut;
  index: number;
}) {
  const [rejectConfirm, setRejectConfirm] = useState(false);
  const [flash, setFlash] = useState(false);
  const { mutate: reject, isPending: rejecting } = useRejectOrder();
  const { mutate: updateStatus, isPending: updating } = useUpdateOrderStatus();
  const navigate = useNavigate();

  const canReject =
    order.status !== OrderStatus.out_for_delivery &&
    order.status !== OrderStatus.delivered &&
    order.status !== OrderStatus.cancelled;

  const nextAction: {
    label: string;
    nextStatus: OrderStatus;
    ocid: string;
  } | null = (() => {
    switch (order.status) {
      case OrderStatus.confirmed:
        return {
          label: "Start Preparing",
          nextStatus: OrderStatus.preparing,
          ocid: `partner.assigned_order.start_preparing.${index + 1}`,
        };
      case OrderStatus.preparing:
        return {
          label: "Out for Delivery",
          nextStatus: OrderStatus.out_for_delivery,
          ocid: `partner.assigned_order.out_for_delivery.${index + 1}`,
        };
      case OrderStatus.out_for_delivery:
        return {
          label: "Mark Delivered",
          nextStatus: OrderStatus.delivered,
          ocid: `partner.assigned_order.mark_delivered.${index + 1}`,
        };
      default:
        return null;
    }
  })();

  function handleStatusUpdate(nextStatus: OrderStatus) {
    updateStatus(
      { orderId: order.id, status: nextStatus },
      {
        onSuccess: () => {
          setFlash(true);
          setTimeout(() => setFlash(false), 800);
        },
      },
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.07, duration: 0.35, ease: "easeOut" }}
        data-ocid={`partner.assigned_order.item.${index + 1}`}
      >
        <motion.div
          animate={
            flash
              ? { backgroundColor: "oklch(0.65 0.19 28 / 0.12)" }
              : { backgroundColor: "transparent" }
          }
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="rounded-2xl"
        >
          <Card className="bg-card border-border rounded-2xl p-4 hover:border-primary/40 transition-colors duration-200">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-display font-semibold text-foreground text-sm">
                    Order #{order.id.slice(-6).toUpperCase()}
                  </span>
                  <Badge
                    className={`text-[10px] h-5 border ${statusColor(order.status)}`}
                  >
                    {statusLabel(order.status)}
                  </Badge>
                </div>
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                  <span className="line-clamp-1 min-w-0">
                    {order.deliveryAddress}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs px-2 text-muted-foreground shrink-0"
                onClick={() =>
                  void navigate({
                    to: "/partner/$orderId",
                    params: { orderId: order.id },
                  })
                }
                data-ocid={`partner.assigned_order.detail_button.${index + 1}`}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {nextAction && (
                <Button
                  size="sm"
                  className="h-8 text-xs px-3 flex-1"
                  onClick={() => handleStatusUpdate(nextAction.nextStatus)}
                  disabled={updating}
                  data-ocid={nextAction.ocid}
                >
                  {nextAction.label}
                </Button>
              )}
              {canReject && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setRejectConfirm(true)}
                  disabled={rejecting}
                  data-ocid={`partner.assigned_order.reject_button.${index + 1}`}
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Reject
                </Button>
              )}
              {order.status === OrderStatus.delivered && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Delivered
                </span>
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        <ConfirmModal
          open={rejectConfirm}
          title="Reject this order?"
          body={`Order #${order.id.slice(-6).toUpperCase()} will be returned to the available pool. This action cannot be undone.`}
          confirmLabel="Reject Order"
          variant="destructive"
          onConfirm={() => {
            reject(order.id);
            setRejectConfirm(false);
          }}
          onCancel={() => setRejectConfirm(false)}
        />
      </AnimatePresence>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function PartnerDashboard() {
  const [activeTab, setActiveTab] = useState<"available" | "assigned">(
    "available",
  );
  const { data: available = [], isLoading: loadingAvailable } =
    useAvailableOrders();
  const { data: assigned = [], isLoading: loadingAssigned } =
    useMyAssignedOrders();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl text-foreground mb-1">
          Partner Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your deliveries and track earnings
        </p>
      </div>

      {/* Stats */}
      <StatsBar />

      {/* Tabs */}
      <div
        className="flex gap-1 bg-muted/40 p-1 rounded-xl mb-6"
        data-ocid="partner.tabs"
      >
        {(["available", "assigned"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            data-ocid={`partner.tab.${tab}`}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
              activeTab === tab
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "available" ? (
              <span className="flex items-center justify-center gap-2">
                <Box className="w-4 h-4" />
                Available
                {available.length > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                    {available.length}
                  </span>
                )}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Truck className="w-4 h-4" />
                My Orders
                {assigned.length > 0 && (
                  <span className="ml-1 bg-accent text-accent-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                    {assigned.length}
                  </span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === "available" ? (
          <motion.div
            key="available"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            data-ocid="partner.available_orders_list"
          >
            {loadingAvailable ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl" />
                ))}
              </div>
            ) : available.length === 0 ? (
              <div
                className="text-center py-16"
                data-ocid="partner.available_orders.empty_state"
              >
                <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-display font-semibold text-foreground mb-1">
                  No orders available
                </p>
                <p className="text-sm text-muted-foreground">
                  New orders will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {available.map((order, i) => (
                  <AvailableOrderCard key={order.id} order={order} index={i} />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="assigned"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            data-ocid="partner.assigned_orders_list"
          >
            {loadingAssigned ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-2xl" />
                ))}
              </div>
            ) : assigned.length === 0 ? (
              <div
                className="text-center py-16"
                data-ocid="partner.assigned_orders.empty_state"
              >
                <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-display font-semibold text-foreground mb-1">
                  No assigned orders
                </p>
                <p className="text-sm text-muted-foreground">
                  Accept an available order to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assigned.map((order, i) => (
                  <AssignedOrderCard key={order.id} order={order} index={i} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
