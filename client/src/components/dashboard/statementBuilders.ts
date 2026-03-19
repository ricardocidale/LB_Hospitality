import type { DashboardFinancials } from "./types";
import type { Property } from "@shared/schema";
import type { YearlyPropertyFinancials } from "@/lib/financial/yearlyAggregator";
import type { YearlyCashFlowResult } from "@/lib/financial/loanCalculations";
import type { MonthlyFinancials } from "@/lib/financialEngine";
import { propertyEquityInvested, acquisitionYearIndex } from "@/lib/financial/equityCalculations";
import { yearEndSlice, sumMonthlyField, propertyPPE } from "@/lib/financial/portfolio-helpers";

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

export function toExportData(data: ExportData): { years: string[]; rows: { category: string; values: number[]; indent?: number; isBold?: boolean; isHeader?: boolean }[] } {
  return {
    years: data.years.map(String),
    rows: data.rows.map(r => ({ category: r.category, values: r.values, indent: r.indent, isBold: r.isBold ?? r.isHeader, isHeader: r.isHeader })),
  };
}

export const BS_TOTAL_ASSETS = "TOTAL ASSETS";
export const BS_MORTGAGE_NOTES = "Mortgage Notes Payable";
export const BS_PAID_IN_CAPITAL = "Paid-In Capital";
export const BS_RETAINED_EARNINGS = "Retained Earnings";
export const BS_TOTAL_LIABILITIES_EQUITY = "TOTAL LIABILITIES & EQUITY";

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

      const relevantMonths = yearEndSlice(financials, yearIdx);
      const lastMonth = relevantMonths[relevantMonths.length - 1];

      if (!lastMonth) return;

      const ppe = propertyPPE(property.purchasePrice, property.buildingImprovements);
      const accDep = sumMonthlyField(relevantMonths, "depreciationExpense");
      
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
  rows.push({ category: BS_TOTAL_ASSETS, values: yearlyData.map(d => d.totalAssets), isHeader: true });

  rows.push({ category: "LIABILITIES & EQUITY", values: years.map(() => 0), isHeader: true });
  if (!summaryOnly) {
    rows.push({ category: BS_MORTGAGE_NOTES, values: yearlyData.map(d => d.debt), indent: 1 });
    rows.push({ category: BS_PAID_IN_CAPITAL, values: yearlyData.map(d => d.equity), indent: 1 });
    rows.push({ category: BS_RETAINED_EARNINGS, values: yearlyData.map(d => d.retainedEarnings), indent: 1 });
  }
  rows.push({ category: BS_TOTAL_LIABILITIES_EQUITY, values: yearlyData.map(d => d.totalLiabilitiesEquity), isHeader: true });

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

    if (properties.length > 0 && cf.length > 0) {
      rows.push({ category: "", values: years.map(() => 0) });
      rows.push({ category: "Per-Property Returns", values: years.map(() => 0), isHeader: true });
      properties.forEach((prop, pi) => {
        const propCF = cf[pi] || [];
        const equity = propertyEquityInvested(prop);
        const exitVal = propCF[projectionYears - 1]?.exitValue ?? 0;
        const propATCF = years.map((_, y) => propCF[y]?.atcf ?? 0);
        const avgCF = propATCF.reduce((s, v) => s + v, 0) / projectionYears;
        const propCoC = equity > 0 ? (avgCF / equity) * 100 : 0;

        rows.push({ category: prop.name || `Property ${pi + 1}`, values: years.map(() => 0), isHeader: true, indent: 1 });
        rows.push({ category: "Equity Invested", values: years.map(() => equity), indent: 2 });
        rows.push({ category: "Annual ATCF", values: propATCF, indent: 2 });
        rows.push({ category: "Exit Value", values: years.map((_, y) => y === projectionYears - 1 ? exitVal : 0), indent: 2 });
        rows.push({ category: "Cash-on-Cash (%)", values: years.map(() => propCoC / 100), indent: 2, format: "percentage" });
      });
    }
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
