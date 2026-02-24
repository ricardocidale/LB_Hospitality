/**
 * pmt.ts — Loan Payment Calculation (PMT Function)
 *
 * Implements the standard fixed-rate mortgage payment formula, identical to
 * Excel's PMT() function. This is the foundational formula for all debt
 * service calculations in the financial model.
 *
 * The formula: PMT = P × r × (1+r)^n / ((1+r)^n - 1)
 *   where P = principal (loan amount), r = monthly interest rate, n = number of payments
 *
 * This produces a constant monthly payment that covers both interest and principal.
 * Early payments are mostly interest; later payments are mostly principal. This is
 * called "amortization" — the loan balance gradually reduces to zero by the end.
 *
 * Edge cases handled:
 *   - Zero interest rate: Payment = principal ÷ number of payments (simple division)
 *   - Zero principal or zero payments: Returns 0
 *
 * Also exports ioPayment() for interest-only periods where the borrower pays
 * only the interest each month and the principal balance stays unchanged.
 *
 * @param principal  Loan amount (e.g., $2,000,000)
 * @param monthlyRate  Monthly interest rate (annual / 12, e.g., 0.065/12 = 0.005417)
 * @param totalPayments  Number of amortizing payments (e.g., 360 for a 30-year loan)
 * @returns Monthly payment amount (e.g., $12,653.74)
 */
export function pmt(
  principal: number,
  monthlyRate: number,
  totalPayments: number,
): number {
  if (principal === 0 || totalPayments === 0) return 0;
  if (monthlyRate === 0) return principal / totalPayments;
  const factor = Math.pow(1 + monthlyRate, totalPayments);
  return (principal * monthlyRate * factor) / (factor - 1);
}

/**
 * Interest-only payment for a given balance and monthly rate.
 */
export function ioPayment(
  balance: number,
  monthlyRate: number,
): number {
  return balance * monthlyRate;
}
