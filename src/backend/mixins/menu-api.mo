import Map "mo:core/Map";
import Set "mo:core/Set";
import Runtime "mo:core/Runtime";
import Types "../types/menu";
import AuthTypes "../types/auth";
import MenuLib "../lib/menu";

mixin (
  categories : Map.Map<Text, Types.Category>,
  products : Map.Map<Text, Types.Product>,
  addOns : Map.Map<Text, Types.AddOn>,
  adminList : Set.Set<Principal>,
  profiles : Map.Map<Principal, AuthTypes.UserProfile>,
) {

  // ── Public read endpoints ─────────────────────────────────────────────────

  public query func getCategories() : async [Types.Category] {
    MenuLib.getCategories(categories)
  };

  public query func getProducts() : async [Types.Product] {
    MenuLib.getProducts(products)
  };

  public query func getProductsByCategory(categoryId : Text) : async [Types.Product] {
    MenuLib.getProductsByCategory(products, categoryId)
  };

  public query func getProduct(id : Text) : async ?Types.Product {
    MenuLib.getProduct(products, id)
  };

  public query func getAddOns() : async [Types.AddOn] {
    MenuLib.getAddOns(addOns)
  };

  // ── Admin: create endpoints ───────────────────────────────────────────────

  public shared ({ caller }) func createCategory(category : Types.Category) : async () {
    if (not adminList.contains(caller)) Runtime.trap("Unauthorized: admin only");
    MenuLib.createCategory(categories, category);
  };

  public shared ({ caller }) func createProduct(product : Types.Product) : async () {
    if (not adminList.contains(caller)) Runtime.trap("Unauthorized: admin only");
    MenuLib.createProduct(products, product);
  };

  public shared ({ caller }) func createAddOn(addOn : Types.AddOn) : async () {
    if (not adminList.contains(caller)) Runtime.trap("Unauthorized: admin only");
    MenuLib.createAddOn(addOns, addOn);
  };

  // ── Admin: update / delete products ──────────────────────────────────────

  public shared ({ caller }) func updateProduct(
    productId : Text,
    updates   : Types.ProductUpdate,
  ) : async Bool {
    if (not adminList.contains(caller)) Runtime.trap("Unauthorized: admin only");
    MenuLib.updateProduct(products, productId, updates)
  };

  public shared ({ caller }) func deleteProduct(productId : Text) : async Bool {
    if (not adminList.contains(caller)) Runtime.trap("Unauthorized: admin only");
    MenuLib.deleteProduct(products, productId)
  };

  // ── Admin: update / delete categories ────────────────────────────────────

  public shared ({ caller }) func updateCategory(
    categoryId : Text,
    name       : Text,
    imageUrl   : ?Text,
    sortOrder  : ?Nat,
  ) : async Bool {
    if (not adminList.contains(caller)) Runtime.trap("Unauthorized: admin only");
    MenuLib.updateCategory(categories, categoryId, name, imageUrl, sortOrder)
  };

  public shared ({ caller }) func deleteCategory(categoryId : Text) : async Text {
    if (not adminList.contains(caller)) Runtime.trap("Unauthorized: admin only");
    switch (MenuLib.deleteCategory(categories, products, categoryId)) {
      case (#ok)          { "ok" };
      case (#notFound)    { "notFound" };
      case (#hasProducts) { "hasProducts" };
    }
  };

  // ── Admin: update / delete add-ons ───────────────────────────────────────

  public shared ({ caller }) func updateAddOn(
    addOnId : Text,
    name    : Text,
    price   : Nat,
  ) : async Bool {
    if (not adminList.contains(caller)) Runtime.trap("Unauthorized: admin only");
    MenuLib.updateAddOn(addOns, addOnId, name, price)
  };

  public shared ({ caller }) func deleteAddOn(addOnId : Text) : async Bool {
    if (not adminList.contains(caller)) Runtime.trap("Unauthorized: admin only");
    MenuLib.deleteAddOn(addOns, addOnId)
  };
};
