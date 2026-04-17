import { Button } from "@/components/ui/button";
import type { CartItem as CartItemType } from "@/store/cart";
import { Minus, Plus, Trash2 } from "lucide-react";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  index: number;
  compact?: boolean;
}

export function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  index,
  compact = false,
}: CartItemProps) {
  const sizeLabel = item.size
    ? item.size.charAt(0).toUpperCase() + item.size.slice(1)
    : "";
  const crustLabel = item.crust
    ? item.crust.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";
  const addOnNames = item.addOns.map((a) => a.name).join(", ");

  return (
    <div
      className={`flex gap-3 ${compact ? "py-3" : "py-4"} border-b border-border last:border-0`}
      data-ocid={`cart.item.${index}`}
    >
      {/* Product image */}
      <div
        className={`${compact ? "w-14 h-14" : "w-16 h-16"} rounded-lg overflow-hidden flex-shrink-0 bg-muted`}
      >
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "/assets/images/placeholder.svg";
          }}
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-foreground text-sm leading-snug truncate">
          {item.name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {[sizeLabel, crustLabel].filter(Boolean).join(" · ")}
          {addOnNames && ` · ${addOnNames}`}
        </p>

        {/* Quantity controls + price */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-full border-border hover:bg-muted"
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              data-ocid={`cart.quantity_decrease.${index}`}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="text-sm font-medium w-5 text-center text-foreground">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-full border-border hover:bg-muted"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              data-ocid={`cart.quantity_increase.${index}`}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground">
              ${item.totalPrice.toFixed(2)}
            </span>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="text-muted-foreground hover:text-destructive transition-colors duration-200 p-1"
              data-ocid={`cart.delete_button.${index}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
