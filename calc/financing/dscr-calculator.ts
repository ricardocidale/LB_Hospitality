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
  /** Annual debt service during amortizing period (peak DS) */
  annual_debt_service_amortizing: number;
  /** Annual debt service during IO period (if applicable) */
  annual_debt_service_io: number | null;
  /** Monthly amortizing payment at max DSCR loan */
  monthly_payment_amortizing: number;
  /** Monthly IO payment at max DSCR loan (if applicable) */
  monthly_payment_io: number | null;
  /** Actual DSCR at the binding loan amount (based on amortizing DS) */
  actual_dscr: number;
  /** DSCR during IO period at binding loan amount */
  io_dscr: number | null;
  /** Implied LTV at binding loan amount (if purchase_price provided) */
  implied_ltv: number | null;
}

/**
 * Compute the maximum supportable loan amount based on a minimum DSCR threshold.
 *
 * DSCR sizing uses the AMORTIZING payment (peak debt service) to ensure
 * the loan passes DSCR even after the IO period ends. This is standard
 * commercial lending practice — lenders size to worst-case DS.
 *
 * DSCR = NOI / Annual Debt Service (amortizing)
 * Max Annual DS = NOI / min_dscr
 * Max Monthly DS = Max Annual DS / 12
 *
 * Reverse-solve PMT formula for principal:
 *   P = PMT * ((1+r)^n - 1) / (r * (1+r)^n)
 *
 * For IO-only loans (io_months >= term_months):
 *   Max Loan = NOI / (min_dscr * annual_rate)
 */
export function computeDSCR(input: DSCRInput): DSCROutput {
  const r = (v: number) => roundTo(v, input.rounding_policy);
  const monthlyRate = input.interest_rate_annual / 12;
  const ioMonths = input.io_months ?? 0;
  const isFullIO = ioMonths >= input.term_months;

  const maxAnnualDS = r(input.noi_annual / input.min_dscr);
  const maxMonthlyDS = r(maxAnnualDS / 12);

  let maxLoanDSCR: number;

  if (isFullIO) {
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

  const monthlyAmort = r(pmt(maxLoanBinding, monthlyRate, input.amortization_months));
  const annualAmort = r(monthlyAmort * 12);
  const actualDSCR = annualAmort > 0
    ? roundTo(input.noi_annual / annualAmort, { precision: 4, bankers_rounding: false })
    : 0;

  let monthlyIO: number | null = null;
  let annualIO: number | null = null;
  let ioDSCR: number | null = null;

  if (ioMonths > 0) {
    monthlyIO = r(maxLoanBinding * monthlyRate);
    annualIO = r(monthlyIO * 12);
    ioDSCR = annualIO > 0
      ? roundTo(input.noi_annual / annualIO, { precision: 4, bankers_rounding: false })
      : null;
  }

  const impliedLTV = input.purchase_price
    ? roundTo(maxLoanBinding / input.purchase_price, { precision: 4, bankers_rounding: false })
    : null;

  return {
    max_loan_dscr: maxLoanDSCR,
    max_loan_ltv: maxLoanLTV,
    binding_constraint: bindingConstraint,
    max_loan_binding: maxLoanBinding,
    annual_debt_service_amortizing: isFullIO ? (annualIO ?? 0) : annualAmort,
    annual_debt_service_io: annualIO,
    monthly_payment_amortizing: isFullIO ? (monthlyIO ?? 0) : monthlyAmort,
    monthly_payment_io: monthlyIO,
    actual_dscr: actualDSCR,
    io_dscr: ioDSCR,
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
