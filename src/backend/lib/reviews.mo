import Map "mo:core/Map";
import Time "mo:core/Time";
import ReviewTypes "../types/reviews";
import OrderTypes "../types/orders";

module {
  // ── Internal helpers ────────────────────────────────────────────────────────

  func makeId(orderId : Text, now : Int) : Text {
    "rev-" # orderId # "-" # now.toText()
  };

  public func submitReview(
    reviews   : Map.Map<Text, ReviewTypes.OrderReview>,
    orders    : Map.Map<Text, OrderTypes.Order>,
    caller    : Principal,
    orderId   : Text,
    rating    : Nat,
    comment   : ?Text,
  ) : ReviewTypes.ReviewResult {
    // Validate rating range 1-5
    if (rating < 1 or rating > 5) return #err("Rating must be between 1 and 5");

    // Must not already have reviewed
    switch (reviews.get(orderId)) {
      case (?_) return #err("You have already reviewed this order");
      case null {};
    };

    // Order must exist and caller must be its customer
    switch (orders.get(orderId)) {
      case null return #err("Order not found");
      case (?order) {
        if (not Principal.equal(order.customerId, caller)) return #err("Not your order");
        if (order.status != #delivered) return #err("Order must be delivered before reviewing");
      };
    };

    let now = Time.now();
    let review : ReviewTypes.OrderReview = {
      id             = makeId(orderId, now);
      orderId;
      customerId     = caller;
      productRatings = [];
      overallRating  = rating;
      comment;
      createdAt      = now;
    };
    reviews.add(orderId, review);
    #ok(review)
  };

  public func getReview(
    reviews : Map.Map<Text, ReviewTypes.OrderReview>,
    orderId : Text,
  ) : ?ReviewTypes.OrderReview {
    reviews.get(orderId)
  };

  public func listAllReviews(
    reviews : Map.Map<Text, ReviewTypes.OrderReview>,
  ) : [ReviewTypes.OrderReview] {
    reviews.values().toArray()
  };
};
