export interface ExportConfig {
  allowLandscape: boolean;
  allowPortrait: boolean;
  allowPremium: boolean;
  densePagination: boolean;

  overview: {
    kpiMetrics: boolean;
    revenueChart: boolean;
    projectionTable: boolean;
    compositionTables: boolean;
    waterfallTable: boolean;
    propertyInsights: boolean;
  };

  statements: {
    incomeStatement: boolean;
    incomeChart: boolean;
    cashFlow: boolean;
    cashFlowChart: boolean;
    balanceSheet: boolean;
    balanceSheetChart: boolean;
    detailedLineItems: boolean;
  };

  analysis: {
    investmentAnalysis: boolean;
    kpiSummaryCards: boolean;
    debtSchedule: boolean;
  };
}

export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  allowLandscape: true,
  allowPortrait: true,
  allowPremium: true,
  densePagination: true,

  overview: {
    kpiMetrics: true,
    revenueChart: true,
    projectionTable: true,
    compositionTables: true,
    waterfallTable: true,
    propertyInsights: true,
  },

  statements: {
    incomeStatement: true,
    incomeChart: true,
    cashFlow: true,
    cashFlowChart: true,
    balanceSheet: true,
    balanceSheetChart: true,
    detailedLineItems: true,
  },

  analysis: {
    investmentAnalysis: true,
    kpiSummaryCards: true,
    debtSchedule: true,
  },
};

const STORAGE_KEY = "hplus-export-config";

export function loadExportConfig(): ExportConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_EXPORT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<ExportConfig>;
    return {
      allowLandscape: parsed.allowLandscape ?? DEFAULT_EXPORT_CONFIG.allowLandscape,
      allowPortrait: parsed.allowPortrait ?? DEFAULT_EXPORT_CONFIG.allowPortrait,
      allowPremium: parsed.allowPremium ?? DEFAULT_EXPORT_CONFIG.allowPremium,
      densePagination: parsed.densePagination ?? DEFAULT_EXPORT_CONFIG.densePagination,
      overview: { ...DEFAULT_EXPORT_CONFIG.overview, ...(parsed.overview ?? {}) },
      statements: { ...DEFAULT_EXPORT_CONFIG.statements, ...(parsed.statements ?? {}) },
      analysis: { ...DEFAULT_EXPORT_CONFIG.analysis, ...(parsed.analysis ?? {}) },
    };
  } catch {
    return DEFAULT_EXPORT_CONFIG;
  }
}

export function saveExportConfig(config: ExportConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

export function resetExportConfig(): ExportConfig {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  return DEFAULT_EXPORT_CONFIG;
}
