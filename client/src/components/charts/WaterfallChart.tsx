/**
 * WaterfallChart.tsx — Recharts-based waterfall (bridge) chart.
 *
 * Visualizes how an initial value is transformed through a series of
 * positive and negative increments into a final total. Each bar floats
 * from the running subtotal, making it easy to see which line items
 * contribute most to the result.
 *
 * Common uses in this platform:
 *   • Revenue → expenses → GOP → NOI bridge
 *   • Cash flow waterfall (operating CF + financing CF = ending cash)
 *   • Equity investment → annual returns → exit proceeds
 */
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

interface WaterfallStep {
  label: string;
  value: number;
  isTotal?: boolean;
}

interface WaterfallChartProps {
  steps: WaterfallStep[];
  title?: string;
  formatValue?: (v: number) => string;
}

const defaultFormat = (v: number) => v.toLocaleString();

interface ChartDataItem {
  label: string;
  base: number;
  delta: number;
  value: number;
  isTotal: boolean;
}

function buildChartData(steps: WaterfallStep[]): ChartDataItem[] {
  let runningTotal = 0;
  return steps.map((step) => {
    if (step.isTotal) {
      const delta = runningTotal;
      return { label: step.label, base: 0, delta, value: step.value, isTotal: true };
    }
    const delta = step.value;
    let base: number;
    if (delta >= 0) {
      base = runningTotal;
    } else {
      base = runningTotal + delta;
    }
    runningTotal += delta;
    return { label: step.label, base, delta: Math.abs(delta), value: step.value, isTotal: false };
  });
}

function getColor(item: ChartDataItem): string {
  if (item.isTotal) return "#257D41";
  return item.value >= 0 ? "#9FBCA4" : "#EF4444";
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDataItem }>;
  formatValue: (v: number) => string;
}

function CustomTooltipContent({ active, payload, formatValue }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-white border border-border rounded-lg px-3 py-2 shadow-md text-sm">
      <p className="font-medium">{item.label}</p>
      <p className="text-muted-foreground">{formatValue(item.value)}</p>
    </div>
  );
}

export default function WaterfallChart({ steps, title, formatValue }: WaterfallChartProps) {
  const fmt = formatValue || defaultFormat;
  const data = buildChartData(steps);

  return (
    <div data-testid="waterfall-chart" className="bg-white rounded-xl border border-border shadow-sm p-6">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            angle={-30}
            textAnchor="end"
          />
          <YAxis tickFormatter={(v: number) => fmt(v)} />
          <Tooltip content={<CustomTooltipContent formatValue={fmt} />} />
          <ReferenceLine y={0} stroke="#666" />
          <Bar dataKey="base" stackId="stack" fill="transparent" isAnimationActive={false}>
            {data.map((_, idx) => (
              <Cell key={`base-${idx}`} fill="transparent" />
            ))}
          </Bar>
          <Bar dataKey="delta" stackId="stack" isAnimationActive={false}>
            {data.map((item, idx) => (
              <Cell key={`delta-${idx}`} fill={getColor(item)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
