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
 *   • Expandable rows drilling into per-property revenue and GOp
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
 * Export button at the dashboard level captures the active tab as PNG or PDF.
 */
import React, { useState, useRef, useCallback } from "react";
import Layout from "@/components/Layout";
import { useProperties, useGlobalAssumptions } from "@/lib/api";
import { getFiscalYearForModelYear } from "@/lib/financialEngine";
import { Tabs, TabsContent, CurrentThemeTab } from "@/components/ui/tabs";
import { LayoutDashboard, FileText, Banknote, Scale, TrendingUp as TrendingUpIcon, Loader2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PROJECTION_YEARS } from "@/lib/constants";
import { Dashboard3DBackground } from "@/components/Dashboard3DBackground";
import { AnimatedPage, ScrollReveal } from "@/components/graphics";
import { ExportMenu, pdfAction, pngAction } from "@/components/ui/export-toolbar";
import { exportTablePNG } from "@/lib/exports/pngExport";
import domtoimage from "dom-to-image-more";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { 
  usePortfolioFinancials, 
  OverviewTab, 
  IncomeStatementTab, 
  CashFlowTab, 
  BalanceSheetTab, 
  InvestmentAnalysisTab 
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
  
  const financials = usePortfolioFinancials(properties, global);
  
  const propertiesLoadingState = propertiesLoading || globalLoading;
  const propertiesErrorState = propertiesError || globalError || !properties || !global || !financials;

  const handleExportPNG = useCallback(() => {
    if (tabContentRef.current) {
      const label = TAB_LABELS[activeTab] || "Portfolio Dashboard";
      exportTablePNG({ element: tabContentRef.current, filename: `${label.toLowerCase().replace(/\s+/g, "-")}.png` });
    }
  }, [activeTab]);

  const handleExportPDF = useCallback(async () => {
    if (!tabContentRef.current) return;
    try {
      const label = TAB_LABELS[activeTab] || "Portfolio Dashboard";
      const dataUrl = await domtoimage.toPng(tabContentRef.current, { quality: 1, bgcolor: "#ffffff" });
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve) => { img.onload = () => resolve(); });
      const aspectRatio = img.width / img.height;
      const isLandscape = aspectRatio > 1;
      const doc = new jsPDF({ orientation: isLandscape ? "landscape" : "portrait", unit: "mm", format: "a4" });
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
      doc.save(`${label.toLowerCase().replace(/\s+/g, "-")}.pdf`);
    } catch {
      // silent — export failed
    }
  }, [activeTab]);

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
          <AlertTriangle className="w-8 h-8 text-destructive" />
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
      <Dashboard3DBackground />
      <AnimatedPage>
        <div className="relative z-10 max-w-[1600px] mx-auto space-y-8 pb-20">
          <PageHeader
            title="Portfolio Performance"
            subtitle="Consolidated financial oversight across all active assets"
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="mb-6 sticky top-4 z-50">
              <CurrentThemeTab 
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={[
                  { value: "overview", label: "Overview", icon: LayoutDashboard },
                  { value: "income", label: "Income Statement", icon: FileText },
                  { value: "cashflow", label: "Cash Flow", icon: Banknote },
                  { value: "balance", label: "Balance Sheet", icon: Scale },
                  { value: "investment", label: "Investment Analysis", icon: TrendingUpIcon },
                ]}
                rightContent={
                  <ExportMenu
                    actions={[
                      pdfAction(handleExportPDF),
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
    </Layout>
  );
}
