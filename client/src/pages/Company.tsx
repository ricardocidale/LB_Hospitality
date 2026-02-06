import { useState, useRef } from "react";
import domtoimage from 'dom-to-image-more';
import { ExportDialog } from "@/components/ExportDialog";
import Layout from "@/components/Layout";
import { useProperties, useGlobalAssumptions } from "@/lib/api";
import { generateCompanyProForma, generatePropertyProForma, formatMoney, getFiscalYearForModelYear } from "@/lib/financialEngine";
import { PROJECTION_YEARS, STAFFING_TIERS, OPERATING_RESERVE_BUFFER, COMPANY_FUNDING_BUFFER } from "@/lib/constants";
import { Tabs, TabsContent, DarkGlassTabs } from "@/components/ui/tabs";
import { FileText, Banknote, Scale } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Users, Briefcase, TrendingUp, Settings2, Loader2, ChevronRight, ChevronDown, FileDown, ImageIcon, AlertTriangle, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { GlassButton } from "@/components/ui/glass-button";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { drawLineChart } from "@/lib/pdfChartDrawer";
import { format } from "date-fns";
import { CompanyMonthlyFinancials } from "@/lib/financialEngine";

interface CompanyCashAnalysis {
  totalSafeFunding: number;
  minCashPosition: number;
  minCashMonth: number | null;
  shortfall: number;
  isAdequate: boolean;
  suggestedAdditionalFunding: number;
}

function analyzeCompanyCashPosition(financials: CompanyMonthlyFinancials[]): CompanyCashAnalysis {
  if (!financials || financials.length === 0) {
    return {
      totalSafeFunding: 0,
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
      totalSafeFunding: 0,
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
    totalSafeFunding: totalSafe,
    minCashPosition,
    minCashMonth,
    shortfall,
    isAdequate,
    suggestedAdditionalFunding
  };
}

export default function Company() {
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: global, isLoading: globalLoading } = useGlobalAssumptions();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("income");
  const chartRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'chart' | 'tablePng'>('pdf');

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

  if (propertiesLoading || globalLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
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

  const projectionYears = global?.projectionYears ?? PROJECTION_YEARS;
  const projectionMonths = projectionYears * 12;
  const fiscalYearStartMonth = global.fiscalYearStartMonth ?? 1;
  const getFiscalYear = (yearIndex: number) => getFiscalYearForModelYear(global.modelStartDate, fiscalYearStartMonth, yearIndex);
  const financials = generateCompanyProForma(properties, global, projectionMonths);
  
  const cashAnalysis = analyzeCompanyCashPosition(financials);
  
  const propertyFinancials = properties.map(p => ({
    property: p,
    financials: generatePropertyProForma(p, global, projectionMonths)
  }));
  
  const yearlyChartData = [];
  for (let y = 0; y < projectionYears; y++) {
    const yearData = financials.slice(y * 12, (y + 1) * 12);
    if (yearData.length === 0) continue;
    yearlyChartData.push({
      year: String(getFiscalYear(y)),
      Revenue: yearData.reduce((a, m) => a + m.totalRevenue, 0),
      Expenses: yearData.reduce((a, m) => a + m.totalExpenses, 0),
      NetIncome: yearData.reduce((a, m) => a + m.netIncome, 0),
    });
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
    return yearData.reduce((a, m) => a + m.revenueTotal, 0) * global.baseManagementFee;
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
    
    rows.push({ category: "Base Management Fees", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.baseFeeRevenue, 0);
    }), indent: 1 });
    
    properties.forEach((prop, idx) => {
      rows.push({ category: prop.name, values: years.map((_, y) => getPropertyYearlyBaseFee(idx, y)), indent: 2 });
    });
    
    rows.push({ category: "Incentive Fees", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.incentiveFeeRevenue, 0);
    }), indent: 1 });
    
    properties.forEach((prop, idx) => {
      rows.push({ category: prop.name, values: years.map((_, y) => getPropertyYearlyIncentiveFee(idx, y)), indent: 2 });
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
    const rows: { category: string; values: number[]; isHeader?: boolean; indent?: number }[] = [];
    
    rows.push({ category: "Cash Inflows", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.totalRevenue + m.safeFunding, 0);
    }), isHeader: true });
    
    rows.push({ category: "Management Fee Revenue", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.totalRevenue, 0);
    }), indent: 1 });
    
    rows.push({ category: "Base Management Fees", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.baseFeeRevenue, 0);
    }), indent: 2 });
    
    properties.forEach((prop, idx) => {
      rows.push({ category: prop.name, values: years.map((_, y) => getPropertyYearlyBaseFee(idx, y)), indent: 3 });
    });
    
    rows.push({ category: "Incentive Fees", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.incentiveFeeRevenue, 0);
    }), indent: 2 });
    
    properties.forEach((prop, idx) => {
      rows.push({ category: prop.name, values: years.map((_, y) => getPropertyYearlyIncentiveFee(idx, y)), indent: 3 });
    });
    
    rows.push({ category: "SAFE Funding", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.safeFunding, 0);
    }), indent: 1 });
    
    rows.push({ category: "SAFE Tranche 1", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.safeFunding1, 0);
    }), indent: 2 });
    
    rows.push({ category: "SAFE Tranche 2", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.safeFunding2, 0);
    }), indent: 2 });
    
    rows.push({ category: "Cash Outflows", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.totalExpenses, 0);
    }), isHeader: true });
    
    rows.push({ category: "Compensation", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.partnerCompensation + m.staffCompensation, 0);
    }), indent: 1 });
    
    rows.push({ category: "Partner Compensation", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.partnerCompensation, 0);
    }), indent: 2 });
    
    rows.push({ category: "Staff Compensation", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.staffCompensation, 0);
    }), indent: 2 });
    
    rows.push({ category: "Fixed Overhead", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.officeLease + m.professionalServices + m.techInfrastructure + m.businessInsurance, 0);
    }), indent: 1 });
    
    rows.push({ category: "Office Lease", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.officeLease, 0);
    }), indent: 2 });
    
    rows.push({ category: "Professional Services", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.professionalServices, 0);
    }), indent: 2 });
    
    rows.push({ category: "Insurance", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.businessInsurance, 0);
    }), indent: 2 });
    
    rows.push({ category: "Variable Costs", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.travelCosts + m.itLicensing + m.marketing + m.miscOps, 0);
    }), indent: 1 });
    
    rows.push({ category: "Travel", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.travelCosts, 0);
    }), indent: 2 });
    
    rows.push({ category: "IT Licensing", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.itLicensing, 0);
    }), indent: 2 });
    
    rows.push({ category: "Marketing", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.marketing, 0);
    }), indent: 2 });
    
    rows.push({ category: "Misc Operations", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.miscOps, 0);
    }), indent: 2 });
    
    rows.push({ category: "Net Cash Flow", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.netIncome + m.safeFunding, 0);
    }), isHeader: true });
    
    let cumCash = 0;
    rows.push({ category: "Ending Cash Balance", values: years.map((_, y) => {
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
    rows.push({ category: "SAFE Notes", values: safeValues, indent: 1 });
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
    doc.text(`${global?.companyName || "L+B Hospitality Co."} - ${title}`, 14, 15);
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
    const colStyles: Record<number, { halign?: string; cellWidth?: number }> = { 
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
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExport}
        title={exportType === 'pdf' ? 'Export PDF' : exportType === 'tablePng' ? 'Export Table as PNG' : 'Export Chart'}
      />
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title={global?.companyName || "L+B Hospitality Co."}
          subtitle="Corporate Management Entity & Operations"
          actions={
            <Link href="/company/assumptions">
              <GlassButton variant="settings">
                <Settings2 className="w-4 h-4" />
                Assumptions
              </GlassButton>
            </Link>
          }
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-6">
            <DarkGlassTabs
              tabs={[
                { value: 'income', label: 'Income Statement', icon: FileText },
                { value: 'cashflow', label: 'Cash Flows', icon: Banknote },
                { value: 'balance', label: 'Balance Sheet', icon: Scale }
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              rightContent={
                <>
                  <button
                    onClick={() => { setExportType('pdf'); setExportDialogOpen(true); }}
                    className="group/btn relative overflow-hidden flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-white rounded-2xl transition-all duration-300 ease-out"
                    data-testid="button-export-pdf"
                  >
                    <div className="absolute inset-0 bg-white/12 backdrop-blur-xl rounded-2xl" />
                    <div className="absolute inset-0 rounded-2xl border border-white/20" />
                    <div className="absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_4px_16px_rgba(0,0,0,0.2)]" />
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 bg-white/5" />
                    <FileDown className="relative w-3.5 h-3.5" />
                    <span className="relative">PDF</span>
                  </button>
                  <button
                    onClick={() => exportCompanyCSV(activeTab as 'income' | 'cashflow' | 'balance')}
                    className="group/btn relative overflow-hidden flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-white rounded-2xl transition-all duration-300 ease-out"
                    data-testid="button-export-csv"
                  >
                    <div className="absolute inset-0 bg-white/12 backdrop-blur-xl rounded-2xl" />
                    <div className="absolute inset-0 rounded-2xl border border-white/20" />
                    <div className="absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_4px_16px_rgba(0,0,0,0.2)]" />
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 bg-white/5" />
                    <FileDown className="relative w-3.5 h-3.5" />
                    <span className="relative">CSV</span>
                  </button>
                  <button
                    onClick={() => { setExportType('chart'); setExportDialogOpen(true); }}
                    className="group/btn relative overflow-hidden flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-white rounded-2xl transition-all duration-300 ease-out"
                    data-testid="button-export-chart"
                  >
                    <div className="absolute inset-0 bg-white/12 backdrop-blur-xl rounded-2xl" />
                    <div className="absolute inset-0 rounded-2xl border border-white/20" />
                    <div className="absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_4px_16px_rgba(0,0,0,0.2)]" />
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 bg-white/5" />
                    <ImageIcon className="relative w-3.5 h-3.5" />
                    <span className="relative">Chart</span>
                  </button>
                  <button
                    onClick={() => exportTablePNG()}
                    className="group/btn relative overflow-hidden flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-white rounded-2xl transition-all duration-300 ease-out"
                    data-testid="button-export-table-png"
                  >
                    <div className="absolute inset-0 bg-white/12 backdrop-blur-xl rounded-2xl" />
                    <div className="absolute inset-0 rounded-2xl border border-white/20" />
                    <div className="absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_4px_16px_rgba(0,0,0,0.2)]" />
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 bg-white/5" />
                    <ImageIcon className="relative w-3.5 h-3.5" />
                    <span className="relative">PNG</span>
                  </button>
                </>
              }
            />
          </div>

          {/* Chart Card - Light Theme */}
          <div ref={chartRef} className="relative overflow-hidden rounded-3xl p-6 bg-white shadow-lg border border-gray-100">
            <div className="relative">
              <h3 className="text-lg font-display text-gray-900 mb-4">Management Company Performance ({projectionYears}-Year Projection)</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearlyChartData}>
                    <defs>
                      <linearGradient id="companyRevenueGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#257D41" />
                        <stop offset="100%" stopColor="#34D399" />
                      </linearGradient>
                      <linearGradient id="companyExpensesGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#60A5FA" />
                      </linearGradient>
                      <linearGradient id="companyNetIncomeGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#F4795B" />
                        <stop offset="100%" stopColor="#FB923C" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis 
                      dataKey="year" 
                      stroke="#6B7280" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <YAxis 
                      stroke="#6B7280" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#E5E7EB' }}
                      tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        borderColor: '#E5E7EB',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        color: '#111827',
                      }}
                      labelStyle={{ color: '#374151', fontWeight: 600 }}
                      formatter={(value: number) => [formatMoney(value), ""]}
                    />
                    <Legend 
                      wrapperStyle={{ color: '#374151' }}
                      iconType="circle"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Revenue" 
                      stroke="url(#companyRevenueGradient)" 
                      strokeWidth={3}
                      dot={{ fill: '#257D41', stroke: '#fff', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#257D41', stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Expenses" 
                      stroke="url(#companyExpensesGradient)" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', stroke: '#fff', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="NetIncome" 
                      stroke="url(#companyNetIncomeGradient)" 
                      strokeWidth={3}
                      dot={{ fill: '#F4795B', stroke: '#fff', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#F4795B', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <TabsContent value="income" className="mt-6">
            {/* Income Statement */}
            <div ref={activeTab === 'income' ? tableRef : undefined} className="bg-white rounded-2xl p-6 shadow-sm border">
              <div>
                <h3 className="text-lg font-display text-gray-900 mb-4">Income Statement - {global?.companyName || "L+B Hospitality Co."}</h3>
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
                    >
                      <TableCell className="sticky left-0 bg-white pl-6 flex items-center gap-2">
                        {expandedRows.has('baseFees') ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                        Base Management Fees
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.baseFeeRevenue, 0);
                        return <TableCell key={y} className="text-right text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    
                    {expandedRows.has('baseFees') && properties.map((prop, idx) => (
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
                    ))}
                    
                    <TableRow 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleRow('incentiveFees')}
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
                    
                    {expandedRows.has('incentiveFees') && properties.map((prop, idx) => (
                      <TableRow key={`incentive-${prop.id}`} className="bg-gray-50/50">
                        <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">
                          {prop.name}
                        </TableCell>
                        {Array.from({ length: projectionYears }, (_, y) => (
                          <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">
                            {formatMoney(getPropertyYearlyIncentiveFee(idx, y))}
                          </TableCell>
                        ))}
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
          </TabsContent>
          
          <TabsContent value="cashflow" className="mt-6">
            {/* Cash Flow Statement */}
            <div ref={activeTab === 'cashflow' ? tableRef : undefined} className="bg-white rounded-2xl p-6 shadow-sm border">
              <div>
                <h3 className="text-lg font-display text-gray-900 mb-4">Cash Flow Statement - {global?.companyName || "L+B Hospitality Co."}</h3>
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
                      <TableCell className="sticky left-0 bg-gray-50">Cash Inflows</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const revenue = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                        const safe = yearData.reduce((a, m) => a + m.safeFunding, 0);
                        return <TableCell key={y} className="text-right font-mono">{formatMoney(revenue + safe)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-white pl-6">Management Fee Revenue</TableCell>
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
                        Base Management Fees
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.baseFeeRevenue, 0);
                        return <TableCell key={y} className="text-right text-gray-600 font-mono">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('cfBaseFees') && properties.map((prop, idx) => (
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
                    ))}
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
                    {expandedRows.has('cfIncentiveFees') && properties.map((prop, idx) => (
                      <TableRow key={`cfinc-${prop.id}`} className="bg-gray-50/50">
                        <TableCell className="sticky left-0 bg-gray-50/50 pl-14 text-sm text-gray-600">
                          {prop.name}
                        </TableCell>
                        {Array.from({ length: projectionYears }, (_, y) => (
                          <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">
                            {formatMoney(getPropertyYearlyIncentiveFee(idx, y))}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
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
                        SAFE Funding
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
                            SAFE Tranche 1
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => {
                            const yearData = financials.slice(y * 12, (y + 1) * 12);
                            const total = yearData.reduce((a, m) => a + m.safeFunding1, 0);
                            return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{total > 0 ? formatMoney(total) : '-'}</TableCell>;
                          })}
                        </TableRow>
                        <TableRow className="bg-gray-50/50">
                          <TableCell className="sticky left-0 bg-gray-50/50 pl-12 text-sm text-gray-600">
                            SAFE Tranche 2
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => {
                            const yearData = financials.slice(y * 12, (y + 1) * 12);
                            const total = yearData.reduce((a, m) => a + m.safeFunding2, 0);
                            return <TableCell key={y} className="text-right text-sm text-gray-600 font-mono">{total > 0 ? formatMoney(total) : '-'}</TableCell>;
                          })}
                        </TableRow>
                      </>
                    )}

                    <TableRow 
                      className="font-semibold bg-gray-50 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleRow('cfOutflows')}
                    >
                      <TableCell className="sticky left-0 bg-gray-50 flex items-center gap-2">
                        {expandedRows.has('cfOutflows') ? (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                        Cash Outflows
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

                    <TableRow className="bg-primary/10 font-bold">
                      <TableCell className="sticky left-0 bg-primary/10">Net Cash Flow</TableCell>
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
                    <TableRow className="bg-gray-50 font-semibold">
                      <TableCell className="sticky left-0 bg-gray-50">Cumulative Cash</TableCell>
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
          </TabsContent>

          <TabsContent value="balance" className="mt-6">
            {/* Balance Sheet */}
            <div ref={activeTab === 'balance' ? tableRef : undefined} className="bg-white rounded-2xl p-6 shadow-sm border">
              <div>
                <h3 className="text-lg font-display text-gray-900 mb-4">Balance Sheet - {global?.companyName || "L+B Hospitality Co."} (As of {getFiscalYear(9)})</h3>
                {(() => {
                  // Calculate cumulative values through Year 10
                  const cumulativeNetIncome = financials.reduce((a, m) => a + m.netIncome, 0);
                  
                  // SAFE funding totals
                  const safeTranche1 = global.safeTranche1Amount || 0;
                  const safeTranche2 = global.safeTranche2Amount || 0;
                  const totalSafeFunding = safeTranche1 + safeTranche2;
                  
                  // Cash = SAFE funding + cumulative net income (simplified - no distributions assumed)
                  const cashBalance = totalSafeFunding + cumulativeNetIncome;
                  
                  // Total Assets
                  const totalAssets = cashBalance;
                  
                  // Liabilities (SAFE notes are technically liability until conversion)
                  const safeNotesPayable = totalSafeFunding;
                  const totalLiabilities = safeNotesPayable;
                  
                  // Equity
                  const retainedEarnings = cumulativeNetIncome;
                  const totalEquity = retainedEarnings;
                  
                  // Total Liabilities + Equity should equal Total Assets
                  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

                  return (
                    <Table>
                      <TableBody>
                        {/* ASSETS */}
                        <TableRow className="bg-gray-50 font-semibold">
                          <TableCell colSpan={2} className="text-lg font-display">ASSETS</TableCell>
                        </TableRow>
                        
                        <TableRow className="bg-gray-50">
                          <TableCell className="font-medium pl-4">Current Assets</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">Cash & Cash Equivalents</TableCell>
                          <TableCell className="text-right font-mono">{formatMoney(cashBalance)}</TableCell>
                        </TableRow>
                        <TableRow className="font-medium bg-gray-50/50">
                          <TableCell className="pl-4">Total Current Assets</TableCell>
                          <TableCell className="text-right font-mono">{formatMoney(cashBalance)}</TableCell>
                        </TableRow>
                        
                        <TableRow className="font-semibold border-t-2">
                          <TableCell>TOTAL ASSETS</TableCell>
                          <TableCell className="text-right font-mono">{formatMoney(totalAssets)}</TableCell>
                        </TableRow>

                        {/* Spacer */}
                        <TableRow><TableCell colSpan={2} className="h-4"></TableCell></TableRow>

                        {/* LIABILITIES */}
                        <TableRow className="bg-gray-50 font-semibold">
                          <TableCell colSpan={2} className="text-lg font-display">LIABILITIES</TableCell>
                        </TableRow>
                        
                        <TableRow className="bg-gray-50">
                          <TableCell className="font-medium pl-4">Long-Term Liabilities</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">SAFE Notes Payable</TableCell>
                          <TableCell className="text-right font-mono">{formatMoney(safeNotesPayable)}</TableCell>
                        </TableRow>
                        <TableRow className="font-medium bg-gray-50/50">
                          <TableCell className="pl-4">Total Long-Term Liabilities</TableCell>
                          <TableCell className="text-right font-mono">{formatMoney(totalLiabilities)}</TableCell>
                        </TableRow>
                        
                        <TableRow className="font-semibold border-t">
                          <TableCell>TOTAL LIABILITIES</TableCell>
                          <TableCell className="text-right font-mono">{formatMoney(totalLiabilities)}</TableCell>
                        </TableRow>

                        {/* Spacer */}
                        <TableRow><TableCell colSpan={2} className="h-4"></TableCell></TableRow>

                        {/* EQUITY */}
                        <TableRow className="bg-gray-50 font-semibold">
                          <TableCell colSpan={2} className="text-lg font-display">EQUITY</TableCell>
                        </TableRow>
                        
                        <TableRow>
                          <TableCell className="pl-4">Retained Earnings</TableCell>
                          <TableCell className="text-right font-mono">{formatMoney(retainedEarnings)}</TableCell>
                        </TableRow>
                        
                        <TableRow className="font-semibold border-t">
                          <TableCell>TOTAL EQUITY</TableCell>
                          <TableCell className="text-right">{formatMoney(totalEquity)}</TableCell>
                        </TableRow>

                        {/* Spacer */}
                        <TableRow><TableCell colSpan={2} className="h-4"></TableCell></TableRow>

                        {/* TOTAL */}
                        <TableRow className="font-bold border-t-2 bg-primary/10">
                          <TableCell>TOTAL LIABILITIES & EQUITY</TableCell>
                          <TableCell className="text-right">{formatMoney(totalLiabilitiesAndEquity)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  );
                })()}
              </div>
            </div>
          </TabsContent>

          {/* Cash Position Footnote */}
          {!cashAnalysis.isAdequate ? (
            <div className="flex items-start gap-2 text-sm text-gray-600 mt-4" data-testid="banner-company-cash-warning">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p>
                <span data-testid="text-company-cash-warning-title" className="font-medium text-red-600">Additional Funding Required:</span>{' '}
                The current SAFE funding of <span className="font-medium text-gray-900">{formatMoney(cashAnalysis.totalSafeFunding)}</span> is insufficient to cover operating expenses.
                Monthly cash position drops to <span className="font-medium text-red-600">{formatMoney(cashAnalysis.minCashPosition)}</span>
                {cashAnalysis.minCashMonth !== null && <> in month {cashAnalysis.minCashMonth}</>}.
                {' '}Suggested: Increase SAFE funding by at least{' '}
                <span className="font-medium text-gray-900">{formatMoney(cashAnalysis.suggestedAdditionalFunding)}</span> in{' '}
                <Link href="/company/assumptions" className="font-medium text-[#257D41] hover:underline">Company Assumptions</Link>.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-sm text-gray-600 mt-4" data-testid="banner-company-cash-adequate">
              <CheckCircle className="w-4 h-4 text-[#257D41] flex-shrink-0 mt-0.5" />
              <p>
                <span data-testid="text-company-cash-adequate-title" className="font-medium text-[#257D41]">Cash Position Adequate:</span>{' '}
                The SAFE funding of <span className="font-medium text-gray-900">{formatMoney(cashAnalysis.totalSafeFunding)}</span> covers all operating costs.
                {cashAnalysis.minCashMonth !== null && (
                  <> Minimum cash position: <span className="font-medium text-gray-900">{formatMoney(cashAnalysis.minCashPosition)}</span> (month {cashAnalysis.minCashMonth}).</>
                )}
              </p>
            </div>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}
