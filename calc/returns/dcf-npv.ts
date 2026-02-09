import type { RoundingPolicy } from "../../domain/types/rounding.js";
import { roundTo } from "../../domain/types/rounding.js";
import { rounder, sumArray, RATE_ROUNDING, DEFAULT_TOLERANCE } from "../shared/utils.js";

export interface DCFInput {
  cash_flows: number[];
  discount_rate: number;
  periods_per_year?: number;
  irr_cross_check?: number;
  tolerance?: number;
  rounding_policy: RoundingPolicy;
}

export interface DCFOutput {
  npv: number;
  pv_timeline: number[];
  total_undiscounted: number;
  annualized_discount_rate: number;
  irr_cross_check_passed: boolean | null;
}

export function computeDCF(input: DCFInput): DCFOutput {
  const r = rounder(input.rounding_policy);
  const periodsPerYear = input.periods_per_year ?? 1;
  const tolerance = input.tolerance ?? DEFAULT_TOLERANCE;

  const pv_timeline: number[] = [];
  let npv = 0;

  for (let t = 0; t < input.cash_flows.length; t++) {
    const pv = input.cash_flows[t] / Math.pow(1 + input.discount_rate, t);
    pv_timeline.push(r(pv));
    npv += pv;
  }

  const annualized_discount_rate =
    periodsPerYear === 1
      ? input.discount_rate
      : Math.pow(1 + input.discount_rate, periodsPerYear) - 1;

  let irr_cross_check_passed: boolean | null = null;
  if (input.irr_cross_check !== undefined) {
    let npvAtIRR = 0;
    for (let t = 0; t < input.cash_flows.length; t++) {
      npvAtIRR += input.cash_flows[t] / Math.pow(1 + input.irr_cross_check, t);
    }
    irr_cross_check_passed = Math.abs(npvAtIRR) <= tolerance;
  }

  return {
    npv: r(npv),
    pv_timeline,
    total_undiscounted: r(sumArray(input.cash_flows)),
    annualized_discount_rate: roundTo(annualized_discount_rate, RATE_ROUNDING),
    irr_cross_check_passed,
  };
}
