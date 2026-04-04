export type { PropertyInput, GlobalInput, MonthlyFinancials } from "@engine/types";
export type { YearlyPropertyFinancials } from "@engine/aggregation/yearlyAggregator";
export type { PropertyEngineContext } from "@engine/property/resolve-assumptions";
export type { YearlyCashFlowResult } from "@engine/debt/loanCalculations";

export interface PortfolioComputeResult {
  engineVersion: string;
  computedAt: string;
  perPropertyYearly: Record<string, YearlyPropertyFinancialsImport[]>;
  consolidatedYearly: YearlyPropertyFinancialsImport[];
  outputHash: string;
  propertyCount: number;
  projectionYears: number;
  validationSummary: {
    opinion: "UNQUALIFIED" | "QUALIFIED" | "ADVERSE";
    identityChecks: number;
    passed: number;
    failed: number;
  };
}

type YearlyPropertyFinancialsImport = import("@engine/aggregation/yearlyAggregator").YearlyPropertyFinancials;
