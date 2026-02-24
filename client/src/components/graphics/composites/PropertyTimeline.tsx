/**
 * PropertyTimeline.tsx — Visual timeline of property lifecycle milestones.
 *
 * Renders a horizontal or vertical timeline showing key events in a
 * property's investment lifecycle:
 *   • acquisition     — closing date and purchase price
 *   • ramp            — occupancy ramp-up period (months to stabilization)
 *   • stabilization   — when the property reaches target occupancy
 *   • refinance       — optional refinance event (lower rate or cash-out)
 *   • exit            — projected disposition date and sale price
 *
 * Each milestone has a type-specific icon and optional value annotation.
 */
import { motion, type Variants } from "framer-motion";
import { Building2, Key, TrendingUp, DollarSign, ArrowUpRight } from "lucide-react";
import { type ReactNode } from "react";

export interface TimelineMilestone {
  date: string;
  label: string;
  description?: string;
  type: "acquisition" | "ramp" | "stabilization" | "refinance" | "exit" | "custom";
  value?: string;
}

interface PropertyTimelineProps {
  milestones: TimelineMilestone[];
  title?: string;
  className?: string;
  "data-testid"?: string;
}

const typeConfig: Record<string, { icon: ReactNode; color: string; bg: string }> = {
  acquisition: { icon: <Key className="w-4 h-4" />, color: "text-blue-600", bg: "bg-blue-100" },
  ramp: { icon: <TrendingUp className="w-4 h-4" />, color: "text-amber-600", bg: "bg-amber-100" },
  stabilization: { icon: <Building2 className="w-4 h-4" />, color: "text-emerald-600", bg: "bg-emerald-100" },
  refinance: { icon: <DollarSign className="w-4 h-4" />, color: "text-purple-600", bg: "bg-purple-100" },
  exit: { icon: <ArrowUpRight className="w-4 h-4" />, color: "text-red-600", bg: "bg-red-100" },
  custom: { icon: <Building2 className="w-4 h-4" />, color: "text-gray-600", bg: "bg-gray-100" },
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export function PropertyTimeline({ milestones, title, className, ...props }: PropertyTimelineProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)] ${className || ""}`}
      data-testid={props["data-testid"]}
    >
      {title && <h3 className="text-lg font-display text-gray-900 mb-6">{title}</h3>}
      <motion.div
        className="relative"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
        {milestones.map((m, i) => {
          const config = typeConfig[m.type] || typeConfig.custom;
          return (
            <motion.div key={i} variants={itemVariants} className="relative flex gap-4 pb-6 last:pb-0">
              <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full ${config.bg} ${config.color} flex items-center justify-center shadow-sm`}>
                {config.icon}
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-gray-900 text-sm">{m.label}</span>
                  <span className="text-xs text-gray-400 font-mono">{m.date}</span>
                </div>
                {m.description && <p className="text-xs text-gray-500 mt-0.5 label-text">{m.description}</p>}
                {m.value && <p className="text-sm font-mono font-semibold text-gray-800 mt-1">{m.value}</p>}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
