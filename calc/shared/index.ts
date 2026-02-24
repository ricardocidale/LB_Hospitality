/**
 * calc/shared/index.ts — Public barrel export for shared calculation primitives.
 *
 * Re-exports the foundational building blocks used by all calculation modules:
 *   - pmt / ioPayment: Loan payment functions (PMT formula and interest-only payment).
 *   - buildSchedule: Month-by-month amortization schedule builder.
 *   - NewLoanTerms / ScheduleEntry: Core types for debt service modeling.
 *
 * These primitives are "shared" because they are used by both the financing module
 * (acquisition loans) and the refinance module (replacement loans). Centralizing
 * them here ensures consistent payment calculations across all debt instruments.
 */
export { pmt, ioPayment } from "./pmt.js";
export { buildSchedule } from "./schedule.js";
export type { NewLoanTerms, ScheduleEntry } from "./types.js";
