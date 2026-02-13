import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface GaugeProps {
  value: number;
  min?: number;
  max?: number;
  label: string;
  format?: (v: number) => string;
  size?: "sm" | "md" | "lg";
  color?: string;
  thresholds?: { good: number; warn: number };
  className?: string;
  "data-testid"?: string;
}

const sizeMap = {
  sm: { svg: 120, radius: 44, stroke: 8, text: "text-xl", label: "text-[10px]" },
  md: { svg: 160, radius: 60, stroke: 10, text: "text-3xl", label: "text-xs" },
  lg: { svg: 200, radius: 76, stroke: 12, text: "text-4xl", label: "text-sm" },
};

function getColor(value: number, thresholds?: { good: number; warn: number }, fallback?: string): string {
  if (!thresholds) return fallback || "#257D41";
  if (value >= thresholds.good) return "#257D41";
  if (value >= thresholds.warn) return "#F59E0B";
  return "#EF4444";
}

export function Gauge({ value, min = 0, max = 100, label, format, size = "md", color, thresholds, className, ...props }: GaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const s = sizeMap[size];
  const circumference = Math.PI * s.radius;
  const clampedValue = Math.max(min, Math.min(max, value));
  const percentage = (clampedValue - min) / (max - min);
  const strokeColor = color || getColor(value, thresholds);
  const displayValue = format ? format(value) : `${value.toFixed(1)}%`;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`flex flex-col items-center ${className || ""}`}
      data-testid={props["data-testid"]}
    >
      <div className="relative" style={{ width: s.svg, height: s.svg * 0.65 }}>
        <svg width={s.svg} height={s.svg * 0.65} viewBox={`0 0 ${s.svg} ${s.svg * 0.65}`}>
          <path
            d={`M ${s.svg * 0.1} ${s.svg * 0.6} A ${s.radius} ${s.radius} 0 0 1 ${s.svg * 0.9} ${s.svg * 0.6}`}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={s.stroke}
            strokeLinecap="round"
          />
          <motion.path
            d={`M ${s.svg * 0.1} ${s.svg * 0.6} A ${s.radius} ${s.radius} 0 0 1 ${s.svg * 0.9} ${s.svg * 0.6}`}
            fill="none"
            stroke={strokeColor}
            strokeWidth={s.stroke}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: animatedValue }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            style={{ filter: `drop-shadow(0 0 6px ${strokeColor}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className={`${s.text} font-bold font-mono text-gray-900`}>{displayValue}</span>
        </div>
      </div>
      <span className={`${s.label} text-gray-500 font-medium mt-1 label-text`}>{label}</span>
    </motion.div>
  );
}
