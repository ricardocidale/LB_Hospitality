import type { CompanyMonthlyFinancials } from "@/lib/financialEngine";

export interface CompanyChartDataPoint {
  year: string;
  Revenue: number;
  Expenses: number;
  NetIncome: number;
}

export interface CompanyCashAnalysis {
  totalFunding: number;
  minCashPosition: number;
  minCashMonth: number | null;
  shortfall: number;
  isAdequate: boolean;
  suggestedAdditionalFunding: number;
}

export interface CompanyTabProps {
  financials: CompanyMonthlyFinancials[];
  properties: any[];
  global: any;
  projectionYears: number;
  expandedRows: Set<string>;
  toggleRow: (rowId: string) => void;
  getFiscalYear: (yearIndex: number) => number;
  fundingLabel: string;
  tableRef?: React.RefObject<HTMLDivElement | null>;
  activeTab?: string;
  propertyFinancials: { property: any; financials: any[] }[];
}

export interface CompanyBalanceSheetProps {
  financials: CompanyMonthlyFinancials[];
  global: any;
  projectionYears: number;
  getFiscalYear: (yearIndex: number) => number;
  fundingLabel: string;
  bsExpanded: Record<string, boolean>;
  setBsExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  tableRef?: React.RefObject<HTMLDivElement | null>;
  activeTab?: string;
}

export interface CompanyHeaderProps {
  global: any;
  properties: any[];
  yearlyChartData: CompanyChartDataPoint[];
  cashAnalysis: CompanyCashAnalysis;
  projectionYears: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  chartRef: React.RefObject<HTMLDivElement | null>;
  exportMenuNode: React.ReactNode;
}
