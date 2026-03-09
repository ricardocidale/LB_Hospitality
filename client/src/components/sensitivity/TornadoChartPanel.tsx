import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ReferenceLine } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { TornadoItem } from "./types";

interface TornadoChartPanelProps {
  tornadoData: TornadoItem[];
  tornadoMetric: "noi" | "irr";
  onMetricChange: (metric: "noi" | "irr") => void;
}

const tornadoConfig = {
  positive: {
    label: "Upside",
    color: "hsl(var(--chart-3))",
  },
  negative: {
    label: "Downside",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig;

export function TornadoChartPanel({ tornadoData, tornadoMetric, onMetricChange }: TornadoChartPanelProps) {
  return (
    <div className="bg-card/80 rounded-lg p-6 border border-primary/10 shadow-[0_2px_8px_rgba(var(--primary-rgb,159,188,164),0.08)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-secondary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-display font-bold text-foreground" data-testid="text-tornado-title">
              Impact on {tornadoMetric === "irr" ? "IRR" : "ANOI"}
            </h3>
            <div className="flex rounded-lg border border-border overflow-hidden text-xs">
              <button
                onClick={() => onMetricChange("irr")}
                className={`px-2.5 py-1 font-medium transition-colors ${tornadoMetric === "irr" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="button-tornado-irr"
              >
                IRR
              </button>
              <button
                onClick={() => onMetricChange("noi")}
                className={`px-2.5 py-1 font-medium transition-colors ${tornadoMetric === "noi" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="button-tornado-noi"
              >
                NOI
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {tornadoMetric === "irr"
              ? "Which variables have the biggest effect on Levered IRR (pp change)"
              : "Which variables have the biggest effect on Adjusted NOI (% change)"}
          </p>
        </div>
      </div>

      {tornadoData.length > 0 ? (
        <ChartContainer config={tornadoConfig} className="h-[350px] w-full">
          <BarChart
            accessibilityLayer
            data={tornadoData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val > 0 ? "+" : ""}${val.toFixed(1)}%`}
              domain={["auto", "auto"]}
            />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={130}
              tick={{ fontSize: 12, fontWeight: 500 }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent
                formatter={(value, name) => [
                  `${Number(value) > 0 ? "+" : ""}${Number(value).toFixed(2)}${tornadoMetric === "irr" ? "pp" : "%"}`,
                  name === "positive" ? "Upside" : "Downside",
                ]}
              />}
            />
            <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeWidth={1.5} strokeOpacity={0.3} />
            <Bar dataKey="positive" stackId="tornado" radius={[0, 8, 8, 0]} maxBarSize={28}>
              {tornadoData.map((_, i) => (
                <Cell key={`pos-${i}`} fill="var(--color-positive)" fillOpacity={0.85} />
              ))}
            </Bar>
            <Bar dataKey="negative" stackId="tornado" radius={[8, 0, 0, 8]} maxBarSize={28}>
              {tornadoData.map((_, i) => (
                <Cell key={`neg-${i}`} fill="var(--color-negative)" fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      ) : (
        <div className="h-[350px] flex items-center justify-center text-muted-foreground text-sm">
          No data available
        </div>
      )}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "hsl(var(--chart-3))" }} />
          <span>Upside scenario</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "hsl(var(--destructive))" }} />
          <span>Downside scenario</span>
        </div>
      </div>
    </div>
  );
}
