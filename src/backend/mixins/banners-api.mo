import Map "mo:core/Map";
import Set "mo:core/Set";
import Runtime "mo:core/Runtime";
import BannerTypes "../types/banners";
import BannerLib "../lib/banners";

mixin (
  banners   : Map.Map<Text, BannerTypes.PromoBanner>,
  adminList : Set.Set<Principal>,
) {
  /// Return all active banners sorted by priority ascending.
  public query func getActiveBanners() : async [BannerTypes.PromoBannerPublic] {
    BannerLib.getActive(banners)
  };

  /// Admin: create a new promotional banner.
  public shared ({ caller }) func createBanner(
    title       : Text,
    description : Text,
    imageUrl    : Text,
    ctaText     : Text,
    ctaLink     : Text,
    couponCode  : ?Text,
    priority    : Nat,
  ) : async BannerTypes.BannerResult {
    if (not adminList.contains(caller)) Runtime.trap("Unauthorized");
    BannerLib.create(banners, title, description, imageUrl, ctaText, ctaLink, couponCode, priority)
  };

  /// Admin: update fields of an existing banner (pass null to leave field unchanged).
  public shared ({ caller }) func updateBanner(
    id          : Text,
    title       : ?Text,
    description : ?Text,
    imageUrl    : ?Text,
    ctaText     : ?Text,
    ctaLink     : ?Text,
    couponCode  : ?Text,
    priority    : ?Nat,
  ) : async BannerTypes.BannerResult {
    if (not adminList.contains(caller)) Runtime.trap("Unauthorized");
    BannerLib.update(banners, id, title, description, imageUrl, ctaText, ctaLink, couponCode, priority)
  };

  /// Admin: delete a banner by ID.
  public shared ({ caller }) func deleteBanner(id : Text) : async BannerTypes.DeleteResult {
    if (not adminList.contains(caller)) Runtime.trap("Unauthorized");
    BannerLib.remove(banners, id)
  };

  /// Admin: flip the isActive flag on a banner.
  public shared ({ caller }) func toggleBannerActive(id : Text) : async BannerTypes.BannerResult {
    if (not adminList.contains(caller)) Runtime.trap("Unauthorized");
    BannerLib.toggleActive(banners, id)
  };
};
