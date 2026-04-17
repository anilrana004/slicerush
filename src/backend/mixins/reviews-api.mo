import Map "mo:core/Map";
import Set "mo:core/Set";
import Runtime "mo:core/Runtime";
import ReviewTypes "../types/reviews";
import OrderTypes "../types/orders";
import ReviewLib "../lib/reviews";

mixin (
  reviews   : Map.Map<Text, ReviewTypes.OrderReview>,
  orders    : Map.Map<Text, OrderTypes.Order>,
  adminList : Set.Set<Principal>,
) {
  /// Submit a review for a delivered order. Only the placing customer may review,
  /// and only once per order.
  public shared ({ caller }) func submitOrderReview(
    orderId : Text,
    rating  : Nat,
    comment : ?Text,
  ) : async ReviewTypes.ReviewResult {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    ReviewLib.submitReview(reviews, orders, caller, orderId, rating, comment)
  };

  /// Retrieve the review for a given order (if any).
  public query func getOrderReview(orderId : Text) : async ?ReviewTypes.OrderReview {
    ReviewLib.getReview(reviews, orderId)
  };

  /// Admin: list every review in the system.
  public shared ({ caller }) func getAllReviews() : async [ReviewTypes.OrderReview] {
    if (not adminList.contains(caller)) Runtime.trap("Unauthorized");
    ReviewLib.listAllReviews(reviews)
  };
};
