import type { RoundingPolicy } from "../../domain/types/rounding.js";
import { roundTo } from "../../domain/types/rounding.js";

export interface ExitValuationInput {
  stabilized_noi: number;
  exit_cap_rate: number;
  commission_rate?: number;
  outstanding_debt?: number;
  other_closing_costs?: number;
  room_count?: number;
  property_name?: string;
  rounding_policy: RoundingPolicy;
}

export interface ExitValuationOutput {
  gross_sale_price: number;
  implied_price_per_key: number | null;
  commission: number;
  net_sale_proceeds: number;
  debt_repayment: number;
  net_to_equity: number;
  debt_free_at_exit: boolean;
}

export function computeExitValuation(input: ExitValuationInput): ExitValuationOutput {
  const r = (v: number) => roundTo(v, input.rounding_policy);
  const commissionRate = input.commission_rate ?? 0.02;
  const outstandingDebt = input.outstanding_debt ?? 0;
  const otherClosingCosts = input.other_closing_costs ?? 0;

  const gross_sale_price = input.exit_cap_rate > 0
    ? r(input.stabilized_noi / input.exit_cap_rate)
    : 0;

  const implied_price_per_key = input.room_count && input.room_count > 0
    ? r(gross_sale_price / input.room_count)
    : null;

  const commission = r(gross_sale_price * commissionRate);
  const net_sale_proceeds = r(gross_sale_price - commission - otherClosingCosts);
  const debt_repayment = r(outstandingDebt);
  const net_to_equity = r(net_sale_proceeds - debt_repayment);
  const debt_free_at_exit = net_to_equity >= 0;

  return {
    gross_sale_price,
    implied_price_per_key,
    commission,
    net_sale_proceeds,
    debt_repayment,
    net_to_equity,
    debt_free_at_exit,
  };
}
