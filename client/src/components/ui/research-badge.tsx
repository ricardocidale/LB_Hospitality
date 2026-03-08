/**
 * research-badge.tsx — Compact badge for researched metric values.
 *
 * Displays a small pill showing a data point (e.g. "Industry: $280-$420").
 * Color-coded by source type:
 *   - market (blue)   — live API data (FRED, BLS, Frankfurter)
 *   - industry (amber) — cited benchmark from industry publications
 *   - ai (purple)      — AI-generated research
 *   - seed (amber)     — legacy/backward-compat for existing seed values
 *
 * Tooltip shows the source name and date on hover.
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type BadgeSourceType = "market" | "industry" | "ai" | "seed";

interface ResearchEntry {
  display: string;
  mid: number;
  source?: string;
  sourceName?: string;
  sourceDate?: string;
}

export interface ResearchBadgeProps {
  value?: string | null | undefined;
  entry?: ResearchEntry | null | undefined;
  onClick?: () => void;
  sourceType?: BadgeSourceType;
  sourceName?: string;
  sourceDate?: string;
  variant?: "light" | "dark";
  className?: string;
  "data-testid"?: string;
}

const SOURCE_LABELS: Record<BadgeSourceType, string> = {
  market: "Market",
  industry: "Industry",
  ai: "AI Research",
  seed: "Research",
};

const SOURCE_STYLES: Record<BadgeSourceType, { light: string; dark: string }> = {
  market: {
    light: "text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200",
    dark: "text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30",
  },
  industry: {
    light: "text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200",
    dark: "text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30",
  },
  ai: {
    light: "text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200",
    dark: "text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30",
  },
  seed: {
    light: "text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200",
    dark: "text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30",
  },
};

function formatTooltip(sourceType: BadgeSourceType, sourceName?: string, sourceDate?: string): string {
  const parts: string[] = [];
  if (sourceName) {
    parts.push(sourceName);
  }
  if (sourceDate) {
    try {
      const d = new Date(sourceDate);
      parts.push(`updated ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`);
    } catch (error) {
      // Fallback to raw date string if parsing fails
      parts.push(`updated ${sourceDate}`);
    }
  }
  if (parts.length > 0) {
    return `${parts.join(", ")}. Click to apply.`;
  }
  return "Click to apply research-recommended value";
}

function resolveSourceType(source?: string): BadgeSourceType {
  if (source === "market") return "market";
  if (source === "ai") return "ai";
  if (source === "seed") return "industry";
  return "seed";
}

const ResearchBadge = React.forwardRef<HTMLButtonElement, ResearchBadgeProps>(
  ({ value: valueProp, entry, onClick, sourceType: sourceTypeProp, sourceName: sourceNameProp, sourceDate: sourceDateProp, variant = "light", className, ...props }, ref) => {
    const value = valueProp ?? entry?.display ?? null;
    const sourceType = sourceTypeProp ?? (entry ? resolveSourceType(entry.source) : "seed");
    const sourceName = sourceNameProp ?? entry?.sourceName;
    const sourceDate = sourceDateProp ?? entry?.sourceDate;
    if (!value) return null;

    const isDark = variant === "dark";
    const label = SOURCE_LABELS[sourceType];
    const styles = SOURCE_STYLES[sourceType];
    const colorClass = isDark ? styles.dark : styles.light;
    const tooltipText = formatTooltip(sourceType, sourceName, sourceDate);

    const button = (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={cn(
          "text-xs font-medium rounded-md px-1.5 py-0.5 transition-colors cursor-pointer",
          colorClass,
          className,
        )}
        data-testid={props["data-testid"] ?? "badge-research"}
      >
        ({label}: {value})
      </button>
    );

    if (sourceName || sourceDate) {
      return (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-64">
              {tooltipText}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return button;
  },
);

ResearchBadge.displayName = "ResearchBadge";

export { ResearchBadge };
