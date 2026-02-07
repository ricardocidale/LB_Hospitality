/**
 * Standard loan payment formula.
 *
 * PMT = P * r * (1+r)^n / ((1+r)^n - 1)
 *
 * @param principal  Loan amount
 * @param monthlyRate  Monthly interest rate (annual / 12)
 * @param totalPayments  Number of amortizing payments
 * @returns Monthly payment amount
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
