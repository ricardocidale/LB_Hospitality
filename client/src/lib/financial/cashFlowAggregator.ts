/**
 * cashFlowAggregator — GAAP indirect-method yearly cash flow builder
 *
 * Single source of truth for YearlyCashFlowResult[] — consumed by
 * YearlyCashFlowStatement, excelExport, and PropertyDetail.
 *
 * All debt service, depreciation, tax, and refinance values are read directly
 * from the engine's MonthlyFinancials — nothing is recomputed here.
 * This eliminates the dual-path problem where statement and export rows
 * diverged because exports independently re-derived these values.
 *
 * GAAP indirect method (ASC 230):
 *   Operating CF  = Net Income + Depreciation add-back
 *   Financing CF  = -Principal + Refinancing Proceeds
 *   Cash from ops = Operating CF (working capital change modeled as 0)
 *
 * Exit year annualization: in the final year the exit sale proceeds are
 * added to the last-year cash flow. The function caller is responsible
 * for computing and passing those proceeds separately.
 */

import { MonthlyFinancials } from "@/lib/financialEngine";
import {
  LoanParams,
  GlobalLoanParams,
  calculateLoanParams,
  getAcquisitionYear,
  YearlyCashFlowResult,
} from "./loanCalculations";
import { DEFAULT_EXIT_CAP_RATE, DEFAULT_COMMISSION_RATE } from "@/lib/constants";

/**
 * Aggregate monthly engine data into yearly YearlyCashFlowResult[].
 *
 * All debt, depreciation, tax, and refinance values come from the engine's
 * monthly calculations — nothing is re-derived. This guarantees that IS, CF,
 * BS, and all exports use identical numbers.
 */
export function aggregateCashFlowByYear(
  data: MonthlyFinancials[],
  property: LoanParams,
  global: GlobalLoanParams | undefined,
  years: number
): YearlyCashFlowResult[] {
  const loan = calculateLoanParams(property, global);
  const acquisitionYear = getAcquisitionYear(loan);
  const results: YearlyCashFlowResult[] = [];
  let cumulative = 0;

  for (let y = 0; y < years; y++) {
    const yearData = data.slice(y * 12, (y + 1) * 12);
    const noi = yearData.reduce((a, m) => a + m.noi, 0);
    const anoi = yearData.reduce((a, m) => a + m.anoi, 0);
    const interestExpense = yearData.reduce((a, m) => a + m.interestExpense, 0);
    const principalPayment = yearData.reduce((a, m) => a + m.principalPayment, 0);
    const debtService = yearData.reduce((a, m) => a + m.debtPayment, 0);
    const depreciationExpense = yearData.reduce((a, m) => a + m.depreciationExpense, 0);
    const taxLiability = yearData.reduce((a, m) => a + m.incomeTax, 0);
    const netIncome = yearData.reduce((a, m) => a + m.netIncome, 0);
    const refiProceeds = yearData.reduce((a, m) => a + m.refinancingProceeds, 0);
    const expenseFFE = yearData.reduce((a, m) => a + m.expenseFFE, 0);

    const operatingCashFlow = netIncome + depreciationExpense;
    const workingCapitalChange = yearData.reduce((a, m) => a + m.workingCapitalChange, 0);
    const cashFromOperations = operatingCashFlow - workingCapitalChange;
    const freeCashFlow = cashFromOperations;
    const freeCashFlowToEquity = freeCashFlow - principalPayment;
    const btcf = anoi - debtService;
    const taxableIncome = anoi - interestExpense - depreciationExpense;
    const atcf = btcf - taxLiability;

    // Capital events (exit only in final year)
    // BUG FIX: If the final projection year has fewer than 12 operational months
    // (property started mid-year or model ends mid-year), annualize the NOI
    // before applying the exit cap rate. Using partial-year NOI directly would
    // understate exit value and destroy investor returns.
    const exitCapRate = property.exitCapRate ?? global?.exitCapRate ?? DEFAULT_EXIT_CAP_RATE;
    const commissionRate = property.dispositionCommission ?? DEFAULT_COMMISSION_RATE;
    const isLastYear = y === years - 1;
    const operationalMonthsInYear = yearData.filter(m => m.revenueTotal > 0 || m.noi !== 0).length;
    const annualizedNOI = operationalMonthsInYear >= 12
      ? noi
      : operationalMonthsInYear > 0
        ? (noi / operationalMonthsInYear) * 12
        : 0;
    let exitValue = 0;
    if (isLastYear && exitCapRate > 0) {
      const grossValue = annualizedNOI / exitCapRate;
      const commission = grossValue * commissionRate;
      const outstandingDebt = yearData.length > 0 ? yearData[yearData.length - 1].debtOutstanding : 0;
      exitValue = grossValue - commission - outstandingDebt;
    }

    const capitalExpenditures = y === acquisitionYear ? loan.equityInvested : 0;
    const netCashFlowToInvestors = atcf + refiProceeds + (isLastYear ? exitValue : 0) - (y === acquisitionYear ? loan.equityInvested : 0);
    cumulative += netCashFlowToInvestors;

    results.push({
      year: y,
      noi,
      anoi,
      interestExpense,
      depreciation: depreciationExpense,
      netIncome,
      taxLiability,
      operatingCashFlow,
      workingCapitalChange,
      cashFromOperations,
      maintenanceCapex: expenseFFE,
      freeCashFlow,
      principalPayment,
      debtService,
      freeCashFlowToEquity,
      btcf,
      taxableIncome,
      atcf,
      capitalExpenditures,
      refinancingProceeds: refiProceeds,
      exitValue,
      netCashFlowToInvestors,
      cumulativeCashFlow: cumulative,
    });
  }

  return results;
}
