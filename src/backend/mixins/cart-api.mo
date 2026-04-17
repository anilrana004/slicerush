import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Runtime "mo:core/Runtime";
import AuthTypes "../types/auth";
import Types "../types/cart";
import CartLib "../lib/cart";
import DeliveryLib "../lib/delivery";
import Time "mo:core/Time";

mixin (
  coupons : Map.Map<Text, Types.Coupon>,
  addresses : Map.Map<Principal, List.List<Types.Address>>,
  profiles : Map.Map<Principal, AuthTypes.UserProfile>,
  adminList : Set.Set<Principal>,
) {

  // ── Coupon endpoints ──────────────────────────────────────────────────────────

  public shared query func validateCoupon(code : Text, orderTotal : Nat) : async Types.CouponValidation {
    CartLib.validateCoupon(coupons, code, orderTotal);
  };

  public shared ({ caller }) func applyCoupon(code : Text, orderTotal : Nat) : async Types.CouponValidation {
    if (profiles.get(caller) == null) Runtime.trap("Not authenticated");
    CartLib.applyCoupon(coupons, code, orderTotal);
  };

  public query func getCoupons() : async [Types.CouponPublic] {
    CartLib.getCoupons(coupons);
  };

  public shared ({ caller }) func createCoupon(
    code : Text,
    discountType : Types.DiscountType,
    discountValue : Nat,
    minOrderAmount : Nat,
    maxUsages : Nat,
    expiresAt : ?Time.Time,
    triggerProductId : ?Text,
    freeProductId : ?Text,
    requiresMinQty : Nat,
  ) : async Types.CouponPublic {
    if (not adminList.contains(caller)) Runtime.trap("Unauthorized: admin only");
    CartLib.createCoupon(coupons, code, discountType, discountValue, minOrderAmount, maxUsages, expiresAt, triggerProductId, freeProductId, requiresMinQty);
  };

  // ── Auto-apply best coupon ────────────────────────────────────────────────────

  public shared ({ caller }) func autoApplyCoupon(
    cartTotal : Nat,
    cartItems : [Types.CartItem],
  ) : async ?Types.CouponPublic {
    if (profiles.get(caller) == null) Runtime.trap("Not authenticated");
    CartLib.autoApplyCoupon(coupons, cartTotal, cartItems);
  };

  // ── Delivery fee ──────────────────────────────────────────────────────────────

  public shared query ({ caller }) func getDeliveryFee(addressId : Text) : async ?{
    feeInCents : Nat;
    distanceKm : Float;
    estimatedMinutes : Nat;
  } {
    if (profiles.get(caller) == null) Runtime.trap("Not authenticated");
    DeliveryLib.getDeliveryFee(addresses, caller, addressId);
  };

  // ── Address endpoints ─────────────────────────────────────────────────────────

  public shared ({ caller }) func saveAddress(
    displayName : Text,
    street : Text,
    city : Text,
    state : Text,
    zipCode : Text,
    lat : Float,
    lng : Float,
  ) : async Types.AddressPublic {
    if (profiles.get(caller) == null) Runtime.trap("Not authenticated");
    CartLib.saveAddress(addresses, caller, displayName, street, city, state, zipCode, lat, lng);
  };

  public shared query ({ caller }) func getAddresses() : async [Types.AddressPublic] {
    CartLib.getAddresses(addresses, caller);
  };

  public shared ({ caller }) func setDefaultAddress(id : Text) : async Bool {
    if (profiles.get(caller) == null) Runtime.trap("Not authenticated");
    CartLib.setDefaultAddress(addresses, caller, id);
  };

  public shared ({ caller }) func deleteAddress(id : Text) : async Bool {
    if (profiles.get(caller) == null) Runtime.trap("Not authenticated");
    CartLib.deleteAddress(addresses, caller, id);
  };
};
