import type { AccountingPolicy } from "../../domain/types/accounting-policy.js";
import type { RoundingPolicy } from "../../domain/types/rounding.js";
import type { JournalDelta } from "../../domain/types/journal-delta.js";

// Re-export shared types used by refinance
export type { NewLoanTerms, ScheduleEntry } from "../shared/types.js";
import type { NewLoanTerms, ScheduleEntry } from "../shared/types.js";

// --- Input types ---

export type PrepaymentPenaltyType = "none" | "pct_of_balance" | "fixed";

export interface PrepaymentPenalty {
  type: PrepaymentPenaltyType;
  /** Percentage (0.02 = 2%) if pct_of_balance; dollar amount if fixed; ignored if none */
  value: number;
}

/** Mutually exclusive valuation input: provide exactly one path */
export type PropertyValuation =
  | { method: "direct"; property_value_at_refi: number }
  | { method: "noi_cap"; stabilized_noi: number; cap_rate: number };

export interface RefinanceInput {
  refinance_date: string;
  current_loan_balance: number;
  valuation: PropertyValuation;
  ltv_max: number;
  closing_cost_pct: number;
  prepayment_penalty: PrepaymentPenalty;
  accrued_interest_to_payoff?: number;
  dscr_min?: number;
  noi_for_dscr?: number;
  new_loan_terms: NewLoanTerms;
  accounting_policy_ref: AccountingPolicy;
  rounding_policy: RoundingPolicy;
}

// --- Output types ---

export interface ProceedsLineItem {
  label: string;
  amount: number;
}

export interface RefinanceFlags {
  /** DSCR constraint reduced loan below LTV max */
  dscr_binding: boolean;
  /** LTV was the binding constraint */
  ltv_binding: boolean;
  /** Net proceeds < payoff (no cash to equity) */
  negative_cash_out: boolean;
  /** Validation error messages (empty = valid) */
  invalid_inputs: string[];
}

export interface RefinanceOutput {
  new_loan_amount_gross: number;
  new_loan_amount_net: number;
  payoff_total: number;
  payoff_breakdown: {
    old_loan_balance: number;
    prepayment_penalty: number;
    accrued_interest: number;
  };
  cash_out_to_equity: number;
  proceeds_breakdown: ProceedsLineItem[];
  new_debt_service_schedule: ScheduleEntry[];
  journal_hooks: JournalDelta[];
  flags: RefinanceFlags;
}
