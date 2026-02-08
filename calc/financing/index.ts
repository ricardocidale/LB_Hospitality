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
