/**
 * Consolidated Cash Flow Statement Aggregator — single source of truth.
 *
 * Three-section GAAP indirect method:
 * CFO (Cash Flow from Operations) → CFI (Cash Flow from Investing) →
 * CFF (Cash Flow from Financing) → Net Change in Cash
 * Plus: Free Cash Flow reconciliation (always visible)
 *
 * Used by: CashFlowTab (screen), dashboardExports (export), premium pipeline (PDF/PPTX/DOCX)
 */
import type { StatementData, StatementRow, ChartSeries } from "./types";
import { headerRow, childRow, grandchildRow, separatorRow } from "./helpers";
import type { YearlyCashFlowResult } from "@/lib/financial/loanCalculations";

export function aggregatePortfolioCashFlow(
  allPropertyYearlyCF: YearlyCashFlowResult[][],
  projectionYears: number,
  getFiscalYear: (i: number) => number,
  propertyNames?: string[]
): StatementData {
  const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));
  const rows: StatementRow[] = [];

  // ── Consolidated totals per year
  const consolidatedCFO = years.map((_, y) =>
    allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.cashFromOperations ?? 0), 0)
  );
  const consolidatedCFI = years.map((_, y) =>
    allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.capitalExpenditures ?? 0) + (prop[y]?.exitValue ?? 0), 0)
  );
  const consolidatedCFF = years.map((_, y) =>
    allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.refinancingProceeds ?? 0) - (prop[y]?.principalPayment ?? 0), 0)
  );
  const netChange = years.map((_, y) => consolidatedCFO[y] + consolidatedCFI[y] + consolidatedCFF[y]);

  // ── CFO
  rows.push(headerRow("Cash Flow from Operations (CFO)", consolidatedCFO));
  allPropertyYearlyCF.forEach((propCF, idx) => {
    const name = propertyNames?.[idx] ?? `Property ${idx + 1}`;
    rows.push(childRow(name, years.map((_, y) => propCF[y]?.cashFromOperations ?? 0)));
  });

  // ── CFI
  rows.push(headerRow("Cash Flow from Investing (CFI)", consolidatedCFI));
  allPropertyYearlyCF.forEach((propCF, idx) => {
    const name = propertyNames?.[idx] ?? `Property ${idx + 1}`;
    rows.push(childRow(name, years.map((_, y) => (propCF[y]?.capitalExpenditures ?? 0) + (propCF[y]?.exitValue ?? 0))));
  });

  // ── CFF
  rows.push(headerRow("Cash Flow from Financing (CFF)", consolidatedCFF));
  allPropertyYearlyCF.forEach((propCF, idx) => {
    const name = propertyNames?.[idx] ?? `Property ${idx + 1}`;
    rows.push(childRow(name, years.map((_, y) => (propCF[y]?.refinancingProceeds ?? 0) - (propCF[y]?.principalPayment ?? 0))));
  });

  // ── Net Change in Cash (bold total)
  rows.push(headerRow("Net Change in Cash", netChange, { isBold: true }));

  // ── Free Cash Flow section (always visible — NOT chevron children)
  const consolidatedMaintenanceCapex = years.map((_, y) =>
    allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.maintenanceCapex ?? 0), 0)
  );
  const consolidatedFCF = years.map((_, y) => consolidatedCFO[y] - consolidatedMaintenanceCapex[y]);
  const consolidatedPrincipal = years.map((_, y) =>
    allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.principalPayment ?? 0), 0)
  );
  const consolidatedFCFE = years.map((_, y) => consolidatedFCF[y] - consolidatedPrincipal[y]);

  rows.push(separatorRow(projectionYears));
  rows.push(headerRow("Free Cash Flow", years.map(() => 0)));
  rows.push(childRow("Net Cash from Operating Activities", consolidatedCFO));
  rows.push(childRow("Less: Capital Expenditures (FF&E)", consolidatedMaintenanceCapex.map(v => -v)));
  rows.push(childRow("Free Cash Flow (FCF)", consolidatedFCF, { isBold: true }));
  rows.push(childRow("Less: Principal Payments", consolidatedPrincipal.map(v => -v)));
  rows.push(childRow("Free Cash Flow to Equity (FCFE)", consolidatedFCFE, { isBold: true }));

  // ── Chart series
  const consolidatedNOI = years.map((_, y) =>
    allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.noi ?? 0), 0)
  );
  const consolidatedANOI = years.map((_, y) =>
    allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.anoi ?? 0), 0)
  );
  const consolidatedCashFlow = years.map((_, y) =>
    allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.cashFromOperations ?? 0), 0)
  );

  const chartSeries: ChartSeries[] = [
    { label: "NOI", values: consolidatedNOI, color: "#F59E0B" },
    { label: "ANOI", values: consolidatedANOI, color: "#6B7280" },
    { label: "Cash Flow", values: consolidatedCashFlow, color: "#8B5CF6" },
    { label: "FCFE", values: consolidatedFCFE, color: "#6B7280" },
  ];

  return {
    title: "Consolidated Cash Flow Statement",
    years,
    rows,
    chartSeries,
  };
}
