import React, { useState, useRef, useMemo } from "react";
import domtoimage from 'dom-to-image-more';
import { ExportDialog } from "@/components/ExportDialog";
import Layout from "@/components/Layout";
import { useProperties, useGlobalAssumptions, useAllFeeCategories } from "@/lib/api";
import { generateCompanyProForma, generatePropertyProForma, formatMoney, getFiscalYearForModelYear, CompanyMonthlyFinancials } from "@/lib/financialEngine";
import { PROJECTION_YEARS, STAFFING_TIERS, OPERATING_RESERVE_BUFFER, COMPANY_FUNDING_BUFFER } from "@/lib/constants";
import { Tabs, TabsContent, CurrentThemeTab } from "@/components/ui/tabs";
import { FileText, Banknote, Scale, Users, Briefcase, TrendingUp, Settings2, Loader2, ChevronRight, ChevronDown, FileDown, FileSpreadsheet, ImageIcon, AlertTriangle, CheckCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FinancialChart } from "@/components/ui/financial-chart";
import { ExportMenu, pdfAction, excelAction, csvAction, pptxAction, chartAction, pngAction } from "@/components/ui/export-toolbar";
import { CalcDetailsProvider } from "@/components/financial-table-rows";
import { exportCompanyPPTX } from "@/lib/exports/pptxExport";
import { exportCompanyIncomeStatement, exportCompanyCashFlow, exportCompanyBalanceSheet } from "@/lib/exports/excelExport";
import { Link } from "wouter";
import { GlassButton } from "@/components/ui/glass-button";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { drawLineChart } from "@/lib/pdfChartDrawer";
import { format } from "date-fns";
import { KPIGrid, InsightPanel, AnimatedPage, ScrollReveal, formatCompact, formatPercent, CHART_COLORS, type KPIItem, type Insight } from "@/components/graphics";

interface CompanyCashAnalysis {
  totalFunding: number;
  minCashPosition: number;
  minCashMonth: number | null;
  shortfall: number;
  isAdequate: boolean;
  suggestedAdditionalFunding: number;
}

function analyzeCompanyCashPosition(financials: CompanyMonthlyFinancials[]): CompanyCashAnalysis {
  if (!financials || financials.length === 0) {
    return {
      totalFunding: 0,
      minCashPosition: 0,
      minCashMonth: null,
      shortfall: 0,
      isAdequate: true,
      suggestedAdditionalFunding: 0
    };
  }

  let cashPosition = 0;
  let minCashPosition = 0;
  let minCashMonth: number | null = null;
  let totalSafe = 0;
  let hasActivity = false;

  for (let i = 0; i < financials.length; i++) {
    const month = financials[i];
    totalSafe += month.safeFunding;
    
    if (month.netIncome !== 0 || month.safeFunding !== 0 || month.totalExpenses !== 0) {
      hasActivity = true;
    }
    
    cashPosition += month.netIncome + month.safeFunding;
    
    if (cashPosition < minCashPosition) {
      minCashPosition = cashPosition;
      minCashMonth = i + 1;
    }
  }

  if (!hasActivity) {
    return {
      totalFunding: 0,
      minCashPosition: 0,
      minCashMonth: null,
      shortfall: 0,
      isAdequate: true,
      suggestedAdditionalFunding: 0
    };
  }

  const shortfall = minCashPosition < 0 ? Math.abs(minCashPosition) : 0;
  const isAdequate = minCashPosition >= 0;
  const suggestedAdditionalFunding = isAdequate ? 0 : Math.ceil(shortfall / OPERATING_RESERVE_BUFFER) * OPERATING_RESERVE_BUFFER + COMPANY_FUNDING_BUFFER;

  return {
    totalFunding: totalSafe,
    minCashPosition,
    minCashMonth,
    shortfall,
    isAdequate,
    suggestedAdditionalFunding
  };
}

export default function Company() {
  const { data: properties, isLoading: propertiesLoading, isError: propertiesError } = useProperties();
  const { data: global, isLoading: globalLoading, isError: globalError } = useGlobalAssumptions();
  const { data: allFeeCategories } = useAllFeeCategories();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("income");
  const [bsExpanded, setBsExpanded] = useState<Record<string, boolean>>({});
  const chartRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'chart' | 'tablePng'>('pdf');

  const fundingLabel = global?.fundingSourceLabel ?? "Funding Vehicle";

  const toggleRow = (rowId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const projectionYears = global?.projectionYears ?? PROJECTION_YEARS;
  const projectionMonths = projectionYears * 12;

  const enrichedProperties = useMemo(() => {
    if (!properties) return [];
    return properties.map(p => {
      const cats = allFeeCategories?.filter(c => c.propertyId === p.id) ?? [];
      if (cats.length > 0) {
        return { ...p, feeCategories: cats.map(c => ({ name: c.name, rate: c.rate, isActive: c.isActive })) };
      }
      return p;
    });
  }, [properties, allFeeCategories]);

  const financials = useMemo(
    () => {
      if (!enrichedProperties.length || !global) return [];
      return generateCompanyProForma(enrichedProperties, global, projectionMonths);
    },
    [enrichedProperties, global, projectionMonths]
  );

  const cashAnalysis = useMemo(
    () => analyzeCompanyCashPosition(financials),
    [financials]
  );

  const propertyFinancials = useMemo(
    () => {
      if (!enrichedProperties.length || !global) return [];
      return enrichedProperties.map(p => ({
        property: p,
        financials: generatePropertyProForma(p, global, projectionMonths)
      }));
    },
    [enrichedProperties, global, projectionMonths]
  );
  
  const fiscalYearStartMonth = global?.fiscalYearStartMonth ?? 1;
  const getFiscalYear = (yearIndex: number) => global ? getFiscalYearForModelYear(global.modelStartDate, fiscalYearStartMonth, yearIndex) : yearIndex + 1;

  const yearlyChartData = useMemo(() => {
    if (!financials.length || !global) return [];
    const data = [];
    for (let y = 0; y < projectionYears; y++) {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      if (yearData.length === 0) continue;
      data.push({
        year: String(getFiscalYear(y)),
        Revenue: yearData.reduce((a, m) => a + m.totalRevenue, 0),
        Expenses: yearData.reduce((a, m) => a + m.totalExpenses, 0),
        NetIncome: yearData.reduce((a, m) => a + m.netIncome, 0),
      });
    }
    return data;
  }, [financials, projectionYears, global]);

  if (propertiesLoading || globalLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (propertiesError || globalError) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-muted-foreground">Failed to load company data. Please try refreshing the page.</p>
        </div>
      </Layout>
    );
  }

  if (!properties || !global) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <h2 className="text-2xl font-display">Data Not Available</h2>
        </div>
      </Layout>
    );
  }

  const activePropertyCount = properties.filter(p => p.status === "Operational").length;
  const tier1Max = global?.staffTier1MaxProperties ?? STAFFING_TIERS[0].maxProperties;
  const tier1Fte = global?.staffTier1Fte ?? STAFFING_TIERS[0].fte;
  const tier2Max = global?.staffTier2MaxProperties ?? STAFFING_TIERS[1].maxProperties;
  const tier2Fte = global?.staffTier2Fte ?? STAFFING_TIERS[1].fte;
  const tier3Fte = global?.staffTier3Fte ?? STAFFING_TIERS[2].fte;
  const staffFTE = activePropertyCount <= tier1Max ? tier1Fte
    : activePropertyCount <= tier2Max ? tier2Fte
    : tier3Fte;
  
  const year1Financials = financials.slice(0, 12);
  const year1Revenue = year1Financials.reduce((a, m) => a + m.totalRevenue, 0);
  const year1NetIncome = year1Financials.reduce((a, m) => a + m.netIncome, 0);

  const getPropertyYearlyBaseFee = (propIdx: number, year: number) => {
    const pf = propertyFinancials[propIdx].financials;
    const yearData = pf.slice(year * 12, (year + 1) * 12);
    return yearData.reduce((a, m) => a + m.feeBase, 0);
  };

  const getPropertyYearlyIncentiveFee = (propIdx: number, year: number) => {
    const pf = propertyFinancials[propIdx].financials;
    const yearData = pf.slice(year * 12, (year + 1) * 12);
    return yearData.reduce((a, m) => a + m.feeIncentive, 0);
  };

  const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));

  const generateCompanyIncomeData = () => {
    const rows: { category: string; values: number[]; isHeader?: boolean; indent?: number }[] = [];
    
    rows.push({ category: "Revenue", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.totalRevenue, 0);
    }), isHeader: true });
    
    rows.push({ category: "Service Fees", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.baseFeeRevenue, 0);
    }), indent: 1 });
    
    const categoryNames = Object.keys(financials[0]?.serviceFeeBreakdown?.byCategory ?? {});
    if (categoryNames.length > 0) {
      categoryNames.forEach(catName => {
        rows.push({ category: catName, values: years.map((_, y) => {
          const yearData = financials.slice(y * 12, (y + 1) * 12);
          return yearData.reduce((a, m) => (m.serviceFeeBreakdown?.byCategory?.[catName] ?? 0) + a, 0);
        }), indent: 2 });
      });
    } else {
      properties.forEach((prop, idx) => {
        rows.push({ category: prop.name, values: years.map((_, y) => getPropertyYearlyBaseFee(idx, y)), indent: 2 });
      });
    }
    
    rows.push({ category: "Incentive Fees", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.incentiveFeeRevenue, 0);
    }), indent: 1 });
    
    properties.forEach((prop) => {
      rows.push({ category: prop.name, values: years.map((_, y) => {
        const yearData = financials.slice(y * 12, (y + 1) * 12);
        return yearData.reduce((a, m) => (m.incentiveFeeByPropertyId?.[String(prop.id)] ?? 0) + a, 0);
      }), indent: 2 });
    });
    
    rows.push({ category: "Operating Expenses", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.totalExpenses, 0);
    }), isHeader: true });
    
    rows.push({ category: "Partner Compensation", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.partnerCompensation, 0);
    }), indent: 1 });
    
    rows.push({ category: "Staff Salaries", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.staffCompensation, 0);
    }), indent: 1 });
    
    rows.push({ category: "Office Lease", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.officeLease, 0);
    }), indent: 1 });
    
    rows.push({ category: "Professional Services", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.professionalServices, 0);
    }), indent: 1 });
    
    rows.push({ category: "Insurance", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.businessInsurance, 0);
    }), indent: 1 });
    
    rows.push({ category: "Tech Infrastructure", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.techInfrastructure, 0);
    }), indent: 1 });
    
    rows.push({ category: "Travel", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.travelCosts, 0);
    }), indent: 1 });
    
    rows.push({ category: "IT Licensing", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.itLicensing, 0);
    }), indent: 1 });
    
    rows.push({ category: "Marketing", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.marketing, 0);
    }), indent: 1 });
    
    rows.push({ category: "Misc Operations", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.miscOps, 0);
    }), indent: 1 });
    
    rows.push({ category: "Net Income", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.netIncome, 0);
    }), isHeader: true });
    
    rows.push({ category: "Net Margin (%)", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      const netIncome = yearData.reduce((a, m) => a + m.netIncome, 0);
      const totalRevenue = yearData.reduce((a, m) => a + m.totalRevenue, 0);
      return totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;
    }), indent: 1 });
    
    return { years, rows };
  };

  const generateCompanyCashFlowData = () => {
    const rows: { category: string; values: number[]; isHeader?: boolean; isSubtotal?: boolean; indent?: number }[] = [];

    // === Cash Flow from Operating Activities ===
    rows.push({ category: "Cash Flow from Operating Activities", values: years.map(() => 0), isHeader: true });

    rows.push({ category: "Cash Received from Management Fees", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.totalRevenue, 0);
    }), indent: 1 });

    rows.push({ category: "Service Fees", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.baseFeeRevenue, 0);
    }), indent: 2 });

    const cfCategoryNames = Object.keys(financials[0]?.serviceFeeBreakdown?.byCategory ?? {});
    if (cfCategoryNames.length > 0) {
      cfCategoryNames.forEach(catName => {
        rows.push({ category: catName, values: years.map((_, y) => {
          const yearData = financials.slice(y * 12, (y + 1) * 12);
          return yearData.reduce((a, m) => (m.serviceFeeBreakdown?.byCategory?.[catName] ?? 0) + a, 0);
        }), indent: 3 });
      });
    } else {
      properties.forEach((prop, idx) => {
        rows.push({ category: prop.name, values: years.map((_, y) => getPropertyYearlyBaseFee(idx, y)), indent: 3 });
      });
    }

    rows.push({ category: "Incentive Fees", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.incentiveFeeRevenue, 0);
    }), indent: 2 });

    properties.forEach((prop) => {
      rows.push({ category: prop.name, values: years.map((_, y) => {
        const yearData = financials.slice(y * 12, (y + 1) * 12);
        return yearData.reduce((a, m) => (m.incentiveFeeByPropertyId?.[String(prop.id)] ?? 0) + a, 0);
      }), indent: 3 });
    });

    rows.push({ category: "Cash Paid for Operating Expenses", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.totalExpenses, 0);
    }), indent: 1 });

    rows.push({ category: "Compensation", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.partnerCompensation + m.staffCompensation, 0);
    }), indent: 2 });

    rows.push({ category: "Partner Compensation", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.partnerCompensation, 0);
    }), indent: 3 });

    rows.push({ category: "Staff Compensation", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.staffCompensation, 0);
    }), indent: 3 });

    rows.push({ category: "Fixed Overhead", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.officeLease + m.professionalServices + m.techInfrastructure + m.businessInsurance, 0);
    }), indent: 2 });

    rows.push({ category: "Office Lease", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.officeLease, 0);
    }), indent: 3 });

    rows.push({ category: "Professional Services", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.professionalServices, 0);
    }), indent: 3 });

    rows.push({ category: "Insurance", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.businessInsurance, 0);
    }), indent: 3 });

    rows.push({ category: "Variable Costs", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.travelCosts + m.itLicensing + m.marketing + m.miscOps, 0);
    }), indent: 2 });

    rows.push({ category: "Travel", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.travelCosts, 0);
    }), indent: 3 });

    rows.push({ category: "IT Licensing", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.itLicensing, 0);
    }), indent: 3 });

    rows.push({ category: "Marketing", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.marketing, 0);
    }), indent: 3 });

    rows.push({ category: "Misc Operations", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.miscOps, 0);
    }), indent: 3 });

    rows.push({ category: "Net Cash from Operating Activities", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.netIncome, 0);
    }), isSubtotal: true });

    // === Cash Flow from Financing Activities ===
    rows.push({ category: "Cash Flow from Financing Activities", values: years.map(() => 0), isHeader: true });

    rows.push({ category: `${fundingLabel} Funding Received`, values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.safeFunding, 0);
    }), indent: 1 });

    rows.push({ category: `${fundingLabel} Tranche 1`, values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.safeFunding1, 0);
    }), indent: 2 });

    rows.push({ category: `${fundingLabel} Tranche 2`, values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.safeFunding2, 0);
    }), indent: 2 });

    rows.push({ category: "Net Cash from Financing Activities", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.safeFunding, 0);
    }), isSubtotal: true });

    // === Net Change & Balances ===
    rows.push({ category: "Net Increase (Decrease) in Cash", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.netIncome + m.safeFunding, 0);
    }), isHeader: true });

    let cumCash = 0;
    const openingCash = years.map((_, y) => {
      if (y === 0) return 0;
      const prevYearData = financials.slice(0, y * 12);
      return prevYearData.reduce((a, m) => a + m.netIncome + m.safeFunding, 0);
    });
    rows.push({ category: "Opening Cash Balance", values: openingCash, indent: 0 });

    rows.push({ category: "Closing Cash Balance", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      cumCash += yearData.reduce((a, m) => a + m.netIncome + m.safeFunding, 0);
      return cumCash;
    }), isHeader: true });

    return { years, rows };
  };

  const generateCompanyBalanceData = () => {
    const rows: { category: string; values: number[]; isHeader?: boolean; indent?: number }[] = [];
    
    let cumCash = 0;
    const cashValues = years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      cumCash += yearData.reduce((a, m) => a + m.netIncome + m.safeFunding, 0);
      return cumCash;
    });
    
    let cumRetained = 0;
    const retainedValues = years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      cumRetained += yearData.reduce((a, m) => a + m.netIncome, 0);
      return cumRetained;
    });
    
    let cumSafe = 0;
    const safeValues = years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      cumSafe += yearData.reduce((a, m) => a + m.safeFunding, 0);
      return cumSafe;
    });
    
    rows.push({ category: "ASSETS", values: years.map(() => 0), isHeader: true });
    rows.push({ category: "Cash & Cash Equivalents", values: cashValues, indent: 1 });
    rows.push({ category: "TOTAL ASSETS", values: cashValues, isHeader: true });
    
    rows.push({ category: "LIABILITIES", values: years.map(() => 0), isHeader: true });
    rows.push({ category: `${fundingLabel} Notes`, values: safeValues, indent: 1 });
    rows.push({ category: "TOTAL LIABILITIES", values: safeValues, isHeader: true });
    
    rows.push({ category: "EQUITY", values: years.map(() => 0), isHeader: true });
    rows.push({ category: "Retained Earnings", values: retainedValues, indent: 1 });
    rows.push({ category: "TOTAL EQUITY", values: retainedValues, isHeader: true });
    
    return { years, rows };
  };

  const exportCompanyPDF = async (type: 'income' | 'cashflow' | 'balance', orientation: 'landscape' | 'portrait' = 'landscape') => {
    const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
    const pageWidth = orientation === 'landscape' ? 297 : 210;
    const chartWidth = pageWidth - 28;
    let data: { years: number[]; rows: any[] };
    let title: string;
    
    switch (type) {
      case 'income':
        data = generateCompanyIncomeData();
        title = 'Income Statement';
        break;
      case 'cashflow':
        data = generateCompanyCashFlowData();
        title = 'Cash Flow Statement';
        break;
      case 'balance':
        data = generateCompanyBalanceData();
        title = 'Balance Sheet';
        break;
    }
    
    doc.setFontSize(18);
    doc.text(`${global?.companyName || "Hospitality Business Co."} - ${title}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`${projectionYears}-Year Projection (${data.years[0]} - ${data.years[data.years.length - 1]})`, 14, 22);
    doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy')}`, 14, 27);
    
    // Table starts after header
    const tableStartY = 32;
    
    const tableData = data.rows.map(row => [
      (row.indent ? '  '.repeat(row.indent) : '') + row.category,
      ...row.values.map((v: number) => {
        if (row.category.includes('%')) return `${v.toFixed(1)}%`;
        if (v === 0 && row.isHeader && !row.category.includes('TOTAL')) return '';
        if (v < 0) return `(${formatMoney(Math.abs(v))})`;
        return formatMoney(v);
      })
    ]);
    
    // Build column styles for proper alignment
    const colStyles: any = { 
      0: { cellWidth: orientation === 'landscape' ? 50 : 40 } 
    };
    const numCols = data.years.length;
    const availableWidth = orientation === 'landscape' ? 230 : 155;
    const dataColWidth = availableWidth / numCols;
    for (let i = 1; i <= numCols; i++) {
      colStyles[i] = { halign: 'right', cellWidth: dataColWidth };
    }
    
    autoTable(doc, {
      head: [['Category', ...data.years.map(y => `FY ${y}`)]],
      body: tableData,
      startY: tableStartY,
      styles: { fontSize: orientation === 'landscape' ? 7 : 6, cellPadding: 1.2, overflow: 'linebreak' },
      headStyles: { fillColor: [159, 188, 164], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
      columnStyles: colStyles,
      tableWidth: 'auto',
      didParseCell: (cellData) => {
        if (cellData.section === 'body' && cellData.row.index !== undefined) {
          const row = data.rows[cellData.row.index];
          if (row?.isHeader) {
            cellData.cell.styles.fontStyle = 'bold';
            cellData.cell.styles.fillColor = [240, 240, 240];
          }
          if (row?.isSubtotal) {
            cellData.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
    
    // Add chart on separate page at the end
    if (yearlyChartData && yearlyChartData.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text(`${title} - Performance Chart`, 14, 15);
      doc.setFontSize(10);
      doc.text(`${projectionYears}-Year Revenue, Expenses, and Net Income Trend`, 14, 22);
      
      const chartSeries = [
        {
          name: 'Revenue',
          data: yearlyChartData.map((d: any) => ({ label: String(d.year), value: d.Revenue })),
          color: '#257D41'
        },
        {
          name: 'Expenses',
          data: yearlyChartData.map((d: any) => ({ label: String(d.year), value: d.Expenses })),
          color: '#3B82F6'
        },
        {
          name: 'Net Income',
          data: yearlyChartData.map((d: any) => ({ label: String(d.year), value: d.NetIncome })),
          color: '#F4795B'
        }
      ];
      
      drawLineChart({
        doc,
        x: 14,
        y: 30,
        width: chartWidth,
        height: 150,
        title: `Management Company Performance (${projectionYears}-Year Projection)`,
        series: chartSeries
      });
    }
    
    doc.save(`company-${type}.pdf`);
  };

  const exportCompanyCSV = (type: 'income' | 'cashflow' | 'balance') => {
    let data: { years: number[]; rows: any[] };
    
    switch (type) {
      case 'income':
        data = generateCompanyIncomeData();
        break;
      case 'cashflow':
        data = generateCompanyCashFlowData();
        break;
      case 'balance':
        data = generateCompanyBalanceData();
        break;
    }
    
    const headers = ['Category', ...data.years.map(String)];
    const csvRows = [
      headers.join(','),
      ...data.rows.map(row => [
        `"${(row.indent ? '  '.repeat(row.indent) : '') + row.category}"`,
        ...row.values.map((v: number) => v.toFixed(2))
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `company-${type}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExcelExport = () => {
    if (!global) return;
    if (activeTab === 'cashflow') {
      exportCompanyCashFlow(financials, projectionYears, global.modelStartDate, fiscalYearStartMonth);
    } else if (activeTab === 'balance') {
      exportCompanyBalanceSheet(
        financials,
        global.safeTranche1Amount || 0,
        global.safeTranche2Amount || 0,
        global.modelStartDate,
        fiscalYearStartMonth,
        projectionYears
      );
    } else {
      exportCompanyIncomeStatement(financials, projectionYears, global.modelStartDate, fiscalYearStartMonth);
    }
  };

  const exportChartPNG = async (orientation: 'landscape' | 'portrait' = 'landscape') => {
    if (!chartRef.current) return;
    
    try {
      const scale = 2;
      const width = orientation === 'landscape' ? 1200 : 800;
      const height = orientation === 'landscape' ? 600 : 1000;
      
      const dataUrl = await domtoimage.toPng(chartRef.current, {
        bgcolor: '#ffffff',
        quality: 1,
        width: width,
        height: height,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }
      });
      
      const link = document.createElement('a');
      link.download = `company-performance-chart-${orientation}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error exporting chart:', error);
    }
  };
  
  const exportTablePNG = async () => {
    if (!tableRef.current) return;
    try {
      const scale = 2;
      const dataUrl = await domtoimage.toPng(tableRef.current, {
        bgcolor: '#ffffff',
        quality: 1,
        style: { transform: `scale(${scale})`, transformOrigin: 'top left' },
        width: tableRef.current.scrollWidth * scale,
        height: tableRef.current.scrollHeight * scale,
      });
      const link = document.createElement('a');
      link.download = `company-${activeTab}-table.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error exporting table:', error);
    }
  };

  const handlePPTXExport = () => {
    if (!global) return;
    const incomeData = generateCompanyIncomeData();
    const cashFlowData = generateCompanyCashFlowData();
    const balanceData = generateCompanyBalanceData();

    exportCompanyPPTX({
      projectionYears,
      getFiscalYear: (i: number) => String(getFiscalYear(i)),
      incomeData: { years: incomeData.years.map(String), rows: incomeData.rows },
      cashFlowData: { years: cashFlowData.years.map(String), rows: cashFlowData.rows },
      balanceSheetData: { years: balanceData.years.map(String), rows: balanceData.rows },
    });
  };

  const handleExport = (orientation: 'landscape' | 'portrait') => {
    if (exportType === 'pdf') {
      exportCompanyPDF(activeTab as 'income' | 'cashflow' | 'balance', orientation);
    } else if (exportType === 'tablePng') {
      exportTablePNG();
    } else {
      exportChartPNG(orientation);
    }
  };

  return (
    <Layout>
      <AnimatedPage>
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExport}
        title={exportType === 'pdf' ? 'Export PDF' : exportType === 'tablePng' ? 'Export Table as PNG' : 'Export Chart'}
      />
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title={global?.companyName || "Hospitality Business Co."}
          subtitle="Corporate Management Entity & Operations"
          actions={
            <Link href="/company/assumptions" className="text-inherit no-underline">
              <GlassButton variant="settings">
                <Settings2 className="w-4 h-4" />
                Assumptions
              </GlassButton>
            </Link>
          }
        />

        <KPIGrid
          data-testid="kpi-company-hero"
          items={[
            { label: "Total Revenue", value: yearlyChartData[0]?.Revenue ?? 0, format: formatCompact, sublabel: "Year 1" },
            { label: "Net Income", value: yearlyChartData[0]?.NetIncome ?? 0, format: formatCompact, trend: (yearlyChartData[0]?.NetIncome ?? 0) > 0 ? "up" as const : "down" as const },
            { label: "Total Expenses", value: yearlyChartData[0]?.Expenses ?? 0, format: formatCompact },
            { label: "Properties Managed", value: properties?.length ?? 0, sublabel: "Active portfolio" },
          ]}
          columns={4}
          variant="glass"
        />

        <CalcDetailsProvider show={global?.showCompanyCalculationDetails ?? true}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-6">
            <CurrentThemeTab
              tabs={[
                { value: 'income', label: 'Income Statement', icon: FileText },
                { value: 'cashflow', label: 'Cash Flows', icon: Banknote },
                { value: 'balance', label: 'Balance Sheet', icon: Scale }
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              rightContent={
                <ExportMenu
                  actions={[
                    pdfAction(() => { setExportType('pdf'); setExportDialogOpen(true); }),
                    excelAction(() => handleExcelExport()),
                    csvAction(() => exportCompanyCSV(activeTab as 'income' | 'cashflow' | 'balance')),
                    pptxAction(() => handlePPTXExport()),
                    chartAction(() => { setExportType('chart'); setExportDialogOpen(true); }),
                    pngAction(() => exportTablePNG()),
                  ]}
                />
              }
            />
          </div>

          <FinancialChart
            data={yearlyChartData}
            series={["revenue", "expenses", "netIncome"]}
            title={`Management Company Performance (${projectionYears}-Year Projection)`}
            chartRef={chartRef}
            id="company"
          />

          <ScrollReveal>
            <InsightPanel
              data-testid="insight-company"
              title="Company Cash Analysis"
              variant="compact"
              insights={[
                { text: "Cash position", metric: cashAnalysis.isAdequate ? "Adequate" : "Needs attention", type: cashAnalysis.isAdequate ? "positive" as const : "warning" as const },
                ...(cashAnalysis.shortfall > 0 ? [{ text: "Cash shortfall detected", metric: formatMoney(cashAnalysis.shortfall), type: "negative" as const }] : []),
                { text: "Total company funding", metric: formatMoney(cashAnalysis.totalFunding), type: "neutral" as const },
              ]}
            />
          </ScrollReveal>
          
          <TabsContent value="income" className="mt-6">
            <ScrollReveal>
            {/* Income Statement */}
            <div ref={activeTab === 'income' ? tableRef : undefined} className="bg-white rounded-2xl p-6 shadow-sm border">
              <div>
                <h3 className="text-lg font-display text-gray-900 mb-4">Income Statement - {global?.companyName || "Hospitality Business Co."}</h3>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="sticky left-0 bg-gray-50 text-gray-700">Category</TableHead>
                      {Array.from({ length: projectionYears }, (_, i) => (
                        <TableHead key={i} className="text-right min-w-[100px] text-gray-700">{getFiscalYear(i)}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-gray-50 font-semibold border-gray-200">
                      <TableCell className="sticky left-0 bg-gray-50 text-gray-900">Revenue</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                        return <TableCell key={y} className="text-right font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    
                    <TableRow 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleRow('baseFees')}
                      data-testid="row-service-fees"
                    >
                      <TableCell className="sticky left-0 bg-white pl-6 flex items-center gap-2">
                        {expandedRows.has('baseFees') ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                        Service Fees
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.baseFeeRevenue, 0);
                        return <TableCell key={y} className="text-right text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    
                    {expandedRows.has('baseFees') && (() => {
                      const categoryNames = Object.keys(financials[0]?.serviceFeeBreakdown?.byCategory ?? {});
                      if (categoryNames.length === 0) {
                        return properties.map((prop, idx) => (
                          <TableRow key={`base-${prop.id}`} className="bg-gray-50/50">
                            <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">
                              {prop.name}
                            </TableCell>
                            {Array.from({ length: projectionYears }, (_, y) => (
                              <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">
                                {formatMoney(getPropertyYearlyBaseFee(idx, y))}
                              </TableCell>
                            ))}
                          </TableRow>
                        ));
                      }
                      return categoryNames.map(catName => (
                        <React.Fragment key={`cat-${catName}`}>
                          <TableRow
                            className="cursor-pointer hover:bg-gray-50/70"
                            onClick={() => toggleRow(`cat-${catName}`)}
                            data-testid={`row-category-${catName.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <TableCell className="sticky left-0 bg-white pl-12 flex items-center gap-2 text-sm">
                              {expandedRows.has(`cat-${catName}`) ? (
                                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                              )}
                              {catName}
                            </TableCell>
                            {Array.from({ length: projectionYears }, (_, y) => {
                              const yearData = financials.slice(y * 12, (y + 1) * 12);
                              const total = yearData.reduce((a, m) => (m.serviceFeeBreakdown?.byCategory?.[catName] ?? 0) + a, 0);
                              return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                            })}
                          </TableRow>
                          {expandedRows.has(`cat-${catName}`) && properties.map((prop) => {
                            const propName = prop.name;
                            return (
                              <TableRow key={`cat-${catName}-prop-${prop.id}`} className="bg-gray-50/30">
                                <TableCell className="sticky left-0 bg-gray-50/30 pl-[4.5rem] text-xs text-gray-500">
                                  {propName}
                                </TableCell>
                                {Array.from({ length: projectionYears }, (_, y) => {
                                  const yearData = financials.slice(y * 12, (y + 1) * 12);
                                  const total = yearData.reduce((a, m) => (m.serviceFeeBreakdown?.byCategoryByPropertyId?.[catName]?.[String(prop.id)] ?? 0) + a, 0);
                                  return <TableCell key={y} className="text-right text-xs text-gray-500 font-mono">{formatMoney(total)}</TableCell>;
                                })}
                              </TableRow>
                            );
                          })}
                        </React.Fragment>
                      ));
                    })()}
                    
                    <TableRow 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleRow('incentiveFees')}
                      data-testid="row-incentive-fees"
                    >
                      <TableCell className="sticky left-0 bg-white pl-6 flex items-center gap-2">
                        {expandedRows.has('incentiveFees') ? (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                        Incentive Fees
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.incentiveFeeRevenue, 0);
                        return <TableCell key={y} className="text-right text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    
                    {expandedRows.has('incentiveFees') && properties.map((prop) => (
                      <TableRow key={`incentive-${prop.id}`} className="bg-gray-50/50">
                        <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">
                          {prop.name}
                        </TableCell>
                        {Array.from({ length: projectionYears }, (_, y) => {
                          const yearData = financials.slice(y * 12, (y + 1) * 12);
                          const total = yearData.reduce((a, m) => (m.incentiveFeeByPropertyId?.[String(prop.id)] ?? 0) + a, 0);
                          return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                        })}
                      </TableRow>
                    ))}
                    
                    <TableRow 
                      className="bg-gray-50 font-semibold cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleRow('opex')}
                    >
                      <TableCell className="sticky left-0 bg-gray-50 flex items-center gap-2">
                        {expandedRows.has('opex') ? (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                        Operating Expenses
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.totalExpenses, 0);
                        return <TableCell key={y} className="text-right font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('opex') && (
                      <>
                        <TableRow 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => toggleRow('opexComp')}
                        >
                          <TableCell className="sticky left-0 bg-white pl-6 flex items-center gap-2">
                            {expandedRows.has('opexComp') ? (
                              <ChevronDown className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-600" />
                            )}
                            Compensation
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => {
                            const yearData = financials.slice(y * 12, (y + 1) * 12);
                            const total = yearData.reduce((a, m) => a + m.partnerCompensation + m.staffCompensation, 0);
                            return <TableCell key={y} className="text-right text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('opexComp') && (
                          <>
                            <TableRow className="bg-gray-50/50">
                              <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Partner Compensation</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.partnerCompensation, 0);
                                return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-gray-50/50">
                              <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Staff Compensation</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.staffCompensation, 0);
                                return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                              })}
                            </TableRow>
                          </>
                        )}
                        <TableRow 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => toggleRow('opexFixed')}
                        >
                          <TableCell className="sticky left-0 bg-white pl-6 flex items-center gap-2">
                            {expandedRows.has('opexFixed') ? (
                              <ChevronDown className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-600" />
                            )}
                            Fixed Overhead
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => {
                            const yearData = financials.slice(y * 12, (y + 1) * 12);
                            const total = yearData.reduce((a, m) => a + m.officeLease + m.professionalServices + m.techInfrastructure + m.businessInsurance, 0);
                            return <TableCell key={y} className="text-right text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('opexFixed') && (
                          <>
                            <TableRow className="bg-gray-50/50">
                              <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Office Lease</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.officeLease, 0);
                                return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-gray-50/50">
                              <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Professional Services</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.professionalServices, 0);
                                return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-gray-50/50">
                              <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Tech Infrastructure</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.techInfrastructure, 0);
                                return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-gray-50/50">
                              <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Business Insurance</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.businessInsurance, 0);
                                return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                              })}
                            </TableRow>
                          </>
                        )}
                        <TableRow 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => toggleRow('opexVar')}
                        >
                          <TableCell className="sticky left-0 bg-white pl-6 flex items-center gap-2">
                            {expandedRows.has('opexVar') ? (
                              <ChevronDown className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-600" />
                            )}
                            Variable Costs
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => {
                            const yearData = financials.slice(y * 12, (y + 1) * 12);
                            const total = yearData.reduce((a, m) => a + m.travelCosts + m.itLicensing + m.marketing + m.miscOps, 0);
                            return <TableCell key={y} className="text-right text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('opexVar') && (
                          <>
                            <TableRow className="bg-gray-50/50">
                              <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Travel Costs</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.travelCosts, 0);
                                return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-gray-50/50">
                              <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">IT Licensing</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.itLicensing, 0);
                                return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-gray-50/50">
                              <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Marketing</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.marketing, 0);
                                return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-gray-50/50">
                              <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Misc Operations</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.miscOps, 0);
                                return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                              })}
                            </TableRow>
                          </>
                        )}
                      </>
                    )}
                    <TableRow>
                      <TableCell className="sticky left-0 bg-white text-xs text-gray-400 italic pl-6">OpEx % of Revenue</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const totalExpenses = yearData.reduce((a, m) => a + m.totalExpenses, 0);
                        const totalRevenue = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                        const pct = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
                        return (
                          <TableCell key={y} className="text-right text-xs text-gray-400 italic font-mono px-2">
                            {totalRevenue > 0 ? `${pct.toFixed(1)}%` : "—"}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    <TableRow className="bg-primary/10 font-bold">
                      <TableCell className="sticky left-0 bg-primary/10">Net Income</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.netIncome, 0);
                        return (
                          <TableCell key={y} className={`text-right font-mono ${total < 0 ? 'text-destructive' : ''}`}>
                            {formatMoney(total)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-white text-gray-600">Net Margin</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const netIncome = yearData.reduce((a, m) => a + m.netIncome, 0);
                        const totalRevenue = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                        const margin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;
                        return (
                          <TableCell key={y} className={`text-right text-gray-600 font-mono ${margin < 0 ? 'text-destructive' : ''}`}>
                            {margin.toFixed(1)}%
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableBody>
                </Table>
                </div>
              </div>
            </div>
            </ScrollReveal>
          </TabsContent>
          
          <TabsContent value="cashflow" className="mt-6">
            <ScrollReveal>
            {/* Cash Flow Statement */}
            <div ref={activeTab === 'cashflow' ? tableRef : undefined} className="bg-white rounded-2xl p-6 shadow-sm border">
              <div>
                <h3 className="text-lg font-display text-gray-900 mb-4">Statement of Cash Flows — {global?.companyName || "Hospitality Business Co."}</h3>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="sticky left-0 bg-gray-50 text-gray-700">Category</TableHead>
                      {Array.from({ length: projectionYears }, (_, i) => (
                        <TableHead key={i} className="text-right min-w-[100px]">{getFiscalYear(i)}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="font-semibold bg-gray-50">
                      <TableCell className="sticky left-0 bg-gray-50">Cash Flow from Operating Activities</TableCell>
                      {Array.from({ length: projectionYears }, (_, i) => (
                        <TableCell key={i} className="text-right font-mono"></TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-white pl-6">Cash Received from Management Fees</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                        return <TableCell key={y} className="text-right text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleRow('cfBaseFees')}
                    >
                      <TableCell className="sticky left-0 bg-white flex items-center gap-2 pl-10">
                        {expandedRows.has('cfBaseFees') ? (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                        Service Fees
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.baseFeeRevenue, 0);
                        return <TableCell key={y} className="text-right text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('cfBaseFees') && (() => {
                      const categoryNames = Object.keys(financials[0]?.serviceFeeBreakdown?.byCategory ?? {});
                      if (categoryNames.length === 0) {
                        return properties.map((prop, idx) => (
                          <TableRow key={`cfbase-${prop.id}`} className="bg-gray-50/50">
                            <TableCell className="sticky left-0 bg-gray-50/50 pl-14 text-sm text-gray-600">
                              {prop.name}
                            </TableCell>
                            {Array.from({ length: projectionYears }, (_, y) => (
                              <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">
                                {formatMoney(getPropertyYearlyBaseFee(idx, y))}
                              </TableCell>
                            ))}
                          </TableRow>
                        ));
                      }
                      return categoryNames.map(catName => (
                        <React.Fragment key={`cf-cat-${catName}`}>
                          <TableRow
                            className="cursor-pointer hover:bg-gray-50/70"
                            onClick={() => toggleRow(`cf-cat-${catName}`)}
                          >
                            <TableCell className="sticky left-0 bg-white pl-14 flex items-center gap-2 text-sm">
                              {expandedRows.has(`cf-cat-${catName}`) ? (
                                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                              )}
                              {catName}
                            </TableCell>
                            {Array.from({ length: projectionYears }, (_, y) => {
                              const yearData = financials.slice(y * 12, (y + 1) * 12);
                              const total = yearData.reduce((a, m) => (m.serviceFeeBreakdown?.byCategory?.[catName] ?? 0) + a, 0);
                              return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                            })}
                          </TableRow>
                          {expandedRows.has(`cf-cat-${catName}`) && properties.map((prop) => (
                            <TableRow key={`cf-cat-${catName}-prop-${prop.id}`} className="bg-gray-50/30">
                              <TableCell className="sticky left-0 bg-gray-50/30 pl-[4.5rem] text-xs text-gray-500">
                                {prop.name}
                              </TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => (m.serviceFeeBreakdown?.byCategoryByPropertyId?.[catName]?.[String(prop.id)] ?? 0) + a, 0);
                                return <TableCell key={y} className="text-right text-xs text-gray-500 font-mono">{formatMoney(total)}</TableCell>;
                              })}
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ));
                    })()}
                    <TableRow 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleRow('cfIncentiveFees')}
                    >
                      <TableCell className="sticky left-0 bg-white flex items-center gap-2 pl-10">
                        {expandedRows.has('cfIncentiveFees') ? (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                        Incentive Fees
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.incentiveFeeRevenue, 0);
                        return <TableCell key={y} className="text-right text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('cfIncentiveFees') && properties.map((prop) => (
                      <TableRow key={`cfinc-${prop.id}`} className="bg-gray-50/50">
                        <TableCell className="sticky left-0 bg-gray-50/50 pl-14 text-sm text-gray-600">
                          {prop.name}
                        </TableCell>
                        {Array.from({ length: projectionYears }, (_, y) => {
                          const yearData = financials.slice(y * 12, (y + 1) * 12);
                          const total = yearData.reduce((a, m) => (m.incentiveFeeByPropertyId?.[String(prop.id)] ?? 0) + a, 0);
                          return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                        })}
                      </TableRow>
                    ))}
                    <TableRow
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleRow('cfOutflows')}
                    >
                      <TableCell className="sticky left-0 bg-white flex items-center gap-2 pl-6">
                        {expandedRows.has('cfOutflows') ? (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                        Cash Paid for Operating Expenses
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.totalExpenses, 0);
                        return <TableCell key={y} className="text-right font-mono">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('cfOutflows') && (
                      <>
                        <TableRow 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => toggleRow('cfComp')}
                        >
                          <TableCell className="sticky left-0 bg-white pl-6 flex items-center gap-2">
                            {expandedRows.has('cfComp') ? (
                              <ChevronDown className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-600" />
                            )}
                            Compensation
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => {
                            const yearData = financials.slice(y * 12, (y + 1) * 12);
                            const total = yearData.reduce((a, m) => a + m.partnerCompensation + m.staffCompensation, 0);
                            return <TableCell key={y} className="text-right text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('cfComp') && (
                          <>
                            <TableRow className="bg-gray-50/50">
                              <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Partner Compensation</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.partnerCompensation, 0);
                                return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-gray-50/50">
                              <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Staff Compensation</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.staffCompensation, 0);
                                return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                              })}
                            </TableRow>
                          </>
                        )}
                        <TableRow 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => toggleRow('cfFixed')}
                        >
                          <TableCell className="sticky left-0 bg-white pl-6 flex items-center gap-2">
                            {expandedRows.has('cfFixed') ? (
                              <ChevronDown className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-600" />
                            )}
                            Fixed Overhead
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => {
                            const yearData = financials.slice(y * 12, (y + 1) * 12);
                            const total = yearData.reduce((a, m) => a + m.officeLease + m.professionalServices + m.techInfrastructure + m.businessInsurance, 0);
                            return <TableCell key={y} className="text-right text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('cfFixed') && (
                          <>
                            <TableRow className="bg-gray-50/50">
                              <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Office Lease</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.officeLease, 0);
                                return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-gray-50/50">
                              <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Professional Services</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.professionalServices, 0);
                                return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-gray-50/50">
                              <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Tech Infrastructure</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.techInfrastructure, 0);
                                return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-gray-50/50">
                              <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Business Insurance</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.businessInsurance, 0);
                                return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                              })}
                            </TableRow>
                          </>
                        )}
                        <TableRow 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => toggleRow('cfVar')}
                        >
                          <TableCell className="sticky left-0 bg-white pl-6 flex items-center gap-2">
                            {expandedRows.has('cfVar') ? (
                              <ChevronDown className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-600" />
                            )}
                            Variable Costs
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => {
                            const yearData = financials.slice(y * 12, (y + 1) * 12);
                            const total = yearData.reduce((a, m) => a + m.travelCosts + m.itLicensing + m.marketing + m.miscOps, 0);
                            return <TableCell key={y} className="text-right text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('cfVar') && (
                          <>
                            <TableRow className="bg-gray-50/50">
                              <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Travel Costs</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.travelCosts, 0);
                                return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-gray-50/50">
                              <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">IT Licensing</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.itLicensing, 0);
                                return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-gray-50/50">
                              <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Marketing</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.marketing, 0);
                                return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-gray-50/50">
                              <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">Misc Operations</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.miscOps, 0);
                                return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">({formatMoney(total)})</TableCell>;
                              })}
                            </TableRow>
                          </>
                        )}
                      </>
                    )}

                    {/* Net Cash from Operating Activities subtotal */}
                    <TableRow className="border-t-2 border-gray-300 font-semibold">
                      <TableCell className="sticky left-0 bg-white">Net Cash from Operating Activities</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.netIncome, 0);
                        return (
                          <TableCell key={y} className={`text-right font-mono ${total < 0 ? 'text-destructive' : ''}`}>
                            {formatMoney(total)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-white text-xs text-gray-400 italic pl-6">% of Revenue</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const cashFromOps = yearData.reduce((a, m) => a + m.netIncome, 0);
                        const totalRevenue = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                        const pct = totalRevenue > 0 ? (cashFromOps / totalRevenue) * 100 : 0;
                        return (
                          <TableCell key={y} className="text-right text-xs text-gray-400 italic font-mono px-2">
                            {totalRevenue > 0 ? `${pct.toFixed(1)}%` : "—"}
                          </TableCell>
                        );
                      })}
                    </TableRow>

                    {/* Cash Flow from Financing Activities */}
                    <TableRow className="font-semibold bg-gray-50">
                      <TableCell className="sticky left-0 bg-gray-50">Cash Flow from Financing Activities</TableCell>
                      {Array.from({ length: projectionYears }, (_, i) => (
                        <TableCell key={i} className="text-right font-mono"></TableCell>
                      ))}
                    </TableRow>
                    <TableRow
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleRow('cfSafe')}
                    >
                      <TableCell className="sticky left-0 bg-white flex items-center gap-2 pl-6">
                        {expandedRows.has('cfSafe') ? (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                        {fundingLabel} Funding Received
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.safeFunding, 0);
                        return <TableCell key={y} className="text-right text-gray-600 font-mono">{total > 0 ? formatMoney(total) : '-'}</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('cfSafe') && (
                      <>
                        <TableRow className="bg-gray-50/50">
                          <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">
                            {fundingLabel} Tranche 1
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => {
                            const yearData = financials.slice(y * 12, (y + 1) * 12);
                            const total = yearData.reduce((a, m) => a + m.safeFunding1, 0);
                            return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{total > 0 ? formatMoney(total) : '-'}</TableCell>;
                          })}
                        </TableRow>
                        <TableRow className="bg-gray-50/50">
                          <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">
                            {fundingLabel} Tranche 2
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => {
                            const yearData = financials.slice(y * 12, (y + 1) * 12);
                            const total = yearData.reduce((a, m) => a + m.safeFunding2, 0);
                            return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{total > 0 ? formatMoney(total) : '-'}</TableCell>;
                          })}
                        </TableRow>
                      </>
                    )}
                    <TableRow className="border-t-2 border-gray-300 font-semibold">
                      <TableCell className="sticky left-0 bg-white">Net Cash from Financing Activities</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.safeFunding, 0);
                        return <TableCell key={y} className="text-right font-mono">{total > 0 ? formatMoney(total) : '-'}</TableCell>;
                      })}
                    </TableRow>

                    {/* Net Increase (Decrease) in Cash */}
                    <TableRow className="bg-primary/10 font-bold">
                      <TableCell className="sticky left-0 bg-primary/10">Net Increase (Decrease) in Cash</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.cashFlow, 0);
                        return (
                          <TableCell key={y} className={`text-right font-mono ${total < 0 ? 'text-destructive' : ''}`}>
                            {formatMoney(total)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-white text-gray-600">Opening Cash Balance</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        let cumulative = 0;
                        for (let i = 0; i < y; i++) {
                          const yearData = financials.slice(i * 12, (i + 1) * 12);
                          cumulative += yearData.reduce((a, m) => a + m.cashFlow, 0);
                        }
                        return <TableCell key={y} className="text-right text-gray-600 font-mono">{formatMoney(cumulative)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow className="bg-gray-50 font-semibold">
                      <TableCell className="sticky left-0 bg-gray-50">Closing Cash Balance</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        let cumulative = 0;
                        for (let i = 0; i <= y; i++) {
                          const yearData = financials.slice(i * 12, (i + 1) * 12);
                          cumulative += yearData.reduce((a, m) => a + m.cashFlow, 0);
                        }
                        return (
                          <TableCell key={y} className={`text-right font-mono ${cumulative < 0 ? 'text-destructive' : ''}`}>
                            {formatMoney(cumulative)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableBody>
                </Table>
                </div>
              </div>
            </div>
            </ScrollReveal>
          </TabsContent>

          <TabsContent value="balance" className="mt-6">
            <ScrollReveal>
            {/* Balance Sheet */}
            <div ref={activeTab === 'balance' ? tableRef : undefined} className="bg-white rounded-2xl p-6 shadow-sm border">
              <div>
                <h3 className="text-lg font-display text-gray-900 mb-4">Balance Sheet - {global?.companyName || "Hospitality Business Co."} (As of {getFiscalYear(projectionYears - 1)})</h3>
                {(() => {
                  const cumulativeNetIncome = financials.reduce((a, m) => a + m.netIncome, 0);
                  
                  const safeTranche1 = global.safeTranche1Amount || 0;
                  const safeTranche2 = global.safeTranche2Amount || 0;
                  const totalSafeFunding = safeTranche1 + safeTranche2;
                  
                  const cashBalance = totalSafeFunding + cumulativeNetIncome;
                  const totalAssets = cashBalance;
                  
                  const safeNotesPayable = totalSafeFunding;
                  const totalLiabilities = safeNotesPayable;
                  
                  const retainedEarnings = cumulativeNetIncome;
                  const totalEquity = retainedEarnings;
                  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

                  return (
                    <Table>
                      <TableBody>
                        {/* ASSETS */}
                        <TableRow className="bg-gray-50 font-semibold">
                          <TableCell colSpan={2} className="text-lg font-display text-accent">ASSETS</TableCell>
                        </TableRow>
                        
                        <TableRow className="bg-gray-50">
                          <TableCell className="font-medium pl-4">Current Assets</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        <TableRow 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => setBsExpanded(prev => ({ ...prev, cash: !prev.cash }))}
                        >
                          <TableCell className="pl-8">
                            <span className="flex items-center gap-1">
                              {bsExpanded.cash ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                              Cash & Cash Equivalents
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatMoney(cashBalance)}</TableCell>
                        </TableRow>
                        {bsExpanded.cash && (
                          <>
                            <TableRow className="bg-blue-50/40" data-expandable-row="true">
                              <TableCell className="pl-12 py-0.5 text-xs text-gray-500 italic">{fundingLabel} Funding (Total)</TableCell>
                              <TableCell className="text-right py-0.5 font-mono text-xs text-gray-500">{formatMoney(totalSafeFunding)}</TableCell>
                            </TableRow>
                            {safeTranche1 > 0 && (
                              <TableRow className="bg-blue-50/40" data-expandable-row="true">
                                <TableCell className="pl-16 py-0.5 text-xs text-gray-500 italic">Tranche 1</TableCell>
                                <TableCell className="text-right py-0.5 font-mono text-xs text-gray-500">{formatMoney(safeTranche1)}</TableCell>
                              </TableRow>
                            )}
                            {safeTranche2 > 0 && (
                              <TableRow className="bg-blue-50/40" data-expandable-row="true">
                                <TableCell className="pl-16 py-0.5 text-xs text-gray-500 italic">Tranche 2</TableCell>
                                <TableCell className="text-right py-0.5 font-mono text-xs text-gray-500">{formatMoney(safeTranche2)}</TableCell>
                              </TableRow>
                            )}
                            <TableRow className="bg-blue-50/40" data-expandable-row="true">
                              <TableCell className="pl-12 py-0.5 text-xs text-gray-500 italic">+ Cumulative Net Income</TableCell>
                              <TableCell className="text-right py-0.5 font-mono text-xs text-gray-500">{formatMoney(cumulativeNetIncome)}</TableCell>
                            </TableRow>
                          </>
                        )}
                        <TableRow className="font-medium bg-gray-50/50">
                          <TableCell className="pl-4">Total Current Assets</TableCell>
                          <TableCell className="text-right font-mono">{formatMoney(cashBalance)}</TableCell>
                        </TableRow>
                        
                        <TableRow className="font-semibold border-t-2">
                          <TableCell>TOTAL ASSETS</TableCell>
                          <TableCell className="text-right font-mono">{formatMoney(totalAssets)}</TableCell>
                        </TableRow>

                        <TableRow><TableCell colSpan={2} className="h-4"></TableCell></TableRow>

                        {/* LIABILITIES */}
                        <TableRow className="bg-gray-50 font-semibold">
                          <TableCell colSpan={2} className="text-lg font-display text-accent">LIABILITIES</TableCell>
                        </TableRow>
                        
                        <TableRow className="bg-gray-50">
                          <TableCell className="font-medium pl-4">Long-Term Liabilities</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        <TableRow
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => setBsExpanded(prev => ({ ...prev, notes: !prev.notes }))}
                        >
                          <TableCell className="pl-8">
                            <span className="flex items-center gap-1">
                              {bsExpanded.notes ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                              {fundingLabel} Notes Payable
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatMoney(safeNotesPayable)}</TableCell>
                        </TableRow>
                        {bsExpanded.notes && (
                          <>
                            {safeTranche1 > 0 && (
                              <TableRow className="bg-blue-50/40" data-expandable-row="true">
                                <TableCell className="pl-12 py-0.5 text-xs text-gray-500 italic">Tranche 1</TableCell>
                                <TableCell className="text-right py-0.5 font-mono text-xs text-gray-500">{formatMoney(safeTranche1)}</TableCell>
                              </TableRow>
                            )}
                            {safeTranche2 > 0 && (
                              <TableRow className="bg-blue-50/40" data-expandable-row="true">
                                <TableCell className="pl-12 py-0.5 text-xs text-gray-500 italic">Tranche 2</TableCell>
                                <TableCell className="text-right py-0.5 font-mono text-xs text-gray-500">{formatMoney(safeTranche2)}</TableCell>
                              </TableRow>
                            )}
                          </>
                        )}
                        <TableRow className="font-medium bg-gray-50/50">
                          <TableCell className="pl-4">Total Long-Term Liabilities</TableCell>
                          <TableCell className="text-right font-mono">{formatMoney(totalLiabilities)}</TableCell>
                        </TableRow>
                        
                        <TableRow className="font-semibold border-t">
                          <TableCell>TOTAL LIABILITIES</TableCell>
                          <TableCell className="text-right font-mono">{formatMoney(totalLiabilities)}</TableCell>
                        </TableRow>

                        <TableRow><TableCell colSpan={2} className="h-4"></TableCell></TableRow>

                        {/* EQUITY */}
                        <TableRow className="bg-gray-50 font-semibold">
                          <TableCell colSpan={2} className="text-lg font-display text-accent">EQUITY</TableCell>
                        </TableRow>
                        
                        <TableRow
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => setBsExpanded(prev => ({ ...prev, equity: !prev.equity }))}
                        >
                          <TableCell className="pl-4">
                            <span className="flex items-center gap-1">
                              {bsExpanded.equity ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                              Retained Earnings
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatMoney(retainedEarnings)}</TableCell>
                        </TableRow>
                        {bsExpanded.equity && (
                          <>
                            <TableRow className="bg-blue-50/40" data-expandable-row="true">
                              <TableCell className="pl-12 py-0.5 text-xs text-gray-500 italic">Cumulative Revenue</TableCell>
                              <TableCell className="text-right py-0.5 font-mono text-xs text-gray-500">{formatMoney(financials.reduce((a, m) => a + m.totalRevenue, 0))}</TableCell>
                            </TableRow>
                            <TableRow className="bg-blue-50/40" data-expandable-row="true">
                              <TableCell className="pl-12 py-0.5 text-xs text-gray-500 italic">Less: Cumulative Expenses</TableCell>
                              <TableCell className="text-right py-0.5 font-mono text-xs text-gray-500">{formatMoney(-financials.reduce((a, m) => a + m.totalExpenses, 0))}</TableCell>
                            </TableRow>
                            <TableRow className="bg-blue-50/40" data-expandable-row="true">
                              <TableCell className="pl-12 py-0.5 text-xs text-gray-500 italic">= Net Income</TableCell>
                              <TableCell className="text-right py-0.5 font-mono text-xs text-gray-500">{formatMoney(cumulativeNetIncome)}</TableCell>
                            </TableRow>
                          </>
                        )}
                        
                        <TableRow className="font-semibold border-t">
                          <TableCell>TOTAL EQUITY</TableCell>
                          <TableCell className="text-right font-mono">{formatMoney(totalEquity)}</TableCell>
                        </TableRow>

                        <TableRow><TableCell colSpan={2} className="h-4"></TableCell></TableRow>

                        {/* TOTAL */}
                        <TableRow className="font-bold border-t-2 bg-primary/10">
                          <TableCell>TOTAL LIABILITIES & EQUITY</TableCell>
                          <TableCell className="text-right font-mono">{formatMoney(totalLiabilitiesAndEquity)}</TableCell>
                        </TableRow>

                        {Math.abs(totalAssets - totalLiabilitiesAndEquity) > 1 && (
                          <TableRow>
                            <TableCell colSpan={2} className="bg-red-50 border-t border-red-200">
                              <span className="text-red-700 text-xs font-medium">
                                Balance sheet does not balance — Assets {formatMoney(totalAssets)} ≠ L+E {formatMoney(totalLiabilitiesAndEquity)} (variance: {formatMoney(totalAssets - totalLiabilitiesAndEquity)})
                              </span>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  );
                })()}
              </div>
            </div>
            </ScrollReveal>
          </TabsContent>

          {/* Cash Position Footnote */}
          {!cashAnalysis.isAdequate ? (
            <div className="flex items-start gap-2 text-sm text-gray-600 mt-4" data-testid="banner-company-cash-warning">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p>
                <span data-testid="text-company-cash-warning-title" className="font-medium text-red-600">Additional Funding Required:</span>{' '}
                The current {fundingLabel} funding of <span className="font-medium text-gray-900">{formatMoney(cashAnalysis.totalFunding)}</span> is insufficient to cover operating expenses.
                Monthly cash position drops to <span className="font-medium text-red-600">{formatMoney(cashAnalysis.minCashPosition)}</span>
                {cashAnalysis.minCashMonth !== null && <> in month {cashAnalysis.minCashMonth}</>}.
                {' '}Suggested: Increase {fundingLabel} funding by at least{' '}
                <span className="font-medium text-gray-900">{formatMoney(cashAnalysis.suggestedAdditionalFunding)}</span> in{' '}
                <Link href="/company/assumptions" className="font-medium text-secondary hover:underline">Company Assumptions</Link>.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-sm text-gray-600 mt-4" data-testid="banner-company-cash-adequate">
              <CheckCircle className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
              <p>
                <span data-testid="text-company-cash-adequate-title" className="font-medium text-secondary">Cash Position Adequate:</span>{' '}
                The {fundingLabel} funding of <span className="font-medium text-gray-900">{formatMoney(cashAnalysis.totalFunding)}</span> covers all operating costs.
                {cashAnalysis.minCashMonth !== null && (
                  <> Minimum cash position: <span className="font-medium text-gray-900">{formatMoney(cashAnalysis.minCashPosition)}</span> (month {cashAnalysis.minCashMonth}).</>
                )}
              </p>
            </div>
          )}
        </Tabs>
        </CalcDetailsProvider>
      </div>
      </AnimatedPage>
    </Layout>
  );
}
