import Map        "mo:core/Map";
import Set        "mo:core/Set";
import Runtime    "mo:core/Runtime";
import OrderTypes "../types/orders";
import OrderLib   "../lib/orders";
import NotifLib   "../lib/notifications";
import NotifTypes "../types/notifications";
import LoyaltyLib "../lib/loyalty";
import LoyaltyTypes "../types/loyalty";
import List "mo:core/List";

mixin (
  orders              : Map.Map<Text, OrderTypes.Order>,
  adminList           : Set.Set<Principal>,
  notifications       : Map.Map<Text, NotifTypes.Notification>,
  userNotifIndex      : Map.Map<Principal, List.List<Text>>,
  loyaltyAccounts     : Map.Map<Principal, LoyaltyTypes.LoyaltyAccount>,
  loyaltyTransactions : Map.Map<Text, LoyaltyTypes.PointsTransaction>,
) {
  // ── Shared output type (no var fields) ────────────────────────────────────────
  type OrderOut = {
    id                       : Text;
    customerId               : Principal;
    items                    : [OrderTypes.OrderItem];
    subtotal                 : Nat;
    deliveryFee              : Nat;
    discountAmount           : Nat;
    total                    : Nat;
    status                   : OrderTypes.OrderStatus;
    couponCode               : ?Text;
    deliveryAddress          : Text;
    deliveryPartnerId        : ?Principal;
    deliveryPartnerLocation  : ?OrderTypes.DeliveryLocation;
    placedAt                 : Int;
    updatedAt                : Int;
    estimatedDeliveryMinutes : Nat;
    cancellationReason       : ?Text;
    paymentIntentId          : ?Text;
    paymentVerified          : Bool;
    paymentRefunded          : Bool;
  };

  func toOut(o : OrderTypes.Order) : OrderOut = {
    id                       = o.id;
    customerId               = o.customerId;
    items                    = o.items;
    subtotal                 = o.subtotal;
    deliveryFee              = o.deliveryFee;
    discountAmount           = o.discountAmount;
    total                    = o.total;
    status                   = o.status;
    couponCode               = o.couponCode;
    deliveryAddress          = o.deliveryAddress;
    deliveryPartnerId        = o.deliveryPartnerId;
    deliveryPartnerLocation  = o.deliveryPartnerLocation;
    placedAt                 = o.placedAt;
    updatedAt                = o.updatedAt;
    estimatedDeliveryMinutes = o.estimatedDeliveryMinutes;
    cancellationReason       = o.cancellationReason;
    paymentIntentId          = o.paymentIntentId;
    paymentVerified          = o.paymentVerified;
    paymentRefunded          = o.paymentRefunded;
  };

  // ── Notification helper ───────────────────────────────────────────────────────
  func sendOrderNotif(
    customerId : Principal,
    status     : OrderTypes.OrderStatus,
    orderId    : Text,
  ) {
    let (notifType, title, message) : (NotifTypes.NotificationType, Text, Text) = switch (status) {
      case (#confirmed)        (#orderConfirmed,  "Order Confirmed!",            "Your order has been confirmed!");
      case (#preparing)        (#orderPreparing,  "Order Being Prepared",        "Your food is being prepared!");
      case (#out_for_delivery) (#outForDelivery,  "Order On Its Way!",           "Your order is on its way!");
      case (#delivered)        (#orderDelivered,  "Order Delivered!",            "Your order has been delivered! Enjoy!");
      case (#cancelled)        (#orderCancelled,  "Order Cancelled",             "Your order has been cancelled.");
      case (#placed)           (#orderConfirmed,  "Order Placed",                "Your order has been placed.");
    };
    NotifLib.createNotification(
      notifications, userNotifIndex,
      customerId, notifType, title, message, ?orderId
    );
  };

  // ── Place order ───────────────────────────────────────────────────────────────
  public shared ({ caller }) func placeOrder(
    items                    : [OrderTypes.OrderItem],
    subtotal                 : Nat,
    deliveryFee              : Nat,
    discountAmount           : Nat,
    total                    : Nat,
    couponCode               : ?Text,
    deliveryAddress          : Text,
    estimatedDeliveryMinutes : Nat,
  ) : async OrderOut {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    let order = OrderLib.placeOrder(
      orders, caller, items, subtotal, deliveryFee, discountAmount, total,
      couponCode, deliveryAddress, estimatedDeliveryMinutes
    );
    toOut(order)
  };

  // ── Get single order ──────────────────────────────────────────────────────────
  public shared query ({ caller }) func getOrder(id : Text) : async ?OrderOut {
    switch (OrderLib.getOrder(orders, caller, adminList, id)) {
      case null  null;
      case (?o)  ?toOut(o);
    }
  };

  // ── My orders ─────────────────────────────────────────────────────────────────
  public shared query ({ caller }) func getMyOrders() : async [OrderOut] {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    let list = OrderLib.getMyOrders(orders, caller);
    list.map<OrderTypes.Order, OrderOut>(toOut)
  };

  // ── Update order status ───────────────────────────────────────────────────────
  public shared ({ caller }) func updateOrderStatus(
    id     : Text,
    status : OrderTypes.OrderStatus,
  ) : async Bool {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    let success = OrderLib.updateOrderStatus(orders, caller, adminList, id, status);
    if (success) {
      switch (orders.get(id)) {
        case (?order) sendOrderNotif(order.customerId, status, id);
        case null {};
      };
    };
    success
  };

  // ── Cancel order ──────────────────────────────────────────────────────────────
  public shared ({ caller }) func cancelOrder(orderId : Text, reason : Text) : async Text {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    switch (OrderLib.cancelOrder(orders, caller, orderId, reason)) {
      case (#ok) {
        switch (orders.get(orderId)) {
          case (?order) sendOrderNotif(order.customerId, #cancelled, orderId);
          case null {};
        };
        "ok"
      };
      case (#notFound)       { "notFound" };
      case (#unauthorized)   { "unauthorized" };
      case (#notCancellable) { "notCancellable" };
    }
  };

  // ── Verify and confirm order (admin / payment webhook) ────────────────────────
  public shared ({ caller }) func verifyAndConfirmOrder(
    orderId         : Text,
    paymentIntentId : Text,
  ) : async Bool {
    let success = OrderLib.verifyAndConfirmOrder(orders, adminList, caller, orderId, paymentIntentId);
    if (success) {
      switch (orders.get(orderId)) {
        case (?order) {
          sendOrderNotif(order.customerId, #confirmed, orderId);
          LoyaltyLib.awardPoints(
            loyaltyAccounts, loyaltyTransactions,
            order.customerId, orderId, order.total
          );
        };
        case null {};
      };
    };
    success
  };

  // ── Orders by status (delivery partner queue) ─────────────────────────────────
  public shared query ({ caller }) func getOrdersByStatus(
    status : OrderTypes.OrderStatus,
  ) : async [OrderOut] {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    let list = OrderLib.getOrdersByStatus(orders, status);
    list.map<OrderTypes.Order, OrderOut>(toOut)
  };

  // ── Assign delivery partner (admin only) ──────────────────────────────────────
  public shared ({ caller }) func assignDeliveryPartner(
    orderId   : Text,
    partnerId : Principal,
  ) : async Bool {
    OrderLib.assignDeliveryPartner(orders, adminList, caller, orderId, partnerId)
  };

  // ── Update delivery location ──────────────────────────────────────────────────
  public shared ({ caller }) func updateDeliveryLocation(
    orderId : Text,
    lat     : Float,
    lng     : Float,
  ) : async Bool {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    OrderLib.updateDeliveryLocation(orders, caller, orderId, lat, lng)
  };

  // ── Delivery partner: available orders (unassigned, #placed) ─────────────────
  public shared query ({ caller }) func getAvailableOrders() : async [OrderOut] {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    let list = OrderLib.getAvailableOrders(orders);
    list.map<OrderTypes.Order, OrderOut>(toOut)
  };

  // ── Delivery partner: my assigned orders ──────────────────────────────────────
  public shared query ({ caller }) func getMyAssignedOrders() : async [OrderOut] {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    let list = OrderLib.getMyAssignedOrders(orders, caller);
    list.map<OrderTypes.Order, OrderOut>(toOut)
  };

  // ── Delivery partner: accept order ───────────────────────────────────────────
  public shared ({ caller }) func acceptOrder(orderId : Text) : async Bool {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    OrderLib.acceptOrder(orders, caller, orderId)
  };

  // ── Delivery partner: reject order ───────────────────────────────────────────
  public shared ({ caller }) func rejectOrder(orderId : Text) : async Bool {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    OrderLib.rejectOrder(orders, caller, orderId)
  };

  // ── Delivery partner: stats ───────────────────────────────────────────────────
  public shared query ({ caller }) func getPartnerStats() : async {
    totalDelivered  : Nat;
    activeOrders    : Nat;
    todayDeliveries : Nat;
  } {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    OrderLib.getPartnerStats(orders, caller)
  };

  // ── Admin: order stats ────────────────────────────────────────────────────────
  public shared query ({ caller }) func getOrderStats() : async ?{
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
    OrderLib.getOrderStats(orders, adminList, caller)
  };

  // ── Quick-reorder: fetch items from a past delivered order ────────────────────
  public shared query ({ caller }) func getOrderForReorder(
    orderId : Text,
  ) : async { #ok : [OrderTypes.OrderItem]; #err : Text } {
    if (caller.isAnonymous()) return #err("Not authenticated");
    switch (orders.get(orderId)) {
      case null #err("Order not found");
      case (?order) {
        if (not Principal.equal(order.customerId, caller)) return #err("Not your order");
        #ok(order.items)
      };
    }
  };
};
