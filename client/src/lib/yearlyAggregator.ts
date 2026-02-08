// Shared monthly-to-yearly aggregation for property financials.
// Single source of truth — replaces 6 independent implementations across
// Dashboard, PropertyDetail, YearlyIncomeStatement, YearlyCashFlowStatement,
// and excelExport that each reimplemented the same slice-and-reduce pattern.

import type { MonthlyFinancials } from "./financialEngine";

/** Superset of all yearly fields needed by IS, CF, BS, and export consumers. */
export interface YearlyPropertyFinancials {
  year: number;

  // Room metrics (SUM)
  soldRooms: number;
  availableRooms: number;

  // Revenue (SUM)
  revenueRooms: number;
  revenueEvents: number;
  revenueFB: number;
  revenueOther: number;
  revenueTotal: number;

  // Operating Expenses (SUM)
  expenseRooms: number;
  expenseFB: number;
  expenseEvents: number;
  expenseOther: number;
  expenseOtherCosts: number;
  expenseMarketing: number;
  expensePropertyOps: number;
  expenseUtilitiesVar: number;
  expenseUtilitiesFixed: number;
  expenseUtilities: number; // derived: var + fixed
  expenseAdmin: number;
  expenseIT: number;
  expenseInsurance: number;
  expenseTaxes: number;
  expenseFFE: number;

  // Fees (SUM)
  feeBase: number;
  feeIncentive: number;

  // Profitability (SUM)
  totalExpenses: number;
  gop: number;
  noi: number;

  // Below-the-line (SUM)
  interestExpense: number;
  depreciationExpense: number;
  incomeTax: number;
  netIncome: number;

  // Financing (SUM)
  principalPayment: number;
  debtPayment: number;
  refinancingProceeds: number;

  // Cash Flow (SUM except endingCash)
  cashFlow: number;
  operatingCashFlow: number;
  financingCashFlow: number;
  endingCash: number; // PICK-LAST: last month of year
}

/** Fields summed directly from MonthlyFinancials via reduce. */
const SUM_FIELDS = [
  "soldRooms", "availableRooms",
  "revenueRooms", "revenueEvents", "revenueFB", "revenueOther", "revenueTotal",
  "expenseRooms", "expenseFB", "expenseEvents", "expenseOther",
  "expenseOtherCosts", "expenseMarketing", "expensePropertyOps",
  "expenseUtilitiesVar", "expenseUtilitiesFixed",
  "expenseAdmin", "expenseIT", "expenseInsurance", "expenseTaxes", "expenseFFE",
  "feeBase", "feeIncentive", "totalExpenses", "gop", "noi",
  "interestExpense", "depreciationExpense", "incomeTax", "netIncome",
  "principalPayment", "debtPayment", "refinancingProceeds",
  "cashFlow", "operatingCashFlow", "financingCashFlow",
] as const;

/**
 * Aggregate engine monthly data into yearly property financials.
 *
 * All values come from the engine's MonthlyFinancials — nothing is re-derived.
 * endingCash uses the last month of each year (pick-last, not sum).
 * expenseUtilities is derived as var + fixed.
 */
export function aggregatePropertyByYear(
  data: MonthlyFinancials[],
  years: number,
): YearlyPropertyFinancials[] {
  const results: YearlyPropertyFinancials[] = [];

  for (let y = 0; y < years; y++) {
    const yearData = data.slice(y * 12, (y + 1) * 12);
    if (yearData.length === 0) continue;

    // Single-pass accumulation for all sum fields
    const sums: Record<string, number> = {};
    for (const field of SUM_FIELDS) sums[field] = 0;
    for (const m of yearData) {
      for (const field of SUM_FIELDS) {
        sums[field] += (m as unknown as Record<string, number>)[field] ?? 0;
      }
    }

    results.push({
      year: y,
      soldRooms: sums.soldRooms,
      availableRooms: sums.availableRooms,
      revenueRooms: sums.revenueRooms,
      revenueEvents: sums.revenueEvents,
      revenueFB: sums.revenueFB,
      revenueOther: sums.revenueOther,
      revenueTotal: sums.revenueTotal,
      expenseRooms: sums.expenseRooms,
      expenseFB: sums.expenseFB,
      expenseEvents: sums.expenseEvents,
      expenseOther: sums.expenseOther,
      expenseOtherCosts: sums.expenseOtherCosts,
      expenseMarketing: sums.expenseMarketing,
      expensePropertyOps: sums.expensePropertyOps,
      expenseUtilitiesVar: sums.expenseUtilitiesVar,
      expenseUtilitiesFixed: sums.expenseUtilitiesFixed,
      expenseUtilities: sums.expenseUtilitiesVar + sums.expenseUtilitiesFixed,
      expenseAdmin: sums.expenseAdmin,
      expenseIT: sums.expenseIT,
      expenseInsurance: sums.expenseInsurance,
      expenseTaxes: sums.expenseTaxes,
      expenseFFE: sums.expenseFFE,
      feeBase: sums.feeBase,
      feeIncentive: sums.feeIncentive,
      totalExpenses: sums.totalExpenses,
      gop: sums.gop,
      noi: sums.noi,
      interestExpense: sums.interestExpense,
      depreciationExpense: sums.depreciationExpense,
      incomeTax: sums.incomeTax,
      netIncome: sums.netIncome,
      principalPayment: sums.principalPayment,
      debtPayment: sums.debtPayment,
      refinancingProceeds: sums.refinancingProceeds,
      cashFlow: sums.cashFlow,
      operatingCashFlow: sums.operatingCashFlow,
      financingCashFlow: sums.financingCashFlow,
      endingCash: yearData[yearData.length - 1].endingCash,
    });
  }

  return results;
}
