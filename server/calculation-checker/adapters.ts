import type { CheckResult, CheckerProperty, EngineMonthlyResult } from "./types";
import { check } from "./gaap-checks";
import { validateFinancialIdentities } from "../../calc/validation/financial-identities";
import { checkFundingGates } from "../../calc/validation/funding-gates";

const ROUNDING_POLICY = { precision: 2, bankers_rounding: false } as const;

export function runFinancialIdentityChecks(m: EngineMonthlyResult, propertyValue: number, debtOutstanding: number, initialEquity: number, cumulativeNetIncome: number): CheckResult[] {
  const result = validateFinancialIdentities({
    balance_sheet: {
      total_assets: m.endingCash + propertyValue,
      total_liabilities: debtOutstanding,
      total_equity: initialEquity + cumulativeNetIncome,
    },
    income_statement: {
      noi: m.noi,
      anoi: m.anoi,
      interest_expense: m.interestExpense,
      depreciation: m.depreciationExpense,
      income_tax: m.incomeTax,
      net_income: m.netIncome,
    },
    cash_flow_statement: {
      operating_cash_flow: m.operatingCashFlow,
      financing_cash_flow: m.financingCashFlow,
      ending_cash: m.endingCash,
      principal_payment: m.principalPayment,
    },
    rounding_policy: ROUNDING_POLICY,
  });

  return result.checks.map(c => check(
    c.identity,
    "Financial Identity",
    c.gaap_reference,
    c.formula,
    c.expected,
    c.actual,
    c.severity === "minor" ? "info" : c.severity,
  ));
}

export function runFundingGateChecks(
  property: CheckerProperty,
  engineCalc: EngineMonthlyResult[],
): CheckResult[] {
  const isFinanced = property.type === "Financed";
  const loanTermMonths = (property.acquisitionTermYears ?? 0) * 12;
  const projectionMonths = engineCalc.length;
  const projectionShorterThanLoan = isFinanced && loanTermMonths > projectionMonths;

  const result = checkFundingGates({
    entity_type: "property",
    entity_name: property.name || "Unnamed Property",
    operations_start_date: property.operationsStartDate as string | undefined,
    funding_date: property.acquisitionDate as string | undefined,
    monthly_ending_cash: engineCalc.map(m => m.endingCash),
    final_debt_outstanding: engineCalc.length > 0
      ? engineCalc[engineCalc.length - 1].debtOutstanding
      : undefined,
  });

  return result.gates.map(g => {
    let severity = g.severity;
    if (g.rule === "Debt-Free at Exit" && !g.passed && projectionShorterThanLoan) {
      severity = "info";
    }
    return check(
      g.rule,
      "Funding Gate",
      "Business Rule",
      g.description,
      g.passed ? 1 : 1,
      g.passed ? 1 : 0,
      severity === "info" ? "info" : severity,
    );
  });
}
