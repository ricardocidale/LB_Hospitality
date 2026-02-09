import type { RoundingPolicy } from "../../domain/types/rounding.js";
import { rounder, withinTolerance, variance, DEFAULT_TOLERANCE } from "../shared/utils.js";

export interface FinancialIdentitiesInput {
  period_label?: string;
  balance_sheet: {
    total_assets: number;
    total_liabilities: number;
    total_equity: number;
  };
  income_statement: {
    revenue?: number;
    total_expenses?: number;
    gop?: number;
    noi: number;
    interest_expense: number;
    depreciation: number;
    income_tax: number;
    net_income: number;
  };
  cash_flow_statement: {
    operating_cash_flow: number;
    financing_cash_flow: number;
    net_cash_change?: number;
    beginning_cash?: number;
    ending_cash: number;
    principal_payment?: number;
    refinancing_proceeds?: number;
  };
  tolerance?: number;
  rounding_policy: RoundingPolicy;
}

export interface IdentityCheck {
  identity: string;
  formula: string;
  gaap_reference: string;
  expected: number;
  actual: number;
  variance: number;
  passed: boolean;
  severity: "critical" | "material" | "minor";
}

export interface FinancialIdentitiesOutput {
  all_passed: boolean;
  checks: IdentityCheck[];
  opinion: "UNQUALIFIED" | "QUALIFIED" | "ADVERSE";
}

function makeCheck(
  identity: string, formula: string, gaap_reference: string,
  expected: number, actual: number, tol: number,
  failSeverity: "critical" | "material",
  r: (v: number) => number,
): IdentityCheck {
  const v = r(variance(actual, expected));
  const passed = withinTolerance(actual, expected, tol);
  return { identity, formula, gaap_reference, expected, actual: r(actual), variance: v, passed, severity: passed ? "minor" : failSeverity };
}

export function validateFinancialIdentities(input: FinancialIdentitiesInput): FinancialIdentitiesOutput {
  const r = rounder(input.rounding_policy);
  const tol = input.tolerance ?? DEFAULT_TOLERANCE;
  const bs = input.balance_sheet;
  const is = input.income_statement;
  const cf = input.cash_flow_statement;
  const checks: IdentityCheck[] = [];

  checks.push(makeCheck(
    "Balance Sheet Equation", "Total Assets = Total Liabilities + Total Equity", "ASC 210",
    r(bs.total_liabilities + bs.total_equity), r(bs.total_assets), tol, "critical", r,
  ));

  checks.push(makeCheck(
    "Indirect Method Operating Cash Flow", "OCF = Net Income + Depreciation (non-cash add-back)", "ASC 230-10-45",
    r(is.net_income + is.depreciation), r(cf.operating_cash_flow), tol, "material", r,
  ));

  checks.push(makeCheck(
    "Net Income Derivation", "Net Income = NOI - Interest Expense - Depreciation - Income Tax", "ASC 220",
    r(is.noi - is.interest_expense - is.depreciation - is.income_tax), r(is.net_income), tol, "material", r,
  ));

  if (cf.principal_payment !== undefined) {
    const refiProceeds = cf.refinancing_proceeds ?? 0;
    checks.push(makeCheck(
      "Financing Cash Flow Composition", "CFF = -Principal Payment + Refinancing Proceeds", "ASC 230-10-45-15",
      r(-cf.principal_payment + refiProceeds), r(cf.financing_cash_flow), tol, "material", r,
    ));
  }

  if (cf.beginning_cash !== undefined && cf.net_cash_change !== undefined) {
    checks.push(makeCheck(
      "Cash Reconciliation", "Ending Cash = Beginning Cash + Net Cash Change", "ASC 230-10-45-24",
      r(cf.beginning_cash + cf.net_cash_change), r(cf.ending_cash), tol, "critical", r,
    ));
  }

  const all_passed = checks.every(c => c.passed);
  const criticalFails = checks.filter(c => !c.passed && c.severity === "critical").length;

  let opinion: "UNQUALIFIED" | "QUALIFIED" | "ADVERSE";
  if (all_passed) opinion = "UNQUALIFIED";
  else if (criticalFails > 0) opinion = "ADVERSE";
  else opinion = "QUALIFIED";

  return { all_passed, checks, opinion };
}
