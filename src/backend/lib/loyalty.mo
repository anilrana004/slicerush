import Map "mo:core/Map";
import Time "mo:core/Time";
import Int "mo:core/Int";
import LoyaltyTypes "../types/loyalty";

module {
  // ── Tier thresholds ─────────────────────────────────────────────────────────
  let silverThreshold : Nat = 500;
  let goldThreshold   : Nat = 2000;

  func tierFor(totalEarned : Nat) : LoyaltyTypes.LoyaltyTier {
    if (totalEarned >= goldThreshold)   #gold
    else if (totalEarned >= silverThreshold) #silver
    else #bronze
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────

  public func toPublic(a : LoyaltyTypes.LoyaltyAccount) : LoyaltyTypes.LoyaltyAccountPublic {
    {
      userId            = a.userId;
      points            = a.points;
      totalPointsEarned = a.totalPointsEarned;
      tier              = a.tier;
      joinedAt          = a.joinedAt;
    };
  };

  // ── Internal award helper (called from verifyAndConfirmOrder) ───────────────

  public func awardPoints(
    accounts         : Map.Map<Principal, LoyaltyTypes.LoyaltyAccount>,
    transactions     : Map.Map<Text, LoyaltyTypes.PointsTransaction>,
    userId           : Principal,
    orderId          : Text,
    orderAmountCents : Nat,
  ) : () {
    let pts = orderAmountCents / 100; // 1 point per dollar
    if (pts == 0) return;

    let now = Time.now();

    // Create or update account
    let account = switch (accounts.get(userId)) {
      case (?acc) {
        acc.points            += pts;
        acc.totalPointsEarned += pts;
        acc.tier              := tierFor(acc.totalPointsEarned);
        acc
      };
      case null {
        let acc : LoyaltyTypes.LoyaltyAccount = {
          userId;
          var points            = pts;
          var totalPointsEarned = pts;
          var tier              = tierFor(pts);
          joinedAt              = now;
        };
        accounts.add(userId, acc);
        acc
      };
    };
    // Silence unused warning
    ignore account;

    // Record transaction
    let txnId = "txn-" # orderId # "-" # now.toText();
    let txn : LoyaltyTypes.PointsTransaction = {
      id          = txnId;
      userId;
      points      = Int.fromNat(pts);
      txnType     = #earned;
      orderId     = ?orderId;
      description = "Points earned for order " # orderId;
      createdAt   = now;
    };
    transactions.add(txnId, txn);
  };

  // ── Public reads ────────────────────────────────────────────────────────────

  public func getAccount(
    accounts : Map.Map<Principal, LoyaltyTypes.LoyaltyAccount>,
    caller   : Principal,
  ) : ?LoyaltyTypes.LoyaltyAccountPublic {
    switch (accounts.get(caller)) {
      case null null;
      case (?acc) ?toPublic(acc);
    }
  };

  public func getHistory(
    transactions : Map.Map<Text, LoyaltyTypes.PointsTransaction>,
    caller       : Principal,
  ) : [LoyaltyTypes.PointsTransaction] {
    let mine = transactions.values()
      .filter(func(t : LoyaltyTypes.PointsTransaction) : Bool {
        Principal.equal(t.userId, caller)
      })
      .toArray();
    let sorted = mine.sort(func(a : LoyaltyTypes.PointsTransaction, b : LoyaltyTypes.PointsTransaction) : {#less;#equal;#greater} {
      if (b.createdAt > a.createdAt) #greater
      else if (b.createdAt < a.createdAt) #less
      else #equal
    });
    if (sorted.size() <= 100) sorted
    else sorted.sliceToArray(0, 100)
  };
};
