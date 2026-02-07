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
