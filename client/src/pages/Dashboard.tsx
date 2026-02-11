import React from "react";
import Layout from "@/components/Layout";
import { useProperties, useGlobalAssumptions } from "@/lib/api";
import { generatePropertyProForma, formatMoney, getFiscalYearForModelYear } from "@/lib/financialEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, DarkGlassTabs } from "@/components/ui/tabs";
import { LayoutDashboard, FileText, Banknote, Scale, TrendingUp as TrendingUpIcon, Loader2, ChevronRight, ChevronDown, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GlassButton } from "@/components/ui/glass-button";
import { ExportMenu, pdfAction, csvAction, excelAction, pptxAction, pngAction } from "@/components/ui/export-toolbar";
import { downloadCSV } from "@/lib/exports/csvExport";
import { PageHeader } from "@/components/ui/page-header";
import { format } from "date-fns";
import { useState, useMemo, useRef } from "react";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { ConsolidatedBalanceSheet } from "@/components/ConsolidatedBalanceSheet";
import { InvestmentAnalysis } from "@/components/InvestmentAnalysis";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { drawLineChart } from "@/lib/pdfChartDrawer";
import * as XLSX from "xlsx";
import { exportPortfolioPPTX } from "@/lib/exports/pptxExport";
import { exportTablePNG } from "@/lib/exports/pngExport";
import {
  DEFAULT_EXIT_CAP_RATE,
  PROJECTION_YEARS,
  DAYS_PER_MONTH,
} from "@/lib/constants";
import { Dashboard3DBackground } from "@/components/Dashboard3DBackground";
import { propertyEquityInvested, acquisitionYearIndex } from "@/lib/equityCalculations";
import { computeIRR } from "@analytics/returns/irr.js";
import { LoanParams, GlobalLoanParams } from "@/lib/loanCalculations";
import { aggregateCashFlowByYear } from "@/lib/cashFlowAggregator";
import { aggregatePropertyByYear, YearlyPropertyFinancials } from "@/lib/yearlyAggregator";

/** Adapter: wraps standalone IRR solver to return a plain number (annual rate). */
function calculateIRR(cashFlows: number[]): number {
  const result = computeIRR(cashFlows, 1);
  return result.irr_periodic ?? 0;
}

export default function Dashboard() {
  const { data: properties, isLoading: propertiesLoading, isError: propertiesError } = useProperties();
  const { data: global, isLoading: globalLoading, isError: globalError } = useGlobalAssumptions();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("overview");
  const tabContentRef = useRef<HTMLDivElement>(null);

  const toggleRow = (rowId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const projectionYears = global?.projectionYears ?? PROJECTION_YEARS;
  const projectionMonths = projectionYears * 12;

  const allPropertyFinancials = useMemo(() => {
    if (!properties || !global) return [];
    return properties.map(p => {
      const financials = generatePropertyProForma(p, global, projectionMonths);
      return { property: p, financials };
    });
  }, [properties, global, projectionMonths]);

  // Pre-compute per-property yearly cash flow results via shared aggregator.
  // Single source of truth for ATCF, exit value, refi proceeds, debt service, and IRR vectors.
  const allPropertyYearlyCF = useMemo(() => {
    if (!properties || !global || allPropertyFinancials.length === 0) return [];
    return allPropertyFinancials.map(({ property: prop, financials }) =>
      aggregateCashFlowByYear(financials, prop as unknown as LoanParams, global as unknown as GlobalLoanParams, projectionYears)
    );
  }, [allPropertyFinancials, properties, global, projectionYears]);

  // Per-property yearly IS/expense aggregation (shared utility)
  const allPropertyYearlyIS = useMemo(() =>
    allPropertyFinancials.map(({ financials }) =>
      aggregatePropertyByYear(financials, projectionYears)
    ),
    [allPropertyFinancials, projectionYears]
  );

  // Portfolio-level consolidated yearly totals
  const yearlyConsolidatedCache = useMemo(() => {
    if (!allPropertyYearlyIS.length) return [] as YearlyPropertyFinancials[];
    const numericKeys = Object.keys(allPropertyYearlyIS[0]?.[0] ?? {}).filter(
      k => k !== 'year'
    ) as (keyof YearlyPropertyFinancials)[];
    return Array.from({ length: projectionYears }, (_, y) => {
      const base: YearlyPropertyFinancials = { ...allPropertyYearlyIS[0][y] };
      for (const key of numericKeys) (base as any)[key] = 0;
      base.year = y;
      for (const propYearly of allPropertyYearlyIS) {
        const py = propYearly[y];
        if (!py) continue;
        for (const key of numericKeys) (base as any)[key] += (py as any)[key];
      }
      return base;
    });
  }, [allPropertyYearlyIS, projectionYears]);

  const { totalProjectionRevenue, totalProjectionNOI, totalProjectionCashFlow } = useMemo(() => {
    if (!yearlyConsolidatedCache.length) return { totalProjectionRevenue: 0, totalProjectionNOI: 0, totalProjectionCashFlow: 0 };
    let rev = 0, noi = 0, cf = 0;
    for (let y = 0; y < projectionYears; y++) {
      const yearData = yearlyConsolidatedCache[y];
      rev += yearData.revenueTotal;
      noi += yearData.noi;
      cf += yearData.cashFlow;
    }
    return { totalProjectionRevenue: rev, totalProjectionNOI: noi, totalProjectionCashFlow: cf };
  }, [yearlyConsolidatedCache, projectionYears]);

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
          <p className="text-muted-foreground">Failed to load dashboard data. Please try refreshing the page.</p>
        </div>
      </Layout>
    );
  }

  if (!properties || !global) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">No data available. Please check the database.</p>
        </div>
      </Layout>
    );
  }

  const fiscalYearStartMonth = global.fiscalYearStartMonth ?? 1;
  const getFiscalYear = (yearIndex: number) => getFiscalYearForModelYear(global.modelStartDate, fiscalYearStartMonth, yearIndex);

  const getYearlyConsolidated = (yearIndex: number) => yearlyConsolidatedCache[yearIndex];

  const getPropertyYearly = (propIndex: number, yearIndex: number) =>
    allPropertyYearlyIS[propIndex]?.[yearIndex];

  // Calculate weighted average ADR, Occupancy, and RevPAR for all years (memoized)
  // ADR weighted by rooms sold, Occupancy weighted by available rooms, RevPAR = Room Revenue / Available Rooms
  const weightedMetricsByYear = useMemo(() => {
    return Array.from({ length: projectionYears }, (_, yearIndex) => {
      const startMonth = yearIndex * 12;
      const endMonth = startMonth + 12;

      let totalAvailableRoomNights = 0;
      let totalRoomsSold = 0;
      let totalRoomRevenue = 0;

      properties.forEach((prop, idx) => {
        const { financials } = allPropertyFinancials[idx];
        const yearData = financials.slice(startMonth, endMonth);
        const roomCount = prop.roomCount;

        yearData.forEach(month => {
          const daysInMonth = DAYS_PER_MONTH;
          const availableRooms = roomCount * daysInMonth;
          const roomsSold = availableRooms * month.occupancy;

          totalAvailableRoomNights += availableRooms;
          totalRoomsSold += roomsSold;
          totalRoomRevenue += month.revenueRooms;
        });
      });

      const weightedADR = totalRoomsSold > 0 ? totalRoomRevenue / totalRoomsSold : 0;
      const weightedOcc = totalAvailableRoomNights > 0 ? totalRoomsSold / totalAvailableRoomNights : 0;
      const revPAR = totalAvailableRoomNights > 0 ? totalRoomRevenue / totalAvailableRoomNights : 0;

      return { weightedADR, weightedOcc, revPAR, totalAvailableRoomNights };
    });
  }, [properties, allPropertyFinancials, projectionYears]);

  const getWeightedMetrics = (yearIndex: number) => weightedMetricsByYear[yearIndex];

  const year1Data = getYearlyConsolidated(0);
  const portfolioTotalRevenue = year1Data.revenueTotal;
  const portfolioTotalGOP = year1Data.gop;
  const activeProperties = properties.filter(p => p.status === "Operational" || p.status === "Development").length;
  const managementFees = year1Data.feeBase + year1Data.feeIncentive;

  // Calculate comprehensive investment overview metrics
  const totalProperties = properties.length;
  const totalRooms = properties.reduce((sum, p) => sum + p.roomCount, 0);
  const totalPurchasePrice = properties.reduce((sum, p) => sum + p.purchasePrice, 0);
  const totalBuildingImprovements = properties.reduce((sum, p) => sum + p.buildingImprovements, 0);
  const totalPreOpeningCosts = properties.reduce((sum, p) => sum + (p.preOpeningCosts ?? 0), 0);
  const totalOperatingReserve = properties.reduce((sum, p) => sum + (p.operatingReserve ?? 0), 0);
  const totalInvestment = totalPurchasePrice + totalBuildingImprovements + totalPreOpeningCosts + totalOperatingReserve;
  const avgPurchasePrice = totalPurchasePrice / totalProperties;
  const avgRoomsPerProperty = totalRooms / totalProperties;
  const avgADR = totalRooms > 0 
    ? properties.reduce((sum, p) => sum + p.startAdr * p.roomCount, 0) / totalRooms
    : 0;
  
  // Calculate weighted average exit cap rate (for display purposes)
  const avgExitCapRate = properties.reduce((sum, p) => sum + (p.exitCapRate ?? DEFAULT_EXIT_CAP_RATE), 0) / totalProperties;
  
  // Final year NOI for reference
  const year10Data = getYearlyConsolidated(projectionYears - 1);
  const year10NOI = year10Data.noi;
  
  // Geographic distribution
  const marketCounts = properties.reduce((acc, p) => {
    acc[p.market] = (acc[p.market] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Investment horizon
  const investmentHorizon = projectionYears;

  const getPropertyAcquisitionYear = (prop: any): number =>
    acquisitionYearIndex(prop.acquisitionDate, prop.operationsStartDate, global.modelStartDate);

  const getPropertyInvestment = (prop: any): number =>
    propertyEquityInvested(prop, global.debtAssumptions?.acqLTV);

  const getEquityInvestmentForYear = (yearIndex: number): number =>
    properties.reduce((sum, prop) => sum + (getPropertyAcquisitionYear(prop) === yearIndex ? getPropertyInvestment(prop) : 0), 0);

  // Aggregator-based helpers: read from precomputed allPropertyYearlyCF
  const getPropertyExitValue = (propIndex: number): number => {
    const yearly = allPropertyYearlyCF[propIndex];
    return yearly?.[projectionYears - 1]?.exitValue ?? 0;
  };

  const projectedExitValue = allPropertyYearlyCF.reduce(
    (sum, yearly) => sum + (yearly[projectionYears - 1]?.exitValue ?? 0), 0
  );

  const getPropertyCashFlows = (propIndex: number): number[] => {
    const yearly = allPropertyYearlyCF[propIndex];
    if (!yearly) return [];
    return yearly.map(r => r.netCashFlowToInvestors);
  };

  const consolidatedFlows = Array.from({ length: projectionYears }, (_, y) =>
    allPropertyYearlyCF.reduce((sum, propYearly) => sum + (propYearly[y]?.netCashFlowToInvestors ?? 0), 0)
  );
  const portfolioIRR = calculateIRR(consolidatedFlows);
  const totalInitialEquity = properties.reduce((sum, prop) => sum + getPropertyInvestment(prop), 0);
  const totalExitValue = allPropertyYearlyCF.reduce(
    (sum, yearly) => sum + (yearly[projectionYears - 1]?.exitValue ?? 0), 0
  );
  const totalCashReturned = consolidatedFlows.reduce((sum, cf) => sum + cf, 0);
  const midProjectionEquity = Array.from({ length: projectionYears }, (_, y) => getEquityInvestmentForYear(y + 1))
    .reduce((sum, eq) => sum + eq, 0);
  const equityMultiple = totalInitialEquity > 0 ? (totalCashReturned + midProjectionEquity) / totalInitialEquity : 0;

  const operatingCashFlows = Array.from({ length: projectionYears }, (_, y) =>
    allPropertyYearlyCF.reduce((sum, propYearly) => sum + (propYearly[y]?.atcf ?? 0), 0)
  );
  const avgAnnualCashFlow = operatingCashFlows.reduce((sum, cf) => sum + cf, 0) / projectionYears;
  const cashOnCash = totalInitialEquity > 0 ? (avgAnnualCashFlow / totalInitialEquity) * 100 : 0;

  const generateIncomeStatementData = () => {
    const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));
    const rows: { category: string; values: number[]; isHeader?: boolean; indent?: number }[] = [];
    
    rows.push({ category: "Total Revenue", values: years.map((_, i) => getYearlyConsolidated(i).revenueTotal), isHeader: true });
    rows.push({ category: "Room Revenue", values: years.map((_, i) => getYearlyConsolidated(i).revenueRooms), indent: 1 });
    rows.push({ category: "Event Revenue", values: years.map((_, i) => getYearlyConsolidated(i).revenueEvents), indent: 1 });
    rows.push({ category: "F&B Revenue", values: years.map((_, i) => getYearlyConsolidated(i).revenueFB), indent: 1 });
    rows.push({ category: "Other Revenue", values: years.map((_, i) => getYearlyConsolidated(i).revenueOther), indent: 1 });
    
    properties.forEach((prop, idx) => {
      rows.push({ 
        category: `  ${prop.name}`, 
        values: years.map((_, i) => getPropertyYearly(idx, i).revenueTotal), 
        indent: 2 
      });
    });
    
    rows.push({ 
      category: "Operating Expenses", 
      values: years.map((_, i) => {
        const data = getYearlyConsolidated(i);
        return data.expenseRooms + data.expenseFB + data.expenseEvents + data.expenseOther + 
          data.expenseMarketing + data.expensePropertyOps + data.expenseUtilitiesVar + 
          data.expenseAdmin + data.expenseIT + data.expenseInsurance + data.expenseTaxes + 
          data.expenseUtilitiesFixed + data.expenseOtherCosts;
      }), 
      isHeader: true 
    });
    rows.push({ category: "Room Expense", values: years.map((_, i) => getYearlyConsolidated(i).expenseRooms), indent: 1 });
    rows.push({ category: "F&B Expense", values: years.map((_, i) => getYearlyConsolidated(i).expenseFB), indent: 1 });
    rows.push({ category: "Event Expense", values: years.map((_, i) => getYearlyConsolidated(i).expenseEvents), indent: 1 });
    rows.push({ category: "Marketing", values: years.map((_, i) => getYearlyConsolidated(i).expenseMarketing), indent: 1 });
    rows.push({ category: "Property Ops", values: years.map((_, i) => getYearlyConsolidated(i).expensePropertyOps), indent: 1 });
    rows.push({ category: "Admin & General", values: years.map((_, i) => getYearlyConsolidated(i).expenseAdmin), indent: 1 });
    rows.push({ category: "IT", values: years.map((_, i) => getYearlyConsolidated(i).expenseIT), indent: 1 });
    rows.push({ category: "Insurance", values: years.map((_, i) => getYearlyConsolidated(i).expenseInsurance), indent: 1 });
    rows.push({ category: "Taxes", values: years.map((_, i) => getYearlyConsolidated(i).expenseTaxes), indent: 1 });
    rows.push({ category: "Utilities", values: years.map((_, i) => getYearlyConsolidated(i).expenseUtilitiesVar + getYearlyConsolidated(i).expenseUtilitiesFixed), indent: 1 });
    rows.push({ category: "FF&E Reserve", values: years.map((_, i) => getYearlyConsolidated(i).expenseFFE), indent: 1 });
    rows.push({ category: "Other Expenses", values: years.map((_, i) => getYearlyConsolidated(i).expenseOther + getYearlyConsolidated(i).expenseOtherCosts), indent: 1 });
    
    rows.push({ category: "Gross Operating Profit", values: years.map((_, i) => getYearlyConsolidated(i).gop), isHeader: true });
    
    properties.forEach((prop, idx) => {
      rows.push({ 
        category: prop.name, 
        values: years.map((_, i) => getPropertyYearly(idx, i).gop), 
        indent: 1 
      });
    });
    
    rows.push({ category: "Management Fees", values: years.map((_, i) => getYearlyConsolidated(i).feeBase + getYearlyConsolidated(i).feeIncentive), isHeader: true });
    rows.push({ category: "Base Fee", values: years.map((_, i) => getYearlyConsolidated(i).feeBase), indent: 1 });
    rows.push({ category: "Incentive Fee", values: years.map((_, i) => getYearlyConsolidated(i).feeIncentive), indent: 1 });
    
    rows.push({ category: "Net Operating Income", values: years.map((_, i) => getYearlyConsolidated(i).noi), isHeader: true });
    
    properties.forEach((prop, idx) => {
      rows.push({ 
        category: prop.name, 
        values: years.map((_, i) => getPropertyYearly(idx, i).noi), 
        indent: 1 
      });
    });
    
    return { years, rows };
  };

  const exportIncomeStatementToPDF = () => {
    const { years, rows } = generateIncomeStatementData();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    doc.setFontSize(18);
    doc.text("Hospitality Business Group - Portfolio Income Statement", 14, 15);
    doc.setFontSize(10);
    doc.text(`${projectionYears}-Year Projection (${years[0]} - ${years[projectionYears - 1]})`, 14, 22);
    doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy')}`, 14, 27);
    
    const tableData = rows.map(row => [
      (row.indent ? '  '.repeat(row.indent) : '') + row.category,
      ...row.values.map(v => formatMoney(v))
    ]);
    
    autoTable(doc, {
      head: [['Category', ...years.map(String)]],
      body: tableData,
      startY: 32,
      styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
      headStyles: { fillColor: [159, 188, 164], textColor: [0, 0, 0], fontStyle: 'bold', font: 'helvetica' },
      columnStyles: { 0: { cellWidth: 45, font: 'helvetica' } },
      didParseCell: (data) => {
        // Use courier (monospace) for numeric columns
        if (data.column.index > 0) {
          data.cell.styles.font = 'courier';
        }
        if (data.section === 'body' && data.row.index !== undefined) {
          const row = rows[data.row.index];
          if (row?.isHeader) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        }
      }
    });
    
    // Add chart on separate page at the end
    doc.addPage();
    doc.setFontSize(16);
    doc.text("Revenue & NOI Performance Chart", 14, 15);
    doc.setFontSize(10);
    doc.text(`${projectionYears}-Year Revenue, Operating Expenses, and Net Operating Income Trend`, 14, 22);
    
    const chartData = years.map((year, i) => {
      const yearly = getYearlyConsolidated(i);
      return { label: String(year), value: yearly.revenueTotal };
    });
    
    const noiData = years.map((year, i) => {
      const yearly = getYearlyConsolidated(i);
      return { label: String(year), value: yearly.noi };
    });
    
    const expenseData = years.map((year, i) => {
      const yearly = getYearlyConsolidated(i);
      return { label: String(year), value: yearly.totalExpenses };
    });
    
    drawLineChart({
      doc,
      x: 14,
      y: 30,
      width: 269,
      height: 150,
      title: `Portfolio Revenue, Operating Expenses & NOI (${projectionYears}-Year Projection)`,
      series: [
        { name: "Revenue", data: chartData, color: "#7C3AED" },
        { name: "Operating Expenses", data: expenseData, color: "#2563EB" },
        { name: "NOI", data: noiData, color: "#257D41" }
      ]
    });
    
    doc.save('income-statement.pdf');
  };

  const exportIncomeStatementToCSV = () => {
    const { years, rows } = generateIncomeStatementData();
    
    const headers = ['Category', ...years.map(String)];
    const csvRows = [
      headers.join(','),
      ...rows.map(row => [
        `"${(row.indent ? '  '.repeat(row.indent) : '') + row.category}"`,
        ...row.values.map(v => v.toFixed(2))
      ].join(','))
    ];
    
    downloadCSV(csvRows.join('\n'), 'income-statement.csv');
  };

  const generateCashFlowData = () => {
    const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));
    const rows: { category: string; values: number[]; isHeader?: boolean; indent?: number; isNegative?: boolean }[] = [];
    
    rows.push({ category: "CASH INFLOWS (Revenue)", values: years.map((_, i) => getYearlyConsolidated(i).revenueTotal), isHeader: true });
    rows.push({ category: "Room Revenue", values: years.map((_, i) => getYearlyConsolidated(i).revenueRooms), indent: 1 });
    rows.push({ category: "Event Revenue", values: years.map((_, i) => getYearlyConsolidated(i).revenueEvents), indent: 1 });
    rows.push({ category: "F&B Revenue", values: years.map((_, i) => getYearlyConsolidated(i).revenueFB), indent: 1 });
    rows.push({ category: "Other Revenue", values: years.map((_, i) => getYearlyConsolidated(i).revenueOther), indent: 1 });
    
    properties.forEach((prop, idx) => {
      rows.push({ 
        category: prop.name, 
        values: years.map((_, i) => getPropertyYearly(idx, i).revenueTotal), 
        indent: 2 
      });
    });
    
    rows.push({ 
      category: "CASH OUTFLOWS (Operating)", 
      values: years.map((_, i) => {
        const data = getYearlyConsolidated(i);
        return -(data.expenseRooms + data.expenseFB + data.expenseEvents + data.expenseOther + 
          data.expenseMarketing + data.expensePropertyOps + data.expenseUtilitiesVar + 
          data.expenseAdmin + data.expenseIT + data.expenseInsurance + data.expenseTaxes + 
          data.expenseUtilitiesFixed + data.expenseOtherCosts);
      }), 
      isHeader: true,
      isNegative: true
    });
    
    rows.push({ category: "Direct Costs", values: years.map((_, i) => {
      const d = getYearlyConsolidated(i);
      return -(d.expenseRooms + d.expenseFB + d.expenseEvents + d.expenseOther);
    }), indent: 1, isNegative: true });
    rows.push({ category: "Room Expense", values: years.map((_, i) => -getYearlyConsolidated(i).expenseRooms), indent: 2, isNegative: true });
    rows.push({ category: "F&B Expense", values: years.map((_, i) => -getYearlyConsolidated(i).expenseFB), indent: 2, isNegative: true });
    rows.push({ category: "Event Expense", values: years.map((_, i) => -getYearlyConsolidated(i).expenseEvents), indent: 2, isNegative: true });
    rows.push({ category: "Other Direct", values: years.map((_, i) => -getYearlyConsolidated(i).expenseOther), indent: 2, isNegative: true });
    
    rows.push({ category: "Overhead & Admin", values: years.map((_, i) => {
      const d = getYearlyConsolidated(i);
      return -(d.expenseAdmin + d.expenseMarketing + d.expensePropertyOps + d.expenseUtilitiesVar + 
        d.expenseUtilitiesFixed + d.expenseIT + d.expenseInsurance + d.expenseTaxes + d.expenseOtherCosts);
    }), indent: 1, isNegative: true });
    rows.push({ category: "Admin & General", values: years.map((_, i) => -getYearlyConsolidated(i).expenseAdmin), indent: 2, isNegative: true });
    rows.push({ category: "Marketing", values: years.map((_, i) => -getYearlyConsolidated(i).expenseMarketing), indent: 2, isNegative: true });
    rows.push({ category: "Property Operations", values: years.map((_, i) => -getYearlyConsolidated(i).expensePropertyOps), indent: 2, isNegative: true });
    rows.push({ category: "Utilities", values: years.map((_, i) => -(getYearlyConsolidated(i).expenseUtilitiesVar + getYearlyConsolidated(i).expenseUtilitiesFixed)), indent: 2, isNegative: true });
    rows.push({ category: "IT Systems", values: years.map((_, i) => -getYearlyConsolidated(i).expenseIT), indent: 2, isNegative: true });
    rows.push({ category: "Insurance", values: years.map((_, i) => -getYearlyConsolidated(i).expenseInsurance), indent: 2, isNegative: true });
    rows.push({ category: "Property Taxes", values: years.map((_, i) => -getYearlyConsolidated(i).expenseTaxes), indent: 2, isNegative: true });
    rows.push({ category: "Other Expenses", values: years.map((_, i) => -getYearlyConsolidated(i).expenseOtherCosts), indent: 2, isNegative: true });
    
    rows.push({ category: "GROSS OPERATING PROFIT (GOP)", values: years.map((_, i) => getYearlyConsolidated(i).gop), isHeader: true });
    
    rows.push({ category: "Management Fees (to Hospitality Business Co.)", values: years.map((_, i) => -(getYearlyConsolidated(i).feeBase + getYearlyConsolidated(i).feeIncentive)), isNegative: true });
    rows.push({ category: "Base Fee (% of Revenue, per property)", values: years.map((_, i) => -getYearlyConsolidated(i).feeBase), indent: 1, isNegative: true });
    rows.push({ category: "Incentive Fee (% of GOP, per property)", values: years.map((_, i) => -getYearlyConsolidated(i).feeIncentive), indent: 1, isNegative: true });
    
    rows.push({ category: "FF&E Reserve", values: years.map((_, i) => -getYearlyConsolidated(i).expenseFFE), isNegative: true });
    
    rows.push({ category: "NET OPERATING INCOME (NOI)", values: years.map((_, i) => getYearlyConsolidated(i).noi), isHeader: true });
    
    rows.push({ category: "Debt Service", values: years.map((_, i) => -getYearlyConsolidated(i).debtPayment), isNegative: true });
    properties.filter(p => p.type === 'Financed').forEach((prop) => {
      const propIdx = properties.findIndex(p => p.id === prop.id);
      rows.push({ 
        category: prop.name, 
        values: years.map((_, i) => -getPropertyYearly(propIdx, i).debtPayment), 
        indent: 1,
        isNegative: true
      });
    });
    
    rows.push({ category: "NET CASH FLOW", values: years.map((_, i) => getYearlyConsolidated(i).cashFlow), isHeader: true });
    
    const graphData = {
      revenuePerformance: years.map((_, i) => ({
        year: years[i],
        revenue: getYearlyConsolidated(i).revenueTotal,
        opCosts: getYearlyConsolidated(i).totalExpenses,
        noi: getYearlyConsolidated(i).noi
      })),
      cashFlowAfterFinancing: years.map((_, i) => ({
        year: years[i],
        noi: getYearlyConsolidated(i).noi,
        debtService: getYearlyConsolidated(i).debtPayment,
        netCashFlow: getYearlyConsolidated(i).cashFlow
      }))
    };
    
    return { years, rows, graphData };
  };

  const exportCashFlowToPDF = () => {
    const { years, rows, graphData } = generateCashFlowData();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    doc.setFontSize(18);
    doc.text("Hospitality Business Group - Cash Flow Statement", 14, 15);
    doc.setFontSize(10);
    doc.text(`${projectionYears}-Year Projection (${years[0]} - ${years[projectionYears - 1]})`, 14, 22);
    doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy')}`, 14, 27);
    
    const tableData = rows.map(row => [
      (row.indent ? '  '.repeat(row.indent) : '') + row.category,
      ...row.values.map(v => {
        if (row.isNegative && v < 0) return `(${formatMoney(Math.abs(v))})`;
        return formatMoney(v);
      })
    ]);
    
    autoTable(doc, {
      head: [['Category', ...years.map(String)]],
      body: tableData,
      startY: 32,
      styles: { fontSize: 7, cellPadding: 1.5, font: 'helvetica' },
      headStyles: { fillColor: [159, 188, 164], textColor: [0, 0, 0], fontStyle: 'bold', font: 'helvetica' },
      columnStyles: { 0: { cellWidth: 50, font: 'helvetica' } },
      didParseCell: (data) => {
        // Use courier (monospace) for numeric columns
        if (data.column.index > 0) {
          data.cell.styles.font = 'courier';
        }
        if (data.section === 'body' && data.row.index !== undefined) {
          const row = rows[data.row.index];
          if (row?.isHeader) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        }
      }
    });
    
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Revenue & Operating Performance", 14, 15);
    
    autoTable(doc, {
      head: [['Year', 'Revenue', 'Operating Costs', 'NOI']],
      body: graphData.revenuePerformance.map(d => [
        String(d.year),
        formatMoney(d.revenue),
        formatMoney(d.opCosts),
        formatMoney(d.noi)
      ]),
      startY: 20,
      styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' },
      headStyles: { fillColor: [92, 107, 192], textColor: [255, 255, 255], fontStyle: 'bold', font: 'helvetica' },
      didParseCell: (data) => {
        // Use courier (monospace) for numeric columns
        if (data.column.index > 0) {
          data.cell.styles.font = 'courier';
        }
      }
    });
    
    const graphTableY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("Cash Flow After Financing", 14, graphTableY);
    
    autoTable(doc, {
      head: [['Year', 'NOI', 'Debt Service', 'Net Cash Flow']],
      body: graphData.cashFlowAfterFinancing.map(d => [
        String(d.year),
        formatMoney(d.noi),
        d.debtService > 0 ? `(${formatMoney(d.debtService)})` : '-',
        formatMoney(d.netCashFlow)
      ]),
      startY: graphTableY + 5,
      styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' },
      headStyles: { fillColor: [37, 125, 65], textColor: [255, 255, 255], fontStyle: 'bold', font: 'helvetica' },
      didParseCell: (data) => {
        // Use courier (monospace) for numeric columns
        if (data.column.index > 0) {
          data.cell.styles.font = 'courier';
        }
      }
    });
    
    // Add cash flow chart on separate page at the end
    doc.addPage();
    doc.setFontSize(16);
    doc.text("Cash Flow Performance Chart", 14, 15);
    doc.setFontSize(10);
    doc.text(`${projectionYears}-Year NOI and Net Cash Flow After Financing`, 14, 22);
    
    const noiChartData = graphData.cashFlowAfterFinancing.map(d => ({
      label: String(d.year),
      value: d.noi
    }));
    
    const netCashChartData = graphData.cashFlowAfterFinancing.map(d => ({
      label: String(d.year),
      value: d.netCashFlow
    }));
    
    drawLineChart({
      doc,
      x: 14,
      y: 30,
      width: 269,
      height: 150,
      title: `NOI vs Net Cash Flow (${projectionYears}-Year Projection)`,
      series: [
        { name: "NOI", data: noiChartData, color: "#257D41" },
        { name: "Net Cash Flow", data: netCashChartData, color: "#3B82F6" }
      ]
    });
    
    doc.save('cash-flow-statement.pdf');
  };

  const exportCashFlowToCSV = () => {
    const { years, rows, graphData } = generateCashFlowData();
    const headers = ['Category', ...years.map(String)];
    const csvRows = [
      headers.join(','),
      ...rows.map(row => [
        `"${(row.indent ? '  '.repeat(row.indent) : '') + row.category}"`,
        ...row.values.map(v => v.toFixed(2))
      ].join(',')),
      '',
      '',
      'REVENUE & OPERATING PERFORMANCE',
      ['Year', 'Revenue', 'Operating Costs', 'NOI'].join(','),
      ...graphData.revenuePerformance.map(d => [d.year, d.revenue.toFixed(2), d.opCosts.toFixed(2), d.noi.toFixed(2)].join(',')),
      '',
      'CASH FLOW AFTER FINANCING',
      ['Year', 'NOI', 'Debt Service', 'Net Cash Flow'].join(','),
      ...graphData.cashFlowAfterFinancing.map(d => [d.year, d.noi.toFixed(2), d.debtService.toFixed(2), d.netCashFlow.toFixed(2)].join(','))
    ];
    downloadCSV(csvRows.join('\n'), 'cash-flow-statement.csv');
  };

  const generateBalanceSheetData = () => {
    const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));
    const rows: { category: string; values: number[]; isHeader?: boolean; indent?: number; isNegative?: boolean }[] = [];
    
    const totalPropertyValue = properties.reduce((sum, p) => sum + p.purchasePrice + p.buildingImprovements, 0);
    const totalOperatingReserves = properties.reduce((sum, p) => sum + (p.operatingReserve ?? 0), 0);
    
    // Engine-based balance sheet: uses only monthly pro forma data (single engine path)
    const getYearlyBalanceSheet = (yearIndex: number) => {
      const monthsToInclude = (yearIndex + 1) * 12;

      let totalDebtOutstanding = 0;
      let totalInitialEquity = 0;
      let totalRetainedEarnings = 0;
      let totalCumulativeCashFlow = 0;
      let totalAccumDepreciation = 0;
      let totalRefiProceeds = 0;
      let totalDeferredFinancingCosts = 0;

      properties.forEach((prop, idx) => {
        const proForma = allPropertyFinancials[idx]?.financials || [];
        const relevantMonths = proForma.slice(0, monthsToInclude);

        const lastMonthIdx = monthsToInclude - 1;
        const debtOutstanding = lastMonthIdx >= 0 && lastMonthIdx < proForma.length
          ? proForma[lastMonthIdx].debtOutstanding : 0;
        totalDebtOutstanding += debtOutstanding;

        const equityInvested = propertyEquityInvested(prop, (global.debtAssumptions as any)?.acqLTV);
        totalInitialEquity += equityInvested;

        const cumulativeDepreciation = relevantMonths.reduce((sum, m) => sum + m.depreciationExpense, 0);
        totalAccumDepreciation += cumulativeDepreciation;

        const netIncome = relevantMonths.reduce((sum: number, m: any) => sum + m.netIncome, 0);
        totalRetainedEarnings += netIncome;

        let cumulativeInterest = 0;
        let cumulativePrincipal = 0;
        let refiProceeds = 0;
        let deferredFinancingCosts = 0;

        for (let m = 0; m < relevantMonths.length; m++) {
          cumulativeInterest += relevantMonths[m].interestExpense;
          cumulativePrincipal += relevantMonths[m].principalPayment;
          refiProceeds += relevantMonths[m].refinancingProceeds;

          if (relevantMonths[m].refinancingProceeds > 0) {
            const debtBefore = m > 0 ? proForma[m - 1].debtOutstanding : (proForma[0]?.debtOutstanding ?? 0);
            const debtAfter = proForma[m].debtOutstanding;
            const principalInRefiMonth = relevantMonths[m].principalPayment;
            const newLoanAmount = debtAfter + principalInRefiMonth;
            const refiClosingCosts = newLoanAmount - debtBefore - relevantMonths[m].refinancingProceeds;
            if (refiClosingCosts > 0) {
              deferredFinancingCosts += refiClosingCosts;
            }
          }
        }

        const cumulativeNOI = relevantMonths.reduce((sum, m) => sum + m.noi, 0);
        const incomeTax = relevantMonths.reduce((sum: number, m: any) => sum + m.incomeTax, 0);
        const cashFromOperations = cumulativeNOI - (cumulativeInterest + cumulativePrincipal) - incomeTax;
        totalCumulativeCashFlow += cashFromOperations;
        totalRefiProceeds += refiProceeds;
        totalDeferredFinancingCosts += deferredFinancingCosts;
      });
      
      const accumulatedDepreciation = totalAccumDepreciation;
      const totalCash = totalOperatingReserves + totalCumulativeCashFlow + totalRefiProceeds;
      const netPropertyValue = totalPropertyValue - accumulatedDepreciation;
      const totalAssets = netPropertyValue + totalCash;
      const totalLiabilities = totalDebtOutstanding;
      const totalEquity = totalInitialEquity + totalRetainedEarnings;
      
      return {
        cash: totalCash,
        totalCurrentAssets: totalCash,
        propertyValue: totalPropertyValue,
        accumulatedDepreciation: -accumulatedDepreciation,
        netFixedAssets: netPropertyValue,
        totalAssets,
        mortgageNotesPayable: totalDebtOutstanding,
        totalLiabilities,
        paidInCapital: totalInitialEquity,
        retainedEarnings: totalRetainedEarnings,
        totalEquity
      };
    };
    
    rows.push({ category: "ASSETS", values: years.map(() => 0), isHeader: true });
    rows.push({ category: "Current Assets", values: years.map(() => 0), indent: 1, isHeader: true });
    rows.push({ category: "Cash & Cash Equivalents", values: years.map((_, i) => getYearlyBalanceSheet(i).cash), indent: 2 });
    rows.push({ category: "Total Current Assets", values: years.map((_, i) => getYearlyBalanceSheet(i).totalCurrentAssets), indent: 1, isHeader: true });
    rows.push({ category: "Fixed Assets", values: years.map(() => 0), indent: 1, isHeader: true });
    rows.push({ category: "Property, Plant & Equipment", values: years.map((_, i) => getYearlyBalanceSheet(i).propertyValue), indent: 2 });
    rows.push({ category: "Less: Accumulated Depreciation", values: years.map((_, i) => getYearlyBalanceSheet(i).accumulatedDepreciation), indent: 2, isNegative: true });
    rows.push({ category: "Net Fixed Assets", values: years.map((_, i) => getYearlyBalanceSheet(i).netFixedAssets), indent: 1, isHeader: true });
    rows.push({ category: "TOTAL ASSETS", values: years.map((_, i) => getYearlyBalanceSheet(i).totalAssets), isHeader: true });
    
    rows.push({ category: "", values: years.map(() => 0) });
    rows.push({ category: "LIABILITIES", values: years.map(() => 0), isHeader: true });
    rows.push({ category: "Long-Term Liabilities", values: years.map(() => 0), indent: 1, isHeader: true });
    rows.push({ category: "Mortgage Notes Payable", values: years.map((_, i) => getYearlyBalanceSheet(i).mortgageNotesPayable), indent: 2 });
    rows.push({ category: "TOTAL LIABILITIES", values: years.map((_, i) => getYearlyBalanceSheet(i).totalLiabilities), isHeader: true });
    
    rows.push({ category: "", values: years.map(() => 0) });
    rows.push({ category: "EQUITY", values: years.map(() => 0), isHeader: true });
    rows.push({ category: "Paid-In Capital", values: years.map((_, i) => getYearlyBalanceSheet(i).paidInCapital), indent: 1 });
    rows.push({ category: "Retained Earnings", values: years.map((_, i) => getYearlyBalanceSheet(i).retainedEarnings), indent: 1 });
    rows.push({ category: "TOTAL EQUITY", values: years.map((_, i) => getYearlyBalanceSheet(i).totalEquity), isHeader: true });
    
    rows.push({ category: "", values: years.map(() => 0) });
    rows.push({ category: "TOTAL LIABILITIES & EQUITY", values: years.map((_, i) => {
      const bs = getYearlyBalanceSheet(i);
      return bs.totalLiabilities + bs.totalEquity;
    }), isHeader: true });
    
    return { years, rows };
  };

  const exportBalanceSheetToPDF = () => {
    const { years, rows } = generateBalanceSheetData();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    doc.setFontSize(18);
    doc.text("Hospitality Business Group - Consolidated Balance Sheet", 14, 15);
    doc.setFontSize(10);
    doc.text(`${projectionYears}-Year Projection (${years[0]} - ${years[projectionYears - 1]})`, 14, 22);
    doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy')}`, 14, 27);
    
    const tableData = rows.map(row => [
      (row.indent ? '  '.repeat(row.indent) : '') + row.category,
      ...row.values.map(v => {
        if (row.category === '' || (v === 0 && row.isHeader && !row.category.includes('TOTAL'))) return '';
        if (row.isNegative && v < 0) return `(${formatMoney(Math.abs(v))})`;
        return formatMoney(v);
      })
    ]);
    
    autoTable(doc, {
      head: [['Category', ...years.map(String)]],
      body: tableData,
      startY: 32,
      styles: { fontSize: 7, cellPadding: 1.5, font: 'helvetica' },
      headStyles: { fillColor: [159, 188, 164], textColor: [0, 0, 0], fontStyle: 'bold', font: 'helvetica' },
      columnStyles: { 0: { cellWidth: 55, font: 'helvetica' } },
      didParseCell: (data) => {
        // Use courier (monospace) for numeric columns
        if (data.column.index > 0) {
          data.cell.styles.font = 'courier';
        }
        if (data.section === 'body' && data.row.index !== undefined) {
          const row = rows[data.row.index];
          if (row?.isHeader) {
            data.cell.styles.fontStyle = 'bold';
            if (row.category.includes('TOTAL') || row.category === 'ASSETS' || row.category === 'LIABILITIES' || row.category === 'EQUITY') {
              data.cell.styles.fillColor = [240, 240, 240];
            }
          }
        }
      }
    });
    
    // Add balance sheet chart on separate page at the end
    doc.addPage();
    doc.setFontSize(16);
    doc.text("Balance Sheet Trend Chart", 14, 15);
    doc.setFontSize(10);
    doc.text(`${projectionYears}-Year Assets, Liabilities, and Equity Growth`, 14, 22);
    
    const assetsData = years.map((year, i) => {
      const row = rows.find(r => r.category === 'TOTAL ASSETS');
      return { label: String(year), value: row?.values[i] ?? 0 };
    });
    
    const liabilitiesData = years.map((year, i) => {
      const row = rows.find(r => r.category === 'TOTAL LIABILITIES');
      return { label: String(year), value: row?.values[i] ?? 0 };
    });
    
    const equityData = years.map((year, i) => {
      const row = rows.find(r => r.category === 'TOTAL EQUITY');
      return { label: String(year), value: row?.values[i] ?? 0 };
    });
    
    drawLineChart({
      doc,
      x: 14,
      y: 30,
      width: 269,
      height: 150,
      title: `Balance Sheet Components (${projectionYears}-Year Projection)`,
      series: [
        { name: "Total Assets", data: assetsData, color: "#257D41" },
        { name: "Total Liabilities", data: liabilitiesData, color: "#F4795B" },
        { name: "Total Equity", data: equityData, color: "#3B82F6" }
      ]
    });
    
    doc.save('balance-sheet.pdf');
  };

  const exportBalanceSheetToCSV = () => {
    const { years, rows } = generateBalanceSheetData();
    const headers = ['Category', ...years.map(String)];
    const csvRows = [
      headers.join(','),
      ...rows.filter(row => row.category !== '').map(row => [
        `"${(row.indent ? '  '.repeat(row.indent) : '') + row.category}"`,
        ...row.values.map(v => v.toFixed(2))
      ].join(','))
    ];
    downloadCSV(csvRows.join('\n'), 'balance-sheet.csv');
  };

  const generateInvestmentAnalysisData = () => {
    const years = ['Initial', ...Array.from({ length: projectionYears }, (_, i) => String(getFiscalYear(i)))];
    const rows: { category: string; values: (number | string)[]; isHeader?: boolean; indent?: number; isNegative?: boolean }[] = [];
    
    const getEquityForYear = (yearIdx: number): number =>
      properties.reduce((sum, prop) =>
        sum + (acquisitionYearIndex(prop.acquisitionDate, prop.operationsStartDate, global.modelStartDate) === yearIdx
          ? propertyEquityInvested(prop, (global.debtAssumptions as any)?.acqLTV)
          : 0), 0);
    
    // Single engine: aggregate yearly details from monthly pro forma data
    const getYearDetails = (yearIdx: number) => {
      let totalNOI = 0, totalDebtService = 0, totalInterest = 0, totalDepreciation = 0;
      let totalBTCF = 0, totalTaxableIncome = 0, totalTax = 0, totalATCF = 0;

      properties.forEach((prop, idx) => {
        const proForma = allPropertyFinancials[idx]?.financials || [];
        const yearData = proForma.slice(yearIdx * 12, (yearIdx + 1) * 12);
        const noi = yearData.reduce((a: number, m: any) => a + m.noi, 0);
        const interestExpense = yearData.reduce((a: number, m: any) => a + m.interestExpense, 0);
        const debtService = yearData.reduce((a: number, m: any) => a + m.debtPayment, 0);
        const depreciation = yearData.reduce((a: number, m: any) => a + m.depreciationExpense, 0);
        const incomeTax = yearData.reduce((a: number, m: any) => a + m.incomeTax, 0);
        const btcf = noi - debtService;
        const taxableIncome = noi - interestExpense - depreciation;

        totalNOI += noi;
        totalDebtService += debtService;
        totalInterest += interestExpense;
        totalDepreciation += depreciation;
        totalBTCF += btcf;
        totalTaxableIncome += taxableIncome;
        totalTax += incomeTax;
        totalATCF += btcf - incomeTax;
      });

      return { noi: totalNOI, debtService: totalDebtService, interest: totalInterest,
               depreciation: totalDepreciation, btcf: totalBTCF,
               taxableIncome: totalTaxableIncome, tax: totalTax, atcf: totalATCF };
    };
    
    rows.push({ category: "EQUITY INVESTMENT", values: [
      -getEquityForYear(0),
      ...Array.from({ length: projectionYears }, (_, i) => {
        const eq = getEquityForYear(i + 1);
        return eq > 0 ? -eq : '';
      })
    ], isHeader: true, isNegative: true });
    
    properties.forEach(prop => {
      const acqYear = acquisitionYearIndex(prop.acquisitionDate, prop.operationsStartDate, global.modelStartDate);
      const investment = propertyEquityInvested(prop, (global.debtAssumptions as any)?.acqLTV);

      const values: (number | string)[] = Array(projectionYears + 1).fill('');
      if (acqYear >= 0 && acqYear <= projectionYears) {
        values[acqYear] = -investment;
      }
      rows.push({ category: prop.name, values, indent: 1, isNegative: true });
    });
    
    rows.push({ category: "", values: Array(projectionYears + 1).fill('') });
    rows.push({ category: "OPERATING CASH FLOW", values: Array(projectionYears + 1).fill(''), isHeader: true });
    
    rows.push({ category: "Net Operating Income (NOI)", values: [
      '-',
      ...Array.from({ length: projectionYears }, (_, i) => getYearDetails(i).noi)
    ], indent: 1 });
    
    rows.push({ category: "Less: Debt Service", values: [
      '-',
      ...Array.from({ length: projectionYears }, (_, i) => {
        const ds = getYearDetails(i).debtService;
        return ds > 0 ? -ds : '-';
      })
    ], indent: 1, isNegative: true });
    
    rows.push({ category: "Before-Tax Cash Flow", values: [
      '-',
      ...Array.from({ length: projectionYears }, (_, i) => getYearDetails(i).btcf)
    ], indent: 1 });
    
    rows.push({ category: "", values: Array(projectionYears + 1).fill('') });
    rows.push({ category: "TAX CALCULATION", values: Array(projectionYears + 1).fill(''), isHeader: true });
    
    rows.push({ category: "Less: Interest Expense", values: [
      '-',
      ...Array.from({ length: projectionYears }, (_, i) => {
        const int = getYearDetails(i).interest;
        return int > 0 ? -int : '-';
      })
    ], indent: 1, isNegative: true });
    
    rows.push({ category: "Less: Depreciation", values: [
      '-',
      ...Array.from({ length: projectionYears }, (_, i) => -getYearDetails(i).depreciation)
    ], indent: 1, isNegative: true });
    
    rows.push({ category: "Taxable Income", values: [
      '-',
      ...Array.from({ length: projectionYears }, (_, i) => getYearDetails(i).taxableIncome)
    ], indent: 1 });
    
    rows.push({ category: "Tax Liability", values: [
      '-',
      ...Array.from({ length: projectionYears }, (_, i) => {
        const tax = getYearDetails(i).tax;
        return tax > 0 ? -tax : '-';
      })
    ], indent: 1, isNegative: true });
    
    rows.push({ category: "", values: Array(projectionYears + 1).fill('') });
    rows.push({ category: "AFTER-TAX CASH FLOW (ATCF)", values: [
      '-',
      ...Array.from({ length: projectionYears }, (_, i) => getYearDetails(i).atcf)
    ], isHeader: true });
    
    rows.push({ category: `Exit Value (Year ${projectionYears})`, values: [
      ...Array(projectionYears).fill(''),
      totalExitValue
    ] });
    
    rows.push({ category: "", values: Array(projectionYears + 1).fill('') });
    rows.push({ category: "TOTAL CASH FLOW", values: consolidatedFlows.map((cf, i) => cf), isHeader: true });
    
    rows.push({ category: "", values: Array(projectionYears + 1).fill('') });
    rows.push({ category: "INVESTMENT METRICS", values: Array(projectionYears + 1).fill(''), isHeader: true });
    rows.push({ category: "Total Equity Invested", values: [formatMoney(totalInitialEquity), ...Array(projectionYears).fill('')] });
    rows.push({ category: "Total Exit Value", values: [...Array(projectionYears).fill(''), formatMoney(totalExitValue)] });
    rows.push({ category: "Equity Multiple", values: [`${equityMultiple.toFixed(2)}x`, ...Array(projectionYears).fill('')] });
    rows.push({ category: "Cash-on-Cash Return", values: [`${cashOnCash.toFixed(1)}%`, ...Array(projectionYears).fill('')] });
    rows.push({ category: "Portfolio IRR", values: [`${(portfolioIRR * 100).toFixed(1)}%`, ...Array(projectionYears).fill('')], isHeader: true });
    
    return { years, rows };
  };

  const exportInvestmentAnalysisToPDF = () => {
    const { years, rows } = generateInvestmentAnalysisData();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    doc.setFontSize(18);
    doc.text("Hospitality Business Group - Investment Analysis", 14, 15);
    doc.setFontSize(10);
    doc.text(`${projectionYears}-Year Projection`, 14, 22);
    doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy')}`, 14, 27);
    
    const tableData = rows.map(row => [
      (row.indent ? '  '.repeat(row.indent) : '') + row.category,
      ...row.values.map(v => {
        if (v === '' || v === '-') return v;
        if (typeof v === 'number') {
          if (v < 0) return `(${formatMoney(Math.abs(v))})`;
          return formatMoney(v);
        }
        return v;
      })
    ]);
    
    autoTable(doc, {
      head: [['Category', ...years]],
      body: tableData,
      startY: 32,
      styles: { fontSize: 5.5, cellPadding: 1, font: 'helvetica' },
      headStyles: { fillColor: [159, 188, 164], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 5.5, font: 'helvetica' },
      columnStyles: { 0: { cellWidth: 45, font: 'helvetica' } },
      margin: { left: 8, right: 8 },
      didParseCell: (data) => {
        // Use courier (monospace) for numeric columns
        if (data.column.index > 0) {
          data.cell.styles.font = 'courier';
        }
        if (data.section === 'body' && data.row.index !== undefined) {
          const row = rows[data.row.index];
          if (row?.isHeader) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        }
      }
    });
    
    // Add investment analysis charts on separate pages at the end
    doc.addPage();
    doc.setFontSize(16);
    doc.text("Investment Returns Chart", 14, 15);
    doc.setFontSize(10);
    doc.text(`${projectionYears}-Year Cash Flow to Investors and Cumulative Returns`, 14, 22);
    
    const cashFlowData = consolidatedFlows.slice(1).map((cf, i) => ({
      label: String(years[i]),
      value: cf
    }));
    
    let cumulative = consolidatedFlows[0];
    const cumulativeData = consolidatedFlows.slice(1).map((cf, i) => {
      cumulative += cf;
      return { label: String(years[i]), value: cumulative };
    });
    
    drawLineChart({
      doc,
      x: 14,
      y: 30,
      width: 269,
      height: 150,
      title: `Net Cash Flow to Investors (${projectionYears}-Year Projection)`,
      series: [
        { name: "Annual Cash Flow", data: cashFlowData, color: "#257D41" },
        { name: "Cumulative Cash Flow", data: cumulativeData, color: "#7C3AED" }
      ]
    });
    
    doc.save('investment-analysis.pdf');
  };

  const exportInvestmentAnalysisToCSV = () => {
    const { years, rows } = generateInvestmentAnalysisData();
    const headers = ['Category', ...years];
    const csvRows = [
      headers.join(','),
      ...rows.filter(row => row.category !== '').map(row => [
        `"${(row.indent ? '  '.repeat(row.indent) : '') + row.category}"`,
        ...row.values.map(v => {
          if (v === '' || v === '-') return '';
          if (typeof v === 'number') return v.toFixed(2);
          return `"${v}"`;
        })
      ].join(','))
    ];
    downloadCSV(csvRows.join('\n'), 'investment-analysis.csv');
  };

  // Comprehensive Overview Export - includes all financial statements
  const exportOverviewToPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Calculate 10-year totals for comprehensive metrics
    const total10YearRevenue = Array.from({ length: projectionYears }, (_, i) => getYearlyConsolidated(i).revenueTotal).reduce((a, b) => a + b, 0);
    const total10YearNOI = Array.from({ length: projectionYears }, (_, i) => getYearlyConsolidated(i).noi).reduce((a, b) => a + b, 0);
    const total10YearCashFlow = Array.from({ length: projectionYears }, (_, i) => getYearlyConsolidated(i).cashFlow).reduce((a, b) => a + b, 0);
    const avgPurchasePrice = properties.length > 0 ? properties.reduce((sum, p) => sum + (p.purchasePrice ?? 0), 0) / properties.length : 0;
    const pdfTotalRooms = properties.reduce((sum, p) => sum + (p.roomCount ?? 0), 0);
    const avgADR = pdfTotalRooms > 0 ? properties.reduce((sum, p) => sum + (p.startAdr ?? 0) * (p.roomCount ?? 0), 0) / pdfTotalRooms : 0;

    // Page footer function for didDrawPage hook
    const addFooter = (data: any) => {
      const pageNum = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(`Page ${pageNum}`, pageWidth - 20, pageHeight - 10);
      doc.text("Hospitality Business Group", 14, pageHeight - 10);
    };

    // ===== PAGE 1: Cover Page =====
    // Header
    doc.setFontSize(28);
    doc.setTextColor(37, 125, 65);
    doc.text("Hospitality Business Group", pageWidth / 2, 30, { align: 'center' });
    doc.setFontSize(20);
    doc.setTextColor(61, 61, 61);
    doc.text("Portfolio Investment Report", pageWidth / 2, 42, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`${projectionYears}-Year Projection (${getFiscalYear(0)} - ${getFiscalYear(projectionYears - 1)})`, pageWidth / 2, 52, { align: 'center' });
    doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, pageWidth / 2, 60, { align: 'center' });

    // Divider line
    doc.setDrawColor(159, 188, 164);
    doc.setLineWidth(0.5);
    doc.line(14, 68, pageWidth - 14, 68);

    // Key Metrics in a clean 3-column layout
    const col1X = 25;
    const col2X = 115;
    const col3X = 205;
    let metricY = 82;

    // Helper function for metric blocks
    const drawMetric = (x: number, y: number, label: string, value: string, isLarge: boolean = false) => {
      doc.setFontSize(isLarge ? 22 : 18);
      doc.setTextColor(37, 125, 65);
      doc.text(value, x, y);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(label, x, y + 6);
    };

    // Row 1: Key Returns
    drawMetric(col1X, metricY, "Total Equity Invested", formatMoney(totalInitialEquity));
    drawMetric(col2X, metricY, `Exit Value (Year ${projectionYears})`, formatMoney(totalExitValue));
    drawMetric(col3X, metricY, "Equity Multiple", `${equityMultiple.toFixed(2)}x`);

    metricY += 25;

    // Row 2: Performance
    drawMetric(col1X, metricY, "Portfolio IRR", `${(portfolioIRR * 100).toFixed(1)}%`);
    drawMetric(col2X, metricY, "Avg Cash-on-Cash", `${cashOnCash.toFixed(1)}%`);
    drawMetric(col3X, metricY, "Properties", `${totalProperties} (${totalRooms} rooms)`);

    metricY += 25;

    // Row 3: Projection Totals
    drawMetric(col1X, metricY, `${projectionYears}-Year Revenue`, formatMoney(totalProjectionRevenue));
    drawMetric(col2X, metricY, `${projectionYears}-Year NOI`, formatMoney(totalProjectionNOI));
    drawMetric(col3X, metricY, `${projectionYears}-Year Cash Flow`, formatMoney(totalProjectionCashFlow));

    metricY += 25;

    // Row 4: Averages
    drawMetric(col1X, metricY, "Total Investment", formatMoney(properties.reduce((sum, p) => sum + (p.purchasePrice ?? 0), 0)));
    drawMetric(col2X, metricY, "Avg Purchase Price", formatMoney(avgPurchasePrice));
    drawMetric(col3X, metricY, "Avg Starting ADR", formatMoney(avgADR));

    // Footer for page 1
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text("Page 1", pageWidth - 20, pageHeight - 10);
    doc.text("Hospitality Business Group", 14, pageHeight - 10);

    // ===== PAGE 2: Properties =====
    doc.addPage();
    doc.setFontSize(18);
    doc.setTextColor(61, 61, 61);
    doc.text("Portfolio Properties", 14, 20);

    const propertyListData = properties.map(p => [
      p.name,
      p.location,
      p.market || '-',
      `${p.roomCount}`,
      p.type,
      p.status,
      formatMoney(p.purchasePrice ?? 0),
      formatMoney(p.startAdr ?? 0)
    ]);

    autoTable(doc, {
      head: [["Property", "Location", "Market", "Rooms", "Financing", "Status", "Purchase Price", "Starting ADR"]],
      body: propertyListData,
      startY: 28,
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 4, font: 'helvetica' },
      headStyles: { fillColor: [159, 188, 164], textColor: [61, 61, 61], fontStyle: 'bold', halign: 'center', font: 'helvetica' },
      columnStyles: {
        0: { cellWidth: 40, font: 'helvetica' },
        1: { cellWidth: 45, font: 'helvetica' },
        2: { cellWidth: 30, font: 'helvetica' },
        3: { halign: 'center', cellWidth: 20, font: 'courier' },
        4: { halign: 'center', cellWidth: 25, font: 'helvetica' },
        5: { halign: 'center', cellWidth: 28, font: 'helvetica' },
        6: { halign: 'right', cellWidth: 35, font: 'courier' },
        7: { halign: 'right', cellWidth: 30, font: 'courier' }
      },
      didDrawPage: addFooter,
    });

    doc.addPage();

    // ===== PAGE 2: Income Statement =====
    doc.setFontSize(16);
    doc.setTextColor(61, 61, 61);
    doc.text("Income Statement", 14, 15);
    doc.setFontSize(10);
    doc.text(`Consolidated ${projectionYears}-Year Projection`, 14, 22);

    const { years: incomeYears, rows: incomeRows } = generateIncomeStatementData();
    const incomeTableData = incomeRows.map(row => [
      (row.indent ? '  '.repeat(row.indent) : '') + row.category,
      ...row.values.map(v => formatMoney(v))
    ]);

    const colStylesNumeric: Record<number, any> = { 0: { cellWidth: 45, halign: 'left', font: 'helvetica' } };
    for (let i = 1; i <= 10; i++) colStylesNumeric[i] = { halign: 'right', font: 'courier' };

    autoTable(doc, {
      head: [['Category', ...incomeYears.map(String)]],
      body: incomeTableData,
      startY: 27,
      styles: { fontSize: 7, cellPadding: 1.5, font: 'helvetica' },
      headStyles: { fillColor: [159, 188, 164], textColor: [61, 61, 61], fontStyle: 'bold', halign: 'center', font: 'helvetica' },
      columnStyles: colStylesNumeric,
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index !== undefined) {
          const row = incomeRows[data.row.index];
          if (row?.isHeader) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        }
      },
      didDrawPage: addFooter,
    });

    doc.addPage();

    // ===== PAGE 3: Cash Flow Statement =====
    doc.setFontSize(16);
    doc.setTextColor(61, 61, 61);
    doc.text("Cash Flow Statement", 14, 15);
    doc.setFontSize(10);
    doc.text(`Consolidated ${projectionYears}-Year Projection`, 14, 22);

    const { years: cfYears, rows: cfRows } = generateCashFlowData();
    const cfTableData = cfRows.map(row => [
      (row.indent ? '  '.repeat(row.indent) : '') + row.category,
      ...row.values.map(v => {
        if (row.isNegative && v < 0) return `(${formatMoney(Math.abs(v))})`;
        return formatMoney(v);
      })
    ]);

    autoTable(doc, {
      head: [['Category', ...cfYears.map(String)]],
      body: cfTableData,
      startY: 27,
      styles: { fontSize: 6.5, cellPadding: 1, font: 'helvetica' },
      headStyles: { fillColor: [159, 188, 164], textColor: [61, 61, 61], fontStyle: 'bold', halign: 'center', font: 'helvetica' },
      columnStyles: colStylesNumeric,
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index !== undefined) {
          const row = cfRows[data.row.index];
          if (row?.isHeader) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        }
      },
      didDrawPage: addFooter,
    });

    doc.addPage();

    // ===== PAGE 4: Balance Sheet =====
    doc.setFontSize(16);
    doc.setTextColor(61, 61, 61);
    doc.text("Balance Sheet", 14, 15);
    doc.setFontSize(10);
    doc.text(`Consolidated ${projectionYears}-Year Projection`, 14, 22);

    const { years: bsYears, rows: bsRows } = generateBalanceSheetData();
    const bsTableData = bsRows.map(row => [
      (row.indent ? '  '.repeat(row.indent) : '') + row.category,
      ...row.values.map(v => formatMoney(v))
    ]);

    autoTable(doc, {
      head: [['Category', ...bsYears.map(String)]],
      body: bsTableData,
      startY: 27,
      styles: { fontSize: 7, cellPadding: 1.5, font: 'helvetica' },
      headStyles: { fillColor: [159, 188, 164], textColor: [61, 61, 61], fontStyle: 'bold', halign: 'center', font: 'helvetica' },
      columnStyles: colStylesNumeric,
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index !== undefined) {
          const row = bsRows[data.row.index];
          if (row?.isHeader) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        }
      },
      didDrawPage: addFooter,
    });

    doc.addPage();

    // ===== PAGE 5: Investment Analysis =====
    doc.setFontSize(16);
    doc.setTextColor(61, 61, 61);
    doc.text("Investment Analysis", 14, 15);
    doc.setFontSize(10);
    doc.text("Property-Level IRR and Cash Flows", 14, 22);

    const { years: invYears, rows: invRows } = generateInvestmentAnalysisData();
    const invTableData = invRows.map(row => [
      (row.indent ? '  '.repeat(row.indent) : '') + row.category,
      ...row.values.map(v => {
        if (v === '' || v === '-') return v;
        if (typeof v === 'number') {
          if (v < 0) return `(${formatMoney(Math.abs(v))})`;
          return formatMoney(v);
        }
        return v;
      })
    ]);

    autoTable(doc, {
      head: [['Category', ...invYears]],
      body: invTableData,
      startY: 27,
      styles: { fontSize: 5.5, cellPadding: 1, font: 'helvetica' },
      headStyles: { fillColor: [159, 188, 164], textColor: [61, 61, 61], fontStyle: 'bold', fontSize: 5.5, halign: 'center', font: 'helvetica' },
      columnStyles: colStylesNumeric,
      margin: { left: 8, right: 8 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index !== undefined) {
          const row = invRows[data.row.index];
          if (row?.isHeader) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        }
      },
      didDrawPage: addFooter,
    });

    doc.save('LB-Hospitality-Portfolio-Report.pdf');
  };

  const exportOverviewToCSV = () => {
    const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));
    let csvContent = "";

    // Overview Section
    csvContent += "HOSPITALITY BUSINESS GROUP - PORTFOLIO INVESTMENT REPORT\n";
    csvContent += `Generated: ${format(new Date(), 'MMMM d, yyyy')}\n`;
    csvContent += `Investment Period: ${getFiscalYear(0)} - ${getFiscalYear(projectionYears - 1)}\n\n`;

    csvContent += "INVESTMENT RETURNS SUMMARY\n";
    csvContent += `Total Equity Invested,${totalInitialEquity}\n`;
    csvContent += `Exit Value (Year ${projectionYears}),${totalExitValue}\n`;
    csvContent += `Equity Multiple,${equityMultiple.toFixed(2)}x\n`;
    csvContent += `Average Cash-on-Cash,${cashOnCash.toFixed(1)}%\n`;
    csvContent += `Portfolio IRR,${(portfolioIRR * 100).toFixed(1)}%\n\n`;

    csvContent += "PORTFOLIO COMPOSITION\n";
    csvContent += `Properties,${totalProperties}\n`;
    csvContent += `Total Rooms,${totalRooms}\n`;
    csvContent += `Total Investment,${properties.reduce((sum, p) => sum + (p.purchasePrice ?? 0), 0)}\n`;
    csvContent += `Average Purchase Price,${properties.length > 0 ? properties.reduce((sum, p) => sum + (p.purchasePrice ?? 0), 0) / properties.length : 0}\n`;
    csvContent += `Average Starting ADR,${properties.length > 0 ? properties.reduce((sum, p) => sum + (p.startAdr ?? 0), 0) / properties.length : 0}\n\n`;

    csvContent += "10-YEAR FINANCIAL PROJECTIONS\n";
    csvContent += `Total Revenue (${projectionYears}-Year),${Array.from({ length: projectionYears }, (_, i) => getYearlyConsolidated(i).revenueTotal).reduce((a, b) => a + b, 0)}\n`;
    csvContent += `Total NOI (${projectionYears}-Year),${Array.from({ length: projectionYears }, (_, i) => getYearlyConsolidated(i).noi).reduce((a, b) => a + b, 0)}\n`;
    csvContent += `Total Cash Flow (${projectionYears}-Year),${Array.from({ length: projectionYears }, (_, i) => getYearlyConsolidated(i).cashFlow).reduce((a, b) => a + b, 0)}\n`;
    csvContent += `Year ${projectionYears} Revenue,${getYearlyConsolidated(projectionYears - 1).revenueTotal}\n`;
    csvContent += `Year ${projectionYears} NOI,${getYearlyConsolidated(projectionYears - 1).noi}\n\n`;

    csvContent += "PROPERTIES\n";
    csvContent += "Name,Location,Rooms,Financing\n";
    properties.forEach(p => {
      csvContent += `"${p.name}","${p.location}",${p.roomCount},${p.type}\n`;
    });
    csvContent += "\n";

    // Income Statement
    csvContent += "INCOME STATEMENT\n";
    const { years: incomeYears, rows: incomeRows } = generateIncomeStatementData();
    csvContent += `Category,${incomeYears.join(',')}\n`;
    incomeRows.forEach(row => {
      csvContent += `"${(row.indent ? '  '.repeat(row.indent) : '') + row.category}",${row.values.join(',')}\n`;
    });
    csvContent += "\n";

    // Cash Flow Statement
    csvContent += "CASH FLOW STATEMENT\n";
    const { years: cfYears, rows: cfRows } = generateCashFlowData();
    csvContent += `Category,${cfYears.join(',')}\n`;
    cfRows.forEach(row => {
      csvContent += `"${(row.indent ? '  '.repeat(row.indent) : '') + row.category}",${row.values.join(',')}\n`;
    });
    csvContent += "\n";

    // Balance Sheet
    csvContent += "BALANCE SHEET\n";
    const { years: bsYears, rows: bsRows } = generateBalanceSheetData();
    csvContent += `Category,${bsYears.join(',')}\n`;
    bsRows.forEach(row => {
      csvContent += `"${(row.indent ? '  '.repeat(row.indent) : '') + row.category}",${row.values.join(',')}\n`;
    });
    csvContent += "\n";

    // Investment Analysis
    csvContent += "INVESTMENT ANALYSIS\n";
    const { years: invYears, rows: invRows } = generateInvestmentAnalysisData();
    csvContent += `Category,${invYears.join(',')}\n`;
    invRows.filter(row => row.category !== '').forEach(row => {
      const values = row.values.map(v => {
        if (v === '' || v === '-') return '';
        if (typeof v === 'number') return v;
        return `"${v}"`;
      });
      csvContent += `"${(row.indent ? '  '.repeat(row.indent) : '') + row.category}",${values.join(',')}\n`;
    });

    downloadCSV(csvContent, 'LB-Hospitality-Portfolio-Report.csv');
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const addSheet = (name: string, genData: () => { years: (string | number)[]; rows: { category: string; values: (string | number)[]; indent?: number }[] }) => {
      const { years, rows } = genData();
      const headers = ["", ...years.map(String)];
      const dataRows = rows.map(row => [
        (row.indent ? "  ".repeat(row.indent) : "") + row.category,
        ...row.values,
      ]);
      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      ws["!cols"] = [{ wch: 30 }, ...years.map(() => ({ wch: 16 }))];
      XLSX.utils.book_append_sheet(wb, ws, name);
    };

    addSheet("Income Statement", generateIncomeStatementData);
    addSheet("Cash Flow", generateCashFlowData);
    addSheet("Balance Sheet", generateBalanceSheetData);
    addSheet("Investment Analysis", generateInvestmentAnalysisData);

    XLSX.writeFile(wb, "LB-Hospitality-Portfolio-Report.xlsx");
  };

  const exportToPPTX = () => {
    const incomeData = generateIncomeStatementData();
    const cashFlowData = generateCashFlowData();
    const balanceSheetData = generateBalanceSheetData();
    const investmentData = generateInvestmentAnalysisData();

    exportPortfolioPPTX({
      projectionYears,
      getFiscalYear,
      totalInitialEquity,
      totalExitValue,
      equityMultiple,
      portfolioIRR,
      cashOnCash,
      totalProperties,
      totalRooms,
      totalProjectionRevenue,
      totalProjectionNOI,
      totalProjectionCashFlow,
      incomeData: { years: incomeData.years.map(String), rows: incomeData.rows },
      cashFlowData: { years: cashFlowData.years.map(String), rows: cashFlowData.rows },
      balanceSheetData: { years: balanceSheetData.years.map(String), rows: balanceSheetData.rows },
      investmentData: { years: investmentData.years.map(String), rows: investmentData.rows },
    });
  };

  const exportCurrentTabPNG = async () => {
    if (tabContentRef.current) {
      await exportTablePNG({
        element: tabContentRef.current,
        filename: `LB-Portfolio-${activeTab}.png`,
        scale: 2,
      });
    }
  };

  const getExportFunctions = () => {
    return {
      pdf: (() => {
        switch (activeTab) {
          case 'overview': return exportOverviewToPDF;
          case 'income': return exportIncomeStatementToPDF;
          case 'cashflow': return exportCashFlowToPDF;
          case 'balance': return exportBalanceSheetToPDF;
          case 'investment': return exportInvestmentAnalysisToPDF;
          default: return exportOverviewToPDF;
        }
      })(),
      csv: (() => {
        switch (activeTab) {
          case 'overview': return exportOverviewToCSV;
          case 'income': return exportIncomeStatementToCSV;
          case 'cashflow': return exportCashFlowToCSV;
          case 'balance': return exportBalanceSheetToCSV;
          case 'investment': return exportInvestmentAnalysisToCSV;
          default: return exportOverviewToCSV;
        }
      })(),
      excel: exportToExcel,
      pptx: exportToPPTX,
      png: exportCurrentTabPNG,
    };
  };

  const exportFunctions = getExportFunctions();

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Investment Overview"
          subtitle={`Hospitality Business Group - ${global?.propertyLabel || "Boutique Hotel"} Portfolio`}
          variant="dark"
          actions={
            <div className="bg-white/10 backdrop-blur-xl rounded-xl px-5 py-3 border border-white/20 text-center">
              <p className="text-xs text-background/50 uppercase tracking-widest label-text">Investment Period</p>
              <p className="text-lg font-medium text-background font-mono">{getFiscalYear(0)} - {getFiscalYear(investmentHorizon - 1)}</p>
            </div>
          }
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <DarkGlassTabs
            tabs={[
              { value: 'overview', label: 'Overview', icon: LayoutDashboard },
              { value: 'income', label: 'Income Statement', icon: FileText },
              { value: 'cashflow', label: 'Cash Flow', icon: Banknote },
              { value: 'balance', label: 'Balance Sheet', icon: Scale },
              { value: 'investment', label: 'Investment Analysis', icon: TrendingUpIcon }
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            rightContent={
              <ExportMenu
                actions={[
                  pdfAction(exportFunctions.pdf),
                  excelAction(exportFunctions.excel),
                  csvAction(exportFunctions.csv),
                  pptxAction(exportFunctions.pptx),
                  pngAction(exportFunctions.png),
                ]}
              />
            }
          />

          <TabsContent value="overview" className="space-y-8" ref={tabContentRef}>
            {/* Investment Returns - Hero Section - Fluid Glass Design with 3D */}
            <div className="relative overflow-hidden rounded-3xl p-8 border border-primary/30 shadow-2xl">
              {/* Sage Glass Background with Fluid Effect */}
              <div className="absolute inset-0 bg-primary/25 backdrop-blur-3xl" />
              <div className="absolute inset-0">
                <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-secondary/20 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-primary/30 blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
                <div className="absolute top-1/3 right-0 w-64 h-64 rounded-full bg-white/20 blur-2xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
              </div>
              <Dashboard3DBackground />
              
              <div className="relative">
                <div className="text-center mb-8">
                  <p className="text-sm font-medium tracking-widest text-[#2d4a5e]/60 uppercase mb-2 label-text">Investment Performance</p>
                  <p className="text-[#2d4a5e]/50 text-sm label-text"><span className="font-mono">{investmentHorizon}</span>-Year Hold | <span className="font-mono">{totalProperties}</span> Properties | <span className="font-mono">{totalRooms}</span> Rooms</p>
                </div>
                
                {/* Main IRR Display + Property IRR Bar Chart - Side by Side */}
                <div className="flex flex-col lg:flex-row items-center justify-center gap-8 mb-10">
                  {/* Portfolio IRR Meter */}
                  <div className="relative bg-white/95 backdrop-blur-xl rounded-[2rem] p-8 border border-primary/40 shadow-xl shadow-black/10">
                    <div className="relative">
                      <svg className="w-48 h-48" viewBox="0 0 200 200">
                        <defs>
                          <linearGradient id="irrTube3D" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FFB89A" />
                            <stop offset="40%" stopColor="#F4795B" />
                            <stop offset="100%" stopColor="#E06545" />
                          </linearGradient>
                        </defs>
                        <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(45,74,94,0.1)" strokeWidth="12" />
                        <circle 
                          cx="100" cy="100" r="80" fill="none" stroke="url(#irrTube3D)" strokeWidth="12"
                          strokeDasharray={`${Math.min(Math.max(portfolioIRR * 100, 0) * 5.03, 503)} 503`}
                          strokeLinecap="round"
                          transform="rotate(-90 100 100)"
                          style={{ filter: 'drop-shadow(0 0 10px rgba(244,121,91,0.5))' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-bold text-[#2d4a5e] tracking-tight font-mono">{(portfolioIRR * 100).toFixed(1)}%</span>
                        <span className="text-sm text-[#2d4a5e]/60 font-medium mt-2 label-text">Portfolio IRR</span>
                      </div>
                    </div>
                  </div>

                  {/* Property IRR Comparison Bar Chart */}
                  <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 border border-primary/40 shadow-xl shadow-black/10 w-full lg:min-w-[340px]" data-testid="chart-property-irr-comparison">
                    <p className="text-xs font-medium tracking-widest text-[#2d4a5e]/60 uppercase mb-3 text-center label-text">Property IRR Comparison</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={properties.map((prop, idx) => {
                          const cashFlows = getPropertyCashFlows(idx);
                          const irr = calculateIRR(cashFlows);
                          return {
                            name: prop.name.length > 15 ? prop.name.substring(0, 13) + '…' : prop.name,
                            fullName: prop.name,
                            irr: parseFloat((irr * 100).toFixed(1)),
                          };
                        })}
                        margin={{ top: 5, right: 10, left: 0, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,74,94,0.1)" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10, fill: '#6b7280' }}
                          angle={-25}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis
                          tickFormatter={(v: number) => `${v}%`}
                          tick={{ fontSize: 10, fill: '#6b7280' }}
                          domain={[0, 'auto']}
                          width={45}
                        />
                        <Tooltip
                          formatter={(value: number) => [`${value.toFixed(1)}%`, 'IRR']}
                          labelFormatter={(label: string, payload: any[]) => payload?.[0]?.payload?.fullName || label}
                          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                        />
                        <Bar dataKey="irr" radius={[4, 4, 0, 0]} maxBarSize={40} fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Property Investment Bar Chart */}
                  <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 border border-primary/40 shadow-xl shadow-black/10 w-full lg:min-w-[340px]" data-testid="chart-property-investment">
                    <p className="text-xs font-medium tracking-widest text-[#2d4a5e]/60 uppercase mb-3 text-center label-text">Equity Investment by Property</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={properties.map((prop) => {
                          const investment = getPropertyInvestment(prop);
                          return {
                            name: prop.name.length > 15 ? prop.name.substring(0, 13) + '…' : prop.name,
                            fullName: prop.name,
                            investment: Math.round(investment),
                          };
                        })}
                        margin={{ top: 5, right: 10, left: 0, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,74,94,0.1)" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10, fill: '#6b7280' }}
                          angle={-25}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis
                          tickFormatter={(v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`}
                          tick={{ fontSize: 10, fill: '#6b7280' }}
                          domain={[0, 'auto']}
                          width={55}
                        />
                        <Tooltip
                          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Equity Invested']}
                          labelFormatter={(label: string, payload: any[]) => payload?.[0]?.payload?.fullName || label}
                          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                        />
                        <Bar dataKey="investment" radius={[4, 4, 0, 0]} maxBarSize={40} fill="#F59E0B" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Key Metrics Grid - Liquid Glass Cards */}
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
                  {/* Equity Multiple */}
                  <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-white/40 shadow-lg shadow-black/10 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="relative w-14 h-14 flex-shrink-0">
                        <svg className="w-14 h-14" viewBox="0 0 100 100">
                          <defs>
                            <linearGradient id="smallTube3D_eq" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#3B82F6" />
                              <stop offset="40%" stopColor="#2563EB" />
                              <stop offset="100%" stopColor="#1D4ED8" />
                            </linearGradient>
                          </defs>
                          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(45,74,94,0.15)" strokeWidth="6" />
                          <circle 
                            cx="50" cy="50" r="40" fill="none" stroke="url(#smallTube3D_eq)" strokeWidth="6"
                            strokeDasharray={`${Math.min(equityMultiple * 63, 251)} 251`}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                            style={{ filter: 'drop-shadow(0 0 6px rgba(37,99,235,0.5))' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-[#2d4a5e] font-mono">{equityMultiple.toFixed(1)}x</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[#2563EB] font-mono">{equityMultiple.toFixed(2)}x</p>
                        <p className="text-sm text-[#2d4a5e]/60 label-text">Equity Multiple</p>
                      </div>
                    </div>
                  </div>

                  {/* Cash-on-Cash */}
                  <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-white/40 shadow-lg shadow-black/10 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="relative w-14 h-14 flex-shrink-0">
                        <svg className="w-14 h-14" viewBox="0 0 100 100">
                          <defs>
                            <linearGradient id="smallTube3D_coc" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#F59E0B" />
                              <stop offset="40%" stopColor="#D97706" />
                              <stop offset="100%" stopColor="#B45309" />
                            </linearGradient>
                          </defs>
                          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(45,74,94,0.15)" strokeWidth="6" />
                          <circle 
                            cx="50" cy="50" r="40" fill="none" stroke="url(#smallTube3D_coc)" strokeWidth="6"
                            strokeDasharray={`${Math.min(Math.max(cashOnCash, 0) * 12.5, 251)} 251`}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                            style={{ filter: 'drop-shadow(0 0 6px rgba(217,119,6,0.5))' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-[#2d4a5e] font-mono">{cashOnCash.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[#D97706] font-mono">{cashOnCash.toFixed(1)}%</p>
                        <p className="text-sm text-[#2d4a5e]/60 label-text">Cash-on-Cash</p>
                      </div>
                    </div>
                  </div>

                  {/* Total Equity */}
                  <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-white/40 shadow-lg shadow-black/10 hover:shadow-xl transition-all duration-300">
                    <div className="mb-2">
                      <p className="text-2xl font-bold text-[#2d4a5e] font-mono">{formatMoney(totalInitialEquity)}</p>
                      <p className="text-sm text-[#2d4a5e]/60 label-text">Equity Invested</p>
                    </div>
                    <div className="h-1.5 bg-[#2d4a5e]/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>

                  {/* Exit Value */}
                  <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-white/40 shadow-lg shadow-black/10 hover:shadow-xl transition-all duration-300">
                    <div className="mb-2">
                      <p className="text-2xl font-bold text-[#059669] font-mono">{formatMoney(totalExitValue)}</p>
                      <p className="text-sm text-[#2d4a5e]/60 label-text">Projected Exit</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      <span className="text-sm font-medium text-[#059669] font-mono">+{((totalExitValue / totalInitialEquity - 1) * 100).toFixed(0)}% gain</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Portfolio & Capital Summary - Fluid Glass Style */}
            <div className="relative overflow-hidden rounded-3xl p-6 border border-primary/30 shadow-2xl">
              {/* Sage Glass Background with Fluid Effect */}
              <div className="absolute inset-0 bg-primary/25 backdrop-blur-3xl" />
              <div className="absolute inset-0">
                <div className="absolute top-0 right-1/3 w-56 h-56 rounded-full bg-secondary/20 blur-3xl animate-pulse" style={{ animationDuration: '7s' }} />
                <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-primary/30 blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-0 w-40 h-40 rounded-full bg-white/20 blur-2xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
              </div>
              
              <div className="relative grid gap-6 md:grid-cols-2">
                {/* Portfolio Composition */}
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-lg shadow-black/10">
                  <h3 className="text-lg font-semibold text-[#2d4a5e] mb-4 font-display">Portfolio Composition</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#2d4a5e]/60 label-text">Properties</span>
                      <span className="font-semibold text-[#2d4a5e] font-mono">{totalProperties}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#2d4a5e]/60 label-text">Total Rooms</span>
                      <span className="font-semibold text-[#2d4a5e] font-mono">{totalRooms}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#2d4a5e]/60 label-text">Avg Rooms/Property</span>
                      <span className="font-semibold text-[#2d4a5e] font-mono">{avgRoomsPerProperty.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#2d4a5e]/60 label-text">Markets</span>
                      <span className="font-semibold text-[#2d4a5e] font-mono">{Object.keys(marketCounts).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#2d4a5e]/60 label-text">Avg Daily Rate</span>
                      <span className="font-semibold text-[#2563EB] font-mono">{formatMoney(avgADR)}</span>
                    </div>
                  </div>
                </div>

                {/* Capital Structure */}
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-lg shadow-black/10">
                  <h3 className="text-lg font-semibold text-[#2d4a5e] mb-4 font-display">Capital Structure</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#2d4a5e]/60 label-text">Total Investment</span>
                      <span className="font-semibold text-[#2d4a5e] font-mono">{formatMoney(totalInvestment)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#2d4a5e]/60 label-text">Avg Purchase Price</span>
                      <span className="font-semibold text-[#2d4a5e] font-mono">{formatMoney(avgPurchasePrice)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#2d4a5e]/60 label-text">Avg Exit Cap Rate</span>
                      <span className="font-semibold text-[#D97706] font-mono">{(avgExitCapRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#2d4a5e]/60 label-text">Hold Period</span>
                      <span className="font-semibold text-[#2d4a5e] font-mono">{investmentHorizon} Years</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#2d4a5e]/60 label-text">Projected Exit Value</span>
                      <span className="font-semibold text-[#059669] font-mono">{formatMoney(projectedExitValue)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Projection Totals Row */}
              <div className="relative mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white/90 backdrop-blur-xl rounded-xl p-4 border border-white/40 shadow-lg shadow-black/10 text-center">
                  <p className="text-sm text-[#2d4a5e]/60 mb-1 label-text">{projectionYears}-Year Revenue</p>
                  <p className="text-xl font-bold text-[#2d4a5e] font-mono">{formatMoney(totalProjectionRevenue)}</p>
                </div>
                <div className="bg-white/90 backdrop-blur-xl rounded-xl p-4 border border-white/40 shadow-lg shadow-black/10 text-center">
                  <p className="text-sm text-[#2d4a5e]/60 mb-1 label-text">{projectionYears}-Year NOI</p>
                  <p className="text-xl font-bold text-[#2d4a5e] font-mono">{formatMoney(totalProjectionNOI)}</p>
                </div>
                <div className="bg-white/90 backdrop-blur-xl rounded-xl p-4 border border-white/40 shadow-lg shadow-black/10 text-center">
                  <p className="text-sm text-[#2d4a5e]/60 mb-1 label-text">{projectionYears}-Year Cash Flow</p>
                  <p className="text-xl font-bold text-[#2d4a5e] font-mono">{formatMoney(totalProjectionCashFlow)}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="income" className="mt-6 space-y-6">
            {/* Chart Container */}
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-background" />
              <div className="absolute inset-0">
                <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-primary/8 blur-3xl" />
              </div>
              
              <CardHeader className="relative">
                <CardTitle className="text-[#2d4a5e] font-display">Portfolio Income Trends</CardTitle>
                <p className="text-sm text-[#2d4a5e]/60 label-text">Revenue, Operating Expenses, and NOI over 10 years</p>
              </CardHeader>
              
              <CardContent className="relative">
                <div className="bg-white/90 backdrop-blur-xl rounded-xl p-4 border border-primary/30 shadow-lg shadow-black/10">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={Array.from({ length: projectionYears }, (_, i) => {
                        const yearly = getYearlyConsolidated(i);
                        return {
                          year: getFiscalYear(i),
                          Revenue: yearly.revenueTotal,
                          'Operating Expenses': yearly.totalExpenses,
                          NOI: yearly.noi
                        };
                      })}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid horizontal={true} vertical={false} stroke="rgba(45,74,94,0.15)" />
                      <XAxis dataKey="year" stroke="transparent" tick={{ fill: '#2d4a5e', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
                      <YAxis 
                        stroke="transparent" 
                        tick={{ fill: '#2d4a5e', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
                        tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatMoney(value)}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255,249,245,0.98)', 
                          border: '1px solid rgba(159,188,164,0.3)',
                          borderRadius: '12px',
                          backdropFilter: 'blur(12px)',
                          color: '#2d4a5e'
                        }}
                        labelStyle={{ color: '#2d4a5e' }}
                      />
                      <Legend wrapperStyle={{ color: '#2d4a5e', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500 }} />
                      <Line type="natural" dataKey="Revenue" stroke="#7C3AED" strokeWidth={3} dot={{ r: 4, fill: '#7C3AED', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#7C3AED', stroke: '#fff', strokeWidth: 2 }} />
                      <Line type="natural" dataKey="Operating Expenses" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }} />
                      <Line type="natural" dataKey="NOI" stroke="#257D41" strokeWidth={3} dot={{ r: 4, fill: '#257D41', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#257D41', stroke: '#fff', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display">Consolidated Portfolio Income Statement ({projectionYears}-Year)</CardTitle>
                <p className="text-sm text-muted-foreground label-text">All properties combined - management fees shown as expenses paid to Hospitality Business Co.</p>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card min-w-[200px]">Category</TableHead>
                      {Array.from({ length: projectionYears }, (_, i) => (
                        <TableHead key={i} className="text-right min-w-[110px] font-mono">{getFiscalYear(i)}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow 
                      className="font-semibold bg-muted/20 cursor-pointer hover:bg-muted/30"
                      onClick={() => toggleRow('revenue')}
                    >
                      <TableCell className="sticky left-0 bg-muted/20 flex items-center gap-2 label-text">
                        {expandedRows.has('revenue') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Total Revenue
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => (
                        <TableCell key={y} className="text-right font-mono">{formatMoney(getYearlyConsolidated(y).revenueTotal)}</TableCell>
                      ))}
                    </TableRow>
                    {expandedRows.has('revenue') && (
                      <>
                        <TableRow 
                          className="bg-muted/5 cursor-pointer hover:bg-muted/10"
                          onClick={(e) => { e.stopPropagation(); toggleRow('isTotalRooms'); }}
                        >
                          <TableCell className="sticky left-0 bg-muted/5 pl-10 text-muted-foreground label-text flex items-center gap-2">
                            {expandedRows.has('isTotalRooms') ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            Total Rooms Available
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground font-mono">{getWeightedMetrics(y).totalAvailableRoomNights.toLocaleString()}</TableCell>
                          ))}
                        </TableRow>
                        {expandedRows.has('isTotalRooms') && properties.map((prop, idx) => (
                          <TableRow key={`isTotalRooms-${prop.id}`} className="bg-blue-50/30">
                            <TableCell className="sticky left-0 bg-blue-50/30 pl-16 text-xs text-muted-foreground">{prop.name}</TableCell>
                            {Array.from({ length: projectionYears }, (_, y) => (
                              <TableCell key={y} className="text-right text-xs text-muted-foreground font-mono">
                                {getPropertyYearly(idx, y).availableRooms.toLocaleString()}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                        <TableRow 
                          className="bg-muted/5 cursor-pointer hover:bg-muted/10"
                          onClick={(e) => { e.stopPropagation(); toggleRow('isAdr'); }}
                        >
                          <TableCell className="sticky left-0 bg-muted/5 pl-10 text-muted-foreground label-text flex items-center gap-2">
                            {expandedRows.has('isAdr') ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            Wtd Avg ADR
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground font-mono">{formatMoney(getWeightedMetrics(y).weightedADR)}</TableCell>
                          ))}
                        </TableRow>
                        {expandedRows.has('isAdr') && properties.map((prop, idx) => (
                          <TableRow key={`isAdr-${prop.id}`} className="bg-blue-50/30">
                            <TableCell className="sticky left-0 bg-blue-50/30 pl-16 text-xs text-muted-foreground">{prop.name}</TableCell>
                            {Array.from({ length: projectionYears }, (_, y) => {
                              const py = getPropertyYearly(idx, y);
                              return <TableCell key={y} className="text-right text-xs text-muted-foreground font-mono">
                                {py.soldRooms > 0 ? formatMoney(py.revenueRooms / py.soldRooms) : "-"}
                              </TableCell>;
                            })}
                          </TableRow>
                        ))}
                        <TableRow 
                          className="bg-muted/5 cursor-pointer hover:bg-muted/10"
                          onClick={(e) => { e.stopPropagation(); toggleRow('isOcc'); }}
                        >
                          <TableCell className="sticky left-0 bg-muted/5 pl-10 text-muted-foreground label-text flex items-center gap-2">
                            {expandedRows.has('isOcc') ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            Wtd Avg Occupancy
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground font-mono">{(getWeightedMetrics(y).weightedOcc * 100).toFixed(1)}%</TableCell>
                          ))}
                        </TableRow>
                        {expandedRows.has('isOcc') && properties.map((prop, idx) => (
                          <TableRow key={`isOcc-${prop.id}`} className="bg-blue-50/30">
                            <TableCell className="sticky left-0 bg-blue-50/30 pl-16 text-xs text-muted-foreground">{prop.name}</TableCell>
                            {Array.from({ length: projectionYears }, (_, y) => {
                              const py = getPropertyYearly(idx, y);
                              return <TableCell key={y} className="text-right text-xs text-muted-foreground font-mono">
                                {py.availableRooms > 0 ? `${((py.soldRooms / py.availableRooms) * 100).toFixed(1)}%` : "0%"}
                              </TableCell>;
                            })}
                          </TableRow>
                        ))}
                        <TableRow 
                          className="bg-muted/5 cursor-pointer hover:bg-muted/10"
                          onClick={(e) => { e.stopPropagation(); toggleRow('isRevpar'); }}
                        >
                          <TableCell className="sticky left-0 bg-muted/5 pl-10 text-muted-foreground label-text flex items-center gap-2">
                            {expandedRows.has('isRevpar') ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            RevPAR
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground font-mono">{formatMoney(getWeightedMetrics(y).revPAR)}</TableCell>
                          ))}
                        </TableRow>
                        {expandedRows.has('isRevpar') && properties.map((prop, idx) => (
                          <TableRow key={`isRevpar-${prop.id}`} className="bg-blue-50/30">
                            <TableCell className="sticky left-0 bg-blue-50/30 pl-16 text-xs text-muted-foreground">{prop.name}</TableCell>
                            {Array.from({ length: projectionYears }, (_, y) => {
                              const py = getPropertyYearly(idx, y);
                              return <TableCell key={y} className="text-right text-xs text-muted-foreground font-mono">
                                {py.availableRooms > 0 ? formatMoney(py.revenueRooms / py.availableRooms) : "-"}
                              </TableCell>;
                            })}
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Room Revenue</TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground font-mono">{formatMoney(getYearlyConsolidated(y).revenueRooms)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Event Revenue</TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground font-mono">{formatMoney(getYearlyConsolidated(y).revenueEvents)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">F&B Revenue</TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground font-mono">{formatMoney(getYearlyConsolidated(y).revenueFB)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Other Revenue</TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground font-mono">{formatMoney(getYearlyConsolidated(y).revenueOther)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/10"
                          onClick={(e) => { e.stopPropagation(); toggleRow('revenueByProperty'); }}
                        >
                          <TableCell className="sticky left-0 bg-card pl-8 flex items-center gap-2 text-muted-foreground">
                            {expandedRows.has('revenueByProperty') ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            By Property
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">-</TableCell>
                          ))}
                        </TableRow>
                        {expandedRows.has('revenueByProperty') && properties.map((prop, idx) => (
                          <TableRow key={prop.id} className="bg-muted/10">
                            <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">{prop.name}</TableCell>
                            {Array.from({ length: projectionYears }, (_, y) => (
                              <TableCell key={y} className="text-right text-sm text-muted-foreground">
                                {formatMoney(getPropertyYearly(idx, y).revenueTotal)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </>
                    )}

                    <TableRow 
                      className="font-semibold bg-muted/30 cursor-pointer hover:bg-muted/40"
                      onClick={() => toggleRow('opex')}
                    >
                      <TableCell className="sticky left-0 bg-muted/30 flex items-center gap-2 label-text">
                        {expandedRows.has('opex') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Operating Expenses
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const data = getYearlyConsolidated(y);
                        const totalOpex = data.expenseRooms + data.expenseFB + data.expenseEvents + data.expenseOther + 
                          data.expenseMarketing + data.expensePropertyOps + data.expenseUtilitiesVar + 
                          data.expenseAdmin + data.expenseIT + data.expenseInsurance + data.expenseTaxes + 
                          data.expenseUtilitiesFixed + data.expenseOtherCosts;
                        return <TableCell key={y} className="text-right font-mono">{formatMoney(totalOpex)}</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('opex') && (
                      <>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/20"
                          onClick={(e) => { e.stopPropagation(); toggleRow('opexDirect'); }}
                        >
                          <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                            {expandedRows.has('opexDirect') ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            Direct Costs
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => {
                            const data = getYearlyConsolidated(y);
                            return <TableCell key={y} className="text-right text-muted-foreground">
                              {formatMoney(data.expenseRooms + data.expenseFB + data.expenseEvents + data.expenseOther)}
                            </TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('opexDirect') && (
                          <>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Room Expense</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(getYearlyConsolidated(y).expenseRooms)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">F&B Expense</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(getYearlyConsolidated(y).expenseFB)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Event Expense</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(getYearlyConsolidated(y).expenseEvents)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Other Direct</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(getYearlyConsolidated(y).expenseOther)}</TableCell>
                              ))}
                            </TableRow>
                          </>
                        )}
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/20"
                          onClick={(e) => { e.stopPropagation(); toggleRow('opexOverhead'); }}
                        >
                          <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                            {expandedRows.has('opexOverhead') ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            Overhead & Admin
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => {
                            const data = getYearlyConsolidated(y);
                            return <TableCell key={y} className="text-right text-muted-foreground">
                              {formatMoney(data.expenseAdmin + data.expenseMarketing + data.expensePropertyOps + 
                                data.expenseUtilitiesVar + data.expenseUtilitiesFixed + data.expenseIT + 
                                data.expenseInsurance + data.expenseTaxes + data.expenseOtherCosts)}
                            </TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('opexOverhead') && (
                          <>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Admin & General</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(getYearlyConsolidated(y).expenseAdmin)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Marketing</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(getYearlyConsolidated(y).expenseMarketing)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Property Operations</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(getYearlyConsolidated(y).expensePropertyOps)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Utilities</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => {
                                const data = getYearlyConsolidated(y);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(data.expenseUtilitiesVar + data.expenseUtilitiesFixed)}</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">IT Systems</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(getYearlyConsolidated(y).expenseIT)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Insurance</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(getYearlyConsolidated(y).expenseInsurance)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Property Taxes</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(getYearlyConsolidated(y).expenseTaxes)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Other Expenses</TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground font-mono">{formatMoney(getYearlyConsolidated(y).expenseOtherCosts)}</TableCell>
                              ))}
                            </TableRow>
                          </>
                        )}
                      </>
                    )}
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card pl-8 text-xs text-muted-foreground italic">% of Total Revenue</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const data = getYearlyConsolidated(y);
                        const totalOpex = data.expenseRooms + data.expenseFB + data.expenseEvents + data.expenseOther + 
                          data.expenseMarketing + data.expensePropertyOps + data.expenseUtilitiesVar + 
                          data.expenseAdmin + data.expenseIT + data.expenseInsurance + data.expenseTaxes + 
                          data.expenseUtilitiesFixed + data.expenseOtherCosts;
                        const pct = data.revenueTotal > 0 ? (totalOpex / data.revenueTotal) * 100 : 0;
                        return <TableCell key={y} className="text-right text-xs text-muted-foreground italic font-mono">{pct.toFixed(1)}%</TableCell>;
                      })}
                    </TableRow>

                    <TableRow className="bg-accent/20 font-semibold">
                      <TableCell className="sticky left-0 bg-accent/20 label-text">Gross Operating Profit (GOP)</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => (
                        <TableCell key={y} className="text-right font-mono">{formatMoney(getYearlyConsolidated(y).gop)}</TableCell>
                      ))}
                    </TableRow>

                    <TableRow 
                      className="font-semibold bg-muted/30 cursor-pointer hover:bg-muted/40"
                      onClick={() => toggleRow('mgmtFees')}
                    >
                      <TableCell className="sticky left-0 bg-muted/30 flex items-center gap-2 label-text">
                        {expandedRows.has('mgmtFees') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Management Fees (to Hospitality Business Co.)
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const data = getYearlyConsolidated(y);
                        return <TableCell key={y} className="text-right font-mono">{formatMoney(data.feeBase + data.feeIncentive)}</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('mgmtFees') && (
                      <>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Base Fee (% of Revenue, per property)</TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground font-mono">{formatMoney(getYearlyConsolidated(y).feeBase)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Incentive Fee (% of GOP, per property)</TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground font-mono">{formatMoney(getYearlyConsolidated(y).feeIncentive)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/10"
                          onClick={(e) => { e.stopPropagation(); toggleRow('mgmtFeesByProperty'); }}
                        >
                          <TableCell className="sticky left-0 bg-card pl-8 flex items-center gap-2 text-muted-foreground">
                            {expandedRows.has('mgmtFeesByProperty') ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            By Property
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">-</TableCell>
                          ))}
                        </TableRow>
                        {expandedRows.has('mgmtFeesByProperty') && properties.map((prop, idx) => (
                          <TableRow key={prop.id} className="bg-muted/10">
                            <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">{prop.name}</TableCell>
                            {Array.from({ length: projectionYears }, (_, y) => {
                              const propData = getPropertyYearly(idx, y);
                              return (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">
                                  {formatMoney(propData.feeBase + propData.feeIncentive)}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </>
                    )}

                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">FF&E Reserve</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => (
                        <TableCell key={y} className="text-right text-muted-foreground font-mono">{formatMoney(getYearlyConsolidated(y).expenseFFE)}</TableCell>
                      ))}
                    </TableRow>

                    <TableRow className="bg-primary/10 font-bold">
                      <TableCell className="sticky left-0 bg-primary/10 flex items-center gap-1 label-text">
                        Net Operating Income (NOI)
                        <HelpTooltip text="NOI = Total Revenue - Operating Expenses. The property's income before debt service, taxes, and depreciation." manualSection="dashboard-kpis" />
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const noi = getYearlyConsolidated(y).noi;
                        return (
                          <TableCell key={y} className={`text-right ${noi < 0 ? 'text-destructive' : ''}`}>
                            {formatMoney(noi)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card text-muted-foreground">NOI Margin</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const data = getYearlyConsolidated(y);
                        const margin = data.revenueTotal > 0 ? (data.noi / data.revenueTotal) * 100 : 0;
                        return (
                          <TableCell key={y} className={`text-right text-muted-foreground ${margin < 0 ? 'text-destructive' : ''}`}>
                            {margin.toFixed(1)}%
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cashflow" className="mt-6 space-y-6">
            {/* Chart - Revenue & Operating Performance */}
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-background" />
              <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-secondary/8 blur-3xl" />
              </div>
              
              <CardHeader className="relative">
                <CardTitle className="text-[#2d4a5e] font-display">Revenue & Operating Performance</CardTitle>
                <p className="text-sm text-[#2d4a5e]/60 label-text">Revenue, Operating Costs, and NOI over 10 years</p>
              </CardHeader>
              
              <CardContent className="relative">
                <div className="bg-white/90 backdrop-blur-xl rounded-xl p-4 border border-primary/30 shadow-lg shadow-black/10">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={Array.from({ length: projectionYears }, (_, i) => {
                        const yearly = getYearlyConsolidated(i);
                        return {
                          year: getFiscalYear(i),
                          Revenue: yearly.revenueTotal,
                          'Operating Costs': yearly.totalExpenses,
                          NOI: yearly.noi
                        };
                      })}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid horizontal={true} vertical={false} stroke="rgba(45,74,94,0.15)" />
                      <XAxis dataKey="year" stroke="transparent" tick={{ fill: '#2d4a5e', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
                      <YAxis 
                        stroke="transparent" 
                        tick={{ fill: '#2d4a5e', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
                        tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatMoney(value)}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255,249,245,0.98)', 
                          border: '1px solid rgba(159,188,164,0.3)',
                          borderRadius: '12px',
                          color: '#2d4a5e'
                        }}
                        labelStyle={{ color: '#2d4a5e' }}
                      />
                      <Legend wrapperStyle={{ color: '#2d4a5e', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500 }} />
                      <Line type="natural" dataKey="Revenue" stroke="#7C3AED" strokeWidth={3} dot={{ r: 4, fill: '#7C3AED', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#7C3AED', stroke: '#fff', strokeWidth: 2 }} />
                      <Line type="natural" dataKey="Operating Costs" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }} />
                      <Line type="natural" dataKey="NOI" stroke="#257D41" strokeWidth={3} dot={{ r: 4, fill: '#257D41', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#257D41', stroke: '#fff', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart - Cash Flow After Financing */}
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-background" />
              <div className="absolute inset-0">
                <div className="absolute top-0 right-1/3 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-primary/8 blur-3xl" />
              </div>
              
              <CardHeader className="relative">
                <CardTitle className="text-[#2d4a5e] font-display">Cash Flow After Financing</CardTitle>
                <p className="text-sm text-[#2d4a5e]/60 label-text">NOI, Debt Service, and Net Cash Flow over 10 years</p>
              </CardHeader>
              
              <CardContent className="relative">
                <div className="bg-white/90 backdrop-blur-xl rounded-xl p-4 border border-primary/30 shadow-lg shadow-black/10">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={Array.from({ length: projectionYears }, (_, i) => {
                        const yearly = getYearlyConsolidated(i);
                        return {
                          year: getFiscalYear(i),
                          NOI: yearly.noi,
                          'Debt Service': yearly.debtPayment,
                          'Net Cash Flow': yearly.cashFlow
                        };
                      })}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid horizontal={true} vertical={false} stroke="rgba(45,74,94,0.15)" />
                      <XAxis dataKey="year" stroke="transparent" tick={{ fill: '#2d4a5e', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
                      <YAxis 
                        stroke="transparent" 
                        tick={{ fill: '#2d4a5e', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
                        tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatMoney(value)}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255,249,245,0.98)', 
                          border: '1px solid rgba(159,188,164,0.3)',
                          borderRadius: '12px',
                          color: '#2d4a5e'
                        }}
                        labelStyle={{ color: '#2d4a5e' }}
                      />
                      <Legend wrapperStyle={{ color: '#2d4a5e', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500 }} />
                      <Line type="natural" dataKey="NOI" stroke="#7C3AED" strokeWidth={3} dot={{ r: 4, fill: '#7C3AED', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#7C3AED', stroke: '#fff', strokeWidth: 2 }} />
                      <Line type="natural" dataKey="Debt Service" stroke="#DB2777" strokeWidth={3} dot={{ r: 4, fill: '#DB2777', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#DB2777', stroke: '#fff', strokeWidth: 2 }} />
                      <Line type="natural" dataKey="Net Cash Flow" stroke="#059669" strokeWidth={3} dot={{ r: 4, fill: '#059669', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#059669', stroke: '#fff', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consolidated Portfolio Cash Flow Statement ({projectionYears}-Year)</CardTitle>
                <p className="text-sm text-muted-foreground">All properties combined - shows cash available after debt service</p>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card min-w-[200px]">Category</TableHead>
                      {Array.from({ length: projectionYears }, (_, i) => (
                        <TableHead key={i} className="text-right min-w-[110px] font-mono">{getFiscalYear(i)}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow 
                      className="font-semibold bg-muted/20 cursor-pointer hover:bg-muted/30"
                      onClick={() => toggleRow('cfInflows')}
                    >
                      <TableCell className="sticky left-0 bg-muted/20 flex items-center gap-2">
                        {expandedRows.has('cfInflows') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Cash Inflows (Revenue)
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => (
                        <TableCell key={y} className="text-right font-mono">{formatMoney(getYearlyConsolidated(y).revenueTotal)}</TableCell>
                      ))}
                    </TableRow>
                    {expandedRows.has('cfInflows') && (
                      <>
                        <TableRow 
                          className="bg-muted/5 cursor-pointer hover:bg-muted/10"
                          onClick={(e) => { e.stopPropagation(); toggleRow('cfTotalRooms'); }}
                        >
                          <TableCell className="sticky left-0 bg-muted/5 pl-10 text-muted-foreground label-text flex items-center gap-2">
                            {expandedRows.has('cfTotalRooms') ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            Total Rooms Available
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground font-mono">{getWeightedMetrics(y).totalAvailableRoomNights.toLocaleString()}</TableCell>
                          ))}
                        </TableRow>
                        {expandedRows.has('cfTotalRooms') && properties.map((prop, idx) => (
                          <TableRow key={`cfTotalRooms-${prop.id}`} className="bg-blue-50/30">
                            <TableCell className="sticky left-0 bg-blue-50/30 pl-16 text-xs text-muted-foreground">{prop.name}</TableCell>
                            {Array.from({ length: projectionYears }, (_, y) => (
                              <TableCell key={y} className="text-right text-xs text-muted-foreground font-mono">
                                {getPropertyYearly(idx, y).availableRooms.toLocaleString()}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                        <TableRow 
                          className="bg-muted/5 cursor-pointer hover:bg-muted/10"
                          onClick={(e) => { e.stopPropagation(); toggleRow('cfAdr'); }}
                        >
                          <TableCell className="sticky left-0 bg-muted/5 pl-10 text-muted-foreground label-text flex items-center gap-2">
                            {expandedRows.has('cfAdr') ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            Wtd Avg ADR
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground font-mono">{formatMoney(getWeightedMetrics(y).weightedADR)}</TableCell>
                          ))}
                        </TableRow>
                        {expandedRows.has('cfAdr') && properties.map((prop, idx) => (
                          <TableRow key={`cfAdr-${prop.id}`} className="bg-blue-50/30">
                            <TableCell className="sticky left-0 bg-blue-50/30 pl-16 text-xs text-muted-foreground">{prop.name}</TableCell>
                            {Array.from({ length: projectionYears }, (_, y) => {
                              const py = getPropertyYearly(idx, y);
                              return <TableCell key={y} className="text-right text-xs text-muted-foreground font-mono">
                                {py.soldRooms > 0 ? formatMoney(py.revenueRooms / py.soldRooms) : "-"}
                              </TableCell>;
                            })}
                          </TableRow>
                        ))}
                        <TableRow 
                          className="bg-muted/5 cursor-pointer hover:bg-muted/10"
                          onClick={(e) => { e.stopPropagation(); toggleRow('cfOcc'); }}
                        >
                          <TableCell className="sticky left-0 bg-muted/5 pl-10 text-muted-foreground label-text flex items-center gap-2">
                            {expandedRows.has('cfOcc') ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            Wtd Avg Occupancy
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground font-mono">{(getWeightedMetrics(y).weightedOcc * 100).toFixed(1)}%</TableCell>
                          ))}
                        </TableRow>
                        {expandedRows.has('cfOcc') && properties.map((prop, idx) => (
                          <TableRow key={`cfOcc-${prop.id}`} className="bg-blue-50/30">
                            <TableCell className="sticky left-0 bg-blue-50/30 pl-16 text-xs text-muted-foreground">{prop.name}</TableCell>
                            {Array.from({ length: projectionYears }, (_, y) => {
                              const py = getPropertyYearly(idx, y);
                              return <TableCell key={y} className="text-right text-xs text-muted-foreground font-mono">
                                {py.availableRooms > 0 ? `${((py.soldRooms / py.availableRooms) * 100).toFixed(1)}%` : "0%"}
                              </TableCell>;
                            })}
                          </TableRow>
                        ))}
                        <TableRow 
                          className="bg-muted/5 cursor-pointer hover:bg-muted/10"
                          onClick={(e) => { e.stopPropagation(); toggleRow('cfRevpar'); }}
                        >
                          <TableCell className="sticky left-0 bg-muted/5 pl-10 text-muted-foreground label-text flex items-center gap-2">
                            {expandedRows.has('cfRevpar') ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            RevPAR
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground font-mono">{formatMoney(getWeightedMetrics(y).revPAR)}</TableCell>
                          ))}
                        </TableRow>
                        {expandedRows.has('cfRevpar') && properties.map((prop, idx) => (
                          <TableRow key={`cfRevpar-${prop.id}`} className="bg-blue-50/30">
                            <TableCell className="sticky left-0 bg-blue-50/30 pl-16 text-xs text-muted-foreground">{prop.name}</TableCell>
                            {Array.from({ length: projectionYears }, (_, y) => {
                              const py = getPropertyYearly(idx, y);
                              return <TableCell key={y} className="text-right text-xs text-muted-foreground font-mono">
                                {py.availableRooms > 0 ? formatMoney(py.revenueRooms / py.availableRooms) : "-"}
                              </TableCell>;
                            })}
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Room Revenue</TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground font-mono">{formatMoney(getYearlyConsolidated(y).revenueRooms)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Event Revenue</TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground font-mono">{formatMoney(getYearlyConsolidated(y).revenueEvents)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">F&B Revenue</TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground font-mono">{formatMoney(getYearlyConsolidated(y).revenueFB)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Other Revenue</TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground font-mono">{formatMoney(getYearlyConsolidated(y).revenueOther)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/10"
                          onClick={(e) => { e.stopPropagation(); toggleRow('cfInflowsByProperty'); }}
                        >
                          <TableCell className="sticky left-0 bg-card pl-8 flex items-center gap-2 text-muted-foreground">
                            {expandedRows.has('cfInflowsByProperty') ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            By Property
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">-</TableCell>
                          ))}
                        </TableRow>
                        {expandedRows.has('cfInflowsByProperty') && properties.map((prop, idx) => (
                          <TableRow key={prop.id} className="bg-muted/10">
                            <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">{prop.name}</TableCell>
                            {Array.from({ length: projectionYears }, (_, y) => (
                              <TableCell key={y} className="text-right text-sm text-muted-foreground">
                                {formatMoney(getPropertyYearly(idx, y).revenueTotal)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </>
                    )}

                    <TableRow 
                      className="font-semibold bg-muted/30 cursor-pointer hover:bg-muted/40"
                      onClick={() => toggleRow('cfOutflows')}
                    >
                      <TableCell className="sticky left-0 bg-muted/30 flex items-center gap-2">
                        {expandedRows.has('cfOutflows') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Cash Outflows (Operating)
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const data = getYearlyConsolidated(y);
                        const totalOpex = data.expenseRooms + data.expenseFB + data.expenseEvents + data.expenseOther + 
                          data.expenseMarketing + data.expensePropertyOps + data.expenseUtilitiesVar + 
                          data.expenseAdmin + data.expenseIT + data.expenseInsurance + data.expenseTaxes + 
                          data.expenseUtilitiesFixed + data.expenseOtherCosts;
                        return <TableCell key={y} className="text-right">({formatMoney(totalOpex)})</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('cfOutflows') && (
                      <>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/20"
                          onClick={(e) => { e.stopPropagation(); toggleRow('cfDirect'); }}
                        >
                          <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                            {expandedRows.has('cfDirect') ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            Direct Costs
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => {
                            const data = getYearlyConsolidated(y);
                            return <TableCell key={y} className="text-right text-muted-foreground">
                              ({formatMoney(data.expenseRooms + data.expenseFB + data.expenseEvents + data.expenseOther)})
                            </TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('cfDirect') && (
                          <>
                            {[
                              { key: 'cfExpRoom', label: 'Room Expense', field: 'expenseRooms' as const },
                              { key: 'cfExpFB', label: 'F&B Expense', field: 'expenseFB' as const },
                              { key: 'cfExpEvent', label: 'Event Expense', field: 'expenseEvents' as const },
                              { key: 'cfExpOther', label: 'Other Direct', field: 'expenseOther' as const },
                            ].map(item => (
                              <React.Fragment key={item.key}>
                                <TableRow 
                                  className="bg-muted/10 cursor-pointer hover:bg-muted/15"
                                  onClick={(e) => { e.stopPropagation(); toggleRow(item.key); }}
                                >
                                  <TableCell className="sticky left-0 bg-muted/10 pl-10 text-sm text-muted-foreground flex items-center gap-2">
                                    {expandedRows.has(item.key) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                    {item.label}
                                  </TableCell>
                                  {Array.from({ length: projectionYears }, (_, y) => (
                                    <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y)[item.field])})</TableCell>
                                  ))}
                                </TableRow>
                                {expandedRows.has(item.key) && properties.map((prop, idx) => (
                                  <TableRow key={`${item.key}-${prop.id}`} className="bg-blue-50/30">
                                    <TableCell className="sticky left-0 bg-blue-50/30 pl-16 text-xs text-muted-foreground">{prop.name}</TableCell>
                                    {Array.from({ length: projectionYears }, (_, y) => (
                                      <TableCell key={y} className="text-right text-xs text-muted-foreground font-mono">
                                        ({formatMoney(getPropertyYearly(idx, y)[item.field])})
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </React.Fragment>
                            ))}
                          </>
                        )}
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/20"
                          onClick={(e) => { e.stopPropagation(); toggleRow('cfOverhead'); }}
                        >
                          <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                            {expandedRows.has('cfOverhead') ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            Overhead & Admin
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => {
                            const data = getYearlyConsolidated(y);
                            return <TableCell key={y} className="text-right text-muted-foreground">
                              ({formatMoney(data.expenseAdmin + data.expenseMarketing + data.expensePropertyOps + 
                                data.expenseUtilitiesVar + data.expenseUtilitiesFixed + data.expenseIT + 
                                data.expenseInsurance + data.expenseTaxes + data.expenseOtherCosts)})
                            </TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('cfOverhead') && (
                          <>
                            {[
                              { key: 'cfExpAdmin', label: 'Admin & General', field: 'expenseAdmin' as const },
                              { key: 'cfExpMktg', label: 'Marketing', field: 'expenseMarketing' as const },
                              { key: 'cfExpPropOps', label: 'Property Operations', field: 'expensePropertyOps' as const },
                              { key: 'cfExpIT', label: 'IT Systems', field: 'expenseIT' as const },
                              { key: 'cfExpInsurance', label: 'Insurance', field: 'expenseInsurance' as const },
                              { key: 'cfExpTaxes', label: 'Property Taxes', field: 'expenseTaxes' as const },
                              { key: 'cfExpOtherCosts', label: 'Other Expenses', field: 'expenseOtherCosts' as const },
                            ].map(item => (
                              <React.Fragment key={item.key}>
                                <TableRow 
                                  className="bg-muted/10 cursor-pointer hover:bg-muted/15"
                                  onClick={(e) => { e.stopPropagation(); toggleRow(item.key); }}
                                >
                                  <TableCell className="sticky left-0 bg-muted/10 pl-10 text-sm text-muted-foreground flex items-center gap-2">
                                    {expandedRows.has(item.key) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                    {item.label}
                                  </TableCell>
                                  {Array.from({ length: projectionYears }, (_, y) => (
                                    <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y)[item.field])})</TableCell>
                                  ))}
                                </TableRow>
                                {expandedRows.has(item.key) && properties.map((prop, idx) => (
                                  <TableRow key={`${item.key}-${prop.id}`} className="bg-blue-50/30">
                                    <TableCell className="sticky left-0 bg-blue-50/30 pl-16 text-xs text-muted-foreground">{prop.name}</TableCell>
                                    {Array.from({ length: projectionYears }, (_, y) => (
                                      <TableCell key={y} className="text-right text-xs text-muted-foreground font-mono">
                                        ({formatMoney(getPropertyYearly(idx, y)[item.field])})
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </React.Fragment>
                            ))}
                            <TableRow 
                              className="bg-muted/10 cursor-pointer hover:bg-muted/15"
                              onClick={(e) => { e.stopPropagation(); toggleRow('cfExpUtilities'); }}
                            >
                              <TableCell className="sticky left-0 bg-muted/10 pl-10 text-sm text-muted-foreground flex items-center gap-2">
                                {expandedRows.has('cfExpUtilities') ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                Utilities
                              </TableCell>
                              {Array.from({ length: projectionYears }, (_, y) => {
                                const data = getYearlyConsolidated(y);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(data.expenseUtilitiesVar + data.expenseUtilitiesFixed)})</TableCell>;
                              })}
                            </TableRow>
                            {expandedRows.has('cfExpUtilities') && properties.map((prop, idx) => (
                              <TableRow key={`cfExpUtil-${prop.id}`} className="bg-blue-50/30">
                                <TableCell className="sticky left-0 bg-blue-50/30 pl-16 text-xs text-muted-foreground">{prop.name}</TableCell>
                                {Array.from({ length: projectionYears }, (_, y) => {
                                  const py = getPropertyYearly(idx, y);
                                  return <TableCell key={y} className="text-right text-xs text-muted-foreground font-mono">
                                    ({formatMoney(py.expenseUtilitiesVar + py.expenseUtilitiesFixed)})
                                  </TableCell>;
                                })}
                              </TableRow>
                            ))}
                          </>
                        )}
                      </>
                    )}
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card pl-8 text-xs text-muted-foreground italic">% of Total Revenue</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const data = getYearlyConsolidated(y);
                        const totalOpex = data.expenseRooms + data.expenseFB + data.expenseEvents + data.expenseOther + 
                          data.expenseMarketing + data.expensePropertyOps + data.expenseUtilitiesVar + 
                          data.expenseAdmin + data.expenseIT + data.expenseInsurance + data.expenseTaxes + 
                          data.expenseUtilitiesFixed + data.expenseOtherCosts;
                        const pct = data.revenueTotal > 0 ? (totalOpex / data.revenueTotal) * 100 : 0;
                        return <TableCell key={y} className="text-right text-xs text-muted-foreground italic font-mono">{pct.toFixed(1)}%</TableCell>;
                      })}
                    </TableRow>

                    <TableRow className="bg-accent/20 font-semibold">
                      <TableCell className="sticky left-0 bg-accent/20 label-text">Gross Operating Profit (GOP)</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => (
                        <TableCell key={y} className="text-right font-mono">{formatMoney(getYearlyConsolidated(y).gop)}</TableCell>
                      ))}
                    </TableRow>

                    <TableRow 
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => toggleRow('cfMgmtFees')}
                    >
                      <TableCell className="sticky left-0 bg-card flex items-center gap-2">
                        {expandedRows.has('cfMgmtFees') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Management Fees (to Hospitality Business Co.)
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const data = getYearlyConsolidated(y);
                        return <TableCell key={y} className="text-right text-muted-foreground">({formatMoney(data.feeBase + data.feeIncentive)})</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('cfMgmtFees') && (
                      <>
                        <TableRow 
                          className="bg-muted/10 cursor-pointer hover:bg-muted/15"
                          onClick={(e) => { e.stopPropagation(); toggleRow('cfFeeBase'); }}
                        >
                          <TableCell className="sticky left-0 bg-muted/10 pl-8 text-sm text-muted-foreground flex items-center gap-2">
                            {expandedRows.has('cfFeeBase') ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            Base Fee (% of Revenue, per property)
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => (
                            <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).feeBase)})</TableCell>
                          ))}
                        </TableRow>
                        {expandedRows.has('cfFeeBase') && properties.map((prop, idx) => (
                          <TableRow key={`cfFeeBase-${prop.id}`} className="bg-blue-50/30">
                            <TableCell className="sticky left-0 bg-blue-50/30 pl-16 text-xs text-muted-foreground">{prop.name}</TableCell>
                            {Array.from({ length: projectionYears }, (_, y) => (
                              <TableCell key={y} className="text-right text-xs text-muted-foreground font-mono">
                                ({formatMoney(getPropertyYearly(idx, y).feeBase)})
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                        <TableRow 
                          className="bg-muted/10 cursor-pointer hover:bg-muted/15"
                          onClick={(e) => { e.stopPropagation(); toggleRow('cfFeeIncentive'); }}
                        >
                          <TableCell className="sticky left-0 bg-muted/10 pl-8 text-sm text-muted-foreground flex items-center gap-2">
                            {expandedRows.has('cfFeeIncentive') ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            Incentive Fee (% of GOP, per property)
                          </TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => (
                            <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).feeIncentive)})</TableCell>
                          ))}
                        </TableRow>
                        {expandedRows.has('cfFeeIncentive') && properties.map((prop, idx) => (
                          <TableRow key={`cfFeeInc-${prop.id}`} className="bg-blue-50/30">
                            <TableCell className="sticky left-0 bg-blue-50/30 pl-16 text-xs text-muted-foreground">{prop.name}</TableCell>
                            {Array.from({ length: projectionYears }, (_, y) => (
                              <TableCell key={y} className="text-right text-xs text-muted-foreground font-mono">
                                ({formatMoney(getPropertyYearly(idx, y).feeIncentive)})
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </>
                    )}

                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">FF&E Reserve</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => (
                        <TableCell key={y} className="text-right text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expenseFFE)})</TableCell>
                      ))}
                    </TableRow>

                    <TableRow className="font-semibold bg-muted/20">
                      <TableCell className="sticky left-0 bg-muted/20 flex items-center gap-1 label-text">
                        Net Operating Income (NOI)
                        <HelpTooltip text="NOI = Total Revenue - Operating Expenses. The property's income before debt service, taxes, and depreciation." manualSection="dashboard-kpis" />
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const noi = getYearlyConsolidated(y).noi;
                        return (
                          <TableCell key={y} className={`text-right ${noi < 0 ? 'text-destructive' : ''}`}>
                            {formatMoney(noi)}
                          </TableCell>
                        );
                      })}
                    </TableRow>

                    <TableRow 
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => toggleRow('cfDebt')}
                    >
                      <TableCell className="sticky left-0 bg-card flex items-center gap-2">
                        {expandedRows.has('cfDebt') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Debt Service
                        <HelpTooltip text="Total debt payment including principal and interest. Paid to lenders before distributions to investors." manualSection="dashboard-kpis" />
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const debt = getYearlyConsolidated(y).debtPayment;
                        return <TableCell key={y} className="text-right text-muted-foreground">{debt > 0 ? `(${formatMoney(debt)})` : '-'}</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('cfDebt') && properties.filter(p => p.type === 'Financed').map((prop, idx) => {
                      const propIdx = properties.findIndex(p => p.id === prop.id);
                      return (
                        <TableRow key={prop.id} className="bg-muted/10">
                          <TableCell className="sticky left-0 bg-muted/10 pl-8 text-sm text-muted-foreground">{prop.name}</TableCell>
                          {Array.from({ length: projectionYears }, (_, y) => {
                            const debt = getPropertyYearly(propIdx, y).debtPayment;
                            return (
                              <TableCell key={y} className="text-right text-sm text-muted-foreground">
                                {debt > 0 ? `(${formatMoney(debt)})` : '-'}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}

                    <TableRow className="bg-primary/10 font-bold">
                      <TableCell className="sticky left-0 bg-primary/10 flex items-center gap-1">
                        Net Cash Flow
                        <HelpTooltip text="Cash available after debt service. For unlevered properties, equals NOI." manualSection="dashboard-kpis" />
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const cf = getYearlyConsolidated(y).cashFlow;
                        return (
                          <TableCell key={y} className={`text-right ${cf < 0 ? 'text-destructive' : ''}`}>
                            {formatMoney(cf)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/10"
                      onClick={() => toggleRow('cfByProperty')}
                    >
                      <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2 text-muted-foreground">
                        {expandedRows.has('cfByProperty') ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        By Property
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => (
                        <TableCell key={y} className="text-right text-muted-foreground">-</TableCell>
                      ))}
                    </TableRow>
                    {expandedRows.has('cfByProperty') && properties.map((prop, idx) => (
                      <TableRow key={prop.id} className="bg-muted/10">
                        <TableCell className="sticky left-0 bg-muted/10 pl-10 text-sm text-muted-foreground">{prop.name}</TableCell>
                        {Array.from({ length: projectionYears }, (_, y) => {
                          const cf = getPropertyYearly(idx, y).cashFlow;
                          return (
                            <TableCell key={y} className={`text-right text-sm ${cf < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {formatMoney(cf)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balance" className="mt-6">
            <ConsolidatedBalanceSheet 
              properties={properties} 
              global={global} 
              allProFormas={allPropertyFinancials.map(pf => ({ property: pf.property, data: pf.financials }))}
              year={projectionYears}
            />
          </TabsContent>

          <TabsContent value="investment" className="mt-6 space-y-6">
            <InvestmentAnalysis
              properties={properties}
              allPropertyFinancials={allPropertyFinancials}
              allPropertyYearlyCF={allPropertyYearlyCF}
              getPropertyYearly={getPropertyYearly}
              getYearlyConsolidated={getYearlyConsolidated}
              global={global}
              expandedRows={expandedRows}
              toggleRow={toggleRow}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

