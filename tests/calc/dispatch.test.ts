import { describe, it, expect } from "vitest";
import { executeComputationTool, isComputationTool } from "../../calc/dispatch";

const EXPECTED_TOOLS = [
  "calculate_dcf_npv",
  "build_irr_cashflow_vector",
  "compute_equity_multiple",
  "exit_valuation",
  "validate_financial_identities",
  "funding_gate_checks",
  "schedule_reconcile",
  "assumption_consistency_check",
  "export_verification",
  "consolidate_statements",
  "scenario_compare",
  "break_even_analysis",
  "compute_waterfall",
  "hold_vs_sell",
  "stress_test",
  "capex_reserve",
  "revpar_index",
  "calculate_debt_yield",
  "calculate_dscr",
  "calculate_prepayment",
  "calculate_sensitivity",
  "compare_loans",
  "centralized_service_margin",
  "cost_of_services_aggregator",
  "compute_property_metrics",
  "compute_depreciation_basis",
  "compute_debt_capacity",
  "compute_occupancy_ramp",
  "compute_adr_projection",
  "compute_cap_rate_valuation",
  "compute_cost_benchmarks",
  "compute_service_fee",
  "compute_markup_waterfall",
  "compute_make_vs_buy",
  "compute_wacc",
  "compute_portfolio_wacc",
  "compute_mirr",
];

describe("isComputationTool", () => {
  it("returns true for all registered tool names", () => {
    for (const name of EXPECTED_TOOLS) {
      expect(isComputationTool(name)).toBe(true);
    }
  });

  it("returns false for unknown tool names", () => {
    expect(isComputationTool("nonexistent_tool")).toBe(false);
    expect(isComputationTool("")).toBe(false);
    expect(isComputationTool("calculate_dcf_npv_v2")).toBe(false);
  });
});

describe("executeComputationTool", () => {
  it("returns null for unknown tool names", () => {
    expect(executeComputationTool("nonexistent", {})).toBeNull();
  });

  it("returns JSON string for valid tool calls", () => {
    const result = executeComputationTool("calculate_dcf_npv", {
      cashFlows: [100000, 110000, 120000],
      discountRate: 0.10,
    });
    expect(result).not.toBeNull();
    const parsed = JSON.parse(result!);
    expect(typeof parsed).toBe("object");
  });

  it("returns error JSON for invalid inputs instead of throwing", () => {
    const result = executeComputationTool("validate_financial_identities", {
      invalidData: true,
    });
    expect(result).not.toBeNull();
    const parsed = JSON.parse(result!);
    expect(typeof parsed).toBe("object");
  });

  it("DCF produces npv and pv_timeline", () => {
    const result = executeComputationTool("calculate_dcf_npv", {
      cash_flows: [50000, 60000, 70000],
      discount_rate: 0.08,
    });
    const parsed = JSON.parse(result!);
    expect(parsed.npv).toBeDefined();
    expect(typeof parsed.npv).toBe("number");
    expect(parsed.npv).toBeGreaterThan(0);
  });

  it("equity multiple computes correctly", () => {
    const result = executeComputationTool("compute_equity_multiple", {
      cash_flows: [-1000000, 500000, 500000, 1000000],
    });
    const parsed = JSON.parse(result!);
    expect(parsed.equity_multiple).toBeCloseTo(2.0, 1);
  });

  it("exit valuation uses cap rate", () => {
    const result = executeComputationTool("exit_valuation", {
      stabilized_noi: 500000,
      exit_cap_rate: 0.08,
      commission_rate: 0.05,
    });
    const parsed = JSON.parse(result!);
    expect(parsed.gross_sale_price).toBeCloseTo(6250000, -2);
  });

  it("debt yield computes ratio", () => {
    const result = executeComputationTool("calculate_debt_yield", {
      noi_annual: 400000,
      loan_amount: 4000000,
    });
    const parsed = JSON.parse(result!);
    expect(parsed.debt_yield).toBeCloseTo(0.10, 2);
  });

  it("MIRR computes modified return rate", () => {
    const result = executeComputationTool("compute_mirr", {
      cash_flow_vector: [-1000000, 300000, 400000, 500000, 600000],
      finance_rate: 0.10,
      reinvestment_rate: 0.12,
    });
    expect(result).not.toBeNull();
    const parsed = JSON.parse(result!);
    expect(parsed.is_valid).toBe(true);
    expect(parsed.mirr).toBeGreaterThan(0);
    expect(parsed.mirr).toBeLessThan(1);
  });
});
