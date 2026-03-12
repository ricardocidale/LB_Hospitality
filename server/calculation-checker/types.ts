import type { Property, GlobalAssumptions } from "@shared/schema";

// Import + re-export shared verification types — single source of truth
import type { CheckResult, PropertyCheckResults } from "@shared/verification-types";
export type { CheckResult, PropertyCheckResults };

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
  anoi: number;
  agop: number;
  gop: number;
  cashFlow: number;
  feeBase: number;
  feeIncentive: number;
  workingCapitalChange: number;
  nolBalance: number;
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
  agop: number;
  feeBase: number;
  feeIncentive: number;
  expenseInsurance: number;
  expenseTaxes: number;
  noi: number;
  anoi: number;
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
  accountsReceivable: number;
  accountsPayable: number;
  workingCapitalChange: number;
  nolBalance: number;
}

export type CheckerProperty = Property;
export type CheckerGlobalAssumptions = GlobalAssumptions;
