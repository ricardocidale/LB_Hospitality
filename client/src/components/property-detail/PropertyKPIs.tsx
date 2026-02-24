import { KPIGrid, formatCompact, type KPIItem } from "@/components/graphics";
import type { PropertyKPIsProps } from "./types";

export default function PropertyKPIs({ yearlyChartData, projectionYears }: PropertyKPIsProps) {
  const kpiItems: KPIItem[] = yearlyChartData.length > 0 ? [
    {
      label: "Year 1 Revenue",
      value: yearlyChartData[0].Revenue,
      format: formatCompact,
      trend: yearlyChartData.length > 1 && yearlyChartData[1].Revenue > yearlyChartData[0].Revenue ? "up" : "neutral",
      sublabel: `${projectionYears}-year projection`,
    },
    {
      label: "Year 1 GOP",
      value: yearlyChartData[0].GOP,
      format: formatCompact,
      trend: yearlyChartData[0].GOP > 0 ? "up" : "down",
      sublabel: yearlyChartData[0].Revenue > 0 ? `${((yearlyChartData[0].GOP / yearlyChartData[0].Revenue) * 100).toFixed(1)}% margin` : undefined,
    },
    {
      label: "Year 1 NOI",
      value: yearlyChartData[0].NOI,
      format: formatCompact,
      trend: yearlyChartData[0].NOI > 0 ? "up" : "down",
      sublabel: yearlyChartData[0].Revenue > 0 ? `${((yearlyChartData[0].NOI / yearlyChartData[0].Revenue) * 100).toFixed(1)}% margin` : undefined,
    },
    {
      label: "Year 1 Cash Flow",
      value: yearlyChartData[0].CashFlow,
      format: formatCompact,
      trend: yearlyChartData[0].CashFlow > 0 ? "up" : "down",
      sublabel: "After debt service",
    },
  ] : [];

  if (kpiItems.length === 0) return null;

  return (
    <KPIGrid
      data-testid="kpi-property-detail"
      items={kpiItems}
      columns={4}
      variant="glass"
    />
  );
}
