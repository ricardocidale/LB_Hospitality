import type { RoundingPolicy } from "../../domain/types/rounding.js";
import { roundTo } from "../../domain/types/rounding.js";
import { computeFinancing } from "./financing-calculator.js";
import type { FinancingInput, FinancingOutput } from "./types.js";

export interface LoanScenario {
  /** Human-readable label for this scenario */
  label: string;
  /** Full financing input */
  input: FinancingInput;
  /** Optional annual NOI for DSCR/debt yield computation */
  noi_annual?: number;
}

export interface LoanScenarioResult {
  label: string;
  loan_amount: number;
  loan_to_value: number | null;
  equity_required: number;
  closing_costs_total: number;
  monthly_payment_initial: number;
  annual_debt_service_initial: number;
  total_interest_paid: number;
  total_principal_paid: number;
  total_payments: number;
  /** Whether loan has IO period */
  has_io_period: boolean;
  /** Months of IO */
  io_months: number;
  /** DSCR if NOI provided */
  dscr: number | null;
  /** Debt yield if NOI provided */
  debt_yield: number | null;
  /** Balloon payment at maturity (0 if fully amortized) */
  balloon_at_maturity: number;
  /** Full financing output for detailed drill-down */
  financing_output: FinancingOutput;
}

export interface LoanComparisonDelta {
  field: string;
  values: { label: string; value: number | string | null }[];
  /** The scenario label that wins on this metric */
  favors: string;
}

export interface LoanComparisonOutput {
  scenarios: LoanScenarioResult[];
  /** Key metrics compared side-by-side */
  comparison_deltas: LoanComparisonDelta[];
  /** Which scenario requires least equity */
  lowest_equity_label: string;
  /** Which scenario has lowest total interest */
  lowest_interest_label: string;
  /** Which scenario has lowest monthly payment */
  lowest_payment_label: string;
  /** Which scenario has best DSCR (if NOI provided) */
  best_dscr_label: string | null;
}

/**
 * Compare multiple financing structures side-by-side.
 *
 * Runs each scenario through the full financing calculator and
 * produces normalized comparison metrics.
 */
export function compareLoanScenarios(scenarios: LoanScenario[]): LoanComparisonOutput {
  if (scenarios.length < 2) {
    throw new Error("Loan comparison requires at least 2 scenarios");
  }

  const results: LoanScenarioResult[] = scenarios.map(scenario => {
    const output = computeFinancing(scenario.input);
    const schedule = output.debt_service_schedule;
    const rounding = scenario.input.rounding_policy;
    const r = (v: number) => roundTo(v, rounding);

    const totalInterest = r(schedule.reduce((sum, e) => sum + e.interest, 0));
    const totalPrincipal = r(schedule.reduce((sum, e) => sum + e.principal, 0));
    const totalPayments = r(schedule.reduce((sum, e) => sum + e.payment, 0));

    const firstEntry = schedule[0];
    const lastEntry = schedule[schedule.length - 1];
    const monthlyPaymentInitial = firstEntry ? firstEntry.payment : 0;
    const annualDSInitial = r(monthlyPaymentInitial * 12);
    const balloon = lastEntry ? lastEntry.ending_balance : 0;

    const ioMonths = schedule.filter(e => e.is_io).length;

    const dscr = scenario.noi_annual && annualDSInitial > 0
      ? roundTo(scenario.noi_annual / annualDSInitial, { precision: 4, bankers_rounding: false })
      : null;

    const debtYield = scenario.noi_annual && output.loan_amount_gross > 0
      ? roundTo(scenario.noi_annual / output.loan_amount_gross, { precision: 6, bankers_rounding: false })
      : null;

    const ltv = scenario.input.purchase_price > 0
      ? roundTo(output.loan_amount_gross / scenario.input.purchase_price, { precision: 4, bankers_rounding: false })
      : null;

    return {
      label: scenario.label,
      loan_amount: output.loan_amount_gross,
      loan_to_value: ltv,
      equity_required: output.equity_required,
      closing_costs_total: output.closing_costs.total,
      monthly_payment_initial: monthlyPaymentInitial,
      annual_debt_service_initial: annualDSInitial,
      total_interest_paid: totalInterest,
      total_principal_paid: totalPrincipal,
      total_payments: totalPayments,
      has_io_period: ioMonths > 0,
      io_months: ioMonths,
      dscr,
      debt_yield: debtYield,
      balloon_at_maturity: balloon,
      financing_output: output,
    };
  });

  const lowestEquity = results.reduce((min, s) => s.equity_required < min.equity_required ? s : min);
  const lowestInterest = results.reduce((min, s) => s.total_interest_paid < min.total_interest_paid ? s : min);
  const lowestPayment = results.reduce((min, s) => s.monthly_payment_initial < min.monthly_payment_initial ? s : min);

  const dscrResults = results.filter(s => s.dscr !== null);
  const bestDSCR = dscrResults.length > 0
    ? dscrResults.reduce((best, s) => (s.dscr ?? 0) > (best.dscr ?? 0) ? s : best)
    : null;

  const comparisonDeltas: LoanComparisonDelta[] = [
    {
      field: "Loan Amount",
      values: results.map(s => ({ label: s.label, value: s.loan_amount })),
      favors: lowestEquity.label,
    },
    {
      field: "Equity Required",
      values: results.map(s => ({ label: s.label, value: s.equity_required })),
      favors: lowestEquity.label,
    },
    {
      field: "Monthly Payment (Initial)",
      values: results.map(s => ({ label: s.label, value: s.monthly_payment_initial })),
      favors: lowestPayment.label,
    },
    {
      field: "Total Interest Paid",
      values: results.map(s => ({ label: s.label, value: s.total_interest_paid })),
      favors: lowestInterest.label,
    },
    {
      field: "Total Payments",
      values: results.map(s => ({ label: s.label, value: s.total_payments })),
      favors: lowestInterest.label,
    },
    {
      field: "Balloon at Maturity",
      values: results.map(s => ({ label: s.label, value: s.balloon_at_maturity })),
      favors: results.reduce((min, s) => s.balloon_at_maturity < min.balloon_at_maturity ? s : min).label,
    },
  ];

  if (dscrResults.length > 0) {
    comparisonDeltas.push({
      field: "DSCR",
      values: results.map(s => ({ label: s.label, value: s.dscr })),
      favors: bestDSCR?.label ?? "",
    });
    comparisonDeltas.push({
      field: "Debt Yield",
      values: results.map(s => ({ label: s.label, value: s.debt_yield })),
      favors: results
        .filter(s => s.debt_yield !== null)
        .reduce((best, s) => (s.debt_yield ?? 0) > (best.debt_yield ?? 0) ? s : best, results[0])
        .label,
    });
  }

  return {
    scenarios: results,
    comparison_deltas: comparisonDeltas,
    lowest_equity_label: lowestEquity.label,
    lowest_interest_label: lowestInterest.label,
    lowest_payment_label: lowestPayment.label,
    best_dscr_label: bestDSCR?.label ?? null,
  };
}
