import type { backendInterface } from "../backend";
import {
  Crust,
  DiscountType,
  OrderStatus,
  Role,
  Size,
} from "../backend";
import type { Principal } from "@icp-sdk/core/principal";

const fakePrincipal = { toString: () => "aaaaa-aa" } as Principal;

const sampleProduct = {
  id: "prod-1",
  categoryId: "cat-1",
  ratingCount: BigInt(120),
  name: "Margherita Supreme",
  isAvailable: true,
  description: "Classic margherita with fresh basil and premium mozzarella",
  isArchived: false,
  sizes: [
    { displayName: "Small", size: Size.small, priceMultiplier: 1.0 },
    { displayName: "Medium", size: Size.medium, priceMultiplier: 1.3 },
    { displayName: "Large", size: Size.large, priceMultiplier: 1.6 },
  ],
  imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600",
  crusts: [
    { displayName: "Hand Tossed", crust: Crust.hand_tossed, extraPrice: BigInt(0) },
    { displayName: "Thin Crust", crust: Crust.thin, extraPrice: BigInt(100) },
    { displayName: "Stuffed Crust", crust: Crust.stuffed, extraPrice: BigInt(200) },
  ],
  addOns: ["addon-1", "addon-2"],
  rating: 4.7,
  basePrice: BigInt(999),
};

const sampleProduct2 = {
  id: "prod-2",
  categoryId: "cat-1",
  ratingCount: BigInt(89),
  name: "Pepperoni Feast",
  isAvailable: true,
  description: "Loaded with premium pepperoni slices on a rich tomato base",
  isArchived: false,
  sizes: [
    { displayName: "Small", size: Size.small, priceMultiplier: 1.0 },
    { displayName: "Medium", size: Size.medium, priceMultiplier: 1.3 },
    { displayName: "Large", size: Size.large, priceMultiplier: 1.6 },
  ],
  imageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600",
  crusts: [
    { displayName: "Hand Tossed", crust: Crust.hand_tossed, extraPrice: BigInt(0) },
    { displayName: "Thin Crust", crust: Crust.thin, extraPrice: BigInt(100) },
  ],
  addOns: ["addon-1"],
  rating: 4.5,
  basePrice: BigInt(1199),
};

const sampleOrder: import("../backend").OrderOut = {
  id: "order-1",
  status: OrderStatus.preparing,
  deliveryAddress: "123 Main St, New York, NY 10001",
  couponCode: "SAVE10",
  total: BigInt(2499),
  deliveryPartnerLocation: undefined,
  paymentRefunded: false,
  deliveryFee: BigInt(299),
  cancellationReason: undefined,
  discountAmount: BigInt(250),
  estimatedDeliveryMinutes: BigInt(35),
  updatedAt: BigInt(Date.now() * 1_000_000),
  placedAt: BigInt((Date.now() - 600000) * 1_000_000),
  customerId: fakePrincipal,
  items: [
    {
      size: "Large",
      crust: "Hand Tossed",
      productId: "prod-1",
      productName: "Margherita Supreme",
      imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600",
      addOns: ["Extra Cheese"],
      quantity: BigInt(1),
      unitPrice: BigInt(1599),
      totalPrice: BigInt(1599),
    },
  ],
  paymentVerified: true,
  deliveryPartnerId: undefined,
  paymentIntentId: "pi_test_123",
  subtotal: BigInt(2199),
};

const sampleOrder2: import("../backend").OrderOut = {
  id: "order-2",
  status: OrderStatus.delivered,
  deliveryAddress: "456 Broadway, New York, NY 10012",
  total: BigInt(1899),
  deliveryPartnerLocation: undefined,
  paymentRefunded: false,
  deliveryFee: BigInt(199),
  discountAmount: BigInt(0),
  estimatedDeliveryMinutes: BigInt(30),
  updatedAt: BigInt((Date.now() - 3600000) * 1_000_000),
  placedAt: BigInt((Date.now() - 7200000) * 1_000_000),
  customerId: fakePrincipal,
  items: [
    {
      size: "Medium",
      crust: "Thin Crust",
      productId: "prod-2",
      productName: "Pepperoni Feast",
      imageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600",
      addOns: [],
      quantity: BigInt(1),
      unitPrice: BigInt(1399),
      totalPrice: BigInt(1399),
    },
  ],
  paymentVerified: true,
  subtotal: BigInt(1399),
};

const sampleCategory = {
  id: "cat-1",
  sortOrder: BigInt(1),
  name: "Pizzas",
  description: "Our signature hand-crafted pizzas",
  imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600",
};

const sampleCategory2 = {
  id: "cat-2",
  sortOrder: BigInt(2),
  name: "Sides",
  description: "Perfect sides to complement your pizza",
  imageUrl: "https://images.unsplash.com/photo-1600626346553-1b6a60b41dff?w=600",
};

const sampleCoupon: import("../backend").CouponPublic = {
  discountValue: BigInt(10),
  expiresAt: BigInt((Date.now() + 30 * 24 * 3600 * 1000) * 1_000_000),
  code: "SAVE10",
  discountType: DiscountType.percentage,
  usageCount: BigInt(45),
  isActive: true,
  maxUsages: BigInt(100),
  minOrderAmount: BigInt(1500),
  requiresMinQty: BigInt(1),
};

const sampleAddress: import("../backend").AddressPublic = {
  id: "addr-1",
  lat: 40.7128,
  lng: -74.006,
  street: "123 Main Street",
  principal: fakePrincipal,
  displayName: "Home",
  city: "New York",
  zipCode: "10001",
  state: "NY",
  isDefault: true,
};

const sampleUser: import("../backend").UserProfile = {
  principal: fakePrincipal,
  name: "Alex Johnson",
  createdAt: BigInt((Date.now() - 30 * 24 * 3600 * 1000) * 1_000_000),
  role: Role.customer,
  phone: "+1 555-0100",
};

const sampleAddOn: import("../backend").AddOn = {
  id: "addon-1",
  name: "Extra Cheese",
  category: "Cheese",
  price: BigInt(150),
};

export const mockBackend: backendInterface = {
  acceptOrder: async () => true,
  applyCoupon: async () => ({
    discountAmount: BigInt(250),
    message: "10% discount applied!",
    isValid: true,
  }),
  assignDeliveryPartner: async () => true,
  autoApplyCoupon: async () => sampleCoupon,
  cancelOrder: async () => "Order cancelled successfully",
  createAddOn: async () => undefined,
  createCategory: async () => undefined,
  createCoupon: async () => sampleCoupon,
  createProduct: async () => undefined,
  createProfile: async () => ({ __kind__: "ok", ok: sampleUser }),
  deleteAddOn: async () => true,
  deleteAddress: async () => true,
  deleteCategory: async () => "Category deleted",
  deleteProduct: async () => true,
  getAddOns: async () => [sampleAddOn, { id: "addon-2", name: "Jalapeños", category: "Toppings", price: BigInt(100) }],
  getAddresses: async () => [sampleAddress],
  getAllUsers: async () => ({ __kind__: "ok", ok: [sampleUser, { ...sampleUser, principal: { toString: () => "bbbbb-bb" } as Principal, name: "Sam Rivera", role: Role.delivery_partner }] }),
  getAvailableOrders: async () => [sampleOrder],
  getCategories: async () => [sampleCategory, sampleCategory2],
  getCoupons: async () => [sampleCoupon, { ...sampleCoupon, code: "FREEDEL", discountType: DiscountType.free_delivery, discountValue: BigInt(0), usageCount: BigInt(12) }],
  getDeliveryFee: async () => ({
    feeInCents: BigInt(299),
    distanceKm: 3.2,
    estimatedMinutes: BigInt(35),
  }),
  getMyAssignedOrders: async () => [sampleOrder],
  getMyOrders: async () => [sampleOrder, sampleOrder2],
  getOrder: async () => sampleOrder,
  getOrderStats: async () => ({
    cancelledCount: BigInt(3),
    totalOrders: BigInt(142),
    outForDelivery: BigInt(8),
    activeDeliveries: BigInt(12),
    confirmedCount: BigInt(5),
    todayRevenue: BigInt(89750),
    preparingCount: BigInt(7),
    deliveredCount: BigInt(119),
    totalRevenue: BigInt(1245800),
    placedCount: BigInt(4),
    avgOrderValue: BigInt(1875),
    todayOrders: BigInt(47),
  }),
  getOrdersByStatus: async () => [sampleOrder, sampleOrder2],
  getPartnerStats: async () => ({
    todayDeliveries: BigInt(6),
    totalDelivered: BigInt(234),
    activeOrders: BigInt(2),
  }),
  getProduct: async () => sampleProduct,
  getProducts: async () => [sampleProduct, sampleProduct2],
  getProductsByCategory: async () => [sampleProduct, sampleProduct2],
  getProfile: async () => sampleUser,
  getRole: async () => Role.admin,
  isAuthenticated: async () => true,
  placeOrder: async () => sampleOrder,
  rejectOrder: async () => true,
  saveAddress: async () => sampleAddress,
  setAdminRole: async () => ({ __kind__: "ok", ok: sampleUser }),
  setDefaultAddress: async () => true,
  updateAddOn: async () => true,
  updateCategory: async () => true,
  updateDeliveryLocation: async () => true,
  updateOrderStatus: async () => true,
  updateProduct: async () => true,
  updateProfile: async () => ({ __kind__: "ok", ok: sampleUser }),
  validateCoupon: async () => ({
    discountAmount: BigInt(250),
    message: "10% discount applied!",
    isValid: true,
  }),
  verifyAndConfirmOrder: async () => true,
  // Reviews
  submitOrderReview: async () => ({
    __kind__: "ok" as const,
    ok: {
      id: "review-1",
      orderId: "order-1",
      customerId: fakePrincipal,
      overallRating: BigInt(5),
      comment: "Delicious!",
      productRatings: [],
      createdAt: BigInt(Date.now() * 1_000_000),
    },
  }),
  getOrderReview: async () => null,
  getAllReviews: async () => [],
  // Notifications
  getMyNotifications: async () => [],
  markNotificationRead: async () => ({ __kind__: "ok" as const, ok: null }),
  markAllNotificationsRead: async () => undefined,
  getUnreadCount: async () => BigInt(0),
  // Banners
  getActiveBanners: async () => [],
  createBanner: async () => ({
    __kind__: "ok" as const,
    ok: {
      id: "banner-1",
      title: "Weekend Deal",
      description: "Get 20% off",
      imageUrl: "",
      ctaText: "Order Now",
      ctaLink: "/menu",
      couponCode: "WEEKEND20",
      isActive: true,
      priority: BigInt(1),
      createdAt: BigInt(Date.now() * 1_000_000),
    },
  }),
  updateBanner: async () => ({
    __kind__: "ok" as const,
    ok: {
      id: "banner-1",
      title: "Weekend Deal",
      description: "Get 20% off",
      imageUrl: "",
      ctaText: "Order Now",
      ctaLink: "/menu",
      couponCode: undefined,
      isActive: true,
      priority: BigInt(1),
      createdAt: BigInt(Date.now() * 1_000_000),
    },
  }),
  deleteBanner: async () => ({ __kind__: "ok" as const, ok: null }),
  toggleBannerActive: async () => ({
    __kind__: "ok" as const,
    ok: {
      id: "banner-1",
      title: "Weekend Deal",
      description: "Get 20% off",
      imageUrl: "",
      ctaText: "Order Now",
      ctaLink: "/menu",
      couponCode: undefined,
      isActive: false,
      priority: BigInt(1),
      createdAt: BigInt(Date.now() * 1_000_000),
    },
  }),
  // Loyalty
  getLoyaltyAccount: async () => null,
  getPointsHistory: async () => [],
  // Reorder
  getOrderForReorder: async () => ({ __kind__: "ok" as const, ok: [] }),
};
