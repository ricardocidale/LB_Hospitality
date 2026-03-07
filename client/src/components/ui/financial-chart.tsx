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
  revenue: { dataKey: "Revenue", name: "Total Revenue", color: "#18181b" },
  gop: { dataKey: "GOP", name: "Gross Operating Profit", color: "#3B82F6" },
  agop: { dataKey: "AGOP", name: "Adjusted GOP (AGOP)", color: "#10B981" },
  noi: { dataKey: "NOI", name: "Net Operating Income (NOI)", color: "#F59E0B" },
  anoi: { dataKey: "ANOI", name: "Adjusted NOI (ANOI)", color: "#6B7280" },
  expenses: { dataKey: "Expenses", name: "Total Expenses", color: "#3B82F6" },
  netIncome: { dataKey: "NetIncome", name: "Net Income", color: "#6B7280" },
  cashFlow: { dataKey: "CashFlow", name: "Cash Flow", color: "#8B5CF6" },
  fcfe: { dataKey: "FCFE", name: "Free Cash Flow to Equity", color: "#6B7280" },
  btcf: { dataKey: "BTCF", name: "Before-Tax Cash Flow", color: "#3B82F6" },
  atcf: { dataKey: "ATCF", name: "After-Tax Cash Flow", color: "#6B7280" },
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
}: FinancialChartProps) {
  const resolvedSeries = series.map((s) => {
    if (typeof s === "string") {
      return PRESET_SERIES[s] || { dataKey: s, color: "#6B7280" };
    }
    return s;
  });

  return (
    <div
      ref={chartRef}
      className={cn(
        "rounded-lg p-5 bg-card border border-border shadow-sm",
        className
      )}
    >
      {title && (
        <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      )}
      {subtitle && (
        <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey={xAxisKey}
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={yAxisFormatter}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                borderColor: "#E5E7EB",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                fontSize: "13px",
              }}
              labelStyle={{ color: "#111827", fontWeight: 600, fontSize: "13px" }}
              formatter={(value: number) => [
                tooltipFormatter ? tooltipFormatter(value) : formatMoney(value),
                "",
              ]}
            />
            <Legend wrapperStyle={{ color: "#374151", fontSize: "12px" }} iconType="circle" />
            {resolvedSeries.map((s) => (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                stroke={s.color}
                strokeWidth={2}
                name={s.name || s.dataKey}
                dot={{ fill: s.color, stroke: "#fff", strokeWidth: 2, r: 3.5 }}
                activeDot={{ r: 5.5, fill: s.color, stroke: "#fff", strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export { FinancialChart, PRESET_SERIES };
