/**
 * calc/returns/index.ts — Public barrel export for the Returns module.
 *
 * Re-exports every function and type from the returns sub-modules:
 *   - computeDCF: Discounted Cash Flow / Net Present Value calculation
 *   - buildIRRVector: Assembles and validates the cash flow vector for IRR computation
 *   - computeEquityMultiple: Total distributions / total invested (MOIC)
 *   - computeExitValuation: Direct capitalization exit pricing and net-to-equity waterfall
 *
 * Together, these four skills produce the complete investment return picture:
 * IRR (annualized time-weighted return), equity multiple (absolute return),
 * NPV (value in today's dollars), and exit proceeds (terminal cash event).
 */
export { computeDCF } from "./dcf-npv.js";
export type { DCFInput, DCFOutput } from "./dcf-npv.js";

export { buildIRRVector } from "./irr-vector.js";
export type { IRRVectorInput, IRRVectorOutput } from "./irr-vector.js";

export { computeEquityMultiple } from "./equity-multiple.js";
export type { EquityMultipleInput, EquityMultipleOutput } from "./equity-multiple.js";

export { computeExitValuation } from "./exit-valuation.js";
export type { ExitValuationInput, ExitValuationOutput } from "./exit-valuation.js";
