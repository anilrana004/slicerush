import { useAuth } from "@/hooks/use-auth";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import {
  ClipboardList,
  Image,
  LayoutDashboard,
  LogOut,
  Package,
  Tag,
  Users,
} from "lucide-react";
import { motion } from "motion/react";

const adminNavItems = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
    ocid: "admin_nav.dashboard_link",
  },
  {
    label: "Products",
    path: "/admin/products",
    icon: Package,
    ocid: "admin_nav.products_link",
  },
  {
    label: "Coupons",
    path: "/admin/coupons",
    icon: Tag,
    ocid: "admin_nav.coupons_link",
  },
  {
    label: "Banners",
    path: "/admin/banners",
    icon: Image,
    ocid: "admin_nav.banners_link",
  },
  {
    label: "Orders",
    path: "/admin/orders",
    icon: ClipboardList,
    ocid: "admin_nav.orders_link",
  },
  {
    label: "Users",
    path: "/admin/users",
    icon: Users,
    ocid: "admin_nav.users_link",
  },
];

export function AdminLayout() {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const handleLogout = () => {
    logout();
    void navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background flex" data-ocid="admin.layout">
      {/* Sidebar */}
      <aside
        className="w-56 shrink-0 bg-card border-r border-border flex flex-col sticky top-0 h-screen"
        data-ocid="admin.sidebar"
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-border">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 font-display font-bold text-lg"
            onClick={() => void navigate({ to: "/admin" })}
            data-ocid="admin.logo_link"
          >
            <img
              src="/assets/generated/slicerush-icon-transparent.dim_120x120.png"
              alt="SliceRush"
              className="w-7 h-7 object-contain"
            />
            <span className="text-primary">Slice</span>
            <span className="text-foreground -ml-1">Rush</span>
          </motion.button>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider pl-0.5">
            Admin Panel
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5" data-ocid="admin.nav">
          {adminNavItems.map(({ label, path, icon: Icon, ocid }) => {
            const isActive =
              path === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(path);
            return (
              <button
                key={path}
                type="button"
                onClick={() => void navigate({ to: path })}
                data-ocid={ocid}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="px-3 py-4 border-t border-border">
          {profile && (
            <div className="px-3 py-2 mb-2">
              <p className="text-xs font-medium text-foreground truncate">
                {profile.name}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Administrator
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-smooth"
            data-ocid="admin.logout_button"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
