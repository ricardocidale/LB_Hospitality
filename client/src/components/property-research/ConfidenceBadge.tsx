/**
 * ConfidenceBadge.tsx — Shows how a research recommendation compares to market.
 *
 * Displays a small colored pill indicating whether the AI's recommended
 * value is conservative, moderate, or aggressive relative to market data.
 */
import { cn } from "@/lib/utils";
import { Shield, Check, AlertTriangle } from "lucide-react";

type Confidence = "conservative" | "moderate" | "aggressive";

const CONFIDENCE_CONFIG: Record<Confidence, { label: string; icon: typeof Shield; className: string; title: string }> = {
  conservative: {
    label: "Conservative",
    icon: Shield,
    className: "text-blue-700 bg-blue-50 border-blue-200",
    title: "Below market average — lower risk estimate",
  },
  moderate: {
    label: "Moderate",
    icon: Check,
    className: "text-emerald-700 bg-emerald-50 border-emerald-200",
    title: "In line with market averages",
  },
  aggressive: {
    label: "Aggressive",
    icon: AlertTriangle,
    className: "text-amber-700 bg-amber-50 border-amber-200",
    title: "Above market average — higher risk estimate",
  },
};

interface ConfidenceBadgeProps {
  confidence: string | undefined | null;
  className?: string;
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  if (!confidence) return null;
  const key = confidence.toLowerCase() as Confidence;
  const config = CONFIDENCE_CONFIG[key];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider rounded-md px-1.5 py-0.5 border",
        config.className,
        className
      )}
      title={config.title}
    >
      <Icon className="w-2.5 h-2.5" />
      {config.label}
    </span>
  );
}
