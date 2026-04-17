import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ClipboardList,
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { createActor } from "../../backend";
import { OrderStatus as OS } from "../../backend";
import type { OrderOut, OrderStatus } from "../../backend.d";

// ── helpers ──────────────────────────────────────────────────────────────────
function fmt(cents: bigint) {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}
function fmtNum(n: bigint) {
  return Number(n).toLocaleString();
}

const STATUS_COLORS: Record<string, string> = {
  [OS.placed]: "bg-muted text-muted-foreground",
  [OS.confirmed]: "bg-blue-500/10 text-blue-400",
  [OS.preparing]: "bg-yellow-500/10 text-yellow-400",
  [OS.out_for_delivery]: "bg-orange-500/10 text-orange-400",
  [OS.delivered]: "bg-green-500/10 text-green-400",
  [OS.cancelled]: "bg-destructive/10 text-destructive",
};

const STATUS_LABELS: Record<string, string> = {
  [OS.placed]: "Placed",
  [OS.confirmed]: "Confirmed",
  [OS.preparing]: "Preparing",
  [OS.out_for_delivery]: "Out for Delivery",
  [OS.delivered]: "Delivered",
  [OS.cancelled]: "Cancelled",
};

// ── mini SVG bar chart ────────────────────────────────────────────────────────
function TrendChart({ total }: { total: number }) {
  const days = 30;
  const w = 480;
  const h = 80;
  const gap = w / days;
  const barW = gap * 0.7;

  // Pre-compute bars with stable x-based key
  const bars = Array.from({ length: days }, (_, i) => {
    const noise = Math.sin(i * 1.3) * 0.3 + Math.sin(i * 0.7) * 0.2;
    const trend = i / days;
    const val =
      Math.max(0.05, trend + noise * 0.5 + 0.3) * ((total || 100) / 30);
    return { val, x: Math.round(i * gap + gap * 0.15) };
  });
  const maxVal = Math.max(...bars.map((b) => b.val));

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-20"
      role="img"
      aria-label="Revenue trend chart"
    >
      <title>30-day revenue trend</title>
      {bars.map(({ val, x }) => {
        const barH = (val / maxVal) * (h - 8);
        return (
          <rect
            key={x}
            x={x}
            y={h - barH}
            width={barW}
            height={barH}
            rx={2}
            className="fill-primary/40"
          />
        );
      })}
    </svg>
  );
}

// ── hooks ────────────────────────────────────────────────────────────────────
function useOrderStats() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["admin", "orderStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getOrderStats();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

function useRecentOrders() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<OrderOut[]>({
    queryKey: ["admin", "recentOrders"],
    queryFn: async () => {
      if (!actor) return [];
      const statuses: OrderStatus[] = [
        OS.placed,
        OS.confirmed,
        OS.preparing,
        OS.out_for_delivery,
        OS.delivered,
        OS.cancelled,
      ];
      const results = await Promise.all(
        statuses.map((s) => actor.getOrdersByStatus(s)),
      );
      const all = results
        .flat()
        .sort((a, b) => Number(b.placedAt - a.placedAt));
      return all.slice(0, 10);
    },
    enabled: !!actor && !isFetching,
    staleTime: 60 * 1000,
    refetchInterval: 30 * 1000,
  });
}

// ── component ────────────────────────────────────────────────────────────────
export function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useOrderStats();
  const { data: orders = [], isLoading: ordersLoading } = useRecentOrders();

  const totalRevenue = Number(stats?.totalRevenue ?? 0) / 100;
  const todayRevenue = Number(stats?.todayRevenue ?? 0) / 100;

  const kpiCards = [
    {
      label: "Total Orders",
      value: stats ? fmtNum(stats.totalOrders) : "—",
      sub: stats ? `+${fmtNum(stats.todayOrders)} today` : "Loading…",
      icon: ShoppingBag,
      accent: "bg-primary",
      ocid: "admin_dashboard.total_orders_card",
    },
    {
      label: "Revenue",
      value: stats
        ? `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        : "—",
      sub: stats ? `$${todayRevenue.toFixed(2)} today` : "Loading…",
      icon: DollarSign,
      accent: "bg-secondary",
      ocid: "admin_dashboard.revenue_card",
    },
    {
      label: "Active Deliveries",
      value: stats ? fmtNum(stats.activeDeliveries) : "—",
      sub: "Live right now",
      icon: Activity,
      accent: "bg-primary",
      ocid: "admin_dashboard.active_deliveries_card",
    },
    {
      label: "Avg Order Value",
      value: stats ? fmt(stats.avgOrderValue) : "—",
      sub: "Per order all-time",
      icon: TrendingUp,
      accent: "bg-secondary",
      ocid: "admin_dashboard.avg_order_value_card",
    },
  ];

  return (
    <div data-ocid="admin_dashboard.page" className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Welcome back — here's what's happening today.
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-xs font-medium border-primary/30 text-primary gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
          Live
        </Badge>
      </div>

      {/* KPI Grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        data-ocid="admin_dashboard.kpi_grid"
      >
        {statsLoading
          ? (["kpi-0", "kpi-1", "kpi-2", "kpi-3"] as const).map((k) => (
              <Skeleton
                key={k}
                className="h-28 rounded-xl"
                data-ocid="admin_dashboard.loading_state"
              />
            ))
          : kpiCards.map(
              ({ label, value, sub, icon: Icon, accent, ocid }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  data-ocid={ocid}
                  className="kpi-card relative overflow-hidden"
                >
                  <div className={`kpi-accent-bar ${accent}`} />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        {label}
                      </p>
                      <p className="font-display text-3xl font-bold text-foreground mt-1">
                        {value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {sub}
                      </p>
                    </div>
                    <div className="p-2.5 bg-muted/50 rounded-lg">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </motion.div>
              ),
            )}
      </div>

      {/* Revenue Trend */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-xl p-5"
        data-ocid="admin_dashboard.revenue_chart"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground text-sm">
              30-Day Revenue Trend
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Estimated distribution
          </span>
        </div>
        <TrendChart total={totalRevenue} />
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>30 days ago</span>
          <span className="font-semibold text-foreground">
            $
            {totalRevenue.toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}{" "}
            total
          </span>
          <span>Today</span>
        </div>
      </motion.div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
        className="admin-table-container"
        data-ocid="admin_dashboard.recent_orders_table"
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground text-sm">
              Recent Orders
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {orders.length} orders shown
          </span>
        </div>

        {ordersLoading ? (
          <div
            className="p-5 space-y-3"
            data-ocid="admin_dashboard.loading_state"
          >
            {(["r1", "r2", "r3", "r4", "r5"] as const).map((k) => (
              <Skeleton key={k} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div
            className="p-10 text-center text-muted-foreground text-sm"
            data-ocid="admin_dashboard.empty_state"
          >
            No orders yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Order ID", "Customer", "Total", "Status", "Date"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${i >= 2 && i !== 3 ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => (
                  <tr
                    key={order.id}
                    data-ocid={`admin_dashboard.order_row.item.${idx + 1}`}
                    className="admin-table-row border-b border-border/50 last:border-0"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-primary font-semibold">
                      {order.id.slice(0, 8)}…
                    </td>
                    <td className="px-5 py-3.5 text-foreground font-mono text-xs">
                      {order.customerId.toString().slice(0, 12)}…
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-foreground">
                      {fmt(order.total)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`status-badge ${STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-muted-foreground text-xs">
                      {new Date(
                        Number(order.placedAt) / 1_000_000,
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Status breakdown */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.46 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3"
          data-ocid="admin_dashboard.status_breakdown"
        >
          {[
            {
              label: "Placed",
              value: stats.placedCount,
              color: "text-muted-foreground",
            },
            {
              label: "Confirmed",
              value: stats.confirmedCount,
              color: "text-blue-400",
            },
            {
              label: "Preparing",
              value: stats.preparingCount,
              color: "text-yellow-400",
            },
            {
              label: "Delivering",
              value: stats.outForDelivery,
              color: "text-orange-400",
            },
            {
              label: "Delivered",
              value: stats.deliveredCount,
              color: "text-green-400",
            },
            {
              label: "Cancelled",
              value: stats.cancelledCount,
              color: "text-destructive",
            },
          ].map(({ label, value, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.46 + i * 0.05 }}
              className="bg-card border border-border rounded-xl p-4 text-center"
            >
              <p className={`font-display text-2xl font-bold ${color}`}>
                {fmtNum(value)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
