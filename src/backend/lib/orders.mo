import Map    "mo:core/Map";
import Set    "mo:core/Set";
import Time   "mo:core/Time";
import Int    "mo:core/Int";
import Types  "../types/orders";

module {
  // Nanoseconds in one day (used for todayDeliveries calculation)
  let oneDayNs : Int = 86_400_000_000_000;
  // ── ID generation ────────────────────────────────────────────────────────────
  func makeId(caller : Principal, now : Int) : Text {
    caller.toText() # "-" # now.toText()
  };

  // ── Status transition helpers ────────────────────────────────────────────────
  func isDeliveryPartnerStatus(status : Types.OrderStatus) : Bool {
    switch (status) {
      case (#confirmed or #preparing or #out_for_delivery or #delivered) true;
      case _ false;
    }
  };

  // ── Place order ──────────────────────────────────────────────────────────────
  public func placeOrder(
    orders                   : Map.Map<Text, Types.Order>,
    caller                   : Principal,
    items                    : [Types.OrderItem],
    subtotal                 : Nat,
    deliveryFee              : Nat,
    discountAmount           : Nat,
    total                    : Nat,
    couponCode               : ?Text,
    deliveryAddress          : Text,
    estimatedDeliveryMinutes : Nat,
  ) : Types.Order {
    let now = Time.now();
    let id  = makeId(caller, now);
    let order : Types.Order = {
      id;
      customerId               = caller;
      items;
      subtotal;
      deliveryFee;
      discountAmount;
      total;
      var status               = #placed;
      couponCode;
      deliveryAddress;
      var deliveryPartnerId    = null;
      var deliveryPartnerLocation = null;
      placedAt                 = now;
      var updatedAt            = now;
      estimatedDeliveryMinutes;
      var cancellationReason   = null;
      var paymentIntentId      = null;
      var paymentVerified      = false;
      var paymentRefunded      = false;
    };
    orders.add(id, order);
    order
  };

  // ── Get order ────────────────────────────────────────────────────────────────
  public func getOrder(
    orders  : Map.Map<Text, Types.Order>,
    caller  : Principal,
    adminList : Set.Set<Principal>,
    id      : Text,
  ) : ?Types.Order {
    switch (orders.get(id)) {
      case null null;
      case (?order) {
        let isAdmin   = adminList.contains(caller);
        let isOwner   = Principal.equal(order.customerId, caller);
        let isPartner = switch (order.deliveryPartnerId) {
          case (?pid) Principal.equal(pid, caller);
          case null   false;
        };
        if (isAdmin or isOwner or isPartner) ?order else null
      };
    }
  };

  // ── My orders ────────────────────────────────────────────────────────────────
  public func getMyOrders(
    orders : Map.Map<Text, Types.Order>,
    caller : Principal,
  ) : [Types.Order] {
    let matching = orders.entries()
      .filter(func((_, o) : (Text, Types.Order)) : Bool {
          Principal.equal(o.customerId, caller)
        })
      .map(func((_, o) : (Text, Types.Order)) : Types.Order { o })
      .toArray();
    matching.sort(func(a : Types.Order, b : Types.Order) : {#less; #equal; #greater} {
      Int.compare(b.placedAt, a.placedAt)
    })
  };

  // ── Update order status ───────────────────────────────────────────────────────
  public func updateOrderStatus(
    orders    : Map.Map<Text, Types.Order>,
    caller    : Principal,
    adminList : Set.Set<Principal>,
    id        : Text,
    status    : Types.OrderStatus,
  ) : Bool {
    switch (orders.get(id)) {
      case null false;
      case (?order) {
        let isAdmin   = adminList.contains(caller);
        let isOwner   = Principal.equal(order.customerId, caller);
        let isAssigned = switch (order.deliveryPartnerId) {
          case (?pid) Principal.equal(pid, caller);
          case null   false;
        };

        let allowed = if (isAdmin) {
          true
        } else if (isOwner) {
          // Customer can only cancel
          status == #cancelled
        } else if (isAssigned) {
          // Delivery partner can use their statuses
          isDeliveryPartnerStatus(status)
        } else {
          false
        };

        if (not allowed) return false;

        order.status    := status;
        order.updatedAt := Time.now();
        true
      };
    }
  };

  // ── Cancel order ─────────────────────────────────────────────────────────────
  // Only allows cancellation if status is #placed or #confirmed; caller must be owner.
  public func cancelOrder(
    orders   : Map.Map<Text, Types.Order>,
    caller   : Principal,
    orderId  : Text,
    reason   : Text,
  ) : { #ok; #notFound; #unauthorized; #notCancellable } {
    switch (orders.get(orderId)) {
      case null { #notFound };
      case (?order) {
        if (not Principal.equal(order.customerId, caller)) return #unauthorized;
        let cancellable = switch (order.status) {
          case (#placed or #confirmed) true;
          case _ false;
        };
        if (not cancellable) return #notCancellable;
        order.status             := #cancelled;
        order.cancellationReason := ?reason;
        order.paymentRefunded    := order.paymentVerified; // mark refund if payment was taken
        order.updatedAt          := Time.now();
        #ok
      };
    }
  };

  // ── Verify and confirm order (admin / payment system) ───────────────────────
  public func verifyAndConfirmOrder(
    orders         : Map.Map<Text, Types.Order>,
    adminList      : Set.Set<Principal>,
    caller         : Principal,
    orderId        : Text,
    paymentIntentId : Text,
  ) : Bool {
    if (not adminList.contains(caller)) return false;
    switch (orders.get(orderId)) {
      case null false;
      case (?order) {
        order.paymentIntentId := ?paymentIntentId;
        order.paymentVerified := true;
        if (order.status == #placed) {
          order.status := #confirmed;
        };
        order.updatedAt := Time.now();
        true
      };
    }
  };

  // ── Orders by status ──────────────────────────────────────────────────────────
  public func getOrdersByStatus(
    orders : Map.Map<Text, Types.Order>,
    status : Types.OrderStatus,
  ) : [Types.Order] {
    orders.entries()
      .filter(func((_, o) : (Text, Types.Order)) : Bool {
          o.status == status
        })
      .map(func((_, o) : (Text, Types.Order)) : Types.Order { o })
      .toArray()
  };

  // ── Assign delivery partner ───────────────────────────────────────────────────
  public func assignDeliveryPartner(
    orders    : Map.Map<Text, Types.Order>,
    adminList : Set.Set<Principal>,
    caller    : Principal,
    orderId   : Text,
    partnerId : Principal,
  ) : Bool {
    if (not adminList.contains(caller)) return false;
    switch (orders.get(orderId)) {
      case null false;
      case (?order) {
        order.deliveryPartnerId := ?partnerId;
        order.updatedAt         := Time.now();
        true
      };
    }
  };

  // ── Update delivery location ──────────────────────────────────────────────────
  public func updateDeliveryLocation(
    orders  : Map.Map<Text, Types.Order>,
    caller  : Principal,
    orderId : Text,
    lat     : Float,
    lng     : Float,
  ) : Bool {
    switch (orders.get(orderId)) {
      case null false;
      case (?order) {
        let isAssigned = switch (order.deliveryPartnerId) {
          case (?pid) Principal.equal(pid, caller);
          case null   false;
        };
        if (not isAssigned) return false;
        order.deliveryPartnerLocation := ?{ lat; lng };
        order.updatedAt               := Time.now();
        true
      };
    }
  };

  // ── Delivery partner: available orders (status = #placed, unassigned) ─────────
  public func getAvailableOrders(
    orders : Map.Map<Text, Types.Order>,
  ) : [Types.Order] {
    orders.entries()
      .filter(func((_, o) : (Text, Types.Order)) : Bool {
          o.status == #placed and o.deliveryPartnerId == null
        })
      .map(func((_, o) : (Text, Types.Order)) : Types.Order { o })
      .toArray()
  };

  // ── Delivery partner: my assigned orders ──────────────────────────────────────
  public func getMyAssignedOrders(
    orders : Map.Map<Text, Types.Order>,
    caller : Principal,
  ) : [Types.Order] {
    let matching = orders.entries()
      .filter(func((_, o) : (Text, Types.Order)) : Bool {
          switch (o.deliveryPartnerId) {
            case (?pid) Principal.equal(pid, caller);
            case null   false;
          }
        })
      .map(func((_, o) : (Text, Types.Order)) : Types.Order { o })
      .toArray();
    matching.sort(func(a : Types.Order, b : Types.Order) : {#less; #equal; #greater} {
      Int.compare(b.updatedAt, a.updatedAt)
    })
  };

  // ── Delivery partner: accept order ───────────────────────────────────────────
  public func acceptOrder(
    orders  : Map.Map<Text, Types.Order>,
    caller  : Principal,
    orderId : Text,
  ) : Bool {
    switch (orders.get(orderId)) {
      case null false;
      case (?order) {
        // Fail if already claimed by another partner
        switch (order.deliveryPartnerId) {
          case (?_) return false;
          case null {};
        };
        if (order.status != #placed) return false;
        order.deliveryPartnerId := ?caller;
        order.status            := #confirmed;
        order.updatedAt         := Time.now();
        true
      };
    }
  };

  // ── Delivery partner: reject / unassign order ─────────────────────────────────
  public func rejectOrder(
    orders  : Map.Map<Text, Types.Order>,
    caller  : Principal,
    orderId : Text,
  ) : Bool {
    switch (orders.get(orderId)) {
      case null false;
      case (?order) {
        let isAssigned = switch (order.deliveryPartnerId) {
          case (?pid) Principal.equal(pid, caller);
          case null   false;
        };
        if (not isAssigned) return false;
        order.deliveryPartnerId := null;
        order.status            := #placed;
        order.updatedAt         := Time.now();
        true
      };
    }
  };

  // ── Delivery partner: stats ───────────────────────────────────────────────────
  public func getPartnerStats(
    orders : Map.Map<Text, Types.Order>,
    caller : Principal,
  ) : { totalDelivered : Nat; activeOrders : Nat; todayDeliveries : Nat } {
    let now         = Time.now();
    let dayStart    = now - oneDayNs;
    var totalDelivered : Nat = 0;
    var activeOrders   : Nat = 0;
    var todayDeliveries : Nat = 0;

    orders.values().forEach(func(o : Types.Order) {
      let isMine = switch (o.deliveryPartnerId) {
        case (?pid) Principal.equal(pid, caller);
        case null   false;
      };
      if (isMine) {
        if (o.status == #delivered) {
          totalDelivered += 1;
          if (o.updatedAt >= dayStart) {
            todayDeliveries += 1;
          };
        } else if (o.status == #confirmed or o.status == #preparing or o.status == #out_for_delivery) {
          activeOrders += 1;
        };
      };
    });

    { totalDelivered; activeOrders; todayDeliveries }
  };

  // ── Admin: order stats ────────────────────────────────────────────────────────
  public func getOrderStats(
    orders    : Map.Map<Text, Types.Order>,
    adminList : Set.Set<Principal>,
    caller    : Principal,
  ) : ?{
    totalOrders      : Nat;
    todayOrders      : Nat;
    totalRevenue     : Nat;
    todayRevenue     : Nat;
    placedCount      : Nat;
    confirmedCount   : Nat;
    preparingCount   : Nat;
    outForDelivery   : Nat;
    deliveredCount   : Nat;
    cancelledCount   : Nat;
    activeDeliveries : Nat;
    avgOrderValue    : Nat;
  } {
    if (not adminList.contains(caller)) return null;
    let now      = Time.now();
    let dayStart = now - oneDayNs;

    var totalOrders      : Nat = 0;
    var todayOrders      : Nat = 0;
    var totalRevenue     : Nat = 0;
    var todayRevenue     : Nat = 0;
    var placedCount      : Nat = 0;
    var confirmedCount   : Nat = 0;
    var preparingCount   : Nat = 0;
    var outForDelivery   : Nat = 0;
    var deliveredCount   : Nat = 0;
    var cancelledCount   : Nat = 0;

    orders.values().forEach(func(o : Types.Order) {
      totalOrders += 1;
      if (o.placedAt >= dayStart) {
        todayOrders += 1;
        todayRevenue += o.total;
      };
      totalRevenue += o.total;
      switch (o.status) {
        case (#placed)           { placedCount    += 1 };
        case (#confirmed)        { confirmedCount += 1 };
        case (#preparing)        { preparingCount += 1 };
        case (#out_for_delivery) { outForDelivery += 1 };
        case (#delivered)        { deliveredCount += 1 };
        case (#cancelled)        { cancelledCount += 1 };
      };
    });

    let avgOrderValue = if (totalOrders == 0) { 0 } else { totalRevenue / totalOrders };

    ?{
      totalOrders;
      todayOrders;
      totalRevenue;
      todayRevenue;
      placedCount;
      confirmedCount;
      preparingCount;
      outForDelivery;
      activeDeliveries = outForDelivery;
      deliveredCount;
      cancelledCount;
      avgOrderValue;
    }
  };
};
