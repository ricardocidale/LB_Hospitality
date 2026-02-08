// Shared yearly cash flow aggregation from engine monthly data.
// Single source of truth — used by YearlyCashFlowStatement, excelExport, and PropertyDetail.
// Replaces the dual-path issue where exports independently re-derived debt/depreciation/tax.

import { MonthlyFinancials } from "@/lib/financialEngine";
import {
  LoanParams,
  GlobalLoanParams,
  calculateLoanParams,
  getAcquisitionYear,
  YearlyCashFlowResult,
} from "@/lib/loanCalculations";
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
    const interestExpense = yearData.reduce((a, m) => a + m.interestExpense, 0);
    const principalPayment = yearData.reduce((a, m) => a + m.principalPayment, 0);
    const debtService = yearData.reduce((a, m) => a + m.debtPayment, 0);
    const depreciationExpense = yearData.reduce((a, m) => a + m.depreciationExpense, 0);
    const taxLiability = yearData.reduce((a, m) => a + m.incomeTax, 0);
    const netIncome = yearData.reduce((a, m) => a + m.netIncome, 0);
    const refiProceeds = yearData.reduce((a, m) => a + m.refinancingProceeds, 0);
    const expenseFFE = yearData.reduce((a, m) => a + m.expenseFFE, 0);

    const operatingCashFlow = netIncome + depreciationExpense;
    const workingCapitalChange = 0;
    const cashFromOperations = operatingCashFlow + workingCapitalChange;
    const freeCashFlow = cashFromOperations - expenseFFE;
    const freeCashFlowToEquity = freeCashFlow - principalPayment;
    const btcf = noi - debtService;
    const taxableIncome = noi - interestExpense - depreciationExpense;
    const atcf = btcf - taxLiability;

    // Capital events (exit only in final year)
    const exitCapRate = property.exitCapRate ?? global?.exitCapRate ?? DEFAULT_EXIT_CAP_RATE;
    const commissionRate = global?.salesCommissionRate ?? global?.commissionRate ?? DEFAULT_COMMISSION_RATE;
    const isLastYear = y === years - 1;
    const lastYearNOI = noi;
    let exitValue = 0;
    if (isLastYear && exitCapRate > 0) {
      const grossValue = lastYearNOI / exitCapRate;
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
