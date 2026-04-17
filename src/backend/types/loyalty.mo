import Time "mo:core/Time";

module {
  public type LoyaltyTier = {
    #bronze;
    #silver;
    #gold;
  };

  /// Internal mutable type (stored in Map)
  public type LoyaltyAccount = {
    userId                : Principal;
    var points            : Nat;
    var totalPointsEarned : Nat;
    var tier              : LoyaltyTier;
    joinedAt              : Time.Time;
  };

  /// Shared/public type for API boundaries (no var fields)
  public type LoyaltyAccountPublic = {
    userId            : Principal;
    points            : Nat;
    totalPointsEarned : Nat;
    tier              : LoyaltyTier;
    joinedAt          : Time.Time;
  };

  public type PointsTransaction = {
    id          : Text;
    userId      : Principal;
    points      : Int;  // positive = earned, negative = redeemed
    txnType     : { #earned; #redeemed };
    orderId     : ?Text;
    description : Text;
    createdAt   : Time.Time;
  };
};
