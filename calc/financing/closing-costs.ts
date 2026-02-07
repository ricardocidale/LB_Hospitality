import type { ClosingCostBreakdown } from "./types.js";
import type { RoundingPolicy } from "../../domain/types/rounding.js";
import { roundTo } from "../../domain/types/rounding.js";

export function computeClosingCosts(
  loanAmount: number,
  closingCostPct: number,
  fixedFees: number,
  rounding: RoundingPolicy,
): ClosingCostBreakdown {
  const pctBased = roundTo(loanAmount * closingCostPct, rounding);
  const fixed = roundTo(fixedFees, rounding);
  return {
    pct_based: pctBased,
    fixed_fees: fixed,
    total: roundTo(pctBased + fixed, rounding),
  };
}
