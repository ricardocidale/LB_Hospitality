import { describe, it, expect } from "vitest";
import { computeFCF } from "../../analytics/fcf/compute-fcf.js";
import type { PostedEntry } from "../../domain/ledger/types.js";
import type { PeriodIncomeStatement, PeriodCashFlow } from "../../statements/types.js";
import type { RoundingPolicy } from "../../domain/types/rounding.js";

const rounding: RoundingPolicy = { precision: 2, bankers_rounding: false };

function makeEntry(overrides: Partial<PostedEntry>): PostedEntry {
  return {
    period: "2026-06",
    event_id: "evt1",
    account: "CASH",
    debit: 0,
    credit: 0,
    classification: "BS_ASSET",
    cash_flow_bucket: "FINANCING",
    memo: "",
    ...overrides,
  };
}

describe("computeFCF — basic funding event", () => {
  it("computes FCFE for a funding event (no IS activity)", () => {
    const entries: PostedEntry[] = [
      makeEntry({ account: "CASH", debit: 1_000_000, credit: 0, cash_flow_bucket: "FINANCING" }),
      makeEntry({ account: "EQUITY_CONTRIBUTED", debit: 0, credit: 1_000_000, classification: "BS_EQUITY", cash_flow_bucket: "FINANCING" }),
    ];
    const is: PeriodIncomeStatement[] = [{
      period: "2026-06",
      revenue_accounts: [],
      expense_accounts: [],
      total_revenue: 0,
      total_expenses: 0,
      net_income: 0,
    }];
    const cf: PeriodCashFlow[] = [{
      period: "2026-06",
      operating: 0,
      investing: 0,
      financing: 1_000_000,
      net_cash_change: 1_000_000,
    }];

    const result = computeFCF({ income_statements: is, cash_flows: cf, posted_entries: entries }, rounding);
    expect(result.consolidated.entries).toHaveLength(1);
    const entry = result.consolidated.entries[0];
    // No IS activity → FCFF = FCFE = 0 (funding is equity, not operating)
    expect(entry.fcff).toBe(0);
    // FCFE = FCFF - interest + net borrowing = 0 - 0 + 0 = 0
    // (equity contribution is not net borrowing)
    expect(entry.fcfe).toBe(0);
  });
});

describe("computeFCF — debt service event", () => {
  it("computes FCFE for interest + principal payment", () => {
    const entries: PostedEntry[] = [
      makeEntry({ period: "2026-08", account: "INTEREST_EXPENSE", debit: 7500, credit: 0, classification: "IS_EXPENSE", cash_flow_bucket: "OPERATING" }),
      makeEntry({ period: "2026-08", account: "CASH", debit: 0, credit: 7500, cash_flow_bucket: "OPERATING" }),
      makeEntry({ period: "2026-08", account: "DEBT_ACQUISITION", debit: 2500, credit: 0, classification: "BS_LIABILITY", cash_flow_bucket: "FINANCING" }),
      makeEntry({ period: "2026-08", account: "CASH", debit: 0, credit: 2500, cash_flow_bucket: "FINANCING" }),
    ];
    const is: PeriodIncomeStatement[] = [{
      period: "2026-08",
      revenue_accounts: [],
      expense_accounts: [{ account: "INTEREST_EXPENSE", amount: 7500 }],
      total_revenue: 0,
      total_expenses: 7500,
      net_income: -7500,
    }];
    const cf: PeriodCashFlow[] = [{
      period: "2026-08",
      operating: -7500,
      investing: 0,
      financing: -2500,
      net_cash_change: -10000,
    }];

    const result = computeFCF({ income_statements: is, cash_flows: cf, posted_entries: entries }, rounding);
    const entry = result.consolidated.entries[0];

    // NI = -7500, Interest = 7500, CapEx = 0, Net Borrowing = -2500
    // FCFF = NI + Interest - CapEx = -7500 + 7500 = 0
    expect(entry.fcff).toBe(0);
    // FCFE = FCFF - Interest + Net Borrowing = 0 - 7500 + (-2500) = -10000
    expect(entry.fcfe).toBe(-10_000);
  });
});

describe("computeFCF — acquisition event", () => {
  it("identifies capex from property purchase", () => {
    const entries: PostedEntry[] = [
      makeEntry({ period: "2026-07", account: "PROPERTY", debit: 1_500_000, credit: 0, classification: "BS_ASSET", cash_flow_bucket: "INVESTING" }),
      makeEntry({ period: "2026-07", account: "DEBT_ACQUISITION", debit: 0, credit: 1_000_000, classification: "BS_LIABILITY", cash_flow_bucket: "FINANCING" }),
      makeEntry({ period: "2026-07", account: "EQUITY_CONTRIBUTED", debit: 0, credit: 500_000, classification: "BS_EQUITY", cash_flow_bucket: "FINANCING" }),
    ];
    const is: PeriodIncomeStatement[] = [{
      period: "2026-07",
      revenue_accounts: [],
      expense_accounts: [],
      total_revenue: 0,
      total_expenses: 0,
      net_income: 0,
    }];
    const cf: PeriodCashFlow[] = [{
      period: "2026-07",
      operating: 0,
      investing: 0,
      financing: 0,
      net_cash_change: 0,
    }];

    const result = computeFCF({ income_statements: is, cash_flows: cf, posted_entries: entries }, rounding);
    const entry = result.consolidated.entries[0];

    // CapEx = PROPERTY debit = 1,500,000
    expect(entry.capex).toBe(1_500_000);
    // Net borrowing = DEBT credit = 1,000,000
    expect(entry.net_borrowing).toBe(1_000_000);
    // FCFF = NI + Interest - CapEx = 0 + 0 - 1,500,000 = -1,500,000
    expect(entry.fcff).toBe(-1_500_000);
    // FCFE = FCFF - Interest + Net Borrowing = -1,500,000 + 1,000,000 = -500,000
    expect(entry.fcfe).toBe(-500_000);
  });
});

describe("computeFCF — totals", () => {
  it("sums totals across periods", () => {
    const entries: PostedEntry[] = [
      // Period 1: funding
      makeEntry({ period: "2026-06", account: "CASH", debit: 1_000_000, cash_flow_bucket: "FINANCING" }),
      makeEntry({ period: "2026-06", account: "EQUITY_CONTRIBUTED", debit: 0, credit: 1_000_000, classification: "BS_EQUITY", cash_flow_bucket: "FINANCING" }),
      // Period 2: interest payment
      makeEntry({ period: "2026-07", account: "INTEREST_EXPENSE", debit: 5000, classification: "IS_EXPENSE", cash_flow_bucket: "OPERATING" }),
      makeEntry({ period: "2026-07", account: "CASH", debit: 0, credit: 5000, cash_flow_bucket: "OPERATING" }),
    ];
    const is: PeriodIncomeStatement[] = [
      { period: "2026-06", revenue_accounts: [], expense_accounts: [], total_revenue: 0, total_expenses: 0, net_income: 0 },
      { period: "2026-07", revenue_accounts: [], expense_accounts: [{ account: "INTEREST_EXPENSE", amount: 5000 }], total_revenue: 0, total_expenses: 5000, net_income: -5000 },
    ];
    const cf: PeriodCashFlow[] = [
      { period: "2026-06", operating: 0, investing: 0, financing: 1_000_000, net_cash_change: 1_000_000 },
      { period: "2026-07", operating: -5000, investing: 0, financing: 0, net_cash_change: -5000 },
    ];

    const result = computeFCF({ income_statements: is, cash_flows: cf, posted_entries: entries }, rounding);
    expect(result.consolidated.entries).toHaveLength(2);
    // Total FCFF = 0 + (-5000 + 5000) = 0
    expect(result.consolidated.total_fcff).toBe(0);
    // Total FCFE = 0 + (-5000 + 5000 - 5000) = -5000
    expect(result.consolidated.total_fcfe).toBe(-5000);
  });
});

describe("computeFCF — empty input", () => {
  it("returns empty for no data", () => {
    const result = computeFCF(
      { income_statements: [], cash_flows: [], posted_entries: [] },
      rounding,
    );
    expect(result.consolidated.entries).toHaveLength(0);
    expect(result.consolidated.total_fcff).toBe(0);
    expect(result.consolidated.total_fcfe).toBe(0);
  });
});
