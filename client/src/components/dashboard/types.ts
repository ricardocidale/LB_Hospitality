import { Property } from "@shared/schema";
import { YearlyPropertyFinancials } from "@/lib/yearlyAggregator";
import { YearlyCashFlowResult } from "@/lib/loanCalculations";
import { MonthlyFinancials } from "@/lib/financialEngine";

export interface WeightedMetrics {
  weightedADR: number;
  weightedOcc: number;
  revPAR: number;
  totalAvailableRoomNights: number;
}

export interface DashboardFinancials {
  allPropertyFinancials: { property: Property; financials: MonthlyFinancials[] }[];
  allPropertyYearlyCF: YearlyCashFlowResult[][];
  allPropertyYearlyIS: YearlyPropertyFinancials[][];
  yearlyConsolidatedCache: YearlyPropertyFinancials[];
  weightedMetricsByYear: WeightedMetrics[];
  totalProjectionRevenue: number;
  totalProjectionNOI: number;
  totalProjectionCashFlow: number;
  portfolioIRR: number;
  equityMultiple: number;
  cashOnCash: number;
  totalInitialEquity: number;
  totalExitValue: number;
}

export interface DashboardTabProps {
  financials: DashboardFinancials;
  properties: Property[];
  projectionYears: number;
  getFiscalYear: (yearIndex: number) => number;
  showCalcDetails: boolean;
}
