import Time "mo:core/Time";

module {
  public type NotificationType = {
    #orderConfirmed;
    #orderPreparing;
    #outForDelivery;
    #orderDelivered;
    #orderCancelled;
    #promoAlert;
    #couponExpiry;
  };

  /// Internal mutable type (stored in Map)
  public type Notification = {
    id        : Text;
    userId    : Principal;
    notifType : NotificationType;
    title     : Text;
    message   : Text;
    orderId   : ?Text;
    var read  : Bool;
    createdAt : Time.Time;
  };

  /// Shared/public type for API boundaries (no var fields)
  public type NotificationPublic = {
    id        : Text;
    userId    : Principal;
    notifType : NotificationType;
    title     : Text;
    message   : Text;
    orderId   : ?Text;
    read      : Bool;
    createdAt : Time.Time;
  };

  public type NotifResult = {
    #ok  : ();
    #err : Text;
  };
};
