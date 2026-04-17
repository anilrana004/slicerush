import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { Role } from "./backend";
import { AdminLayout } from "./components/AdminLayout";
import { Layout } from "./components/Layout";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { LoginPage } from "./pages/LoginPage";
import { MenuPage } from "./pages/MenuPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { OrderHistoryPage } from "./pages/OrderHistoryPage";
import { OrderTrackingPage } from "./pages/OrderTrackingPage";
import { PartnerDashboard } from "./pages/PartnerDashboard";
import { PartnerOrderDetailPage } from "./pages/PartnerOrderDetailPage";
import {
  PaymentCancelPage,
  PaymentSuccessPage,
} from "./pages/PaymentStatusPages";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminBannersPage } from "./pages/admin/AdminBannersPage";
import { AdminCoupons } from "./pages/admin/AdminCoupons";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminOrders } from "./pages/admin/AdminOrders";
import { AdminProducts } from "./pages/admin/AdminProducts";
import { AdminReviewsPage } from "./pages/admin/AdminReviewsPage";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { useAuthStore } from "./store/auth";

function NotFoundPage() {
  return (
    <div className="p-8 text-center text-muted-foreground font-body">
      <h1 className="font-display text-2xl font-bold text-foreground mb-2">
        404
      </h1>
      <p>Page not found.</p>
    </div>
  );
}

// Helper to get auth state outside of hooks (for loader context)
function getAuthState() {
  return useAuthStore.getState();
}

// Root route
const rootRoute = createRootRoute({
  component: Outlet,
});

// Public layout (no header/footer — used by /login, /payment-success, /payment-cancel)
const publicLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "public",
  component: Outlet,
});

// App layout — protected routes use this
const appLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: Layout,
  beforeLoad: () => {
    const { profile, isProfileChecked } = getAuthState();
    if (isProfileChecked && !profile) {
      throw redirect({ to: "/login" });
    }
  },
});

// Admin layout — admin-only routes
const adminLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "admin",
  component: AdminLayout,
  beforeLoad: () => {
    const { profile, isProfileChecked } = getAuthState();
    if (isProfileChecked && !profile) {
      throw redirect({ to: "/login" });
    }
    if (isProfileChecked && profile?.role !== Role.admin) {
      throw redirect({ to: "/menu" });
    }
  },
});

// /login
const loginRoute = createRoute({
  getParentRoute: () => publicLayout,
  path: "/login",
  component: LoginPage,
});

// /payment-success — Stripe callback (public, no auth needed)
const paymentSuccessRoute = createRoute({
  getParentRoute: () => publicLayout,
  path: "/payment-success",
  component: PaymentSuccessPage,
});

// /payment-cancel — Stripe cancel callback (public)
const paymentCancelRoute = createRoute({
  getParentRoute: () => publicLayout,
  path: "/payment-cancel",
  component: PaymentCancelPage,
});

// /
const indexRoute = createRoute({
  getParentRoute: () => publicLayout,
  path: "/",
  beforeLoad: () => {
    const { profile } = getAuthState();
    if (profile?.role === Role.admin) {
      throw redirect({ to: "/admin" });
    }
    if (profile?.role === Role.delivery_partner) {
      throw redirect({ to: "/partner" });
    }
    if (profile) {
      throw redirect({ to: "/menu" });
    }
    throw redirect({ to: "/login" });
  },
  component: () => null,
});

// /menu — customer only
const menuRoute = createRoute({
  getParentRoute: () => appLayout,
  path: "/menu",
  component: MenuPage,
  beforeLoad: () => {
    const { profile, isProfileChecked } = getAuthState();
    if (isProfileChecked && profile?.role === Role.delivery_partner) {
      throw redirect({ to: "/partner" });
    }
    if (isProfileChecked && profile?.role === Role.admin) {
      throw redirect({ to: "/admin" });
    }
  },
});

// /cart — customer only
const cartRoute = createRoute({
  getParentRoute: () => appLayout,
  path: "/cart",
  component: CartPage,
  beforeLoad: () => {
    const { profile, isProfileChecked } = getAuthState();
    if (isProfileChecked && profile?.role === Role.delivery_partner) {
      throw redirect({ to: "/partner" });
    }
  },
});

// /checkout — customer only
const checkoutRoute = createRoute({
  getParentRoute: () => appLayout,
  path: "/checkout",
  component: CheckoutPage,
  beforeLoad: () => {
    const { profile, isProfileChecked } = getAuthState();
    if (isProfileChecked && profile?.role === Role.delivery_partner) {
      throw redirect({ to: "/partner" });
    }
  },
});

// /orders — order history, customer only
const ordersRoute = createRoute({
  getParentRoute: () => appLayout,
  path: "/orders",
  component: OrderHistoryPage,
  beforeLoad: () => {
    const { profile, isProfileChecked } = getAuthState();
    if (isProfileChecked && profile?.role === Role.delivery_partner) {
      throw redirect({ to: "/partner" });
    }
  },
});

// /orders/$orderId — order tracking, customer only
const orderTrackingRoute = createRoute({
  getParentRoute: () => appLayout,
  path: "/orders/$orderId",
  component: OrderTrackingPage,
  beforeLoad: () => {
    const { profile, isProfileChecked } = getAuthState();
    if (isProfileChecked && profile?.role === Role.delivery_partner) {
      throw redirect({ to: "/partner" });
    }
  },
});

// /profile — customer only
const profileRoute = createRoute({
  getParentRoute: () => appLayout,
  path: "/profile",
  component: ProfilePage,
  beforeLoad: () => {
    const { profile, isProfileChecked } = getAuthState();
    if (isProfileChecked && profile?.role === Role.delivery_partner) {
      throw redirect({ to: "/partner" });
    }
    if (isProfileChecked && profile?.role === Role.admin) {
      throw redirect({ to: "/admin" });
    }
  },
});

// /notifications — all authenticated users
const notificationsRoute = createRoute({
  getParentRoute: () => appLayout,
  path: "/notifications",
  component: NotificationsPage,
});

// /partner — delivery_partner only
const partnerRoute = createRoute({
  getParentRoute: () => appLayout,
  path: "/partner",
  component: PartnerDashboard,
  beforeLoad: () => {
    const { profile, isProfileChecked } = getAuthState();
    if (isProfileChecked && profile?.role !== Role.delivery_partner) {
      throw redirect({ to: "/menu" });
    }
  },
});

// /partner/$orderId — partner order detail
const partnerOrderDetailRoute = createRoute({
  getParentRoute: () => appLayout,
  path: "/partner/$orderId",
  component: PartnerOrderDetailPage,
  beforeLoad: () => {
    const { profile, isProfileChecked } = getAuthState();
    if (isProfileChecked && profile?.role !== Role.delivery_partner) {
      throw redirect({ to: "/menu" });
    }
  },
});

// /menu/$productId — product detail, customer only
const productDetailRoute = createRoute({
  getParentRoute: () => appLayout,
  path: "/menu/$productId",
  component: ProductDetailPage,
  beforeLoad: () => {
    const { profile, isProfileChecked } = getAuthState();
    if (isProfileChecked && profile?.role === Role.delivery_partner) {
      throw redirect({ to: "/partner" });
    }
  },
});

// Admin routes
const adminDashboardRoute = createRoute({
  getParentRoute: () => adminLayout,
  path: "/admin",
  component: AdminDashboard,
});

const adminProductsRoute = createRoute({
  getParentRoute: () => adminLayout,
  path: "/admin/products",
  component: AdminProducts,
});

const adminCouponsRoute = createRoute({
  getParentRoute: () => adminLayout,
  path: "/admin/coupons",
  component: AdminCoupons,
});

const adminOrdersRoute = createRoute({
  getParentRoute: () => adminLayout,
  path: "/admin/orders",
  component: AdminOrders,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => adminLayout,
  path: "/admin/users",
  component: AdminUsers,
});

const adminReviewsRoute = createRoute({
  getParentRoute: () => adminLayout,
  path: "/admin/reviews",
  component: AdminReviewsPage,
});

const adminBannersRoute = createRoute({
  getParentRoute: () => adminLayout,
  path: "/admin/banners",
  component: AdminBannersPage,
});

// 404
const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "*",
  component: NotFoundPage,
});

const routeTree = rootRoute.addChildren([
  publicLayout.addChildren([
    loginRoute,
    indexRoute,
    paymentSuccessRoute,
    paymentCancelRoute,
  ]),
  appLayout.addChildren([
    menuRoute,
    productDetailRoute,
    cartRoute,
    checkoutRoute,
    ordersRoute,
    orderTrackingRoute,
    profileRoute,
    notificationsRoute,
    partnerRoute,
    partnerOrderDetailRoute,
  ]),
  adminLayout.addChildren([
    adminDashboardRoute,
    adminProductsRoute,
    adminCouponsRoute,
    adminOrdersRoute,
    adminUsersRoute,
    adminReviewsRoute,
    adminBannersRoute,
  ]),
  notFoundRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
