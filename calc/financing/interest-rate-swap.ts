import type { RoundingPolicy } from "../../domain/types/rounding.js";
import { roundTo } from "../../domain/types/rounding.js";
import { rounder, RATIO_ROUNDING } from "../shared/utils.js";

export interface InterestRateSwapInput {
  notional_amount: number;
  fixed_rate: number;
  floating_rate_current: number;
  floating_rate_spread: number;
  swap_term_years: number;
  payment_frequency: 1 | 2 | 4 | 12;
  rate_scenarios?: number[];
  noi_annual?: number;
  rounding_policy: RoundingPolicy;
}

export interface SwapPeriodCashFlow {
  period: number;
  fixed_payment: number;
  floating_payment: number;
  net_payment: number;
  payer: "fixed_payer" | "floating_payer" | "neutral";
}

export interface SwapScenarioResult {
  floating_rate: number;
  annual_fixed_cost: number;
  annual_floating_cost: number;
  annual_net_swap: number;
  all_in_cost_with_swap: number;
  all_in_cost_without_swap: number;
  savings_with_swap: number;
  effective_rate_with_swap: number;
  dscr_with_swap: number | null;
  dscr_without_swap: number | null;
}

export interface InterestRateSwapOutput {
  notional: number;
  fixed_rate: number;
  current_floating_rate: number;
  all_in_floating_rate: number;
  swap_term_years: number;
  periods_per_year: number;
  total_periods: number;
  annual_fixed_cost: number;
  annual_floating_cost: number;
  annual_net_swap_payment: number;
  current_payer: "fixed_payer" | "floating_payer" | "neutral";
  period_cash_flows: SwapPeriodCashFlow[];
  breakeven_floating_rate: number;
  rate_scenarios: SwapScenarioResult[];
  total_swap_cost_over_term: number;
  swap_recommendation: "favorable" | "unfavorable" | "neutral";
}

export function computeInterestRateSwap(input: InterestRateSwapInput): InterestRateSwapOutput {
  const r = rounder(input.rounding_policy);
  const rate = (v: number) => roundTo(v, RATIO_ROUNDING);

  const periodsPerYear = input.payment_frequency;
  const totalPeriods = input.swap_term_years * periodsPerYear;
  const allInFloating = rate(input.floating_rate_current + input.floating_rate_spread);

  const periodFixedRate = input.fixed_rate / periodsPerYear;
  const periodFloatingRate = allInFloating / periodsPerYear;

  const periodFixedPayment = r(input.notional_amount * periodFixedRate);
  const periodFloatingPayment = r(input.notional_amount * periodFloatingRate);

  const annual_fixed_cost = r(periodFixedPayment * periodsPerYear);
  const annual_floating_cost = r(periodFloatingPayment * periodsPerYear);
  const annual_net_swap_payment = r(annual_fixed_cost - annual_floating_cost);

  const NET_PAYMENT_THRESHOLD = 0.01;
  const period_cash_flows: SwapPeriodCashFlow[] = [];
  for (let i = 1; i <= totalPeriods; i++) {
    const net = r(periodFixedPayment - periodFloatingPayment);
    period_cash_flows.push({
      period: i,
      fixed_payment: periodFixedPayment,
      floating_payment: periodFloatingPayment,
      net_payment: net,
      payer: net > NET_PAYMENT_THRESHOLD ? "fixed_payer" : net < -NET_PAYMENT_THRESHOLD ? "floating_payer" : "neutral",
    });
  }

  const current_payer: "fixed_payer" | "floating_payer" | "neutral" =
    annual_net_swap_payment > NET_PAYMENT_THRESHOLD ? "fixed_payer" :
    annual_net_swap_payment < -NET_PAYMENT_THRESHOLD ? "floating_payer" : "neutral";

  const breakeven_floating_rate = rate(input.fixed_rate - input.floating_rate_spread);

  const total_swap_cost_over_term = r(annual_net_swap_payment * input.swap_term_years);

  const RATE_STEP_DOWN_2 = 0.02;
  const RATE_STEP_DOWN_1 = 0.01;
  const RATE_STEP_UP_1 = 0.01;
  const RATE_STEP_UP_2 = 0.02;
  const RATE_STEP_UP_3 = 0.03;
  const scenarioRates = input.rate_scenarios ?? [
    allInFloating - RATE_STEP_DOWN_2,
    allInFloating - RATE_STEP_DOWN_1,
    allInFloating,
    allInFloating + RATE_STEP_UP_1,
    allInFloating + RATE_STEP_UP_2,
    allInFloating + RATE_STEP_UP_3,
  ];

  const rate_scenarios: SwapScenarioResult[] = scenarioRates.map(floatingRate => {
    const scenarioFloating = r(input.notional_amount * floatingRate);
    const scenarioFixed = annual_fixed_cost;
    const scenarioNet = r(scenarioFixed - scenarioFloating);
    const allInWithSwap = scenarioFixed;
    const allInWithout = scenarioFloating;
    const savings = r(allInWithout - allInWithSwap);
    const effectiveRate = input.notional_amount > 0
      ? rate(allInWithSwap / input.notional_amount)
      : 0;

    let dscrWith: number | null = null;
    let dscrWithout: number | null = null;
    if (input.noi_annual && input.noi_annual > 0) {
      dscrWith = allInWithSwap > 0 ? rate(input.noi_annual / allInWithSwap) : 0;
      dscrWithout = allInWithout > 0 ? rate(input.noi_annual / allInWithout) : 0;
    }

    return {
      floating_rate: rate(floatingRate),
      annual_fixed_cost: scenarioFixed,
      annual_floating_cost: scenarioFloating,
      annual_net_swap: scenarioNet,
      all_in_cost_with_swap: allInWithSwap,
      all_in_cost_without_swap: allInWithout,
      savings_with_swap: savings,
      effective_rate_with_swap: effectiveRate,
      dscr_with_swap: dscrWith,
      dscr_without_swap: dscrWithout,
    };
  });

  const favorableCount = rate_scenarios.filter(s => s.savings_with_swap > 0).length;
  const swap_recommendation: "favorable" | "unfavorable" | "neutral" =
    favorableCount > rate_scenarios.length / 2 ? "favorable" :
    favorableCount < rate_scenarios.length / 2 ? "unfavorable" : "neutral";

  return {
    notional: input.notional_amount,
    fixed_rate: input.fixed_rate,
    current_floating_rate: input.floating_rate_current,
    all_in_floating_rate: allInFloating,
    swap_term_years: input.swap_term_years,
    periods_per_year: periodsPerYear,
    total_periods: totalPeriods,
    annual_fixed_cost,
    annual_floating_cost,
    annual_net_swap_payment,
    current_payer,
    period_cash_flows,
    breakeven_floating_rate,
    rate_scenarios,
    total_swap_cost_over_term,
    swap_recommendation,
  };
}
