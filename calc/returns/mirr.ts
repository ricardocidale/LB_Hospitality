import { roundCents } from "../shared/utils.js";

export interface MIRRInput {
  cash_flow_vector: number[];
  finance_rate: number;
  reinvestment_rate: number;
}

export interface MIRROutput {
  mirr: number;
  is_valid: boolean;
  warnings: string[];
}

export function computeMIRR(input: MIRRInput): MIRROutput {
  const { cash_flow_vector, finance_rate, reinvestment_rate } = input;
  const warnings: string[] = [];
  const n = cash_flow_vector.length;

  if (n < 2) {
    return { mirr: 0, is_valid: false, warnings: ["Need at least 2 periods for MIRR"] };
  }

  let pvNegative = 0;
  let fvPositive = 0;
  const periods = n - 1;

  for (let t = 0; t < n; t++) {
    const cf = cash_flow_vector[t];
    if (cf < 0) {
      pvNegative += cf / Math.pow(1 + finance_rate, t);
    } else if (cf > 0) {
      fvPositive += cf * Math.pow(1 + reinvestment_rate, periods - t);
    }
  }

  if (pvNegative >= 0) {
    return { mirr: 0, is_valid: false, warnings: ["No negative cash flows — MIRR requires an initial investment"] };
  }
  if (fvPositive <= 0) {
    return { mirr: 0, is_valid: false, warnings: ["No positive cash flows — MIRR requires returns"] };
  }

  const mirr = Math.pow(fvPositive / Math.abs(pvNegative), 1 / periods) - 1;

  return {
    mirr: Number.isFinite(mirr) ? mirr : 0,
    is_valid: Number.isFinite(mirr),
    warnings,
  };
}
