import Time "mo:core/Time";

module {
  public type OrderStatus = {
    #placed;
    #confirmed;
    #preparing;
    #out_for_delivery;
    #delivered;
    #cancelled;
  };

  public type OrderItem = {
    productId   : Text;
    productName : Text;
    imageUrl    : Text;
    size        : Text;
    crust       : Text;
    addOns      : [Text];
    quantity    : Nat;
    unitPrice   : Nat;
    totalPrice  : Nat;
  };

  public type DeliveryLocation = {
    lat : Float;
    lng : Float;
  };

  public type Order = {
    id                       : Text;
    customerId               : Principal;
    items                    : [OrderItem];
    subtotal                 : Nat;
    deliveryFee              : Nat;
    discountAmount           : Nat;
    total                    : Nat;
    var status               : OrderStatus;
    couponCode               : ?Text;
    deliveryAddress          : Text;
    var deliveryPartnerId    : ?Principal;
    var deliveryPartnerLocation : ?DeliveryLocation;
    placedAt                 : Time.Time;
    var updatedAt            : Time.Time;
    estimatedDeliveryMinutes : Nat;
    // New fields
    var cancellationReason   : ?Text;
    var paymentIntentId      : ?Text;
    var paymentVerified      : Bool;
    var paymentRefunded      : Bool;
  };
};
