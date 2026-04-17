import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  OrderStatus,
  usePartnerOrder,
  useUpdateDeliveryLocation,
  useUpdateOrderStatus,
} from "@/hooks/use-partner";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  LocateFixed,
  MapPin,
  Package,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

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

const statusSteps = [
  OrderStatus.placed,
  OrderStatus.confirmed,
  OrderStatus.preparing,
  OrderStatus.out_for_delivery,
  OrderStatus.delivered,
];

export function PartnerOrderDetailPage() {
  const params = useParams({ strict: false });
  const orderId = params.orderId ?? "";
  const navigate = useNavigate();
  const [locating, setLocating] = useState(false);

  const { data: order, isLoading } = usePartnerOrder(orderId);
  const { mutate: updateStatus, isPending: updatingStatus } =
    useUpdateOrderStatus();
  const { mutate: updateLocation, isPending: updatingLocation } =
    useUpdateDeliveryLocation();

  const nextAction: {
    label: string;
    nextStatus: OrderStatus;
  } | null = (() => {
    if (!order) return null;
    switch (order.status) {
      case OrderStatus.confirmed:
        return { label: "Start Preparing", nextStatus: OrderStatus.preparing };
      case OrderStatus.preparing:
        return {
          label: "Out for Delivery",
          nextStatus: OrderStatus.out_for_delivery,
        };
      case OrderStatus.out_for_delivery:
        return {
          label: "Mark Delivered",
          nextStatus: OrderStatus.delivered,
        };
      default:
        return null;
    }
  })();

  function handleLocationUpdate() {
    if (!order) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateLocation(
          {
            orderId: order.id,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
          { onSettled: () => setLocating(false) },
        );
      },
      () => {
        setLocating(false);
      },
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="font-display font-semibold text-foreground mb-1">
          Order not found
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void navigate({ to: "/partner" })}
          className="mt-4"
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const currentStep = statusSteps.indexOf(order.status);
  const placedAt = new Date(Number(order.placedAt) / 1_000_000);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Back */}
      <button
        type="button"
        onClick={() => void navigate({ to: "/partner" })}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
        data-ocid="partner_order_detail.back_button"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Order header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Card className="bg-card border-border rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h1 className="font-display font-bold text-xl text-foreground">
                Order #{order.id.slice(-6).toUpperCase()}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <Clock className="w-3.5 h-3.5" />
                Placed {placedAt.toLocaleString()}
              </div>
            </div>
            <Badge
              className={`border text-xs ${statusColor(order.status)}`}
              data-ocid="partner_order_detail.status_badge"
            >
              {statusLabel(order.status)}
            </Badge>
          </div>

          {/* Progress track */}
          <div className="relative">
            <div className="flex items-center justify-between relative z-10">
              {statusSteps.map((step, i) => {
                const done = i <= currentStep;
                return (
                  <div key={step} className="flex flex-col items-center gap-1">
                    <motion.div
                      animate={done ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                        done
                          ? "bg-primary border-primary"
                          : "bg-muted border-border"
                      }`}
                    >
                      {done && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />
                      )}
                    </motion.div>
                    <span className="text-[9px] text-muted-foreground text-center leading-tight">
                      {statusLabel(step).split(" ").slice(0, 2).join(" ")}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="absolute top-3 left-3 right-3 h-[2px] bg-border -z-0" />
            <div
              className="absolute top-3 left-3 h-[2px] bg-primary transition-all duration-500"
              style={{
                width: `${(currentStep / (statusSteps.length - 1)) * 100}%`,
              }}
            />
          </div>
        </Card>
      </motion.div>

      {/* Delivery address */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.3, ease: "easeOut" }}
      >
        <Card className="bg-card border-border rounded-2xl p-5">
          <h2 className="font-display font-semibold text-base text-foreground mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Delivery Address
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {order.deliveryAddress}
          </p>
          {order.deliveryPartnerLocation && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Last location:{" "}
                <span className="text-foreground">
                  {order.deliveryPartnerLocation.lat.toFixed(4)},{" "}
                  {order.deliveryPartnerLocation.lng.toFixed(4)}
                </span>
              </p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Items */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.3, ease: "easeOut" }}
      >
        <Card className="bg-card border-border rounded-2xl p-5">
          <h2 className="font-display font-semibold text-base text-foreground mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Items ({order.items.length})
          </h2>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <motion.div
                key={`${item.productId}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.16 + i * 0.05,
                  duration: 0.25,
                  ease: "easeOut",
                }}
                className="flex items-center gap-3"
                data-ocid={`partner_order_detail.item.${i + 1}`}
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-foreground truncate">
                    {item.productName}
                  </p>
                  {(item.size || item.crust) && (
                    <p className="text-xs text-muted-foreground">
                      {[item.size, item.crust].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {item.addOns.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">
                      + {item.addOns.join(", ")}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground">
                    ${(Number(item.totalPrice) / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ×{Number(item.quantity)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="border-t border-border mt-4 pt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal</span>
              <span>${(Number(order.subtotal) / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Delivery Fee</span>
              <span>${(Number(order.deliveryFee) / 100).toFixed(2)}</span>
            </div>
            {order.discountAmount > 0n && (
              <div className="flex justify-between text-xs text-emerald-400">
                <span>Discount</span>
                <span>-${(Number(order.discountAmount) / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-display font-bold text-base text-foreground pt-1">
              <span>Total</span>
              <span>${(Number(order.total) / 100).toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3, ease: "easeOut" }}
        className="space-y-3 pb-6"
      >
        {/* Location update */}
        {order.status === OrderStatus.out_for_delivery && (
          <Button
            className="w-full h-12"
            variant="outline"
            onClick={handleLocationUpdate}
            disabled={locating || updatingLocation}
            data-ocid="partner_order_detail.update_location_button"
          >
            {locating || updatingLocation ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <LocateFixed className="w-4 h-4 mr-2 text-primary" />
            )}
            Update My Location
          </Button>
        )}

        {/* Status advance */}
        {nextAction && (
          <Button
            className="w-full h-12 font-display font-semibold text-base"
            onClick={() =>
              updateStatus({
                orderId: order.id,
                status: nextAction.nextStatus,
              })
            }
            disabled={updatingStatus}
            data-ocid="partner_order_detail.advance_status_button"
          >
            {updatingStatus ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {nextAction.label}
          </Button>
        )}

        {order.status === OrderStatus.delivered && (
          <div
            className="flex items-center justify-center gap-2 py-4 text-emerald-400"
            data-ocid="partner_order_detail.delivered_state"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-display font-semibold">Order Delivered!</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
