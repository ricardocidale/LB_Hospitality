/**
 * exports/index.ts — Barrel file for the export system
 *
 * Re-exports all export functions so the rest of the app can import from a
 * single path: `@/lib/exports`. Covers Excel (.xlsx), PowerPoint (.pptx),
 * PDF, PNG screenshot, and CSV export formats.
 */
export {
  exportPropertyIncomeStatement,
  exportPropertyCashFlow,
  exportPropertyBalanceSheet,
  exportCompanyIncomeStatement,
  exportCompanyCashFlow,
  exportCompanyBalanceSheet,
  exportFullPropertyWorkbook,
} from "./excelExport";

export { drawLineChart } from "./pdfChartDrawer";

export {
  exportTablePNG,
  exportChartPNG,
  captureChartAsImage,
} from "./pngExport";

export { downloadCSV } from "./csvExport";

export {
  exportPortfolioPPTX,
  exportPropertyPPTX,
  exportCompanyPPTX,
} from "./pptxExport";
export type {
  PortfolioExportData,
  PropertyExportData,
  CompanyExportData,
} from "./pptxExport";
