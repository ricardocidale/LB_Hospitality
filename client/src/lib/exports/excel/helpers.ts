import * as XLSX from "xlsx";
import { getFiscalYearForModelYear } from "../../financialEngine";
import { aggregatePropertyByYear } from "../../financial/yearlyAggregator";
import { YearlyAggregation } from "./types";

/** Trigger a browser download of the given Excel workbook. */
export function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename);
}

/** Set Excel column widths (in character units) so labels and numbers aren't truncated. */
export function setColumnWidths(ws: XLSX.WorkSheet, widths: number[]) {
  ws["!cols"] = widths.map((w) => ({ wch: w }));
}

/**
 * Apply Excel number formats to numeric cells based on their row label.
 * - Occupancy rows get a percentage format (e.g. 85.0%)
 * - ADR / RevPAR rows get a decimal currency format ($250.00)
 * - Everything else gets a whole-dollar currency format ($1,234)
 */
export function applyCurrencyFormat(ws: XLSX.WorkSheet, rows: (string | number)[][]): void {
  const currencyFormat = '#,##0';
  const decimalFormat = '#,##0.00';

  for (let r = 0; r < rows.length; r++) {
    for (let c = 1; c < rows[r].length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const cell = ws[cellRef];
      if (!cell || typeof cell.v !== 'number') continue;

      const label = String(rows[r][0] || '').trim().toLowerCase();

      if (label.includes('occupancy %')) {
        cell.z = '0.0"%"';
      } else if (label.includes('adr') || label.includes('revpar')) {
        cell.z = decimalFormat;
      } else {
        cell.z = currencyFormat;
      }
    }
  }
}

/**
 * Bold section headers (ALL-CAPS labels) and total/summary rows so they
 * visually stand out in the exported spreadsheet.
 */
export function applyHeaderStyle(ws: XLSX.WorkSheet, rows: (string | number)[][]): void {
  for (let r = 0; r < rows.length; r++) {
    const label = String(rows[r][0] || '').trim();
    if (!label) continue;

    const isSection = label === label.toUpperCase() && label.length > 2 && !label.startsWith(' ');
    const isTotalRow = label.toLowerCase().startsWith('total') ||
      label.toLowerCase().includes('gaap net') ||
      label.toLowerCase().includes('adjusted noi') ||
      label.toLowerCase().includes('gross operating') ||
      label.toLowerCase().includes('net cash flow') ||
      label.toLowerCase().includes('closing cash') ||
      label.toLowerCase().includes('net income') ||
      label.toLowerCase().includes('free cash flow');

    if (isSection || isTotalRow) {
      for (let c = 0; c < rows[r].length; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        const cell = ws[cellRef];
        if (cell) {
          if (!cell.s) cell.s = {};
          cell.s.font = { bold: true };
        }
      }
    }
  }
}

/**
 * Roll up monthly pro-forma data into fiscal-year buckets and attach a
 * human-readable fiscal-year label to each bucket (e.g. "2027").
 */
export function aggregateByYear(
  data: any[],
  years: number,
  modelStartDate: string,
  fiscalYearStartMonth: number
): YearlyAggregation[] {
  return aggregatePropertyByYear(data, years).map((y) => ({
    ...y,
    label: String(getFiscalYearForModelYear(modelStartDate, fiscalYearStartMonth, y.year)),
  }));
}
