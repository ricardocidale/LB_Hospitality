/**
 * calc/validation/index.ts — Public barrel export for the Validation module.
 *
 * Re-exports every function and type from the validation sub-modules:
 *   - validateFinancialIdentities: GAAP accounting identity checks (A=L+E, OCF, etc.)
 *   - checkFundingGates: Funding timing, no-negative-cash, debt-free-at-exit gates
 *   - reconcileSchedule: Amortization schedule vs. engine output reconciliation
 *   - checkAssumptionConsistency: Pre-flight input validation and range checks
 *   - verifyExport: Post-export data integrity spot-checks
 *
 * Together these five validators form the "verification layer" that sits between
 * the calculation engine and the user-facing reports. Every number displayed in
 * the UI has been checked by at least one of these validators.
 */
export { validateFinancialIdentities } from "./financial-identities.js";
export type { FinancialIdentitiesInput, FinancialIdentitiesOutput } from "./financial-identities.js";

export { checkFundingGates } from "./funding-gates.js";
export type { FundingGateInput, FundingGateOutput } from "./funding-gates.js";

export { reconcileSchedule } from "./schedule-reconcile.js";
export type { ScheduleReconcileInput, ScheduleReconcileOutput } from "./schedule-reconcile.js";

export { checkAssumptionConsistency } from "./assumption-consistency.js";
export type { AssumptionConsistencyInput, AssumptionConsistencyOutput } from "./assumption-consistency.js";

export { verifyExport } from "./export-verification.js";
export type { ExportVerificationInput, ExportVerificationOutput } from "./export-verification.js";
