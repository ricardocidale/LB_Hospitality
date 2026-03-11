import { format } from "date-fns";
import { drawLineChart } from "@/lib/exports/pdfChartDrawer";
import { exportPortfolioPPTX as originalExportPortfolioPPTX } from "@/lib/exports/pptxExport";
import { exportTablePNG } from "@/lib/exports/pngExport";
import { downloadCSV } from "@/lib/exports/csvExport";
import { buildFinancialTableConfig, addFooters, drawTitle, drawSubtitle } from "@/lib/exports/pdfHelpers";
import type { DashboardFinancials } from "./types";
import type { Property } from "@shared/schema";
import type { YearlyPropertyFinancials } from "@/lib/financial/yearlyAggregator";
import type { YearlyCashFlowResult } from "@/lib/financial/loanCalculations";

import type { MonthlyFinancials } from "@/lib/financialEngine";
import { propertyEquityInvested, acquisitionYearIndex } from "@/lib/financial/equityCalculations";

export interface ExportRow {
  category: string;
  values: number[];
  isHeader?: boolean;
  indent?: number;
  isBold?: boolean;
}

export interface ExportData {
  years: number[];
  rows: ExportRow[];
}

/** Convert internal ExportData to the shape expected by PPTX export. */
export function toExportData(data: ExportData): { years: string[]; rows: { category: string; values: number[]; indent?: number; isBold?: boolean }[] } {
  return {
    years: data.years.map(String),
    rows: data.rows.map(r => ({ category: r.category, values: r.values, indent: r.indent, isBold: r.isHeader })),
  };
}

export function generatePortfolioBalanceSheetData(
  allPropertyFinancials: { property: Property; financials: MonthlyFinancials[] }[],
  projectionYears: number,
  getFiscalYear: (i: number) => number,
  modelStartDate?: Date,
  summaryOnly?: boolean
): ExportData {
  const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));
  const rows: ExportRow[] = [];

  const getYearEndData = (yearIdx: number) => {
    let totalCash = 0;
    let totalPPE = 0;
    let totalAccDep = 0;
    let totalDeferredFinancing = 0;
    let totalDebt = 0;
    let totalEquity = 0;
    let totalRetainedEarnings = 0;

    allPropertyFinancials.forEach(({ property, financials }) => {
      const acqYear = acquisitionYearIndex(property.acquisitionDate, property.operationsStartDate, modelStartDate ? modelStartDate.toISOString().slice(0, 10) : "");
      if (yearIdx < acqYear) return;

      const monthsToInclude = (yearIdx + 1) * 12;
      const relevantMonths = financials.slice(0, monthsToInclude);
      const lastMonth = relevantMonths[relevantMonths.length - 1];

      if (!lastMonth) return;

      // Assets
      const ppe = property.purchasePrice + (property.buildingImprovements || 0);
      const accDep = relevantMonths.reduce((sum, m) => sum + m.depreciationExpense, 0);
      
      const operatingReserve = property.operatingReserve || 0;
      const cumulativeNOI = relevantMonths.reduce((sum, m) => sum + m.noi, 0);
      const cumulativeDebtService = relevantMonths.reduce((sum, m) => sum + m.interestExpense + m.principalPayment, 0);
      const cumulativeTax = relevantMonths.reduce((sum, m) => sum + m.incomeTax, 0);
      const cumulativeRefi = relevantMonths.reduce((sum, m) => sum + m.refinancingProceeds, 0);
      
      const cash = operatingReserve + (cumulativeNOI - cumulativeDebtService - cumulativeTax) + cumulativeRefi;
      
      let deferredFinancing = 0;
      for (let m = 0; m < relevantMonths.length; m++) {
        if (financials[m].refinancingProceeds > 0) {
          const debtBefore = m > 0 ? financials[m - 1].debtOutstanding : 0;
          const debtAfter = financials[m].debtOutstanding;
          const principalInRefiMonth = financials[m].principalPayment;
          const newLoanAmount = debtAfter + principalInRefiMonth;
          const refiClosingCosts = newLoanAmount - debtBefore - financials[m].refinancingProceeds;
          if (refiClosingCosts > 0) deferredFinancing += refiClosingCosts;
        }
      }

      totalPPE += ppe;
      totalAccDep += accDep;
      totalCash += cash;
      totalDeferredFinancing += deferredFinancing;
      totalDebt += lastMonth.debtOutstanding;
      totalEquity += propertyEquityInvested(property);
      
      const netIncome = relevantMonths.reduce((sum, m) => sum + m.netIncome, 0);
      const preOpening = property.preOpeningCosts || 0;
      totalRetainedEarnings += (netIncome - preOpening);
    });

    return {
      cash: totalCash,
      ppe: totalPPE,
      accDep: totalAccDep,
      deferredFinancing: totalDeferredFinancing,
      debt: totalDebt,
      equity: totalEquity,
      retainedEarnings: totalRetainedEarnings,
      totalAssets: totalPPE - totalAccDep + totalCash + totalDeferredFinancing,
      totalLiabilitiesEquity: totalDebt + totalEquity + totalRetainedEarnings
    };
  };

  const yearlyData = years.map((_, i) => getYearEndData(i));

  if (!summaryOnly) {
    rows.push({ category: "ASSETS", values: years.map(() => 0), isHeader: true });
    rows.push({ category: "Cash & Cash Equivalents", values: yearlyData.map(d => d.cash), indent: 1 });
    rows.push({ category: "Property, Plant & Equipment", values: yearlyData.map(d => d.ppe), indent: 1 });
    rows.push({ category: "Accumulated Depreciation", values: yearlyData.map(d => -d.accDep), indent: 1 });
    rows.push({ category: "Deferred Financing Costs", values: yearlyData.map(d => d.deferredFinancing), indent: 1 });
  }
  rows.push({ category: "TOTAL ASSETS", values: yearlyData.map(d => d.totalAssets), isHeader: true });

  if (!summaryOnly) {
    rows.push({ category: "LIABILITIES & EQUITY", values: years.map(() => 0), isHeader: true });
    rows.push({ category: "Mortgage Notes Payable", values: yearlyData.map(d => d.debt), indent: 1 });
    rows.push({ category: "Paid-In Capital", values: yearlyData.map(d => d.equity), indent: 1 });
    rows.push({ category: "Retained Earnings", values: yearlyData.map(d => d.retainedEarnings), indent: 1 });
  }
  rows.push({ category: "TOTAL LIABILITIES & EQUITY", values: yearlyData.map(d => d.totalLiabilitiesEquity), isHeader: true });

  return { years, rows };
}

export function generatePortfolioIncomeData(
  yearlyConsolidatedCache: YearlyPropertyFinancials[],
  projectionYears: number,
  getFiscalYear: (i: number) => number,
  summaryOnly?: boolean
): ExportData {
  const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));
  const c = (i: number) => yearlyConsolidatedCache[i];
  const rows: ExportRow[] = [];

  rows.push({ category: "Total Revenue", values: years.map((_, i) => c(i)?.revenueTotal ?? 0), isHeader: true });
  if (!summaryOnly) {
    rows.push({ category: "Room Revenue", values: years.map((_, i) => c(i)?.revenueRooms ?? 0), indent: 1 });
    rows.push({ category: "Event Revenue", values: years.map((_, i) => c(i)?.revenueEvents ?? 0), indent: 1 });
    rows.push({ category: "F&B Revenue", values: years.map((_, i) => c(i)?.revenueFB ?? 0), indent: 1 });
    rows.push({ category: "Other Revenue", values: years.map((_, i) => c(i)?.revenueOther ?? 0), indent: 1 });
  }

  rows.push({
    category: "Operating Expenses (Undistributed)",
    values: years.map((_, i) => {
      const data = c(i);
      if (!data) return 0;
      return data.expenseMarketing + data.expensePropertyOps + data.expenseUtilitiesVar +
        data.expenseAdmin + data.expenseIT + data.expenseUtilitiesFixed + data.expenseOtherCosts;
    }),
    isHeader: true,
  });
  if (!summaryOnly) {
    rows.push({ category: "Marketing", values: years.map((_, i) => c(i)?.expenseMarketing ?? 0), indent: 1 });
    rows.push({ category: "Property Ops", values: years.map((_, i) => c(i)?.expensePropertyOps ?? 0), indent: 1 });
    rows.push({ category: "Admin & General", values: years.map((_, i) => c(i)?.expenseAdmin ?? 0), indent: 1 });
    rows.push({ category: "IT", values: years.map((_, i) => c(i)?.expenseIT ?? 0), indent: 1 });
    rows.push({ category: "Utilities", values: years.map((_, i) => (c(i)?.expenseUtilitiesVar ?? 0) + (c(i)?.expenseUtilitiesFixed ?? 0)), indent: 1 });
    rows.push({ category: "Other Expenses", values: years.map((_, i) => (c(i)?.expenseOther ?? 0) + (c(i)?.expenseOtherCosts ?? 0)), indent: 1 });
  }

  rows.push({ category: "Gross Operating Profit", values: years.map((_, i) => c(i)?.gop ?? 0), isHeader: true });
  rows.push({ category: "Management Fees", values: years.map((_, i) => (c(i)?.feeBase ?? 0) + (c(i)?.feeIncentive ?? 0)), isHeader: true });
  if (!summaryOnly) {
    rows.push({ category: "Base Fee", values: years.map((_, i) => c(i)?.feeBase ?? 0), indent: 1 });
    rows.push({ category: "Incentive Fee", values: years.map((_, i) => c(i)?.feeIncentive ?? 0), indent: 1 });
  }
  rows.push({ category: "Adjusted GOP (AGOP)", values: years.map((_, i) => c(i)?.agop ?? 0), isHeader: true });

  rows.push({ category: "Fixed Charges", values: years.map((_, i) => (c(i)?.expenseInsurance ?? 0) + (c(i)?.expenseTaxes ?? 0)), isHeader: true });
  if (!summaryOnly) {
    rows.push({ category: "Insurance", values: years.map((_, i) => c(i)?.expenseInsurance ?? 0), indent: 1 });
    rows.push({ category: "Taxes", values: years.map((_, i) => c(i)?.expenseTaxes ?? 0), indent: 1 });
  }

  rows.push({ category: "Net Operating Income (NOI)", values: years.map((_, i) => c(i)?.noi ?? 0), isHeader: true });
  if (!summaryOnly) {
    rows.push({ category: "FF&E Reserve", values: years.map((_, i) => c(i)?.expenseFFE ?? 0), indent: 1 });
  }
  rows.push({ category: "Adjusted NOI (ANOI)", values: years.map((_, i) => c(i)?.anoi ?? 0), isHeader: true });

  if (!summaryOnly) {
    rows.push({ category: "Interest Expense", values: years.map((_, i) => c(i)?.interestExpense ?? 0), indent: 1 });
    rows.push({ category: "Depreciation", values: years.map((_, i) => c(i)?.depreciationExpense ?? 0), indent: 1 });
    rows.push({ category: "Income Tax", values: years.map((_, i) => c(i)?.incomeTax ?? 0), indent: 1 });
  }
  rows.push({ category: "GAAP Net Income", values: years.map((_, i) => c(i)?.netIncome ?? 0), isHeader: true });

  return { years, rows };
}

export function generatePortfolioCashFlowData(
  allPropertyYearlyCF: YearlyCashFlowResult[][],
  projectionYears: number,
  getFiscalYear: (i: number) => number,
  overrideExpanded?: Set<string>,
  excludeFormulas?: boolean,
  propertyNames?: string[]
): ExportData {
  const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));
  const rows: ExportRow[] = [];
  const expanded = overrideExpanded;

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

  rows.push({ category: "Cash Flow from Operations (CFO)", values: consolidatedCFO, isHeader: true });
  if (expanded?.has("cfo")) {
    if (!excludeFormulas) {
      rows.push({ category: "Formula: = ANOI − Debt Service (Principal + Interest)", values: consolidatedCFO, indent: 2 });
    }
    allPropertyYearlyCF.forEach((propCF, idx) => {
      const name = propertyNames?.[idx] ?? `Property ${idx + 1}`;
      rows.push({ category: name, values: years.map((_, y) => propCF[y]?.cashFromOperations ?? 0), indent: 1 });
    });
  }

  rows.push({ category: "Cash Flow from Investing (CFI)", values: consolidatedCFI, isHeader: true });
  if (expanded?.has("cfi")) {
    if (!excludeFormulas) {
      rows.push({ category: "Formula: = Capital Expenditures + Exit Proceeds (if final year)", values: consolidatedCFI, indent: 2 });
    }
    allPropertyYearlyCF.forEach((propCF, idx) => {
      const name = propertyNames?.[idx] ?? `Property ${idx + 1}`;
      rows.push({ category: name, values: years.map((_, y) => (propCF[y]?.capitalExpenditures ?? 0) + (propCF[y]?.exitValue ?? 0)), indent: 1 });
    });
  }

  rows.push({ category: "Cash Flow from Financing (CFF)", values: consolidatedCFF, isHeader: true });
  if (expanded?.has("cff")) {
    if (!excludeFormulas) {
      rows.push({ category: "Formula: = Refinancing Proceeds − Principal Payments", values: consolidatedCFF, indent: 2 });
    }
    allPropertyYearlyCF.forEach((propCF, idx) => {
      const name = propertyNames?.[idx] ?? `Property ${idx + 1}`;
      rows.push({ category: name, values: years.map((_, y) => (propCF[y]?.refinancingProceeds ?? 0) - (propCF[y]?.principalPayment ?? 0)), indent: 1 });
    });
  }

  rows.push({ category: "Net Change in Cash", values: netChange, isHeader: true, isBold: true });

  return { years, rows };
}

export function generatePortfolioInvestmentData(
  financials: DashboardFinancials,
  properties: Property[],
  projectionYears: number,
  getFiscalYear: (i: number) => number
): ExportData {
  const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));
  const rows: ExportRow[] = [];

  rows.push({ category: "Portfolio Metrics", values: years.map(() => 0), isHeader: true });
  rows.push({ category: "Total Initial Equity", values: years.map(() => financials.totalInitialEquity), indent: 1 });
  rows.push({ category: "Total Exit Value", values: years.map(() => financials.totalExitValue), indent: 1 });
  rows.push({ category: "Portfolio IRR", values: years.map(() => financials.portfolioIRR * 100), indent: 1 });
  rows.push({ category: "Equity Multiple", values: years.map(() => financials.equityMultiple), indent: 1 });
  rows.push({ category: "Cash-on-Cash Return", values: years.map(() => financials.cashOnCash * 100), indent: 1 });

  return { years, rows };
}

export async function exportPortfolioExcel(
  years: number[],
  incomeRows: ExportRow[],
  cashFlowRows: ExportRow[]
): Promise<void> {
  const XLSX = await import("xlsx");
  const wb = (XLSX as any).utils.book_new();

  const incomeWsData = [
    ["Income Statement", ...years.map(String)],
    ...incomeRows.map(row => [
      (row.indent ? "  ".repeat(row.indent) : "") + row.category,
      ...row.values,
    ]),
  ];
  const incomeWs = (XLSX as any).utils.aoa_to_sheet(incomeWsData);
  incomeWs["!cols"] = [{ wch: 38 }, ...years.map(() => ({ wch: 16 }))];
  await applyPortfolioExcelFormat(incomeWs, incomeWsData);
  (XLSX as any).utils.book_append_sheet(wb, incomeWs, "Income Statement");

  const cfWsData = [
    ["Cash Flow", ...years.map(String)],
    ...cashFlowRows.map(row => [
      (row.indent ? "  ".repeat(row.indent) : "") + row.category,
      ...row.values,
    ]),
  ];
  const cfWs = (XLSX as any).utils.aoa_to_sheet(cfWsData);
  cfWs["!cols"] = [{ wch: 38 }, ...years.map(() => ({ wch: 16 }))];
  await applyPortfolioExcelFormat(cfWs, cfWsData);
  (XLSX as any).utils.book_append_sheet(wb, cfWs, "Cash Flow");

  (XLSX as any).writeFile(wb, "Portfolio - Financial Statements.xlsx");
}

async function applyPortfolioExcelFormat(ws: any, rows: (string | number)[][]): Promise<void> {
  const XLSX = await import("xlsx");
  const currencyFormat = "#,##0";
  for (let r = 0; r < rows.length; r++) {
    for (let c = 1; c < rows[r].length; c++) {
      const cellRef = (XLSX as any).utils.encode_cell({ r, c });
      const cell = ws[cellRef];
      if (cell && typeof cell.v === "number") {
        cell.z = currencyFormat;
      }
    }
    const label = String(rows[r][0] || "").trim();
    const isSection = !label.startsWith(" ") && label.length > 2;
    if (isSection) {
      for (let c = 0; c < rows[r].length; c++) {
        const cellRef = (XLSX as any).utils.encode_cell({ r, c });
        const cell = ws[cellRef];
        if (cell) {
          if (!cell.s) cell.s = {};
          cell.s.font = { bold: true };
        }
      }
    }
  }
}

export function exportPortfolioCSV(
  years: number[],
  rows: ExportRow[],
  filename: string
): void {
  const headers = ["Category", ...years.map(String)];
  const csvContent = [
    headers.join(","),
    ...rows.map(row => [
      `"${(row.indent ? "  ".repeat(row.indent) : "") + row.category}"`,
      ...row.values.map((v: number) => v.toFixed(2)),
    ].join(",")),
  ].join("\n");
  downloadCSV(csvContent, filename);
}

export async function exportPortfolioPDF(
  orientation: "landscape" | "portrait",
  projectionYears: number,
  years: number[],
  rows: ExportRow[],
  getYearlyConsolidated: (i: number) => YearlyPropertyFinancials,
  title: string,
  companyName = "Hospitality Business Group"
): Promise<void> {
  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });

  drawTitle(doc, `${companyName} \u2014 ${title}`, 14, 15);
  drawSubtitle(doc, `${projectionYears}-Year Projection (${years[0]} \u2013 ${years[projectionYears - 1]})`, 14, 22);
  drawSubtitle(doc, `Generated: ${format(new Date(), "MMM d, yyyy")}`, 14, 27);

  const tableConfig = buildFinancialTableConfig(years, rows, orientation, 32);
  autoTable(doc, tableConfig);

  doc.addPage();
  drawTitle(doc, "Performance Chart", 14, 15, { fontSize: 16 });
  drawSubtitle(doc, `${projectionYears}-Year Revenue, Operating Expenses, and Adjusted NOI Trend`, 14, 22);

  const chartData = years.map((year, i) => ({
    label: String(year),
    value: getYearlyConsolidated(i)?.revenueTotal ?? 0,
  }));
  const noiData = years.map((year, i) => ({
    label: String(year),
    value: getYearlyConsolidated(i)?.noi ?? 0,
  }));
  const expenseData = years.map((year, i) => ({
    label: String(year),
    value: getYearlyConsolidated(i)?.totalExpenses ?? 0,
  }));

  drawLineChart({
    doc,
    x: 14,
    y: 30,
    width: orientation === "landscape" ? 269 : 183,
    height: orientation === "landscape" ? 150 : 200,
    title: `Portfolio Performance (${projectionYears}-Year Projection)`,
    series: [
      { name: "Revenue", data: chartData, color: "#7C3AED" },
      { name: "Operating Expenses", data: expenseData, color: "#2563EB" },
      { name: "ANOI", data: noiData, color: "#257D41" },
    ],
  });

  addFooters(doc, companyName);
  doc.save(`portfolio-${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

export const dashboardExports = {
  generatePortfolioIncomeData,

  exportToPDF: async ({
    propertyName,
    projectionYears,
    years,
    rows,
    getYearlyConsolidated,
    title = "Portfolio Income Statement"
  }: {
    propertyName: string;
    projectionYears: number;
    years: number[];
    rows: ExportRow[];
    getYearlyConsolidated: (i: number) => any;
    title?: string;
  }) => {
    await exportPortfolioPDF("landscape", projectionYears, years, rows, getYearlyConsolidated, title);
  },

  exportToCSV: (years: number[], rows: ExportRow[], filename = "portfolio-income-statement.csv") => {
    exportPortfolioCSV(years, rows, filename);
  },

  exportToExcel: async (years: number[], rows: ExportRow[], filename = "portfolio-income-statement.xlsx", sheetName = "Income Statement") => {
    const XLSX = await import("xlsx");
    const wb = (XLSX as any).utils.book_new();
    const wsData = [
      ["Category", ...years.map(String)],
      ...rows.map(row => [row.category, ...row.values]),
    ];
    const ws = (XLSX as any).utils.aoa_to_sheet(wsData);
    (XLSX as any).utils.book_append_sheet(wb, ws, sheetName);
    (XLSX as any).writeFile(wb, filename);
  },

  exportToPPTX: async (data: any) => {
    await originalExportPortfolioPPTX(data);
  },

  exportToPNG: (ref: React.RefObject<HTMLElement>, filename = "portfolio-income-statement.png") => {
    if (ref.current) {
      exportTablePNG({ element: ref.current, filename });
    }
  },
};
