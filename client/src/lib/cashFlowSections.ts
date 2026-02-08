/**
 * cashFlowSections — Shared ASC 230 Cash Flow Sections computation
 *
 * Extracts the CFO/CFI/CFF/FCF/FCFE math that was independently
 * reimplemented in 4 locations (YearlyCashFlowStatement, excelExport ×2,
 * PropertyDetail CSV export). Single source of truth for:
 *   - Cash from Operations (CFO)
 *   - Cash from Investing (CFI)
 *   - Cash from Financing (CFF)
 *   - Net Change in Cash + Opening/Closing balances
 *   - Free Cash Flow (FCF) and Free Cash Flow to Equity (FCFE)
 */

import { YearlyPropertyFinancials } from "./yearlyAggregator";
import { YearlyCashFlowResult } from "./loanCalculations";

export interface CashFlowSections {
  cashFromOperations: number[];
  cashFromInvesting: number[];
  cashFromFinancing: number[];
  netChangeCash: number[];
  openingCash: number[];
  closingCash: number[];
  fcf: number[];
  fcfe: number[];
}

export function computeCashFlowSections(
  yearlyIS: YearlyPropertyFinancials[],
  yearlyCF: YearlyCashFlowResult[],
  loan: { equityInvested: number; loanAmount: number },
  acquisitionYear: number,
  totalPropertyCost: number,
  years: number,
): CashFlowSections {
  const cashFromOperations: number[] = [];
  const cashFromInvesting: number[] = [];
  const cashFromFinancing: number[] = [];
  const netChangeCash: number[] = [];
  const openingCash: number[] = [];
  const closingCash: number[] = [];
  const fcf: number[] = [];
  const fcfe: number[] = [];

  let runningCash = 0;

  for (let i = 0; i < years; i++) {
    const is = yearlyIS[i];
    const cf = yearlyCF[i];

    // ASC 230 — Operating: Revenue less operating expenses (ex-FFE), interest, taxes
    const cfo = is.revenueTotal - (is.totalExpenses - is.expenseFFE) - cf.interestExpense - cf.taxLiability;

    // ASC 230 — Investing: Acquisition, FF&E capex, sale proceeds
    const acqCost = i === acquisitionYear ? totalPropertyCost : 0;
    const cfi = -acqCost - is.expenseFFE + cf.exitValue;

    // ASC 230 — Financing: Equity, loan proceeds, principal repayment, refinancing
    const eqContrib = i === acquisitionYear ? loan.equityInvested : 0;
    const loanProceeds = i === acquisitionYear && loan.loanAmount > 0 ? loan.loanAmount : 0;
    const cff = eqContrib + loanProceeds - cf.principalPayment + cf.refinancingProceeds;

    const net = cfo + cfi + cff;

    cashFromOperations.push(cfo);
    cashFromInvesting.push(cfi);
    cashFromFinancing.push(cff);
    netChangeCash.push(net);

    openingCash.push(runningCash);
    runningCash += net;
    closingCash.push(runningCash);

    // Free Cash Flow = CFO - Capital Expenditures (FF&E)
    const fcfVal = cfo - is.expenseFFE;
    fcf.push(fcfVal);

    // Free Cash Flow to Equity = FCF - Principal Payments
    fcfe.push(fcfVal - cf.principalPayment);
  }

  return {
    cashFromOperations,
    cashFromInvesting,
    cashFromFinancing,
    netChangeCash,
    openingCash,
    closingCash,
    fcf,
    fcfe,
  };
}
