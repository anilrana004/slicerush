import { useCart } from "@/hooks/use-cart";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export function StickyCartBar() {
  const { items, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const isOnMenu = pathname === "/menu";
  const shouldShow = isOnMenu && items.length > 0;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="sticky-cart-bar"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 32 }}
          className="fixed bottom-20 left-4 right-4 z-30 md:hidden"
          data-ocid="sticky_cart_bar"
        >
          <button
            type="button"
            onClick={() => void navigate({ to: "/cart" })}
            className="w-full bg-primary text-primary-foreground rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-lg"
            data-ocid="sticky_cart_bar.view_cart_button"
          >
            <div className="flex items-center gap-2">
              <span className="bg-primary-foreground/20 text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {totalItems}
              </span>
              <span className="font-semibold text-sm">View Cart</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm">
                ${totalPrice.toFixed(2)}
              </span>
              <ShoppingBag className="w-4 h-4" />
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
