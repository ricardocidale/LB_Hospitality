/**
 * PropertyKPIs.tsx — Summary KPI cards for the property detail page.
 *
 * Renders a responsive grid of key performance indicators pulled from
 * the property's computed financial projections:
 *   - Revenue, GOP, NOI, Cash Flow for the first operating year
 *
 * Scans yearly data to skip pre-acquisition $0 years
 * and display meaningful metrics from the first year of operations.
 */
import { KPIGrid, formatCompact, type KPIItem } from "@/components/graphics";
import type { PropertyKPIsProps } from "./types";

export default function PropertyKPIs({ yearlyChartData, projectionYears }: PropertyKPIsProps) {
  const opsIdx = yearlyChartData.length > 0
    ? Math.max(0, yearlyChartData.findIndex(r => Number(r.Revenue) > 0))
    : -1;

  if (opsIdx === -1) return null;

  const d = yearlyChartData[opsIdx];
  const nextIdx = opsIdx + 1;
  const label = d.year != null ? String(d.year) : `Year ${opsIdx + 1}`;

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
      label: `${label} ANOI`,
      value: d.ANOI,
      format: formatCompact,
      trend: d.ANOI > 0 ? "up" : "down",
      sublabel: d.Revenue > 0 ? `${((d.ANOI / d.Revenue) * 100).toFixed(1)}% margin` : undefined,
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
