import type { RoundingPolicy } from "../../domain/types/rounding.js";
import { roundTo } from "../../domain/types/rounding.js";

export interface EquityMultipleInput {
  cash_flows: number[];
  label?: string;
  rounding_policy: RoundingPolicy;
}

export interface EquityMultipleOutput {
  equity_multiple: number;
  total_invested: number;
  total_returned: number;
  net_profit: number;
  profit_margin: number;
  label: string;
}

export function computeEquityMultiple(input: EquityMultipleInput): EquityMultipleOutput {
  const r = (v: number) => roundTo(v, input.rounding_policy);

  const total_invested = r(
    Math.abs(input.cash_flows.filter(cf => cf < 0).reduce((sum, cf) => sum + cf, 0))
  );

  const total_returned = r(
    input.cash_flows.filter(cf => cf > 0).reduce((sum, cf) => sum + cf, 0)
  );

  const net_profit = r(total_returned - total_invested);

  const equity_multiple = total_invested > 0
    ? roundTo(total_returned / total_invested, { precision: 4, bankers_rounding: false })
    : 0;

  const profit_margin = total_invested > 0
    ? roundTo(net_profit / total_invested, { precision: 4, bankers_rounding: false })
    : 0;

  return {
    equity_multiple,
    total_invested,
    total_returned,
    net_profit,
    profit_margin,
    label: input.label ?? "",
  };
}
