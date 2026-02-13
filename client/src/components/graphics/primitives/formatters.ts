import { formatMoney } from "@/lib/financialEngine";

export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatPercentRaw(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function trendDirection(current: number, previous: number): "up" | "down" | "neutral" {
  if (current > previous * 1.001) return "up";
  if (current < previous * 0.999) return "down";
  return "neutral";
}

export const CHART_COLORS = {
  primary: "#9FBCA4",
  secondary: "#257D41",
  accent: "#F4795B",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  amber: "#F59E0B",
  red: "#EF4444",
  teal: "#14B8A6",
  slate: "#64748B",
  gradient: {
    sage: ["#9FBCA4", "#257D41"],
    ocean: ["#3B82F6", "#60A5FA"],
    sunset: ["#F4795B", "#FB923C"],
    purple: ["#8B5CF6", "#A78BFA"],
  },
  palette: ["#9FBCA4", "#257D41", "#3B82F6", "#F4795B", "#8B5CF6", "#F59E0B", "#14B8A6", "#EF4444"],
} as const;

export { formatMoney };
