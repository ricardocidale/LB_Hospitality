import type { RoundingPolicy } from "../../domain/types/rounding.js";
import { roundTo } from "../../domain/types/rounding.js";

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

export function validateFinancialIdentities(input: FinancialIdentitiesInput): FinancialIdentitiesOutput {
  const r = (v: number) => roundTo(v, input.rounding_policy);
  const tol = input.tolerance ?? 1.0;
  const bs = input.balance_sheet;
  const is = input.income_statement;
  const cf = input.cash_flow_statement;
  const checks: IdentityCheck[] = [];

  // 1. Balance Sheet: A = L + E
  const bsExpected = r(bs.total_liabilities + bs.total_equity);
  const bsVariance = r(Math.abs(bs.total_assets - bsExpected));
  checks.push({
    identity: "Balance Sheet Equation",
    formula: "Total Assets = Total Liabilities + Total Equity",
    gaap_reference: "ASC 210",
    expected: bsExpected,
    actual: r(bs.total_assets),
    variance: bsVariance,
    passed: bsVariance <= tol,
    severity: bsVariance <= tol ? "minor" : "critical",
  });

  // 2. Indirect Method OCF: OCF = Net Income + Depreciation
  const expectedOCF = r(is.net_income + is.depreciation);
  const ocfVariance = r(Math.abs(cf.operating_cash_flow - expectedOCF));
  checks.push({
    identity: "Indirect Method Operating Cash Flow",
    formula: "OCF = Net Income + Depreciation (non-cash add-back)",
    gaap_reference: "ASC 230-10-45",
    expected: expectedOCF,
    actual: r(cf.operating_cash_flow),
    variance: ocfVariance,
    passed: ocfVariance <= tol,
    severity: ocfVariance <= tol ? "minor" : "material",
  });

  // 3. Net Income identity: NI = NOI - Interest - Depreciation - Tax
  const expectedNI = r(is.noi - is.interest_expense - is.depreciation - is.income_tax);
  const niVariance = r(Math.abs(is.net_income - expectedNI));
  checks.push({
    identity: "Net Income Derivation",
    formula: "Net Income = NOI - Interest Expense - Depreciation - Income Tax",
    gaap_reference: "ASC 220",
    expected: expectedNI,
    actual: r(is.net_income),
    variance: niVariance,
    passed: niVariance <= tol,
    severity: niVariance <= tol ? "minor" : "material",
  });

  // 4. Financing CF: CFF ≈ -Principal + Refi Proceeds
  if (cf.principal_payment !== undefined) {
    const refiProceeds = cf.refinancing_proceeds ?? 0;
    const expectedCFF = r(-cf.principal_payment + refiProceeds);
    const cffVariance = r(Math.abs(cf.financing_cash_flow - expectedCFF));
    checks.push({
      identity: "Financing Cash Flow Composition",
      formula: "CFF = -Principal Payment + Refinancing Proceeds",
      gaap_reference: "ASC 230-10-45-15",
      expected: expectedCFF,
      actual: r(cf.financing_cash_flow),
      variance: cffVariance,
      passed: cffVariance <= tol,
      severity: cffVariance <= tol ? "minor" : "material",
    });
  }

  // 5. Ending Cash = Beginning Cash + Net Cash Change
  if (cf.beginning_cash !== undefined && cf.net_cash_change !== undefined) {
    const expectedEnding = r(cf.beginning_cash + cf.net_cash_change);
    const cashVariance = r(Math.abs(cf.ending_cash - expectedEnding));
    checks.push({
      identity: "Cash Reconciliation",
      formula: "Ending Cash = Beginning Cash + Net Cash Change",
      gaap_reference: "ASC 230-10-45-24",
      expected: expectedEnding,
      actual: r(cf.ending_cash),
      variance: cashVariance,
      passed: cashVariance <= tol,
      severity: cashVariance <= tol ? "minor" : "critical",
    });
  }

  const all_passed = checks.every(c => c.passed);
  const criticalFails = checks.filter(c => !c.passed && c.severity === "critical").length;
  const materialFails = checks.filter(c => !c.passed && c.severity === "material").length;

  let opinion: "UNQUALIFIED" | "QUALIFIED" | "ADVERSE";
  if (all_passed) {
    opinion = "UNQUALIFIED";
  } else if (criticalFails > 0) {
    opinion = "ADVERSE";
  } else {
    opinion = "QUALIFIED";
  }

  return { all_passed, checks, opinion };
}
