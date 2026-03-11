import { differenceInBusinessDays, format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { IconCheckCircle, IconClock, IconAlertCircle } from "@/components/icons";
import { cn } from "@/lib/utils";

interface ResearchFreshnessBadgeProps {
  updatedAt: string | null;
  refreshIntervalDays?: number;
  className?: string;
}

type FreshnessState = "fresh" | "stale" | "missing";

function getFreshnessState(
  updatedAt: string | null,
  refreshIntervalDays: number,
): { state: FreshnessState; daysAgo: number } {
  if (!updatedAt) {
    return { state: "missing", daysAgo: 0 };
  }

  const date = parseISO(updatedAt);
  const now = new Date();
  const daysAgo = differenceInBusinessDays(now, date);

  if (daysAgo <= refreshIntervalDays) {
    return { state: "fresh", daysAgo };
  }

  return { state: "stale", daysAgo };
}

const stateConfig: Record<
  FreshnessState,
  {
    icon: typeof IconCheckCircle;
    bg: string;
    text: string;
    border: string;
    dot: string;
  }
> = {
  fresh: {
    icon: IconCheckCircle,
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  stale: {
    icon: IconClock,
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
  },
  missing: {
    icon: IconAlertCircle,
    bg: "bg-red-500/10",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-500/20",
    dot: "bg-red-500",
  },
};

export function ResearchFreshnessBadge({
  updatedAt,
  refreshIntervalDays = 7,
  className,
}: ResearchFreshnessBadgeProps) {
  const { state, daysAgo } = getFreshnessState(updatedAt, refreshIntervalDays);
  const config = stateConfig[state];
  const Icon = config.icon;

  function getLabel(): string {
    if (state === "missing") {
      return "No research generated";
    }

    const dateStr = format(parseISO(updatedAt!), "MMM d, yyyy");

    if (state === "stale") {
      return `Generated ${dateStr} \u2014 Refresh recommended`;
    }

    return `Generated ${dateStr}`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5",
        config.bg,
        config.border,
        className,
      )}
    >
      <Icon className={cn("h-3.5 w-3.5 shrink-0", config.text)} />
      <span className={cn("label-text font-medium", config.text)}>
        {getLabel()}
      </span>
    </motion.div>
  );
}
