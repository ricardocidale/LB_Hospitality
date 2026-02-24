/**
 * InsightPanel.tsx — AI-style insight summary card.
 *
 * Renders a list of tagged insights with type-based icons and colors:
 *   • positive (green check)  — e.g. "Cash position: Adequate"
 *   • negative (red arrow)    — e.g. "Cash shortfall: $120K"
 *   • warning (amber triangle)— e.g. "Occupancy below 60%"
 *   • neutral (sparkles)      — e.g. "Total funding: $500K"
 *
 * Used on property detail and company pages to surface key takeaways
 * from the financial projections without requiring the user to scan
 * the full income statement.
 */
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { type ReactNode } from "react";

export interface Insight {
  text: string;
  type?: "positive" | "negative" | "warning" | "neutral";
  metric?: string;
}

interface InsightPanelProps {
  insights: Insight[];
  title?: string;
  icon?: ReactNode;
  variant?: "glass" | "compact" | "inline";
  className?: string;
  "data-testid"?: string;
}

const typeConfig = {
  positive: { icon: <TrendingUp className="w-3.5 h-3.5" />, color: "text-emerald-600", dot: "bg-emerald-500" },
  negative: { icon: <TrendingDown className="w-3.5 h-3.5" />, color: "text-red-600", dot: "bg-red-500" },
  warning: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-amber-600", dot: "bg-amber-500" },
  neutral: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-gray-600", dot: "bg-gray-400" },
};

export function InsightPanel({ insights, title, icon, variant = "glass", className, ...props }: InsightPanelProps) {
  if (variant === "inline") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={`flex flex-wrap gap-3 ${className || ""}`}
        data-testid={props["data-testid"]}
      >
        {insights.map((insight, i) => {
          const config = typeConfig[insight.type || "neutral"];
          return (
            <span key={i} className={`inline-flex items-center gap-1.5 text-xs ${config.color} bg-white/80 rounded-full px-3 py-1.5 border border-gray-100`}>
              {config.icon}
              {insight.text}
              {insight.metric && <span className="font-mono font-semibold">{insight.metric}</span>}
            </span>
          );
        })}
      </motion.div>
    );
  }

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`rounded-xl p-4 bg-primary/5 border border-primary/10 ${className || ""}`}
        data-testid={props["data-testid"]}
      >
        <div className="flex items-center gap-2 mb-2">
          {icon || <Sparkles className="w-4 h-4 text-primary" />}
          <span className="text-sm font-medium text-gray-700">{title || "Key Insights"}</span>
        </div>
        <div className="space-y-1.5">
          {insights.map((insight, i) => {
            const config = typeConfig[insight.type || "neutral"];
            return (
              <div key={i} className="flex items-start gap-2">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${config.dot}`} />
                <p className="text-xs text-gray-600">
                  {insight.text}
                  {insight.metric && <span className="font-mono font-semibold ml-1">{insight.metric}</span>}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className={`relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)] ${className || ""}`}
      data-testid={props["data-testid"]}
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/5 blur-2xl" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          {icon || <Sparkles className="w-5 h-5 text-primary" />}
          <h3 className="text-lg font-display text-gray-900">{title || "Key Insights"}</h3>
        </div>
        <div className="space-y-3">
          {insights.map((insight, i) => {
            const config = typeConfig[insight.type || "neutral"];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className={`mt-0.5 ${config.color}`}>{config.icon}</div>
                <p className="text-sm text-gray-700">
                  {insight.text}
                  {insight.metric && <span className="font-mono font-semibold ml-1">{insight.metric}</span>}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
