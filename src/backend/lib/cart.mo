import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Types "../types/cart";

module {
  // ── Coupon helpers ────────────────────────────────────────────────────────────

  public func toPublicCoupon(c : Types.Coupon) : Types.CouponPublic {
    {
      code = c.code;
      discountType = c.discountType;
      discountValue = c.discountValue;
      minOrderAmount = c.minOrderAmount;
      maxUsages = c.maxUsages;
      usageCount = c.usageCount;
      expiresAt = c.expiresAt;
      isActive = c.isActive;
      triggerProductId = c.triggerProductId;
      freeProductId = c.freeProductId;
      requiresMinQty = c.requiresMinQty;
    };
  };

  // ── BOGO discount calculation ─────────────────────────────────────────────────
  // Returns discount amount in cents, or null if BOGO conditions aren't met.
  func calcBogoDiscount(coupon : Types.Coupon, cartItems : [Types.CartItem]) : ?Nat {
    let trigId = switch (coupon.triggerProductId) { case (?t) t; case null return null };
    let freeId = switch (coupon.freeProductId)   { case (?f) f; case null return null };
    // find trigger product qty
    let triggerQty = switch (cartItems.find(func(i : Types.CartItem) : Bool { i.productId == trigId })) {
      case null { 0 };
      case (?item) { item.quantity };
    };
    if (triggerQty < coupon.requiresMinQty) return null;
    // find free product
    switch (cartItems.find(func(i : Types.CartItem) : Bool { i.productId == freeId })) {
      case null null;
      case (?freeItem) {
        // discount = free product unit price * 1 (one free item per qualifying trigger)
        ?freeItem.unitPrice
      };
    };
  };

  public func validateCouponWithItems(
    coupons : Map.Map<Text, Types.Coupon>,
    code : Text,
    orderTotal : Nat,
    cartItems : [Types.CartItem],
  ) : Types.CouponValidation {
    let upperCode = code.toUpper();
    switch (coupons.get(upperCode)) {
      case null {
        { isValid = false; discountAmount = 0; message = "Coupon not found" };
      };
      case (?coupon) {
        if (not coupon.isActive) {
          return { isValid = false; discountAmount = 0; message = "Coupon is no longer active" };
        };
        if (coupon.usageCount >= coupon.maxUsages) {
          return { isValid = false; discountAmount = 0; message = "Coupon usage limit reached" };
        };
        switch (coupon.expiresAt) {
          case (?expiry) {
            if (Time.now() > expiry) {
              return { isValid = false; discountAmount = 0; message = "Coupon has expired" };
            };
          };
          case null {};
        };
        if (orderTotal < coupon.minOrderAmount) {
          return {
            isValid = false;
            discountAmount = 0;
            message = "Minimum order amount is $" # (coupon.minOrderAmount / 100).toText();
          };
        };
        let discount = switch (coupon.discountType) {
          case (#flat)          { Nat.min(coupon.discountValue, orderTotal) };
          case (#percentage)    { orderTotal * coupon.discountValue / 100 };
          case (#free_delivery) { coupon.discountValue };
          case (#bogo) {
            switch (calcBogoDiscount(coupon, cartItems)) {
              case null {
                return {
                  isValid = false;
                  discountAmount = 0;
                  message = "BOGO conditions not met — add both trigger and free products to cart";
                };
              };
              case (?d) { d };
            };
          };
        };
        { isValid = true; discountAmount = discount; message = "Coupon applied successfully" };
      };
    };
  };

  public func validateCoupon(
    coupons : Map.Map<Text, Types.Coupon>,
    code : Text,
    orderTotal : Nat,
  ) : Types.CouponValidation {
    validateCouponWithItems(coupons, code, orderTotal, []);
  };

  public func applyCoupon(
    coupons : Map.Map<Text, Types.Coupon>,
    code : Text,
    orderTotal : Nat,
  ) : Types.CouponValidation {
    let result = validateCoupon(coupons, code, orderTotal);
    if (result.isValid) {
      let upperCode = code.toUpper();
      switch (coupons.get(upperCode)) {
        case (?coupon) { coupon.usageCount += 1 };
        case null {};
      };
    };
    result;
  };

  public func applyCouponWithItems(
    coupons : Map.Map<Text, Types.Coupon>,
    code : Text,
    orderTotal : Nat,
    cartItems : [Types.CartItem],
  ) : Types.CouponValidation {
    let result = validateCouponWithItems(coupons, code, orderTotal, cartItems);
    if (result.isValid) {
      let upperCode = code.toUpper();
      switch (coupons.get(upperCode)) {
        case (?coupon) { coupon.usageCount += 1 };
        case null {};
      };
    };
    result;
  };

  public func getCoupons(coupons : Map.Map<Text, Types.Coupon>) : [Types.CouponPublic] {
    let result = List.empty<Types.CouponPublic>();
    for ((_, c) in coupons.entries()) {
      if (c.isActive) {
        result.add(toPublicCoupon(c));
      };
    };
    result.toArray();
  };

  public func createCoupon(
    coupons : Map.Map<Text, Types.Coupon>,
    code : Text,
    discountType : Types.DiscountType,
    discountValue : Nat,
    minOrderAmount : Nat,
    maxUsages : Nat,
    expiresAt : ?Time.Time,
    triggerProductId : ?Text,
    freeProductId : ?Text,
    requiresMinQty : Nat,
  ) : Types.CouponPublic {
    let upperCode = code.toUpper();
    let coupon : Types.Coupon = {
      code = upperCode;
      discountType;
      discountValue;
      minOrderAmount;
      maxUsages;
      var usageCount = 0;
      expiresAt;
      isActive = true;
      triggerProductId;
      freeProductId;
      requiresMinQty;
    };
    coupons.add(upperCode, coupon);
    toPublicCoupon(coupon);
  };

  // ── Auto-apply best coupon ────────────────────────────────────────────────────
  public func autoApplyCoupon(
    coupons : Map.Map<Text, Types.Coupon>,
    cartTotal : Nat,
    cartItems : [Types.CartItem],
  ) : ?Types.CouponPublic {
    var bestDiscount : Nat = 0;
    var bestCoupon : ?Types.Coupon = null;
    for ((_, c) in coupons.entries()) {
      if (c.isActive) {
        let v = validateCouponWithItems(coupons, c.code, cartTotal, cartItems);
        if (v.isValid and v.discountAmount > bestDiscount) {
          bestDiscount := v.discountAmount;
          bestCoupon := ?c;
        };
      };
    };
    switch (bestCoupon) {
      case null null;
      case (?c) ?toPublicCoupon(c);
    };
  };

  // ── Seed coupons ─────────────────────────────────────────────────────────────

  public func seedCoupons(coupons : Map.Map<Text, Types.Coupon>) {
    // PIZZA10 — 10% off, min $20 (amounts in cents)
    let pizza10 : Types.Coupon = {
      code = "PIZZA10";
      discountType = #percentage;
      discountValue = 10;
      minOrderAmount = 2000;
      maxUsages = 1000;
      var usageCount = 0;
      expiresAt = null;
      isActive = true;
      triggerProductId = null;
      freeProductId = null;
      requiresMinQty = 0;
    };
    // SAVE5 — flat $5 off, min $15
    let save5 : Types.Coupon = {
      code = "SAVE5";
      discountType = #flat;
      discountValue = 500;
      minOrderAmount = 1500;
      maxUsages = 1000;
      var usageCount = 0;
      expiresAt = null;
      isActive = true;
      triggerProductId = null;
      freeProductId = null;
      requiresMinQty = 0;
    };
    // FREESHIP — free delivery ($299 credit), min $25
    let freeship : Types.Coupon = {
      code = "FREESHIP";
      discountType = #free_delivery;
      discountValue = 299;
      minOrderAmount = 2500;
      maxUsages = 1000;
      var usageCount = 0;
      expiresAt = null;
      isActive = true;
      triggerProductId = null;
      freeProductId = null;
      requiresMinQty = 0;
    };
    coupons.add("PIZZA10", pizza10);
    coupons.add("SAVE5", save5);
    coupons.add("FREESHIP", freeship);
  };

  // ── Address helpers ───────────────────────────────────────────────────────────

  public func toPublicAddress(a : Types.Address) : Types.AddressPublic {
    {
      id = a.id;
      principal = a.principal;
      displayName = a.displayName;
      street = a.street;
      city = a.city;
      state = a.state;
      zipCode = a.zipCode;
      lat = a.lat;
      lng = a.lng;
      isDefault = a.isDefault;
    };
  };

  public func saveAddress(
    addresses : Map.Map<Principal, List.List<Types.Address>>,
    caller : Principal,
    displayName : Text,
    street : Text,
    city : Text,
    state : Text,
    zipCode : Text,
    lat : Float,
    lng : Float,
  ) : Types.AddressPublic {
    let id = caller.toText() # "-" # Time.now().toText();
    let userAddresses = switch (addresses.get(caller)) {
      case (?list) list;
      case null {
        let fresh = List.empty<Types.Address>();
        addresses.add(caller, fresh);
        fresh;
      };
    };
    // If this is the first address, make it default
    let isDefault = userAddresses.isEmpty();
    let addr : Types.Address = {
      id;
      principal = caller;
      displayName;
      street;
      city;
      state;
      zipCode;
      lat;
      lng;
      var isDefault;
    };
    userAddresses.add(addr);
    toPublicAddress(addr);
  };

  public func getAddresses(
    addresses : Map.Map<Principal, List.List<Types.Address>>,
    caller : Principal,
  ) : [Types.AddressPublic] {
    switch (addresses.get(caller)) {
      case null { [] };
      case (?list) {
        let result = List.empty<Types.AddressPublic>();
        for (a in list.values()) {
          result.add(toPublicAddress(a));
        };
        result.toArray();
      };
    };
  };

  public func setDefaultAddress(
    addresses : Map.Map<Principal, List.List<Types.Address>>,
    caller : Principal,
    id : Text,
  ) : Bool {
    switch (addresses.get(caller)) {
      case null { false };
      case (?list) {
        let found = list.find(func(a : Types.Address) : Bool { a.id == id });
        switch (found) {
          case null { false };
          case (?_) {
            for (a in list.values()) {
              a.isDefault := (a.id == id);
            };
            true;
          };
        };
      };
    };
  };

  public func deleteAddress(
    addresses : Map.Map<Principal, List.List<Types.Address>>,
    caller : Principal,
    id : Text,
  ) : Bool {
    switch (addresses.get(caller)) {
      case null { false };
      case (?list) {
        let sizeBefore = list.size();
        let kept = list.filter(func(a : Types.Address) : Bool { a.id != id });
        if (kept.size() == sizeBefore) return false;
        // Replace the list in-place by clearing and re-adding
        list.clear();
        list.addAll(kept.values());
        // If the deleted address was default, make first remaining the default
        switch (list.first()) {
          case null {};
          case (?first) {
            let hasDefault = list.any(func(a : Types.Address) : Bool { a.isDefault });
            if (not hasDefault) { first.isDefault := true };
          };
        };
        true;
      };
    };
  };
};
