/**
 * HeatMap.tsx — Color-coded matrix chart for multi-period metric comparison.
 *
 * Renders a grid where rows are categories (e.g. properties or line items)
 * and columns are time periods (months or years). Cell background color
 * intensity maps to the metric value within the min-max range:
 *   • Red   — below 40th percentile (underperforming)
 *   • Amber — 40th-60th percentile (neutral)
 *   • Green — above 60th percentile (strong performance)
 *
 * Useful for spotting occupancy trends, revenue patterns, or expense
 * outliers at a glance across the portfolio.
 */
import { useMemo } from "react";

interface HeatMapProps {
  data: { label: string; periods: number[] }[];
  periodLabels: string[];
  metric: string;
  formatValue: (v: number) => string;
  title?: string;
}

function getCellColor(value: number, min: number, max: number): { bg: string; text: string } {
  if (max === min) {
    return { bg: "rgba(234, 179, 8, 0.3)", text: "#1a1a1a" };
  }

  const ratio = (value - min) / (max - min);

  if (ratio < 0.4) {
    const opacity = 0.2 + (1 - ratio / 0.4) * 0.6;
    return {
      bg: `rgba(239, 68, 68, ${opacity})`,
      text: opacity > 0.5 ? "#ffffff" : "#1a1a1a",
    };
  } else if (ratio < 0.6) {
    return {
      bg: "rgba(234, 179, 8, 0.3)",
      text: "#1a1a1a",
    };
  } else {
    const opacity = 0.2 + ((ratio - 0.6) / 0.4) * 0.6;
    return {
      bg: `rgba(16, 185, 129, ${opacity})`,
      text: opacity > 0.5 ? "#ffffff" : "#1a1a1a",
    };
  }
}

export default function HeatMap({ data, periodLabels, metric, formatValue, title }: HeatMapProps) {
  const { min, max } = useMemo(() => {
    const allValues = data.flatMap((row) => row.periods);
    if (allValues.length === 0) return { min: 0, max: 0 };
    return {
      min: Math.min(...allValues),
      max: Math.max(...allValues),
    };
  }, [data]);

  const colCount = periodLabels.length + 1;

  return (
    <div
      data-testid="heat-map"
      className="bg-white rounded-xl border border-border shadow-sm p-6"
    >
      {title && (
        <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      )}

      <div
        className="overflow-x-auto"
        style={{
          display: "grid",
          gridTemplateColumns: `minmax(120px, auto) repeat(${periodLabels.length}, minmax(80px, 1fr))`,
          gap: "4px",
        }}
      >
        <div />
        {periodLabels.map((label) => (
          <div
            key={label}
            className="text-xs font-medium text-muted-foreground text-center py-2"
          >
            {label}
          </div>
        ))}

        {data.map((row) => (
          <>
            <div
              key={`label-${row.label}`}
              className="text-sm font-medium text-foreground flex items-center sticky left-0 bg-white pr-2 z-10"
            >
              {row.label}
            </div>
            {row.periods.map((value, colIdx) => {
              const { bg, text } = getCellColor(value, min, max);
              const formatted = formatValue(value);
              return (
                <div
                  key={`${row.label}-${colIdx}`}
                  className="rounded-lg flex items-center justify-center text-xs font-medium py-3 px-2 cursor-default transition-opacity hover:opacity-80"
                  style={{ backgroundColor: bg, color: text }}
                  title={`${row.label} — ${periodLabels[colIdx]}: ${formatted}`}
                  data-testid={`cell-${row.label}-${colIdx}`}
                >
                  {formatted}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
