import * as React from "react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/financialEngine";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: React.ReactNode;
  format?: "money" | "percent" | "number" | "text";
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  description?: string;
  variant?: "glass" | "light" | "sage" | "dashboard";
  className?: string;
  "data-testid"?: string;
}

function formatStatValue(value: string | number, format?: "money" | "percent" | "number" | "text"): string {
  if (typeof value === "string") return value;
  switch (format) {
    case "money":
      return formatMoney(value);
    case "percent":
      return `${value.toFixed(1)}%`;
    case "number":
      return value.toLocaleString("en-US");
    default:
      return String(value);
  }
}

function StatCard({
  label,
  value,
  sublabel,
  icon,
  format = "text",
  trend,
  trendValue,
  description,
  variant = "glass",
  className,
  ...props
}: StatCardProps) {
  if (variant === "dashboard") {
    return (
      <div
        className={cn(
          "bg-white rounded-lg p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group",
          className
        )}
        data-testid={props["data-testid"]}
      >
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm font-medium text-foreground/60 label-text">
            {label}
          </p>
          {trend && trendValue && (
            <span className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md",
              trend === "up" && "text-emerald-700 bg-emerald-50",
              trend === "down" && "text-red-600 bg-red-50",
              trend === "neutral" && "text-gray-500 bg-gray-100"
            )}>
              {trend === "up" && <TrendingUp className="w-3 h-3" />}
              {trend === "down" && <TrendingDown className="w-3 h-3" />}
              {trend === "neutral" && <Minus className="w-3 h-3" />}
              {trendValue}
            </span>
          )}
        </div>
        <p className={cn(
          "text-3xl font-bold font-mono text-foreground tracking-tight",
        )}>
          {formatStatValue(value, format)}
        </p>
        {(description || sublabel) && (
          <p className="text-xs text-foreground/40 mt-2 label-text leading-relaxed">
            {description || sublabel}
          </p>
        )}
      </div>
    );
  }

  if (variant === "sage") {
    return (
      <div
        className={cn(
          "bg-white rounded-lg p-5 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300",
          className
        )}
        data-testid={props["data-testid"]}
      >
        {icon && <div className="mb-3">{icon}</div>}
        <p className="text-xs font-medium text-[#2d4a5e]/50 tracking-wider uppercase mb-1 label-text">
          {label}
        </p>
        <p
          className={cn(
            "text-2xl font-bold font-mono text-[#2d4a5e]",
            trend === "up" && "text-secondary",
            trend === "down" && "text-red-500"
          )}
        >
          {formatStatValue(value, format)}
        </p>
        {sublabel && (
          <p className="text-xs text-[#2d4a5e]/40 mt-1 label-text">{sublabel}</p>
        )}
      </div>
    );
  }

  if (variant === "light") {
    return (
      <div
        className={cn(
          "bg-white rounded-lg p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300",
          className
        )}
        data-testid={props["data-testid"]}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-secondary">
              {icon}
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider label-text">
              {label}
            </p>
            <p
              className={cn(
                "text-xl font-bold font-mono text-gray-900",
                trend === "up" && "text-secondary",
                trend === "down" && "text-red-500"
              )}
            >
              {formatStatValue(value, format)}
            </p>
            {sublabel && (
              <p className="text-xs text-gray-400 mt-0.5 label-text">{sublabel}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg p-5",
        className
      )}
      data-testid={props["data-testid"]}
    >
      <div className="absolute inset-0 bg-white" />
      <div className="absolute inset-0 rounded-lg border border-gray-200" />
      <div className="relative">
        {icon && <div className="mb-2 text-primary">{icon}</div>}
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 label-text">
          {label}
        </p>
        <p
          className={cn(
            "text-2xl font-bold font-mono text-gray-900",
            trend === "up" && "text-primary",
            trend === "down" && "text-red-400"
          )}
        >
          {formatStatValue(value, format)}
        </p>
        {sublabel && (
          <p className="text-xs text-gray-400 mt-1 label-text">{sublabel}</p>
        )}
      </div>
    </div>
  );
}

export { StatCard };
