import type { IndependentMonthlyResult, ClientPropertyMonthly } from "../types";

export interface PortfolioTotals {
  revenue: number;
  feeBase: number;
  feeIncentive: number;
}

/**
 * Sum revenue and fees across all properties and all months (server-side calcs).
 * Replaces the repeated nested-loop aggregation in portfolio-checks.ts.
 */
export function sumServerPortfolioTotals(
  allCalcs: IndependentMonthlyResult[][]
): PortfolioTotals {
  let revenue = 0;
  let feeBase = 0;
  let feeIncentive = 0;
  for (const propCalc of allCalcs) {
    for (const m of propCalc) {
      revenue      += m.revenueTotal;
      feeBase      += m.feeBase;
      feeIncentive += m.feeIncentive;
    }
  }
  return { revenue, feeBase, feeIncentive };
}

/**
 * Sum revenue and fees across all properties and all months (client-side results).
 */
export function sumClientPortfolioTotals(
  clientResults: ClientPropertyMonthly[][]
): PortfolioTotals {
  let revenue = 0;
  let feeBase = 0;
  let feeIncentive = 0;
  for (const propMonthly of clientResults) {
    for (const m of propMonthly) {
      revenue      += m.revenueTotal;
      feeBase      += m.feeBase;
      feeIncentive += m.feeIncentive;
    }
  }
  return { revenue, feeBase, feeIncentive };
}
