import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Types "../types/menu";

module {
  public type Category = Types.Category;
  public type Product = Types.Product;
  public type AddOn = Types.AddOn;
  public type SizeVariant = Types.SizeVariant;
  public type CrustVariant = Types.CrustVariant;

  // ── Default size/crust variants shared across pizzas ──────────────────────

  let defaultSizes : [SizeVariant] = [
    { size = #small; priceMultiplier = 1.0; displayName = "Small (8\")" },
    { size = #medium; priceMultiplier = 1.4; displayName = "Medium (12\")" },
    { size = #large; priceMultiplier = 1.8; displayName = "Large (16\")" },
  ];

  let defaultCrusts : [CrustVariant] = [
    { crust = #thin; extraPrice = 0; displayName = "Thin Crust" },
    { crust = #hand_tossed; extraPrice = 0; displayName = "Hand-Tossed" },
    { crust = #stuffed; extraPrice = 150; displayName = "Stuffed Crust (+₹1.50)" },
  ];

  // ── Seed helpers ───────────────────────────────────────────────────────────

  public func seedCategories(
    categories : Map.Map<Text, Category>
  ) {
    let items : [Category] = [
      {
        id = "cat-pizzas";
        name = "Pizzas";
        description = "Hand-crafted pizzas baked to perfection";
        imageUrl = "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800";
        sortOrder = 1;
      },
      {
        id = "cat-sides";
        name = "Sides";
        description = "Perfect companions to your pizza";
        imageUrl = "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=800";
        sortOrder = 2;
      },
      {
        id = "cat-beverages";
        name = "Beverages";
        description = "Refreshing drinks to complete your meal";
        imageUrl = "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800";
        sortOrder = 3;
      },
      {
        id = "cat-desserts";
        name = "Desserts";
        description = "Sweet endings to your meal";
        imageUrl = "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800";
        sortOrder = 4;
      },
    ];
    for (item in items.vals()) {
      categories.add(item.id, item);
    };
  };

  public func seedAddOns(addOns : Map.Map<Text, AddOn>) {
    let items : [AddOn] = [
      { id = "addon-extra-cheese"; name = "Extra Cheese"; price = 100; category = "cheese" },
      { id = "addon-mozzarella"; name = "Mozzarella"; price = 120; category = "cheese" },
      { id = "addon-pepperoni"; name = "Pepperoni"; price = 150; category = "meat" },
      { id = "addon-chicken"; name = "Grilled Chicken"; price = 180; category = "meat" },
      { id = "addon-olives"; name = "Black Olives"; price = 80; category = "veggie" },
      { id = "addon-mushrooms"; name = "Mushrooms"; price = 80; category = "veggie" },
      { id = "addon-capsicum"; name = "Capsicum"; price = 70; category = "veggie" },
      { id = "addon-jalapeno"; name = "Jalapeños"; price = 70; category = "veggie" },
      { id = "addon-onion"; name = "Caramelized Onion"; price = 60; category = "veggie" },
      { id = "addon-corn"; name = "Sweet Corn"; price = 60; category = "veggie" },
    ];
    for (item in items.vals()) {
      addOns.add(item.id, item);
    };
  };

  public func seedProducts(products : Map.Map<Text, Product>) {
    let pizzaAddOns = [
      "addon-extra-cheese",
      "addon-mozzarella",
      "addon-pepperoni",
      "addon-chicken",
      "addon-olives",
      "addon-mushrooms",
      "addon-capsicum",
      "addon-jalapeno",
      "addon-onion",
      "addon-corn",
    ];

    let pizzas : [Product] = [
      {
        id = "prod-margherita";
        categoryId = "cat-pizzas";
        name = "Classic Margherita";
        description = "Fresh tomato sauce, mozzarella, and fragrant basil on a golden crust";
        imageUrl = "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800";
        basePrice = 599;
        sizes = defaultSizes;
        crusts = defaultCrusts;
        addOns = pizzaAddOns;
        isAvailable = true;
        isArchived = false;
        rating = 4.7;
        ratingCount = 1240;
      },
      {
        id = "prod-pepperoni";
        categoryId = "cat-pizzas";
        name = "Pepperoni Feast";
        description = "Loaded with premium pepperoni slices and melted mozzarella";
        imageUrl = "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800";
        basePrice = 749;
        sizes = defaultSizes;
        crusts = defaultCrusts;
        addOns = pizzaAddOns;
        isAvailable = true;
        isArchived = false;
        rating = 4.8;
        ratingCount = 2105;
      },
      {
        id = "prod-bbq-chicken";
        categoryId = "cat-pizzas";
        name = "BBQ Chicken Blaze";
        description = "Smoky BBQ sauce, grilled chicken, red onion, and cheddar";
        imageUrl = "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=800";
        basePrice = 799;
        sizes = defaultSizes;
        crusts = defaultCrusts;
        addOns = pizzaAddOns;
        isAvailable = true;
        isArchived = false;
        rating = 4.6;
        ratingCount = 987;
      },
      {
        id = "prod-veggie-supreme";
        categoryId = "cat-pizzas";
        name = "Veggie Supreme";
        description = "Capsicum, mushrooms, olives, corn, and jalapeños on tangy marinara";
        imageUrl = "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=800";
        basePrice = 649;
        sizes = defaultSizes;
        crusts = defaultCrusts;
        addOns = pizzaAddOns;
        isAvailable = true;
        isArchived = false;
        rating = 4.5;
        ratingCount = 763;
      },
      {
        id = "prod-four-cheese";
        categoryId = "cat-pizzas";
        name = "Four Cheese Delight";
        description = "Mozzarella, cheddar, parmesan, and gouda melted together in harmony";
        imageUrl = "https://images.unsplash.com/photo-1548369937-47519962c11a?w=800";
        basePrice = 849;
        sizes = defaultSizes;
        crusts = defaultCrusts;
        addOns = pizzaAddOns;
        isAvailable = true;
        isArchived = false;
        rating = 4.9;
        ratingCount = 1543;
      },
      {
        id = "prod-spicy-paneer";
        categoryId = "cat-pizzas";
        name = "Spicy Paneer Tikka";
        description = "Tandoori-spiced paneer, peppers, and creamy tikka sauce";
        imageUrl = "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800";
        basePrice = 729;
        sizes = defaultSizes;
        crusts = defaultCrusts;
        addOns = pizzaAddOns;
        isAvailable = true;
        isArchived = false;
        rating = 4.6;
        ratingCount = 892;
      },
      {
        id = "prod-hawaiian";
        categoryId = "cat-pizzas";
        name = "Hawaiian Bliss";
        description = "Ham, pineapple chunks, and mozzarella on a sweet tomato base";
        imageUrl = "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800";
        basePrice = 699;
        sizes = defaultSizes;
        crusts = defaultCrusts;
        addOns = pizzaAddOns;
        isAvailable = true;
        isArchived = false;
        rating = 4.3;
        ratingCount = 654;
      },
      {
        id = "prod-meat-lovers";
        categoryId = "cat-pizzas";
        name = "Meat Lovers Ultimate";
        description = "Pepperoni, chicken, ham, sausage, and bacon on a rich tomato base";
        imageUrl = "https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?w=800";
        basePrice = 899;
        sizes = defaultSizes;
        crusts = defaultCrusts;
        addOns = pizzaAddOns;
        isAvailable = true;
        isArchived = false;
        rating = 4.8;
        ratingCount = 1876;
      },
    ];

    let sides : [Product] = [
      {
        id = "prod-garlic-bread";
        categoryId = "cat-sides";
        name = "Garlic Bread";
        description = "Toasted baguette with garlic butter and herbs";
        imageUrl = "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=800";
        basePrice = 249;
        sizes = [];
        crusts = [];
        addOns = ["addon-extra-cheese"];
        isAvailable = true;
        isArchived = false;
        rating = 4.5;
        ratingCount = 432;
      },
      {
        id = "prod-chicken-wings";
        categoryId = "cat-sides";
        name = "Crispy Chicken Wings";
        description = "6-piece golden-fried wings with dipping sauce";
        imageUrl = "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800";
        basePrice = 399;
        sizes = [];
        crusts = [];
        addOns = [];
        isAvailable = true;
        isArchived = false;
        rating = 4.7;
        ratingCount = 765;
      },
      {
        id = "prod-caesar-salad";
        categoryId = "cat-sides";
        name = "Caesar Salad";
        description = "Crisp romaine, croutons, parmesan, and classic Caesar dressing";
        imageUrl = "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=800";
        basePrice = 299;
        sizes = [];
        crusts = [];
        addOns = [];
        isAvailable = true;
        isArchived = false;
        rating = 4.4;
        ratingCount = 312;
      },
      {
        id = "prod-potato-wedges";
        categoryId = "cat-sides";
        name = "Seasoned Potato Wedges";
        description = "Thick-cut wedges with our signature spice blend";
        imageUrl = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800";
        basePrice = 199;
        sizes = [];
        crusts = [];
        addOns = [];
        isAvailable = true;
        isArchived = false;
        rating = 4.3;
        ratingCount = 287;
      },
    ];

    let beverages : [Product] = [
      {
        id = "prod-cola";
        categoryId = "cat-beverages";
        name = "Chilled Cola";
        description = "Ice-cold cola — the perfect pizza companion (500ml)";
        imageUrl = "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800";
        basePrice = 99;
        sizes = [];
        crusts = [];
        addOns = [];
        isAvailable = true;
        isArchived = false;
        rating = 4.2;
        ratingCount = 543;
      },
      {
        id = "prod-lemonade";
        categoryId = "cat-beverages";
        name = "Fresh Lemonade";
        description = "Freshly squeezed lemon with mint and a hint of ginger";
        imageUrl = "https://images.unsplash.com/photo-1547592180-85f173990554?w=800";
        basePrice = 129;
        sizes = [];
        crusts = [];
        addOns = [];
        isAvailable = true;
        isArchived = false;
        rating = 4.6;
        ratingCount = 318;
      },
      {
        id = "prod-iced-tea";
        categoryId = "cat-beverages";
        name = "Peach Iced Tea";
        description = "Chilled brew with a sweet peach finish (400ml)";
        imageUrl = "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800";
        basePrice = 119;
        sizes = [];
        crusts = [];
        addOns = [];
        isAvailable = true;
        isArchived = false;
        rating = 4.4;
        ratingCount = 224;
      },
    ];

    let desserts : [Product] = [
      {
        id = "prod-choco-lava";
        categoryId = "cat-desserts";
        name = "Chocolate Lava Cake";
        description = "Warm chocolate cake with a molten gooey centre, served with vanilla ice cream";
        imageUrl = "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800";
        basePrice = 279;
        sizes = [];
        crusts = [];
        addOns = [];
        isAvailable = true;
        isArchived = false;
        rating = 4.9;
        ratingCount = 876;
      },
      {
        id = "prod-tiramisu";
        categoryId = "cat-desserts";
        name = "Classic Tiramisu";
        description = "Italian espresso-soaked ladyfingers layered with mascarpone cream";
        imageUrl = "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800";
        basePrice = 249;
        sizes = [];
        crusts = [];
        addOns = [];
        isAvailable = true;
        isArchived = false;
        rating = 4.7;
        ratingCount = 453;
      },
    ];

    for (p in pizzas.vals()) { products.add(p.id, p) };
    for (p in sides.vals()) { products.add(p.id, p) };
    for (p in beverages.vals()) { products.add(p.id, p) };
    for (p in desserts.vals()) { products.add(p.id, p) };
  };

  // ── Query helpers ──────────────────────────────────────────────────────────

  public func getCategories(categories : Map.Map<Text, Category>) : [Category] {
    let all = categories.values().toArray();
    all.sort(func(a, b) = Nat.compare(a.sortOrder, b.sortOrder))
  };

  public func getProducts(products : Map.Map<Text, Product>) : [Product] {
    products.values().filter(func(p) { p.isAvailable and not p.isArchived }).toArray()
  };

  public func getProductsByCategory(
    products : Map.Map<Text, Product>,
    categoryId : Text,
  ) : [Product] {
    products.values().filter(func(p) {
      p.isAvailable and not p.isArchived and p.categoryId == categoryId
    }).toArray()
  };

  public func getProduct(
    products : Map.Map<Text, Product>,
    id : Text,
  ) : ?Product {
    products.get(id)
  };

  public func getAddOns(addOns : Map.Map<Text, AddOn>) : [AddOn] {
    addOns.values().toArray()
  };

  // ── Admin mutations ────────────────────────────────────────────────────────

  public func createCategory(
    categories : Map.Map<Text, Category>,
    category : Category,
  ) {
    categories.add(category.id, category);
  };

  public func createProduct(
    products : Map.Map<Text, Product>,
    product : Product,
  ) {
    products.add(product.id, product);
  };

  public func createAddOn(
    addOns : Map.Map<Text, AddOn>,
    addOn : AddOn,
  ) {
    addOns.add(addOn.id, addOn);
  };

  public func updateProduct(
    products : Map.Map<Text, Product>,
    productId : Text,
    upd : Types.ProductUpdate,
  ) : Bool {
    switch (products.get(productId)) {
      case null { false };
      case (?p) {
        let updated : Product = {
          p with
          name        = switch (upd.name)        { case (?v) v; case null p.name };
          description = switch (upd.description) { case (?v) v; case null p.description };
          imageUrl    = switch (upd.imageUrl)    { case (?v) v; case null p.imageUrl };
          basePrice   = switch (upd.basePrice)   { case (?v) v; case null p.basePrice };
          categoryId  = switch (upd.categoryId)  { case (?v) v; case null p.categoryId };
          isAvailable = switch (upd.isAvailable) { case (?v) v; case null p.isAvailable };
        };
        products.add(productId, updated);
        true
      };
    };
  };

  public func deleteProduct(
    products : Map.Map<Text, Product>,
    productId : Text,
  ) : Bool {
    switch (products.get(productId)) {
      case null { false };
      case (?p) {
        products.add(productId, { p with isArchived = true });
        true
      };
    };
  };

  public func updateCategory(
    categories : Map.Map<Text, Category>,
    categoryId : Text,
    name : Text,
    imageUrl : ?Text,
    sortOrder : ?Nat,
  ) : Bool {
    switch (categories.get(categoryId)) {
      case null { false };
      case (?c) {
        let updated : Category = {
          c with
          name      = name;
          imageUrl  = switch (imageUrl)  { case (?v) v; case null c.imageUrl };
          sortOrder = switch (sortOrder) { case (?v) v; case null c.sortOrder };
        };
        categories.add(categoryId, updated);
        true
      };
    };
  };

  public func deleteCategory(
    categories : Map.Map<Text, Category>,
    products   : Map.Map<Text, Product>,
    categoryId : Text,
  ) : { #ok; #notFound; #hasProducts } {
    switch (categories.get(categoryId)) {
      case null { #notFound };
      case (?_) {
        // Check for active (non-archived) products in this category
        let hasActive = products.values().any(func(p : Product) : Bool {
          p.categoryId == categoryId and not p.isArchived
        });
        if (hasActive) return #hasProducts;
        categories.remove(categoryId);
        #ok
      };
    };
  };

  public func updateAddOn(
    addOns : Map.Map<Text, AddOn>,
    addOnId : Text,
    name : Text,
    price : Nat,
  ) : Bool {
    switch (addOns.get(addOnId)) {
      case null { false };
      case (?a) {
        addOns.add(addOnId, { a with name; price });
        true
      };
    };
  };

  public func deleteAddOn(
    addOns : Map.Map<Text, AddOn>,
    addOnId : Text,
  ) : Bool {
    switch (addOns.get(addOnId)) {
      case null { false };
      case (?_) {
        addOns.remove(addOnId);
        true
      };
    };
  };
};
