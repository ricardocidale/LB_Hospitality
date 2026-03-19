/**
 * Shared types for the unified statement aggregator layer.
 */

export interface StatementRow {
  category: string;
  values: number[];
  indent: number;
  isHeader: boolean;
  isBold: boolean;
  isFormula: boolean;
  isChevronChild: boolean;
  format?: "currency" | "percentage" | "multiplier" | "number" | "ratio";
}

export interface ChartSeries {
  label: string;
  values: number[];
  color: string;
}

export interface StatementData {
  title: string;
  years: number[];
  rows: StatementRow[];
  chartSeries: ChartSeries[];
}
