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
  return <Minus className="w-3.5 h-3.5 text-gray-400" />;
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const colClass: Record<number, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 lg:grid-cols-5",
};

const variantStyles = {
  glass: "bg-white/80 backdrop-blur-xl border border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]",
  light: "bg-white border border-gray-100 shadow-sm",
  dark: "bg-gradient-to-br from-[#2d4a5e]/80 via-[#3d5a6a]/70 to-[#3a5a5e]/80 border border-white/10 text-white",
};

export function KPIGrid({ items, columns = 4, variant = "glass", className, ...props }: KPIGridProps) {
  return (
    <motion.div
      className={`grid gap-4 ${colClass[columns]} ${className || ""}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      data-testid={props["data-testid"]}
    >
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          variants={itemVariants}
          whileHover={{
            scale: 1.04,
            y: -4,
            transition: { duration: 0.25, ease: "easeOut" },
          }}
          className={`group relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all duration-500 ${variantStyles[variant]} hover:shadow-[0_12px_40px_rgba(159,188,164,0.25)] hover:border-primary/40 hover:-translate-y-1`}
          style={{ willChange: "transform" }}
        >
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ background: variant === "dark"
              ? "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.06), transparent 70%)"
              : "radial-gradient(circle at 50% 0%, rgba(159,188,164,0.12), transparent 70%)"
            }}
          />
          <div className="relative">
            <div className="flex items-start justify-between mb-1">
              <p className={`text-xs font-medium uppercase tracking-wider ${variant === "dark" ? "text-white/50" : "text-gray-500"} label-text`}>
                {item.label}
              </p>
              {item.icon && <div className={`${variant === "dark" ? "text-primary" : "text-primary/70"} transition-transform duration-300 group-hover:scale-110`}>{item.icon}</div>}
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-mono ${variant === "dark" ? "text-white" : "text-gray-900"}`}>
                <AnimatedCounter value={item.value} format={item.format || defaultFormat} />
              </span>
              {item.trend && (
                <span className="flex items-center gap-1">
                  {trendIcon(item.trend)}
                  {item.trendLabel && (
                    <span className={`text-xs font-medium ${item.trend === "up" ? "text-emerald-500" : item.trend === "down" ? "text-red-500" : "text-gray-400"}`}>
                      {item.trendLabel}
                    </span>
                  )}
                </span>
              )}
            </div>
            {item.sublabel && (
              <p className={`text-xs mt-1 ${variant === "dark" ? "text-white/40" : "text-gray-400"} label-text`}>{item.sublabel}</p>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
