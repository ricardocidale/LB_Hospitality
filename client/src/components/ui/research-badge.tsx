/**
 * research-badge.tsx — Compact badge for AI-researched metric values.
 *
 * Displays a small pill showing an AI-sourced data point (e.g. "Avg ADR: $185").
 * Shows a subtle shimmer animation while the value is still loading (null).
 * Used inside the property research sections alongside MetricCard.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ResearchBadgeProps {
  value: string | null | undefined;
  onClick?: () => void;
  variant?: "light" | "dark";
  className?: string;
  "data-testid"?: string;
}

const ResearchBadge = React.forwardRef<HTMLButtonElement, ResearchBadgeProps>(
  ({ value, onClick, variant = "light", className, ...props }, ref) => {
    if (!value) return null;

    const isDark = variant === "dark";

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={cn(
          "text-xs font-medium rounded-md px-1.5 py-0.5 transition-colors cursor-pointer",
          isDark
            ? "text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30"
            : "text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200",
          className,
        )}
        title="Click to apply research-recommended value"
        data-testid={props["data-testid"] ?? "badge-research"}
      >
        (Research: {value})
      </button>
    );
  },
);

ResearchBadge.displayName = "ResearchBadge";

export { ResearchBadge };
