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
  exportToPDF: ({
    propertyName,
    projectionYears,
    years,
    rows,
    getYearlyConsolidated,
  }: {
    propertyName: string;
    projectionYears: number;
    years: number[];
    rows: ExportRow[];
    getYearlyConsolidated: (i: number) => any;
  }) => {
    exportPortfolioPDF("landscape", projectionYears, years, rows, getYearlyConsolidated, "Portfolio Income Statement");
  },

  exportToCSV: (years: number[], rows: ExportRow[]) => {
    exportPortfolioCSV(years, rows, "portfolio-income-statement.csv");
  },

  exportToExcel: (years: number[], rows: ExportRow[]) => {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ["Category", ...years.map(String)],
      ...rows.map(row => [row.category, ...row.values]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Income Statement");
    XLSX.writeFile(wb, "portfolio-income-statement.xlsx");
  },

  exportToPPTX: (data: any) => {
    originalExportPortfolioPPTX(data);
  },

  exportToPNG: (ref: React.RefObject<HTMLElement>) => {
    if (ref.current) {
      exportTablePNG({ element: ref.current, filename: "portfolio-income-statement.png" });
    }
  },
};
