import { generatePropertyProForma } from "./core/property-pipeline";
import { aggregatePropertyByYear } from "./core/yearly-aggregator";
import { consolidateYearlyFinancials } from "./core/consolidation";
import { validateFinancialIdentities } from "@calc/validation/financial-identities";
import { stableHash } from "../scenarios/stable-json";
import type { PropertyInput, GlobalInput } from "@/lib/financial/types";
import type { YearlyPropertyFinancials } from "@/lib/financial/yearlyAggregator";
import type { PortfolioComputeResult } from "./core/types";
import { MONTHS_PER_YEAR } from "@shared/constants";

const ENGINE_VERSION = "1.0.0";
const PROJECTION_YEARS_DEFAULT = 10;
const DEFAULT_ROUNDING = { precision: 2, bankers_rounding: false };

export interface ComputePortfolioInput {
  properties: PropertyInput[];
  globalAssumptions: GlobalInput;
  projectionYears?: number;
}

function uniquePropertyKey(property: PropertyInput, index: number): string {
  if (property.id != null) return `property_${property.id}`;
  const name = property.name ?? `Property_${index + 1}`;
  return `${name}__idx${index}`;
}

export function computePortfolioProjection(
  input: ComputePortfolioInput,
): PortfolioComputeResult {
  const projectionYears = input.projectionYears ?? PROJECTION_YEARS_DEFAULT;
  const months = projectionYears * MONTHS_PER_YEAR;

  const perPropertyYearly: Record<string, YearlyPropertyFinancials[]> = {};

  for (let i = 0; i < input.properties.length; i++) {
    const property = input.properties[i];
    const key = uniquePropertyKey(property, i);

    const monthly = generatePropertyProForma(property, input.globalAssumptions, months);
    const yearly = aggregatePropertyByYear(monthly, projectionYears);

    perPropertyYearly[key] = yearly;
  }

  const allPropertyYearlyArrays = Object.values(perPropertyYearly);
  const consolidatedYearly = consolidateYearlyFinancials(allPropertyYearlyArrays, projectionYears);

  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;
  let worstOpinion: "UNQUALIFIED" | "QUALIFIED" | "ADVERSE" = "UNQUALIFIED";

  for (const yearly of allPropertyYearlyArrays) {
    for (const yearData of yearly) {
      if (yearData.revenueTotal === 0 && yearData.noi === 0) continue;

      const result = validateFinancialIdentities({
        period_label: `Year ${yearData.year + 1}`,
        balance_sheet: {
          total_assets: 0,
          total_liabilities: 0,
          total_equity: 0,
        },
        income_statement: {
          noi: yearData.noi,
          anoi: yearData.anoi,
          interest_expense: yearData.interestExpense,
          depreciation: yearData.depreciationExpense,
          income_tax: yearData.incomeTax,
          net_income: yearData.netIncome,
        },
        cash_flow_statement: {
          operating_cash_flow: yearData.operatingCashFlow,
          financing_cash_flow: yearData.financingCashFlow,
          ending_cash: yearData.endingCash,
          principal_payment: yearData.principalPayment,
          refinancing_proceeds: yearData.refinancingProceeds,
        },
        rounding_policy: DEFAULT_ROUNDING,
      });

      const incomeAndCashChecks = result.checks.filter(
        c => c.identity !== "Balance Sheet Equation"
      );

      totalChecks += incomeAndCashChecks.length;
      passedChecks += incomeAndCashChecks.filter(c => c.passed).length;
      failedChecks += incomeAndCashChecks.filter(c => !c.passed).length;

      const checkOpinion = incomeAndCashChecks.every(c => c.passed)
        ? "UNQUALIFIED"
        : incomeAndCashChecks.some(c => !c.passed && c.severity === "critical")
          ? "ADVERSE"
          : "QUALIFIED";

      if (checkOpinion === "ADVERSE") worstOpinion = "ADVERSE";
      else if (checkOpinion === "QUALIFIED" && worstOpinion !== "ADVERSE") worstOpinion = "QUALIFIED";
    }
  }

  const outputPayload = { perPropertyYearly, consolidatedYearly };
  const outputHash = stableHash(outputPayload);

  return {
    engineVersion: ENGINE_VERSION,
    computedAt: new Date().toISOString(),
    perPropertyYearly,
    consolidatedYearly,
    outputHash,
    propertyCount: input.properties.length,
    projectionYears,
    validationSummary: {
      opinion: worstOpinion,
      identityChecks: totalChecks,
      passed: passedChecks,
      failed: failedChecks,
    },
  };
}
