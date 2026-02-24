/**
 * VarianceAnalysis.tsx — Side-by-side property comparison table.
 *
 * Lets the user select two properties from the portfolio and compare key
 * financial and operational metrics:
 *   • Room Count, Purchase Price, ADR (Average Daily Rate)
 *   • Start Occupancy, Max Occupancy
 *   • Revenue per Available Room (RevPAR = ADR × Occupancy)
 *
 * Each metric shows the absolute values for both properties plus a
 * percentage variance. Favorable/unfavorable direction is color-coded
 * (green = favorable, red = unfavorable) based on whether "higher" or
 * "lower" is better for that metric.
 */
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) => (value * 100).toFixed(1) + "%";

const formatVariancePct = (a: number, b: number) =>
  a === 0 ? "N/A" : ((b - a) / a * 100).toFixed(1) + "%";

type MetricDef = {
  label: string;
  key: string;
  getValue: (p: any) => number;
  format: (v: number) => string;
  favorable: "higher" | "lower";
};

const metrics: MetricDef[] = [
  {
    label: "Room Count",
    key: "roomCount",
    getValue: (p) => p.roomCount,
    format: (v) => v.toString(),
    favorable: "higher",
  },
  {
    label: "Start ADR",
    key: "startAdr",
    getValue: (p) => p.startAdr,
    format: formatMoney,
    favorable: "higher",
  },
  {
    label: "ADR Growth",
    key: "adrGrowthRate",
    getValue: (p) => p.adrGrowthRate,
    format: formatPercent,
    favorable: "higher",
  },
  {
    label: "Start Occupancy",
    key: "startOccupancy",
    getValue: (p) => p.startOccupancy,
    format: formatPercent,
    favorable: "higher",
  },
  {
    label: "Max Occupancy",
    key: "maxOccupancy",
    getValue: (p) => p.maxOccupancy,
    format: formatPercent,
    favorable: "higher",
  },
  {
    label: "Purchase Price",
    key: "purchasePrice",
    getValue: (p) => p.purchasePrice,
    format: formatMoney,
    favorable: "lower",
  },
  {
    label: "Building Improvements",
    key: "buildingImprovements",
    getValue: (p) => p.buildingImprovements,
    format: formatMoney,
    favorable: "lower",
  },
  {
    label: "Total Investment",
    key: "totalInvestment",
    getValue: (p) =>
      p.purchasePrice +
      p.buildingImprovements +
      p.preOpeningCosts +
      p.operatingReserve,
    format: formatMoney,
    favorable: "lower",
  },
];

function getVarianceColor(
  a: number,
  b: number,
  favorable: "higher" | "lower"
): { text: string; bg: string } {
  if (a === 0) return { text: "text-muted-foreground", bg: "" };
  const pct = Math.abs((b - a) / a * 100);
  if (pct < 1) return { text: "text-muted-foreground", bg: "" };

  const diff = b - a;
  const isFavorable =
    favorable === "higher" ? diff > 0 : diff < 0;

  return isFavorable
    ? { text: "text-emerald-600", bg: "bg-emerald-50" }
    : { text: "text-red-600", bg: "bg-red-50" };
}

export default function VarianceAnalysis() {
  const properties = useStore((s) => s.properties);
  const [idA, setIdA] = useState(properties[0]?.id ?? "");
  const [idB, setIdB] = useState(properties[1]?.id ?? "");

  const propA = properties.find((p) => p.id === idA);
  const propB = properties.find((p) => p.id === idB);

  return (
    <div
      data-testid="variance-analysis"
      className="bg-white rounded-xl border shadow-sm p-6"
    >
      <h2 className="text-xl font-semibold mb-4">Variance Analysis</h2>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Scenario A</label>
          <Select value={idA || "none"} onValueChange={(v) => setIdA(v === "none" ? "" : v)}>
            <SelectTrigger data-testid="select-scenario-a"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select property</SelectItem>
              {properties.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Scenario B</label>
          <Select value={idB || "none"} onValueChange={(v) => setIdB(v === "none" ? "" : v)}>
            <SelectTrigger data-testid="select-scenario-b"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select property</SelectItem>
              {properties.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {propA && propB ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4 font-medium">Metric</th>
                <th className="py-2 px-4 font-medium">{propA.name}</th>
                <th className="py-2 px-4 font-medium">{propB.name}</th>
                <th className="py-2 px-4 font-medium">Variance</th>
                <th className="py-2 px-4 font-medium">Variance %</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, i) => {
                const a = m.getValue(propA);
                const b = m.getValue(propB);
                const variance = b - a;
                const color = getVarianceColor(a, b, m.favorable);

                return (
                  <tr
                    key={m.key}
                    data-testid={`variance-row-${m.key}`}
                    className={i % 2 === 0 ? "bg-amber-50/30" : ""}
                  >
                    <td className="py-2 pr-4 font-medium">{m.label}</td>
                    <td className="py-2 px-4">{m.format(a)}</td>
                    <td className="py-2 px-4">{m.format(b)}</td>
                    <td className={`py-2 px-4 ${color.text} ${color.bg} rounded`}>
                      {m.format === formatPercent
                        ? (variance * 100).toFixed(1) + "pp"
                        : m.format(variance)}
                    </td>
                    <td className={`py-2 px-4 ${color.text} ${color.bg} rounded`}>
                      {formatVariancePct(a, b)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Select two properties to compare.
        </p>
      )}
    </div>
  );
}
