import type { RoundingPolicy } from "../../domain/types/rounding.js";
import { roundTo } from "../../domain/types/rounding.js";
import { pmt } from "../shared/pmt.js";

export interface DSCRInput {
  /** Annual Net Operating Income */
  noi_annual: number;
  /** Annual interest rate as decimal (e.g. 0.07 = 7%) */
  interest_rate_annual: number;
  /** Total loan term in months */
  term_months: number;
  /** Amortization schedule length in months */
  amortization_months: number;
  /** Interest-only period in months (0 = fully amortizing) */
  io_months?: number;
  /** Minimum acceptable DSCR (e.g. 1.25) */
  min_dscr: number;
  /** Purchase price for LTV cross-check */
  purchase_price?: number;
  /** Max LTV for cross-check (e.g. 0.75) */
  ltv_max?: number;
  rounding_policy: RoundingPolicy;
}

export interface DSCROutput {
  /** Max loan supportable by DSCR constraint alone */
  max_loan_dscr: number;
  /** Max loan supportable by LTV constraint (if provided) */
  max_loan_ltv: number | null;
  /** The binding (lower) constraint */
  binding_constraint: "dscr" | "ltv" | "none";
  /** Final max loan (min of DSCR and LTV) */
  max_loan_binding: number;
  /** Annual debt service at max DSCR loan */
  annual_debt_service: number;
  /** Monthly debt service at max DSCR loan */
  monthly_debt_service: number;
  /** Actual DSCR at the binding loan amount */
  actual_dscr: number;
  /** Implied LTV at binding loan amount (if purchase_price provided) */
  implied_ltv: number | null;
}

/**
 * Compute the maximum supportable loan amount based on a minimum DSCR threshold.
 *
 * DSCR = NOI / Annual Debt Service
 * Max Annual DS = NOI / min_dscr
 * Max Monthly DS = Max Annual DS / 12
 *
 * Then reverse-solve PMT formula for principal:
 *   P = PMT * ((1+r)^n - 1) / (r * (1+r)^n)
 *
 * During IO periods, DS = balance * monthly_rate * 12, so:
 *   Max Loan (IO) = NOI / (min_dscr * annual_rate)
 */
export function computeDSCR(input: DSCRInput): DSCROutput {
  const r = (v: number) => roundTo(v, input.rounding_policy);
  const monthlyRate = input.interest_rate_annual / 12;
  const ioMonths = input.io_months ?? 0;

  const maxAnnualDS = r(input.noi_annual / input.min_dscr);
  const maxMonthlyDS = r(maxAnnualDS / 12);

  let maxLoanDSCR: number;

  if (ioMonths > 0 && ioMonths >= input.term_months) {
    maxLoanDSCR = monthlyRate > 0
      ? r(maxMonthlyDS / monthlyRate)
      : 0;
  } else {
    maxLoanDSCR = reversePMT(maxMonthlyDS, monthlyRate, input.amortization_months);
    maxLoanDSCR = r(maxLoanDSCR);
  }

  let maxLoanLTV: number | null = null;
  if (input.purchase_price !== undefined && input.ltv_max !== undefined) {
    maxLoanLTV = r(input.purchase_price * input.ltv_max);
  }

  let bindingConstraint: "dscr" | "ltv" | "none";
  let maxLoanBinding: number;

  if (maxLoanLTV !== null) {
    if (maxLoanDSCR <= maxLoanLTV) {
      bindingConstraint = "dscr";
      maxLoanBinding = maxLoanDSCR;
    } else {
      bindingConstraint = "ltv";
      maxLoanBinding = maxLoanLTV;
    }
  } else {
    bindingConstraint = "none";
    maxLoanBinding = maxLoanDSCR;
  }

  const monthlyDS = ioMonths > 0 && ioMonths >= input.term_months
    ? r(maxLoanBinding * monthlyRate)
    : r(pmt(maxLoanBinding, monthlyRate, input.amortization_months));

  const annualDS = r(monthlyDS * 12);
  const actualDSCR = annualDS > 0
    ? roundTo(input.noi_annual / annualDS, { precision: 4, bankers_rounding: false })
    : 0;

  const impliedLTV = input.purchase_price
    ? roundTo(maxLoanBinding / input.purchase_price, { precision: 4, bankers_rounding: false })
    : null;

  return {
    max_loan_dscr: maxLoanDSCR,
    max_loan_ltv: maxLoanLTV,
    binding_constraint: bindingConstraint,
    max_loan_binding: maxLoanBinding,
    annual_debt_service: annualDS,
    monthly_debt_service: monthlyDS,
    actual_dscr: actualDSCR,
    implied_ltv: impliedLTV,
  };
}

/**
 * Reverse-solve PMT formula for principal:
 *   P = PMT * ((1+r)^n - 1) / (r * (1+r)^n)
 */
function reversePMT(
  payment: number,
  monthlyRate: number,
  totalPayments: number,
): number {
  if (payment === 0 || totalPayments === 0) return 0;
  if (monthlyRate === 0) return payment * totalPayments;
  const factor = Math.pow(1 + monthlyRate, totalPayments);
  return payment * (factor - 1) / (monthlyRate * factor);
}
