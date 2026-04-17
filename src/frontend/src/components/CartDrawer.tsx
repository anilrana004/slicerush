import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ShoppingBag, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { CartItem } from "./CartItem";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const isOnCart = routerState.location.pathname === "/cart";

  const handleViewCart = () => {
    onClose();
    void navigate({ to: "/cart" });
  };

  const handleCheckout = () => {
    onClose();
    void navigate({ to: "/checkout" });
  };

  const DELIVERY_FEE = 3.99;
  const total = totalPrice + (items.length > 0 ? DELIVERY_FEE : 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50"
            onClick={onClose}
            data-ocid="cart.drawer_backdrop"
          />

          {/* Drawer */}
          <motion.aside
            key="cart-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 35 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-card border-l border-border shadow-2xl z-50 flex flex-col"
            data-ocid="cart.drawer"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="font-display font-bold text-lg text-foreground">
                  Your Order
                </h2>
                {items.length > 0 && (
                  <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-medium">
                    {items.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-muted transition-colors duration-200"
                data-ocid="cart.close_button"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto px-5">
              {items.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center h-full gap-4 text-center"
                  data-ocid="cart.empty_state"
                >
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <ShoppingBag className="w-9 h-9 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-foreground text-lg">
                      Your cart is empty
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add some delicious items to get started
                    </p>
                  </div>
                  <Button onClick={onClose} variant="outline" className="mt-2">
                    Browse Menu
                  </Button>
                </div>
              ) : (
                <div>
                  {items.map((item, index) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      index={index + 1}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeFromCart}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer summary + actions */}
            {items.length > 0 && (
              <div className="px-5 py-4 border-t border-border bg-muted/30 space-y-3">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery Fee</span>
                    <span>${DELIVERY_FEE.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-foreground pt-1 border-t border-border">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {!isOnCart && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleViewCart}
                      data-ocid="cart.view_cart_button"
                    >
                      View Full Cart
                    </Button>
                  )}
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                    onClick={handleCheckout}
                    data-ocid="cart.checkout_button"
                  >
                    Proceed to Checkout · ${total.toFixed(2)}
                  </Button>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
