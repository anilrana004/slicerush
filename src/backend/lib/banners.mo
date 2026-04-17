import Map "mo:core/Map";
import Time "mo:core/Time";
import BannerTypes "../types/banners";

module {
  // ── Helpers ─────────────────────────────────────────────────────────────────

  public func toPublic(b : BannerTypes.PromoBanner) : BannerTypes.PromoBannerPublic {
    {
      id          = b.id;
      title       = b.title;
      description = b.description;
      imageUrl    = b.imageUrl;
      ctaText     = b.ctaText;
      ctaLink     = b.ctaLink;
      couponCode  = b.couponCode;
      isActive    = b.isActive;
      priority    = b.priority;
      createdAt   = b.createdAt;
    };
  };

  // ── Seeder ──────────────────────────────────────────────────────────────────

  public func seedBanners(banners : Map.Map<Text, BannerTypes.PromoBanner>) : () {
    let now = Time.now();
    let seeds : [(Text, Text, Text, Text, Text, Text, ?Text, Bool, Nat)] = [
      (
        "banner-1",
        "20% Off Your First Order",
        "New to SliceRush? Enjoy 20% off your first order. Limited time offer!",
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
        "Order Now",
        "/menu",
        ?"WELCOME20",
        true,
        1,
      ),
      (
        "banner-2",
        "Free Delivery on Orders Over $30",
        "Spend $30 or more and get free delivery straight to your door.",
        "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800",
        "Browse Menu",
        "/menu",
        null,
        true,
        2,
      ),
      (
        "banner-3",
        "New: Truffle Mushroom Pizza Is Here",
        "Our latest creation — earthy truffle oil, wild mushrooms, and mozzarella on a crispy thin crust.",
        "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800",
        "Try It Now",
        "/menu",
        null,
        true,
        3,
      ),
    ];

    for ((id, title, description, imageUrl, ctaText, ctaLink, couponCode, isActive, priority) in seeds.values()) {
      let banner : BannerTypes.PromoBanner = {
        id;
        title;
        description;
        imageUrl;
        ctaText;
        ctaLink;
        couponCode;
        var isActive = isActive;
        priority;
        createdAt = now;
      };
      banners.add(id, banner);
    };
  };

  // ── Public reads ────────────────────────────────────────────────────────────

  public func getActive(
    banners : Map.Map<Text, BannerTypes.PromoBanner>,
  ) : [BannerTypes.PromoBannerPublic] {
    let active = banners.values()
      .filter(func(b : BannerTypes.PromoBanner) : Bool { b.isActive })
      .map(toPublic)
      .toArray();
    active.sort(func(a : BannerTypes.PromoBannerPublic, b : BannerTypes.PromoBannerPublic) : {#less;#equal;#greater} {
      if (a.priority < b.priority) #less
      else if (a.priority > b.priority) #greater
      else #equal
    })
  };

  // ── Admin mutations ─────────────────────────────────────────────────────────

  public func create(
    banners     : Map.Map<Text, BannerTypes.PromoBanner>,
    title       : Text,
    description : Text,
    imageUrl    : Text,
    ctaText     : Text,
    ctaLink     : Text,
    couponCode  : ?Text,
    priority    : Nat,
  ) : BannerTypes.BannerResult {
    let now = Time.now();
    let id  = "banner-" # now.toText();
    let banner : BannerTypes.PromoBanner = {
      id;
      title;
      description;
      imageUrl;
      ctaText;
      ctaLink;
      couponCode;
      var isActive = true;
      priority;
      createdAt    = now;
    };
    banners.add(id, banner);
    #ok(toPublic(banner))
  };

  public func update(
    banners     : Map.Map<Text, BannerTypes.PromoBanner>,
    id          : Text,
    title       : ?Text,
    description : ?Text,
    imageUrl    : ?Text,
    ctaText     : ?Text,
    ctaLink     : ?Text,
    couponCode  : ?Text,
    priority    : ?Nat,
  ) : BannerTypes.BannerResult {
    switch (banners.get(id)) {
      case null #err("Banner not found");
      case (?banner) {
        let updated : BannerTypes.PromoBanner = {
          id          = banner.id;
          title       = switch (title)       { case (?v) v; case null banner.title       };
          description = switch (description) { case (?v) v; case null banner.description };
          imageUrl    = switch (imageUrl)    { case (?v) v; case null banner.imageUrl    };
          ctaText     = switch (ctaText)     { case (?v) v; case null banner.ctaText     };
          ctaLink     = switch (ctaLink)     { case (?v) v; case null banner.ctaLink     };
          couponCode  = switch (couponCode)  { case (?v) ?v; case null banner.couponCode };
          var isActive = banner.isActive;
          priority    = switch (priority)    { case (?v) v; case null banner.priority    };
          createdAt   = banner.createdAt;
        };
        banners.add(id, updated);
        #ok(toPublic(updated))
      };
    }
  };

  public func remove(
    banners : Map.Map<Text, BannerTypes.PromoBanner>,
    id      : Text,
  ) : BannerTypes.DeleteResult {
    switch (banners.get(id)) {
      case null #err("Banner not found");
      case (?_) {
        banners.remove(id);
        #ok(())
      };
    }
  };

  public func toggleActive(
    banners : Map.Map<Text, BannerTypes.PromoBanner>,
    id      : Text,
  ) : BannerTypes.BannerResult {
    switch (banners.get(id)) {
      case null #err("Banner not found");
      case (?banner) {
        banner.isActive := not banner.isActive;
        #ok(toPublic(banner))
      };
    }
  };
};
