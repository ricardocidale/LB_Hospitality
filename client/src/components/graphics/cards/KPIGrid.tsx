import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated";

export interface KPIItem {
  label: string;
  value: number;
  format?: (n: number) => string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  icon?: ReactNode;
  sublabel?: string;
}

interface KPIGridProps {
  items: KPIItem[];
  columns?: 2 | 3 | 4 | 5;
  variant?: "glass" | "light" | "dark";
  className?: string;
  "data-testid"?: string;
}

const defaultFormat = (n: number) => n.toLocaleString();

const trendIcon = (trend?: "up" | "down" | "neutral") => {
  if (trend === "up") return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
  if (trend === "down") return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
  return <Minus className="w-3.5 h-3.5 text-primary/40" />;
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

const colClass: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 lg:grid-cols-5",
};

export function KPIGrid({ items, columns = 4, className, ...props }: KPIGridProps) {
  return (
    <motion.div
      className={`grid gap-3 sm:gap-4 ${colClass[columns]} ${className || ""}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      data-testid={props["data-testid"]}
    >
      {items.map((item) => (
        <motion.div
          key={item.label}
          variants={itemVariants}
          className="bg-card/80 border border-primary/10 rounded-lg p-4 sm:p-5 shadow-[0_2px_8px_rgba(var(--primary-rgb,159,188,164),0.08)] hover:shadow-[0_4px_16px_rgba(var(--primary-rgb,159,188,164),0.12)] transition-shadow duration-300"
        >
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
              {item.label}
            </p>
            {item.trend && (
              <span className="flex items-center gap-0.5 flex-shrink-0">
                {trendIcon(item.trend)}
                {item.trendLabel && (
                  <span className={`text-xs font-medium ${item.trend === "up" ? "text-emerald-500" : item.trend === "down" ? "text-red-500" : "text-muted-foreground/40"}`}>
                    {item.trendLabel}
                  </span>
                )}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-xl sm:text-2xl font-bold text-foreground truncate">
              <AnimatedCounter value={item.value} format={item.format || defaultFormat} />
            </span>
          </div>
          {item.sublabel && (
            <p className="text-xs mt-1 text-muted-foreground/40 truncate">{item.sublabel}</p>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}
