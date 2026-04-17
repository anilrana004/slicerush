import { useQuery } from "@tanstack/react-query";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PizzaSize = "small" | "medium" | "large" | "extra_large";
export type PizzaCrust = "thin" | "classic" | "stuffed" | "gluten_free";

export interface SizeVariant {
  size: PizzaSize;
  priceMultiplier: number;
  displayName: string;
}

export interface CrustVariant {
  crust: PizzaCrust;
  extraPrice: number;
  displayName: string;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  imageUrl: string;
  basePrice: number;
  sizes: SizeVariant[];
  crusts: CrustVariant[];
  addOns: string[];
  isAvailable: boolean;
  rating: number;
  ratingCount: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CATEGORIES: Category[] = [
  {
    id: "all",
    name: "All",
    description: "Everything on the menu",
    imageUrl: "",
    sortOrder: 0,
  },
  {
    id: "pizza",
    name: "Pizza",
    description: "Handcrafted pizzas with premium toppings",
    imageUrl: "",
    sortOrder: 1,
  },
  {
    id: "appetizers",
    name: "Appetizers",
    description: "Starters and small bites",
    imageUrl: "",
    sortOrder: 2,
  },
  {
    id: "drinks",
    name: "Drinks",
    description: "Refreshing beverages",
    imageUrl: "",
    sortOrder: 3,
  },
  {
    id: "sides",
    name: "Sides",
    description: "Delicious side dishes",
    imageUrl: "",
    sortOrder: 4,
  },
  {
    id: "desserts",
    name: "Desserts",
    description: "Sweet treats to finish",
    imageUrl: "",
    sortOrder: 5,
  },
];

const MOCK_ADD_ONS: AddOn[] = [
  {
    id: "extra-cheese",
    name: "Extra Cheese",
    price: 150,
    category: "toppings",
  },
  { id: "jalapenos", name: "Jalapeños", price: 100, category: "toppings" },
  { id: "olives", name: "Black Olives", price: 100, category: "toppings" },
  { id: "mushrooms", name: "Mushrooms", price: 120, category: "toppings" },
  { id: "peppers", name: "Bell Peppers", price: 100, category: "toppings" },
  { id: "bacon", name: "Crispy Bacon", price: 200, category: "toppings" },
  { id: "ranch", name: "Ranch Dip", price: 80, category: "sauces" },
  { id: "bbq", name: "BBQ Sauce", price: 80, category: "sauces" },
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: "p1",
    categoryId: "pizza",
    name: "Pepperoni Passion",
    description:
      "Double-stacked pepperoni on our signature tomato base with mozzarella and oregano",
    imageUrl: "/assets/generated/menu-pepperoni-pizza.dim_800x600.jpg",
    basePrice: 1799,
    sizes: [
      { size: "small", priceMultiplier: 0.7, displayName: 'Small 9"' },
      { size: "medium", priceMultiplier: 1.0, displayName: 'Medium 12"' },
      { size: "large", priceMultiplier: 1.3, displayName: 'Large 15"' },
      { size: "extra_large", priceMultiplier: 1.6, displayName: 'XL 18"' },
    ],
    crusts: [
      { crust: "thin", extraPrice: 0, displayName: "Thin Crust" },
      { crust: "classic", extraPrice: 0, displayName: "Classic Hand-Tossed" },
      {
        crust: "stuffed",
        extraPrice: 250,
        displayName: "Stuffed Crust +$2.50",
      },
      {
        crust: "gluten_free",
        extraPrice: 300,
        displayName: "Gluten Free +$3.00",
      },
    ],
    addOns: ["extra-cheese", "jalapenos", "olives", "bacon"],
    isAvailable: true,
    rating: 4.8,
    ratingCount: 2341,
  },
  {
    id: "p2",
    categoryId: "pizza",
    name: "Margherita Classic",
    description:
      "San Marzano tomatoes, fresh buffalo mozzarella, hand-torn basil, extra virgin olive oil",
    imageUrl: "/assets/generated/menu-margherita-pizza.dim_800x600.jpg",
    basePrice: 1599,
    sizes: [
      { size: "small", priceMultiplier: 0.7, displayName: 'Small 9"' },
      { size: "medium", priceMultiplier: 1.0, displayName: 'Medium 12"' },
      { size: "large", priceMultiplier: 1.3, displayName: 'Large 15"' },
    ],
    crusts: [
      { crust: "thin", extraPrice: 0, displayName: "Thin Crust" },
      { crust: "classic", extraPrice: 0, displayName: "Classic Hand-Tossed" },
      {
        crust: "stuffed",
        extraPrice: 250,
        displayName: "Stuffed Crust +$2.50",
      },
    ],
    addOns: ["extra-cheese", "jalapenos", "mushrooms", "peppers"],
    isAvailable: true,
    rating: 4.6,
    ratingCount: 1892,
  },
  {
    id: "p3",
    categoryId: "pizza",
    name: "BBQ Chicken Feast",
    description:
      "Grilled chicken, red onions, roasted peppers, smoked BBQ sauce, cheddar blend",
    imageUrl: "/assets/generated/menu-bbq-chicken-pizza.dim_800x600.jpg",
    basePrice: 1999,
    sizes: [
      { size: "small", priceMultiplier: 0.75, displayName: 'Small 9"' },
      { size: "medium", priceMultiplier: 1.0, displayName: 'Medium 12"' },
      { size: "large", priceMultiplier: 1.35, displayName: 'Large 15"' },
    ],
    crusts: [
      { crust: "thin", extraPrice: 0, displayName: "Thin Crust" },
      { crust: "classic", extraPrice: 0, displayName: "Classic Hand-Tossed" },
      {
        crust: "stuffed",
        extraPrice: 250,
        displayName: "Stuffed Crust +$2.50",
      },
    ],
    addOns: ["extra-cheese", "jalapenos", "bacon", "ranch"],
    isAvailable: true,
    rating: 4.7,
    ratingCount: 1654,
  },
  {
    id: "p4",
    categoryId: "pizza",
    name: "Veggie Supreme",
    description:
      "Roasted mushrooms, capsicum, spinach, red onion, sun-dried tomatoes on a garlic cream base",
    imageUrl: "/assets/generated/menu-veggie-pizza.dim_800x600.jpg",
    basePrice: 1499,
    sizes: [
      { size: "small", priceMultiplier: 0.7, displayName: 'Small 9"' },
      { size: "medium", priceMultiplier: 1.0, displayName: 'Medium 12"' },
      { size: "large", priceMultiplier: 1.3, displayName: 'Large 15"' },
    ],
    crusts: [
      { crust: "thin", extraPrice: 0, displayName: "Thin Crust" },
      { crust: "classic", extraPrice: 0, displayName: "Classic Hand-Tossed" },
      {
        crust: "gluten_free",
        extraPrice: 300,
        displayName: "Gluten Free +$3.00",
      },
    ],
    addOns: ["extra-cheese", "olives", "mushrooms", "peppers"],
    isAvailable: true,
    rating: 4.4,
    ratingCount: 987,
  },
  {
    id: "a1",
    categoryId: "appetizers",
    name: "Spicy Wings",
    description:
      "8-piece crispy chicken wings tossed in our signature sriracha-honey glaze",
    imageUrl: "/assets/generated/menu-spicy-wings.dim_800x600.jpg",
    basePrice: 1249,
    sizes: [],
    crusts: [],
    addOns: ["ranch", "bbq"],
    isAvailable: true,
    rating: 4.9,
    ratingCount: 3102,
  },
  {
    id: "a2",
    categoryId: "appetizers",
    name: "Garlic Bread",
    description:
      "Toasted ciabatta with roasted garlic butter, parmesan and parsley",
    imageUrl: "/assets/generated/menu-garlic-bread.dim_800x600.jpg",
    basePrice: 799,
    sizes: [],
    crusts: [],
    addOns: ["extra-cheese"],
    isAvailable: true,
    rating: 4.5,
    ratingCount: 2210,
  },
  {
    id: "a3",
    categoryId: "appetizers",
    name: "Mozzarella Sticks",
    description:
      "Golden-fried mozzarella sticks with marinara dipping sauce — crispy outside, gooey inside",
    imageUrl: "/assets/generated/menu-mozzarella-sticks.dim_800x600.jpg",
    basePrice: 899,
    sizes: [],
    crusts: [],
    addOns: ["ranch", "bbq"],
    isAvailable: true,
    rating: 4.6,
    ratingCount: 1445,
  },
  {
    id: "d1",
    categoryId: "drinks",
    name: "Coca-Cola",
    description: "Ice cold Coca-Cola — regular, diet, or zero sugar",
    imageUrl: "/assets/generated/menu-coca-cola.dim_800x600.jpg",
    basePrice: 399,
    sizes: [],
    crusts: [],
    addOns: [],
    isAvailable: true,
    rating: 4.3,
    ratingCount: 4560,
  },
  {
    id: "d2",
    categoryId: "drinks",
    name: "Fresh Lemonade",
    description:
      "House-made lemonade with mint and a hint of ginger, served over crushed ice",
    imageUrl: "/assets/generated/menu-lemonade.dim_800x600.jpg",
    basePrice: 599,
    sizes: [],
    crusts: [],
    addOns: [],
    isAvailable: true,
    rating: 4.7,
    ratingCount: 892,
  },
  {
    id: "s1",
    categoryId: "sides",
    name: "Loaded Fries",
    description:
      "Crispy shoestring fries topped with cheddar sauce, jalapeños, sour cream, and chives",
    imageUrl: "/assets/generated/menu-loaded-fries.dim_800x600.jpg",
    basePrice: 999,
    sizes: [],
    crusts: [],
    addOns: ["extra-cheese", "jalapenos", "bacon"],
    isAvailable: true,
    rating: 4.8,
    ratingCount: 2876,
  },
  {
    id: "s2",
    categoryId: "sides",
    name: "Coleslaw",
    description:
      "Creamy house-made coleslaw with red cabbage, carrot and apple cider dressing",
    imageUrl: "/assets/generated/menu-coleslaw.dim_800x600.jpg",
    basePrice: 499,
    sizes: [],
    crusts: [],
    addOns: [],
    isAvailable: true,
    rating: 4.2,
    ratingCount: 678,
  },
  {
    id: "de1",
    categoryId: "desserts",
    name: "Chocolate Lava Cake",
    description:
      "Warm chocolate fondant with a molten center, served with Madagascar vanilla ice cream",
    imageUrl: "/assets/generated/menu-chocolate-lava-cake.dim_800x600.jpg",
    basePrice: 899,
    sizes: [],
    crusts: [],
    addOns: [],
    isAvailable: true,
    rating: 4.9,
    ratingCount: 1234,
  },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      // Simulate network delay
      await new Promise((r) => setTimeout(r, 600));
      return MOCK_CATEGORIES;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useProducts(categoryId?: string) {
  return useQuery<Product[]>({
    queryKey: ["products", categoryId ?? "all"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 800));
      if (!categoryId || categoryId === "all") return MOCK_PRODUCTS;
      return MOCK_PRODUCTS.filter((p) => p.categoryId === categoryId);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useProduct(id: string) {
  return useQuery<Product | undefined>({
    queryKey: ["product", id],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 400));
      return MOCK_PRODUCTS.find((p) => p.id === id);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddOns() {
  return useQuery<AddOn[]>({
    queryKey: ["add-ons"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 400));
      return MOCK_ADD_ONS;
    },
    staleTime: 10 * 60 * 1000,
  });
}
