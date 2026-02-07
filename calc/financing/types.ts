import type { AccountingPolicy } from "../../domain/types/accounting-policy.js";
import type { RoundingPolicy } from "../../domain/types/rounding.js";
import type { JournalDelta } from "../../domain/types/journal-delta.js";
import type { ScheduleEntry } from "../shared/types.js";

// Re-export shared types used by financing
export type { NewLoanTerms, ScheduleEntry } from "../shared/types.js";

// --- Input types ---

export type LoanType = "amortizing" | "IO_then_amortizing";

export interface FinancingInput {
  /** Purchase/acquisition date (YYYY-MM or ISO date) */
  purchase_date: string;
  purchase_price: number;
  loan_type: LoanType;
  /** Annual interest rate as decimal (e.g. 0.09 = 9%) */
  interest_rate_annual: number;
  /** Total loan term in months */
  term_months: number;
  /** Amortization schedule length in months */
  amortization_months: number;
  /** Loan-to-value ratio (e.g. 0.75); mutually exclusive with loan_amount_override */
  ltv_max?: number;
  /** Exact loan amount; mutually exclusive with ltv_max */
  loan_amount_override?: number;
  /** Closing costs as % of loan amount (e.g. 0.02 = 2%) */
  closing_cost_pct: number;
  /** Additional fixed closing fees in dollars */
  fixed_fees?: number;
  /** Upfront reserves funded at close */
  upfront_reserves?: number;
  accounting_policy_ref: AccountingPolicy;
  rounding_policy: RoundingPolicy;
}

// --- Output types ---

export interface ClosingCostBreakdown {
  /** loan_amount * closing_cost_pct */
  pct_based: number;
  /** Additional fixed fees */
  fixed_fees: number;
  total: number;
}

export interface FinancingFlags {
  /** LTV determined loan size */
  ltv_binding: boolean;
  /** loan_amount_override used instead of LTV */
  override_binding: boolean;
  /** Validation error messages (empty = valid) */
  invalid_inputs: string[];
}

export interface FinancingOutput {
  /** Sized loan amount (before closing costs) */
  loan_amount_gross: number;
  /** Gross minus closing costs */
  loan_amount_net: number;
  closing_costs: ClosingCostBreakdown;
  /** purchase_price + closing_costs + reserves - loan_amount_net */
  equity_required: number;
  /** Net loan proceeds to borrower */
  initial_cash_in: number;
  upfront_reserves: number;
  debt_service_schedule: ScheduleEntry[];
  journal_hooks: JournalDelta[];
  flags: FinancingFlags;
}
