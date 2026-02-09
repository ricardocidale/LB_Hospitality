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

export function reconcileSchedule(input: ScheduleReconcileInput): ScheduleReconcileOutput {
  const tol = input.tolerance ?? 0.01;
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

    // Interest
    const intVar = Math.abs(sched.expected_interest - eng.actual_interest);
    cumulativeInterestVar += sched.expected_interest - eng.actual_interest;
    if (intVar > tol) {
      monthsWithVar.add(sched.month);
      variances.push({
        month: sched.month,
        field: "interest",
        expected: sched.expected_interest,
        actual: eng.actual_interest,
        variance: Math.round(intVar * 100) / 100,
      });
    }

    // Principal
    const prinVar = Math.abs(sched.expected_principal - eng.actual_principal);
    if (prinVar > tol) {
      monthsWithVar.add(sched.month);
      variances.push({
        month: sched.month,
        field: "principal",
        expected: sched.expected_principal,
        actual: eng.actual_principal,
        variance: Math.round(prinVar * 100) / 100,
      });
    }

    // Payment
    if (sched.expected_payment !== undefined && eng.actual_payment !== undefined) {
      const payVar = Math.abs(sched.expected_payment - eng.actual_payment);
      if (payVar > tol) {
        monthsWithVar.add(sched.month);
        variances.push({
          month: sched.month,
          field: "payment",
          expected: sched.expected_payment,
          actual: eng.actual_payment,
          variance: Math.round(payVar * 100) / 100,
        });
      }
    }

    // Ending Balance
    const balVar = Math.abs(sched.expected_ending_balance - eng.actual_ending_balance);
    if (balVar > maxBalanceDrift) maxBalanceDrift = balVar;
    if (balVar > tol) {
      monthsWithVar.add(sched.month);
      variances.push({
        month: sched.month,
        field: "ending_balance",
        expected: sched.expected_ending_balance,
        actual: eng.actual_ending_balance,
        variance: Math.round(balVar * 100) / 100,
      });
    }
  }

  return {
    all_reconciled: variances.length === 0,
    total_months_checked: totalChecked,
    months_with_variances: monthsWithVar.size,
    variances,
    max_balance_drift: Math.round(maxBalanceDrift * 100) / 100,
    cumulative_interest_variance: Math.round(cumulativeInterestVar * 100) / 100,
  };
}
