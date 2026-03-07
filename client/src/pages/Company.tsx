/**
 * Company — Management company financial statements page
 *
 * Displays four tabs of the management company P&L and supporting analysis:
 *   Income        — Revenue (base + incentive fees), Cost of Services, G&A,
 *                   partner comp, staff costs, net income over the projection.
 *   Cash Flow     — GAAP indirect-method statement: OCF, investing, financing.
 *   Balance Sheet — Assets, liabilities, equity for the management entity.
 *   Investment    — IRR, equity multiple, DCF, and SAFE funding waterfall.
 *
 * SAFE funding gate: generateCompanyProForma() returns zero revenue and zero
 * expenses for months before both companyOpsStartDate and safeTranche1Date.
 * analyzeCompanyCashPosition() surfaces any funding shortfall as a warning.
 *
 * Service templates: if centralized-services templates are configured in the
 * Admin > Services tab, they are passed to the engine to compute vendor cost-
 * of-services and gross profit before G&A.
 *
 * IRR / equity calculations use shared helpers from equityCalculations.ts.
 * All statement data is pre-generated in lib/company-data.ts to keep this
 * page free of inline financial logic.
 */
import React, { useState, useRef, useMemo } from "react";
import { ExportDialog } from "@/components/ExportDialog";
import Layout from "@/components/Layout";
import { useProperties, useGlobalAssumptions, useAllFeeCategories } from "@/lib/api";
import { generateCompanyProForma, generatePropertyProForma, formatMoney, getFiscalYearForModelYear } from "@/lib/financialEngine";
import { useServiceTemplates } from "@/lib/api/services";
import { PROJECTION_YEARS } from "@/lib/constants";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Loader2, AlertTriangle, CheckCircle, BookOpen } from "lucide-react";
import { ExportMenu, pdfAction, excelAction, csvAction, pptxAction, chartAction, pngAction } from "@/components/ui/export-toolbar";
import { CalcDetailsProvider } from "@/components/financial-table-rows";
import { Link } from "wouter";
import { AnimatedPage } from "@/components/graphics";
import { analyzeCompanyCashPosition } from "@/lib/financial/analyzeCompanyCashPosition";
import { CompanyHeader, CompanyIncomeTab, CompanyCashFlowTab, CompanyBalanceSheet } from "@/components/company";
import { 
  generateCompanyIncomeData, 
  generateCompanyCashFlowData, 
  generateCompanyBalanceData 
} from "@/lib/company-data";
import {
  exportCompanyPDF,
  exportCompanyCSV,
  handleExcelExport,
  exportChartPNG,
  exportTablePNG,
  handlePPTXExport
} from "@/lib/exports/companyExports";

export default function Company() {
  const { data: properties, isLoading: propertiesLoading, isError: propertiesError } = useProperties();
  const { data: global, isLoading: globalLoading, isError: globalError } = useGlobalAssumptions();
  const { data: allFeeCategories } = useAllFeeCategories();
  const { data: serviceTemplates } = useServiceTemplates();
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
      const templates = serviceTemplates?.map(t => ({
        ...t,
        serviceModel: t.serviceModel as 'centralized' | 'direct',
      }));
      return generateCompanyProForma(enrichedProperties, global, projectionMonths, templates);
    },
    [enrichedProperties, global, projectionMonths, serviceTemplates]
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

  const getStatementData = (type: string) => {
    switch (type) {
      case 'income':
        return generateCompanyIncomeData(financials, years, properties, propertyFinancials);
      case 'cashflow':
        return generateCompanyCashFlowData(financials, years, properties, propertyFinancials, fundingLabel);
      case 'balance':
        return generateCompanyBalanceData(financials, years, fundingLabel);
      default:
        return { years: [], rows: [] };
    }
  };

  const handleExport = (orientation: 'landscape' | 'portrait') => {
    if (exportType === 'pdf') {
      const data = getStatementData(activeTab);
      exportCompanyPDF(activeTab as any, data, global, projectionYears, yearlyChartData, orientation);
    } else if (exportType === 'tablePng') {
      exportTablePNG(tableRef, activeTab);
    } else {
      exportChartPNG(chartRef, orientation);
    }
  };

  const exportMenuNode = (
    <ExportMenu
      variant="light"
      actions={[
        pdfAction(() => { setExportType('pdf'); setExportDialogOpen(true); }),
        excelAction(() => handleExcelExport(activeTab, financials, projectionYears, global, fiscalYearStartMonth)),
        csvAction(() => exportCompanyCSV(activeTab as any, getStatementData(activeTab))),
        pptxAction(() => handlePPTXExport(
          global, 
          projectionYears, 
          (i) => String(getFiscalYear(i)),
          generateCompanyIncomeData(financials, years, properties, propertyFinancials),
          generateCompanyCashFlowData(financials, years, properties, propertyFinancials, fundingLabel),
          generateCompanyBalanceData(financials, years, fundingLabel)
        )),
        chartAction(() => { setExportType('chart'); setExportDialogOpen(true); }),
        pngAction(() => exportTablePNG(tableRef, activeTab)),
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
          
          <div className="mt-4 mb-2">
            <Link href="/company/research" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-primary hover:bg-muted transition-colors">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="font-medium">View Company Research</span>
              <span className="text-primary/60">Fee benchmarks, vendor costs, overhead, competitive landscape</span>
            </Link>
          </div>

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
            <div className="flex items-start gap-2 text-sm text-muted-foreground mt-4" data-testid="banner-company-cash-warning">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p>
                <span data-testid="text-company-cash-warning-title" className="font-medium text-red-600">Additional Funding Required:</span>{' '}
                The current {fundingLabel} funding of <span className="font-medium text-foreground">{formatMoney(cashAnalysis.totalFunding)}</span> is insufficient to cover operating expenses.
                Monthly cash position drops to <span className="font-medium text-red-600">{formatMoney(cashAnalysis.minCashPosition)}</span>
                {cashAnalysis.minCashMonth !== null && <> in month {cashAnalysis.minCashMonth}</>}.
                {' '}Suggested: Increase {fundingLabel} funding by at least{' '}
                <span className="font-medium text-foreground">{formatMoney(cashAnalysis.suggestedAdditionalFunding)}</span> in{' '}
                <Link href="/company/assumptions" className="font-medium text-secondary hover:underline">Company Assumptions</Link>.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-sm text-muted-foreground mt-4" data-testid="banner-company-cash-adequate">
              <CheckCircle className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
              <p>
                <span data-testid="text-company-cash-adequate-title" className="font-medium text-secondary">Cash Position Adequate:</span>{' '}
                The {fundingLabel} funding of <span className="font-medium text-foreground">{formatMoney(cashAnalysis.totalFunding)}</span> covers all operating costs.
                {cashAnalysis.minCashMonth !== null && (
                  <> Minimum cash position: <span className="font-medium text-foreground">{formatMoney(cashAnalysis.minCashPosition)}</span> (month {cashAnalysis.minCashMonth}).</>
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
