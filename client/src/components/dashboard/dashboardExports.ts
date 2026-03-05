import { formatMoney } from "@/lib/financialEngine";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { drawLineChart } from "@/lib/pdfChartDrawer";
import * as XLSX from "xlsx";
import { exportPortfolioPPTX as originalExportPortfolioPPTX } from "@/lib/exports/pptxExport";
import { exportTablePNG } from "@/lib/exports/pngExport";
import { downloadCSV } from "@/lib/exports/csvExport";
import type { DashboardFinancials } from "./types";
import type { Property } from "@shared/schema";
import type { YearlyPropertyFinancials } from "@/lib/yearlyAggregator";
import type { YearlyCashFlowResult } from "@/lib/loanCalculations";

import type { MonthlyFinancials } from "@/lib/financialEngine";
import { propertyEquityInvested, acquisitionYearIndex } from "@/lib/equityCalculations";

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

export function generatePortfolioBalanceSheetData(
  allPropertyFinancials: { property: Property; financials: MonthlyFinancials[] }[],
  projectionYears: number,
  getFiscalYear: (i: number) => number,
  modelStartDate?: Date
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

  rows.push({ category: "ASSETS", values: years.map(() => 0), isHeader: true });
  rows.push({ category: "Cash & Cash Equivalents", values: yearlyData.map(d => d.cash), indent: 1 });
  rows.push({ category: "Property, Plant & Equipment", values: yearlyData.map(d => d.ppe), indent: 1 });
  rows.push({ category: "Accumulated Depreciation", values: yearlyData.map(d => -d.accDep), indent: 1 });
  rows.push({ category: "Deferred Financing Costs", values: yearlyData.map(d => d.deferredFinancing), indent: 1 });
  rows.push({ category: "TOTAL ASSETS", values: yearlyData.map(d => d.totalAssets), isHeader: true });

  rows.push({ category: "LIABILITIES & EQUITY", values: years.map(() => 0), isHeader: true });
  rows.push({ category: "Mortgage Notes Payable", values: yearlyData.map(d => d.debt), indent: 1 });
  rows.push({ category: "Paid-In Capital", values: yearlyData.map(d => d.equity), indent: 1 });
  rows.push({ category: "Retained Earnings", values: yearlyData.map(d => d.retainedEarnings), indent: 1 });
  rows.push({ category: "TOTAL LIABILITIES & EQUITY", values: yearlyData.map(d => d.totalLiabilitiesEquity), isHeader: true });

  return { years, rows };
}

export function generatePortfolioIncomeData(
  yearlyConsolidatedCache: YearlyPropertyFinancials[],
  projectionYears: number,
  getFiscalYear: (i: number) => number
): ExportData {
  const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));
  const c = (i: number) => yearlyConsolidatedCache[i];
  const rows: ExportRow[] = [];

  rows.push({ category: "Total Revenue", values: years.map((_, i) => c(i)?.revenueTotal ?? 0), isHeader: true });
  rows.push({ category: "Room Revenue", values: years.map((_, i) => c(i)?.revenueRooms ?? 0), indent: 1 });
  rows.push({ category: "Event Revenue", values: years.map((_, i) => c(i)?.revenueEvents ?? 0), indent: 1 });
  rows.push({ category: "F&B Revenue", values: years.map((_, i) => c(i)?.revenueFB ?? 0), indent: 1 });
  rows.push({ category: "Other Revenue", values: years.map((_, i) => c(i)?.revenueOther ?? 0), indent: 1 });

  rows.push({
    category: "Operating Expenses",
    values: years.map((_, i) => {
      const data = c(i);
      if (!data) return 0;
      return data.expenseRooms + data.expenseFB + data.expenseEvents + data.expenseOther +
        data.expenseMarketing + data.expensePropertyOps + data.expenseUtilitiesVar +
        data.expenseAdmin + data.expenseIT + data.expenseInsurance + data.expenseTaxes +
        data.expenseUtilitiesFixed + data.expenseOtherCosts;
    }),
    isHeader: true,
  });
  rows.push({ category: "Room Expense", values: years.map((_, i) => c(i)?.expenseRooms ?? 0), indent: 1 });
  rows.push({ category: "F&B Expense", values: years.map((_, i) => c(i)?.expenseFB ?? 0), indent: 1 });
  rows.push({ category: "Event Expense", values: years.map((_, i) => c(i)?.expenseEvents ?? 0), indent: 1 });
  rows.push({ category: "Marketing", values: years.map((_, i) => c(i)?.expenseMarketing ?? 0), indent: 1 });
  rows.push({ category: "Property Ops", values: years.map((_, i) => c(i)?.expensePropertyOps ?? 0), indent: 1 });
  rows.push({ category: "Admin & General", values: years.map((_, i) => c(i)?.expenseAdmin ?? 0), indent: 1 });
  rows.push({ category: "IT", values: years.map((_, i) => c(i)?.expenseIT ?? 0), indent: 1 });
  rows.push({ category: "Insurance", values: years.map((_, i) => c(i)?.expenseInsurance ?? 0), indent: 1 });
  rows.push({ category: "Taxes", values: years.map((_, i) => c(i)?.expenseTaxes ?? 0), indent: 1 });
  rows.push({ category: "Utilities", values: years.map((_, i) => (c(i)?.expenseUtilitiesVar ?? 0) + (c(i)?.expenseUtilitiesFixed ?? 0)), indent: 1 });
  rows.push({ category: "FF&E Reserve", values: years.map((_, i) => c(i)?.expenseFFE ?? 0), indent: 1 });
  rows.push({ category: "Other Expenses", values: years.map((_, i) => (c(i)?.expenseOther ?? 0) + (c(i)?.expenseOtherCosts ?? 0)), indent: 1 });

  rows.push({ category: "Gross Operating Profit", values: years.map((_, i) => c(i)?.gop ?? 0), isHeader: true });
  rows.push({ category: "Management Fees", values: years.map((_, i) => (c(i)?.feeBase ?? 0) + (c(i)?.feeIncentive ?? 0)), isHeader: true });
  rows.push({ category: "Base Fee", values: years.map((_, i) => c(i)?.feeBase ?? 0), indent: 1 });
  rows.push({ category: "Incentive Fee", values: years.map((_, i) => c(i)?.feeIncentive ?? 0), indent: 1 });
  rows.push({ category: "Net Operating Income", values: years.map((_, i) => c(i)?.noi ?? 0), isHeader: true });

  rows.push({ category: "Interest Expense", values: years.map((_, i) => c(i)?.interestExpense ?? 0), indent: 1 });
  rows.push({ category: "Depreciation", values: years.map((_, i) => c(i)?.depreciationExpense ?? 0), indent: 1 });
  rows.push({ category: "Income Tax", values: years.map((_, i) => c(i)?.incomeTax ?? 0), indent: 1 });
  rows.push({ category: "GAAP Net Income", values: years.map((_, i) => c(i)?.netIncome ?? 0), isHeader: true });

  return { years, rows };
}

export function generatePortfolioCashFlowData(
  allPropertyYearlyCF: YearlyCashFlowResult[][],
  projectionYears: number,
  getFiscalYear: (i: number) => number
): ExportData {
  const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));
  const rows: ExportRow[] = [];

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
  rows.push({ category: "Cash Flow from Investing (CFI)", values: consolidatedCFI, isHeader: true });
  rows.push({ category: "Cash Flow from Financing (CFF)", values: consolidatedCFF, isHeader: true });
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

export function exportPortfolioExcel(
  years: number[],
  incomeRows: ExportRow[],
  cashFlowRows: ExportRow[]
): void {
  const wb = XLSX.utils.book_new();

  const incomeWsData = [
    ["Income Statement", ...years.map(String)],
    ...incomeRows.map(row => [
      (row.indent ? "  ".repeat(row.indent) : "") + row.category,
      ...row.values,
    ]),
  ];
  const incomeWs = XLSX.utils.aoa_to_sheet(incomeWsData);
  incomeWs["!cols"] = [{ wch: 38 }, ...years.map(() => ({ wch: 16 }))];
  applyPortfolioExcelFormat(incomeWs, incomeWsData);
  XLSX.utils.book_append_sheet(wb, incomeWs, "Income Statement");

  const cfWsData = [
    ["Cash Flow", ...years.map(String)],
    ...cashFlowRows.map(row => [
      (row.indent ? "  ".repeat(row.indent) : "") + row.category,
      ...row.values,
    ]),
  ];
  const cfWs = XLSX.utils.aoa_to_sheet(cfWsData);
  cfWs["!cols"] = [{ wch: 38 }, ...years.map(() => ({ wch: 16 }))];
  applyPortfolioExcelFormat(cfWs, cfWsData);
  XLSX.utils.book_append_sheet(wb, cfWs, "Cash Flow");

  XLSX.writeFile(wb, "Portfolio - Financial Statements.xlsx");
}

function applyPortfolioExcelFormat(ws: XLSX.WorkSheet, rows: (string | number)[][]): void {
  const currencyFormat = "#,##0";
  for (let r = 0; r < rows.length; r++) {
    for (let c = 1; c < rows[r].length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const cell = ws[cellRef];
      if (cell && typeof cell.v === "number") {
        cell.z = currencyFormat;
      }
    }
    const label = String(rows[r][0] || "").trim();
    const isSection = !label.startsWith(" ") && label.length > 2;
    if (isSection) {
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

export function exportPortfolioPDF(
  orientation: "landscape" | "portrait",
  projectionYears: number,
  years: number[],
  rows: ExportRow[],
  getYearlyConsolidated: (i: number) => YearlyPropertyFinancials,
  title: string
): void {
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });

  doc.setFontSize(18);
  doc.text(`Hospitality Business Group - ${title}`, 14, 15);
  doc.setFontSize(10);
  doc.text(`${projectionYears}-Year Projection (${years[0]} - ${years[projectionYears - 1]})`, 14, 22);
  doc.text(`Generated: ${format(new Date(), "MMM d, yyyy")}`, 14, 27);

  const tableData = rows.map(row => [
    (row.indent ? "  ".repeat(row.indent) : "") + row.category,
    ...row.values.map((v: number) => formatMoney(v)),
  ]);

  autoTable(doc, {
    head: [["Category", ...years.map(String)]],
    body: tableData,
    startY: 32,
    styles: { fontSize: 8, cellPadding: 2, font: "helvetica" },
    headStyles: { fillColor: [159, 188, 164], textColor: [0, 0, 0], fontStyle: "bold", font: "helvetica" },
    columnStyles: { 0: { cellWidth: 45, font: "helvetica" } },
    didParseCell: (data) => {
      if (data.column.index > 0) {
        data.cell.styles.font = "courier";
      }
      if (data.section === "body" && data.row.index !== undefined) {
        const row = rows[data.row.index];
        if (row?.isHeader) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [240, 240, 240];
        }
      }
    },
  });

  doc.addPage();
  doc.setFontSize(16);
  doc.text("Performance Chart", 14, 15);
  doc.setFontSize(10);
  doc.text(`${projectionYears}-Year Revenue, Operating Expenses, and Net Operating Income Trend`, 14, 22);

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
      { name: "NOI", data: noiData, color: "#257D41" },
    ],
  });

  doc.save(`portfolio-${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

export const dashboardExports = {
  generatePortfolioIncomeData,

  exportToPDF: ({
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
    exportPortfolioPDF("landscape", projectionYears, years, rows, getYearlyConsolidated, title);
  },

  exportToCSV: (years: number[], rows: ExportRow[], filename = "portfolio-income-statement.csv") => {
    exportPortfolioCSV(years, rows, filename);
  },

  exportToExcel: (years: number[], rows: ExportRow[], filename = "portfolio-income-statement.xlsx", sheetName = "Income Statement") => {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ["Category", ...years.map(String)],
      ...rows.map(row => [row.category, ...row.values]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  },

  exportToPPTX: (data: any) => {
    originalExportPortfolioPPTX(data);
  },

  exportToPNG: (ref: React.RefObject<HTMLElement>, filename = "portfolio-income-statement.png") => {
    if (ref.current) {
      exportTablePNG({ element: ref.current, filename });
    }
  },
};
