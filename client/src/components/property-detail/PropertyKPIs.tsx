/**
 * PropertyKPIs.tsx — Summary KPI cards for the property detail page.
 *
 * Renders a responsive grid of key performance indicators pulled from
 * the property's computed financial projections:
 *   - Revenue, GOP, NOI, Cash Flow for the first operating year
 *
 * Uses findFirstOperatingYear() to skip pre-acquisition $0 years
 * and display meaningful metrics from the first year of operations.
 */
import { KPIGrid, formatCompact, type KPIItem } from "@/components/graphics";
import type { PropertyKPIsProps } from "./types";
import { findFirstOperatingYear } from "@/lib/firstOperatingYear";

export default function PropertyKPIs({ yearlyChartData, projectionYears }: PropertyKPIsProps) {
  const result = findFirstOperatingYear(yearlyChartData);
  if (!result) return null;

  const { index: opsIdx, data: d, year: yearLabel } = result;
  const nextIdx = opsIdx + 1;
  const label = yearLabel != null ? String(yearLabel) : "Year 1";

  const kpiItems: KPIItem[] = [
    {
      label: `${label} Revenue`,
      value: d.Revenue,
      format: formatCompact,
      trend: nextIdx < yearlyChartData.length && yearlyChartData[nextIdx].Revenue > d.Revenue ? "up" : "neutral",
      sublabel: `${projectionYears}-year projection`,
    },
    {
      label: `${label} GOP`,
      value: d.GOP,
      format: formatCompact,
      trend: d.GOP > 0 ? "up" : "down",
      sublabel: d.Revenue > 0 ? `${((d.GOP / d.Revenue) * 100).toFixed(1)}% margin` : undefined,
    },
    {
      label: `${label} NOI`,
      value: d.NOI,
      format: formatCompact,
      trend: d.NOI > 0 ? "up" : "down",
      sublabel: d.Revenue > 0 ? `${((d.NOI / d.Revenue) * 100).toFixed(1)}% margin` : undefined,
    },
    {
      label: `${label} Cash Flow`,
      value: d.CashFlow,
      format: formatCompact,
      trend: d.CashFlow > 0 ? "up" : "down",
      sublabel: "After debt service",
    },
  ];

  return (
    <KPIGrid
      data-testid="kpi-property-detail"
      items={kpiItems}
      columns={4}
      variant="glass"
    />
  );
}
