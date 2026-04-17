import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import LoyaltyTypes "../types/loyalty";
import LoyaltyLib "../lib/loyalty";

mixin (
  loyaltyAccounts     : Map.Map<Principal, LoyaltyTypes.LoyaltyAccount>,
  loyaltyTransactions : Map.Map<Text, LoyaltyTypes.PointsTransaction>,
) {
  /// Return the loyalty account for the caller, or null if they have none yet.
  public shared ({ caller }) func getLoyaltyAccount() : async ?LoyaltyTypes.LoyaltyAccountPublic {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    LoyaltyLib.getAccount(loyaltyAccounts, caller)
  };

  /// Return all points transactions for the caller.
  public shared ({ caller }) func getPointsHistory() : async [LoyaltyTypes.PointsTransaction] {
    if (caller.isAnonymous()) Runtime.trap("Not authenticated");
    LoyaltyLib.getHistory(loyaltyTransactions, caller)
  };
};
