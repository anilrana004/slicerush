export { Role } from "../backend";
export type { UserProfile } from "../backend";

export type AuthStatus =
  | "initializing"
  | "idle"
  | "logging-in"
  | "success"
  | "loginError";

// Extended product type with archive support
export interface ProductUpdate {
  id: string;
  name?: string;
  description?: string;
  basePrice?: bigint;
  imageUrl?: string;
  isAvailable?: boolean;
  isArchived?: boolean;
  categoryId?: string;
}

// Coupon with BOGO support
export interface CouponWithBOGO {
  code: string;
  discountType: string;
  discountValue: bigint;
  minOrderAmount: bigint;
  maxUsages: bigint;
  isActive: boolean;
  triggerProductId?: string;
  freeProductId?: string;
  requiresMinQty?: number;
}

// Admin stats returned from getOrderStats()
export interface OrderStats {
  totalOrders: bigint;
  todayOrders: bigint;
  totalRevenue: bigint;
  todayRevenue: bigint;
  ordersByStatus: Record<string, bigint>;
  activeDeliveries: bigint;
  avgOrderValue: bigint;
}

// Admin user row for user management table
export interface AdminUserRow {
  principal: string;
  name: string;
  phone: string;
  role: string;
  createdAt: bigint;
}

// Delivery fee response
export interface DeliveryFeeResult {
  fee: number;
  distance: number;
  zone: string;
}

// Order review
export interface OrderReview {
  id: string;
  orderId: string;
  customerId: string;
  overallRating: number;
  comment: string | null;
  createdAt: bigint;
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  notifType: string;
  title: string;
  message: string;
  orderId: string | null;
  read: boolean;
  createdAt: bigint;
}

// Promo banner
export interface PromoBanner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  couponCode: string | null;
  isActive: boolean;
  priority: number;
  createdAt: bigint;
}

// Loyalty account
export interface LoyaltyAccount {
  userId: string;
  points: number;
  totalPointsEarned: number;
  tier: "bronze" | "silver" | "gold";
  joinedAt: bigint;
}

// Points transaction
export interface PointsTransaction {
  id: string;
  userId: string;
  points: number;
  txnType: "earned" | "redeemed";
  orderId: string | null;
  description: string;
  createdAt: bigint;
}
