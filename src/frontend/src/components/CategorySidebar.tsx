import type { Category } from "@/hooks/use-menu";
import { cn } from "@/lib/utils";
import {
  CakeSlice,
  Coffee,
  LayoutGrid,
  Pizza,
  Salad,
  Soup,
  Tag,
} from "lucide-react";
import { motion } from "motion/react";

interface CategorySidebarProps {
  categories: Category[];
  activeId: string;
  onSelect: (id: string) => void;
  isMobile?: boolean;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  all: <LayoutGrid className="w-4 h-4" />,
  pizza: <Pizza className="w-4 h-4" />,
  appetizers: <Soup className="w-4 h-4" />,
  drinks: <Coffee className="w-4 h-4" />,
  sides: <Salad className="w-4 h-4" />,
  desserts: <CakeSlice className="w-4 h-4" />,
  deals: <Tag className="w-4 h-4" />,
};

// ─── Mobile horizontal pill strip ────────────────────────────────────────────

function MobilePills({ categories, activeId, onSelect }: CategorySidebarProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 px-4"
      data-ocid="menu.category.pills"
    >
      {categories.map((cat) => {
        const isActive = cat.id === activeId;
        return (
          <motion.button
            key={cat.id}
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => onSelect(cat.id)}
            data-ocid={`menu.category.pill.${cat.id}`}
            className={cn(
              "flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-full text-sm font-medium font-body transition-smooth border",
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground",
            )}
          >
            {CATEGORY_ICONS[cat.id] ?? <LayoutGrid className="w-4 h-4" />}
            <span>{cat.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Desktop sticky sidebar ───────────────────────────────────────────────────

function DesktopSidebar({
  categories,
  activeId,
  onSelect,
}: CategorySidebarProps) {
  return (
    <nav
      className="w-52 shrink-0 sticky top-20 self-start"
      aria-label="Menu categories"
      data-ocid="menu.category.sidebar"
    >
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
        Categories
      </p>
      <ul className="space-y-1">
        {categories.map((cat, i) => {
          const isActive = cat.id === activeId;
          return (
            <motion.li
              key={cat.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
            >
              <button
                type="button"
                onClick={() => onSelect(cat.id)}
                data-ocid={`menu.category.sidebar.${cat.id}`}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium font-body transition-smooth text-left",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {CATEGORY_ICONS[cat.id] ?? <LayoutGrid className="w-4 h-4" />}
                </span>
                <span>{cat.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-dot"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground"
                  />
                )}
              </button>
            </motion.li>
          );
        })}
      </ul>
    </nav>
  );
}

// ─── Export unified component ─────────────────────────────────────────────────

export function CategorySidebar(props: CategorySidebarProps) {
  return props.isMobile ? (
    <MobilePills {...props} />
  ) : (
    <DesktopSidebar {...props} />
  );
}
