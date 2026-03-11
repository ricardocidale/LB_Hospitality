/**
 * Dashboard.tsx — Main portfolio dashboard and the default landing page after login.
 *
 * This is the most data-dense page in the application. It consolidates financial
 * data from ALL properties in the portfolio and presents:
 *
 * Overview tab:
 *   • KPI cards — total revenue, GOP, active properties, management fees,
 *     portfolio IRR, equity multiple, cash-on-cash return, projected exit value
 *   • Revenue breakdown donut chart (rooms, events, F&B, other)
 *   • Market distribution donut chart (geographic spread of properties)
 *   • Revenue vs NOI trend line chart
 *   • Investment overview panel (total investment, avg price, rooms, ADR, horizon)
 *
 * Income Statement tab:
 *   • Consolidated multi-year income statement across all properties
 *   • Expandable rows drilling into per-property revenue and GOP
 *   • Exports to PDF (with chart page), CSV, Excel, PowerPoint, PNG
 *
 * Cash Flow tab:
 *   • Three-section cash flow (operating, investing, financing)
 *   • Per-property drill-down and equity/debt contribution timeline
 *
 * Balance Sheet tab:
 *   • Consolidated balance sheet using the ConsolidatedBalanceSheet component
 *
 * Investment Analysis tab:
 *   • IRR, equity multiple, cash-on-cash, and sensitivity analysis
 *
 * All six export formats (PDF, Excel, CSV, PPTX, Chart PNG, Table PNG) are
 * available from the tab bar. Data generators live in dashboardExports.ts.
 */
import React, { useState, useRef, useCallback } from "react";
import Layout from "@/components/Layout";
import { useProperties, useGlobalAssumptions } from "@/lib/api";
import { getFiscalYearForModelYear } from "@/lib/financialEngine";
import { Tabs, TabsContent, CurrentThemeTab } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { IconAlertTriangle, IconDashboard, IconIncomeStatement, IconCashFlow, IconBalanceSheet, IconInvestment } from "@/components/icons";import { PageHeader } from "@/components/ui/page-header";
import { PROJECTION_YEARS } from "@/lib/constants";
import { AnimatedPage, ScrollReveal } from "@/components/graphics";
import { ExportMenu, pdfAction, excelAction, csvAction, pptxAction, chartAction, pngAction } from "@/components/ui/export-toolbar";
import { ExportDialog, type ExportVersion } from "@/components/ExportDialog";
import { exportTablePNG } from "@/lib/exports/pngExport";
import { exportPortfolioPPTX } from "@/lib/exports/pptxExport";
import domtoimage from "dom-to-image-more";
import jsPDF from "jspdf";
import { format } from "date-fns";
import {
  usePortfolioFinancials,
  OverviewTab,
  IncomeStatementTab,
  CashFlowTab,
  BalanceSheetTab,
  InvestmentAnalysisTab,
  generatePortfolioIncomeData,
  generatePortfolioCashFlowData,
  generatePortfolioInvestmentData,
  generatePortfolioBalanceSheetData,
  exportPortfolioExcel,
  exportPortfolioCSV,
  exportPortfolioPDF,
} from "@/components/dashboard";


const TAB_LABELS: Record<string, string> = {
  overview: "Portfolio Overview",
  income: "Consolidated Income Statement",
  cashflow: "Consolidated Cash Flow",
  balance: "Consolidated Balance Sheet",
  investment: "Investment Analysis",
};

export default function Dashboard() {
  const { data: properties, isLoading: propertiesLoading, isError: propertiesError } = useProperties();
  const { data: global, isLoading: globalLoading, isError: globalError } = useGlobalAssumptions();
  const [activeTab, setActiveTab] = useState("overview");
  const tabContentRef = useRef<HTMLDivElement>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<"pdf" | "chart">("pdf");

  const financials = usePortfolioFinancials(properties, global);

  const propertiesLoadingState = propertiesLoading || globalLoading;
  const propertiesErrorState = propertiesError || globalError || !properties || !global || !financials;

  const getExportData = useCallback((version?: ExportVersion) => {
    if (!financials || !properties || !global) return null;
    const projectionYears = global.projectionYears ?? PROJECTION_YEARS;
    const fiscalYearStartMonth = global.fiscalYearStartMonth ?? 1;
    const getFiscalYear = (i: number) => getFiscalYearForModelYear(global.modelStartDate, fiscalYearStartMonth, i);
    const isShort = version === "short";

    if (activeTab === "income" || activeTab === "overview") {
      return generatePortfolioIncomeData(financials.yearlyConsolidatedCache, projectionYears, getFiscalYear, isShort);
    } else if (activeTab === "cashflow") {
      const override = isShort ? new Set<string>() : new Set(["cfo", "cfi", "cff"]);
      return generatePortfolioCashFlowData(financials.allPropertyYearlyCF, projectionYears, getFiscalYear, override, isShort, properties.map(p => p.name));
    } else if (activeTab === "investment") {
      return generatePortfolioInvestmentData(financials, properties, projectionYears, getFiscalYear);
    }
    return generatePortfolioIncomeData(financials.yearlyConsolidatedCache, projectionYears, getFiscalYear, isShort);
  }, [activeTab, financials, properties, global]);

  const handleExportPNG = useCallback(() => {
    if (tabContentRef.current) {
      const label = TAB_LABELS[activeTab] || "Portfolio Dashboard";
      exportTablePNG({ element: tabContentRef.current, filename: `${label.toLowerCase().replace(/\s+/g, "-")}.png` });
    }
  }, [activeTab]);

  const handleExportChartPNG = useCallback(async () => {
    if (!tabContentRef.current) return;
    try {
      const label = TAB_LABELS[activeTab] || "Portfolio Dashboard";
      const dataUrl = await domtoimage.toPng(tabContentRef.current, { quality: 1, bgcolor: "#ffffff" });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${label.toLowerCase().replace(/\s+/g, "-")}-chart.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Chart PNG export failed:", error);
    }
  }, [activeTab]);

  const handleExportPDF = useCallback(() => {
    setExportType("pdf");
    setExportDialogOpen(true);
  }, []);

  const handleExportChart = useCallback(() => {
    setExportType("chart");
    setExportDialogOpen(true);
  }, []);

  const handleExportConfirm = useCallback((orientation: "landscape" | "portrait", version: ExportVersion) => {
    if (!financials || !global) return;
    const projectionYears = global.projectionYears ?? PROJECTION_YEARS;
    const fiscalYearStartMonth = global.fiscalYearStartMonth ?? 1;
    const getFiscalYear = (i: number) => getFiscalYearForModelYear(global.modelStartDate, fiscalYearStartMonth, i);

    if (exportType === "pdf") {
      const data = getExportData(version);
      if (!data) return;
      const label = TAB_LABELS[activeTab] || "Portfolio";
      exportPortfolioPDF(
        orientation,
        projectionYears,
        data.years,
        data.rows,
        (i) => financials.yearlyConsolidatedCache[i],
        label
      );
    } else if (exportType === "chart") {
      if (!tabContentRef.current) return;
      const label = TAB_LABELS[activeTab] || "Portfolio Dashboard";
      domtoimage.toPng(tabContentRef.current, { quality: 1, bgcolor: "#ffffff" }).then((dataUrl: string) => {
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
          const pageW = doc.internal.pageSize.getWidth();
          const pageH = doc.internal.pageSize.getHeight();
          const margin = 14;
          doc.setFontSize(16);
          doc.text(label, margin, 15);
          doc.setFontSize(9);
          doc.text(`Generated: ${format(new Date(), "MMM d, yyyy")}`, margin, 21);
          const availW = pageW - margin * 2;
          const availH = pageH - 30;
          let imgW = availW;
          let imgH = imgW / aspectRatio;
          if (imgH > availH) { imgH = availH; imgW = imgH * aspectRatio; }
          doc.addImage(dataUrl, "PNG", margin, 25, imgW, imgH);
          doc.save(`${label.toLowerCase().replace(/\s+/g, "-")}-chart.pdf`);
        };
      }).catch((err) => { console.error("Chart PDF export failed:", err); });
    }
  }, [exportType, activeTab, financials, global, getExportData]);

  const handleExportExcel = useCallback(() => {
    if (!financials || !global) return;
    const projectionYears = global.projectionYears ?? PROJECTION_YEARS;
    const fiscalYearStartMonth = global.fiscalYearStartMonth ?? 1;
    const getFiscalYear = (i: number) => getFiscalYearForModelYear(global.modelStartDate, fiscalYearStartMonth, i);

    const incomeData = generatePortfolioIncomeData(financials.yearlyConsolidatedCache, projectionYears, getFiscalYear);
    const cashFlowData = generatePortfolioCashFlowData(financials.allPropertyYearlyCF, projectionYears, getFiscalYear);
    exportPortfolioExcel(incomeData.years, incomeData.rows, cashFlowData.rows);
  }, [financials, global]);

  const handleExportCSV = useCallback(() => {
    const data = getExportData();
    if (!data) return;
    const label = TAB_LABELS[activeTab] || "portfolio";
    exportPortfolioCSV(data.years, data.rows, `${label.toLowerCase().replace(/\s+/g, "-")}.csv`);
  }, [activeTab, getExportData]);

  const handleExportPPTX = useCallback(() => {
    if (!financials || !properties || !global) return;
    const projectionYears = global.projectionYears ?? PROJECTION_YEARS;
    const fiscalYearStartMonth = global.fiscalYearStartMonth ?? 1;
    const getFiscalYear = (i: number) => getFiscalYearForModelYear(global.modelStartDate, fiscalYearStartMonth, i);

    const incomeData = generatePortfolioIncomeData(financials.yearlyConsolidatedCache, projectionYears, getFiscalYear);
    const cashFlowData = generatePortfolioCashFlowData(financials.allPropertyYearlyCF, projectionYears, getFiscalYear);
    const investmentData = generatePortfolioInvestmentData(financials, properties, projectionYears, getFiscalYear);

    const totalRooms = properties.reduce((sum, p) => sum + p.roomCount, 0);
    exportPortfolioPPTX({
      projectionYears,
      getFiscalYear,
      totalInitialEquity: financials.totalInitialEquity,
      totalExitValue: financials.totalExitValue,
      equityMultiple: financials.equityMultiple,
      portfolioIRR: financials.portfolioIRR,
      cashOnCash: financials.cashOnCash,
      totalProperties: properties.length,
      totalRooms,
      totalProjectionRevenue: financials.totalProjectionRevenue,
      totalProjectionNOI: financials.totalProjectionNOI,
      totalProjectionCashFlow: financials.totalProjectionCashFlow,
      incomeData: { years: incomeData.years.map(String), rows: incomeData.rows.map(r => ({ category: r.category, values: r.values, indent: r.indent, isBold: r.isHeader })) },
      cashFlowData: { years: cashFlowData.years.map(String), rows: cashFlowData.rows.map(r => ({ category: r.category, values: r.values, indent: r.indent, isBold: r.isHeader })) },
      balanceSheetData: { years: incomeData.years.map(String), rows: generatePortfolioBalanceSheetData(financials.allPropertyFinancials, projectionYears, getFiscalYear, global?.modelStartDate ? new Date(global.modelStartDate) : undefined).rows.map(r => ({ category: r.category, values: r.values, indent: r.indent, isBold: r.isHeader })) },
      investmentData: { years: investmentData.years.map(String), rows: investmentData.rows.map(r => ({ category: r.category, values: r.values, indent: r.indent, isBold: r.isHeader })) },
    });
  }, [financials, properties, global]);

  if (propertiesLoadingState) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (propertiesErrorState) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <IconAlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-muted-foreground">
            {!properties || !global || !financials
              ? "No data available. Please check the database."
              : "Failed to load dashboard data. Please try refreshing the page."}
          </p>
        </div>
      </Layout>
    );
  }

  const projectionYears = global.projectionYears ?? PROJECTION_YEARS;
  const fiscalYearStartMonth = global.fiscalYearStartMonth ?? 1;
  const getFiscalYear = (yearIndex: number) => getFiscalYearForModelYear(global.modelStartDate, fiscalYearStartMonth, yearIndex);
  const showCalcDetails = global.showCompanyCalculationDetails ?? true;

  const tabProps = {
    financials,
    properties,
    projectionYears,
    getFiscalYear,
    showCalcDetails,
    global
  };

  return (
    <Layout>
      <AnimatedPage>
        <div className="relative z-10 space-y-8">
          <PageHeader
            title="Portfolio Performance"
            subtitle="Consolidated financial oversight across all active assets"
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="mb-6 sticky top-12 z-10">
              <CurrentThemeTab
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={[
                  { value: "overview", label: "Overview", icon: IconDashboard },
                  { value: "income", label: "Income Statement", icon: IconIncomeStatement },
                  { value: "cashflow", label: "Cash Flow", icon: IconCashFlow },
                  { value: "balance", label: "Balance Sheet", icon: IconBalanceSheet },
                  { value: "investment", label: "Investment Analysis", icon: IconInvestment },
                ]}
                rightContent={
                  <ExportMenu
                    variant="light"
                    actions={[
                      pdfAction(handleExportPDF),
                      excelAction(handleExportExcel),
                      csvAction(handleExportCSV),
                      pptxAction(handleExportPPTX),
                      chartAction(handleExportChart),
                      pngAction(handleExportPNG, "button-export-dashboard-png"),
                    ]}
                  />
                }
              />
            </div>

            <ScrollReveal>
              <div ref={tabContentRef}>
                <TabsContent value="overview" className="mt-0 focus-visible:outline-none">
                  <OverviewTab {...tabProps} />
                </TabsContent>

                <TabsContent value="income" className="mt-0 focus-visible:outline-none">
                  <IncomeStatementTab {...tabProps} />
                </TabsContent>

                <TabsContent value="cashflow" className="mt-0 focus-visible:outline-none">
                  <CashFlowTab {...tabProps} />
                </TabsContent>

                <TabsContent value="balance" className="mt-0 focus-visible:outline-none">
                  <BalanceSheetTab {...tabProps} />
                </TabsContent>

                <TabsContent value="investment" className="mt-0 focus-visible:outline-none">
                  <InvestmentAnalysisTab {...tabProps} />
                </TabsContent>
              </div>
            </ScrollReveal>
          </Tabs>
        </div>
      </AnimatedPage>

      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExportConfirm}
        title={exportType === "pdf" ? "Export PDF" : "Export Chart as Image"}
        showVersionOption={exportType === "pdf"}
      />
    </Layout>
  );
}
