import { z } from "zod";

export const dcfSchema = z.object({
  cash_flows: z.array(z.number()).min(1),
  discount_rate: z.number().positive(),
  periods_per_year: z.number().int().positive().optional(),
  irr_cross_check: z.number().optional(),
  tolerance: z.number().positive().optional(),
});

export const irrVectorSchema = z.object({
  equity_invested: z.number().positive(),
  acquisition_year: z.number().int().min(0),
  yearly_fcfe: z.array(z.number()),
  refinancing_proceeds: z.array(z.number()).optional(),
  exit_proceeds: z.number().optional(),
  projection_years: z.number().int().positive(),
  include_exit: z.boolean().optional(),
});

export const equityMultipleSchema = z.object({
  cash_flows: z.array(z.number()).min(1),
  label: z.string().optional(),
});

export const exitValuationSchema = z.object({
  stabilized_noi: z.number().positive(),
  exit_cap_rate: z.number().positive(),
  commission_rate: z.number().min(0).max(0.10).optional(),
  outstanding_debt: z.number().min(0).optional(),
  other_closing_costs: z.number().min(0).optional(),
  room_count: z.number().int().positive().optional(),
  property_name: z.string().optional(),
});

export const financialIdentitiesSchema = z.object({
  period_label: z.string().optional(),
  balance_sheet: z.object({
    total_assets: z.number(),
    total_liabilities: z.number(),
    total_equity: z.number(),
  }),
  income_statement: z.object({
    revenue: z.number().optional(),
    total_expenses: z.number().optional(),
    gop: z.number().optional(),
    noi: z.number(),
    interest_expense: z.number(),
    depreciation: z.number(),
    income_tax: z.number(),
    net_income: z.number(),
  }),
  cash_flow_statement: z.object({
    operating_cash_flow: z.number(),
    financing_cash_flow: z.number(),
    net_cash_change: z.number().optional(),
    beginning_cash: z.number().optional(),
    ending_cash: z.number(),
    principal_payment: z.number().optional(),
    refinancing_proceeds: z.number().optional(),
  }),
  tolerance: z.number().positive().optional(),
});

export const fundingGatesSchema = z.object({
  entity_type: z.enum(["property", "management_company", "portfolio"]),
  entity_name: z.string(),
  operations_start_date: z.string().optional(),
  funding_date: z.string().optional(),
  monthly_ending_cash: z.array(z.number()),
  final_debt_outstanding: z.number().optional(),
  monthly_distributions: z.array(z.number()).optional(),
});

export const scheduleReconcileSchema = z.object({
  property_name: z.string().optional(),
  schedule: z.array(z.object({
    month: z.number().int(),
    expected_interest: z.number(),
    expected_principal: z.number(),
    expected_payment: z.number().optional(),
    expected_ending_balance: z.number(),
  })),
  engine_outputs: z.array(z.object({
    month: z.number().int(),
    actual_interest: z.number(),
    actual_principal: z.number(),
    actual_payment: z.number().optional(),
    actual_ending_balance: z.number(),
  })),
  tolerance: z.number().positive().optional(),
});

export const assumptionConsistencySchema = z.object({
  global_assumptions: z.object({
    model_start_date: z.string(),
    projection_years: z.number().int().positive().optional(),
    company_ops_start_date: z.string().optional(),
    inflation_rate: z.number().optional(),
    fixed_cost_escalation_rate: z.number().optional(),
    base_management_fee: z.number().optional(),
    incentive_management_fee: z.number().optional(),
    safe_tranche1_date: z.string().optional(),
    safe_tranche1_amount: z.number().optional(),
    safe_tranche2_date: z.string().optional(),
    safe_tranche2_amount: z.number().optional(),
    exit_cap_rate: z.number().optional(),
    debt_assumptions: z.object({
      interest_rate: z.number().optional(),
      amortization_years: z.number().int().optional(),
      acq_ltv: z.number().optional(),
      refi_ltv: z.number().optional(),
    }).optional(),
  }),
  properties: z.array(z.object({
    name: z.string(),
    operations_start_date: z.string(),
    acquisition_date: z.string().optional(),
    purchase_price: z.number(),
    room_count: z.number().int().optional(),
    start_adr: z.number().optional(),
    start_occupancy: z.number().optional(),
    max_occupancy: z.number().optional(),
    type: z.string().optional(),
    will_refinance: z.string().optional(),
    refinance_date: z.string().optional(),
    exit_cap_rate: z.number().optional(),
    land_value_percent: z.number().optional(),
  })).optional(),
});

export const exportVerificationSchema = z.object({
  export_format: z.enum(["excel", "pdf", "pptx", "csv", "png_chart", "png_table"]),
  export_source: z.enum(["income_statement", "cash_flow", "balance_sheet", "investment_analysis", "dashboard", "company_financials", "consolidated"]),
  expected_sections: z.array(z.string()).optional(),
  sample_values: z.array(z.object({
    label: z.string(),
    expected_value: z.number(),
    exported_value: z.number(),
    tolerance: z.number().optional(),
  })).optional(),
  expected_year_count: z.number().int().optional(),
  expected_property_count: z.number().int().optional(),
  actual_sections: z.array(z.string()).optional(),
  actual_year_count: z.number().int().optional(),
  actual_property_count: z.number().int().optional(),
});

const scenarioMetricsSchema = z.object({
  total_revenue: z.array(z.number()).optional(),
  noi: z.array(z.number()),
  net_income: z.array(z.number()).optional(),
  ending_cash: z.array(z.number()).optional(),
  irr: z.number(),
  equity_multiple: z.number().optional(),
  average_dscr: z.number().optional(),
  exit_value: z.number().optional(),
});

export const consolidationSchema = z.object({
  consolidation_type: z.enum(["properties_only", "full_entity"]),
  period: z.string().optional(),
  property_statements: z.array(z.object({
    name: z.string(),
    revenue: z.number(),
    operating_expenses: z.number().optional(),
    gop: z.number().optional(),
    management_fees: z.number().optional(),
    ffe_reserve: z.number().optional(),
    noi: z.number(),
    interest_expense: z.number().optional(),
    depreciation: z.number().optional(),
    income_tax: z.number().optional(),
    net_income: z.number(),
    operating_cash_flow: z.number().optional(),
    financing_cash_flow: z.number().optional(),
    ending_cash: z.number().optional(),
    total_assets: z.number().optional(),
    total_liabilities: z.number().optional(),
    total_equity: z.number().optional(),
  })),
  management_company: z.object({
    fee_revenue: z.number(),
    operating_expenses: z.number().optional(),
    net_income: z.number().optional(),
    safe_funding: z.number().optional(),
    ending_cash: z.number().optional(),
    total_assets: z.number().optional(),
    total_liabilities: z.number().optional(),
    total_equity: z.number().optional(),
  }).optional(),
});

export const scenarioCompareSchema = z.object({
  baseline_label: z.string(),
  alternative_label: z.string(),
  assumption_changes: z.array(z.object({
    field: z.string(),
    baseline_value: z.string(),
    alternative_value: z.string(),
  })).optional(),
  baseline_metrics: scenarioMetricsSchema,
  alternative_metrics: scenarioMetricsSchema,
});

export const breakEvenSchema = z.object({
  property_name: z.string().optional(),
  room_count: z.number().int().positive(),
  adr: z.number().positive(),
  days_per_month: z.number().positive().optional(),
  variable_cost_rate: z.number().min(0).max(1),
  fixed_costs_monthly: z.number().min(0),
  management_fee_rate: z.number().min(0).max(0.20).optional(),
  ffe_reserve_rate: z.number().min(0).max(0.15).optional(),
  monthly_debt_service: z.number().min(0).optional(),
  monthly_income_tax_estimate: z.number().min(0).optional(),
  ancillary_revenue_pct: z.number().min(0).optional(),
});
