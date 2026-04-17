module {
  public type Size = { #small; #medium; #large };
  public type Crust = { #thin; #hand_tossed; #stuffed };

  public type SizeVariant = {
    size : Size;
    priceMultiplier : Float;
    displayName : Text;
  };

  public type CrustVariant = {
    crust : Crust;
    extraPrice : Nat;
    displayName : Text;
  };

  public type AddOn = {
    id : Text;
    name : Text;
    price : Nat;
    category : Text;
  };

  public type Category = {
    id : Text;
    name : Text;
    description : Text;
    imageUrl : Text;
    sortOrder : Nat;
  };

  public type Product = {
    id : Text;
    categoryId : Text;
    name : Text;
    description : Text;
    imageUrl : Text;
    basePrice : Nat;
    sizes : [SizeVariant];
    crusts : [CrustVariant];
    addOns : [Text];
    isAvailable : Bool;
    isArchived : Bool;
    rating : Float;
    ratingCount : Nat;
  };

  // ── Admin update record (all optional — only non-null fields are applied) ──
  public type ProductUpdate = {
    name        : ?Text;
    description : ?Text;
    imageUrl    : ?Text;
    basePrice   : ?Nat;
    categoryId  : ?Text;
    isAvailable : ?Bool;
  };
};
