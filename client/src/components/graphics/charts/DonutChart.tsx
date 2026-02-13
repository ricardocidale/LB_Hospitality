import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { CHART_COLORS, formatCompact } from "../primitives/formatters";
import { motion } from "framer-motion";

export interface DonutSlice {
  name: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  title?: string;
  subtitle?: string;
  centerLabel?: string;
  centerValue?: string;
  height?: number;
  formatValue?: (v: number) => string;
  className?: string;
  "data-testid"?: string;
}

function CustomTooltip({ active, payload, formatValue }: { active?: boolean; payload?: any[]; formatValue: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-gray-900">{name}</p>
      <p className="text-gray-600 font-mono">{formatValue(value)}</p>
    </div>
  );
}

export function DonutChart({ data, title, subtitle, centerLabel, centerValue, height = 280, formatValue, className, ...props }: DonutChartProps) {
  const fmt = formatValue || formatCompact;
  const colors = data.map((d, i) => d.color || CHART_COLORS.palette[i % CHART_COLORS.palette.length]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)] ${className || ""}`}
      data-testid={props["data-testid"]}
    >
      {title && <h3 className="text-lg font-display text-gray-900 mb-1">{title}</h3>}
      {subtitle && <p className="text-sm text-gray-500 mb-3 label-text">{subtitle}</p>}
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i]} stroke="white" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip formatValue={fmt} />} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: "#6B7280" }}
            />
          </PieChart>
        </ResponsiveContainer>
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ marginBottom: 24 }}>
            {centerValue && <span className="text-2xl font-bold font-mono text-gray-900">{centerValue}</span>}
            {centerLabel && <span className="text-xs text-gray-500 label-text">{centerLabel}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}
