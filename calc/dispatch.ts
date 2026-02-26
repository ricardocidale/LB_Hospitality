/**
 * dispatch.ts — Computation Tool Router
 *
 * This file provides a clean dispatch mechanism for executing financial computation
 * tools by name. It maps tool names (strings) to their handler functions, making it
 * easy to invoke any calculation module from a single entry point.
 *
 * The dispatched tools fall into three categories:
 *
 *   Returns Calculations:
 *     - calculate_dcf_npv: Discounted Cash Flow / Net Present Value
 *     - build_irr_cashflow_vector: Internal Rate of Return cash flow construction
 *     - compute_equity_multiple: Total return as a multiple of invested equity
 *     - exit_valuation: Property sale value using cap rate method
 *
 *   Validation Checks:
 *     - validate_financial_identities: Verify math relationships (Revenue = ADR × Rooms, etc.)
 *     - funding_gate_checks: Ensure funding prerequisites are met before spend
 *     - schedule_reconcile: Verify loan schedule balances tie out
 *     - assumption_consistency_check: Flag conflicting or unreasonable inputs
 *     - export_verification: Ensure exported data matches internal calculations
 *
 *   Analysis Tools:
 *     - consolidate_statements: Combine multiple properties into portfolio view (ASC 810)
 *     - scenario_compare: Side-by-side comparison of different assumption sets
 *     - break_even_analysis: Find occupancy/ADR needed to cover costs
 *
 * The withRounding wrapper ensures all monetary calculations use consistent 2-decimal
 * rounding (no banker's rounding) unless the tool handles rounding itself.
 *
 * Usage: executeComputationTool("calculate_dcf_npv", { cashFlows, discountRate, ... })
 * Returns: JSON string of the result, or null if the tool name is not recognized.
 */
import { DEFAULT_ROUNDING } from "./shared/utils.js";
import { computeDCF } from "./returns/dcf-npv.js";
import { buildIRRVector } from "./returns/irr-vector.js";
import { computeEquityMultiple } from "./returns/equity-multiple.js";
import { computeExitValuation } from "./returns/exit-valuation.js";
import { validateFinancialIdentities } from "./validation/financial-identities.js";
import { checkFundingGates } from "./validation/funding-gates.js";
import { reconcileSchedule } from "./validation/schedule-reconcile.js";
import { checkAssumptionConsistency } from "./validation/assumption-consistency.js";
import { verifyExport } from "./validation/export-verification.js";
import { consolidateStatements } from "./analysis/consolidation.js";
import { compareScenarios } from "./analysis/scenario-compare.js";
import { computeBreakEven } from "./analysis/break-even.js";

type ToolInput = Record<string, unknown>;
type ToolFn = (input: never) => unknown;
type ToolHandler = (input: ToolInput) => unknown;

const withRounding = (fn: ToolFn): ToolHandler =>
  (input) => fn({ ...input, rounding_policy: DEFAULT_ROUNDING } as never);

const wrap = (fn: ToolFn): ToolHandler => (input) => fn(input as never);

const TOOL_DISPATCH: Record<string, ToolHandler> = {
  calculate_dcf_npv: withRounding(computeDCF),
  build_irr_cashflow_vector: wrap(buildIRRVector),
  compute_equity_multiple: withRounding(computeEquityMultiple),
  exit_valuation: withRounding(computeExitValuation),
  validate_financial_identities: withRounding(validateFinancialIdentities),
  funding_gate_checks: wrap(checkFundingGates),
  schedule_reconcile: wrap(reconcileSchedule),
  assumption_consistency_check: wrap(checkAssumptionConsistency),
  export_verification: wrap(verifyExport),
  consolidate_statements: withRounding(consolidateStatements),
  scenario_compare: wrap(compareScenarios),
  break_even_analysis: wrap(computeBreakEven),
};

/**
 * Execute a computation tool by name. Returns a JSON string of the result,
 * or null if the tool name doesn't match any registered handler.
 * Errors during execution are caught and returned as JSON error objects
 * rather than thrown, so callers always get a parseable response.
 */
export function executeComputationTool(name: string, input: Record<string, unknown>): string | null {
  const handler = TOOL_DISPATCH[name];
  if (!handler) return null;
  try {
    return JSON.stringify(handler(input));
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return JSON.stringify({ error: `Computation failed: ${msg}` });
  }
}

export function isComputationTool(name: string): boolean {
  return name in TOOL_DISPATCH;
}
