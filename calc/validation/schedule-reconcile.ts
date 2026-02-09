import { roundCents, CENTS_TOLERANCE } from "../shared/utils.js";

export interface ScheduleEntry {
  month: number;
  expected_interest: number;
  expected_principal: number;
  expected_payment?: number;
  expected_ending_balance: number;
}

export interface EngineEntry {
  month: number;
  actual_interest: number;
  actual_principal: number;
  actual_payment?: number;
  actual_ending_balance: number;
}

export interface ScheduleVariance {
  month: number;
  field: "interest" | "principal" | "payment" | "ending_balance";
  expected: number;
  actual: number;
  variance: number;
}

export interface ScheduleReconcileInput {
  property_name?: string;
  schedule: ScheduleEntry[];
  engine_outputs: EngineEntry[];
  tolerance?: number;
}

export interface ScheduleReconcileOutput {
  all_reconciled: boolean;
  total_months_checked: number;
  months_with_variances: number;
  variances: ScheduleVariance[];
  max_balance_drift: number;
  cumulative_interest_variance: number;
}

function pushIfExceedsTol(
  variances: ScheduleVariance[], monthsWithVar: Set<number>,
  month: number, field: ScheduleVariance["field"],
  expected: number, actual: number, tol: number,
): number {
  const v = Math.abs(expected - actual);
  if (v > tol) {
    monthsWithVar.add(month);
    variances.push({ month, field, expected, actual, variance: roundCents(v) });
  }
  return v;
}

export function reconcileSchedule(input: ScheduleReconcileInput): ScheduleReconcileOutput {
  const tol = input.tolerance ?? CENTS_TOLERANCE;
  const variances: ScheduleVariance[] = [];
  let maxBalanceDrift = 0;
  let cumulativeInterestVar = 0;
  const monthsWithVar = new Set<number>();

  const engineMap = new Map<number, EngineEntry>();
  for (const e of input.engine_outputs) {
    engineMap.set(e.month, e);
  }

  let totalChecked = 0;

  for (const sched of input.schedule) {
    const eng = engineMap.get(sched.month);
    if (!eng) continue;
    totalChecked++;

    cumulativeInterestVar += sched.expected_interest - eng.actual_interest;
    pushIfExceedsTol(variances, monthsWithVar, sched.month, "interest", sched.expected_interest, eng.actual_interest, tol);
    pushIfExceedsTol(variances, monthsWithVar, sched.month, "principal", sched.expected_principal, eng.actual_principal, tol);

    if (sched.expected_payment !== undefined && eng.actual_payment !== undefined) {
      pushIfExceedsTol(variances, monthsWithVar, sched.month, "payment", sched.expected_payment, eng.actual_payment, tol);
    }

    const balVar = Math.abs(sched.expected_ending_balance - eng.actual_ending_balance);
    if (balVar > maxBalanceDrift) maxBalanceDrift = balVar;
    pushIfExceedsTol(variances, monthsWithVar, sched.month, "ending_balance", sched.expected_ending_balance, eng.actual_ending_balance, tol);
  }

  return {
    all_reconciled: variances.length === 0,
    total_months_checked: totalChecked,
    months_with_variances: monthsWithVar.size,
    variances,
    max_balance_drift: roundCents(maxBalanceDrift),
    cumulative_interest_variance: roundCents(cumulativeInterestVar),
  };
}
