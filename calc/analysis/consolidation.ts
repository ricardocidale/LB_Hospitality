import type { RoundingPolicy } from "../../domain/types/rounding.js";
import { roundTo } from "../../domain/types/rounding.js";

export interface PropertyStatement {
  name: string;
  revenue: number;
  operating_expenses?: number;
  gop?: number;
  management_fees?: number;
  ffe_reserve?: number;
  noi: number;
  interest_expense?: number;
  depreciation?: number;
  income_tax?: number;
  net_income: number;
  operating_cash_flow?: number;
  financing_cash_flow?: number;
  ending_cash?: number;
  total_assets?: number;
  total_liabilities?: number;
  total_equity?: number;
}

export interface ManagementCompanyStatement {
  fee_revenue: number;
  operating_expenses?: number;
  net_income?: number;
  safe_funding?: number;
  ending_cash?: number;
  total_assets?: number;
  total_liabilities?: number;
  total_equity?: number;
}

export interface ConsolidationInput {
  consolidation_type: "properties_only" | "full_entity";
  period?: string;
  property_statements: PropertyStatement[];
  management_company?: ManagementCompanyStatement;
  rounding_policy: RoundingPolicy;
}

export interface ConsolidationOutput {
  consolidated_revenue: number;
  consolidated_expenses: number;
  consolidated_noi: number;
  consolidated_net_income: number;
  intercompany_eliminations: {
    management_fees_eliminated: number;
    fee_linkage_balanced: boolean;
    variance: number;
  };
  consolidated_assets: number;
  consolidated_liabilities: number;
  consolidated_equity: number;
  balance_sheet_balanced: boolean;
  property_count: number;
}

export function consolidateStatements(input: ConsolidationInput): ConsolidationOutput {
  const r = (v: number) => roundTo(v, input.rounding_policy);
  const props = input.property_statements;

  const propRevenue = r(props.reduce((s, p) => s + p.revenue, 0));
  const propExpenses = r(props.reduce((s, p) => s + (p.operating_expenses ?? 0), 0));
  const propNOI = r(props.reduce((s, p) => s + p.noi, 0));
  const propNetIncome = r(props.reduce((s, p) => s + p.net_income, 0));
  const propAssets = r(props.reduce((s, p) => s + (p.total_assets ?? 0), 0));
  const propLiabilities = r(props.reduce((s, p) => s + (p.total_liabilities ?? 0), 0));
  const propEquity = r(props.reduce((s, p) => s + (p.total_equity ?? 0), 0));
  const totalMgmtFeesPaid = r(props.reduce((s, p) => s + (p.management_fees ?? 0), 0));

  let consolidated_revenue = propRevenue;
  let consolidated_expenses = propExpenses;
  let consolidated_noi = propNOI;
  let consolidated_net_income = propNetIncome;
  let consolidated_assets = propAssets;
  let consolidated_liabilities = propLiabilities;
  let consolidated_equity = propEquity;

  let feeEliminated = 0;
  let feeLinkageBalanced = true;
  let feeVariance = 0;

  if (input.consolidation_type === "full_entity" && input.management_company) {
    const mc = input.management_company;
    consolidated_revenue = r(consolidated_revenue + mc.fee_revenue);
    consolidated_expenses = r(consolidated_expenses + (mc.operating_expenses ?? 0));
    consolidated_net_income = r(consolidated_net_income + (mc.net_income ?? 0));
    consolidated_assets = r(consolidated_assets + (mc.total_assets ?? 0));
    consolidated_liabilities = r(consolidated_liabilities + (mc.total_liabilities ?? 0));
    consolidated_equity = r(consolidated_equity + (mc.total_equity ?? 0));

    feeEliminated = r(Math.min(totalMgmtFeesPaid, mc.fee_revenue));
    feeVariance = r(Math.abs(totalMgmtFeesPaid - mc.fee_revenue));
    feeLinkageBalanced = feeVariance <= 1.0;

    consolidated_revenue = r(consolidated_revenue - feeEliminated);
    consolidated_expenses = r(consolidated_expenses - feeEliminated);
  }

  const bsBalanced = Math.abs(consolidated_assets - (consolidated_liabilities + consolidated_equity)) <= 1.0;

  return {
    consolidated_revenue,
    consolidated_expenses,
    consolidated_noi,
    consolidated_net_income,
    intercompany_eliminations: {
      management_fees_eliminated: feeEliminated,
      fee_linkage_balanced: feeLinkageBalanced,
      variance: feeVariance,
    },
    consolidated_assets,
    consolidated_liabilities,
    consolidated_equity,
    balance_sheet_balanced: bsBalanced,
    property_count: props.length,
  };
}
