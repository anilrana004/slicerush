import { useIsMobile } from "@/hooks/use-mobile";
import { Outlet, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { StickyCartBar } from "./StickyCartBar";

export function Layout() {
  const isMobile = useIsMobile();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      {isMobile && <BottomNav />}
      <StickyCartBar />
    </div>
  );
}
