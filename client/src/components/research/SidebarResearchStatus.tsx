import { useMemo } from "react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { useResearchStatus } from "@/lib/api/research";
import { useGlobalAssumptions } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { IconExternalLink } from "@/components/icons";

type FreshnessLevel = "fresh" | "stale" | "missing";

const categories = [
  { label: "Property", type: "property" },
  { label: "Operations", type: "operations" },
  { label: "Marketing", type: "marketing" },
  { label: "Industry", type: "industry" },
];

function getFreshness(updatedAt: string | null | undefined, thresholdDays: number): FreshnessLevel {
  if (!updatedAt) return "missing";
  const daysAgo = differenceInCalendarDays(new Date(), parseISO(updatedAt));
  return daysAgo <= thresholdDays ? "fresh" : "stale";
}

const dotColor: Record<FreshnessLevel, string> = {
  fresh: "bg-emerald-500",
  stale: "bg-red-500",
  missing: "bg-red-500",
};

interface SidebarResearchStatusProps {
  onNavigate?: () => void;
}

export function SidebarResearchStatus({ onNavigate }: SidebarResearchStatusProps) {
  const { data: researchStatus } = useResearchStatus();
  const { data: globalAssumptions } = useGlobalAssumptions();

  const refreshIntervalDays = (globalAssumptions as any)?.researchRefreshIntervalDays ?? 7;

  const statuses = useMemo(() => {
    return categories.map((cat) => {
      const statusEntry = researchStatus?.types?.[cat.type];
      const updatedAt = statusEntry?.updatedAt ?? null;
      const freshness = getFreshness(updatedAt, refreshIntervalDays);
      return { ...cat, freshness };
    });
  }, [researchStatus, refreshIntervalDays]);

  return (
    <Link
      href="/research"
      onClick={onNavigate}
      className="block mx-2 mb-1.5 rounded-md border border-sidebar-border bg-sidebar-accent/30 px-3 py-2 hover:bg-sidebar-accent/50 transition-colors cursor-pointer"
      data-testid="sidebar-research-status"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold text-sidebar-foreground/70 uppercase tracking-wider">Research</span>
        <IconExternalLink className="w-3 h-3 text-sidebar-foreground/40" />
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {statuses.map((s) => (
          <div key={s.type} className="flex items-center gap-1.5">
            <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColor[s.freshness])} />
            <span className="text-[11px] text-sidebar-foreground/60">{s.label}</span>
          </div>
        ))}
      </div>
    </Link>
  );
}
