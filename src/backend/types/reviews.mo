import Time "mo:core/Time";

module {
  public type ProductRating = {
    productId : Text;
    rating    : Nat; // 1-5
  };

  public type OrderReview = {
    id             : Text;
    orderId        : Text;
    customerId     : Principal;
    productRatings : [ProductRating];
    overallRating  : Nat; // 1-5
    comment        : ?Text;
    createdAt      : Time.Time;
  };

  public type ReviewResult = {
    #ok  : OrderReview;
    #err : Text;
  };
};
