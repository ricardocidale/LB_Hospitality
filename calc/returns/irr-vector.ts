import { roundCents } from "../shared/utils.js";

export interface IRRVectorInput {
  equity_invested: number;
  acquisition_year: number;
  yearly_fcfe: number[];
  refinancing_proceeds?: number[];
  exit_proceeds?: number;
  projection_years: number;
  include_exit?: boolean;
}

export interface IRRVectorValidation {
  has_negative: boolean;
  has_positive: boolean;
  has_exit: boolean;
  sign_changes: number;
  is_valid: boolean;
}

export interface IRRVectorOutput {
  cash_flow_vector: number[];
  validation: IRRVectorValidation;
  warnings: string[];
}

export function buildIRRVector(input: IRRVectorInput): IRRVectorOutput {
  const includeExit = input.include_exit !== false;
  const years = input.projection_years;
  const warnings: string[] = [];

  const vector: number[] = new Array(years).fill(0);

  if (input.acquisition_year >= 0 && input.acquisition_year < years) {
    vector[input.acquisition_year] = -Math.abs(input.equity_invested);
  } else {
    warnings.push(`Acquisition year ${input.acquisition_year} is outside projection range 0-${years - 1}`);
  }

  for (let y = 0; y < years; y++) {
    if (y < input.yearly_fcfe.length) {
      vector[y] += input.yearly_fcfe[y];
    }
  }

  if (input.refinancing_proceeds) {
    for (let y = 0; y < years && y < input.refinancing_proceeds.length; y++) {
      vector[y] += input.refinancing_proceeds[y];
    }
  }

  if (includeExit && input.exit_proceeds !== undefined && input.exit_proceeds !== 0) {
    vector[years - 1] += input.exit_proceeds;
  } else if (!includeExit || input.exit_proceeds === undefined || input.exit_proceeds === 0) {
    warnings.push("No exit proceeds in final year — IRR will reflect operating returns only");
  }

  const has_negative = vector.some(cf => cf < 0);
  const has_positive = vector.some(cf => cf > 0);
  const has_exit = includeExit && (input.exit_proceeds ?? 0) !== 0;

  let sign_changes = 0;
  for (let i = 1; i < vector.length; i++) {
    if ((vector[i] >= 0 && vector[i - 1] < 0) || (vector[i] < 0 && vector[i - 1] >= 0)) {
      sign_changes++;
    }
  }

  if (!has_negative) warnings.push("No negative cash flows — IRR requires an initial investment (outflow)");
  if (!has_positive) warnings.push("No positive cash flows — IRR requires returns (inflows)");
  if (sign_changes > 1) warnings.push("Multiple sign changes — IRR may have multiple solutions");

  return {
    cash_flow_vector: vector.map(roundCents),
    validation: { has_negative, has_positive, has_exit, sign_changes, is_valid: has_negative && has_positive },
    warnings,
  };
}
