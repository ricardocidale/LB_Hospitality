import type { RoundingPolicy } from "../../domain/types/rounding.js";
import { roundTo } from "../../domain/types/rounding.js";
import { rounder, RATIO_ROUNDING, roundCents } from "../shared/utils.js";

export interface StressTestInput {
  property_name?: string;
  base_adr: number;
  base_occupancy: number;
  base_noi: number;
  room_count: number;
  annual_revenue: number;
  annual_debt_service?: number;
  exit_cap_rate: number;
  hold_period_years: number;
  scenarios: StressScenario[];
  rounding_policy: RoundingPolicy;
}

export interface StressScenario {
  label: string;
  adr_shock_pct: number;
  occupancy_shock_pct: number;
  expense_shock_pct?: number;
  cap_rate_shock_bps?: number;
  revenue_shock_pct?: number;
}

export interface StressScenarioResult {
  label: string;
  stressed_adr: number;
  stressed_occupancy: number;
  stressed_revpar: number;
  stressed_revenue: number;
  stressed_noi: number;
  stressed_exit_cap: number;
  stressed_exit_value: number;
  noi_impact_pct: number;
  exit_value_impact_pct: number;
  dscr: number | null;
  dscr_passes: boolean;
  severity: "low" | "moderate" | "severe" | "critical";
}

export interface StressTestOutput {
  base_revpar: number;
  base_exit_value: number;
  base_dscr: number | null;
  scenarios: StressScenarioResult[];
  worst_case_noi: number;
  worst_case_exit_value: number;
  worst_case_dscr: number | null;
  scenarios_below_breakeven: number;
  scenarios_below_dscr_threshold: number;
  portfolio_risk_score: number;
}

export function computeStressTest(input: StressTestInput): StressTestOutput {
  const r = rounder(input.rounding_policy);
  const ratio = (v: number) => roundTo(v, RATIO_ROUNDING);

  const base_revpar = r(input.base_adr * input.base_occupancy);
  const base_exit_value = input.exit_cap_rate > 0 ? r(input.base_noi / input.exit_cap_rate) : 0;
  const base_dscr = input.annual_debt_service && input.annual_debt_service > 0
    ? ratio(input.base_noi / input.annual_debt_service)
    : null;

  const operatingExpenses = r(input.annual_revenue - input.base_noi);

  let worstNOI = input.base_noi;
  let worstExit = base_exit_value;
  let worstDSCR: number | null = base_dscr;
  let belowBreakeven = 0;
  let belowDSCR = 0;

  const results: StressScenarioResult[] = [];

  for (const scenario of input.scenarios) {
    const stressed_adr = r(input.base_adr * (1 + scenario.adr_shock_pct / 100));
    const stressed_occupancy = Math.min(1, Math.max(0,
      input.base_occupancy * (1 + scenario.occupancy_shock_pct / 100)
    ));
    const stressed_revpar = r(stressed_adr * stressed_occupancy);

    const revenueMultiplier = scenario.revenue_shock_pct !== undefined
      ? (1 + scenario.revenue_shock_pct / 100)
      : (stressed_revpar / (base_revpar || 1));
    const stressed_revenue = r(input.annual_revenue * revenueMultiplier);

    const expenseMultiplier = 1 + (scenario.expense_shock_pct ?? 0) / 100;
    const stressed_expenses = r(operatingExpenses * expenseMultiplier);
    const stressed_noi = r(stressed_revenue - stressed_expenses);

    const capRateShock = (scenario.cap_rate_shock_bps ?? 0) / 10000;
    const stressed_exit_cap = roundTo(input.exit_cap_rate + capRateShock, { precision: 4, bankers_rounding: false });
    const stressed_exit_value = stressed_exit_cap > 0 ? r(stressed_noi / stressed_exit_cap) : 0;

    const noi_impact_pct = input.base_noi !== 0
      ? roundCents(((stressed_noi - input.base_noi) / Math.abs(input.base_noi)) * 100)
      : 0;

    const exit_value_impact_pct = base_exit_value !== 0
      ? roundCents(((stressed_exit_value - base_exit_value) / Math.abs(base_exit_value)) * 100)
      : 0;

    const MIN_DSCR_THRESHOLD = 1.25;
    let dscr: number | null = null;
    let dscr_passes = true;
    if (input.annual_debt_service && input.annual_debt_service > 0) {
      dscr = ratio(stressed_noi / input.annual_debt_service);
      dscr_passes = dscr >= MIN_DSCR_THRESHOLD;
      if (!dscr_passes) belowDSCR++;
      if (worstDSCR === null || dscr < worstDSCR) worstDSCR = dscr;
    }

    if (stressed_noi <= 0) belowBreakeven++;
    if (stressed_noi < worstNOI) worstNOI = stressed_noi;
    if (stressed_exit_value < worstExit) worstExit = stressed_exit_value;

    const SEVERITY_MODERATE = -5;
    const SEVERITY_SEVERE = -15;
    const SEVERITY_CRITICAL = -30;
    let severity: "low" | "moderate" | "severe" | "critical";
    if (noi_impact_pct > SEVERITY_MODERATE) severity = "low";
    else if (noi_impact_pct > SEVERITY_SEVERE) severity = "moderate";
    else if (noi_impact_pct > SEVERITY_CRITICAL) severity = "severe";
    else severity = "critical";

    results.push({
      label: scenario.label,
      stressed_adr,
      stressed_occupancy: roundTo(stressed_occupancy, RATIO_ROUNDING),
      stressed_revpar,
      stressed_revenue,
      stressed_noi,
      stressed_exit_cap,
      stressed_exit_value,
      noi_impact_pct,
      exit_value_impact_pct,
      dscr,
      dscr_passes,
      severity,
    });
  }

  const totalScenarios = results.length;
  const criticalCount = results.filter(s => s.severity === "critical").length;
  const severeCount = results.filter(s => s.severity === "severe").length;
  const portfolio_risk_score = totalScenarios > 0
    ? Math.round(((criticalCount * 3 + severeCount * 2 + belowBreakeven * 4) / totalScenarios) * 100) / 100
    : 0;

  return {
    base_revpar,
    base_exit_value,
    base_dscr,
    scenarios: results,
    worst_case_noi: r(worstNOI),
    worst_case_exit_value: r(worstExit),
    worst_case_dscr: worstDSCR,
    scenarios_below_breakeven: belowBreakeven,
    scenarios_below_dscr_threshold: belowDSCR,
    portfolio_risk_score,
  };
}

// Scenario config — values are percentage shocks, not financial constants
// skipcalcscan
export const STANDARD_STRESS_SCENARIOS: StressScenario[] = [
  { label: "Mild Recession", adr_shock_pct: -5, occupancy_shock_pct: -10, expense_shock_pct: 3 },
  { label: "Moderate Downturn", adr_shock_pct: -10, occupancy_shock_pct: -15, expense_shock_pct: 5, cap_rate_shock_bps: 50 },
  { label: "Severe Recession", adr_shock_pct: -15, occupancy_shock_pct: -25, expense_shock_pct: 8, cap_rate_shock_bps: 100 },
  { label: "Pandemic Shock", adr_shock_pct: -30, occupancy_shock_pct: -50, expense_shock_pct: -10, cap_rate_shock_bps: 150 },
  { label: "Inflationary Pressure", adr_shock_pct: 5, occupancy_shock_pct: -5, expense_shock_pct: 15 },
  { label: "New Supply Shock", adr_shock_pct: -8, occupancy_shock_pct: -12, expense_shock_pct: 2, cap_rate_shock_bps: 25 },
];
