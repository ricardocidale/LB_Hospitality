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
