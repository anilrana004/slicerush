import Time "mo:core/Time";

module {
  // ── Coupon ───────────────────────────────────────────────────────────────────
  public type DiscountType = {
    #flat;
    #percentage;
    #free_delivery;
    #bogo;
  };

  public type Coupon = {
    code : Text;
    discountType : DiscountType;
    discountValue : Nat;
    minOrderAmount : Nat;
    maxUsages : Nat;
    var usageCount : Nat;
    expiresAt : ?Time.Time;
    isActive : Bool;
    // BOGO fields
    triggerProductId : ?Text;
    freeProductId    : ?Text;
    requiresMinQty   : Nat;
  };

  public type CouponPublic = {
    code : Text;
    discountType : DiscountType;
    discountValue : Nat;
    minOrderAmount : Nat;
    maxUsages : Nat;
    usageCount : Nat;
    expiresAt : ?Time.Time;
    isActive : Bool;
    triggerProductId : ?Text;
    freeProductId    : ?Text;
    requiresMinQty   : Nat;
  };

  public type CouponValidation = {
    isValid : Bool;
    discountAmount : Nat;
    message : Text;
  };

  // ── CartItem (needed for BOGO / auto-apply logic) ────────────────────────────
  public type CartItem = {
    productId : Text;
    unitPrice : Nat;
    quantity  : Nat;
  };

  // ── Address ──────────────────────────────────────────────────────────────────
  public type Address = {
    id : Text;
    principal : Principal;
    displayName : Text;
    street : Text;
    city : Text;
    state : Text;
    zipCode : Text;
    lat : Float;
    lng : Float;
    var isDefault : Bool;
  };

  public type AddressPublic = {
    id : Text;
    principal : Principal;
    displayName : Text;
    street : Text;
    city : Text;
    state : Text;
    zipCode : Text;
    lat : Float;
    lng : Float;
    isDefault : Bool;
  };
};
