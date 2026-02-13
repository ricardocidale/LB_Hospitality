import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { AnimatedPage, ScrollReveal, KPIGrid, InsightPanel, DonutChart, formatCompact, formatPercent } from "@/components/graphics";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, Tooltip } from "recharts";

function fmtMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function fmtPct(value: number): string {
  return (value * 100).toFixed(1) + "%";
}

type MetricRow = {
  label: string;
  key: string;
  format: "text" | "money" | "percent";
  bestDir?: "high" | "low";
};

const METRICS: MetricRow[] = [
  { label: "Location", key: "location", format: "text" },
  { label: "Status", key: "status", format: "text" },
  { label: "Room Count", key: "roomCount", format: "text", bestDir: "high" },
  { label: "Start ADR", key: "startAdr", format: "money", bestDir: "high" },
  { label: "ADR Growth Rate", key: "adrGrowthRate", format: "percent", bestDir: "high" },
  { label: "Start Occupancy", key: "startOccupancy", format: "percent", bestDir: "high" },
  { label: "Max Occupancy", key: "maxOccupancy", format: "percent", bestDir: "high" },
  { label: "Purchase Price", key: "purchasePrice", format: "money", bestDir: "low" },
  { label: "Building Improvements", key: "buildingImprovements", format: "money", bestDir: "low" },
  { label: "Financing Type", key: "type", format: "text" },
];

export default function ComparisonView({ embedded }: { embedded?: boolean }) {
  const properties = useStore((s) => s.properties);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedProperties = useMemo(
    () => properties.filter((p) => selectedIds.includes(p.id)),
    [properties, selectedIds]
  );

  const toggleProperty = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const getBestValue = (key: string, dir?: "high" | "low"): number | string | null => {
    if (!dir || selectedProperties.length < 2) return null;
    const values = selectedProperties.map((p) => (p as any)[key] as number);
    if (values.some((v) => typeof v !== "number")) return null;
    return dir === "high" ? Math.max(...values) : Math.min(...values);
  };

  const formatValue = (value: any, format: "text" | "money" | "percent"): string => {
    if (value === null || value === undefined) return "—";
    if (format === "money") return fmtMoney(value);
    if (format === "percent") return fmtPct(value);
    return String(value);
  };

  const content = (
    <div className={embedded ? "space-y-6" : "min-h-screen bg-background p-6 md:p-8"} data-testid="comparison-view">
      <div className={embedded ? "space-y-6" : "max-w-7xl mx-auto space-y-8"}>
        {!embedded && (
        <div>
          <h1 className="text-3xl font-bold text-[#2d4a5e]" data-testid="text-page-title">
            Property Comparison
          </h1>
          <p className="text-gray-500 mt-1" data-testid="text-page-subtitle">
            Select 2–4 properties to compare assumptions side by side
          </p>
        </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg>
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Property Comparison</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Compare up to 4 properties side by side across key assumptions — room count, ADR, occupancy, purchase price, and more. 
                Best values are highlighted in green to quickly spot which properties have the strongest fundamentals. 
                Use this to evaluate acquisition targets or benchmark existing portfolio assets.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3" data-testid="text-selector-heading">
            Select Properties ({selectedIds.length}/4)
          </h2>
          <div className="flex flex-wrap gap-3">
            {properties.map((p) => {
              const checked = selectedIds.includes(p.id);
              const disabled = !checked && selectedIds.length >= 4;
              return (
                <label
                  key={p.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                    checked
                      ? "bg-[#2d4a5e]/10 border-[#2d4a5e]"
                      : disabled
                      ? "opacity-50 cursor-not-allowed border-gray-200"
                      : "border-gray-200 hover:border-[#2d4a5e]/40"
                  }`}
                  data-testid={`checkbox-property-${p.id}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleProperty(p.id)}
                    className="accent-[#2d4a5e] w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-800">{p.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        {selectedProperties.length >= 2 ? (
          <>
          <KPIGrid
            data-testid="kpi-comparison"
            items={[
              { label: "Properties Selected", value: selectedProperties.length, sublabel: "comparing side by side" },
              { label: "Avg Start ADR", value: selectedProperties.reduce((s, p) => s + p.startAdr, 0) / selectedProperties.length, format: (v: number) => fmtMoney(v) },
              { label: "Avg Occupancy", value: selectedProperties.reduce((s, p) => s + p.startOccupancy, 0) / selectedProperties.length * 100, format: (v: number) => `${v.toFixed(1)}%` },
              { label: "Total Rooms", value: selectedProperties.reduce((s, p) => s + p.roomCount, 0) },
            ]}
            columns={4}
            variant="glass"
          />
          <ScrollReveal>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-display text-gray-900 mb-4">Performance Comparison</h3>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={[
                  { metric: "ADR", ...Object.fromEntries(selectedProperties.map(p => [p.name, Math.min(p.startAdr / 5, 100)])) },
                  { metric: "Occupancy", ...Object.fromEntries(selectedProperties.map(p => [p.name, p.startOccupancy * 100])) },
                  { metric: "Rooms", ...Object.fromEntries(selectedProperties.map(p => [p.name, Math.min(p.roomCount, 100)])) },
                  { metric: "Growth", ...Object.fromEntries(selectedProperties.map(p => [p.name, p.adrGrowthRate * 100 * 10])) },
                  { metric: "Max Occ", ...Object.fromEntries(selectedProperties.map(p => [p.name, p.maxOccupancy * 100])) },
                ]}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  {selectedProperties.map((p, i) => (
                    <Radar key={p.id} name={p.name} dataKey={p.name} stroke={["#9FBCA4", "#257D41", "#3B82F6", "#F4795B"][i]} fill={["#9FBCA4", "#257D41", "#3B82F6", "#F4795B"][i]} fillOpacity={0.15} strokeWidth={2} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </ScrollReveal>
          <div className="grid gap-6 lg:grid-cols-2">
            <DonutChart
              data-testid="donut-comparison-rooms"
              data={selectedProperties.map(p => ({ name: p.name, value: p.roomCount }))}
              title="Room Distribution"
              subtitle="Room count by property"
              centerValue={String(selectedProperties.reduce((s, p) => s + p.roomCount, 0))}
              centerLabel="Total Rooms"
            />
            <DonutChart
              data-testid="donut-comparison-price"
              data={selectedProperties.map(p => ({ name: p.name, value: p.purchasePrice }))}
              title="Investment Distribution"
              subtitle="Purchase price by property"
              centerValue={fmtMoney(selectedProperties.reduce((s, p) => s + p.purchasePrice, 0))}
              centerLabel="Total Investment"
              formatValue={fmtMoney}
            />
          </div>
          <InsightPanel
            data-testid="insight-comparison"
            variant="compact"
            title="Comparison Findings"
            insights={(() => {
              const insights: Array<{text: string; metric?: string; type: "positive" | "negative" | "warning" | "neutral"}> = [];
              const adrs = selectedProperties.map(p => ({ name: p.name, v: p.startAdr }));
              const bestAdr = adrs.reduce((a, b) => a.v > b.v ? a : b);
              insights.push({ text: `Highest ADR: ${bestAdr.name}`, metric: fmtMoney(bestAdr.v), type: "positive" });
              const occs = selectedProperties.map(p => ({ name: p.name, v: p.maxOccupancy }));
              const bestOcc = occs.reduce((a, b) => a.v > b.v ? a : b);
              insights.push({ text: `Best Max Occupancy: ${bestOcc.name}`, metric: fmtPct(bestOcc.v), type: "positive" });
              const prices = selectedProperties.map(p => ({ name: p.name, v: p.purchasePrice }));
              const lowestPrice = prices.reduce((a, b) => a.v < b.v ? a : b);
              insights.push({ text: `Lowest Purchase Price: ${lowestPrice.name}`, metric: fmtMoney(lowestPrice.v), type: "positive" });
              return insights;
            })()}
          />
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-comparison">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 bg-gray-50 text-gray-600 font-semibold border-b min-w-[160px]">
                    Metric
                  </th>
                  {selectedProperties.map((p) => (
                    <th
                      key={p.id}
                      className="text-center px-4 py-3 border-b bg-gradient-to-r from-[#2d4a5e] to-[#3a5a5e] text-white font-semibold min-w-[150px]"
                      data-testid={`header-property-${p.id}`}
                    >
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((metric, idx) => {
                  const best = getBestValue(metric.key, metric.bestDir);
                  return (
                    <tr
                      key={metric.key}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"}
                      data-testid={`row-${metric.key}`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-700 border-r border-gray-100">
                        {metric.label}
                      </td>
                      {selectedProperties.map((p) => {
                        const raw = (p as any)[metric.key];
                        const isBest =
                          best !== null &&
                          typeof raw === "number" &&
                          raw === best;
                        return (
                          <td
                            key={p.id}
                            className={`px-4 py-3 text-center ${
                              isBest ? "bg-green-50 font-semibold text-green-800" : "text-gray-800"
                            }`}
                            data-testid={`cell-${metric.key}-${p.id}`}
                          >
                            {formatValue(raw, metric.format)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <p className="text-gray-400 text-lg" data-testid="text-empty-state">
              {selectedIds.length === 0
                ? "Select at least 2 properties above to begin comparing."
                : "Select one more property to start the comparison."}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) return content;
  return <AnimatedPage>{content}</AnimatedPage>;
}
