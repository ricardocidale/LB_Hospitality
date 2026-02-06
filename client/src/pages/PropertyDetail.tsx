import Layout from "@/components/Layout";
import { useProperty, useGlobalAssumptions } from "@/lib/api";
import { generatePropertyProForma, formatMoney, getFiscalYearForModelYear } from "@/lib/financialEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { YearlyIncomeStatement } from "@/components/YearlyIncomeStatement";
import { YearlyCashFlowStatement } from "@/components/YearlyCashFlowStatement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MapPin, Loader2, FileDown, FileSpreadsheet, Settings2, ImageIcon } from "lucide-react";
import domtoimage from 'dom-to-image-more';
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { GlassButton } from "@/components/ui/glass-button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { drawLineChart } from "@/lib/pdfChartDrawer";
import { calculateLoanParams, calculatePropertyYearlyCashFlows, LoanParams, GlobalLoanParams, DEFAULT_LTV } from "@/lib/loanCalculations";
import { PropertyPhotoUpload } from "@/components/PropertyPhotoUpload";
import { useQueryClient } from "@tanstack/react-query";
import { ExportDialog } from "@/components/ExportDialog";

import { useState, useRef } from "react";

export default function PropertyDetail() {
  const [, params] = useRoute("/property/:id");
  const propertyId = params?.id ? parseInt(params.id) : 0;
  const [activeTab, setActiveTab] = useState("income");
  const queryClient = useQueryClient();
  const incomeChartRef = useRef<HTMLDivElement>(null);
  const cashFlowChartRef = useRef<HTMLDivElement>(null);
  const incomeTableRef = useRef<HTMLDivElement>(null);
  const cashFlowTableRef = useRef<HTMLDivElement>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'chart' | 'tablePng'>('pdf');
  
  const { data: property, isLoading: propertyLoading } = useProperty(propertyId);
  const { data: global, isLoading: globalLoading } = useGlobalAssumptions();
  
  const handlePhotoUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId] });
  };

  if (propertyLoading || globalLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!property || !global) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <h2 className="text-2xl font-display">Property Not Found</h2>
          <Link href="/portfolio">
            <Button>Return to Portfolio</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const fiscalYearStartMonth = global.fiscalYearStartMonth ?? 1;
  const getFiscalYear = (yearIndex: number) => getFiscalYearForModelYear(global.modelStartDate, fiscalYearStartMonth, yearIndex);
  const financials = generatePropertyProForma(property, global, 120);
  
  const yearlyChartData = [];
  for (let y = 0; y < 10; y++) {
    const yearData = financials.slice(y * 12, (y + 1) * 12);
    if (yearData.length === 0) continue;
    yearlyChartData.push({
      year: String(getFiscalYear(y)),
      Revenue: yearData.reduce((a, m) => a + m.revenueTotal, 0),
      GOP: yearData.reduce((a, m) => a + m.gop, 0),
      NOI: yearData.reduce((a, m) => a + m.noi, 0),
      CashFlow: yearData.reduce((a, m) => a + m.cashFlow, 0),
    });
  }

  const years = 10;
  const startYear = getFiscalYear(0);
  
  const getYearlyDetails = () => {
    const result = [];
    for (let y = 0; y < years; y++) {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      result.push({
        revenueRooms: yearData.reduce((a, m) => a + m.revenueRooms, 0),
        revenueEvents: yearData.reduce((a, m) => a + m.revenueEvents, 0),
        revenueFB: yearData.reduce((a, m) => a + m.revenueFB, 0),
        revenueOther: yearData.reduce((a, m) => a + m.revenueOther, 0),
        totalRevenue: yearData.reduce((a, m) => a + m.revenueTotal, 0),
        expenseRooms: yearData.reduce((a, m) => a + m.expenseRooms, 0),
        expenseFB: yearData.reduce((a, m) => a + m.expenseFB, 0),
        expenseEvents: yearData.reduce((a, m) => a + m.expenseEvents, 0),
        expenseMarketing: yearData.reduce((a, m) => a + m.expenseMarketing, 0),
        expensePropertyOps: yearData.reduce((a, m) => a + m.expensePropertyOps, 0),
        expenseUtilitiesVar: yearData.reduce((a, m) => a + m.expenseUtilitiesVar, 0),
        expenseUtilitiesFixed: yearData.reduce((a, m) => a + m.expenseUtilitiesFixed, 0),
        expenseFFE: yearData.reduce((a, m) => a + m.expenseFFE, 0),
        expenseAdmin: yearData.reduce((a, m) => a + m.expenseAdmin, 0),
        expenseIT: yearData.reduce((a, m) => a + m.expenseIT, 0),
        expenseInsurance: yearData.reduce((a, m) => a + m.expenseInsurance, 0),
        expenseTaxes: yearData.reduce((a, m) => a + m.expenseTaxes, 0),
        expenseOther: yearData.reduce((a, m) => a + m.expenseOtherCosts, 0),
        feeBase: yearData.reduce((a, m) => a + m.feeBase, 0),
        feeIncentive: yearData.reduce((a, m) => a + m.feeIncentive, 0),
        totalExpenses: yearData.reduce((a, m) => a + m.totalExpenses, 0),
        noi: yearData.reduce((a, m) => a + m.noi, 0),
      });
    }
    return result;
  };

  const getCashFlowData = () => {
    const yearlyNOIData = [];
    for (let y = 0; y < years; y++) {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      yearlyNOIData.push(yearData.reduce((a, m) => a + m.noi, 0));
    }
    return calculatePropertyYearlyCashFlows(yearlyNOIData, property as LoanParams, global as GlobalLoanParams, years);
  };

  const exportCashFlowCSV = () => {
    const yearlyDetails = getYearlyDetails();
    const cashFlowData = getCashFlowData();
    const headers = ["Line Item", ...Array.from({length: years}, (_, i) => `FY ${startYear + i}`)];
    
    const rows = [
      ["REVENUE"],
      ["Room Revenue", ...yearlyDetails.map(y => y.revenueRooms.toFixed(0))],
      ["Event Revenue", ...yearlyDetails.map(y => y.revenueEvents.toFixed(0))],
      ["F&B Revenue", ...yearlyDetails.map(y => y.revenueFB.toFixed(0))],
      ["Other Revenue", ...yearlyDetails.map(y => y.revenueOther.toFixed(0))],
      ["Total Revenue", ...yearlyDetails.map(y => y.totalRevenue.toFixed(0))],
      [""],
      ["OPERATING EXPENSES"],
      ["Room Expense", ...yearlyDetails.map(y => y.expenseRooms.toFixed(0))],
      ["F&B Expense", ...yearlyDetails.map(y => y.expenseFB.toFixed(0))],
      ["Event Expense", ...yearlyDetails.map(y => y.expenseEvents.toFixed(0))],
      ["Marketing", ...yearlyDetails.map(y => y.expenseMarketing.toFixed(0))],
      ["Property Operations", ...yearlyDetails.map(y => y.expensePropertyOps.toFixed(0))],
      ["Utilities (Variable)", ...yearlyDetails.map(y => y.expenseUtilitiesVar.toFixed(0))],
      ["Utilities (Fixed)", ...yearlyDetails.map(y => y.expenseUtilitiesFixed.toFixed(0))],
      ["FF&E Reserve", ...yearlyDetails.map(y => y.expenseFFE.toFixed(0))],
      ["Administrative", ...yearlyDetails.map(y => y.expenseAdmin.toFixed(0))],
      ["IT Systems", ...yearlyDetails.map(y => y.expenseIT.toFixed(0))],
      ["Insurance", ...yearlyDetails.map(y => y.expenseInsurance.toFixed(0))],
      ["Property Taxes", ...yearlyDetails.map(y => y.expenseTaxes.toFixed(0))],
      ["Other Expenses", ...yearlyDetails.map(y => y.expenseOther.toFixed(0))],
      ["Base Management Fee", ...yearlyDetails.map(y => y.feeBase.toFixed(0))],
      ["Incentive Management Fee", ...yearlyDetails.map(y => y.feeIncentive.toFixed(0))],
      ["Total Operating Expenses", ...yearlyDetails.map(y => y.totalExpenses.toFixed(0))],
      [""],
      ["Net Operating Income (NOI)", ...cashFlowData.map(y => y.noi.toFixed(0))],
      ["Less: Interest Expense", ...cashFlowData.map(y => (-y.interestExpense).toFixed(0))],
      ["Less: Depreciation", ...cashFlowData.map(y => (-y.depreciation).toFixed(0))],
      ["Less: Income Tax", ...cashFlowData.map(y => (-y.taxLiability).toFixed(0))],
      ["Net Income", ...cashFlowData.map(y => y.netIncome.toFixed(0))],
      [""],
      ["Add: Depreciation", ...cashFlowData.map(y => y.depreciation.toFixed(0))],
      ["Operating Cash Flow", ...cashFlowData.map(y => y.operatingCashFlow.toFixed(0))],
      ["Working Capital Changes", ...cashFlowData.map(y => (-y.workingCapitalChange).toFixed(0))],
      ["Cash from Operations", ...cashFlowData.map(y => y.cashFromOperations.toFixed(0))],
      [""],
      ["Free Cash Flow (FCF)", ...cashFlowData.map(y => y.freeCashFlow.toFixed(0))],
      ["Less: Principal Payment", ...cashFlowData.map(y => (-y.principalPayment).toFixed(0))],
      ["Free Cash Flow to Equity (FCFE)", ...cashFlowData.map(y => y.freeCashFlowToEquity.toFixed(0))],
      [""],
      ["Initial Equity Investment", ...cashFlowData.map(y => y.capitalExpenditures.toFixed(0))],
      ["Refinancing Proceeds", ...cashFlowData.map(y => y.refinancingProceeds.toFixed(0))],
      ["Exit Value", ...cashFlowData.map(y => y.exitValue.toFixed(0))],
      ["Net Cash Flow to Investors", ...cashFlowData.map(y => y.netCashFlowToInvestors.toFixed(0))],
      ["Cumulative Cash Flow", ...cashFlowData.map(y => y.cumulativeCashFlow.toFixed(0))],
    ];

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${property.name.replace(/\s+/g, '_')}_CashFlow.csv`);
    link.click();
  };

  const exportCashFlowPDF = async (orientation: 'landscape' | 'portrait' = 'landscape') => {
    const yearlyDetails = getYearlyDetails();
    const cashFlowData = getCashFlowData();
    const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
    const pageWidth = orientation === 'landscape' ? 297 : 210;
    const chartWidth = pageWidth - 28;
    
    doc.setFontSize(16);
    doc.text(`${property.name} - Cash Flow Statement`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);
    
    // Table starts after header
    const chartStartY = 28;

    const headers = [["Line Item", ...Array.from({length: years}, (_, i) => `FY ${startYear + i}`)]];
    
    const fmtNum = (n: number) => n === 0 ? "-" : formatMoney(n);
    
    const body = [
      [{ content: "REVENUE", colSpan: years + 1, styles: { fontStyle: "bold", fillColor: [230, 230, 230] } }],
      ["Room Revenue", ...yearlyDetails.map(y => fmtNum(y.revenueRooms))],
      ["Event Revenue", ...yearlyDetails.map(y => fmtNum(y.revenueEvents))],
      ["F&B Revenue", ...yearlyDetails.map(y => fmtNum(y.revenueFB))],
      ["Other Revenue", ...yearlyDetails.map(y => fmtNum(y.revenueOther))],
      [{ content: "Total Revenue", styles: { fontStyle: "bold" } }, ...yearlyDetails.map(y => ({ content: fmtNum(y.totalRevenue), styles: { fontStyle: "bold" } }))],
      [{ content: "OPERATING EXPENSES", colSpan: years + 1, styles: { fontStyle: "bold", fillColor: [230, 230, 230] } }],
      ["Room Expense", ...yearlyDetails.map(y => fmtNum(y.expenseRooms))],
      ["F&B Expense", ...yearlyDetails.map(y => fmtNum(y.expenseFB))],
      ["Event Expense", ...yearlyDetails.map(y => fmtNum(y.expenseEvents))],
      ["Marketing", ...yearlyDetails.map(y => fmtNum(y.expenseMarketing))],
      ["Property Operations", ...yearlyDetails.map(y => fmtNum(y.expensePropertyOps))],
      ["Utilities (Variable)", ...yearlyDetails.map(y => fmtNum(y.expenseUtilitiesVar))],
      ["Utilities (Fixed)", ...yearlyDetails.map(y => fmtNum(y.expenseUtilitiesFixed))],
      ["FF&E Reserve", ...yearlyDetails.map(y => fmtNum(y.expenseFFE))],
      ["Administrative", ...yearlyDetails.map(y => fmtNum(y.expenseAdmin))],
      ["IT Systems", ...yearlyDetails.map(y => fmtNum(y.expenseIT))],
      ["Insurance", ...yearlyDetails.map(y => fmtNum(y.expenseInsurance))],
      ["Property Taxes", ...yearlyDetails.map(y => fmtNum(y.expenseTaxes))],
      ["Other Expenses", ...yearlyDetails.map(y => fmtNum(y.expenseOther))],
      ["Base Management Fee", ...yearlyDetails.map(y => fmtNum(y.feeBase))],
      ["Incentive Management Fee", ...yearlyDetails.map(y => fmtNum(y.feeIncentive))],
      [{ content: "Total Operating Expenses", styles: { fontStyle: "bold" } }, ...yearlyDetails.map(y => ({ content: fmtNum(y.totalExpenses), styles: { fontStyle: "bold" } }))],
      [{ content: "NET INCOME", colSpan: years + 1, styles: { fontStyle: "bold", fillColor: [230, 230, 230] } }],
      [{ content: "Net Operating Income (NOI)", styles: { fontStyle: "bold" } }, ...cashFlowData.map(y => ({ content: fmtNum(y.noi), styles: { fontStyle: "bold" } }))],
      ["Less: Interest Expense", ...cashFlowData.map(y => fmtNum(-y.interestExpense))],
      ["Less: Depreciation", ...cashFlowData.map(y => fmtNum(-y.depreciation))],
      ["Less: Income Tax", ...cashFlowData.map(y => fmtNum(-y.taxLiability))],
      [{ content: "Net Income", styles: { fontStyle: "bold" } }, ...cashFlowData.map(y => ({ content: fmtNum(y.netIncome), styles: { fontStyle: "bold" } }))],
      [{ content: "OPERATING CASH FLOW", colSpan: years + 1, styles: { fontStyle: "bold", fillColor: [230, 230, 230] } }],
      ["Add: Depreciation", ...cashFlowData.map(y => fmtNum(y.depreciation))],
      [{ content: "Operating Cash Flow", styles: { fontStyle: "bold" } }, ...cashFlowData.map(y => ({ content: fmtNum(y.operatingCashFlow), styles: { fontStyle: "bold" } }))],
      ["Working Capital Changes", ...cashFlowData.map(y => fmtNum(-y.workingCapitalChange))],
      [{ content: "Cash from Operations", styles: { fontStyle: "bold" } }, ...cashFlowData.map(y => ({ content: fmtNum(y.cashFromOperations), styles: { fontStyle: "bold" } }))],
      [{ content: "FREE CASH FLOW", colSpan: years + 1, styles: { fontStyle: "bold", fillColor: [230, 230, 230] } }],
      [{ content: "Free Cash Flow (FCF)", styles: { fontStyle: "bold" } }, ...cashFlowData.map(y => ({ content: fmtNum(y.freeCashFlow), styles: { fontStyle: "bold" } }))],
      ["Less: Principal Payment", ...cashFlowData.map(y => fmtNum(-y.principalPayment))],
      [{ content: "Free Cash Flow to Equity (FCFE)", styles: { fontStyle: "bold" } }, ...cashFlowData.map(y => ({ content: fmtNum(y.freeCashFlowToEquity), styles: { fontStyle: "bold" } }))],
      [{ content: "INVESTOR CASH FLOWS", colSpan: years + 1, styles: { fontStyle: "bold", fillColor: [230, 230, 230] } }],
      ["Initial Equity Investment", ...cashFlowData.map(y => fmtNum(y.capitalExpenditures))],
      ["Refinancing Proceeds", ...cashFlowData.map(y => fmtNum(y.refinancingProceeds))],
      ["Exit Value", ...cashFlowData.map(y => fmtNum(y.exitValue))],
      [{ content: "Net Cash Flow to Investors", styles: { fontStyle: "bold" } }, ...cashFlowData.map(y => ({ content: fmtNum(y.netCashFlowToInvestors), styles: { fontStyle: "bold" } }))],
      [{ content: "Cumulative Cash Flow", styles: { fontStyle: "bold" } }, ...cashFlowData.map(y => ({ content: fmtNum(y.cumulativeCashFlow), styles: { fontStyle: "bold" } }))],
    ];

    // Build column styles with right alignment for all numeric columns
    const colStyles: Record<number, any> = { 0: { cellWidth: 45, halign: 'left' } };
    for (let i = 1; i <= years; i++) {
      colStyles[i] = { halign: 'right' };
    }

    autoTable(doc, {
      head: headers,
      body: body as any,
      startY: chartStartY,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [159, 188, 164], textColor: [61, 61, 61], fontStyle: "bold", halign: 'center' },
      columnStyles: colStyles,
    });

    // Add chart on separate page at the end
    if (yearlyChartData && yearlyChartData.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text(`${property.name} - Performance Chart`, 14, 15);
      doc.setFontSize(10);
      
      // Choose chart series based on active tab
      const chartSeries = activeTab === "cashflow" ? [
        {
          name: 'Revenue',
          data: yearlyChartData.map((d: any) => ({ label: d.year, value: d.Revenue })),
          color: '#257D41'
        },
        {
          name: 'NOI',
          data: yearlyChartData.map((d: any) => ({ label: d.year, value: d.NOI })),
          color: '#3B82F6'
        },
        {
          name: 'Cash Flow',
          data: yearlyChartData.map((d: any) => ({ label: d.year, value: d.CashFlow })),
          color: '#F4795B'
        }
      ] : [
        {
          name: 'Revenue',
          data: yearlyChartData.map((d: any) => ({ label: d.year, value: d.Revenue })),
          color: '#257D41'
        },
        {
          name: 'GOP',
          data: yearlyChartData.map((d: any) => ({ label: d.year, value: d.GOP })),
          color: '#3B82F6'
        },
        {
          name: 'NOI',
          data: yearlyChartData.map((d: any) => ({ label: d.year, value: d.NOI })),
          color: '#F4795B'
        }
      ];
      
      const chartTitle = activeTab === "cashflow" 
        ? '10-Year Revenue, NOI, and Cash Flow Trend'
        : '10-Year Revenue, GOP, and NOI Trend';
      doc.text(chartTitle, 14, 22);
      
      drawLineChart({
        doc,
        x: 14,
        y: 30,
        width: chartWidth,
        height: 150,
        title: `${property.name} - Financial Performance (10-Year Projection)`,
        series: chartSeries
      });
    }

    doc.save(`${property.name.replace(/\s+/g, '_')}_CashFlow.pdf`);
  };

  const getStatusLabel = (status: string) => {
    if (status === "Operational") return "Active";
    if (status === "Development") return "Planned";
    return status;
  };

  const exportChartPNG = async (orientation: 'landscape' | 'portrait' = 'landscape') => {
    const chartContainer = activeTab === "cashflow" ? cashFlowChartRef.current : incomeChartRef.current;
    if (!chartContainer) return;
    try {
      const width = orientation === 'landscape' ? 1200 : 800;
      const height = orientation === 'landscape' ? 600 : 1000;
      
      const dataUrl = await domtoimage.toPng(chartContainer, {
        bgcolor: '#ffffff',
        quality: 1,
        width,
        height,
        style: { transform: 'scale(2)', transformOrigin: 'top left' }
      });
      const link = document.createElement('a');
      link.download = `${property.name.replace(/\s+/g, '_')}_chart_${orientation}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error exporting chart:', error);
    }
  };

  const exportTablePNG = async (orientation: 'landscape' | 'portrait' = 'landscape') => {
    const tableContainer = activeTab === "cashflow" ? cashFlowTableRef.current : incomeTableRef.current;
    if (!tableContainer) return;
    try {
      const scale = 2;
      const dataUrl = await domtoimage.toPng(tableContainer, {
        bgcolor: '#ffffff',
        quality: 1,
        style: { transform: `scale(${scale})`, transformOrigin: 'top left' },
        width: tableContainer.scrollWidth * scale,
        height: tableContainer.scrollHeight * scale,
      });
      const link = document.createElement('a');
      link.download = `${property.name.replace(/\s+/g, '_')}_${activeTab}_table.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error exporting table:', error);
    }
  };

  const handleExport = (orientation: 'landscape' | 'portrait') => {
    if (exportType === 'pdf') {
      exportCashFlowPDF(orientation);
    } else if (exportType === 'tablePng') {
      exportTablePNG(orientation);
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
        {/* Liquid Glass Header */}
        <div className="relative overflow-hidden rounded-3xl">
          {/* Property Image */}
          <div className="relative h-[280px]">
            <img src={property.imageUrl.startsWith("/objects/") ? property.imageUrl : property.imageUrl} alt={property.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <PropertyPhotoUpload 
              propertyId={propertyId} 
              currentImageUrl={property.imageUrl}
              onUploadComplete={handlePhotoUploadComplete}
            />
          </div>
          
          {/* Liquid Glass Info Bar */}
          <div className="relative overflow-hidden p-6">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e]" />
            {/* Top Edge Sheen */}
            <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            {/* Floating Color Orbs */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-[#9FBCA4]/25 blur-3xl" />
              <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full bg-[#9FBCA4]/15 blur-3xl" />
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/portfolio">
                  <button className="relative overflow-hidden p-2 text-white rounded-xl transition-all duration-300 group/back">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-xl" />
                    <div className="absolute inset-0 rounded-xl border border-white/20 group-hover/back:border-white/40 transition-all duration-300" />
                    <ArrowLeft className="relative w-5 h-5" />
                  </button>
                </Link>
                <div>
                  <h1 className="text-2xl font-display text-[#FFF9F5]">{property.name}</h1>
                  <div className="flex items-center gap-4 text-[#FFF9F5]/70 text-sm mt-1 label-text">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {property.location}</span>
                    <span className="font-mono">{property.roomCount} Rooms</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/15 border border-white/25 text-white text-xs">
                      {getStatusLabel(property.status)}
                    </span>
                  </div>
                </div>
              </div>
              
              <Link href={`/property/${propertyId}/edit`}>
                <button className="relative overflow-hidden px-4 py-2 text-sm font-medium text-white rounded-xl transition-all duration-300 group/edit flex items-center gap-2">
                  <div className="absolute inset-0 bg-white/12 backdrop-blur-xl rounded-xl" />
                  <div className="absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                  <div className="absolute inset-0 rounded-xl border border-white/25 group-hover/edit:border-white/40 transition-all duration-300" />
                  <div className="absolute inset-0 rounded-xl shadow-[0_0_20px_rgba(159,188,164,0.3)] group-hover/edit:shadow-[0_0_30px_rgba(159,188,164,0.5)] transition-all duration-300" />
                  <Settings2 className="relative w-4 h-4" />
                  <span className="relative">Assumptions</span>
                </button>
              </Link>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            {/* Liquid Glass Tabs - Match Sidebar */}
            <div className="relative overflow-hidden rounded-2xl">
              {/* Match sidebar gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e]" />
              {/* Top highlight like sidebar */}
              <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              {/* Border like sidebar */}
              <div className="absolute inset-0 rounded-2xl border border-white/15" />
              <div className="relative flex flex-wrap gap-1 p-1.5">
                <button
                  onClick={() => setActiveTab("income")}
                  className={`relative overflow-hidden px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                    activeTab === "income" ? "text-white" : "text-[#FFF9F5]/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {activeTab === "income" && (
                    <>
                      <div className="absolute inset-0 bg-white/12 backdrop-blur-xl rounded-xl" />
                      <div className="absolute inset-0 rounded-xl border border-white/20" />
                      <div className="absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    </>
                  )}
                  <span className="relative">Income Statement</span>
                </button>
                <button
                  onClick={() => setActiveTab("cashflow")}
                  className={`relative overflow-hidden px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                    activeTab === "cashflow" ? "text-white" : "text-[#FFF9F5]/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {activeTab === "cashflow" && (
                    <>
                      <div className="absolute inset-0 bg-white/12 backdrop-blur-xl rounded-xl" />
                      <div className="absolute inset-0 rounded-xl border border-white/20" />
                      <div className="absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    </>
                  )}
                  <span className="relative">Cash Flows</span>
                </button>
              </div>
            </div>
            
            {/* Export Buttons */}
            <div className="flex gap-2">
              <GlassButton
                variant="export"
                size="sm"
                onClick={() => { setExportType('pdf'); setExportDialogOpen(true); }}
                data-testid="button-export-pdf"
              >
                <FileDown className="w-4 h-4" />
                Export PDF
              </GlassButton>
              <GlassButton
                variant="export"
                size="sm"
                onClick={() => exportCashFlowCSV()}
                data-testid="button-export-csv"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export CSV
              </GlassButton>
              <GlassButton
                variant="export"
                size="sm"
                onClick={() => { setExportType('chart'); setExportDialogOpen(true); }}
                data-testid="button-export-chart"
              >
                <ImageIcon className="w-4 h-4" />
                Export Chart
              </GlassButton>
              <GlassButton
                variant="export"
                size="sm"
                onClick={() => exportTablePNG()}
                data-testid="button-export-table-png"
              >
                <ImageIcon className="w-4 h-4" />
                Export PNG
              </GlassButton>
            </div>
          </div>
          
          <TabsContent value="income" className="mt-6 space-y-6">
            {/* Income Statement Chart Card - Light Theme */}
            <div ref={incomeChartRef} className="relative overflow-hidden rounded-3xl p-6 bg-white shadow-lg border border-gray-100">
              <div className="relative">
                <h3 className="text-lg font-display text-gray-900 mb-4">Income Statement Trends (10-Year Projection)</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={yearlyChartData}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#257D41" />
                          <stop offset="100%" stopColor="#34D399" />
                        </linearGradient>
                        <linearGradient id="gopGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#60A5FA" />
                        </linearGradient>
                        <linearGradient id="noiGradient" x1="0" y1="0" x2="1" y2="0">
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
                        stroke="url(#revenueGradient)" 
                        strokeWidth={3}
                        dot={{ fill: '#257D41', stroke: '#fff', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#257D41', stroke: '#fff', strokeWidth: 2 }}
                        name="Total Revenue"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="GOP" 
                        stroke="url(#gopGradient)" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', stroke: '#fff', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                        name="Gross Operating Profit"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="NOI" 
                        stroke="url(#noiGradient)" 
                        strokeWidth={3}
                        dot={{ fill: '#F4795B', stroke: '#fff', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#F4795B', stroke: '#fff', strokeWidth: 2 }}
                        name="Net Operating Income"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div ref={incomeTableRef}>
              <YearlyIncomeStatement data={financials} years={10} startYear={getFiscalYear(0)} />
            </div>
          </TabsContent>
          
          <TabsContent value="cashflow" className="mt-6 space-y-6">
            {/* Cash Flow Chart Card - Light Theme */}
            <div ref={cashFlowChartRef} className="relative overflow-hidden rounded-3xl p-6 bg-white shadow-lg border border-gray-100">
              <div className="relative">
                <h3 className="text-lg font-display text-gray-900 mb-4">Cash Flow Trends (10-Year Projection)</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={yearlyChartData.map((d, i) => {
                      const cfData = getCashFlowData();
                      return {
                        ...d,
                        FCF: cfData[i]?.freeCashFlow || 0,
                        FCFE: cfData[i]?.freeCashFlowToEquity || 0,
                        NetToInvestors: cfData[i]?.netCashFlowToInvestors || 0,
                      };
                    })}>
                      <defs>
                        <linearGradient id="noiCfGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#257D41" />
                          <stop offset="100%" stopColor="#34D399" />
                        </linearGradient>
                        <linearGradient id="fcfGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#60A5FA" />
                        </linearGradient>
                        <linearGradient id="fcfeGradient" x1="0" y1="0" x2="1" y2="0">
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
                        dataKey="NOI" 
                        stroke="url(#noiCfGradient)" 
                        strokeWidth={3}
                        dot={{ fill: '#257D41', stroke: '#fff', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#257D41', stroke: '#fff', strokeWidth: 2 }}
                        name="Net Operating Income"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="FCF" 
                        stroke="url(#fcfGradient)" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', stroke: '#fff', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                        name="Free Cash Flow"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="FCFE" 
                        stroke="url(#fcfeGradient)" 
                        strokeWidth={3}
                        dot={{ fill: '#F4795B', stroke: '#fff', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#F4795B', stroke: '#fff', strokeWidth: 2 }}
                        name="Free Cash Flow to Equity"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div ref={cashFlowTableRef}>
              <YearlyCashFlowStatement 
                data={financials} 
                property={property} 
                global={global}
                years={10} 
                startYear={getFiscalYear(0)} 
                defaultLTV={global.debtAssumptions?.acqLTV ?? DEFAULT_LTV}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
