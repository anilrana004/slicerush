import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
} from "@/hooks/use-notifications";
import { useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck, Package } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Notification } from "../types";

// ─── Notification Type Config ──────────────────────────────────────────────
const NOTIF_CONFIG: Record<
  string,
  { emoji: string; bg: string; border: string }
> = {
  orderConfirmed: {
    emoji: "✅",
    bg: "bg-status-delivered/10",
    border: "border-status-delivered/40",
  },
  orderPreparing: {
    emoji: "🍳",
    bg: "bg-status-preparing/10",
    border: "border-status-preparing/40",
  },
  outForDelivery: {
    emoji: "🚴",
    bg: "bg-status-confirmed/10",
    border: "border-status-confirmed/40",
  },
  orderDelivered: {
    emoji: "🏠",
    bg: "bg-primary/10",
    border: "border-primary/40",
  },
  orderCancelled: {
    emoji: "❌",
    bg: "bg-destructive/10",
    border: "border-destructive/40",
  },
  promoAlert: {
    emoji: "🏷️",
    bg: "bg-accent/10",
    border: "border-accent/40",
  },
  couponExpiry: {
    emoji: "⏰",
    bg: "bg-accent/10",
    border: "border-accent/40",
  },
};

const DEFAULT_CONFIG = {
  emoji: "🔔",
  bg: "bg-muted/40",
  border: "border-border",
};

// ─── Relative timestamp ─────────────────────────────────────────────────────
function relativeTime(createdAt: bigint): string {
  const ms = Number(createdAt) / 1_000_000;
  const diff = Date.now() - ms;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString();
}

// ─── Single notification item ────────────────────────────────────────────────
function NotifItem({
  notif,
  index,
  onMarkRead,
}: {
  notif: Notification;
  index: number;
  onMarkRead: (id: string) => void;
}) {
  const navigate = useNavigate();
  const config = NOTIF_CONFIG[notif.notifType] ?? DEFAULT_CONFIG;

  function handleClick() {
    if (!notif.read) onMarkRead(notif.id);
    if (notif.orderId) {
      void navigate({
        to: "/orders/$orderId",
        params: { orderId: notif.orderId },
      });
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.22, delay: index * 0.04 }}
      onClick={handleClick}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      className={[
        "notification-item cursor-pointer group",
        notif.read ? "" : "unread",
      ].join(" ")}
      data-ocid={`notifications.item.${index + 1}`}
    >
      {/* Left: icon bubble */}
      <div
        className={[
          "shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl",
          config.bg,
          "border",
          config.border,
        ].join(" ")}
      >
        {config.emoji}
      </div>

      {/* Middle: content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={[
              "text-sm font-semibold leading-snug truncate",
              notif.read ? "text-muted-foreground" : "text-foreground",
            ].join(" ")}
          >
            {notif.title}
          </p>
          <span className="text-[11px] text-muted-foreground/60 shrink-0 mt-0.5">
            {relativeTime(notif.createdAt)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
          {notif.message}
        </p>
        {notif.orderId && (
          <div className="flex items-center gap-1 mt-1.5">
            <Package className="w-3 h-3 text-primary/60" />
            <span className="text-[11px] text-primary/70 font-medium">
              View order
            </span>
          </div>
        )}
      </div>

      {/* Right: unread indicator */}
      {!notif.read && (
        <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2 animate-pulse" />
      )}
    </motion.div>
  );
}

// ─── Skeleton loader ─────────────────────────────────────────────────────────
function NotifSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-border/40">
      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/5 rounded" />
        <Skeleton className="h-3 w-4/5 rounded" />
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-24 text-center"
      data-ocid="notifications.empty_state"
    >
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-muted/60 flex items-center justify-center">
          <Bell className="w-10 h-10 text-muted-foreground/30" />
        </div>
        <span className="absolute -bottom-1 -right-1 text-3xl">🎉</span>
      </div>
      <p className="font-display font-bold text-xl text-foreground">
        All caught up!
      </p>
      <p className="text-sm text-muted-foreground mt-2 max-w-xs">
        No notifications yet. When your order status changes or we have deals
        for you, you'll see them here.
      </p>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const { mutate: markRead } = useMarkRead();
  const { mutate: markAllRead, isPending: markingAll } = useMarkAllRead();

  const sorted = [...(notifications ?? [])].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt),
  );
  const unread = sorted.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Page header band */}
      <div className="bg-card border-b border-border sticky top-16 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="notification-bell-badge">
              <Bell className="w-5 h-5" />
              {unread > 0 && <span className="notification-badge-dot" />}
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground leading-tight">
                Notifications
              </h1>
              <p className="text-xs text-muted-foreground">
                {unread > 0 ? `${unread} unread` : "All caught up"}
              </p>
            </div>
            {unread > 0 && (
              <Badge
                className="bg-primary text-primary-foreground text-xs"
                data-ocid="notifications.unread_badge"
              >
                {unread}
              </Badge>
            )}
          </div>

          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllRead()}
              disabled={markingAll}
              className="text-muted-foreground hover:text-foreground gap-1.5 text-xs"
              data-ocid="notifications.mark_all_read_button"
            >
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Mark all read</span>
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <NotifSkeleton key={i} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {sorted.map((notif, index) => (
                <NotifItem
                  key={notif.id}
                  notif={notif}
                  index={index}
                  onMarkRead={(id) => markRead(id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
