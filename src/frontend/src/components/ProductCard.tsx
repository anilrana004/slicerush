import { Badge } from "@/components/ui/badge";
import type { Product } from "@/hooks/use-menu";
import { useNavigate } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { motion } from "motion/react";

interface ProductCardProps {
  product: Product;
  index?: number;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function RatingStars({ rating, count }: { rating: number; count: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const stars = ["1st", "2nd", "3rd", "4th", "5th"] as const;
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {stars.map((label, i) => (
          <Star
            key={label}
            aria-label={`${label} star`}
            className={`w-3 h-3 ${
              i < full
                ? "fill-secondary text-secondary"
                : i === full && half
                  ? "fill-secondary/50 text-secondary"
                  : "fill-muted text-muted-foreground"
            }`}
          />
        ))}
      </div>
      <span className="text-[11px] text-muted-foreground font-body">
        {rating.toFixed(1)} ({count.toLocaleString()})
      </span>
    </div>
  );
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    void navigate({
      to: "/menu/$productId",
      params: { productId: product.id },
    });
  };

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: "easeOut" }}
      onClick={handleClick}
      aria-label={`View ${product.name} details`}
      data-ocid={`menu.product.item.${index + 1}`}
      className="group relative bg-card border border-border rounded-2xl overflow-hidden cursor-pointer card-lift outline-none focus-visible:ring-2 focus-visible:ring-ring text-left w-full"
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "/assets/images/placeholder.svg";
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Unavailable overlay */}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <Badge variant="secondary" className="text-sm font-semibold">
              Unavailable
            </Badge>
          </div>
        )}

        {/* Price badge */}
        <div className="absolute bottom-3 right-3">
          <span className="bg-primary text-primary-foreground font-display font-bold text-sm px-3 py-1 rounded-xl shadow-lg">
            {formatPrice(product.basePrice)}
          </span>
        </div>

        {/* Name on image (Pinterest style) */}
        <div className="absolute bottom-3 left-3 right-20">
          <h3 className="font-display font-bold text-white text-base leading-tight line-clamp-2 drop-shadow-sm">
            {product.name}
          </h3>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3">
        <p className="text-xs text-muted-foreground font-body line-clamp-2 mb-2 leading-relaxed">
          {product.description}
        </p>
        <RatingStars rating={product.rating} count={product.ratingCount} />
      </div>
    </motion.button>
  );
}
