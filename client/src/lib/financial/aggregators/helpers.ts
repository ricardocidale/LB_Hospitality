/**
 * Shared helpers for consuming StatementData across screen, export, and premium pipeline.
 */
import type { StatementRow, StatementData, ChartSeries } from "./types";

export function filterByVisibility(rows: StatementRow[], mode: "short" | "extended"): StatementRow[] {
  if (mode === "extended") return rows.filter(r => !r.isFormula);
  return rows.filter(r => !r.isFormula && !r.isChevronChild);
}

export function toExportData(stmt: StatementData, mode: "short" | "extended" = "extended"): {
  years: number[];
  rows: Array<{
    category: string;
    values: number[];
    indent?: number;
    isHeader?: boolean;
    isBold?: boolean;
    isItalic?: boolean;
    format?: string;
  }>;
} {
  const filtered = filterByVisibility(stmt.rows, mode);
  return {
    years: stmt.years,
    rows: filtered.map(r => ({
      category: r.category,
      values: r.values,
      indent: r.indent,
      isHeader: r.isHeader,
      isBold: r.isBold || r.isHeader,
      isItalic: r.isFormula,
      format: r.format,
    })),
  };
}

export function toPremiumStatement(stmt: StatementData, mode: "short" | "extended"): {
  title: string;
  years: string[];
  rows: Array<{
    category: string;
    values: number[];
    indent?: number;
    isBold?: boolean;
    isHeader?: boolean;
    isItalic?: boolean;
  }>;
} {
  const filtered = filterByVisibility(stmt.rows, mode);
  return {
    title: stmt.title,
    years: stmt.years.map(String),
    rows: filtered.map(r => ({
      category: r.category,
      values: r.values,
      indent: r.indent,
      isBold: r.isBold || r.isHeader,
      isHeader: r.isHeader,
      isItalic: r.isFormula,
    })),
  };
}

export function row(
  category: string,
  values: number[],
  opts: Partial<Omit<StatementRow, "category" | "values">> = {}
): StatementRow {
  return {
    category,
    values,
    indent: opts.indent ?? 0,
    isHeader: opts.isHeader ?? false,
    isBold: opts.isBold ?? false,
    isFormula: opts.isFormula ?? false,
    isChevronChild: opts.isChevronChild ?? false,
    format: opts.format,
  };
}

export function headerRow(category: string, values: number[], opts: Partial<StatementRow> = {}): StatementRow {
  return row(category, values, { isHeader: true, isBold: true, ...opts });
}

export function childRow(category: string, values: number[], opts: Partial<StatementRow> = {}): StatementRow {
  return row(category, values, { indent: 1, isChevronChild: true, ...opts });
}

export function grandchildRow(category: string, values: number[], opts: Partial<StatementRow> = {}): StatementRow {
  return row(category, values, { indent: 2, isChevronChild: true, ...opts });
}

export function separatorRow(yearCount: number): StatementRow {
  return row("", Array(yearCount).fill(0), { isChevronChild: false });
}
