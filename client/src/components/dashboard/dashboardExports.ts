import { format } from "date-fns";
import { drawLineChart } from "@/lib/exports/pdfChartDrawer";
import { exportPortfolioPPTX as originalExportPortfolioPPTX } from "@/lib/exports/pptxExport";
import { exportTablePNG } from "@/lib/exports/pngExport";
import { downloadCSV } from "@/lib/exports/csvExport";
import { buildFinancialTableConfig, addFooters, drawTitle, drawSubtitle, drawSubtitleRow, drawDashboardSummaryPage, drawCoverPage, type DashboardSummaryMetric } from "@/lib/exports/pdfHelpers";
import { PAGE_DIMS } from "@/lib/exports/exportStyles";
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
  format?: "currency" | "percentage" | "number" | "ratio" | "multiplier";
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
      const cumulativeANOI = relevantMonths.reduce((sum, m) => sum + m.anoi, 0);
      const cumulativeDebtService = relevantMonths.reduce((sum, m) => sum + m.interestExpense + m.principalPayment, 0);
      const cumulativeTax = relevantMonths.reduce((sum, m) => sum + m.incomeTax, 0);
      const cumulativeRefi = relevantMonths.reduce((sum, m) => sum + m.refinancingProceeds, 0);
      
      const cash = operatingReserve + (cumulativeANOI - cumulativeDebtService - cumulativeTax) + cumulativeRefi;
      
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
  if (!summaryOnly) {
    rows.push({ category: "Cash & Cash Equivalents", values: yearlyData.map(d => d.cash), indent: 1 });
    rows.push({ category: "Property, Plant & Equipment", values: yearlyData.map(d => d.ppe), indent: 1 });
    rows.push({ category: "Accumulated Depreciation", values: yearlyData.map(d => -d.accDep), indent: 1 });
    rows.push({ category: "Deferred Financing Costs", values: yearlyData.map(d => d.deferredFinancing), indent: 1 });
  }
  rows.push({ category: "TOTAL ASSETS", values: yearlyData.map(d => d.totalAssets), isHeader: true });

  rows.push({ category: "LIABILITIES & EQUITY", values: years.map(() => 0), isHeader: true });
  if (!summaryOnly) {
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

  rows.push({ category: "Operational Metrics", values: years.map(() => 0), isHeader: true });
  if (!summaryOnly) {
    rows.push({ category: "Total Rooms Available", values: years.map((_, i) => c(i)?.availableRooms ?? 0), indent: 1, format: "number" });
    const adrVals = years.map((_, i) => {
      const sold = c(i)?.soldRooms ?? 0;
      return sold > 0 ? (c(i)?.revenueRooms ?? 0) / sold : 0;
    });
    rows.push({ category: "ADR (Effective)", values: adrVals, indent: 1, format: "currency" });
    const occVals = years.map((_, i) => {
      const sold = c(i)?.soldRooms ?? 0;
      const avail = c(i)?.availableRooms ?? 0;
      return avail > 0 ? sold / avail : 0;
    });
    rows.push({ category: "Occupancy", values: occVals, indent: 1, format: "percentage" });
    const revparVals = years.map((_, i) => {
      const rev = c(i)?.revenueRooms ?? 0;
      const avail = c(i)?.availableRooms ?? 0;
      return avail > 0 ? rev / avail : 0;
    });
    rows.push({ category: "RevPAR", values: revparVals, indent: 1, format: "currency" });
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

  const deptExpTotal = (i: number) => {
    const data = c(i);
    if (!data) return 0;
    return data.expenseRooms + data.expenseFB + data.expenseEvents + data.expenseOther;
  };

  const undistExpTotal = (i: number) => {
    const data = c(i);
    if (!data) return 0;
    return data.expenseMarketing + data.expensePropertyOps + data.expenseAdmin +
      data.expenseIT + data.expenseInsurance +
      data.expenseUtilitiesVar + data.expenseUtilitiesFixed + data.expenseOtherCosts;
  };

  rows.push({ category: "Departmental Expenses", values: years.map((_, i) => deptExpTotal(i)), isHeader: true });
  if (!summaryOnly) {
    rows.push({ category: "Room Expense", values: years.map((_, i) => c(i)?.expenseRooms ?? 0), indent: 1 });
    rows.push({ category: "F&B Expense", values: years.map((_, i) => c(i)?.expenseFB ?? 0), indent: 1 });
    rows.push({ category: "Event Expense", values: years.map((_, i) => c(i)?.expenseEvents ?? 0), indent: 1 });
    rows.push({ category: "Other Departmental", values: years.map((_, i) => c(i)?.expenseOther ?? 0), indent: 1 });
  }

  rows.push({ category: "Undistributed Operating Expenses", values: years.map((_, i) => undistExpTotal(i)), isHeader: true });
  if (!summaryOnly) {
    rows.push({ category: "Marketing & Sales", values: years.map((_, i) => c(i)?.expenseMarketing ?? 0), indent: 1 });
    rows.push({ category: "Property Ops & Maintenance", values: years.map((_, i) => c(i)?.expensePropertyOps ?? 0), indent: 1 });
    rows.push({ category: "Admin & General", values: years.map((_, i) => c(i)?.expenseAdmin ?? 0), indent: 1 });
    rows.push({ category: "IT & Technology", values: years.map((_, i) => c(i)?.expenseIT ?? 0), indent: 1 });
    rows.push({ category: "Insurance", values: years.map((_, i) => c(i)?.expenseInsurance ?? 0), indent: 1 });
    rows.push({ category: "Utilities", values: years.map((_, i) => (c(i)?.expenseUtilitiesVar ?? 0) + (c(i)?.expenseUtilitiesFixed ?? 0)), indent: 1 });
    rows.push({ category: "Other Undistributed", values: years.map((_, i) => c(i)?.expenseOtherCosts ?? 0), indent: 1 });
  }

  rows.push({ category: "Gross Operating Profit (GOP)", values: years.map((_, i) => c(i)?.gop ?? 0), isHeader: true, isBold: true });
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

  rows.push({ category: "Adjusted Gross Operating Profit (AGOP)", values: years.map((_, i) => c(i)?.agop ?? 0), isHeader: true, isBold: true });
  if (!summaryOnly && hasProps) {
    propertyNames!.forEach((name, idx) => {
      rows.push({ category: name, values: years.map((_, i) => p(idx, i)?.agop ?? 0), indent: 1 });
    });
  }

  rows.push({ category: "Fixed Charges", values: years.map((_, i) => (c(i)?.expenseTaxes ?? 0)), isHeader: true });
  if (!summaryOnly) {
    rows.push({ category: "Property Taxes", values: years.map((_, i) => c(i)?.expenseTaxes ?? 0), indent: 1 });
  }

  rows.push({ category: "Net Operating Income (NOI)", values: years.map((_, i) => c(i)?.noi ?? 0), isHeader: true, isBold: true });
  if (!summaryOnly && hasProps) {
    propertyNames!.forEach((name, idx) => {
      rows.push({ category: name, values: years.map((_, i) => p(idx, i)?.noi ?? 0), indent: 1 });
    });
  }

  rows.push({ category: "FF&E Reserve", values: years.map((_, i) => c(i)?.expenseFFE ?? 0), isHeader: true });
  rows.push({ category: "Adjusted NOI (ANOI)", values: years.map((_, i) => c(i)?.anoi ?? 0), isHeader: true, isBold: true });
  if (!summaryOnly && hasProps) {
    propertyNames!.forEach((name, idx) => {
      rows.push({ category: name, values: years.map((_, i) => p(idx, i)?.anoi ?? 0), indent: 1 });
    });
  }

  rows.push({ category: "Debt Service", values: years.map((_, i) => c(i)?.debtPayment ?? 0), isHeader: true });
  if (!summaryOnly) {
    rows.push({ category: "Interest Expense", values: years.map((_, i) => c(i)?.interestExpense ?? 0), indent: 1 });
    rows.push({ category: "Principal Payment", values: years.map((_, i) => c(i)?.principalPayment ?? 0), indent: 1 });
  }

  rows.push({ category: "Net Income", values: years.map((_, i) => c(i)?.netIncome ?? 0), isHeader: true, isBold: true });
  if (!summaryOnly) {
    rows.push({ category: "Depreciation", values: years.map((_, i) => c(i)?.depreciationExpense ?? 0), indent: 1 });
    rows.push({ category: "Income Tax", values: years.map((_, i) => c(i)?.incomeTax ?? 0), indent: 1 });
    rows.push({ category: "Cash Flow", values: years.map((_, i) => c(i)?.cashFlow ?? 0), indent: 1, isBold: true });
  }

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

  const consolidatedMaintenanceCapex = years.map((_, y) =>
    allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.maintenanceCapex ?? 0), 0)
  );
  const consolidatedFCF = years.map((_, y) => consolidatedCFO[y] - consolidatedMaintenanceCapex[y]);
  const consolidatedPrincipal = years.map((_, y) =>
    allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.principalPayment ?? 0), 0)
  );
  const consolidatedFCFE = years.map((_, y) => consolidatedFCF[y] - consolidatedPrincipal[y]);

  rows.push({ category: "", values: years.map(() => 0) });
  rows.push({ category: "Free Cash Flow", values: years.map(() => 0), isHeader: true });
  rows.push({ category: "Net Cash from Operating Activities", values: consolidatedCFO, indent: 1 });
  rows.push({ category: "Less: Capital Expenditures (FF&E)", values: consolidatedMaintenanceCapex.map(v => -v), indent: 1 });
  rows.push({ category: "Free Cash Flow (FCF)", values: consolidatedFCF, isBold: true, indent: 1 });
  rows.push({ category: "Less: Principal Payments", values: consolidatedPrincipal.map(v => -v), indent: 1 });
  rows.push({ category: "Free Cash Flow to Equity (FCFE)", values: consolidatedFCFE, isBold: true, indent: 1 });

  return { years, rows };
}

export function generatePortfolioInvestmentData(
  financials: DashboardFinancials,
  properties: Property[],
  projectionYears: number,
  getFiscalYear: (i: number) => number,
  summaryOnly = false,
): ExportData {
  const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));
  const rows: ExportRow[] = [];
  const yc = financials.yearlyConsolidatedCache;
  const cf = financials.allPropertyYearlyCF;
  const totalRooms = properties.reduce((sum, p) => sum + p.roomCount, 0);

  rows.push({ category: "Investment Summary", values: years.map(() => 0), isHeader: true });
  rows.push({ category: "Total Initial Equity", values: years.map(() => financials.totalInitialEquity), indent: 1 });
  rows.push({ category: "Total Exit Value", values: years.map(() => financials.totalExitValue), indent: 1 });
  rows.push({ category: "Portfolio IRR (%)", values: years.map(() => financials.portfolioIRR), indent: 1, format: "percentage" });
  rows.push({ category: "Equity Multiple", values: years.map(() => financials.equityMultiple), indent: 1, format: "multiplier" });
  rows.push({ category: "Cash-on-Cash Return (%)", values: years.map(() => financials.cashOnCash / 100), indent: 1, format: "percentage" });
  rows.push({ category: "Total Properties", values: years.map(() => properties.length), indent: 1 });
  rows.push({ category: "Total Rooms", values: years.map(() => totalRooms), indent: 1 });

  const consolidatedRevenue = years.map((_, i) => yc[i]?.revenueTotal ?? 0);
  const consolidatedGOP = years.map((_, i) => yc[i]?.gop ?? 0);
  const consolidatedNOI = years.map((_, i) => yc[i]?.noi ?? 0);
  const consolidatedANOI = years.map((_, i) => yc[i]?.anoi ?? 0);
  const consolidatedNetIncome = years.map((_, i) => yc[i]?.netIncome ?? 0);
  const totalExpenses = years.map((_, i) => yc[i]?.totalExpenses ?? 0);
  const interestExpense = years.map((_, i) => yc[i]?.interestExpense ?? 0);
  const depreciation = years.map((_, i) => yc[i]?.depreciationExpense ?? 0);
  const incomeTax = years.map((_, i) => yc[i]?.incomeTax ?? 0);
  const feeBase = years.map((_, i) => yc[i]?.feeBase ?? 0);
  const feeIncentive = years.map((_, i) => yc[i]?.feeIncentive ?? 0);
  const ffE = years.map((_, i) => yc[i]?.expenseFFE ?? 0);
  const propertyTaxes = years.map((_, i) => yc[i]?.expenseTaxes ?? 0);

  // Detail sections — headers always visible, children only when not summaryOnly
  const consolidatedCFO = years.map((_, y) => cf.reduce((sum, prop) => sum + (prop[y]?.cashFromOperations ?? 0), 0));
  const consolidatedFCF = years.map((_, y) => cf.reduce((sum, prop) => sum + (prop[y]?.freeCashFlow ?? 0), 0));
  const consolidatedFCFE = years.map((_, y) => cf.reduce((sum, prop) => sum + (prop[y]?.freeCashFlowToEquity ?? 0), 0));
  const consolidatedDS = years.map((_, y) => cf.reduce((sum, prop) => sum + (prop[y]?.debtService ?? 0), 0));
  const consolidatedPrincipal = years.map((_, y) => cf.reduce((sum, prop) => sum + (prop[y]?.principalPayment ?? 0), 0));
  const cumulativeFCFE = years.map((_, y) => {
    let cum = 0;
    for (let i = 0; i <= y; i++) cum += cf.reduce((sum, prop) => sum + (prop[i]?.freeCashFlowToEquity ?? 0), 0);
    return cum;
  });
  const consolidatedDSCR = years.map((_, y) => {
    const ds = cf.reduce((sum, prop) => sum + (prop[y]?.debtService ?? 0), 0);
    return ds > 0 ? consolidatedNOI[y] / ds : 0;
  });
  const capRate = years.map((_, i) => financials.totalExitValue > 0 ? consolidatedNOI[i] / financials.totalExitValue : 0);
  const opratio = years.map((_, i) => consolidatedRevenue[i] > 0 ? totalExpenses[i] / consolidatedRevenue[i] : 0);
  const wm = financials.weightedMetricsByYear;

  // All detail sections below — ONLY in extended mode.
  // In short/default mode, the Investment Analysis UI only shows the summary KPI cards above.
  if (!summaryOnly) {
    rows.push({ category: "", values: years.map(() => 0) });
    rows.push({ category: "Revenue & Profitability", values: years.map(() => 0), isHeader: true });
    rows.push({ category: "Total Revenue", values: consolidatedRevenue, indent: 1 });
    rows.push({ category: "Total Operating Expenses", values: totalExpenses, indent: 1 });
    rows.push({ category: "Gross Operating Profit (GOP)", values: consolidatedGOP, indent: 1 });
    rows.push({ category: "GOP Margin (%)", values: years.map((_, i) => consolidatedRevenue[i] > 0 ? consolidatedGOP[i] / consolidatedRevenue[i] : 0), indent: 1, format: "percentage" });
    rows.push({ category: "Property Taxes", values: propertyTaxes, indent: 1 });
    rows.push({ category: "Net Operating Income (NOI)", values: consolidatedNOI, indent: 1 });
    rows.push({ category: "NOI Margin (%)", values: years.map((_, i) => consolidatedRevenue[i] > 0 ? consolidatedNOI[i] / consolidatedRevenue[i] : 0), indent: 1, format: "percentage" });
    rows.push({ category: "Management Fees (Base)", values: feeBase, indent: 1 });
    rows.push({ category: "Management Fees (Incentive)", values: feeIncentive, indent: 1 });
    rows.push({ category: "FF&E Reserve", values: ffE, indent: 1 });
    rows.push({ category: "Adjusted NOI (ANOI)", values: consolidatedANOI, indent: 1 });

    rows.push({ category: "", values: years.map(() => 0) });
    rows.push({ category: "Cash Flow Analysis", values: years.map(() => 0), isHeader: true });
    rows.push({ category: "Cash from Operations (CFO)", values: consolidatedCFO, indent: 1 });
    rows.push({ category: "Free Cash Flow (FCF)", values: consolidatedFCF, indent: 1 });
    rows.push({ category: "Total Debt Service", values: consolidatedDS, indent: 1 });
    rows.push({ category: "  Principal Payments", values: consolidatedPrincipal, indent: 2 });
    rows.push({ category: "  Interest Expense", values: interestExpense, indent: 2 });
    rows.push({ category: "Free Cash Flow to Equity (FCFE)", values: consolidatedFCFE, indent: 1 });
    rows.push({ category: "Cumulative FCFE", values: cumulativeFCFE, indent: 1 });

    rows.push({ category: "", values: years.map(() => 0) });
    rows.push({ category: "Below-the-Line Items", values: years.map(() => 0), isHeader: true });
    rows.push({ category: "Interest Expense", values: interestExpense, indent: 1 });
    rows.push({ category: "Depreciation & Amortization", values: depreciation, indent: 1 });
    rows.push({ category: "Income Tax Provision", values: incomeTax, indent: 1 });
    rows.push({ category: "GAAP Net Income", values: consolidatedNetIncome, indent: 1 });

    rows.push({ category: "", values: years.map(() => 0) });
    rows.push({ category: "Key Ratios & Returns", values: years.map(() => 0), isHeader: true });
    rows.push({ category: "DSCR", values: consolidatedDSCR, indent: 1, format: "ratio" });
    rows.push({ category: "Cap Rate (%)", values: capRate, indent: 1, format: "percentage" });
    rows.push({ category: "Operating Expense Ratio (%)", values: opratio, indent: 1, format: "percentage" });
    rows.push({ category: "NOI per Room", values: years.map((_, i) => totalRooms > 0 ? consolidatedNOI[i] / totalRooms : 0), indent: 1 });
    rows.push({ category: "Revenue per Room", values: years.map((_, i) => totalRooms > 0 ? consolidatedRevenue[i] / totalRooms : 0), indent: 1 });

    rows.push({ category: "", values: years.map(() => 0) });
    rows.push({ category: "Operating Metrics", values: years.map(() => 0), isHeader: true });
    rows.push({ category: "ADR (Weighted Avg)", values: years.map((_, i) => wm[i]?.weightedADR ?? 0), indent: 1 });
    rows.push({ category: "Occupancy (%)", values: years.map((_, i) => wm[i]?.weightedOcc ?? 0), indent: 1, format: "percentage" });
    rows.push({ category: "RevPAR", values: years.map((_, i) => wm[i]?.revPAR ?? 0), indent: 1 });
    rows.push({ category: "Available Room Nights", values: years.map((_, i) => wm[i]?.totalAvailableRoomNights ?? 0), indent: 1 });
    rows.push({ category: "Sold Room Nights", values: years.map((_, i) => yc[i]?.soldRooms ?? 0), indent: 1 });

    // Free Cash Flow to Investors — matches InvestmentAnalysis.tsx FCF table
    const investorCF = years.map((_, y) => cf.reduce((sum, prop) => sum + (prop[y]?.netCashFlowToInvestors ?? 0), 0));
    const consolidatedATCF = years.map((_, y) => cf.reduce((sum, prop) => sum + (prop[y]?.atcf ?? 0), 0));
    const consolidatedBTCF = years.map((_, y) => cf.reduce((sum, prop) => sum + (prop[y]?.btcf ?? 0), 0));
    const consolidatedRefi = years.map((_, y) => cf.reduce((sum, prop) => sum + (prop[y]?.refinancingProceeds ?? 0), 0));
    const consolidatedExit = years.map((_, y) => cf.reduce((sum, prop) => sum + (prop[y]?.exitValue ?? 0), 0));
    const consolidatedTax = years.map((_, y) => cf.reduce((sum, prop) => sum + (prop[y]?.taxLiability ?? 0), 0));
    const consolidatedTaxableIncome = years.map((_, y) => cf.reduce((sum, prop) => sum + (prop[y]?.taxableIncome ?? 0), 0));

    rows.push({ category: "", values: years.map(() => 0) });
    rows.push({ category: "Free Cash Flow to Investors", values: years.map(() => 0), isHeader: true });
    rows.push({ category: "After-Tax Cash Flow (ATCF)", values: consolidatedATCF, indent: 1 });
    rows.push({ category: "Refinancing Proceeds", values: consolidatedRefi, indent: 1 });
    rows.push({ category: "Exit Proceeds", values: consolidatedExit, indent: 1 });
    rows.push({ category: "Net Cash Flow to Investors", values: investorCF, indent: 1, isBold: true });

    rows.push({ category: "", values: years.map(() => 0) });
    rows.push({ category: "Operating Cash Flow Waterfall", values: years.map(() => 0), isHeader: true });
    rows.push({ category: "Adjusted NOI (ANOI)", values: consolidatedANOI, indent: 1 });
    rows.push({ category: "Less: Debt Service", values: consolidatedDS.map(v => -v), indent: 1 });
    rows.push({ category: "Before-Tax Cash Flow (BTCF)", values: consolidatedBTCF, indent: 1, isBold: true });
    rows.push({ category: "Taxable Income", values: consolidatedTaxableIncome, indent: 2 });
    rows.push({ category: "Less: Income Tax", values: consolidatedTax.map(v => -v), indent: 2 });
    rows.push({ category: "After-Tax Cash Flow (ATCF)", values: consolidatedATCF, indent: 1, isBold: true });
  }

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
  companyName = "Portfolio",
  customFilename?: string
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
  const { saveFile: saveXlsx } = await import("./../../lib/exports/saveFile");
  const xlData = (XLSX as any).write(wb, { bookType: "xlsx", type: "array" });
  const xlBlob = new Blob([xlData], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  await saveXlsx(xlBlob, customFilename || `${safeName} - Consolidated Financial Statements.xlsx`);
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
  companyName = "Hospitality Business Group",
  customFilename?: string
): Promise<void> {
  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;
  const dims = orientation === "landscape"
    ? { w: PAGE_DIMS.LANDSCAPE_W, h: PAGE_DIMS.LANDSCAPE_H }
    : { w: PAGE_DIMS.PORTRAIT_W, h: PAGE_DIMS.PORTRAIT_H };
  const doc = new jsPDF({ orientation, unit: "mm", format: [dims.w, dims.h] });

  const pageWidth = dims.w;
  const entityTag = `${companyName} \u2014 Consolidated Portfolio`;
  const projRange = `${years[0]} \u2013 ${years[projectionYears - 1]}`;

  drawCoverPage(doc, {
    companyName,
    title,
    subtitle: `${projectionYears}-Year Financial Projection (${projRange})`,
    meta: [
      `Report: ${title}`,
      `Period: FY ${projRange}`,
      "Classification: Confidential",
    ],
  });

  doc.addPage();
  drawTitle(doc, `${companyName} \u2014 ${title}`, 14, 15);
  drawSubtitleRow(doc,
    `${projectionYears}-Year Projection (${projRange})`,
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
  const noiData = years.map((year, i) => {
    const d = getYearlyConsolidated(i);
    return { label: String(year), value: d?.noi ?? 0 };
  });
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

  addFooters(doc, companyName, { skipPages: new Set([1]) });
  const { saveFile } = await import("./../../lib/exports/saveFile");
  await saveFile(doc.output("blob"), customFilename || `portfolio-${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
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

export async function exportDashboardComprehensivePDF(params: ComprehensiveDashboardExportParams, customFilename?: string): Promise<void> {
  const {
    financials, properties, projectionYears, getFiscalYear,
    companyName = "Hospitality Business Group",
    incomeRows, modelStartDate,
  } = params;

  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [PAGE_DIMS.LANDSCAPE_W, PAGE_DIMS.LANDSCAPE_H] });
  const pageW = PAGE_DIMS.LANDSCAPE_W;
  const pageH = PAGE_DIMS.LANDSCAPE_H;
  const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));
  const entityTag = `${companyName} \u2014 Consolidated Portfolio`;
  const dateStr = format(new Date(), "MMMM d, yyyy");
  const projRange = `${years[0]} \u2013 ${years[years.length - 1]}`;

  const NAVY: [number, number, number] = [26, 35, 50];
  const SAGE: [number, number, number] = [159, 188, 164];

  function drawPageChrome() {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageW, 1.5, "F");
    doc.setFillColor(...SAGE);
    doc.rect(0, 1.5, pageW, 0.8, "F");
    doc.setFillColor(...NAVY);
    doc.rect(0, pageH - 1.5, pageW, 1.5, "F");
    doc.setFillColor(...SAGE);
    doc.rect(0, pageH - 2.3, pageW, 0.8, "F");
    doc.setDrawColor(...SAGE);
    doc.setLineWidth(0.3);
    doc.line(10, 6, 10, pageH - 6);
    doc.line(pageW - 10, 6, pageW - 10, pageH - 6);
  }

  function drawSectionTitle(title: string, subtitle?: string): number {
    drawPageChrome();
    doc.setFillColor(...NAVY);
    doc.rect(16, 10, pageW - 32, 22, "F");
    doc.setFillColor(...SAGE);
    doc.rect(16, 30, pageW - 32, 1.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(title, 22, 22);
    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...SAGE);
      doc.text(subtitle, 22, 28);
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(200, 200, 200);
    doc.text(companyName, pageW - 22, 22, { align: "right" });
    return 38;
  }

  drawCoverPage(doc, {
    companyName,
    title: "Consolidated Portfolio Report",
    subtitle: `${projectionYears}-Year Financial Projection (${projRange})`,
    meta: [
      `Portfolio: ${properties.length} Properties \u2014 ${financials.totalRooms} Rooms`,
      `Period: FY ${projRange}`,
      "Classification: Confidential",
    ],
    dateStr,
  });

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
  drawPageChrome();
  drawDashboardSummaryPage(doc, pageW, entityTag, companyName, metrics, propertyTable);

  function withChrome(config: Record<string, any>): Record<string, any> {
    const origDidDrawPage = config.didDrawPage;
    return {
      ...config,
      didDrawPage: (data: any) => {
        if (data.pageNumber > 1) drawPageChrome();
        if (origDidDrawPage) origDidDrawPage(data);
      },
    };
  }

  doc.addPage();
  let startY = drawSectionTitle("Consolidated Income Statement (USALI)", `${projectionYears}-Year Projection (${projRange})`);
  const incomeConfig = buildFinancialTableConfig(years, incomeRows, "landscape", startY);
  autoTable(doc, withChrome(incomeConfig));

  doc.addPage();
  const cashFlowData = generatePortfolioCashFlowData(
    financials.allPropertyYearlyCF, projectionYears, getFiscalYear,
    new Set(["cfo", "cfi", "cff"]), false,
    properties.map(p => p.name),
  );
  startY = drawSectionTitle("Consolidated Cash Flow Statement", `${projectionYears}-Year Projection (${projRange})`);
  const cfConfig = buildFinancialTableConfig(cashFlowData.years, cashFlowData.rows, "landscape", startY);
  autoTable(doc, withChrome(cfConfig));

  doc.addPage();
  const balanceSheetData = generatePortfolioBalanceSheetData(
    financials.allPropertyFinancials, projectionYears, getFiscalYear, modelStartDate,
  );
  startY = drawSectionTitle("Consolidated Balance Sheet", `${projectionYears}-Year Projection (${projRange})`);
  const bsConfig = buildFinancialTableConfig(balanceSheetData.years, balanceSheetData.rows, "landscape", startY);
  autoTable(doc, withChrome(bsConfig));

  doc.addPage();
  const investmentData = generatePortfolioInvestmentData(financials, properties, projectionYears, getFiscalYear);
  startY = drawSectionTitle("Portfolio Investment Analysis", `${projectionYears}-Year Projection (${projRange})`);
  const invConfig = buildFinancialTableConfig(investmentData.years, investmentData.rows, "landscape", startY);
  autoTable(doc, withChrome(invConfig));

  doc.addPage();
  startY = drawSectionTitle(`Performance Trend`, `${projectionYears}-Year Revenue, Operating Expenses, and Adjusted NOI`);

  const chartData = years.map((year, i) => ({
    label: String(year),
    value: financials.yearlyConsolidatedCache[i]?.revenueTotal ?? 0,
  }));
  const noiData = years.map((year, i) => {
    const d = financials.yearlyConsolidatedCache[i];
    return { label: String(year), value: d?.noi ?? 0 };
  });
  const expenseData = years.map((year, i) => ({
    label: String(year),
    value: financials.yearlyConsolidatedCache[i]?.totalExpenses ?? 0,
  }));

  drawLineChart({
    doc,
    x: 16,
    y: startY,
    width: pageW - 32,
    height: 140,
    title: `Portfolio Performance (${projectionYears}-Year Projection)`,
    series: [
      { name: "Revenue", data: chartData, color: "#7C3AED" },
      { name: "Operating Expenses", data: expenseData, color: "#2563EB" },
      { name: "ANOI", data: noiData, color: "#257D41" },
    ],
  });

  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg);
    if (pg === 1) continue;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(153, 153, 153);
    doc.text(companyName, 16, pageH - 5);
    doc.text("CONFIDENTIAL", pageW / 2, pageH - 5, { align: "center" });
    doc.text(`${pg} / ${totalPages}`, pageW - 16, pageH - 5, { align: "right" });
  }

  const { saveFile: savePdfFile } = await import("./../../lib/exports/saveFile");
  await savePdfFile(doc.output("blob"), customFilename || `${companyName} - Consolidated Portfolio Report.pdf`);
}

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
    await originalExportPortfolioPPTX(data, companyName, customFilename);
  },

  exportToPNG: (ref: React.RefObject<HTMLElement>, filename = "portfolio-income-statement.png") => {
    if (ref.current) {
      exportTablePNG({ element: ref.current, filename });
    }
  },
};
