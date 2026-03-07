import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import type { TornadoItem } from "./types";

interface TornadoChartPanelProps {
  tornadoData: TornadoItem[];
  tornadoMetric: "noi" | "irr";
  onMetricChange: (metric: "noi" | "irr") => void;
}

export function TornadoChartPanel({ tornadoData, tornadoMetric, onMetricChange }: TornadoChartPanelProps) {
  return (
    <div className="bg-white/80 rounded-lg p-6 border border-primary/10 shadow-[0_2px_8px_rgba(var(--primary-rgb,159,188,164),0.08)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-secondary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-display font-bold text-foreground" data-testid="text-tornado-title">
              Impact on {tornadoMetric === "irr" ? "IRR" : "NOI"}
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
              : "Which variables have the biggest effect on Net Operating Income (% change)"}
          </p>
        </div>
      </div>

      {tornadoData.length > 0 ? (
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={tornadoData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(val) => `${val > 0 ? "+" : ""}${val.toFixed(1)}%`}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                domain={["auto", "auto"]}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: "#374151", fontWeight: 500 }}
                width={130}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value > 0 ? "+" : ""}${value.toFixed(2)}${tornadoMetric === "irr" ? "pp" : "%"}`,
                  name === "positive" ? "Upside" : "Downside",
                ]}
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <ReferenceLine x={0} stroke="#374151" strokeWidth={1.5} />
              <Bar dataKey="positive" stackId="tornado" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {tornadoData.map((_, i) => (
                  <Cell key={`pos-${i}`} fill="#257D41" fillOpacity={0.8} />
                ))}
              </Bar>
              <Bar dataKey="negative" stackId="tornado" radius={[4, 0, 0, 4]} maxBarSize={28}>
                {tornadoData.map((_, i) => (
                  <Cell key={`neg-${i}`} fill="#F4795B" fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[350px] flex items-center justify-center text-muted-foreground text-sm">
          No data available
        </div>
      )}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#257D41]" />
          <span>Upside scenario</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#F4795B]" />
          <span>Downside scenario</span>
        </div>
      </div>
    </div>
  );
}
