import { CategorySidebar } from "@/components/CategorySidebar";
import { ProductCard } from "@/components/ProductCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveBanners } from "@/hooks/use-banners";
import { useCategories, useProducts } from "@/hooks/use-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import type { PromoBanner } from "@/types";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Search, Tag, UtensilsCrossed, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ── Default banner shown when no active banners exist ──────────────────────
const DEFAULT_BANNER: PromoBanner = {
  id: "default",
  title: "Hot deals, fresh from the oven",
  description: "Order now and get your food delivered in 30 minutes or less.",
  imageUrl: "/assets/generated/menu-hero-banner.dim_1200x400.jpg",
  ctaText: "Browse Menu",
  ctaLink: "#products",
  couponCode: null,
  isActive: true,
  priority: 0,
  createdAt: BigInt(0),
};

// ── Individual banner slide ─────────────────────────────────────────────────
function BannerSlide({
  banner,
  isActive,
}: {
  banner: PromoBanner;
  isActive: boolean;
}) {
  const handleCta = () => {
    if (banner.ctaLink.startsWith("#")) {
      const el = document.getElementById(banner.ctaLink.slice(1));
      el?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.open(banner.ctaLink, "_blank", "noopener noreferrer");
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : 40 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      className="absolute inset-0"
      aria-hidden={!isActive}
    >
      <div
        className="carousel-slide"
        style={
          banner.imageUrl
            ? { backgroundImage: `url(${banner.imageUrl})` }
            : undefined
        }
      >
        {/* Gradient overlay */}
        <div className="carousel-overlay">
          {/* Coupon badge */}
          {banner.couponCode && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-2"
            >
              <Badge
                variant="secondary"
                className="inline-flex items-center gap-1.5 bg-accent/90 text-accent-foreground border-none text-xs font-mono px-2.5 py-0.5"
                data-ocid="banner.coupon_badge"
              >
                <Tag className="w-3 h-3" />
                Use code: {banner.couponCode}
              </Badge>
            </motion.div>
          )}

          {/* Text */}
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-xl sm:text-2xl font-bold text-white leading-tight mb-1 drop-shadow-sm"
          >
            {banner.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-white/80 font-body line-clamp-2 mb-3 max-w-md"
          >
            {banner.description}
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Button
              size="sm"
              variant="default"
              onClick={handleCta}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow"
              data-ocid="banner.cta_button"
            >
              {banner.ctaText}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Carousel skeleton ───────────────────────────────────────────────────────
function BannerSkeleton() {
  return (
    <div
      className="carousel-container mb-6"
      data-ocid="banner.loading_state"
      style={{ height: "180px" }}
    >
      <Skeleton className="w-full h-full rounded-lg" />
    </div>
  );
}

// ── Main carousel ───────────────────────────────────────────────────────────
function BannerCarousel() {
  const { data: banners, isLoading } = useActiveBanners();
  const [activeIdx, setActiveIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const slides = useMemo(
    () => (banners && banners.length > 0 ? banners : [DEFAULT_BANNER]),
    [banners],
  );

  // Auto-rotate every 4s
  useEffect(() => {
    if (slides.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setActiveIdx((i) => (i + 1) % slides.length);
    }, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [slides.length]);

  const goTo = (idx: number) => {
    setActiveIdx(idx);
    // Reset timer on manual navigation
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (slides.length > 1) {
      intervalRef.current = setInterval(() => {
        setActiveIdx((i) => (i + 1) % slides.length);
      }, 4000);
    }
  };

  if (isLoading) return <BannerSkeleton />;

  return (
    <div
      className="carousel-container mb-6"
      style={{ height: "clamp(140px, 22vw, 180px)" }}
      data-ocid="banner.carousel"
    >
      {/* Slides */}
      <div className="relative w-full h-full overflow-hidden rounded-lg">
        {slides.map((banner, i) => (
          <BannerSlide
            key={banner.id}
            banner={banner}
            isActive={i === activeIdx}
          />
        ))}
      </div>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="carousel-controls" data-ocid="banner.carousel_controls">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Go to banner ${i + 1}`}
              onClick={() => goTo(i)}
              className={`carousel-dot${i === activeIdx ? " active" : ""}`}
              data-ocid={`banner.dot.${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────
function EmptyState({
  query,
  onClear,
}: { query: string; onClear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 gap-4 text-center"
      data-ocid="menu.empty_state"
    >
      <UtensilsCrossed className="w-16 h-16 text-muted-foreground/40" />
      <div>
        <h3 className="font-display text-xl font-bold text-foreground mb-1">
          {query ? `No results for "${query}"` : "Nothing here yet"}
        </h3>
        <p className="text-sm text-muted-foreground font-body max-w-xs">
          {query
            ? "Try a different search term or browse by category."
            : "This category is empty right now. Check back soon!"}
        </p>
      </div>
      {query && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="flex items-center gap-1.5"
          data-ocid="menu.clear_search_button"
        >
          <X className="w-3.5 h-3.5" />
          Clear search
        </Button>
      )}
    </motion.div>
  );
}

// ── MenuPage ─────────────────────────────────────────────────────────────────
export function MenuPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const search = useSearch({ strict: false }) as { category?: string };
  const activeCategoryId = (search?.category as string) ?? "all";

  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const { data: products = [], isLoading: prodsLoading } = useProducts(
    activeCategoryId === "all" ? undefined : activeCategoryId,
  );

  const isLoading = catsLoading || prodsLoading;

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }, [products, searchQuery]);

  const handleCategorySelect = useCallback(
    (id: string) => {
      void navigate({
        to: "/menu",
        search: id === "all" ? {} : { category: id },
        replace: true,
      });
      setSearchQuery("");
    },
    [navigate],
  );

  const clearSearch = () => setSearchQuery("");

  return (
    <div className="min-h-screen bg-background" data-ocid="menu.page">
      {/* Banner carousel — always at top */}
      <div className="px-4 pt-4 max-w-7xl mx-auto">
        <BannerCarousel />
      </div>

      {/* Mobile search bar */}
      {isMobile && (
        <div className="px-4 pb-2 sticky top-16 z-30 bg-background border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted border-none pr-8"
              data-ocid="menu.search_input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                data-ocid="menu.clear_search_icon"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile category pills */}
      {isMobile && !catsLoading && (
        <div className="pt-3 pb-2 bg-background sticky top-28 z-20 border-b border-border">
          <CategorySidebar
            categories={categories}
            activeId={activeCategoryId}
            onSelect={handleCategorySelect}
            isMobile
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6" id="products">
        <div className="flex gap-8">
          {/* Desktop sidebar */}
          {!isMobile && (
            <aside className="hidden md:block">
              {catsLoading ? (
                <div className="w-52 space-y-2 pt-8">
                  {["cat-1", "cat-2", "cat-3", "cat-4", "cat-5", "cat-6"].map(
                    (k) => (
                      <div
                        key={k}
                        className="skeleton h-10 w-full rounded-xl"
                      />
                    ),
                  )}
                </div>
              ) : (
                <CategorySidebar
                  categories={categories}
                  activeId={activeCategoryId}
                  onSelect={handleCategorySelect}
                />
              )}
            </aside>
          )}

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Desktop header bar */}
            {!isMobile && (
              <div className="flex items-center justify-between mb-6 gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">
                    {activeCategoryId === "all"
                      ? "All Items"
                      : (categories.find((c) => c.id === activeCategoryId)
                          ?.name ?? "Menu")}
                  </h1>
                  {!isLoading && (
                    <p className="text-sm text-muted-foreground font-body mt-0.5">
                      {filteredProducts.length}{" "}
                      {filteredProducts.length === 1 ? "item" : "items"}
                      {searchQuery && (
                        <span className="ml-1">
                          for{" "}
                          <span className="font-medium text-foreground">
                            "{searchQuery}"
                          </span>
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-muted border-none pr-8"
                    data-ocid="menu.search_input"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      data-ocid="menu.clear_search_icon_desktop"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Mobile title */}
            {isMobile && !isLoading && (
              <div className="mb-4">
                <h1 className="font-display text-xl font-bold text-foreground">
                  {activeCategoryId === "all"
                    ? "All Items"
                    : (categories.find((c) => c.id === activeCategoryId)
                        ?.name ?? "Menu")}
                </h1>
                <p className="text-sm text-muted-foreground font-body">
                  {filteredProducts.length}{" "}
                  {filteredProducts.length === 1 ? "item" : "items"}
                  {searchQuery && ` for "${searchQuery}"`}
                </p>
              </div>
            )}

            {/* Product grid */}
            {isLoading ? (
              <div
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                data-ocid="menu.products.loading_state"
                aria-label="Loading products"
              >
                {[
                  "sk-1",
                  "sk-2",
                  "sk-3",
                  "sk-4",
                  "sk-5",
                  "sk-6",
                  "sk-7",
                  "sk-8",
                ].map((k) => (
                  <SkeletonCard key={k} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <EmptyState query={searchQuery} onClear={clearSearch} />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategoryId + searchQuery}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                  data-ocid="menu.products.list"
                >
                  {filteredProducts.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} />
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
