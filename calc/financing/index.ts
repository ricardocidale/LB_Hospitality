/**
 * calc/financing/index.ts — Public barrel export for the Financing module.
 *
 * Re-exports every function and type from the financing sub-modules so that
 * consumers can import from `calc/financing` without knowing the internal file
 * structure. Includes:
 *   - computeFinancing: Acquisition loan sizing, closing costs, schedule, journal hooks
 *   - computeAcqSizing: LTV-based or override-based loan amount determination
 *   - computeClosingCosts: Percentage + fixed fee breakdown
 *   - buildAcqJournalHooks: GAAP journal entries for loan origination
 *   - validateFinancingInput: Input guard rail validation
 *   - computeDSCR: DSCR-based max loan sizing
 *   - computeDebtYield: Debt yield ratio and reverse sizing
 *   - computeSensitivity: Rate × NOI DSCR stress-test matrix
 *   - compareLoanScenarios: Side-by-side comparison of loan structures
 *   - computePrepayment: Yield maintenance, step-down, and defeasance penalties
 *   - computeInterestRateSwap: Swap cash flows and scenario analysis
 */
export { computeFinancing } from "./financing-calculator.js";
export { computeAcqSizing, type AcqSizingResult } from "./sizing.js";
export { computeClosingCosts } from "./closing-costs.js";
export { buildAcqJournalHooks, type AcqJournalHookInputs } from "./journal-hooks.js";
export { validateFinancingInput } from "./validate.js";
export type {
  FinancingInput,
  FinancingOutput,
  FinancingFlags,
  ClosingCostBreakdown,
  LoanType,
  NewLoanTerms,
  ScheduleEntry,
} from "./types.js";

export { computeDSCR } from "./dscr-calculator.js";
export type { DSCRInput, DSCROutput } from "./dscr-calculator.js";

export { computeDebtYield } from "./debt-yield.js";
export type { DebtYieldInput, DebtYieldOutput } from "./debt-yield.js";

export { computeSensitivity } from "./sensitivity.js";
export type {
  SensitivityInput,
  SensitivityOutput,
  SensitivityCell,
} from "./sensitivity.js";

export { compareLoanScenarios } from "./loan-comparison.js";
export type {
  LoanScenario,
  LoanScenarioResult,
  LoanComparisonDelta,
  LoanComparisonOutput,
} from "./loan-comparison.js";

export { computePrepayment } from "./prepayment.js";
export type {
  PrepaymentInput,
  PrepaymentOutput,
  PrepaymentType,
  PrepaymentDetails,
  YieldMaintenanceDetails,
  StepDownDetails,
  DefeasanceDetails,
} from "./prepayment.js";

export { computeInterestRateSwap } from "./interest-rate-swap.js";
export type {
  InterestRateSwapInput,
  InterestRateSwapOutput,
  SwapPeriodCashFlow,
  SwapScenarioResult,
} from "./interest-rate-swap.js";
