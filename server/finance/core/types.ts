export type { PropertyInput, GlobalInput, MonthlyFinancials } from "@/lib/financial/types";
export type { YearlyPropertyFinancials } from "@/lib/financial/yearlyAggregator";
export type { PropertyEngineContext } from "@/lib/financial/resolve-assumptions";
export type { YearlyCashFlowResult } from "@/lib/financial/loanCalculations";

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

type YearlyPropertyFinancialsImport = import("@/lib/financial/yearlyAggregator").YearlyPropertyFinancials;
