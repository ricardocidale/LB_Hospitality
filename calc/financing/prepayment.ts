import type { RoundingPolicy } from "../../domain/types/rounding.js";
import { roundTo } from "../../domain/types/rounding.js";
import type { ScheduleEntry } from "../shared/types.js";

export type PrepaymentType = "yield_maintenance" | "step_down" | "defeasance";

export interface PrepaymentInput {
  /** Outstanding loan balance at prepayment (or provide schedule + month) */
  outstanding_balance?: number;
  /** Full amortization schedule (used to look up balance if month provided) */
  schedule?: ScheduleEntry[];
  /** Month of prepayment (0-indexed from origination) */
  prepayment_month?: number;
  /** Loan origination annual rate */
  loan_rate_annual: number;
  /** Total loan term in months */
  term_months: number;
  /** Type of prepayment penalty */
  prepayment_type: PrepaymentType;
  /** For yield maintenance: current Treasury rate (annual decimal, e.g. 0.04 = 4%) */
  treasury_rate_annual?: number;
  /** For step-down: array of penalty percentages by year [year1_pct, year2_pct, ...] (e.g. [0.05, 0.04, 0.03, 0.02, 0.01]) */
  step_down_schedule?: number[];
  /** For defeasance: estimated cost as % of balance (e.g. 0.01 = 1%) for admin/legal fees */
  defeasance_fee_pct?: number;
  rounding_policy: RoundingPolicy;
}

export interface PrepaymentOutput {
  /** Balance at prepayment */
  balance_at_prepayment: number;
  /** Months remaining on loan */
  months_remaining: number;
  /** Prepayment penalty amount */
  penalty_amount: number;
  /** Penalty as percentage of outstanding balance */
  penalty_pct: number;
  /** Total cost to prepay (balance + penalty) */
  total_prepayment_cost: number;
  /** Breakdown details */
  details: PrepaymentDetails;
}

export interface YieldMaintenanceDetails {
  type: "yield_maintenance";
  /** Loan rate minus treasury rate */
  rate_differential: number;
  /** Present value of remaining interest differential */
  pv_differential: number;
  /** Treasury rate used */
  treasury_rate: number;
}

export interface StepDownDetails {
  type: "step_down";
  /** Which year of the loan (1-indexed) */
  loan_year: number;
  /** Penalty percentage for that year */
  year_penalty_pct: number;
}

export interface DefeasanceDetails {
  type: "defeasance";
  /** Cost of purchasing treasury securities to replicate cash flows */
  securities_cost: number;
  /** Administrative/legal fees */
  admin_fees: number;
}

export type PrepaymentDetails = YieldMaintenanceDetails | StepDownDetails | DefeasanceDetails;

/**
 * Calculate prepayment penalties for early loan payoff.
 *
 * Three penalty types:
 *
 * 1. Yield Maintenance: Compensates lender for lost interest spread.
 *    Penalty = PV of (loan_rate - treasury_rate) * balance over remaining term.
 *
 * 2. Step-Down: Fixed percentage that decreases over time.
 *    Common pattern: 5-4-3-2-1 (5% in year 1, 4% in year 2, etc.)
 *
 * 3. Defeasance: Borrower purchases treasury securities to replicate
 *    remaining cash flows. Cost ≈ balance (if rates dropped) + fees.
 */
export function computePrepayment(input: PrepaymentInput): PrepaymentOutput {
  const r = (v: number) => roundTo(v, input.rounding_policy);
  const pct = (v: number) => roundTo(v, { precision: 6, bankers_rounding: false });

  const balance = resolveBalance(input);
  const monthsRemaining = input.term_months - (input.prepayment_month ?? 0);

  let penalty: number;
  let details: PrepaymentDetails;

  switch (input.prepayment_type) {
    case "yield_maintenance": {
      const result = computeYieldMaintenance(
        balance,
        monthsRemaining,
        input.loan_rate_annual,
        input.treasury_rate_annual ?? 0,
        input.rounding_policy,
      );
      penalty = result.penalty;
      details = result.details;
      break;
    }
    case "step_down": {
      const result = computeStepDown(
        balance,
        input.prepayment_month ?? 0,
        input.step_down_schedule ?? [],
        input.rounding_policy,
      );
      penalty = result.penalty;
      details = result.details;
      break;
    }
    case "defeasance": {
      const result = computeDefeasance(
        balance,
        monthsRemaining,
        input.loan_rate_annual,
        input.treasury_rate_annual ?? 0,
        input.defeasance_fee_pct ?? 0.01,
        input.rounding_policy,
      );
      penalty = result.penalty;
      details = result.details;
      break;
    }
  }

  const penaltyPct = balance > 0 ? pct(penalty / balance) : 0;

  return {
    balance_at_prepayment: balance,
    months_remaining: monthsRemaining,
    penalty_amount: r(penalty),
    penalty_pct: penaltyPct,
    total_prepayment_cost: r(balance + penalty),
    details,
  };
}

function resolveBalance(input: PrepaymentInput): number {
  if (input.outstanding_balance !== undefined) {
    return input.outstanding_balance;
  }
  if (input.schedule && input.prepayment_month !== undefined) {
    const entry = input.schedule[input.prepayment_month];
    if (entry) return entry.beginning_balance;
    const lastEntry = input.schedule[input.schedule.length - 1];
    return lastEntry ? lastEntry.ending_balance : 0;
  }
  return 0;
}

function computeYieldMaintenance(
  balance: number,
  monthsRemaining: number,
  loanRate: number,
  treasuryRate: number,
  rounding: RoundingPolicy,
): { penalty: number; details: YieldMaintenanceDetails } {
  const r = (v: number) => roundTo(v, rounding);
  const rateDiff = Math.max(0, loanRate - treasuryRate);
  const monthlyDiff = rateDiff / 12;

  let pvDiff = 0;
  const discountRate = treasuryRate / 12;

  for (let m = 1; m <= monthsRemaining; m++) {
    const monthlyInterestDiff = balance * monthlyDiff;
    const discountFactor = Math.pow(1 + discountRate, -m);
    pvDiff += monthlyInterestDiff * discountFactor;
  }

  pvDiff = r(pvDiff);

  return {
    penalty: pvDiff,
    details: {
      type: "yield_maintenance",
      rate_differential: roundTo(rateDiff, { precision: 6, bankers_rounding: false }),
      pv_differential: pvDiff,
      treasury_rate: treasuryRate,
    },
  };
}

function computeStepDown(
  balance: number,
  prepaymentMonth: number,
  stepDownSchedule: number[],
  rounding: RoundingPolicy,
): { penalty: number; details: StepDownDetails } {
  const r = (v: number) => roundTo(v, rounding);
  const loanYear = Math.floor(prepaymentMonth / 12) + 1;

  const yearIndex = Math.min(loanYear - 1, stepDownSchedule.length - 1);
  const penaltyPct = yearIndex >= 0 && stepDownSchedule.length > 0
    ? stepDownSchedule[yearIndex]
    : 0;

  return {
    penalty: r(balance * penaltyPct),
    details: {
      type: "step_down",
      loan_year: loanYear,
      year_penalty_pct: penaltyPct,
    },
  };
}

function computeDefeasance(
  balance: number,
  monthsRemaining: number,
  loanRate: number,
  treasuryRate: number,
  feePct: number,
  rounding: RoundingPolicy,
): { penalty: number; details: DefeasanceDetails } {
  const r = (v: number) => roundTo(v, rounding);

  const monthlyLoanRate = loanRate / 12;
  const monthlyTreasuryRate = treasuryRate / 12;

  let securitiesCost = 0;
  if (treasuryRate < loanRate && monthlyTreasuryRate > 0) {
    const monthlyPayment = balance * monthlyLoanRate;
    let pvAtTreasury = 0;
    for (let m = 1; m <= monthsRemaining; m++) {
      pvAtTreasury += monthlyPayment / Math.pow(1 + monthlyTreasuryRate, m);
    }
    pvAtTreasury += balance / Math.pow(1 + monthlyTreasuryRate, monthsRemaining);
    securitiesCost = r(Math.max(0, pvAtTreasury - balance));
  }

  const adminFees = r(balance * feePct);

  return {
    penalty: r(securitiesCost + adminFees),
    details: {
      type: "defeasance",
      securities_cost: securitiesCost,
      admin_fees: adminFees,
    },
  };
}
