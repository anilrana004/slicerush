import Time "mo:core/Time";

module {
  /// Internal mutable type (stored in Map)
  public type PromoBanner = {
    id          : Text;
    title       : Text;
    description : Text;
    imageUrl    : Text;
    ctaText     : Text;
    ctaLink     : Text;
    couponCode  : ?Text;
    var isActive : Bool;
    priority    : Nat;
    createdAt   : Time.Time;
  };

  /// Shared/public type for API boundaries (no var fields)
  public type PromoBannerPublic = {
    id          : Text;
    title       : Text;
    description : Text;
    imageUrl    : Text;
    ctaText     : Text;
    ctaLink     : Text;
    couponCode  : ?Text;
    isActive    : Bool;
    priority    : Nat;
    createdAt   : Time.Time;
  };

  public type BannerResult = {
    #ok  : PromoBannerPublic;
    #err : Text;
  };

  public type DeleteResult = {
    #ok  : ();
    #err : Text;
  };
};
