/**
 * Company.tsx — Management company financial dashboard.
 *
 * This page shows the pro-forma financials for the management company itself
 * (not individual properties). The management company earns revenue from
 * service fees (base management fees charged as a percentage of property
 * revenue) and incentive fees (a share of property NOI above a threshold).
 * Its expenses include partner compensation, staff salaries, office lease,
 * professional services, insurance, travel, IT, and marketing.
 *
 * Three financial statement tabs:
 *   • Income Statement — revenue breakdown (service fees by category, incentive
 *     fees by property), expense breakdown, and net income with margin %.
 *   • Cash Flow Statement — operating activities (fee receipts minus expenses),
 *     financing activities (SAFE note funding tranches), and running cash balance.
 *   • Balance Sheet — simple Assets (cash) = Liabilities (SAFE notes) + Equity
 *     (retained earnings).
 *
 * The page also runs a cash-position analysis that warns if the company will
 * run out of cash before reaching profitability (a common concern for startups
 * with high fixed costs and a slowly-growing portfolio).
 *
 * Data flow:
 *   1. Fetch all properties and global assumptions.
 *   2. Enrich each property with its custom fee categories (if any).
 *   3. Run `generateCompanyProForma()` to get monthly management-company financials.
 *   4. Also run `generatePropertyProForma()` per property for per-property fee drill-down.
 *   5. Aggregate monthly data into yearly totals for display and export.
 *
 * Exports: PDF (with chart), Excel, CSV, PowerPoint, PNG.
 */
import React, { useState, useRef, useMemo } from "react";
import domtoimage from 'dom-to-image-more';
import { ExportDialog } from "@/components/ExportDialog";
import Layout from "@/components/Layout";
import { useProperties, useGlobalAssumptions, useAllFeeCategories } from "@/lib/api";
import { generateCompanyProForma, generatePropertyProForma, formatMoney, getFiscalYearForModelYear, CompanyMonthlyFinancials } from "@/lib/financialEngine";
import { PROJECTION_YEARS, STAFFING_TIERS } from "@/lib/constants";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { ExportMenu, pdfAction, excelAction, csvAction, pptxAction, chartAction, pngAction } from "@/components/ui/export-toolbar";
import { CalcDetailsProvider } from "@/components/financial-table-rows";
import { exportCompanyPPTX } from "@/lib/exports/pptxExport";
import { exportCompanyIncomeStatement, exportCompanyCashFlow, exportCompanyBalanceSheet } from "@/lib/exports/excelExport";
import { Link } from "wouter";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { drawLineChart } from "@/lib/pdfChartDrawer";
import { format } from "date-fns";
import { AnimatedPage } from "@/components/graphics";
import { analyzeCompanyCashPosition } from "@/lib/financial/analyzeCompanyCashPosition";
import { CompanyHeader, CompanyIncomeTab, CompanyCashFlowTab, CompanyBalanceSheet } from "@/components/company";

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

  // Attach custom fee categories to each property before running the company engine.
  // Properties with no custom categories use the default management fee rate;
  // properties WITH custom categories get a per-category breakdown in the proforma.
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

  // Detect whether the management company will run out of cash before reaching
  // profitability. This triggers a warning banner at the top of the page.
  const cashAnalysis = useMemo(
    () => analyzeCompanyCashPosition(financials),
    [financials]
  );

  // Per-property proformas are needed for the fee drill-down: the company IS
  // shows each property's contribution to service fees and incentive fees.
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
        const getPropertyYearlyBaseFee = (propIdx: number, year: number) => {
          const pf = propertyFinancials[propIdx].financials;
          const yd = pf.slice(year * 12, (year + 1) * 12);
          return yd.reduce((a: number, m: any) => a + m.feeBase, 0);
        };
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
        const getPropertyYearlyBaseFee = (propIdx: number, year: number) => {
          const pf = propertyFinancials[propIdx].financials;
          const yd = pf.slice(year * 12, (year + 1) * 12);
          return yd.reduce((a: number, m: any) => a + m.feeBase, 0);
        };
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

  const exportMenuNode = (
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
  );

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
        <CalcDetailsProvider show={global?.showCompanyCalculationDetails ?? true}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CompanyHeader
            global={global}
            properties={properties}
            yearlyChartData={yearlyChartData}
            cashAnalysis={cashAnalysis}
            projectionYears={projectionYears}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            chartRef={chartRef}
            exportMenuNode={exportMenuNode}
          />
          
          <TabsContent value="income" className="mt-6">
            <CompanyIncomeTab
              financials={financials}
              properties={properties}
              global={global}
              projectionYears={projectionYears}
              expandedRows={expandedRows}
              toggleRow={toggleRow}
              getFiscalYear={getFiscalYear}
              fundingLabel={fundingLabel}
              tableRef={tableRef}
              activeTab={activeTab}
              propertyFinancials={propertyFinancials}
            />
          </TabsContent>
          
          <TabsContent value="cashflow" className="mt-6">
            <CompanyCashFlowTab
              financials={financials}
              properties={properties}
              global={global}
              projectionYears={projectionYears}
              expandedRows={expandedRows}
              toggleRow={toggleRow}
              getFiscalYear={getFiscalYear}
              fundingLabel={fundingLabel}
              tableRef={tableRef}
              activeTab={activeTab}
              propertyFinancials={propertyFinancials}
            />
          </TabsContent>

          <TabsContent value="balance" className="mt-6">
            <CompanyBalanceSheet
              financials={financials}
              global={global}
              projectionYears={projectionYears}
              getFiscalYear={getFiscalYear}
              fundingLabel={fundingLabel}
              bsExpanded={bsExpanded}
              setBsExpanded={setBsExpanded}
              tableRef={tableRef}
              activeTab={activeTab}
            />
          </TabsContent>

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
