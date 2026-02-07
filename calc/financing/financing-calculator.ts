import { validateFinancingInput } from "./validate.js";
import { computeAcqSizing } from "./sizing.js";
import { computeClosingCosts } from "./closing-costs.js";
import { buildAcqJournalHooks } from "./journal-hooks.js";
import { buildSchedule } from "../shared/schedule.js";
import type { NewLoanTerms } from "../shared/types.js";
import type { FinancingInput, FinancingOutput, FinancingFlags } from "./types.js";
import { roundTo } from "../../domain/types/rounding.js";

/**
 * Main entry point for the Financing Calculator (Skill 1).
 *
 * Computes acquisition loan sizing, closing costs, equity required,
 * debt service schedule, and journal hooks.
 *
 * GAAP invariants enforced:
 * - Closing costs deferred by default (not expensed immediately)
 * - Only interest hits IS; principal hits BS/CF (ASC 470)
 * - Equity contributions flow through equity accounts, never IS
 * - Schedule reconciles: ending_balance = beginning_balance - principal
 */
export function computeFinancing(input: FinancingInput): FinancingOutput {
  const r = (v: number) => roundTo(v, input.rounding_policy);

  // Step 1: Validate inputs
  const validationErrors = validateFinancingInput(input);
  if (validationErrors.length > 0) {
    return buildErrorResult(validationErrors);
  }

  // Step 2: Size the loan (LTV or override)
  const sizing = computeAcqSizing(
    input.purchase_price,
    input.ltv_max,
    input.loan_amount_override,
    input.rounding_policy,
  );

  const loanAmountGross = sizing.loan_amount;

  // Step 3: Compute closing costs
  const closingCosts = computeClosingCosts(
    loanAmountGross,
    input.closing_cost_pct,
    input.fixed_fees ?? 0,
    input.rounding_policy,
  );

  const loanAmountNet = r(loanAmountGross - closingCosts.total);
  const reserves = r(input.upfront_reserves ?? 0);

  // Step 4: Compute equity required
  // Equity = purchase price + closing costs + reserves - net loan proceeds
  const equityRequired = r(
    input.purchase_price + closingCosts.total + reserves - loanAmountNet,
  );

  // Step 5: Derive loan terms and build schedule
  const ioMonths =
    input.loan_type === "IO_then_amortizing"
      ? input.term_months - input.amortization_months
      : 0;

  const terms: NewLoanTerms = {
    rate_annual: input.interest_rate_annual,
    term_months: input.term_months,
    amortization_months: input.amortization_months,
    io_months: ioMonths,
  };

  const schedule = buildSchedule(loanAmountGross, terms, input.rounding_policy);

  // Step 6: Build journal hooks
  const journalHooks = buildAcqJournalHooks({
    loan_amount: loanAmountGross,
    closing_costs: closingCosts.total,
    equity_required: equityRequired,
    upfront_reserves: reserves,
    purchase_price: input.purchase_price,
    policy: input.accounting_policy_ref,
    rounding: input.rounding_policy,
  });

  // Step 7: Assemble flags
  const flags: FinancingFlags = {
    ltv_binding: sizing.ltv_binding,
    override_binding: sizing.override_binding,
    invalid_inputs: [],
  };

  return {
    loan_amount_gross: loanAmountGross,
    loan_amount_net: loanAmountNet,
    closing_costs: closingCosts,
    equity_required: equityRequired,
    initial_cash_in: loanAmountNet,
    upfront_reserves: reserves,
    debt_service_schedule: schedule,
    journal_hooks: journalHooks,
    flags,
  };
}

function buildErrorResult(errors: string[]): FinancingOutput {
  return {
    loan_amount_gross: 0,
    loan_amount_net: 0,
    closing_costs: { pct_based: 0, fixed_fees: 0, total: 0 },
    equity_required: 0,
    initial_cash_in: 0,
    upfront_reserves: 0,
    debt_service_schedule: [],
    journal_hooks: [],
    flags: {
      ltv_binding: false,
      override_binding: false,
      invalid_inputs: errors,
    },
  };
}
