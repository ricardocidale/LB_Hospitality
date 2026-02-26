/**
 * firstOperatingYear.ts — Helper to find the first year a property is operating.
 *
 * Properties may be acquired mid-model, so their early projection years
 * have zero revenue. This helper scans yearly data arrays to find the
 * first index where revenue is positive, so KPIs and summaries can show
 * meaningful values instead of $0.
 *
 * Works with any array of objects that has a numeric revenue field,
 * making it reusable across PropertyKPIs, PropertyDetail exports,
 * Dashboard consolidation, and Company pages.
 */

export interface FirstOpsResult<T> {
  index: number;
  data: T;
  year: string | number | undefined;
}

export function findFirstOperatingYear<T>(
  rows: T[],
  revenueKey: keyof T & string = "Revenue" as keyof T & string,
  yearKey: keyof T & string = "year" as keyof T & string,
): FirstOpsResult<T> | null {
  if (rows.length === 0) return null;
  const idx = rows.findIndex(r => Number(r[revenueKey]) > 0);
  const opsIdx = idx >= 0 ? idx : 0;
  const data = rows[opsIdx];
  return {
    index: opsIdx,
    data,
    year: (data as Record<string, unknown>)[yearKey] as string | number | undefined,
  };
}

export function findFirstOperatingYearIndex<T>(
  rows: T[],
  revenueKey: keyof T & string = "Revenue" as keyof T & string,
): number {
  if (rows.length === 0) return 0;
  const idx = rows.findIndex(r => Number(r[revenueKey]) > 0);
  return idx >= 0 ? idx : 0;
}
