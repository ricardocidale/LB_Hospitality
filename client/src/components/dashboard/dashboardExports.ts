import { format } from "date-fns";
import { drawLineChart } from "@/lib/exports/pdfChartDrawer";
import { exportPortfolioPPTX as originalExportPortfolioPPTX } from "@/lib/exports/pptxExport";
import { exportTablePNG } from "@/lib/exports/pngExport";
import { downloadCSV } from "@/lib/exports/csvExport";
import { buildFinancialTableConfig, addFooters, drawTitle, drawSubtitle, drawSubtitleRow, drawDashboardSummaryPage, type DashboardSummaryMetric } from "@/lib/exports/pdfHelpers";
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
export function toExportData(data: ExportData): { years: string[]; rows: { category: string; values: number[]; indent?: number; isBold?: boolean; isHeader?: boolean }[] } {
  return {
    years: data.years.map(String),
    rows: data.rows.map(r => ({ category: r.category, values: r.values, indent: r.indent, isBold: r.isBold ?? r.isHeader, isHeader: r.isHeader })),
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
  summaryOnly?: boolean,
  allPropertyYearlyIS?: YearlyPropertyFinancials[][],
  propertyNames?: string[]
): ExportData {
  const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));
  const c = (i: number) => yearlyConsolidatedCache[i];
  const p = (idx: number, i: number) => allPropertyYearlyIS?.[idx]?.[i];
  const rows: ExportRow[] = [];
  const hasProps = allPropertyYearlyIS && propertyNames && propertyNames.length > 0;

  if (!summaryOnly) {
    rows.push({ category: "Operational Metrics", values: years.map(() => 0), isHeader: true });
    rows.push({ category: "Total Rooms Available", values: years.map((_, i) => c(i)?.availableRooms ?? 0), indent: 1 });
    const adrVals = years.map((_, i) => {
      const sold = c(i)?.soldRooms ?? 0;
      return sold > 0 ? (c(i)?.revenueRooms ?? 0) / sold : 0;
    });
    rows.push({ category: "ADR (Effective)", values: adrVals, indent: 1 });
    const occVals = years.map((_, i) => {
      const sold = c(i)?.soldRooms ?? 0;
      const avail = c(i)?.availableRooms ?? 0;
      return avail > 0 ? sold / avail : 0;
    });
    rows.push({ category: "Occupancy", values: occVals, indent: 1 });
    const revparVals = years.map((_, i) => {
      const rev = c(i)?.revenueRooms ?? 0;
      const avail = c(i)?.availableRooms ?? 0;
      return avail > 0 ? rev / avail : 0;
    });
    rows.push({ category: "RevPAR", values: revparVals, indent: 1 });
  }

  rows.push({ category: "Total Revenue", values: years.map((_, i) => c(i)?.revenueTotal ?? 0), isHeader: true });
  if (!summaryOnly) {
    rows.push({ category: "Room Revenue", values: years.map((_, i) => c(i)?.revenueRooms ?? 0), indent: 1 });
    rows.push({ category: "Event Revenue", values: years.map((_, i) => c(i)?.revenueEvents ?? 0), indent: 1 });
    rows.push({ category: "F&B Revenue", values: years.map((_, i) => c(i)?.revenueFB ?? 0), indent: 1 });
    rows.push({ category: "Other Revenue", values: years.map((_, i) => c(i)?.revenueOther ?? 0), indent: 1 });
    if (hasProps) {
      propertyNames!.forEach((name, idx) => {
        rows.push({ category: name, values: years.map((_, i) => p(idx, i)?.revenueTotal ?? 0), indent: 2 });
      });
    }
  }

  const totalOpEx = (i: number) => {
    const data = c(i);
    if (!data) return 0;
    return data.expenseRooms + data.expenseFB + data.expenseEvents + data.expenseOther +
      data.expenseMarketing + data.expensePropertyOps + data.expenseUtilitiesVar +
      data.expenseAdmin + data.expenseIT + data.expenseUtilitiesFixed + data.expenseOtherCosts;
  };

  rows.push({
    category: "Operating Expenses",
    values: years.map((_, i) => totalOpEx(i)),
    isHeader: true,
  });
  if (!summaryOnly) {
    rows.push({ category: "Room Expense", values: years.map((_, i) => c(i)?.expenseRooms ?? 0), indent: 1 });
    rows.push({ category: "F&B Expense", values: years.map((_, i) => c(i)?.expenseFB ?? 0), indent: 1 });
    rows.push({ category: "Event Expense", values: years.map((_, i) => c(i)?.expenseEvents ?? 0), indent: 1 });
    rows.push({ category: "Marketing", values: years.map((_, i) => c(i)?.expenseMarketing ?? 0), indent: 1 });
    rows.push({ category: "Property Ops", values: years.map((_, i) => c(i)?.expensePropertyOps ?? 0), indent: 1 });
    rows.push({ category: "Admin & General", values: years.map((_, i) => c(i)?.expenseAdmin ?? 0), indent: 1 });
    rows.push({ category: "IT & Technology", values: years.map((_, i) => c(i)?.expenseIT ?? 0), indent: 1 });
    rows.push({ category: "Utilities", values: years.map((_, i) => (c(i)?.expenseUtilitiesVar ?? 0) + (c(i)?.expenseUtilitiesFixed ?? 0)), indent: 1 });
    rows.push({ category: "Other Expenses", values: years.map((_, i) => (c(i)?.expenseOther ?? 0) + (c(i)?.expenseOtherCosts ?? 0)), indent: 1 });
  }

  rows.push({ category: "Gross Operating Profit", values: years.map((_, i) => c(i)?.gop ?? 0), isHeader: true });
  if (!summaryOnly && hasProps) {
    propertyNames!.forEach((name, idx) => {
      rows.push({ category: name, values: years.map((_, i) => p(idx, i)?.gop ?? 0), indent: 1 });
    });
  }

  rows.push({ category: "Management Fees", values: years.map((_, i) => (c(i)?.feeBase ?? 0) + (c(i)?.feeIncentive ?? 0)), isHeader: true });
  if (!summaryOnly) {
    rows.push({ category: "Base Fee", values: years.map((_, i) => c(i)?.feeBase ?? 0), indent: 1 });
    const catSet = new Set<string>();
    for (const yc of yearlyConsolidatedCache) for (const k of Object.keys(yc?.serviceFeesByCategory ?? {})) catSet.add(k);
    catSet.forEach(cat => {
      rows.push({ category: cat, values: years.map((_, i) => c(i)?.serviceFeesByCategory?.[cat] ?? 0), indent: 2 });
    });
    rows.push({ category: "Incentive Fee", values: years.map((_, i) => c(i)?.feeIncentive ?? 0), indent: 1 });
  }

  rows.push({ category: "Income Before Fixed Charges (IBFC)", values: years.map((_, i) => c(i)?.agop ?? 0), isHeader: true });
  if (!summaryOnly && hasProps) {
    propertyNames!.forEach((name, idx) => {
      rows.push({ category: name, values: years.map((_, i) => p(idx, i)?.agop ?? 0), indent: 1 });
    });
  }

  rows.push({ category: "Fixed Charges", values: years.map((_, i) => (c(i)?.expenseTaxes ?? 0)), isHeader: true });
  if (!summaryOnly) {
    rows.push({ category: "Property Taxes", values: years.map((_, i) => c(i)?.expenseTaxes ?? 0), indent: 1 });
  }

  rows.push({ category: "Net Operating Income (NOI)", values: years.map((_, i) => c(i)?.noi ?? 0), isHeader: true });
  if (!summaryOnly && hasProps) {
    propertyNames!.forEach((name, idx) => {
      rows.push({ category: name, values: years.map((_, i) => p(idx, i)?.noi ?? 0), indent: 1 });
    });
  }

  if (!summaryOnly) {
    rows.push({ category: "FF&E Reserve", values: years.map((_, i) => c(i)?.expenseFFE ?? 0), indent: 1 });
  }
  rows.push({ category: "Adjusted NOI (ANOI)", values: years.map((_, i) => c(i)?.anoi ?? 0), isHeader: true });
  if (!summaryOnly && hasProps) {
    propertyNames!.forEach((name, idx) => {
      rows.push({ category: name, values: years.map((_, i) => p(idx, i)?.anoi ?? 0), indent: 1 });
    });
  }

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
  rows.push({ category: "Portfolio IRR (%)", values: years.map(() => financials.portfolioIRR * 100), indent: 1 });
  rows.push({ category: "Equity Multiple", values: years.map(() => financials.equityMultiple), indent: 1 });
  rows.push({ category: "Cash-on-Cash Return (%)", values: years.map(() => financials.cashOnCash), indent: 1 });

  const consolidatedNOI = years.map((_, i) => financials.yearlyConsolidatedCache[i]?.noi ?? 0);
  const consolidatedANOI = years.map((_, i) => financials.yearlyConsolidatedCache[i]?.anoi ?? 0);
  const consolidatedNetIncome = years.map((_, i) => financials.yearlyConsolidatedCache[i]?.netIncome ?? 0);
  const consolidatedCashFlow = years.map((_, y) =>
    financials.allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.freeCashFlowToEquity ?? 0), 0)
  );
  const consolidatedDSCR = years.map((_, y) => {
    const totalDS = financials.allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.debtService ?? 0), 0);
    const totalNOI = financials.yearlyConsolidatedCache[y]?.noi ?? 0;
    return totalDS > 0 ? totalNOI / totalDS : 0;
  });

  rows.push({ category: "", values: years.map(() => 0) });
  rows.push({ category: "Annual Performance", values: years.map(() => 0), isHeader: true });
  rows.push({ category: "Net Operating Income (NOI)", values: consolidatedNOI, indent: 1 });
  rows.push({ category: "Adjusted NOI (ANOI)", values: consolidatedANOI, indent: 1 });
  rows.push({ category: "GAAP Net Income", values: consolidatedNetIncome, indent: 1 });
  rows.push({ category: "Cash Flow", values: consolidatedCashFlow, indent: 1 });
  rows.push({ category: "DSCR", values: consolidatedDSCR, indent: 1 });

  return { years, rows };
}

export function buildAllPortfolioStatements(
  financials: DashboardFinancials,
  properties: Property[],
  projectionYears: number,
  getFiscalYear: (i: number) => number,
  modelStartDate?: Date
): {
  incomeData: ExportData;
  cashFlowData: ExportData;
  balanceSheetData: ExportData;
  investmentData: ExportData;
} {
  const allExpandedCF = new Set(["cfo", "cfi", "cff"]);
  const propertyNames = properties.map(p => p.name);

  return {
    incomeData: generatePortfolioIncomeData(financials.yearlyConsolidatedCache, projectionYears, getFiscalYear, false, financials.allPropertyYearlyIS, propertyNames),
    cashFlowData: generatePortfolioCashFlowData(financials.allPropertyYearlyCF, projectionYears, getFiscalYear, allExpandedCF, true, propertyNames),
    balanceSheetData: generatePortfolioBalanceSheetData(financials.allPropertyFinancials, projectionYears, getFiscalYear, modelStartDate),
    investmentData: generatePortfolioInvestmentData(financials, properties, projectionYears, getFiscalYear),
  };
}

export async function exportPortfolioExcel(
  datasets: {
    incomeData: ExportData;
    cashFlowData: ExportData;
    balanceSheetData: ExportData;
    investmentData: ExportData;
  },
  companyName = "Portfolio"
): Promise<void> {
  const XLSX = await import("xlsx");
  const { applyCurrencyFormat, applyHeaderStyle, setColumnWidths } = await import("@/lib/exports/excel/helpers");
  const wb = (XLSX as any).utils.book_new();

  const sheets: { name: string; data: ExportData }[] = [
    { name: "Income Statement", data: datasets.incomeData },
    { name: "Cash Flow", data: datasets.cashFlowData },
    { name: "Balance Sheet", data: datasets.balanceSheetData },
    { name: "Investment Analysis", data: datasets.investmentData },
  ];

  for (const sheet of sheets) {
    const wsData = [
      [sheet.name, ...sheet.data.years.map(String)],
      ...sheet.data.rows.map(row => [
        (row.indent ? "  ".repeat(row.indent) : "") + row.category,
        ...row.values,
      ]),
    ];
    const ws = (XLSX as any).utils.aoa_to_sheet(wsData);
    setColumnWidths(ws, [38, ...sheet.data.years.map(() => 16)]);
    applyCurrencyFormat(ws, wsData);
    applyHeaderStyle(ws, wsData);
    (XLSX as any).utils.book_append_sheet(wb, ws, sheet.name);
  }

  const safeName = companyName.replace(/[^a-zA-Z0-9 &\-]/g, "").substring(0, 60);
  (XLSX as any).writeFile(wb, `${safeName} - Consolidated Financial Statements.xlsx`);
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

  const pageWidth = orientation === "landscape" ? 297 : 210;
  const entityTag = `${companyName} \u2014 Consolidated Portfolio`;

  drawTitle(doc, `${companyName} \u2014 ${title}`, 14, 15);
  drawSubtitleRow(doc,
    `${projectionYears}-Year Projection (${years[0]} \u2013 ${years[projectionYears - 1]})`,
    entityTag, 14, 22, pageWidth);
  drawSubtitle(doc, `Generated: ${format(new Date(), "MMM d, yyyy")}`, 14, 27);

  const tableConfig = buildFinancialTableConfig(years, rows, orientation, 32);
  autoTable(doc, tableConfig);

  doc.addPage();
  drawTitle(doc, `${companyName} \u2014 ${title} Performance Trend`, 14, 15, { fontSize: 16 });
  drawSubtitleRow(doc,
    `${projectionYears}-Year Revenue, Operating Expenses, and Adjusted NOI Trend`,
    entityTag, 14, 22, pageWidth);

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

export interface ComprehensiveDashboardExportParams {
  financials: DashboardFinancials;
  properties: Property[];
  projectionYears: number;
  getFiscalYear: (i: number) => number;
  companyName?: string;
  incomeRows: ExportRow[];
  modelStartDate?: Date;
}

const fmtCompact = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(v);

export async function exportDashboardComprehensivePDF(params: ComprehensiveDashboardExportParams): Promise<void> {
  const {
    financials, properties, projectionYears, getFiscalYear,
    companyName = "Hospitality Business Group",
    incomeRows, modelStartDate,
  } = params;

  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = 297;
  const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));
  const entityTag = `${companyName} \u2014 Consolidated Portfolio`;

  drawTitle(doc, `${companyName} \u2014 Consolidated Portfolio Report`, 14, 15, { fontSize: 20 });
  drawSubtitleRow(doc,
    `${projectionYears}-Year Financial Projection (${years[0]} \u2013 ${years[years.length - 1]})`,
    `${properties.length} Properties \u2014 ${financials.totalRooms} Rooms`, 14, 22, pageW);
  drawSubtitle(doc, `Generated: ${format(new Date(), "MMM d, yyyy")}`, 14, 27);
  drawSubtitle(doc, "This report contains: Dashboard Summary, Income Statement, Cash Flow Statement, Balance Sheet, Investment Analysis, and Performance Charts.", 14, 33, { fontSize: 8 });

  doc.addPage();
  const metrics: DashboardSummaryMetric[] = [
    { label: "Portfolio IRR", value: `${(financials.portfolioIRR * 100).toFixed(1)}%`, section: "Return Metrics" },
    { label: "Equity Multiple", value: `${financials.equityMultiple.toFixed(2)}x`, section: "Return Metrics" },
    { label: "Cash-on-Cash Return", value: `${financials.cashOnCash.toFixed(1)}%`, section: "Return Metrics" },
    { label: "Total Equity Invested", value: fmtCompact(financials.totalInitialEquity), section: "Investment Summary" },
    { label: `Projected Exit Value (Year ${projectionYears})`, value: fmtCompact(financials.totalExitValue), section: "Investment Summary" },
    { label: "Total Properties / Rooms", value: `${properties.length} / ${financials.totalRooms}`, section: "Investment Summary" },
    { label: `${projectionYears}-Year Revenue`, value: fmtCompact(financials.totalProjectionRevenue), section: "Projection Totals" },
    { label: `${projectionYears}-Year NOI`, value: fmtCompact(financials.totalProjectionNOI), section: "Projection Totals" },
    { label: `${projectionYears}-Year Cash Flow`, value: fmtCompact(financials.totalProjectionCashFlow), section: "Projection Totals" },
  ];
  const propertyTable = properties.map(p => ({
    name: p.name, market: p.market, rooms: p.roomCount, status: p.status,
  }));
  drawDashboardSummaryPage(doc, pageW, entityTag, companyName, metrics, propertyTable);

  doc.addPage();
  drawTitle(doc, "Consolidated Income Statement (USALI)", 14, 15, { fontSize: 16 });
  drawSubtitleRow(doc,
    `${projectionYears}-Year Projection (${years[0]} \u2013 ${years[years.length - 1]})`,
    entityTag, 14, 22, pageW);
  const incomeConfig = buildFinancialTableConfig(years, incomeRows, "landscape", 28);
  autoTable(doc, incomeConfig);

  doc.addPage();
  const cashFlowData = generatePortfolioCashFlowData(
    financials.allPropertyYearlyCF, projectionYears, getFiscalYear,
    new Set(["cfo", "cfi", "cff"]), false,
    properties.map(p => p.name),
  );
  drawTitle(doc, "Consolidated Cash Flow Statement", 14, 15, { fontSize: 16 });
  drawSubtitleRow(doc,
    `${projectionYears}-Year Projection (${years[0]} \u2013 ${years[years.length - 1]})`,
    entityTag, 14, 22, pageW);
  const cfConfig = buildFinancialTableConfig(cashFlowData.years, cashFlowData.rows, "landscape", 28);
  autoTable(doc, cfConfig);

  doc.addPage();
  const balanceSheetData = generatePortfolioBalanceSheetData(
    financials.allPropertyFinancials, projectionYears, getFiscalYear, modelStartDate,
  );
  drawTitle(doc, "Consolidated Balance Sheet", 14, 15, { fontSize: 16 });
  drawSubtitleRow(doc,
    `${projectionYears}-Year Projection (${years[0]} \u2013 ${years[years.length - 1]})`,
    entityTag, 14, 22, pageW);
  const bsConfig = buildFinancialTableConfig(balanceSheetData.years, balanceSheetData.rows, "landscape", 28);
  autoTable(doc, bsConfig);

  doc.addPage();
  const investmentData = generatePortfolioInvestmentData(financials, properties, projectionYears, getFiscalYear);
  drawTitle(doc, "Portfolio Investment Analysis", 14, 15, { fontSize: 16 });
  drawSubtitleRow(doc,
    `${projectionYears}-Year Projection (${years[0]} \u2013 ${years[years.length - 1]})`,
    entityTag, 14, 22, pageW);
  const invConfig = buildFinancialTableConfig(investmentData.years, investmentData.rows, "landscape", 28);
  autoTable(doc, invConfig);

  doc.addPage();
  drawTitle(doc, `${companyName} \u2014 Income Statement Performance Trend`, 14, 15, { fontSize: 16 });
  drawSubtitleRow(doc,
    `${projectionYears}-Year Revenue, Operating Expenses, and Adjusted NOI Trend`,
    entityTag, 14, 22, pageW);

  const chartData = years.map((year, i) => ({
    label: String(year),
    value: financials.yearlyConsolidatedCache[i]?.revenueTotal ?? 0,
  }));
  const noiData = years.map((year, i) => ({
    label: String(year),
    value: financials.yearlyConsolidatedCache[i]?.noi ?? 0,
  }));
  const expenseData = years.map((year, i) => ({
    label: String(year),
    value: financials.yearlyConsolidatedCache[i]?.totalExpenses ?? 0,
  }));

  drawLineChart({
    doc,
    x: 14,
    y: 30,
    width: 269,
    height: 150,
    title: `Portfolio Performance (${projectionYears}-Year Projection)`,
    series: [
      { name: "Revenue", data: chartData, color: "#7C3AED" },
      { name: "Operating Expenses", data: expenseData, color: "#2563EB" },
      { name: "ANOI", data: noiData, color: "#257D41" },
    ],
  });

  addFooters(doc, companyName);
  doc.save(`${companyName} - Consolidated Portfolio Report.pdf`);
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

  exportToExcel: async (_years: number[], _rows: ExportRow[], _filename = "portfolio-income-statement.xlsx", _sheetName = "Income Statement") => {
    console.warn("dashboardExports.exportToExcel is deprecated. Use exportPortfolioExcel instead.");
  },

  exportToPPTX: async (data: any, companyName?: string) => {
    await originalExportPortfolioPPTX(data, companyName);
  },

  exportToPNG: (ref: React.RefObject<HTMLElement>, filename = "portfolio-income-statement.png") => {
    if (ref.current) {
      exportTablePNG({ element: ref.current, filename });
    }
  },
};
