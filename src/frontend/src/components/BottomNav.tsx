import { useAuth } from "@/hooks/use-auth";
import { Role } from "@/store/auth";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ClipboardList, Home, Package, Truck, User } from "lucide-react";
import { motion } from "motion/react";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  ocid: string;
}

const customerNav: NavItem[] = [
  { label: "Menu", icon: Home, path: "/menu", ocid: "bottom_nav.menu" },
  { label: "Cart", icon: Package, path: "/cart", ocid: "bottom_nav.cart" },
  {
    label: "Orders",
    icon: ClipboardList,
    path: "/orders",
    ocid: "bottom_nav.orders",
  },
  {
    label: "Profile",
    icon: User,
    path: "/profile",
    ocid: "bottom_nav.profile",
  },
];

const partnerNav: NavItem[] = [
  {
    label: "Dashboard",
    icon: Truck,
    path: "/partner",
    ocid: "bottom_nav.partner",
  },
  {
    label: "Profile",
    icon: User,
    path: "/profile",
    ocid: "bottom_nav.profile",
  },
];

export function BottomNav() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const isPartner = profile?.role === Role.delivery_partner;
  const navItems = isPartner ? partnerNav : customerNav;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border md:hidden"
      data-ocid="bottom_nav"
    >
      <div className="flex items-stretch h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <motion.button
              key={item.path}
              type="button"
              whileTap={{ scale: 0.88 }}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors duration-200 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => void navigate({ to: item.path })}
              data-ocid={item.ocid}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              {item.label}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
