import type { RefObject } from "react";
import type { LoanParams, GlobalLoanParams } from "@/lib/loanCalculations";

export interface YearlyChartDataPoint {
  year: string;
  Revenue: number;
  GOP: number;
  NOI: number;
  CashFlow: number;
}

export interface YearlyDetail {
  revenueTotal: number;
  revenueRooms: number;
  revenueEvents: number;
  revenueFB: number;
  revenueOther: number;
  totalExpenses: number;
  expenseRooms: number;
  expenseFB: number;
  expenseEvents: number;
  expenseMarketing: number;
  expensePropertyOps: number;
  expenseUtilitiesVar: number;
  expenseUtilitiesFixed: number;
  expenseInsurance: number;
  expenseTaxes: number;
  expenseAdmin: number;
  expenseIT: number;
  expenseOtherCosts: number;
  expenseFFE: number;
  feeBase: number;
  feeIncentive: number;
  gop: number;
  noi: number;
  cashFlow: number;
}

export interface CashFlowDataPoint {
  interestExpense: number;
  taxLiability: number;
  principalPayment: number;
  exitValue: number;
  refinancingProceeds: number;
  freeCashFlow: number;
  freeCashFlowToEquity: number;
  netCashFlowToInvestors: number;
}

export interface PPECostBasisScheduleProps {
  property: any;
  global: any;
}

export interface IncomeStatementTabProps {
  yearlyChartData: YearlyChartDataPoint[];
  yearlyDetails: YearlyDetail[];
  financials: any[];
  property: any;
  global: any;
  projectionYears: number;
  startYear: number;
  incomeChartRef: RefObject<HTMLDivElement | null>;
  incomeTableRef: RefObject<HTMLDivElement | null>;
  incomeAllExpanded: boolean;
}

export interface CashFlowTabProps {
  yearlyChartData: YearlyChartDataPoint[];
  cashFlowData: CashFlowDataPoint[];
  yearlyDetails: YearlyDetail[];
  financials: any[];
  property: any;
  global: any;
  projectionYears: number;
  startYear: number;
  cashFlowChartRef: RefObject<HTMLDivElement | null>;
  cashFlowTableRef: RefObject<HTMLDivElement | null>;
}

export interface PropertyHeaderProps {
  property: any;
  propertyId: number;
  onPhotoUploadComplete: () => void;
}

export interface PropertyKPIsProps {
  yearlyChartData: YearlyChartDataPoint[];
  projectionYears: number;
}
