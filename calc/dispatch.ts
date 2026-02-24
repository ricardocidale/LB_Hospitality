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

type ToolHandler = (input: Record<string, any>) => any;

/** Wraps a tool handler to inject the default rounding policy (2 decimal places). */
const withRounding = (fn: (input: any) => any): ToolHandler =>
  (input) => fn({ ...input, rounding_policy: DEFAULT_ROUNDING });

const TOOL_DISPATCH: Record<string, ToolHandler> = {
  calculate_dcf_npv: withRounding(computeDCF),
  build_irr_cashflow_vector: (input) => buildIRRVector(input as any),
  compute_equity_multiple: withRounding(computeEquityMultiple),
  exit_valuation: withRounding(computeExitValuation),
  validate_financial_identities: withRounding(validateFinancialIdentities),
  funding_gate_checks: (input) => checkFundingGates(input as any),
  schedule_reconcile: (input) => reconcileSchedule(input as any),
  assumption_consistency_check: (input) => checkAssumptionConsistency(input as any),
  export_verification: (input) => verifyExport(input as any),
  consolidate_statements: withRounding(consolidateStatements),
  scenario_compare: (input) => compareScenarios(input as any),
  break_even_analysis: (input) => computeBreakEven(input as any),
};

/**
 * Execute a computation tool by name. Returns a JSON string of the result,
 * or null if the tool name doesn't match any registered handler.
 * Errors during execution are caught and returned as JSON error objects
 * rather than thrown, so callers always get a parseable response.
 */
export function executeComputationTool(name: string, input: Record<string, any>): string | null {
  const handler = TOOL_DISPATCH[name];
  if (!handler) return null;
  try {
    return JSON.stringify(handler(input));
  } catch (error: any) {
    return JSON.stringify({ error: `Computation failed: ${error.message}` });
  }
}

export function isComputationTool(name: string): boolean {
  return name in TOOL_DISPATCH;
}
