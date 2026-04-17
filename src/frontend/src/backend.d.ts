import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Product {
    id: string;
    categoryId: string;
    ratingCount: bigint;
    name: string;
    isAvailable: boolean;
    description: string;
    isArchived: boolean;
    sizes: Array<SizeVariant>;
    imageUrl: string;
    crusts: Array<CrustVariant>;
    addOns: Array<string>;
    rating: number;
    basePrice: bigint;
}
export interface UserProfile {
    principal: Principal;
    name: string;
    createdAt: Time;
    role: Role;
    phone: string;
}
export type UsersResult = {
    __kind__: "ok";
    ok: Array<UserProfile>;
} | {
    __kind__: "err";
    err: string;
};
export type Time = bigint;
export interface AddOn {
    id: string;
    name: string;
    category: string;
    price: bigint;
}
export interface OrderItem {
    size: string;
    crust: string;
    productId: string;
    productName: string;
    imageUrl: string;
    addOns: Array<string>;
    quantity: bigint;
    unitPrice: bigint;
    totalPrice: bigint;
}
export type DeleteResult = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: string;
};
export type ReviewResult = {
    __kind__: "ok";
    ok: OrderReview;
} | {
    __kind__: "err";
    err: string;
};
export interface PromoBannerPublic {
    id: string;
    couponCode?: string;
    title: string;
    createdAt: Time;
    description: string;
    isActive: boolean;
    ctaLink: string;
    imageUrl: string;
    ctaText: string;
    priority: bigint;
}
export interface CouponPublic {
    discountValue: bigint;
    expiresAt?: Time;
    code: string;
    discountType: DiscountType;
    usageCount: bigint;
    isActive: boolean;
    maxUsages: bigint;
    triggerProductId?: string;
    minOrderAmount: bigint;
    requiresMinQty: bigint;
    freeProductId?: string;
}
export interface SizeVariant {
    displayName: string;
    size: Size;
    priceMultiplier: number;
}
export interface CouponValidation {
    discountAmount: bigint;
    message: string;
    isValid: boolean;
}
export interface AddressPublic {
    id: string;
    lat: number;
    lng: number;
    street: string;
    principal: Principal;
    displayName: string;
    city: string;
    zipCode: string;
    state: string;
    isDefault: boolean;
}
export type AuthResult = {
    __kind__: "ok";
    ok: UserProfile;
} | {
    __kind__: "err";
    err: string;
};
export interface NotificationPublic {
    id: string;
    title: string;
    notifType: NotificationType;
    userId: Principal;
    createdAt: Time;
    read: boolean;
    orderId?: string;
    message: string;
}
export type NotifResult = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: string;
};
export interface Category {
    id: string;
    sortOrder: bigint;
    name: string;
    description: string;
    imageUrl: string;
}
export type BannerResult = {
    __kind__: "ok";
    ok: PromoBannerPublic;
} | {
    __kind__: "err";
    err: string;
};
export interface ProductUpdate {
    categoryId?: string;
    name?: string;
    isAvailable?: boolean;
    description?: string;
    imageUrl?: string;
    basePrice?: bigint;
}
export interface LoyaltyAccountPublic {
    userId: Principal;
    joinedAt: Time;
    tier: LoyaltyTier;
    totalPointsEarned: bigint;
    points: bigint;
}
export interface OrderReview {
    id: string;
    createdAt: Time;
    orderId: string;
    comment?: string;
    overallRating: bigint;
    productRatings: Array<ProductRating>;
    customerId: Principal;
}
export interface PointsTransaction {
    id: string;
    userId: Principal;
    createdAt: Time;
    description: string;
    txnType: Variant_redeemed_earned;
    orderId?: string;
    points: bigint;
}
export interface ProductRating {
    productId: string;
    rating: bigint;
}
export interface DeliveryLocation {
    lat: number;
    lng: number;
}
export interface CrustVariant {
    displayName: string;
    crust: Crust;
    extraPrice: bigint;
}
export interface CartItem {
    productId: string;
    quantity: bigint;
    unitPrice: bigint;
}
export interface OrderOut {
    id: string;
    status: OrderStatus;
    deliveryAddress: string;
    couponCode?: string;
    total: bigint;
    deliveryPartnerLocation?: DeliveryLocation;
    paymentRefunded: boolean;
    deliveryFee: bigint;
    cancellationReason?: string;
    discountAmount: bigint;
    estimatedDeliveryMinutes: bigint;
    updatedAt: bigint;
    placedAt: bigint;
    customerId: Principal;
    items: Array<OrderItem>;
    paymentVerified: boolean;
    deliveryPartnerId?: Principal;
    paymentIntentId?: string;
    subtotal: bigint;
}
export enum Crust {
    hand_tossed = "hand_tossed",
    thin = "thin",
    stuffed = "stuffed"
}
export enum DiscountType {
    bogo = "bogo",
    flat = "flat",
    free_delivery = "free_delivery",
    percentage = "percentage"
}
export enum LoyaltyTier {
    bronze = "bronze",
    gold = "gold",
    silver = "silver"
}
export enum NotificationType {
    orderConfirmed = "orderConfirmed",
    couponExpiry = "couponExpiry",
    outForDelivery = "outForDelivery",
    orderPreparing = "orderPreparing",
    orderCancelled = "orderCancelled",
    promoAlert = "promoAlert",
    orderDelivered = "orderDelivered"
}
export enum OrderStatus {
    preparing = "preparing",
    cancelled = "cancelled",
    placed = "placed",
    out_for_delivery = "out_for_delivery",
    delivered = "delivered",
    confirmed = "confirmed"
}
export enum Role {
    admin = "admin",
    customer = "customer",
    delivery_partner = "delivery_partner"
}
export enum Size {
    large = "large",
    small = "small",
    medium = "medium"
}
export enum Variant_redeemed_earned {
    redeemed = "redeemed",
    earned = "earned"
}
export interface backendInterface {
    acceptOrder(orderId: string): Promise<boolean>;
    applyCoupon(code: string, orderTotal: bigint): Promise<CouponValidation>;
    assignDeliveryPartner(orderId: string, partnerId: Principal): Promise<boolean>;
    autoApplyCoupon(cartTotal: bigint, cartItems: Array<CartItem>): Promise<CouponPublic | null>;
    cancelOrder(orderId: string, reason: string): Promise<string>;
    createAddOn(addOn: AddOn): Promise<void>;
    createBanner(title: string, description: string, imageUrl: string, ctaText: string, ctaLink: string, couponCode: string | null, priority: bigint): Promise<BannerResult>;
    createCategory(category: Category): Promise<void>;
    createCoupon(code: string, discountType: DiscountType, discountValue: bigint, minOrderAmount: bigint, maxUsages: bigint, expiresAt: Time | null, triggerProductId: string | null, freeProductId: string | null, requiresMinQty: bigint): Promise<CouponPublic>;
    createProduct(product: Product): Promise<void>;
    createProfile(role: Role, name: string, phone: string): Promise<AuthResult>;
    deleteAddOn(addOnId: string): Promise<boolean>;
    deleteAddress(id: string): Promise<boolean>;
    deleteBanner(id: string): Promise<DeleteResult>;
    deleteCategory(categoryId: string): Promise<string>;
    deleteProduct(productId: string): Promise<boolean>;
    getActiveBanners(): Promise<Array<PromoBannerPublic>>;
    getAddOns(): Promise<Array<AddOn>>;
    getAddresses(): Promise<Array<AddressPublic>>;
    getAllReviews(): Promise<Array<OrderReview>>;
    getAllUsers(): Promise<UsersResult>;
    getAvailableOrders(): Promise<Array<OrderOut>>;
    getCategories(): Promise<Array<Category>>;
    getCoupons(): Promise<Array<CouponPublic>>;
    getDeliveryFee(addressId: string): Promise<{
        feeInCents: bigint;
        distanceKm: number;
        estimatedMinutes: bigint;
    } | null>;
    getLoyaltyAccount(): Promise<LoyaltyAccountPublic | null>;
    getMyAssignedOrders(): Promise<Array<OrderOut>>;
    getMyNotifications(): Promise<Array<NotificationPublic>>;
    getMyOrders(): Promise<Array<OrderOut>>;
    getOrder(id: string): Promise<OrderOut | null>;
    getOrderForReorder(orderId: string): Promise<{
        __kind__: "ok";
        ok: Array<OrderItem>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getOrderReview(orderId: string): Promise<OrderReview | null>;
    getOrderStats(): Promise<{
        cancelledCount: bigint;
        totalOrders: bigint;
        outForDelivery: bigint;
        activeDeliveries: bigint;
        confirmedCount: bigint;
        todayRevenue: bigint;
        preparingCount: bigint;
        deliveredCount: bigint;
        totalRevenue: bigint;
        placedCount: bigint;
        avgOrderValue: bigint;
        todayOrders: bigint;
    } | null>;
    getOrdersByStatus(status: OrderStatus): Promise<Array<OrderOut>>;
    getPartnerStats(): Promise<{
        todayDeliveries: bigint;
        totalDelivered: bigint;
        activeOrders: bigint;
    }>;
    getPointsHistory(): Promise<Array<PointsTransaction>>;
    getProduct(id: string): Promise<Product | null>;
    getProducts(): Promise<Array<Product>>;
    getProductsByCategory(categoryId: string): Promise<Array<Product>>;
    getProfile(): Promise<UserProfile | null>;
    getRole(): Promise<Role>;
    getUnreadCount(): Promise<bigint>;
    isAuthenticated(): Promise<boolean>;
    markAllNotificationsRead(): Promise<void>;
    markNotificationRead(id: string): Promise<NotifResult>;
    placeOrder(items: Array<OrderItem>, subtotal: bigint, deliveryFee: bigint, discountAmount: bigint, total: bigint, couponCode: string | null, deliveryAddress: string, estimatedDeliveryMinutes: bigint): Promise<OrderOut>;
    rejectOrder(orderId: string): Promise<boolean>;
    saveAddress(displayName: string, street: string, city: string, state: string, zipCode: string, lat: number, lng: number): Promise<AddressPublic>;
    setAdminRole(targetPrincipal: Principal, makeAdmin: boolean): Promise<AuthResult>;
    setDefaultAddress(id: string): Promise<boolean>;
    submitOrderReview(orderId: string, rating: bigint, comment: string | null): Promise<ReviewResult>;
    toggleBannerActive(id: string): Promise<BannerResult>;
    updateAddOn(addOnId: string, name: string, price: bigint): Promise<boolean>;
    updateBanner(id: string, title: string | null, description: string | null, imageUrl: string | null, ctaText: string | null, ctaLink: string | null, couponCode: string | null, priority: bigint | null): Promise<BannerResult>;
    updateCategory(categoryId: string, name: string, imageUrl: string | null, sortOrder: bigint | null): Promise<boolean>;
    updateDeliveryLocation(orderId: string, lat: number, lng: number): Promise<boolean>;
    updateOrderStatus(id: string, status: OrderStatus): Promise<boolean>;
    updateProduct(productId: string, updates: ProductUpdate): Promise<boolean>;
    updateProfile(name: string, phone: string): Promise<AuthResult>;
    validateCoupon(code: string, orderTotal: bigint): Promise<CouponValidation>;
    verifyAndConfirmOrder(orderId: string, paymentIntentId: string): Promise<boolean>;
}
