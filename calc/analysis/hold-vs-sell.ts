import type { RoundingPolicy } from "../../domain/types/rounding.js";
import { roundTo } from "../../domain/types/rounding.js";
import { rounder, RATIO_ROUNDING, sumArray } from "../shared/utils.js";

export interface HoldVsSellInput {
  property_name?: string;
  current_noi: number;
  noi_growth_rate: number;
  current_market_value: number;
  exit_cap_rate: number;
  future_exit_cap_rate?: number;
  remaining_hold_years: number;
  discount_rate: number;
  outstanding_debt?: number;
  commission_rate?: number;
  annual_capex?: number;
  annual_debt_service?: number;
  original_cost_basis?: number;
  capital_gains_rate?: number;
  depreciation_recapture_rate?: number;
  accumulated_depreciation?: number;
  rounding_policy: RoundingPolicy;
}

export interface HoldScenario {
  projected_noi: number[];
  projected_fcf: number[];
  terminal_noi: number;
  terminal_value: number;
  net_terminal_proceeds: number;
  npv_hold: number;
  total_cash_flow_hold: number;
  hold_irr_approx: number;
}

export interface SellScenario {
  gross_sale_price: number;
  commission: number;
  net_sale_proceeds: number;
  debt_repayment: number;
  capital_gains_tax: number;
  depreciation_recapture_tax: number;
  net_after_tax_proceeds: number;
}

export interface HoldVsSellOutput {
  hold: HoldScenario;
  sell: SellScenario;
  recommendation: "hold" | "sell" | "indifferent";
  npv_advantage_hold: number;
  implied_exit_yield: number;
  opportunity_cost_of_hold: number;
  breakeven_noi_growth: number;
}

export function computeHoldVsSell(input: HoldVsSellInput): HoldVsSellOutput {
  const r = rounder(input.rounding_policy);
  const ratio = (v: number) => roundTo(v, RATIO_ROUNDING);

  const DEFAULT_SELL_COMMISSION = 0.05;
  const DEFAULT_CG_RATE = 0.20;
  const DEFAULT_DEP_RECAPTURE_RATE = 0.25;
  const commRate = input.commission_rate ?? DEFAULT_SELL_COMMISSION;
  const debt = input.outstanding_debt ?? 0;
  const capex = input.annual_capex ?? 0;
  const debtService = input.annual_debt_service ?? 0;
  const futureExitCap = input.future_exit_cap_rate ?? input.exit_cap_rate;
  const cgRate = input.capital_gains_rate ?? DEFAULT_CG_RATE;
  const depRecapRate = input.depreciation_recapture_rate ?? DEFAULT_DEP_RECAPTURE_RATE;
  const accDepreciation = input.accumulated_depreciation ?? 0;
  const costBasis = input.original_cost_basis ?? input.current_market_value;

  const projected_noi: number[] = [];
  const projected_fcf: number[] = [];
  let noi = input.current_noi;

  for (let y = 0; y < input.remaining_hold_years; y++) {
    noi = y === 0 ? noi : r(noi * (1 + input.noi_growth_rate));
    projected_noi.push(r(noi));
    projected_fcf.push(r(noi - capex - debtService));
  }

  const terminal_noi = projected_noi.length > 0
    ? r(projected_noi[projected_noi.length - 1] * (1 + input.noi_growth_rate))
    : r(input.current_noi * (1 + input.noi_growth_rate));

  const terminal_value = futureExitCap > 0 ? r(terminal_noi / futureExitCap) : 0;
  const terminalCommission = r(terminal_value * commRate);
  const net_terminal_proceeds = r(terminal_value - terminalCommission - debt);

  const holdCashFlows = [...projected_fcf];
  if (holdCashFlows.length > 0) {
    holdCashFlows[holdCashFlows.length - 1] += net_terminal_proceeds;
  }

  let npv_hold = 0;
  for (let t = 0; t < holdCashFlows.length; t++) {
    npv_hold += holdCashFlows[t] / Math.pow(1 + input.discount_rate, t + 1);
  }
  npv_hold = r(npv_hold);

  const total_cash_flow_hold = r(sumArray(projected_fcf) + net_terminal_proceeds);

  const initialInvestment = input.current_market_value;
  let hold_irr_approx = 0;
  if (initialInvestment > 0 && input.remaining_hold_years > 0) {
    hold_irr_approx = ratio(
      Math.pow(total_cash_flow_hold / initialInvestment, 1 / input.remaining_hold_years) - 1
    );
  }

  const gross_sale_price = input.current_market_value;
  const commission = r(gross_sale_price * commRate);
  const net_sale_proceeds = r(gross_sale_price - commission);
  const debt_repayment = r(debt);
  const netAfterDebt = r(net_sale_proceeds - debt_repayment);

  const adjustedBasis = r(costBasis - accDepreciation);
  const gain = r(Math.max(0, net_sale_proceeds - adjustedBasis));
  const depreciation_recapture_tax = r(Math.min(gain, accDepreciation) * depRecapRate);
  const capitalGain = r(Math.max(0, gain - accDepreciation));
  const capital_gains_tax = r(capitalGain * cgRate);
  const net_after_tax_proceeds = r(netAfterDebt - capital_gains_tax - depreciation_recapture_tax);

  const npv_advantage_hold = r(npv_hold - net_after_tax_proceeds);

  const implied_exit_yield = input.current_market_value > 0
    ? ratio(input.current_noi / input.current_market_value)
    : 0;

  const opportunity_cost_of_hold = r(net_after_tax_proceeds * input.discount_rate * input.remaining_hold_years);

  let breakeven_noi_growth = 0;
  if (input.remaining_hold_years > 0 && input.current_noi > 0) {
    const targetTotal = net_after_tax_proceeds * Math.pow(1 + input.discount_rate, input.remaining_hold_years);
    const avgAnnualNeeded = targetTotal / input.remaining_hold_years;
    breakeven_noi_growth = ratio(
      (avgAnnualNeeded / input.current_noi) - 1
    );
  }

  let recommendation: "hold" | "sell" | "indifferent";
  const threshold = input.current_market_value * 0.02;
  if (npv_advantage_hold > threshold) recommendation = "hold";
  else if (npv_advantage_hold < -threshold) recommendation = "sell";
  else recommendation = "indifferent";

  return {
    hold: {
      projected_noi,
      projected_fcf,
      terminal_noi,
      terminal_value,
      net_terminal_proceeds,
      npv_hold,
      total_cash_flow_hold,
      hold_irr_approx,
    },
    sell: {
      gross_sale_price,
      commission,
      net_sale_proceeds,
      debt_repayment,
      capital_gains_tax,
      depreciation_recapture_tax,
      net_after_tax_proceeds,
    },
    recommendation,
    npv_advantage_hold,
    implied_exit_yield,
    opportunity_cost_of_hold,
    breakeven_noi_growth,
  };
}
