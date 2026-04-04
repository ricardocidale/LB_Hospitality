export interface IcpResearchReport {
  targetProfile?: string;
  marketSize?: string;
  segments?: Array<{ name: string; description: string; priority?: string }>;
  channels?: string[];
  [key: string]: unknown;
}

export interface IcpConfig {
  _research?: IcpResearchReport;
  _researchMarkdown?: string;
  [key: string]: unknown;
}

export interface ExportCategoryFormat {
  allowLandscape?: boolean;
  allowPortrait?: boolean;
  allowShort?: boolean;
  allowExtended?: boolean;
  allowPremium?: boolean;
  densePagination?: boolean;
}

export interface ExportConfigOverview extends ExportCategoryFormat {
  kpiMetrics?: boolean;
  revenueChart?: boolean;
  projectionTable?: boolean;
  compositionTables?: boolean;
  compositionCharts?: boolean;
  waterfallTable?: boolean;
  propertyInsights?: boolean;
  aiInsights?: boolean;
}

export interface ExportConfigStatements extends ExportCategoryFormat {
  incomeStatement?: boolean;
  incomeChart?: boolean;
  cashFlow?: boolean;
  cashFlowChart?: boolean;
  balanceSheet?: boolean;
  balanceSheetChart?: boolean;
}

export interface ExportConfigAnalysis extends ExportCategoryFormat {
  kpiSummaryCards?: boolean;
  returnChart?: boolean;
  freeCashFlowTable?: boolean;
  propertyIrrTable?: boolean;
  dcfAnalysis?: boolean;
  performanceTrend?: boolean;
}

export interface ExportConfig {
  overview?: ExportConfigOverview;
  statements?: ExportConfigStatements;
  analysis?: ExportConfigAnalysis;
}

export interface MarketResearchContent {
  sections?: Array<{ title: string; body: string }>;
  summary?: string;
  [key: string]: unknown;
}

export interface PromptConditions {
  [key: string]: unknown;
}

export interface ActivityLogMetadata {
  previousValue?: unknown;
  newValue?: unknown;
  changedFields?: string[];
  [key: string]: unknown;
}

export interface VerificationRunResults {
  propertyResults?: Array<{
    propertyName: string;
    checks: Array<{
      name: string;
      passed: boolean;
      expected?: unknown;
      actual?: unknown;
    }>;
  }>;
  companyChecks?: Array<{
    name: string;
    passed: boolean;
  }>;
  consolidatedChecks?: Array<{
    name: string;
    passed: boolean;
  }>;
  [key: string]: unknown;
}
