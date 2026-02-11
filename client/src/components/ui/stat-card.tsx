import * as React from "react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/financialEngine";

export interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: React.ReactNode;
  format?: "money" | "percent" | "number" | "text";
  trend?: "up" | "down" | "neutral";
  variant?: "glass" | "light" | "sage";
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
  variant = "glass",
  className,
  ...props
}: StatCardProps) {
  if (variant === "sage") {
    return (
      <div
        className={cn(
          "bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-white/40 shadow-lg shadow-black/10 hover:shadow-xl transition-all duration-300",
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
          "bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300",
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
        "relative overflow-hidden rounded-2xl p-5",
        className
      )}
      data-testid={props["data-testid"]}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a5e]/80 via-[#3d5a6a]/70 to-[#3a5a5e]/80" />
      <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="absolute inset-0 rounded-2xl border border-white/10" />
      <div className="relative">
        {icon && <div className="mb-2 text-primary">{icon}</div>}
        <p className="text-xs font-medium text-background/50 uppercase tracking-wider mb-1 label-text">
          {label}
        </p>
        <p
          className={cn(
            "text-2xl font-bold font-mono text-background",
            trend === "up" && "text-primary",
            trend === "down" && "text-red-400"
          )}
        >
          {formatStatValue(value, format)}
        </p>
        {sublabel && (
          <p className="text-xs text-background/40 mt-1 label-text">{sublabel}</p>
        )}
      </div>
    </div>
  );
}

export { StatCard };
