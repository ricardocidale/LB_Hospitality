import type { Property, GlobalAssumptions } from "@shared/schema";

export interface CheckResult {
  metric: string;
  category: string;
  gaapRef: string;
  formula: string;
  expected: number;
  actual: number;
  variance: number;
  variancePct: number;
  passed: boolean;
  severity: "critical" | "material" | "minor" | "info";
}

export interface PropertyCheckResults {
  propertyName: string;
  propertyType: string;
  checks: CheckResult[];
  passed: number;
  failed: number;
  criticalIssues: number;
}

export interface VerificationReport {
  timestamp: string;
  propertiesChecked: number;
  propertyResults: PropertyCheckResults[];
  companyChecks: CheckResult[];
  consolidatedChecks: CheckResult[];
  summary: {
    totalChecks: number;
    totalPassed: number;
    totalFailed: number;
    criticalIssues: number;
    materialIssues: number;
    auditOpinion: "UNQUALIFIED" | "QUALIFIED" | "ADVERSE";
    overallStatus: "PASS" | "FAIL" | "WARNING";
  };
}

export interface ClientPropertyMonthly {
  revenueTotal: number;
  revenueRooms: number;
  noi: number;
  gop: number;
  cashFlow: number;
  feeBase: number;
  feeIncentive: number;
}

export interface YearMonth { 
  year: number; 
  month: number; 
}

export interface IndependentMonthlyResult {
  monthIndex: number;
  occupancy: number;
  adr: number;
  availableRooms: number;
  soldRooms: number;
  revenueRooms: number;
  revenueEvents: number;
  revenueFB: number;
  revenueOther: number;
  revenueTotal: number;
  expenseRooms: number;
  expenseFB: number;
  expenseEvents: number;
  expenseOther: number;
  totalOperatingExpenses: number;
  gop: number;
  feeBase: number;
  feeIncentive: number;
  noi: number;
  interestExpense: number;
  principalPayment: number;
  debtPayment: number;
  netIncome: number;
  cashFlow: number;
  depreciationExpense: number;
  propertyValue: number;
  debtOutstanding: number;
  operatingCashFlow: number;
  financingCashFlow: number;
  endingCash: number;
  cashShortfall: boolean;
  expenseFFE: number;
  totalExpenses: number;
}

export type CheckerProperty = Property;
export type CheckerGlobalAssumptions = GlobalAssumptions;
