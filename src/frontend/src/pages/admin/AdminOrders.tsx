import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, ClipboardList } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { createActor } from "../../backend";
import { OrderStatus, Role } from "../../backend";
import type { OrderOut, UserProfile } from "../../backend.d";

// ── helpers ──────────────────────────────────────────────────────────────────
function fmt(cents: bigint) {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

function fmtDate(ns: bigint) {
  return new Date(Number(ns) / 1_000_000).toLocaleString();
}

const STATUS_LABELS: Record<string, string> = {
  [OrderStatus.placed]: "Placed",
  [OrderStatus.confirmed]: "Confirmed",
  [OrderStatus.preparing]: "Preparing",
  [OrderStatus.out_for_delivery]: "Out for Delivery",
  [OrderStatus.delivered]: "Delivered",
  [OrderStatus.cancelled]: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  [OrderStatus.placed]: "bg-muted text-muted-foreground border-muted",
  [OrderStatus.confirmed]: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  [OrderStatus.preparing]:
    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  [OrderStatus.out_for_delivery]:
    "bg-orange-500/10 text-orange-400 border-orange-500/20",
  [OrderStatus.delivered]: "bg-green-500/10 text-green-400 border-green-500/20",
  [OrderStatus.cancelled]:
    "bg-destructive/10 text-destructive border-destructive/20",
};

const ALL_STATUSES = [
  OrderStatus.placed,
  OrderStatus.confirmed,
  OrderStatus.preparing,
  OrderStatus.out_for_delivery,
  OrderStatus.delivered,
  OrderStatus.cancelled,
];

const TABS = [
  "All",
  "Placed",
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const TAB_TO_STATUS: Record<string, OrderStatus | undefined> = {
  All: undefined,
  Placed: OrderStatus.placed,
  Confirmed: OrderStatus.confirmed,
  Preparing: OrderStatus.preparing,
  "Out for Delivery": OrderStatus.out_for_delivery,
  Delivered: OrderStatus.delivered,
  Cancelled: OrderStatus.cancelled,
};

// ── hooks ─────────────────────────────────────────────────────────────────────
function useAllOrders() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<OrderOut[]>({
    queryKey: ["admin", "allOrders"],
    queryFn: async () => {
      if (!actor) return [];
      const results = await Promise.all(
        ALL_STATUSES.map((s) => actor.getOrdersByStatus(s)),
      );
      return results.flat().sort((a, b) => Number(b.placedAt - a.placedAt));
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

function useDeliveryPartners() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<UserProfile[]>({
    queryKey: ["admin", "deliveryPartners"],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getAllUsers();
      if (result.__kind__ !== "ok") return [];
      return result.ok.filter((u) => u.role === Role.delivery_partner);
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

function useAssignPartner() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      partnerId,
    }: { orderId: string; partnerId: string }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return actor.assignDeliveryPartner(orderId, partnerId as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "allOrders"] });
      toast.success("Delivery partner assigned");
    },
    onError: () => toast.error("Failed to assign partner"),
  });
}

// ── order detail panel ───────────────────────────────────────────────────────
function OrderDetailPanel({
  order,
  partners,
}: {
  order: OrderOut;
  partners: UserProfile[];
}) {
  const assign = useAssignPartner();
  const canAssign =
    order.status === OrderStatus.confirmed ||
    order.status === OrderStatus.preparing;

  return (
    <tr data-ocid={`admin_orders.detail_panel.${order.id.slice(0, 8)}`}>
      <td colSpan={8} className="bg-muted/20 px-5 py-4 border-b border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Items
            </p>
            <ul className="space-y-1">
              {order.items.map((item) => (
                <li
                  key={`${item.productId}-${item.size}`}
                  className="text-xs text-foreground flex justify-between"
                >
                  <span>
                    {item.productName} × {Number(item.quantity)}
                  </span>
                  <span className="text-muted-foreground">
                    {fmt(item.totalPrice)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Order info */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Details
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{fmt(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery fee</span>
                <span>{fmt(order.deliveryFee)}</span>
              </div>
              {!!order.discountAmount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Discount {order.couponCode ? `(${order.couponCode})` : ""}
                  </span>
                  <span className="text-green-400">
                    -{fmt(order.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1">
                <span>Total</span>
                <span>{fmt(order.total)}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              <p>Placed: {fmtDate(order.placedAt)}</p>
              <p>Updated: {fmtDate(order.updatedAt)}</p>
            </div>
          </div>

          {/* Assign partner */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Delivery
            </p>
            <p className="text-xs text-muted-foreground mb-2 break-all">
              {order.deliveryAddress}
            </p>
            {order.deliveryPartnerId && (
              <p className="text-xs text-foreground mb-2">
                Partner:{" "}
                <span className="font-mono">
                  {order.deliveryPartnerId.toString().slice(0, 12)}…
                </span>
              </p>
            )}
            {canAssign && partners.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Assign partner:
                </p>
                <Select
                  onValueChange={(pid) =>
                    assign.mutate({ orderId: order.id, partnerId: pid })
                  }
                >
                  <SelectTrigger
                    className="h-8 text-xs"
                    data-ocid={`admin_orders.assign_partner_select.${order.id.slice(0, 8)}`}
                  >
                    <SelectValue placeholder="Select partner" />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((p) => (
                      <SelectItem
                        key={p.principal.toString()}
                        value={p.principal.toString()}
                      >
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────
export function AdminOrders() {
  const { data: allOrders = [], isLoading } = useAllOrders();
  const { data: partners = [] } = useDeliveryPartners();
  const [activeTab, setActiveTab] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const statusFilter = TAB_TO_STATUS[activeTab];
  const orders = statusFilter
    ? allOrders.filter((o) => o.status === statusFilter)
    : allOrders;

  return (
    <div data-ocid="admin_orders.page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Orders
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Monitor and manage all orders across the platform.
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-xs font-semibold border-primary/30 text-primary"
        >
          {allOrders.length} total
        </Badge>
      </div>

      {/* Status tabs */}
      <div
        className="flex items-center gap-2 flex-wrap"
        data-ocid="admin_orders.filter_tabs"
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            data-ocid="admin_orders.filter.tab"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-smooth ${
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {tab}
            {tab !== "All" && TAB_TO_STATUS[tab] !== undefined && (
              <span className="ml-1.5 opacity-70">
                (
                {
                  allOrders.filter((o) => o.status === TAB_TO_STATUS[tab])
                    .length
                }
                )
              </span>
            )}
          </button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="admin-table-container"
        data-ocid="admin_orders.table"
      >
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground text-sm">
            {orders.length} Orders
          </h2>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3" data-ocid="admin_orders.loading_state">
            {(["a", "b", "c", "d", "e"] as const).map((k) => (
              <Skeleton key={k} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div
            className="p-10 text-center text-muted-foreground text-sm"
            data-ocid="admin_orders.empty_state"
          >
            No orders for this status.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[
                    "Order ID",
                    "Customer",
                    "Items",
                    "Total",
                    "Status",
                    "Date",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left last:text-right"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => (
                  <>
                    <tr
                      key={order.id}
                      data-ocid={`admin_orders.item.${idx + 1}`}
                      className="admin-table-row border-b border-border/50 cursor-pointer"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-primary">
                        {order.id.slice(0, 8)}…
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                        {order.customerId.toString().slice(0, 12)}…
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-foreground">
                        {fmt(order.total)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant="outline"
                          className={`text-xs ${STATUS_COLORS[order.status] ?? "border-muted"}`}
                        >
                          {STATUS_LABELS[order.status] ?? order.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">
                        {new Date(
                          Number(order.placedAt) / 1_000_000,
                        ).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          data-ocid={`admin_orders.expand_button.${idx + 1}`}
                          onClick={() =>
                            setExpandedId(
                              expandedId === order.id ? null : order.id,
                            )
                          }
                        >
                          {expandedId === order.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                    {expandedId === order.id && (
                      <OrderDetailPanel
                        key={`detail-${order.id}`}
                        order={order}
                        partners={partners}
                      />
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
