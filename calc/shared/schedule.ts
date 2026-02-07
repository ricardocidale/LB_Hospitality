import { pmt, ioPayment } from "./pmt.js";
import type { NewLoanTerms, ScheduleEntry } from "./types.js";
import type { RoundingPolicy } from "../../domain/types/rounding.js";
import { roundTo } from "../../domain/types/rounding.js";

/**
 * Build a monthly debt service schedule with IO-to-amortization transition.
 *
 * During IO period (month 0 to io_months-1):
 *   payment = balance * monthlyRate, principal = 0
 *
 * After IO period (month io_months to term_months-1):
 *   PMT computed on full loan amount over amortization_months.
 *   If amortization_months > remaining term, a balloon exists at maturity.
 *   Final month: principal = remaining balance (prevents rounding dust).
 */
export function buildSchedule(
  loanAmount: number,
  terms: NewLoanTerms,
  rounding: RoundingPolicy,
): ScheduleEntry[] {
  const schedule: ScheduleEntry[] = [];
  const monthlyRate = terms.rate_annual / 12;
  let balance = loanAmount;

  // Amortizing payment based on full loan amount over amortization_months
  const amortPayment = pmt(loanAmount, monthlyRate, terms.amortization_months);

  for (let m = 0; m < terms.term_months; m++) {
    const beginningBalance = roundTo(balance, rounding);
    const isIO = m < terms.io_months;

    let interest: number;
    let principal: number;
    let payment: number;

    if (isIO) {
      interest = roundTo(ioPayment(balance, monthlyRate), rounding);
      principal = 0;
      payment = interest;
    } else if (m === terms.term_months - 1) {
      // Final month: clean up remaining balance
      interest = roundTo(balance * monthlyRate, rounding);
      principal = roundTo(balance, rounding);
      payment = roundTo(interest + principal, rounding);
    } else {
      interest = roundTo(balance * monthlyRate, rounding);
      payment = roundTo(amortPayment, rounding);
      principal = roundTo(payment - interest, rounding);
    }

    balance = roundTo(Math.max(0, balance - principal), rounding);

    schedule.push({
      month: m,
      beginning_balance: beginningBalance,
      interest,
      principal,
      payment,
      ending_balance: balance,
      is_io: isIO,
    });
  }

  return schedule;
}
