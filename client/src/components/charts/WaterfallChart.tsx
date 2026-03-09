/**
 * WaterfallChart.tsx — Recharts-based waterfall (bridge) chart.
 *
 * Visualizes how an initial value is transformed through a series of
 * positive and negative increments into a final total. Each bar floats
 * from the running subtotal, making it easy to see which line items
 * contribute most to the result.
 *
 * Common uses in this platform:
 *   - Revenue -> expenses -> GOP -> NOI bridge
 *   - Cash flow waterfall (operating CF + financing CF = ending cash)
 *   - Equity investment -> annual returns -> exit proceeds
 */
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ReferenceLine,
  LabelList,
} from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";

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
  if (item.isTotal) return "hsl(var(--chart-3))";
  return item.value >= 0 ? "var(--primary)" : "hsl(var(--destructive))";
}

const waterfallConfig = {
  delta: {
    label: "Amount",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDataItem }>;
  formatValue: (v: number) => string;
}

function CustomTooltipContent({ active, payload, formatValue }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <p className="font-medium text-foreground">{item.label}</p>
      <p className="font-mono tabular-nums text-muted-foreground">{formatValue(item.value)}</p>
    </div>
  );
}

export default function WaterfallChart({ steps, title, formatValue }: WaterfallChartProps) {
  const fmt = formatValue || defaultFormat;
  const data = buildChartData(steps);

  return (
    <div data-testid="waterfall-chart" className="bg-card rounded-xl border border-border shadow-sm p-6">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ChartContainer config={waterfallConfig} className="h-[350px] w-full">
        <BarChart
          accessibilityLayer
          data={data}
          margin={{ top: 20, right: 10, left: 10, bottom: 40 }}
        >
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            angle={-30}
            textAnchor="end"
            height={60}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            tickFormatter={(v: number) => fmt(v)}
            tickLine={false}
            axisLine={false}
          />
          <ChartTooltip
            cursor={false}
            content={<CustomTooltipContent formatValue={fmt} />}
          />
          <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.2} />
          <Bar dataKey="base" stackId="stack" fill="transparent" isAnimationActive={false}>
            {data.map((_, idx) => (
              <Cell key={`base-${idx}`} fill="transparent" />
            ))}
          </Bar>
          <Bar dataKey="delta" stackId="stack" isAnimationActive={false} radius={[8, 8, 0, 0]}>
            {data.map((item, idx) => (
              <Cell key={`delta-${idx}`} fill={getColor(item)} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              offset={10}
              className="fill-foreground"
              fontSize={11}
              formatter={(v: number) => fmt(v)}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
