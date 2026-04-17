import { CartDrawer } from "@/components/CartDrawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useUnreadCount,
} from "@/hooks/use-notifications";
import { Role } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CheckCheck,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingCart,
  User,
  UserCircle,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Notification } from "../types";

// ─── Relative timestamp (shared) ────────────────────────────────────────────
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
  return days < 7 ? `${days}d ago` : new Date(ms).toLocaleDateString();
}

const NOTIF_EMOJI: Record<string, string> = {
  orderConfirmed: "✅",
  orderPreparing: "🍳",
  outForDelivery: "🚴",
  orderDelivered: "🏠",
  orderCancelled: "❌",
  promoAlert: "🏷️",
  couponExpiry: "⏰",
};

// ─── Panel notification row ──────────────────────────────────────────────────
function PanelNotifRow({
  notif,
  onMarkRead,
  onNavigate,
}: {
  notif: Notification;
  onMarkRead: (id: string) => void;
  onNavigate: () => void;
}) {
  function handleClick() {
    if (!notif.read) onMarkRead(notif.id);
    if (notif.orderId) onNavigate();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        "notification-item w-full text-left",
        notif.read ? "" : "unread",
      ].join(" ")}
      data-ocid={`header.notif_panel.item.${notif.id}`}
    >
      <span className="text-lg shrink-0">
        {NOTIF_EMOJI[notif.notifType] ?? "🔔"}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p
            className={[
              "text-xs font-semibold truncate",
              notif.read ? "text-muted-foreground" : "text-foreground",
            ].join(" ")}
          >
            {notif.title}
          </p>
          <span className="text-[10px] text-muted-foreground/50 shrink-0">
            {relativeTime(notif.createdAt)}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
          {notif.message}
        </p>
        {notif.orderId && (
          <div className="flex items-center gap-1 mt-0.5">
            <Package className="w-2.5 h-2.5 text-primary/60" />
            <span className="text-[10px] text-primary/70">View order</span>
          </div>
        )}
      </div>
      {!notif.read && (
        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-1 animate-pulse" />
      )}
    </button>
  );
}

// ─── Desktop slide-out notification panel ────────────────────────────────────
function NotificationPanel({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { data: notifications, isLoading } = useNotifications();
  const { mutate: markRead } = useMarkRead();
  const { mutate: markAllRead, isPending: markingAll } = useMarkAllRead();

  const sorted = [...(notifications ?? [])]
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    .slice(0, 5);

  const unread = (notifications ?? []).filter((n) => !n.read).length;

  function goToOrder(orderId: string) {
    void navigate({ to: "/orders/$orderId", params: { orderId } });
    onClose();
  }

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 32 }}
      className="notification-panel"
      data-ocid="header.notif_panel"
    >
      {/* Panel header */}
      <div className="notification-header">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <span className="font-display font-semibold text-sm text-foreground">
            Notifications
          </span>
          {unread > 0 && (
            <Badge className="bg-primary text-primary-foreground text-[10px] h-4 px-1.5">
              {unread}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllRead()}
              disabled={markingAll}
              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
              data-ocid="header.notif_panel.mark_all_read_button"
            >
              <CheckCheck className="w-3 h-3" />
              All read
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            aria-label="Close notifications"
            data-ocid="header.notif_panel.close_button"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Notification list */}
      <div className="notification-list">
        {isLoading ? (
          <div className="space-y-2 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/5 rounded" />
                  <Skeleton className="h-2.5 w-4/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 text-center"
            data-ocid="header.notif_panel.empty_state"
          >
            <Bell className="w-8 h-8 text-muted-foreground/20 mb-3" />
            <p className="text-sm font-semibold text-foreground">All clear!</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              No notifications yet.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {sorted.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <PanelNotifRow
                  notif={notif}
                  onMarkRead={(id) => markRead(id)}
                  onNavigate={() =>
                    notif.orderId ? goToOrder(notif.orderId) : onClose()
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer — View all */}
      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => {
            void navigate({ to: "/notifications" });
            onClose();
          }}
          data-ocid="header.notif_panel.view_all_link"
        >
          View all notifications
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────
export function Header() {
  const { isAuthenticated, profile, logout } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const cartItems = useCartStore((s) => s.items);
  const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const { data: unreadCount = 0 } = useUnreadCount();

  const isLoginPage = pathname === "/login";
  const isPartner = profile?.role === Role.delivery_partner;
  const isAdmin = profile?.role === Role.admin;
  const isCustomer = !isPartner && !isAdmin;

  // Close panel on outside click
  useEffect(() => {
    if (!isPanelOpen) return;
    function handlePointerDown(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsPanelOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isPanelOpen]);

  // Close panel on Escape
  useEffect(() => {
    if (!isPanelOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsPanelOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isPanelOpen]);

  const handleLogout = () => {
    logout();
    void navigate({ to: "/login" });
  };

  // Determine bell action based on viewport: desktop → panel, mobile → page
  function handleBellClick() {
    if (window.innerWidth >= 640) {
      setIsPanelOpen((prev) => !prev);
    } else {
      void navigate({ to: "/notifications" });
    }
  }

  return (
    <>
      <header
        className="sticky top-0 z-50 bg-card border-b border-border shadow-sm"
        data-ocid="header"
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 font-display font-bold text-xl text-foreground"
            onClick={() => {
              if (isAdmin) void navigate({ to: "/admin" });
              else if (isPartner) void navigate({ to: "/partner" });
              else void navigate({ to: "/menu" });
            }}
            data-ocid="header.logo_link"
          >
            <img
              src="/assets/generated/slicerush-icon-transparent.dim_120x120.png"
              alt="SliceRush"
              className="w-8 h-8 object-contain"
            />
            <span className="text-primary">Slice</span>
            <span className="text-accent-foreground -ml-1">Rush</span>
          </motion.button>

          {/* Nav links (desktop) */}
          {isAuthenticated && !isLoginPage && (
            <nav
              className="hidden md:flex items-center gap-6 text-sm font-medium"
              data-ocid="header.nav"
            >
              {isCustomer && (
                <>
                  <button
                    type="button"
                    onClick={() => void navigate({ to: "/menu" })}
                    className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                    data-ocid="header.nav.menu_link"
                  >
                    Menu
                  </button>
                  <button
                    type="button"
                    onClick={() => void navigate({ to: "/orders" })}
                    className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                    data-ocid="header.nav.orders_link"
                  >
                    Orders
                  </button>
                </>
              )}
              {isPartner && (
                <button
                  type="button"
                  onClick={() => void navigate({ to: "/partner" })}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                  data-ocid="header.nav.partner_link"
                >
                  Dashboard
                </button>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => void navigate({ to: "/admin" })}
                  className="flex items-center gap-1.5 text-primary hover:text-primary/80 font-semibold transition-colors duration-200"
                  data-ocid="header.nav.admin_link"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Admin Panel
                </button>
              )}
            </nav>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            {isAuthenticated && !isLoginPage && (
              <div ref={panelRef} className="relative">
                <motion.button
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.93 }}
                  className={[
                    "relative p-2 rounded-full transition-colors duration-200",
                    isPanelOpen
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-foreground",
                  ].join(" ")}
                  onClick={handleBellClick}
                  aria-label="Notifications"
                  aria-expanded={isPanelOpen}
                  data-ocid="header.notifications_button"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <Badge
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-accent text-accent-foreground"
                      data-ocid="header.notifications_badge"
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Badge>
                  )}
                </motion.button>

                {/* Desktop panel (rendered inside button wrapper for outside-click detection) */}
                <AnimatePresence>
                  {isPanelOpen && (
                    <NotificationPanel onClose={() => setIsPanelOpen(false)} />
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Cart button — customers only */}
            {isAuthenticated && isCustomer && !isLoginPage && (
              <motion.button
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.93 }}
                className="relative p-2 rounded-full hover:bg-muted transition-colors duration-200"
                onClick={() => setIsCartOpen(true)}
                aria-label="Cart"
                data-ocid="header.cart_button"
              >
                <ShoppingCart className="w-5 h-5 text-foreground" />
                {totalItems > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground"
                    data-ocid="header.cart_badge"
                  >
                    {totalItems}
                  </Badge>
                )}
              </motion.button>
            )}

            {/* Profile dropdown — customers only */}
            {isAuthenticated && isCustomer && !isLoginPage && (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-full hover:bg-muted transition-colors duration-200"
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  aria-label="Profile menu"
                  aria-expanded={profileMenuOpen}
                  data-ocid="header.profile_button"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {(profile?.name ?? "U")
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${profileMenuOpen ? "rotate-180" : ""}`}
                  />
                </motion.button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-lg py-1.5 z-50"
                      data-ocid="header.profile_dropdown"
                      onMouseLeave={() => setProfileMenuOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-border mb-1">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {profile?.name || "Your Profile"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {profile?.phone || "No phone set"}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted/60 transition-colors duration-150"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          void navigate({ to: "/profile" });
                        }}
                        data-ocid="header.profile_dropdown.profile_link"
                      >
                        <UserCircle className="w-4 h-4 text-muted-foreground" />
                        View Profile
                      </button>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted/60 transition-colors duration-150"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          void navigate({ to: "/orders" });
                        }}
                        data-ocid="header.profile_dropdown.orders_link"
                      >
                        <User className="w-4 h-4 text-muted-foreground" />
                        My Orders
                      </button>
                      <div className="border-t border-border mt-1 pt-1">
                        <button
                          type="button"
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors duration-150"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            handleLogout();
                          }}
                          data-ocid="header.profile_dropdown.logout_button"
                        >
                          <LogOut className="w-4 h-4" />
                          Log Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Logout — non-customer authenticated users only */}
            {isAuthenticated && !isCustomer && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
                data-ocid="header.logout_button"
              >
                <LogOut className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      {isCustomer && (
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      )}
    </>
  );
}
