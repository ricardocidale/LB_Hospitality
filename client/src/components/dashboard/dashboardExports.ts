export type { ExportRow, ExportData } from "./statementBuilders";
export {
  toExportData,
  BS_TOTAL_ASSETS,
  BS_MORTGAGE_NOTES,
  BS_PAID_IN_CAPITAL,
  BS_RETAINED_EARNINGS,
  BS_TOTAL_LIABILITIES_EQUITY,
  generatePortfolioBalanceSheetData,
  generatePortfolioIncomeData,
  generatePortfolioCashFlowData,
  generatePortfolioInvestmentData,
  buildAllPortfolioStatements,
} from "./statementBuilders";

export {
  exportPortfolioExcel,
  exportPortfolioCSV,
  exportPortfolioPDF,
  exportDashboardComprehensivePDF,
  exportPortfolioPPTX,
  exportTablePNG,
} from "./exportRenderers";
export type { ComprehensiveDashboardExportParams } from "./exportRenderers";

import { exportPortfolioPDF, exportPortfolioCSV, exportTablePNG, exportPortfolioPPTX } from "./exportRenderers";
import type { ExportRow } from "./statementBuilders";
import { generatePortfolioIncomeData } from "./statementBuilders";

export const dashboardExports = {
  generatePortfolioIncomeData,

  exportToPDF: async ({
    propertyName,
    projectionYears,
    years,
    rows,
    getYearlyConsolidated,
    title = "Portfolio Income Statement",
    customFilename,
  }: {
    propertyName: string;
    projectionYears: number;
    years: number[];
    rows: ExportRow[];
    getYearlyConsolidated: (i: number) => any;
    title?: string;
    customFilename?: string;
  }) => {
    await exportPortfolioPDF("landscape", projectionYears, years, rows, getYearlyConsolidated, title, undefined, customFilename);
  },

  exportToCSV: (years: number[], rows: ExportRow[], filename = "portfolio-income-statement.csv") => {
    exportPortfolioCSV(years, rows, filename);
  },

  exportToExcel: async (_years: number[], _rows: ExportRow[], _filename = "portfolio-income-statement.xlsx", _sheetName = "Income Statement") => {
    console.warn("dashboardExports.exportToExcel is deprecated. Use exportPortfolioExcel instead.");
  },

  exportToPPTX: async (data: any, companyName?: string, customFilename?: string) => {
    await exportPortfolioPPTX(data, companyName, customFilename);
  },

  exportToPNG: (ref: React.RefObject<HTMLElement>, filename = "portfolio-income-statement.png") => {
    if (ref.current) {
      exportTablePNG({ element: ref.current, filename });
    }
  },
};
