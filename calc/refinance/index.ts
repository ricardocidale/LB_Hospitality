export { computeRefinance } from "./refinance-calculator.js";
export { pmt, ioPayment } from "./pmt.js";
export { computePayoff, type PayoffResult } from "./payoff.js";
export {
  computeSizing,
  resolvePropertyValue,
  type SizingResult,
} from "./sizing.js";
export { buildSchedule } from "./schedule.js";
export { buildJournalHooks, type JournalHookInputs } from "./journal-hooks.js";
export { validateRefinanceInput } from "./validate.js";
export type {
  RefinanceInput,
  RefinanceOutput,
  RefinanceFlags,
  ScheduleEntry,
  ProceedsLineItem,
  PrepaymentPenalty,
  PrepaymentPenaltyType,
  NewLoanTerms,
  PropertyValuation,
} from "./types.js";
