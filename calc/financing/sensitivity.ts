import type { RoundingPolicy } from "../../domain/types/rounding.js";
import { roundTo } from "../../domain/types/rounding.js";
import { pmt, ioPayment } from "../shared/pmt.js";

export interface SensitivityInput {
  /** Base annual Net Operating Income */
  noi_annual: number;
  /** Base loan amount */
  loan_amount: number;
  /** Base annual interest rate as decimal (e.g. 0.07 = 7%) */
  interest_rate_annual: number;
  /** Amortization schedule length in months */
  amortization_months: number;
  /** Interest-only period in months (0 = fully amortizing) */
  io_months?: number;
  /** Rate variations to test as basis points (e.g. [-200, -100, 0, 100, 200]) */
  rate_shocks_bps: number[];
  /** NOI variations to test as percentages (e.g. [-20, -10, 0, 10, 20]) */
  noi_shocks_pct: number[];
  /** Minimum DSCR threshold for pass/fail flagging */
  min_dscr?: number;
  rounding_policy: RoundingPolicy;
}

export interface SensitivityCell {
  /** Rate shock in bps */
  rate_shock_bps: number;
  /** NOI shock as percentage */
  noi_shock_pct: number;
  /** Stressed annual interest rate */
  stressed_rate: number;
  /** Stressed NOI */
  stressed_noi: number;
  /** Annual debt service at stressed rate */
  annual_debt_service: number;
  /** DSCR at this stress scenario */
  dscr: number;
  /** Whether DSCR meets minimum threshold */
  passes: boolean;
}

export interface SensitivityOutput {
  /** Base case DSCR (no shocks) */
  base_dscr: number;
  /** Base annual debt service */
  base_annual_ds: number;
  /** Full matrix of stress results */
  matrix: SensitivityCell[];
  /** Rate shock labels in bps */
  rate_axis: number[];
  /** NOI shock labels in pct */
  noi_axis: number[];
  /** Number of scenarios that fail DSCR threshold */
  failing_scenarios: number;
  /** Total scenarios tested */
  total_scenarios: number;
  /** Worst-case DSCR across all scenarios */
  worst_dscr: number;
  /** Best-case DSCR across all scenarios */
  best_dscr: number;
}

/**
 * Generate a DSCR stress-test matrix across interest rate and NOI variations.
 *
 * For each (rate_shock, noi_shock) combination:
 *   stressed_rate = base_rate + (shock_bps / 10_000)
 *   stressed_noi = base_noi * (1 + shock_pct / 100)
 *   DS computed via PMT at stressed rate
 *   DSCR = stressed_noi / DS
 */
export function computeSensitivity(input: SensitivityInput): SensitivityOutput {
  const r = (v: number) => roundTo(v, input.rounding_policy);
  const dscr_round = (v: number) => roundTo(v, { precision: 4, bankers_rounding: false });
  const ioMonths = input.io_months ?? 0;
  const minDSCR = input.min_dscr ?? 1.25;

  const baseDS = computeAnnualDS(
    input.loan_amount,
    input.interest_rate_annual,
    input.amortization_months,
    ioMonths,
    input.rounding_policy,
  );
  const baseDSCR = baseDS > 0 ? dscr_round(input.noi_annual / baseDS) : 0;

  const matrix: SensitivityCell[] = [];
  let worstDSCR = Infinity;
  let bestDSCR = -Infinity;
  let failCount = 0;

  for (const rateShock of input.rate_shocks_bps) {
    for (const noiShock of input.noi_shocks_pct) {
      const stressedRate = input.interest_rate_annual + rateShock / 10_000;
      const stressedNOI = r(input.noi_annual * (1 + noiShock / 100));

      const effectiveRate = Math.max(0.0001, stressedRate);

      const annualDS = computeAnnualDS(
        input.loan_amount,
        effectiveRate,
        input.amortization_months,
        ioMonths,
        input.rounding_policy,
      );

      const cellDSCR = annualDS > 0 ? dscr_round(stressedNOI / annualDS) : 0;
      const passes = cellDSCR >= minDSCR;
      if (!passes) failCount++;

      if (cellDSCR < worstDSCR) worstDSCR = cellDSCR;
      if (cellDSCR > bestDSCR) bestDSCR = cellDSCR;

      matrix.push({
        rate_shock_bps: rateShock,
        noi_shock_pct: noiShock,
        stressed_rate: roundTo(effectiveRate, { precision: 6, bankers_rounding: false }),
        stressed_noi: stressedNOI,
        annual_debt_service: annualDS,
        dscr: cellDSCR,
        passes,
      });
    }
  }

  return {
    base_dscr: baseDSCR,
    base_annual_ds: baseDS,
    matrix,
    rate_axis: [...input.rate_shocks_bps],
    noi_axis: [...input.noi_shocks_pct],
    failing_scenarios: failCount,
    total_scenarios: matrix.length,
    worst_dscr: worstDSCR === Infinity ? 0 : worstDSCR,
    best_dscr: bestDSCR === -Infinity ? 0 : bestDSCR,
  };
}

function computeAnnualDS(
  loanAmount: number,
  annualRate: number,
  amortMonths: number,
  ioMonths: number,
  rounding: RoundingPolicy,
): number {
  const monthlyRate = annualRate / 12;
  const r = (v: number) => roundTo(v, rounding);

  if (ioMonths > 0) {
    return r(ioPayment(loanAmount, monthlyRate) * 12);
  }

  return r(pmt(loanAmount, monthlyRate, amortMonths) * 12);
}
