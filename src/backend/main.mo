import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import AuthTypes "types/auth";
import MenuTypes "types/menu";
import CartTypes "types/cart";
import OrderTypes "types/orders";
import ReviewTypes "types/reviews";
import NotifTypes "types/notifications";
import BannerTypes "types/banners";
import LoyaltyTypes "types/loyalty";
import AuthMixin "mixins/auth-api";
import MenuMixin "mixins/menu-api";
import CartMixin "mixins/cart-api";
import OrdersMixin "mixins/orders-api";
import ReviewsMixin "mixins/reviews-api";
import NotificationsMixin "mixins/notifications-api";
import BannersMixin "mixins/banners-api";
import LoyaltyMixin "mixins/loyalty-api";
import MenuLib "lib/menu";
import CartLib "lib/cart";
import BannerLib "lib/banners";



actor {
  // ── Auth state ─────────────────────────────────────────────────────────────
  let profiles = Map.empty<Principal, AuthTypes.UserProfile>();

  // ── Menu state ─────────────────────────────────────────────────────────────
  let categories = Map.empty<Text, MenuTypes.Category>();
  let products   = Map.empty<Text, MenuTypes.Product>();
  let addOns     = Map.empty<Text, MenuTypes.AddOn>();
  let adminList  = Set.empty<Principal>();

  // ── Cart / Coupon / Address state ──────────────────────────────────────────
  let coupons   = Map.empty<Text, CartTypes.Coupon>();
  let addresses = Map.empty<Principal, List.List<CartTypes.Address>>();

  // ── Orders state ───────────────────────────────────────────────────────────
  let orders = Map.empty<Text, OrderTypes.Order>();

  // ── Reviews state ──────────────────────────────────────────────────────────
  let reviews = Map.empty<Text, ReviewTypes.OrderReview>();

  // ── Notifications state ────────────────────────────────────────────────────
  let notifications  = Map.empty<Text, NotifTypes.Notification>();
  let userNotifIndex = Map.empty<Principal, List.List<Text>>();

  // ── Banners state ──────────────────────────────────────────────────────────
  let banners = Map.empty<Text, BannerTypes.PromoBanner>();

  // ── Loyalty state ──────────────────────────────────────────────────────────
  let loyaltyAccounts     = Map.empty<Principal, LoyaltyTypes.LoyaltyAccount>();
  let loyaltyTransactions = Map.empty<Text, LoyaltyTypes.PointsTransaction>();

  // ── Seed sample data on first initialisation ───────────────────────────────
  if (categories.isEmpty()) {
    MenuLib.seedCategories(categories);
    MenuLib.seedAddOns(addOns);
    MenuLib.seedProducts(products);
  };
  if (coupons.isEmpty()) {
    CartLib.seedCoupons(coupons);
  };
  if (banners.isEmpty()) {
    BannerLib.seedBanners(banners);
  };

  // ── Mixins ─────────────────────────────────────────────────────────────────
  include AuthMixin(profiles, adminList);
  include MenuMixin(categories, products, addOns, adminList, profiles);
  include CartMixin(coupons, addresses, profiles, adminList);
  include OrdersMixin(orders, adminList, notifications, userNotifIndex, loyaltyAccounts, loyaltyTransactions);
  include ReviewsMixin(reviews, orders, adminList);
  include NotificationsMixin(notifications, userNotifIndex);
  include BannersMixin(banners, adminList);
  include LoyaltyMixin(loyaltyAccounts, loyaltyTransactions);
};
