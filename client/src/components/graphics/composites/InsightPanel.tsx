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
        className={`flex flex-wrap gap-2 ${className || ""}`}
        data-testid={props["data-testid"]}
      >
        {insights.map((insight, i) => {
          const config = typeConfig[insight.type || "neutral"];
          return (
            <span key={i} className={`inline-flex items-center gap-1.5 text-xs ${config.color} bg-white rounded-full px-3 py-1.5 border border-gray-200`}>
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
        className={`rounded-lg p-4 bg-gray-50 border border-gray-200 ${className || ""}`}
        data-testid={props["data-testid"]}
      >
        <div className="flex items-center gap-2 mb-2">
          {icon || <Sparkles className="w-4 h-4 text-gray-500" />}
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className={`rounded-lg p-5 bg-white border border-gray-200 shadow-sm ${className || ""}`}
      data-testid={props["data-testid"]}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon || <Sparkles className="w-4 h-4 text-gray-500" />}
        <h3 className="text-sm font-semibold text-gray-900">{title || "Key Insights"}</h3>
      </div>
      <div className="space-y-2.5">
        {insights.map((insight, i) => {
          const config = typeConfig[insight.type || "neutral"];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex items-start gap-2.5"
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
    </motion.div>
  );
}
