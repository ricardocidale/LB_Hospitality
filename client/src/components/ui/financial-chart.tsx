import * as React from "react";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatMoney } from "@/lib/financialEngine";

export interface ChartSeries {
  dataKey: string;
  name?: string;
  color: string;
  gradientTo?: string;
}

const PRESET_SERIES: Record<string, ChartSeries> = {
  revenue: { dataKey: "Revenue", name: "Total Revenue", color: "#257D41", gradientTo: "#34D399" },
  gop: { dataKey: "GOP", name: "Gross Operating Profit", color: "#3B82F6", gradientTo: "#60A5FA" },
  noi: { dataKey: "NOI", name: "Net Operating Income", color: "#F4795B", gradientTo: "#FB923C" },
  expenses: { dataKey: "Expenses", name: "Total Expenses", color: "#3B82F6", gradientTo: "#60A5FA" },
  netIncome: { dataKey: "NetIncome", name: "Net Income", color: "#F4795B", gradientTo: "#FB923C" },
  cashFlow: { dataKey: "CashFlow", name: "Cash Flow", color: "#8B5CF6", gradientTo: "#A78BFA" },
  fcfe: { dataKey: "FCFE", name: "Free Cash Flow to Equity", color: "#F4795B", gradientTo: "#FB923C" },
  btcf: { dataKey: "BTCF", name: "Before-Tax Cash Flow", color: "#3B82F6", gradientTo: "#60A5FA" },
  atcf: { dataKey: "ATCF", name: "After-Tax Cash Flow", color: "#F4795B", gradientTo: "#FB923C" },
};

export interface FinancialChartProps {
  data: Record<string, unknown>[];
  series: (ChartSeries | string)[];
  title?: string;
  subtitle?: string;
  height?: number;
  xAxisKey?: string;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;
  className?: string;
  chartRef?: React.Ref<HTMLDivElement>;
  id?: string;
}

function defaultYFormatter(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

function FinancialChart({
  data,
  series,
  title,
  subtitle,
  height = 300,
  xAxisKey = "year",
  yAxisFormatter = defaultYFormatter,
  tooltipFormatter,
  className,
  chartRef,
  id,
}: FinancialChartProps) {
  const resolvedSeries = series.map((s) => {
    if (typeof s === "string") {
      return PRESET_SERIES[s] || { dataKey: s, color: "#6B7280" };
    }
    return s;
  });

  const chartId = id || React.useId().replace(/:/g, "");

  return (
    <div
      ref={chartRef}
      className={cn(
        "relative overflow-hidden rounded-3xl p-6 bg-white shadow-lg border border-gray-100",
        className
      )}
    >
      <div className="relative">
        {title && (
          <h3 className="text-lg font-display text-gray-900 mb-1">{title}</h3>
        )}
        {subtitle && (
          <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
        )}
        {!subtitle && title && <div className="mb-4" />}
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <defs>
                {resolvedSeries.map((s, i) => (
                  <linearGradient
                    key={`${chartId}-grad-${i}`}
                    id={`${chartId}-grad-${i}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor={s.color} />
                    <stop offset="100%" stopColor={s.gradientTo || s.color} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey={xAxisKey}
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
              />
              <YAxis
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
                tickFormatter={yAxisFormatter}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  borderColor: "#E5E7EB",
                  borderRadius: "12px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  color: "#111827",
                }}
                labelStyle={{ color: "#374151", fontWeight: 600 }}
                formatter={(value: number) => [
                  tooltipFormatter ? tooltipFormatter(value) : formatMoney(value),
                  "",
                ]}
              />
              <Legend wrapperStyle={{ color: "#374151" }} iconType="circle" />
              {resolvedSeries.map((s, i) => (
                <Line
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  stroke={`url(#${chartId}-grad-${i})`}
                  strokeWidth={3}
                  name={s.name || s.dataKey}
                  dot={{ fill: s.color, stroke: "#fff", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: s.color, stroke: "#fff", strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export { FinancialChart, PRESET_SERIES };
