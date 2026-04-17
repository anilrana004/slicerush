import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { ArrowLeft, Minus, Plus, ShoppingCart, Star } from "lucide-react";
import { AnimatePresence, type Variants, motion } from "motion/react";
import { useMemo, useState } from "react";

// ─── Types mirroring backend contracts ────────────────────────────────────────
interface SizeVariant {
  size: string;
  priceMultiplier: number;
  displayName: string;
}

interface CrustVariant {
  crust: string;
  extraPrice: number;
  displayName: string;
}

interface AddOn {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface Product {
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

// ─── Mock data (until backend getProduct / getAddOns are wired) ───────────────
const MOCK_PRODUCTS: Record<string, Product> = {
  "pepperoni-passion": {
    id: "pepperoni-passion",
    categoryId: "pizza",
    name: "Pepperoni Passion",
    description:
      "Loaded with premium double-cut pepperoni on a rich tomato base, finished with a generous blanket of mozzarella. Our bestseller — bold, savory, and utterly satisfying.",
    imageUrl: "/assets/generated/product-pepperoni-passion.dim_800x800.jpg",
    basePrice: 1499,
    sizes: [
      { size: "small", priceMultiplier: 1.0, displayName: 'Small (7")' },
      { size: "medium", priceMultiplier: 1.35, displayName: 'Medium (10")' },
      { size: "large", priceMultiplier: 1.65, displayName: 'Large (13")' },
    ],
    crusts: [
      { crust: "thin", extraPrice: 0, displayName: "Thin & Crispy" },
      { crust: "hand-tossed", extraPrice: 0, displayName: "Hand-Tossed" },
      { crust: "stuffed", extraPrice: 299, displayName: "Stuffed Crust" },
    ],
    addOns: [
      "extra-cheese",
      "jalapeños",
      "mushrooms",
      "olives",
      "onions",
      "peppers",
    ],
    isAvailable: true,
    rating: 4.8,
    ratingCount: 2341,
  },
  margherita: {
    id: "margherita",
    categoryId: "pizza",
    name: "Margherita",
    description:
      "Classic Italian simplicity — San Marzano tomato sauce, fresh buffalo mozzarella, and fragrant basil on a hand-stretched crust. Perfection in every bite.",
    imageUrl: "/assets/generated/product-margherita.dim_800x800.jpg",
    basePrice: 1299,
    sizes: [
      { size: "small", priceMultiplier: 1.0, displayName: 'Small (7")' },
      { size: "medium", priceMultiplier: 1.35, displayName: 'Medium (10")' },
      { size: "large", priceMultiplier: 1.65, displayName: 'Large (13")' },
    ],
    crusts: [
      { crust: "thin", extraPrice: 0, displayName: "Thin & Crispy" },
      { crust: "hand-tossed", extraPrice: 0, displayName: "Hand-Tossed" },
      { crust: "stuffed", extraPrice: 299, displayName: "Stuffed Crust" },
    ],
    addOns: [
      "extra-cheese",
      "mushrooms",
      "olives",
      "onions",
      "peppers",
      "spinach",
    ],
    isAvailable: true,
    rating: 4.6,
    ratingCount: 1872,
  },
};

const MOCK_ADDONS: AddOn[] = [
  { id: "extra-cheese", name: "Extra Cheese", price: 149, category: "Cheese" },
  { id: "jalapeños", name: "Jalapeños", price: 99, category: "Veggies" },
  { id: "mushrooms", name: "Mushrooms", price: 99, category: "Veggies" },
  { id: "olives", name: "Black Olives", price: 99, category: "Veggies" },
  { id: "onions", name: "Caramelized Onions", price: 79, category: "Veggies" },
  { id: "peppers", name: "Bell Peppers", price: 79, category: "Veggies" },
  { id: "spinach", name: "Spinach", price: 79, category: "Veggies" },
  { id: "chicken", name: "Grilled Chicken", price: 199, category: "Protein" },
  { id: "bacon", name: "Smoked Bacon", price: 179, category: "Protein" },
  { id: "hot-sauce", name: "Hot Sauce Drizzle", price: 59, category: "Sauce" },
];

function fetchProduct(productId: string): Promise<Product> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const p = MOCK_PRODUCTS[productId] ?? MOCK_PRODUCTS["pepperoni-passion"];
      if (p) resolve(p);
      else reject(new Error("Product not found"));
    }, 600);
  });
}

function fetchAddOns(ids: string[]): Promise<AddOn[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_ADDONS.filter((a) => ids.includes(a.id)));
    }, 600);
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarRating({ rating, count }: { rating: number; count: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {(["s1", "s2", "s3", "s4", "s5"] as const).map((key, i) => (
          <Star
            key={key}
            size={16}
            className={
              i < full
                ? "fill-secondary text-secondary"
                : i === full && half
                  ? "fill-secondary/50 text-secondary"
                  : "fill-muted text-muted-foreground"
            }
          />
        ))}
      </div>
      <span className="text-sm font-semibold text-secondary">
        {rating.toFixed(1)}
      </span>
      <span className="text-xs text-muted-foreground">
        ({count.toLocaleString()} reviews)
      </span>
    </div>
  );
}

interface SelectorCardProps {
  label: string;
  sublabel?: string;
  selected: boolean;
  onClick: () => void;
  "data-ocid"?: string;
}

function SelectorCard({
  label,
  sublabel,
  selected,
  onClick,
  ...rest
}: SelectorCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-ocid={rest["data-ocid"]}
      className={`
        relative flex flex-col items-center justify-center px-4 py-3 rounded-xl border-2 
        text-center transition-smooth cursor-pointer select-none min-w-[88px]
        ${
          selected
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/50"
        }
      `}
    >
      <span className="text-sm font-semibold leading-tight">{label}</span>
      {sublabel && (
        <span
          className={`text-xs mt-0.5 ${selected ? "text-primary/80" : "text-muted-foreground"}`}
        >
          {sublabel}
        </span>
      )}
      {selected && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
      )}
    </button>
  );
}

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.38, ease: "easeOut" },
  }),
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export function ProductDetailPage() {
  const { productId } = useParams({ from: "/app/menu/$productId" });
  const search = useSearch({ strict: false }) as { category?: string };
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProduct(productId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: addOns = [], isLoading: isLoadingAddOns } = useQuery({
    queryKey: ["addOns", product?.addOns],
    queryFn: () => fetchAddOns(product?.addOns ?? []),
    enabled: !!product,
    staleTime: 5 * 60 * 1000,
  });

  // Selections — default to first option
  const [selectedSize, setSelectedSize] = useState<string>("medium");
  const [selectedCrust, setSelectedCrust] = useState<string>("hand-tossed");
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(
    new Set(),
  );
  const [quantity, setQuantity] = useState(1);

  const currentSize =
    product?.sizes.find((s) => s.size === selectedSize) ?? product?.sizes[1];
  const currentCrust =
    product?.crusts.find((c) => c.crust === selectedCrust) ??
    product?.crusts[1];

  const unitPrice = useMemo(() => {
    if (!product || !currentSize || !currentCrust) return 0;
    const base = product.basePrice * currentSize.priceMultiplier;
    const crustExtra = currentCrust.extraPrice;
    const addOnTotal = addOns
      .filter((a) => selectedAddOnIds.has(a.id))
      .reduce((s, a) => s + a.price, 0);
    return Math.round(base + crustExtra + addOnTotal);
  }, [product, currentSize, currentCrust, selectedAddOnIds, addOns]);

  const totalPrice = unitPrice * quantity;

  function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function toggleAddOn(id: string) {
    setSelectedAddOnIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBack() {
    const params = search.category ? `?category=${search.category}` : "";
    navigate({ to: `/menu${params}` as never });
  }

  function handleAddToCart() {
    if (!product) return;
    addToCart({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      size: currentSize?.displayName ?? selectedSize,
      crust: currentCrust?.displayName ?? selectedCrust,
      addOns: addOns
        .filter((a) => selectedAddOnIds.has(a.id))
        .map((a) => ({ id: a.id, name: a.name, price: a.price })),
      quantity,
      unitPrice,
      totalPrice,
    });
  }

  // Group add-ons by category
  const addOnGroups = useMemo(() => {
    const groups: Record<string, AddOn[]> = {};
    for (const addon of addOns) {
      if (!groups[addon.category]) groups[addon.category] = [];
      groups[addon.category].push(addon);
    }
    return Object.entries(groups);
  }, [addOns]);

  const isLoading = isLoadingProduct || isLoadingAddOns;

  return (
    <div className="min-h-screen bg-background" data-ocid="product_detail.page">
      {/* Back button */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            data-ocid="product_detail.back_button"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth"
          >
            <ArrowLeft size={16} />
            <span>Back to Menu</span>
          </button>
          {product && <span className="text-muted-foreground/50">/</span>}
          {product && (
            <span className="text-sm text-foreground truncate font-medium">
              {product.name}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <ProductDetailSkeleton />
        ) : !product ? (
          <div
            className="text-center py-24 text-muted-foreground font-body"
            data-ocid="product_detail.error_state"
          >
            <p className="text-xl font-display font-bold mb-2">
              Product not found
            </p>
            <Button variant="outline" onClick={handleBack}>
              Go back to menu
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            {/* ── Left: Hero Image ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden aspect-square bg-card shadow-xl">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/assets/images/placeholder.svg";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {!product.isAvailable && (
                  <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                    <Badge variant="destructive" className="text-lg px-4 py-2">
                      Unavailable
                    </Badge>
                  </div>
                )}
                <div className="absolute bottom-4 left-4">
                  <Badge className="bg-primary/90 text-primary-foreground text-xl font-bold px-4 py-2 font-display">
                    {formatPrice(unitPrice)}
                  </Badge>
                </div>
              </div>
            </motion.div>

            {/* ── Right: Config Panel ── */}
            <div className="space-y-8" data-ocid="product_detail.config_panel">
              {/* Product header */}
              <motion.div
                custom={0}
                initial="hidden"
                animate="visible"
                variants={sectionVariants}
                className="space-y-3"
              >
                <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                  {product.name}
                </h1>
                <StarRating
                  rating={product.rating}
                  count={product.ratingCount}
                />
                <p className="text-muted-foreground font-body leading-relaxed">
                  {product.description}
                </p>
              </motion.div>

              {/* Size selector */}
              <motion.div
                custom={1}
                initial="hidden"
                animate="visible"
                variants={sectionVariants}
                className="space-y-3"
                data-ocid="product_detail.size_section"
              >
                <h2 className="font-semibold text-foreground text-sm uppercase tracking-wider">
                  Choose Size
                </h2>
                <div className="flex gap-3 flex-wrap">
                  {product.sizes.map((s) => (
                    <SelectorCard
                      key={s.size}
                      label={s.displayName.split("(")[0].trim()}
                      sublabel={
                        s.displayName.match(/\(([^)]+)\)/)?.[1] ?? undefined
                      }
                      selected={selectedSize === s.size}
                      onClick={() => setSelectedSize(s.size)}
                      data-ocid={`product_detail.size.${s.size}`}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Crust selector */}
              <motion.div
                custom={2}
                initial="hidden"
                animate="visible"
                variants={sectionVariants}
                className="space-y-3"
                data-ocid="product_detail.crust_section"
              >
                <h2 className="font-semibold text-foreground text-sm uppercase tracking-wider">
                  Choose Crust
                </h2>
                <div className="flex gap-3 flex-wrap">
                  {product.crusts.map((c) => (
                    <SelectorCard
                      key={c.crust}
                      label={c.displayName}
                      sublabel={
                        c.extraPrice > 0
                          ? `+${formatPrice(c.extraPrice)}`
                          : "Included"
                      }
                      selected={selectedCrust === c.crust}
                      onClick={() => setSelectedCrust(c.crust)}
                      data-ocid={`product_detail.crust.${c.crust}`}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Add-ons */}
              {addOns.length > 0 && (
                <motion.div
                  custom={3}
                  initial="hidden"
                  animate="visible"
                  variants={sectionVariants}
                  className="space-y-4"
                  data-ocid="product_detail.addons_section"
                >
                  <h2 className="font-semibold text-foreground text-sm uppercase tracking-wider">
                    Add-Ons
                    {selectedAddOnIds.size > 0 && (
                      <span className="ml-2 text-primary font-normal normal-case">
                        +
                        {formatPrice(
                          addOns
                            .filter((a) => selectedAddOnIds.has(a.id))
                            .reduce((s, a) => s + a.price, 0),
                        )}
                      </span>
                    )}
                  </h2>
                  <div className="space-y-4">
                    {addOnGroups.map(([category, items]) => (
                      <div key={category}>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">
                          {category}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {items.map((addon, idx) => {
                            const checked = selectedAddOnIds.has(addon.id);
                            return (
                              <button
                                key={addon.id}
                                type="button"
                                onClick={() => toggleAddOn(addon.id)}
                                data-ocid={`product_detail.addon.${idx + 1}`}
                                className={`
                                  flex items-center gap-2 px-3 py-2 rounded-lg border text-sm 
                                  transition-smooth cursor-pointer select-none
                                  ${
                                    checked
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border bg-card text-foreground hover:border-primary/30"
                                  }
                                `}
                              >
                                <Checkbox
                                  checked={checked}
                                  className="pointer-events-none h-4 w-4"
                                  tabIndex={-1}
                                />
                                <span className="font-medium">
                                  {addon.name}
                                </span>
                                <span
                                  className={`text-xs ${checked ? "text-primary/80" : "text-muted-foreground"}`}
                                >
                                  +{formatPrice(addon.price)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Quantity + CTA */}
              <motion.div
                custom={4}
                initial="hidden"
                animate="visible"
                variants={sectionVariants}
                className="pt-2 space-y-4"
              >
                {/* Price summary */}
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/50 border border-border">
                  <span className="text-muted-foreground font-body text-sm">
                    Total Price
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={totalPrice}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.18 }}
                      className="font-display text-2xl font-bold text-primary"
                      data-ocid="product_detail.total_price"
                    >
                      {formatPrice(totalPrice)}
                    </motion.span>
                  </AnimatePresence>
                </div>

                {/* Quantity selector */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    Quantity
                  </span>
                  <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      data-ocid="product_detail.quantity_minus"
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-foreground hover:bg-muted transition-smooth disabled:opacity-40"
                      disabled={quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <span
                      className="w-8 text-center font-bold text-foreground font-body"
                      data-ocid="product_detail.quantity_value"
                    >
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      data-ocid="product_detail.quantity_plus"
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-foreground hover:bg-muted transition-smooth"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Add to cart button */}
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.isAvailable}
                  data-ocid="product_detail.add_to_cart_button"
                  className="w-full h-14 text-base font-bold font-display bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md hover:shadow-lg transition-smooth gap-3"
                  size="lg"
                >
                  <ShoppingCart size={20} />
                  Add to Cart · {formatPrice(totalPrice)}
                </Button>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ProductDetailSkeleton() {
  return (
    <div
      className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start"
      data-ocid="product_detail.loading_state"
    >
      <Skeleton className="aspect-square rounded-2xl w-full" />
      <div className="space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-12 w-3/4 rounded-xl" />
          <Skeleton className="h-5 w-40 rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-24 rounded" />
          <div className="flex gap-3">
            {["sm", "md", "lg"].map((s) => (
              <Skeleton key={s} className="h-16 w-24 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-24 rounded" />
          <div className="flex gap-3">
            {["thin", "hand", "stuffed"].map((c) => (
              <Skeleton key={c} className="h-16 w-32 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
