/**
 * PropertyDetail.tsx — Single-property financial dashboard.
 *
 * Displays the full pro-forma output for one property, organized into tabs:
 *   • Income Statement — yearly revenue, expenses, GOP, management fees, NOI
 *   • Cash Flow Statement — operating / investing / financing activities, FCF, FCFE
 *   • Balance Sheet — consolidated balance sheet for this property
 *   • PPE Schedule — Property, Plant & Equipment cost-basis and depreciation
 *
 * The page runs the financial engine (`generatePropertyProForma`) to produce
 * monthly line items, then aggregates them into annual totals for display. It
 * also computes loan parameters (LTV, amortization, refi) to populate the cash
 * flow statement's financing section.
 *
 * Export capabilities:
 *   • PDF — full cash flow table + performance chart on a second page
 *   • Excel — per-statement workbooks via the shared excelExport module
 *   • CSV — raw cash flow data dump
 *   • PowerPoint — summary slides via pptxExport
 *   • PNG — screenshot of the visible chart or table
 *
 * The page respects the fiscal-year-start-month setting, so FY labels align
 * with the company's chosen fiscal calendar (e.g. FY 2027 may start in October).
 */
import { useMemo, useState, useRef, useCallback } from "react";
import Layout from "@/components/Layout";
import { useProperty, useGlobalAssumptions } from "@/lib/api";
import { usePropertyPhotos } from "@/lib/api/property-photos";
import { generatePropertyProForma, formatMoney, getFiscalYearForModelYear } from "@/lib/financialEngine";
import { ConsolidatedBalanceSheet } from "@/components/statements/ConsolidatedBalanceSheet";
import { CalcDetailsProvider } from "@/components/financial-table";
import { Tabs, TabsContent, CurrentThemeTab } from "@/components/ui/tabs";
import { Loader2 } from "@/components/icons/themed-icons";
import { IconAlertTriangle, IconIncomeStatement, IconCashFlow, IconBalanceSheet, IconPPE, IconBanknote, IconFileStack } from "@/components/icons";
import { ExportMenu, pdfAction, excelAction, csvAction, pptxAction, chartAction, pngAction, docxAction } from "@/components/ui/export-toolbar";
import { downloadCSV } from "@/lib/exports/csvExport";
import { exportPropertyPPTX } from "@/lib/exports/pptxExport";
import {
  exportPropertyIncomeStatement,
  exportPropertyCashFlow,
  exportPropertyBalanceSheet,
  exportFullPropertyWorkbook,
} from "@/lib/exports/excelExport";
// dom-to-image-more, jspdf, jspdf-autotable are dynamically imported in export handlers
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { drawLineChart } from "@/lib/exports/pdfChartDrawer";
import { drawCoverPage, addFooters, buildFinancialTableConfig, drawTitle, drawSubtitle, drawSubtitleRow } from "@/lib/exports/pdfHelpers";
import { type ExportRowMeta, buildBrandPalette, type ThemeColor } from "@/lib/exports/exportStyles";
import { MONTHS_PER_YEAR } from "@/lib/constants";
import { calculateLoanParams, LoanParams, GlobalLoanParams, DEFAULT_LTV, PROJECTION_YEARS } from "@/lib/financial/loanCalculations";
import { aggregateCashFlowByYear } from "@/lib/financial/cashFlowAggregator";
import { aggregatePropertyByYear } from "@/lib/financial/yearlyAggregator";
import { FinancialChart } from "@/components/ui/financial-chart";
import { computeCashFlowSections } from "@/lib/financial/cashFlowSections";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExportDialog, type ExportVersion, type PremiumExportPayload } from "@/components/ExportDialog";
import { useExportSave } from "@/hooks/useExportSave";
import { AnimatedPage, ScrollReveal } from "@/components/graphics";
import {
  PPECostBasisSchedule,
  IncomeStatementTab,
  CashFlowTab,
  PropertyHeader,
  BenchmarkPanel,
  ReconciliationTab,
} from "@/components/property-detail";
import PropertyMap from "@/components/PropertyMap";
import DocumentExtractionPanel from "@/components/documents/DocumentExtractionPanel";

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
  const [exportType, setExportType] = useState<"pdf" | "xlsx" | "pptx" | "docx" | "chart">("pdf");
  const [incomeAllExpanded, setIncomeAllExpanded] = useState(false);
  const { requestSave, SaveDialog } = useExportSave();
  
  const { data: property, isLoading: propertyLoading, isError: propertyError } = useProperty(propertyId);
  const { data: global, isLoading: globalLoading, isError: globalError } = useGlobalAssumptions();
  const { data: brandingData } = useQuery<{ themeColors: Array<{ rank: number; name: string; hexCode: string; description?: string }> | null }>({
    queryKey: ["my-branding"],
    queryFn: async () => { const res = await fetch("/api/my-branding", { credentials: "include" }); return res.json(); },
    staleTime: 5 * 60_000,
  });
  const { data: photos } = usePropertyPhotos(propertyId);
  const heroCaption = useMemo(() => photos?.find(p => p.isHero)?.caption ?? undefined, [photos]);
  
  const handlePhotoUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId] });
    queryClient.invalidateQueries({ queryKey: ["propertyPhotos", propertyId] });
  };

  const projectionYears = global?.projectionYears ?? PROJECTION_YEARS;
  const projectionMonths = projectionYears * MONTHS_PER_YEAR;
  const fiscalYearStartMonth = global?.fiscalYearStartMonth ?? 1;
  const getFiscalYear = (yearIndex: number) => global ? getFiscalYearForModelYear(global.modelStartDate, fiscalYearStartMonth, yearIndex) : 2026 + yearIndex;
  const financials = useMemo(
    () => (property && global) ? generatePropertyProForma(property, global, projectionMonths) : [],
    [property, global, projectionMonths]
  );

  // Aggregate monthly financials into yearly totals for the performance chart.
  // Each bar/line in the chart needs a single number per year, so we sum 12 months.
  const yearlyChartData = useMemo(() => {
    const data = [];
    for (let y = 0; y < projectionYears; y++) {
      const yearData = financials.slice(y * MONTHS_PER_YEAR, (y + 1) * MONTHS_PER_YEAR);
      if (yearData.length === 0) continue;
      data.push({
        year: String(getFiscalYear(y)),
        Revenue: yearData.reduce((a, m) => a + m.revenueTotal, 0),
        GOP: yearData.reduce((a, m) => a + m.gop, 0),
        AGOP: yearData.reduce((a, m) => a + m.agop, 0),
        NOI: yearData.reduce((a, m) => a + m.noi, 0),
        ANOI: yearData.reduce((a, m) => a + m.anoi, 0),
        CashFlow: yearData.reduce((a, m) => a + m.cashFlow, 0),
      });
    }
    return data;
  }, [financials, projectionYears]);

  const years = projectionYears;
  const startYear = getFiscalYear(0);

  // Compute yearly cash-flow rows (ATCF, exit value, debt service, refi proceeds)
  // using the shared aggregator. This feeds the Cash Flow Statement tab.
  const cashFlowDataMemo = useMemo(() => {
    if (!property || !global || financials.length === 0) return [];
    return aggregateCashFlowByYear(financials, property as LoanParams, global as GlobalLoanParams, years);
  }, [financials, property, global, years]);

  // Aggregate monthly income-statement data into yearly totals for the IS tab.
  const yearlyDetails = useMemo(
    () => aggregatePropertyByYear(financials, years),
    [financials, years]
  );

  // Compute yearly balance sheet chart data: Assets, Liabilities, Equity.
  const balanceChartData = useMemo(() => {
    if (!property || !global || !yearlyChartData.length || !cashFlowDataMemo.length) return [];
    const loanProps = property as LoanParams;
    const loan = calculateLoanParams(loanProps, global as GlobalLoanParams);
    const totalCost = loanProps.purchasePrice + (loanProps.buildingImprovements ?? 0) + (loanProps.preOpeningCosts ?? 0);
    const depPerYear = totalCost > 0 ? totalCost / 39 : 0;
    let runCash = 0;
    let cumPrincipal = 0;
    return yearlyChartData.map((d, i) => {
      runCash += d.CashFlow;
      const nbv = Math.max(totalCost - depPerYear * (i + 1), 0);
      cumPrincipal += cashFlowDataMemo[i]?.principalPayment ?? 0;
      const loanBalance = Math.max(loan.loanAmount - cumPrincipal + (cashFlowDataMemo[i]?.refinancingProceeds ?? 0), 0);
      const totalAssets = runCash + nbv;
      const totalEquity = totalAssets - loanBalance;
      return {
        year: d.year,
        Assets: totalAssets,
        Liabilities: loanBalance,
        Equity: totalEquity,
      };
    });
  }, [property, global, yearlyChartData, cashFlowDataMemo]);

  if (propertyLoading || globalLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (propertyError || globalError) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <IconAlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-muted-foreground">Failed to load property data. Please try refreshing the page.</p>
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

  const getCashFlowData = () => cashFlowDataMemo;

  const exportAllStatementsCSV = (customFilename?: string) => {
    const cashFlowData = getCashFlowData();
    const csvLoan = calculateLoanParams(property as LoanParams, global as GlobalLoanParams);
    const csvAcqYear = Math.floor(csvLoan.acqMonthsFromModelStart / MONTHS_PER_YEAR);
    const csvTotalPropertyCost = (property as any).purchasePrice + ((property as any).buildingImprovements ?? 0) + ((property as any).preOpeningCosts ?? 0);
    const headers = ["Line Item", ...Array.from({ length: years }, (_, i) => `FY ${startYear + i}`)];
    const line = (label: string, vals: number[]) => [`"${label}"`, ...vals.map(v => v.toFixed(0))].join(",");

    const csvCfo = yearlyDetails.map((yd, i) =>
      yd.revenueTotal - (yd.totalExpenses - yd.expenseFFE) - cashFlowData[i].interestExpense - cashFlowData[i].taxLiability
    );
    const csvNetChange = csvCfo.map((cfo, i) => {
      const cfi = -csvTotalPropertyCost * (i === csvAcqYear ? 1 : 0) - yearlyDetails[i].expenseFFE + cashFlowData[i].exitValue;
      const cff = (i === csvAcqYear ? csvLoan.equityInvested : 0) +
        (i === csvAcqYear && csvLoan.loanAmount > 0 ? csvLoan.loanAmount : 0) -
        cashFlowData[i].principalPayment + cashFlowData[i].refinancingProceeds;
      return cfo + cfi + cff;
    });
    const csvCloseCash: number[] = [];
    let csvRunCash = 0;
    for (const nc of csvNetChange) { csvRunCash += nc; csvCloseCash.push(csvRunCash); }

    const rows: string[] = [headers.join(","), ""];
    rows.push('"INCOME STATEMENT"', "");
    rows.push(line("Total Revenue", yearlyDetails.map(y => y.revenueTotal)));
    rows.push(line("  Room Revenue", yearlyDetails.map(y => y.revenueRooms)));
    rows.push(line("  Event Revenue", yearlyDetails.map(y => y.revenueEvents)));
    rows.push(line("  F&B Revenue", yearlyDetails.map(y => y.revenueFB)));
    rows.push(line("  Other Revenue", yearlyDetails.map(y => y.revenueOther)));
    rows.push(line("Total Operating Expenses", yearlyDetails.map(y => y.totalExpenses - y.expenseFFE - y.expenseTaxes)));
    rows.push(line("Gross Operating Profit (GOP)", yearlyDetails.map(y => y.gop)));
    rows.push(line("Total Management Fees", yearlyDetails.map(y => y.feeBase + y.feeIncentive)));
    rows.push(line("Adjusted GOP (AGOP)", yearlyDetails.map(y => y.agop)));
    rows.push(line("Total Fixed Charges", yearlyDetails.map(y => y.expenseTaxes)));
    rows.push(line("Net Operating Income (NOI)", yearlyDetails.map(y => y.noi)));
    rows.push(line("FF&E Reserve", yearlyDetails.map(y => y.expenseFFE)));
    rows.push(line("Adjusted NOI (ANOI)", yearlyDetails.map(y => y.anoi)));
    rows.push("");

    rows.push('"CASH FLOW STATEMENT"', "");
    rows.push(line("Net Cash from Operating Activities", csvCfo));
    rows.push(line("  FF&E Reserve / Capital Improvements", yearlyDetails.map(yd => -yd.expenseFFE)));
    rows.push(line("Free Cash Flow (FCF)", yearlyDetails.map((yd, i) => csvCfo[i] - yd.expenseFFE)));
    rows.push(line("  Less: Principal Payments", cashFlowData.map(cf => -cf.principalPayment)));
    rows.push(line("Free Cash Flow to Equity (FCFE)", yearlyDetails.map((yd, i) => csvCfo[i] - yd.expenseFFE - cashFlowData[i].principalPayment)));
    rows.push("");

    rows.push('"BALANCE SHEET"', "");
    rows.push(line("Cash & Equivalents", csvCloseCash));
    rows.push(line("Property (Net of Depreciation)", cashFlowData.map(cf => csvTotalPropertyCost - cf.depreciation)));
    rows.push(line("Total Assets", csvCloseCash.map((cash, i) => cash + csvTotalPropertyCost - cashFlowData[i].depreciation)));
    rows.push(line("Outstanding Debt", cashFlowData.map(cf => csvLoan.loanAmount + cf.refinancingProceeds - cf.principalPayment)));
    rows.push(line("Total Liabilities", cashFlowData.map(cf => csvLoan.loanAmount + cf.refinancingProceeds - cf.principalPayment)));
    rows.push(line("Equity Invested", yearlyDetails.map(() => csvLoan.equityInvested)));
    rows.push(line("Total Equity", cashFlowData.map((cf, i) => {
      const ta = csvCloseCash[i] + csvTotalPropertyCost - cf.depreciation;
      const tl = csvLoan.loanAmount + cf.refinancingProceeds - cf.principalPayment;
      return ta - tl;
    })));
    rows.push("");

    rows.push('"INVESTMENT ANALYSIS"', "");
    rows.push(line("Equity Invested", yearlyDetails.map(() => csvLoan.equityInvested)));
    rows.push(line("Total Property Cost", yearlyDetails.map(() => csvTotalPropertyCost)));
    rows.push(line("Annual Revenue", yearlyDetails.map(y => y.revenueTotal)));
    rows.push(line("Annual ANOI", yearlyDetails.map(y => y.anoi)));
    rows.push(line("Debt Service", cashFlowData.map(cf => cf.debtService)));
    rows.push(line("Closing Cash Balance", csvCloseCash));

    downloadCSV(rows.join("\n"), customFilename || `${property.name.replace(/\s+/g, "_")}_Financial_Statements.csv`);
  };

  const exportCashFlowCSV = (customFilename?: string) => {

    const cashFlowData = getCashFlowData();
    const headers = ["Line Item", ...Array.from({length: years}, (_, i) => `FY ${startYear + i}`)];
    
    const csvLoan = calculateLoanParams(property as LoanParams, global as GlobalLoanParams);
    const csvAcqYear = Math.floor(csvLoan.acqMonthsFromModelStart / MONTHS_PER_YEAR);
    const csvTotalPropertyCost = (property as any).purchasePrice + ((property as any).buildingImprovements ?? 0) + ((property as any).preOpeningCosts ?? 0);

    const s = computeCashFlowSections(yearlyDetails, cashFlowData, csvLoan, csvAcqYear, csvTotalPropertyCost, years);

    const rows = [
      ["CASH FLOW FROM OPERATING ACTIVITIES"],
      ["Cash Received from Guests & Clients", ...yearlyDetails.map(y => y.revenueTotal.toFixed(0))],
      ["  Guest Room Revenue", ...yearlyDetails.map(y => y.revenueRooms.toFixed(0))],
      ["  Event & Venue Revenue", ...yearlyDetails.map(y => y.revenueEvents.toFixed(0))],
      ["  Food & Beverage Revenue", ...yearlyDetails.map(y => y.revenueFB.toFixed(0))],
      ["  Other Revenue (Spa/Experiences)", ...yearlyDetails.map(y => y.revenueOther.toFixed(0))],
      ["Cash Paid for Operating Expenses", ...yearlyDetails.map(y => (-(y.totalExpenses - y.expenseFFE)).toFixed(0))],
      ["  Housekeeping & Room Operations", ...yearlyDetails.map(y => y.expenseRooms.toFixed(0))],
      ["  Food & Beverage Costs", ...yearlyDetails.map(y => y.expenseFB.toFixed(0))],
      ["  Event Operations", ...yearlyDetails.map(y => y.expenseEvents.toFixed(0))],
      ["  Marketing & Platform Fees", ...yearlyDetails.map(y => y.expenseMarketing.toFixed(0))],
      ["  Property Operations & Maintenance", ...yearlyDetails.map(y => y.expensePropertyOps.toFixed(0))],
      ["  Utilities (Variable)", ...yearlyDetails.map(y => y.expenseUtilitiesVar.toFixed(0))],
      ["  Utilities (Fixed)", ...yearlyDetails.map(y => y.expenseUtilitiesFixed.toFixed(0))],
      ["  Property Taxes", ...yearlyDetails.map(y => y.expenseTaxes.toFixed(0))],
      ["  Administrative & Compliance", ...yearlyDetails.map(y => y.expenseAdmin.toFixed(0))],
      ["  IT Systems", ...yearlyDetails.map(y => y.expenseIT.toFixed(0))],
      ["  Other Operating Costs", ...yearlyDetails.map(y => y.expenseOtherCosts.toFixed(0))],
      ["  Base Management Fee", ...yearlyDetails.map(y => y.feeBase.toFixed(0))],
      ["  Incentive Management Fee", ...yearlyDetails.map(y => y.feeIncentive.toFixed(0))],
      ["Less: Interest Paid", ...cashFlowData.map(y => (-y.interestExpense).toFixed(0))],
      ["Less: Income Taxes Paid", ...cashFlowData.map(y => (-y.taxLiability).toFixed(0))],
      ["Net Cash from Operating Activities", ...s.cashFromOperations.map(v => v.toFixed(0))],
      [""],
      ["CASH FLOW FROM INVESTING ACTIVITIES"],
      ["Property Acquisition", ...cashFlowData.map((_, i) => (i === csvAcqYear ? -csvTotalPropertyCost : 0).toFixed(0))],
      ["FF&E Reserve / Capital Improvements", ...yearlyDetails.map(y => (-y.expenseFFE).toFixed(0))],
      ["Sale Proceeds (Net Exit Value)", ...cashFlowData.map(y => y.exitValue.toFixed(0))],
      ["Net Cash from Investing Activities", ...s.cashFromInvesting.map(v => v.toFixed(0))],
      [""],
      ["CASH FLOW FROM FINANCING ACTIVITIES"],
      ["Equity Contribution", ...cashFlowData.map((_, i) => (i === csvAcqYear ? csvLoan.equityInvested : 0).toFixed(0))],
      ["Loan Proceeds", ...cashFlowData.map((_, i) => (i === csvAcqYear && csvLoan.loanAmount > 0 ? csvLoan.loanAmount : 0).toFixed(0))],
      ["Less: Principal Repayments", ...cashFlowData.map(y => (-y.principalPayment).toFixed(0))],
      ["Refinancing Proceeds", ...cashFlowData.map(y => y.refinancingProceeds.toFixed(0))],
      ["Net Cash from Financing Activities", ...s.cashFromFinancing.map(v => v.toFixed(0))],
      [""],
      ["Net Increase (Decrease) in Cash", ...s.netChangeCash.map(v => v.toFixed(0))],
      ["Opening Cash Balance", ...s.openingCash.map(v => v.toFixed(0))],
      ["Closing Cash Balance", ...s.closingCash.map(v => v.toFixed(0))],
      [""],
      ["FREE CASH FLOW"],
      ["Net Cash from Operating Activities", ...s.cashFromOperations.map(v => v.toFixed(0))],
      ["Less: Capital Expenditures (FF&E)", ...yearlyDetails.map(y => (-y.expenseFFE).toFixed(0))],
      ["Free Cash Flow (FCF)", ...s.fcf.map(v => v.toFixed(0))],
      ["Less: Principal Payments", ...cashFlowData.map(y => (-y.principalPayment).toFixed(0))],
      ["Free Cash Flow to Equity (FCFE)", ...s.fcfe.map(v => v.toFixed(0))],
    ];

    downloadCSV(
      [headers, ...rows].map(row => row.join(",")).join("\n"),
      customFilename || `${property.name.replace(/\s+/g, '_')}_CashFlow.csv`,
    );
  };

  const handleExcelExport = (customFilename?: string) => {
    exportFullPropertyWorkbook(
      financials,
      property as unknown as LoanParams,
      [property] as unknown as LoanParams[],
      global as unknown as GlobalLoanParams,
      global,
      [{ property: property as unknown as LoanParams, data: financials }],
      property.name,
      projectionYears,
      global.modelStartDate,
      fiscalYearStartMonth,
      0,
      global?.companyName || "Portfolio",
      customFilename
    );
  };

  const exportIncomeStatementPDF = async (orientation: 'landscape' | 'portrait' = 'landscape', version: ExportVersion = 'extended', customFilename?: string) => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const { PAGE_DIMS } = await import("@/lib/exports/exportStyles");
    const brand = buildBrandPalette(brandingData?.themeColors as ThemeColor[] | undefined);
    const dims = orientation === "landscape"
      ? { w: PAGE_DIMS.LANDSCAPE_W, h: PAGE_DIMS.LANDSCAPE_H }
      : { w: PAGE_DIMS.PORTRAIT_W, h: PAGE_DIMS.PORTRAIT_H };
    const doc = new jsPDF({ orientation, unit: "mm", format: [dims.w, dims.h] });
    const pageWidth = dims.w;
    const chartWidth = pageWidth - 28;
    const companyName = global?.companyName || property.name;
    const yearLabels = Array.from({ length: years }, (_, i) => startYear + i);
    const projRange = `${yearLabels[0]} \u2013 ${yearLabels[yearLabels.length - 1]}`;
    const isShort = version === "short";

    drawCoverPage(doc, {
      companyName,
      title: `${property.name} \u2014 Income Statement`,
      subtitle: `${projectionYears}-Year Financial Projection (${projRange})`,
      meta: [
        `Property: ${property.name}`,
        `Period: FY ${projRange}`,
        "Classification: Confidential",
      ],
    });

    doc.addPage();
    const entityTag = `${companyName} \u2014 ${property.name}`;
    drawTitle(doc, `${property.name} \u2014 Income Statement`, 14, 15);
    drawSubtitleRow(doc, `${projectionYears}-Year Projection (${projRange})`, entityTag, 14, 22, pageWidth);
    drawSubtitle(doc, `Generated: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`, 14, 27);

    const rows: ExportRowMeta[] = [];
    if (!isShort) {
      rows.push({ category: "REVENUE", values: yearlyDetails.map(() => 0), isHeader: true });
      rows.push({ category: "Room Revenue", values: yearlyDetails.map(y => y.revenueRooms), indent: 1 });
      rows.push({ category: "Event Revenue", values: yearlyDetails.map(y => y.revenueEvents), indent: 1 });
      rows.push({ category: "F&B Revenue", values: yearlyDetails.map(y => y.revenueFB), indent: 1 });
      rows.push({ category: "Other Revenue", values: yearlyDetails.map(y => y.revenueOther), indent: 1 });
    }
    rows.push({ category: "Total Revenue", values: yearlyDetails.map(y => y.revenueTotal), isBold: true });
    if (!isShort) {
      rows.push({ category: "OPERATING EXPENSES", values: yearlyDetails.map(() => 0), isHeader: true });
      rows.push({ category: "Room Expense", values: yearlyDetails.map(y => y.expenseRooms), indent: 1 });
      rows.push({ category: "F&B Expense", values: yearlyDetails.map(y => y.expenseFB), indent: 1 });
      rows.push({ category: "Event Expense", values: yearlyDetails.map(y => y.expenseEvents), indent: 1 });
      rows.push({ category: "Marketing", values: yearlyDetails.map(y => y.expenseMarketing), indent: 1 });
      rows.push({ category: "Property Ops", values: yearlyDetails.map(y => y.expensePropertyOps), indent: 1 });
      rows.push({ category: "Admin & General", values: yearlyDetails.map(y => y.expenseAdmin), indent: 1 });
      rows.push({ category: "IT", values: yearlyDetails.map(y => y.expenseIT), indent: 1 });
      rows.push({ category: "Utilities", values: yearlyDetails.map(y => y.expenseUtilitiesVar + y.expenseUtilitiesFixed), indent: 1 });
      rows.push({ category: "Other Expenses", values: yearlyDetails.map(y => y.expenseOther + y.expenseOtherCosts), indent: 1 });
    }
    rows.push({ category: "Total Operating Expenses", values: yearlyDetails.map(y => y.totalExpenses - y.expenseFFE - y.expenseTaxes), isBold: true });
    rows.push({ category: "Gross Operating Profit (GOP)", values: yearlyDetails.map(y => y.gop), isBold: true });
    if (!isShort) {
      rows.push({ category: "MANAGEMENT FEES", values: yearlyDetails.map(() => 0), isHeader: true });
      rows.push({ category: "Base Fee", values: yearlyDetails.map(y => y.feeBase), indent: 1 });
      rows.push({ category: "Incentive Fee", values: yearlyDetails.map(y => y.feeIncentive), indent: 1 });
    }
    rows.push({ category: "Total Management Fees", values: yearlyDetails.map(y => y.feeBase + y.feeIncentive), isBold: true });
    rows.push({ category: "Adjusted GOP (AGOP)", values: yearlyDetails.map(y => y.agop), isBold: true });
    if (!isShort) {
      rows.push({ category: "FIXED CHARGES", values: yearlyDetails.map(() => 0), isHeader: true });
      rows.push({ category: "Property Taxes", values: yearlyDetails.map(y => y.expenseTaxes), indent: 1 });
    }
    rows.push({ category: "Total Fixed Charges", values: yearlyDetails.map(y => y.expenseTaxes), isBold: true });
    rows.push({ category: "Net Operating Income (NOI)", values: yearlyDetails.map(y => y.noi), isBold: true });
    if (!isShort) {
      rows.push({ category: "FF&E Reserve", values: yearlyDetails.map(y => y.expenseFFE), indent: 1 });
    }
    rows.push({ category: "Adjusted NOI (ANOI)", values: yearlyDetails.map(y => y.anoi), isBold: true });

    const tableConfig = buildFinancialTableConfig(yearLabels, rows, orientation, 32);
    autoTable(doc, tableConfig);

    if (yearlyChartData && yearlyChartData.length > 0) {
      doc.addPage();
      drawTitle(doc, `${property.name} \u2014 Performance Trend`, 14, 15, { fontSize: 16 });
      drawSubtitleRow(doc, `${projectionYears}-Year Revenue, GOP, AGOP, NOI, and ANOI Trend`, entityTag, 14, 22, pageWidth);
      drawLineChart({
        doc,
        x: 14,
        y: 30,
        width: chartWidth,
        height: 150,
        title: `${property.name} - Financial Performance (${projectionYears}-Year Projection)`,
        series: [
          { name: 'Revenue', data: yearlyChartData.map((d) => ({ label: d.year, value: d.Revenue })), color: `#${brand.LINE_HEX[0]}` },
          { name: 'GOP', data: yearlyChartData.map((d) => ({ label: d.year, value: d.GOP })), color: `#${brand.LINE_HEX[1] || brand.SECONDARY_HEX}` },
          { name: 'AGOP', data: yearlyChartData.map((d) => ({ label: d.year, value: d.AGOP })), color: `#${brand.LINE_HEX[2] || brand.PRIMARY_HEX}` },
          { name: 'NOI', data: yearlyChartData.map((d) => ({ label: d.year, value: d.NOI })), color: `#${brand.LINE_HEX[3] || brand.ACCENT_HEX}` },
          { name: 'ANOI', data: yearlyChartData.map((d) => ({ label: d.year, value: d.ANOI })), color: `#${brand.LINE_HEX[4] || brand.MUTED_HEX}` },
        ],
        brand,
      });
    }

    addFooters(doc, companyName, { skipPages: new Set([1]) });
    const { saveFile } = await import("@/lib/exports/saveFile");
    await saveFile(doc.output("blob"), customFilename || `${property.name.replace(/\s+/g, '_')}_IncomeStatement.pdf`);
  };

  const exportCashFlowPDF = async (orientation: 'landscape' | 'portrait' = 'landscape', version: ExportVersion = 'extended', customFilename?: string) => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const cashFlowData = getCashFlowData();
    const { PAGE_DIMS } = await import("@/lib/exports/exportStyles");
    const brand = buildBrandPalette(brandingData?.themeColors as ThemeColor[] | undefined);
    const dims = orientation === "landscape"
      ? { w: PAGE_DIMS.LANDSCAPE_W, h: PAGE_DIMS.LANDSCAPE_H }
      : { w: PAGE_DIMS.PORTRAIT_W, h: PAGE_DIMS.PORTRAIT_H };
    const doc = new jsPDF({ orientation, unit: "mm", format: [dims.w, dims.h] });
    const pageWidth = dims.w;
    const chartWidth = pageWidth - 28;
    const companyName = global?.companyName || property.name;
    const yearLabels = Array.from({ length: years }, (_, i) => startYear + i);
    const projRange = `${yearLabels[0]} \u2013 ${yearLabels[yearLabels.length - 1]}`;
    const isShort = version === "short";

    const pdfLoan = calculateLoanParams(property as LoanParams, global as GlobalLoanParams);
    const pdfAcqYear = Math.floor(pdfLoan.acqMonthsFromModelStart / MONTHS_PER_YEAR);
    const pdfTotalPropertyCost = (property as any).purchasePrice + ((property as any).buildingImprovements ?? 0) + ((property as any).preOpeningCosts ?? 0);

    const pdfCfo = yearlyDetails.map((yd, i) => {
      return yd.revenueTotal - (yd.totalExpenses - yd.expenseFFE) - cashFlowData[i].interestExpense - cashFlowData[i].taxLiability;
    });
    const pdfCfi = cashFlowData.map((cf, i) => {
      const ffe = yearlyDetails[i].expenseFFE;
      const acqCost = i === pdfAcqYear ? pdfTotalPropertyCost : 0;
      return -acqCost - ffe + cf.exitValue;
    });
    const pdfCff = cashFlowData.map((cf, i) => {
      const eqContrib = i === pdfAcqYear ? pdfLoan.equityInvested : 0;
      const loanProceeds = i === pdfAcqYear && pdfLoan.loanAmount > 0 ? pdfLoan.loanAmount : 0;
      return eqContrib + loanProceeds - cf.principalPayment + cf.refinancingProceeds;
    });
    const pdfNetChange = pdfCfo.map((cfo, i) => cfo + pdfCfi[i] + pdfCff[i]);
    let pdfRunCash = 0;
    const pdfOpenCash: number[] = [];
    const pdfCloseCash: number[] = [];
    for (let i = 0; i < years; i++) {
      pdfOpenCash.push(pdfRunCash);
      pdfRunCash += pdfNetChange[i];
      pdfCloseCash.push(pdfRunCash);
    }

    drawCoverPage(doc, {
      companyName,
      title: `${property.name} \u2014 Cash Flow Statement`,
      subtitle: `${projectionYears}-Year Financial Projection (${projRange})`,
      meta: [
        `Property: ${property.name}`,
        `Period: FY ${projRange}`,
        "Classification: Confidential",
      ],
    });

    doc.addPage();
    const entityTag = `${companyName} \u2014 ${property.name}`;
    drawTitle(doc, `${property.name} \u2014 Cash Flow Statement`, 14, 15);
    drawSubtitleRow(doc, `${projectionYears}-Year Projection (${projRange})`, entityTag, 14, 22, pageWidth);
    drawSubtitle(doc, `Generated: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`, 14, 27);

    const rows: ExportRowMeta[] = [];
    if (!isShort) {
      rows.push({ category: "CASH FLOW FROM OPERATING ACTIVITIES", values: yearlyDetails.map(() => 0), isHeader: true });
      rows.push({ category: "Cash Received from Guests & Clients", values: yearlyDetails.map(y => y.revenueTotal), isBold: true });
      rows.push({ category: "Guest Room Revenue", values: yearlyDetails.map(y => y.revenueRooms), indent: 1 });
      rows.push({ category: "Event & Venue Revenue", values: yearlyDetails.map(y => y.revenueEvents), indent: 1 });
      rows.push({ category: "Food & Beverage Revenue", values: yearlyDetails.map(y => y.revenueFB), indent: 1 });
      rows.push({ category: "Other Revenue (Spa/Experiences)", values: yearlyDetails.map(y => y.revenueOther), indent: 1 });
      rows.push({ category: "Cash Paid for Operating Expenses", values: yearlyDetails.map(y => -(y.totalExpenses - y.expenseFFE)) });
      rows.push({ category: "Less: Interest Paid", values: cashFlowData.map(y => -y.interestExpense) });
      rows.push({ category: "Less: Income Taxes Paid", values: cashFlowData.map(y => -y.taxLiability) });
    }
    rows.push({ category: "Net Cash from Operating Activities", values: pdfCfo, isBold: true });
    if (!isShort) {
      rows.push({ category: "CASH FLOW FROM INVESTING ACTIVITIES", values: yearlyDetails.map(() => 0), isHeader: true });
      rows.push({ category: "Property Acquisition", values: cashFlowData.map((_, i) => i === pdfAcqYear ? -pdfTotalPropertyCost : 0) });
      rows.push({ category: "FF&E Reserve / Capital Improvements", values: yearlyDetails.map(y => -y.expenseFFE) });
      rows.push({ category: "Sale Proceeds (Net Exit Value)", values: cashFlowData.map(y => y.exitValue) });
    }
    rows.push({ category: "Net Cash from Investing Activities", values: pdfCfi, isBold: true });
    if (!isShort) {
      rows.push({ category: "CASH FLOW FROM FINANCING ACTIVITIES", values: yearlyDetails.map(() => 0), isHeader: true });
      rows.push({ category: "Equity Contribution", values: cashFlowData.map((_, i) => i === pdfAcqYear ? pdfLoan.equityInvested : 0) });
      rows.push({ category: "Loan Proceeds", values: cashFlowData.map((_, i) => i === pdfAcqYear && pdfLoan.loanAmount > 0 ? pdfLoan.loanAmount : 0) });
      rows.push({ category: "Less: Principal Repayments", values: cashFlowData.map(y => -y.principalPayment) });
      rows.push({ category: "Refinancing Proceeds", values: cashFlowData.map(y => y.refinancingProceeds) });
    }
    rows.push({ category: "Net Cash from Financing Activities", values: pdfCff, isBold: true });
    rows.push({ category: "Net Increase (Decrease) in Cash", values: pdfNetChange, isBold: true });
    rows.push({ category: "Opening Cash Balance", values: pdfOpenCash });
    rows.push({ category: "Closing Cash Balance", values: pdfCloseCash, isBold: true });
    if (!isShort) {
      rows.push({ category: "FREE CASH FLOW", values: yearlyDetails.map(() => 0), isHeader: true });
      rows.push({ category: "Net Cash from Operating Activities", values: pdfCfo });
      rows.push({ category: "Less: Capital Expenditures (FF&E)", values: yearlyDetails.map(y => -y.expenseFFE) });
      rows.push({ category: "Free Cash Flow (FCF)", values: pdfCfo.map((cfo, i) => cfo - yearlyDetails[i].expenseFFE), isBold: true });
      rows.push({ category: "Less: Principal Payments", values: cashFlowData.map(y => -y.principalPayment) });
      rows.push({ category: "Free Cash Flow to Equity (FCFE)", values: pdfCfo.map((cfo, i) => cfo - yearlyDetails[i].expenseFFE - cashFlowData[i].principalPayment), isBold: true });
    }

    const tableConfig = buildFinancialTableConfig(yearLabels, rows, orientation, 32);
    autoTable(doc, tableConfig);

    if (yearlyChartData && yearlyChartData.length > 0) {
      doc.addPage();
      const chartSubtitle = activeTab === "cashflow"
        ? `${projectionYears}-Year Revenue, ANOI, and Cash Flow Trend`
        : `${projectionYears}-Year Revenue, GOP, AGOP, NOI, and ANOI Trend`;
      drawTitle(doc, `${property.name} \u2014 Performance Trend`, 14, 15, { fontSize: 16 });
      drawSubtitleRow(doc, chartSubtitle, entityTag, 14, 22, pageWidth);

      const chartSeries = activeTab === "cashflow" ? [
        { name: 'Revenue', data: yearlyChartData.map((d) => ({ label: d.year, value: d.Revenue })), color: `#${brand.LINE_HEX[0]}` },
        { name: 'ANOI', data: yearlyChartData.map((d) => ({ label: d.year, value: d.ANOI })), color: `#${brand.LINE_HEX[1] || brand.SECONDARY_HEX}` },
        { name: 'Cash Flow', data: yearlyChartData.map((d) => ({ label: d.year, value: d.CashFlow })), color: `#${brand.LINE_HEX[2] || brand.PRIMARY_HEX}` },
      ] : [
        { name: 'Revenue', data: yearlyChartData.map((d) => ({ label: d.year, value: d.Revenue })), color: `#${brand.LINE_HEX[0]}` },
        { name: 'GOP', data: yearlyChartData.map((d) => ({ label: d.year, value: d.GOP })), color: `#${brand.LINE_HEX[1] || brand.SECONDARY_HEX}` },
        { name: 'AGOP', data: yearlyChartData.map((d) => ({ label: d.year, value: d.AGOP })), color: `#${brand.LINE_HEX[2] || brand.PRIMARY_HEX}` },
        { name: 'NOI', data: yearlyChartData.map((d) => ({ label: d.year, value: d.NOI })), color: `#${brand.LINE_HEX[3] || brand.ACCENT_HEX}` },
        { name: 'ANOI', data: yearlyChartData.map((d) => ({ label: d.year, value: d.ANOI })), color: `#${brand.LINE_HEX[4] || brand.MUTED_HEX}` },
      ];

      drawLineChart({
        doc,
        x: 14,
        y: 30,
        width: chartWidth,
        height: 150,
        title: `${property.name} - Financial Performance (${projectionYears}-Year Projection)`,
        series: chartSeries,
        brand,
      });
    }

    addFooters(doc, companyName, { skipPages: new Set([1]) });
    const { saveFile: savePdf } = await import("@/lib/exports/saveFile");
    await savePdf(doc.output("blob"), customFilename || `${property.name.replace(/\s+/g, '_')}_CashFlow.pdf`);
  };

  const exportChartPNG = async (orientation: 'landscape' | 'portrait' = 'landscape', customFilename?: string) => {
    const chartContainer = activeTab === "cashflow" ? cashFlowChartRef.current : incomeChartRef.current;
    if (!chartContainer) return;
    try {
      const width = orientation === 'landscape' ? 1200 : 800;
      const height = orientation === 'landscape' ? 600 : 1000;
      
      const domtoimage = (await import("dom-to-image-more")).default;
      const dataUrl = await domtoimage.toPng(chartContainer, {
        bgcolor: '#ffffff',
        quality: 1,
        width,
        height,
        style: { transform: 'scale(2)', transformOrigin: 'top left' }
      });
      const { saveDataUrl } = await import("@/lib/exports/saveFile");
      await saveDataUrl(dataUrl, customFilename || `${property.name.replace(/\s+/g, '_')}_chart_${orientation}.png`);
    } catch (error) {
      console.error('Error exporting chart:', error);
    }
  };

  const exportTablePNG = async (orientation: 'landscape' | 'portrait' = 'landscape', customFilename?: string) => {
    const tableContainer = activeTab === "cashflow" ? cashFlowTableRef.current : incomeTableRef.current;
    if (!tableContainer) return;
    try {
      const scale = 2;
      const domtoimage = (await import("dom-to-image-more")).default;
      const dataUrl = await domtoimage.toPng(tableContainer, {
        bgcolor: '#ffffff',
        quality: 1,
        style: { transform: `scale(${scale})`, transformOrigin: 'top left' },
        width: tableContainer.scrollWidth * scale,
        height: tableContainer.scrollHeight * scale,
      });
      const { saveDataUrl } = await import("@/lib/exports/saveFile");
      await saveDataUrl(dataUrl, customFilename || `${property.name.replace(/\s+/g, '_')}_${activeTab}_table.png`);
    } catch (error) {
      console.error('Error exporting table:', error);
    }
  };

  const handlePPTXExport = (customFilename?: string) => {
    const cashFlowData = getCashFlowData();
    const yearLabels = Array.from({ length: years }, (_, i) => `FY ${startYear + i}`);
    const pptxLoan = calculateLoanParams(property as LoanParams, global as GlobalLoanParams);
    const pptxAcqYear = Math.floor(pptxLoan.acqMonthsFromModelStart / MONTHS_PER_YEAR);
    const pptxTotalPropertyCost = (property as any).purchasePrice + ((property as any).buildingImprovements ?? 0) + ((property as any).preOpeningCosts ?? 0);

    const pptxCfo = yearlyDetails.map((yd, i) =>
      yd.revenueTotal - (yd.totalExpenses - yd.expenseFFE) - cashFlowData[i].interestExpense - cashFlowData[i].taxLiability
    );
    const pptxNetChange = pptxCfo.map((cfo, i) => {
      const cfi = -pptxTotalPropertyCost * (i === pptxAcqYear ? 1 : 0) - yearlyDetails[i].expenseFFE + cashFlowData[i].exitValue;
      const cff = (i === pptxAcqYear ? pptxLoan.equityInvested : 0) +
        (i === pptxAcqYear && pptxLoan.loanAmount > 0 ? pptxLoan.loanAmount : 0) -
        cashFlowData[i].principalPayment + cashFlowData[i].refinancingProceeds;
      return cfo + cfi + cff;
    });
    const pptxCloseCash: number[] = [];
    let pptxRunCash = 0;
    for (const nc of pptxNetChange) { pptxRunCash += nc; pptxCloseCash.push(pptxRunCash); }

    const incomeRows = [
      { category: "REVENUE", values: yearlyDetails.map(() => 0), isHeader: true },
      { category: "Room Revenue", values: yearlyDetails.map(y => y.revenueRooms), indent: 1 },
      { category: "Event Revenue", values: yearlyDetails.map(y => y.revenueEvents), indent: 1 },
      { category: "F&B Revenue", values: yearlyDetails.map(y => y.revenueFB), indent: 1 },
      { category: "Other Revenue", values: yearlyDetails.map(y => y.revenueOther), indent: 1 },
      { category: "Total Revenue", values: yearlyDetails.map(y => y.revenueTotal), isBold: true },
      { category: "Total Operating Expenses", values: yearlyDetails.map(y => y.totalExpenses - y.expenseFFE - y.expenseTaxes), isBold: true },
      { category: "Gross Operating Profit (GOP)", values: yearlyDetails.map(y => y.gop), isBold: true },
      { category: "Total Management Fees", values: yearlyDetails.map(y => y.feeBase + y.feeIncentive) },
      { category: "Adjusted GOP (AGOP)", values: yearlyDetails.map(y => y.agop), isBold: true },
      { category: "Total Fixed Charges", values: yearlyDetails.map(y => y.expenseTaxes) },
      { category: "Net Operating Income (NOI)", values: yearlyDetails.map(y => y.noi), isBold: true },
      { category: "FF&E Reserve", values: yearlyDetails.map(y => y.expenseFFE), indent: 1 },
      { category: "Adjusted NOI (ANOI)", values: yearlyDetails.map(y => y.anoi), isBold: true },
    ];

    const cfRows = [
      { category: "Net Cash from Operating Activities", values: pptxCfo, isBold: true },
      { category: "FF&E Reserve / Capital Improvements", values: yearlyDetails.map(yd => -yd.expenseFFE), indent: 1 },
      { category: "Free Cash Flow (FCF)", values: yearlyDetails.map((yd, i) => pptxCfo[i] - yd.expenseFFE), isBold: true },
      { category: "Less: Principal Payments", values: cashFlowData.map(cf => -cf.principalPayment), indent: 1 },
      { category: "Free Cash Flow to Equity (FCFE)", values: yearlyDetails.map((yd, i) => pptxCfo[i] - yd.expenseFFE - cashFlowData[i].principalPayment), isBold: true },
    ];

    const bsRows = [
      { category: "ASSETS", values: yearlyDetails.map(() => 0), isHeader: true },
      { category: "Cash & Equivalents", values: pptxCloseCash, indent: 1 },
      { category: "Property (Net of Depreciation)", values: cashFlowData.map(cf => pptxTotalPropertyCost - cf.depreciation), indent: 1 },
      { category: "Total Assets", values: pptxCloseCash.map((cash, i) => cash + pptxTotalPropertyCost - cashFlowData[i].depreciation), isBold: true },
      { category: "LIABILITIES", values: yearlyDetails.map(() => 0), isHeader: true },
      { category: "Outstanding Debt", values: cashFlowData.map(cf => pptxLoan.loanAmount + cf.refinancingProceeds - cf.principalPayment), indent: 1 },
      { category: "Total Liabilities", values: cashFlowData.map(cf => pptxLoan.loanAmount + cf.refinancingProceeds - cf.principalPayment), isBold: true },
      { category: "EQUITY", values: yearlyDetails.map(() => 0), isHeader: true },
      { category: "Equity Invested", values: yearlyDetails.map(() => pptxLoan.equityInvested), indent: 1 },
      { category: "Retained Earnings", values: cashFlowData.map((cf, i) => {
        const ta = pptxCloseCash[i] + pptxTotalPropertyCost - cf.depreciation;
        const tl = pptxLoan.loanAmount + cf.refinancingProceeds - cf.principalPayment;
        return ta - tl - pptxLoan.equityInvested;
      }), indent: 1 },
      { category: "Total Equity", values: cashFlowData.map((cf, i) => {
        const ta = pptxCloseCash[i] + pptxTotalPropertyCost - cf.depreciation;
        const tl = pptxLoan.loanAmount + cf.refinancingProceeds - cf.principalPayment;
        return ta - tl;
      }), isBold: true },
    ];

    const investRows = [
      { category: "INVESTMENT SUMMARY", values: yearlyDetails.map(() => 0), isHeader: true },
      { category: "Equity Invested", values: yearlyDetails.map(() => pptxLoan.equityInvested), indent: 1 },
      { category: "Total Property Cost", values: yearlyDetails.map(() => pptxTotalPropertyCost), indent: 1 },
      { category: "Loan Amount", values: yearlyDetails.map(() => pptxLoan.loanAmount), indent: 1 },
      { category: "Annual Revenue", values: yearlyDetails.map(y => y.revenueTotal), indent: 1 },
      { category: "Annual ANOI", values: yearlyDetails.map(y => y.anoi), indent: 1 },
      { category: "Debt Service", values: cashFlowData.map(cf => cf.debtService), indent: 1 },
      { category: "Closing Cash Balance", values: pptxCloseCash, isBold: true },
    ];

    const fmt = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(v);
    const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;
    const firstY = yearlyChartData[0];
    const kpiMetrics = firstY ? [
      { label: "Year 1 Total Revenue", value: fmt(firstY.Revenue) },
      { label: "Year 1 GOP", value: fmt(firstY.GOP) },
      { label: "Year 1 ANOI", value: fmt(firstY.ANOI) },
      { label: "Total Equity Invested", value: fmt(pptxLoan.equityInvested) },
      { label: "Total Property Cost", value: fmt(pptxTotalPropertyCost) },
      { label: "Loan Amount", value: fmt(pptxLoan.loanAmount) },
      { label: "LTV", value: fmtPct(pptxLoan.loanAmount / pptxTotalPropertyCost) },
      { label: "ANOI Margin (Year 1)", value: firstY.Revenue > 0 ? fmtPct(firstY.ANOI / firstY.Revenue) : "—" },
    ] : [];

    exportPropertyPPTX({
      propertyName: property.name,
      projectionYears,
      getFiscalYear: (i: number) => `FY ${startYear + i}`,
      incomeData: { years: yearLabels, rows: incomeRows },
      cashFlowData: { years: yearLabels, rows: cfRows },
      balanceSheetData: { years: yearLabels, rows: bsRows },
      investmentData: { years: yearLabels, rows: investRows },
      kpiMetrics,
    }, global?.companyName || "H+ Analytics", customFilename, brandingData?.themeColors ?? undefined);
  };

  const exportUnifiedPDF = async (orientation: 'landscape' | 'portrait' = 'landscape', version: ExportVersion = 'extended', customFilename?: string) => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const { PAGE_DIMS } = await import("@/lib/exports/exportStyles");
    const brand = buildBrandPalette(brandingData?.themeColors as ThemeColor[] | undefined);
    const dims = orientation === "landscape"
      ? { w: PAGE_DIMS.LANDSCAPE_W, h: PAGE_DIMS.LANDSCAPE_H }
      : { w: PAGE_DIMS.PORTRAIT_W, h: PAGE_DIMS.PORTRAIT_H };
    const doc = new jsPDF({ orientation, unit: "mm", format: [dims.w, dims.h] });
    const pageWidth = dims.w;
    const chartWidth = pageWidth - 28;
    const companyName = global?.companyName || property.name;
    const yearLabels = Array.from({ length: years }, (_, i) => startYear + i);
    const projRange = `${yearLabels[0]} \u2013 ${yearLabels[yearLabels.length - 1]}`;
    const isShort = version === "short";
    const entityTag = `${companyName} \u2014 ${property.name}`;
    const cashFlowData = getCashFlowData();
    const pdfLoan = calculateLoanParams(property as LoanParams, global as GlobalLoanParams);
    const pdfAcqYear = Math.floor(pdfLoan.acqMonthsFromModelStart / MONTHS_PER_YEAR);
    const pdfTotalPropertyCost = (property as any).purchasePrice + ((property as any).buildingImprovements ?? 0) + ((property as any).preOpeningCosts ?? 0);

    drawCoverPage(doc, {
      companyName,
      title: `${property.name} \u2014 Financial Statements`,
      subtitle: `${projectionYears}-Year Financial Projection (${projRange})`,
      meta: [
        `Property: ${property.name}`,
        `Period: FY ${projRange}`,
        "Classification: Confidential",
      ],
    });

    doc.addPage();
    drawTitle(doc, `${property.name} Income Statement`, 14, 15);
    drawSubtitleRow(doc, `${projectionYears}-Year Projection (${projRange})`, entityTag, 14, 22, pageWidth);
    drawSubtitle(doc, `Generated: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`, 14, 27);

    const incomeRows: ExportRowMeta[] = [];
    if (!isShort) {
      incomeRows.push({ category: "REVENUE", values: yearlyDetails.map(() => 0), isHeader: true });
      incomeRows.push({ category: "Room Revenue", values: yearlyDetails.map(y => y.revenueRooms), indent: 1 });
      incomeRows.push({ category: "Event Revenue", values: yearlyDetails.map(y => y.revenueEvents), indent: 1 });
      incomeRows.push({ category: "F&B Revenue", values: yearlyDetails.map(y => y.revenueFB), indent: 1 });
      incomeRows.push({ category: "Other Revenue", values: yearlyDetails.map(y => y.revenueOther), indent: 1 });
    }
    incomeRows.push({ category: "Total Revenue", values: yearlyDetails.map(y => y.revenueTotal), isBold: true });
    if (!isShort) {
      incomeRows.push({ category: "OPERATING EXPENSES", values: yearlyDetails.map(() => 0), isHeader: true });
      incomeRows.push({ category: "Room Expense", values: yearlyDetails.map(y => y.expenseRooms), indent: 1 });
      incomeRows.push({ category: "F&B Expense", values: yearlyDetails.map(y => y.expenseFB), indent: 1 });
      incomeRows.push({ category: "Event Expense", values: yearlyDetails.map(y => y.expenseEvents), indent: 1 });
      incomeRows.push({ category: "Marketing", values: yearlyDetails.map(y => y.expenseMarketing), indent: 1 });
      incomeRows.push({ category: "Property Ops", values: yearlyDetails.map(y => y.expensePropertyOps), indent: 1 });
      incomeRows.push({ category: "Admin & General", values: yearlyDetails.map(y => y.expenseAdmin), indent: 1 });
      incomeRows.push({ category: "IT", values: yearlyDetails.map(y => y.expenseIT), indent: 1 });
      incomeRows.push({ category: "Utilities", values: yearlyDetails.map(y => y.expenseUtilitiesVar + y.expenseUtilitiesFixed), indent: 1 });
      incomeRows.push({ category: "Other Expenses", values: yearlyDetails.map(y => y.expenseOther + y.expenseOtherCosts), indent: 1 });
    }
    incomeRows.push({ category: "Total Operating Expenses", values: yearlyDetails.map(y => y.totalExpenses - y.expenseFFE - y.expenseTaxes), isBold: true });
    incomeRows.push({ category: "Gross Operating Profit (GOP)", values: yearlyDetails.map(y => y.gop), isBold: true });
    if (!isShort) {
      incomeRows.push({ category: "MANAGEMENT FEES", values: yearlyDetails.map(() => 0), isHeader: true });
      incomeRows.push({ category: "Base Fee", values: yearlyDetails.map(y => y.feeBase), indent: 1 });
      incomeRows.push({ category: "Incentive Fee", values: yearlyDetails.map(y => y.feeIncentive), indent: 1 });
    }
    incomeRows.push({ category: "Total Management Fees", values: yearlyDetails.map(y => y.feeBase + y.feeIncentive), isBold: true });
    incomeRows.push({ category: "Adjusted GOP (AGOP)", values: yearlyDetails.map(y => y.agop), isBold: true });
    if (!isShort) {
      incomeRows.push({ category: "FIXED CHARGES", values: yearlyDetails.map(() => 0), isHeader: true });
      incomeRows.push({ category: "Property Taxes", values: yearlyDetails.map(y => y.expenseTaxes), indent: 1 });
    }
    incomeRows.push({ category: "Total Fixed Charges", values: yearlyDetails.map(y => y.expenseTaxes), isBold: true });
    incomeRows.push({ category: "Net Operating Income (NOI)", values: yearlyDetails.map(y => y.noi), isBold: true });
    if (!isShort) {
      incomeRows.push({ category: "FF&E Reserve", values: yearlyDetails.map(y => y.expenseFFE), indent: 1 });
    }
    incomeRows.push({ category: "Adjusted NOI (ANOI)", values: yearlyDetails.map(y => y.anoi), isBold: true });

    autoTable(doc, buildFinancialTableConfig(yearLabels, incomeRows, orientation, 32));

    if (yearlyChartData && yearlyChartData.length > 0) {
      doc.addPage();
      drawTitle(doc, `${property.name} \u2014 Income Statement Trend`, 14, 15, { fontSize: 16 });
      drawSubtitleRow(doc, `${projectionYears}-Year Revenue, GOP, AGOP, NOI, and ANOI Trend`, entityTag, 14, 22, pageWidth);
      drawLineChart({
        doc, x: 14, y: 30, width: chartWidth, height: 150,
        title: `${property.name} - Income Statement (${projectionYears}-Year Projection)`,
        series: [
          { name: 'Revenue', data: yearlyChartData.map((d) => ({ label: d.year, value: d.Revenue })), color: `#${brand.LINE_HEX[0]}` },
          { name: 'GOP', data: yearlyChartData.map((d) => ({ label: d.year, value: d.GOP })), color: `#${brand.LINE_HEX[1] || brand.SECONDARY_HEX}` },
          { name: 'AGOP', data: yearlyChartData.map((d) => ({ label: d.year, value: d.AGOP })), color: `#${brand.LINE_HEX[2] || brand.PRIMARY_HEX}` },
          { name: 'NOI', data: yearlyChartData.map((d) => ({ label: d.year, value: d.NOI })), color: `#${brand.LINE_HEX[3] || brand.ACCENT_HEX}` },
          { name: 'ANOI', data: yearlyChartData.map((d) => ({ label: d.year, value: d.ANOI })), color: `#${brand.LINE_HEX[4] || brand.MUTED_HEX}` },
        ],
        brand,
      });
    }

    const pdfCfo = yearlyDetails.map((yd, i) => {
      return yd.revenueTotal - (yd.totalExpenses - yd.expenseFFE) - cashFlowData[i].interestExpense - cashFlowData[i].taxLiability;
    });
    const pdfCfi = cashFlowData.map((cf, i) => {
      const ffe = yearlyDetails[i].expenseFFE;
      const acqCost = i === pdfAcqYear ? pdfTotalPropertyCost : 0;
      return -acqCost - ffe + cf.exitValue;
    });
    const pdfCff = cashFlowData.map((cf, i) => {
      const eqContrib = i === pdfAcqYear ? pdfLoan.equityInvested : 0;
      const loanProceeds = i === pdfAcqYear && pdfLoan.loanAmount > 0 ? pdfLoan.loanAmount : 0;
      return eqContrib + loanProceeds - cf.principalPayment + cf.refinancingProceeds;
    });
    const pdfNetChange = pdfCfo.map((cfo, i) => cfo + pdfCfi[i] + pdfCff[i]);
    let pdfRunCash = 0;
    const pdfOpenCash: number[] = [];
    const pdfCloseCash: number[] = [];
    for (let i = 0; i < years; i++) {
      pdfOpenCash.push(pdfRunCash);
      pdfRunCash += pdfNetChange[i];
      pdfCloseCash.push(pdfRunCash);
    }

    doc.addPage();
    drawTitle(doc, `${property.name} Cash Flow Statement`, 14, 15);
    drawSubtitleRow(doc, `${projectionYears}-Year Projection (${projRange})`, entityTag, 14, 22, pageWidth);
    drawSubtitle(doc, `Generated: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`, 14, 27);

    const cfRows: ExportRowMeta[] = [];
    if (!isShort) {
      cfRows.push({ category: "CASH FLOW FROM OPERATING ACTIVITIES", values: yearlyDetails.map(() => 0), isHeader: true });
      cfRows.push({ category: "Cash Received from Guests & Clients", values: yearlyDetails.map(y => y.revenueTotal), isBold: true });
      cfRows.push({ category: "Guest Room Revenue", values: yearlyDetails.map(y => y.revenueRooms), indent: 1 });
      cfRows.push({ category: "Event & Venue Revenue", values: yearlyDetails.map(y => y.revenueEvents), indent: 1 });
      cfRows.push({ category: "Food & Beverage Revenue", values: yearlyDetails.map(y => y.revenueFB), indent: 1 });
      cfRows.push({ category: "Other Revenue (Spa/Experiences)", values: yearlyDetails.map(y => y.revenueOther), indent: 1 });
      cfRows.push({ category: "Cash Paid for Operating Expenses", values: yearlyDetails.map(y => -(y.totalExpenses - y.expenseFFE)) });
      cfRows.push({ category: "Less: Interest Paid", values: cashFlowData.map(y => -y.interestExpense) });
      cfRows.push({ category: "Less: Income Taxes Paid", values: cashFlowData.map(y => -y.taxLiability) });
    }
    cfRows.push({ category: "Net Cash from Operating Activities", values: pdfCfo, isBold: true });
    if (!isShort) {
      cfRows.push({ category: "CASH FLOW FROM INVESTING ACTIVITIES", values: yearlyDetails.map(() => 0), isHeader: true });
      cfRows.push({ category: "Property Acquisition", values: cashFlowData.map((_, i) => i === pdfAcqYear ? -pdfTotalPropertyCost : 0) });
      cfRows.push({ category: "FF&E Reserve / Capital Improvements", values: yearlyDetails.map(y => -y.expenseFFE) });
      cfRows.push({ category: "Sale Proceeds (Net Exit Value)", values: cashFlowData.map(y => y.exitValue) });
    }
    cfRows.push({ category: "Net Cash from Investing Activities", values: pdfCfi, isBold: true });
    if (!isShort) {
      cfRows.push({ category: "CASH FLOW FROM FINANCING ACTIVITIES", values: yearlyDetails.map(() => 0), isHeader: true });
      cfRows.push({ category: "Equity Contribution", values: cashFlowData.map((_, i) => i === pdfAcqYear ? pdfLoan.equityInvested : 0) });
      cfRows.push({ category: "Loan Proceeds", values: cashFlowData.map((_, i) => i === pdfAcqYear && pdfLoan.loanAmount > 0 ? pdfLoan.loanAmount : 0) });
      cfRows.push({ category: "Less: Principal Repayments", values: cashFlowData.map(y => -y.principalPayment) });
      cfRows.push({ category: "Refinancing Proceeds", values: cashFlowData.map(y => y.refinancingProceeds) });
    }
    cfRows.push({ category: "Net Cash from Financing Activities", values: pdfCff, isBold: true });
    cfRows.push({ category: "Net Increase (Decrease) in Cash", values: pdfNetChange, isBold: true });
    cfRows.push({ category: "Opening Cash Balance", values: pdfOpenCash });
    cfRows.push({ category: "Closing Cash Balance", values: pdfCloseCash, isBold: true });
    if (!isShort) {
      cfRows.push({ category: "FREE CASH FLOW", values: yearlyDetails.map(() => 0), isHeader: true });
      cfRows.push({ category: "Net Cash from Operating Activities", values: pdfCfo });
      cfRows.push({ category: "Less: Capital Expenditures (FF&E)", values: yearlyDetails.map(y => -y.expenseFFE) });
      cfRows.push({ category: "Free Cash Flow (FCF)", values: pdfCfo.map((cfo, i) => cfo - yearlyDetails[i].expenseFFE), isBold: true });
      cfRows.push({ category: "Less: Principal Payments", values: cashFlowData.map(y => -y.principalPayment) });
      cfRows.push({ category: "Free Cash Flow to Equity (FCFE)", values: pdfCfo.map((cfo, i) => cfo - yearlyDetails[i].expenseFFE - cashFlowData[i].principalPayment), isBold: true });
    }

    autoTable(doc, buildFinancialTableConfig(yearLabels, cfRows, orientation, 32));

    if (yearlyChartData && yearlyChartData.length > 0) {
      doc.addPage();
      drawTitle(doc, `${property.name} \u2014 Cash Flow Trend`, 14, 15, { fontSize: 16 });
      drawSubtitleRow(doc, `${projectionYears}-Year NOI, ANOI, FCF, and FCFE Trend`, entityTag, 14, 22, pageWidth);
      drawLineChart({
        doc, x: 14, y: 30, width: chartWidth, height: 150,
        title: `${property.name} - Cash Flow (${projectionYears}-Year Projection)`,
        series: [
          { name: 'NOI', data: yearlyChartData.map((d) => ({ label: d.year, value: d.NOI })), color: `#${brand.LINE_HEX[3] || brand.ACCENT_HEX}` },
          { name: 'ANOI', data: yearlyChartData.map((d) => ({ label: d.year, value: d.ANOI })), color: `#${brand.LINE_HEX[0]}` },
          { name: 'FCF', data: cashFlowData.map((cf, i) => ({ label: String(yearLabels[i]), value: cf.freeCashFlow || 0 })), color: `#${brand.LINE_HEX[1] || brand.SECONDARY_HEX}` },
          { name: 'FCFE', data: cashFlowData.map((cf, i) => ({ label: String(yearLabels[i]), value: cf.freeCashFlowToEquity || 0 })), color: `#${brand.LINE_HEX[2] || brand.PRIMARY_HEX}` },
        ],
        brand,
      });
    }

    let cumLoanBalance = pdfLoan.loanAmount;
    const bsRows: ExportRowMeta[] = [];
    bsRows.push({ category: "ASSETS", values: yearlyDetails.map(() => 0), isHeader: true });
    bsRows.push({ category: "Cash & Equivalents", values: pdfCloseCash, indent: 1 });
    bsRows.push({ category: "Property (Net Book Value)", values: yearlyDetails.map((_, i) => {
      const depPerYear = pdfTotalPropertyCost / 39;
      return Math.max(pdfTotalPropertyCost - depPerYear * (i + 1), 0);
    }), indent: 1 });
    bsRows.push({ category: "Total Assets", values: yearlyDetails.map((_, i) => {
      const depPerYear = pdfTotalPropertyCost / 39;
      return pdfCloseCash[i] + Math.max(pdfTotalPropertyCost - depPerYear * (i + 1), 0);
    }), isBold: true });
    bsRows.push({ category: "LIABILITIES", values: yearlyDetails.map(() => 0), isHeader: true });
    const loanBalances = yearlyDetails.map((_, i) => {
      if (i === 0) cumLoanBalance = pdfLoan.loanAmount;
      if (i > 0) cumLoanBalance -= cashFlowData[i - 1].principalPayment;
      return Math.max(cumLoanBalance - cashFlowData[i].principalPayment, 0);
    });
    bsRows.push({ category: "Loan Balance", values: loanBalances, indent: 1 });
    bsRows.push({ category: "Total Liabilities", values: loanBalances, isBold: true });
    bsRows.push({ category: "EQUITY", values: yearlyDetails.map(() => 0), isHeader: true });
    bsRows.push({ category: "Total Equity", values: yearlyDetails.map((_, i) => {
      const depPerYear = pdfTotalPropertyCost / 39;
      const totalAssets = pdfCloseCash[i] + Math.max(pdfTotalPropertyCost - depPerYear * (i + 1), 0);
      return totalAssets - loanBalances[i];
    }), isBold: true });

    doc.addPage();
    drawTitle(doc, `${property.name} Balance Sheet`, 14, 15);
    drawSubtitleRow(doc, `${projectionYears}-Year Projection (${projRange})`, entityTag, 14, 22, pageWidth);
    drawSubtitle(doc, `Generated: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`, 14, 27);
    autoTable(doc, buildFinancialTableConfig(yearLabels, bsRows, orientation, 32));

    if (yearlyChartData && yearlyChartData.length > 0) {
      doc.addPage();
      const totalAssets = yearlyDetails.map((_, i) => {
        const depPerYear = pdfTotalPropertyCost / 39;
        return pdfCloseCash[i] + Math.max(pdfTotalPropertyCost - depPerYear * (i + 1), 0);
      });
      const totalEquity = yearlyDetails.map((_, i) => totalAssets[i] - loanBalances[i]);
      drawTitle(doc, `${property.name} \u2014 Balance Sheet Trend`, 14, 15, { fontSize: 16 });
      drawSubtitleRow(doc, `${projectionYears}-Year Assets, Liabilities, and Equity Trend`, entityTag, 14, 22, pageWidth);
      drawLineChart({
        doc, x: 14, y: 30, width: chartWidth, height: 150,
        title: `${property.name} - Balance Sheet (${projectionYears}-Year Projection)`,
        series: [
          { name: 'Total Assets', data: totalAssets.map((v, i) => ({ label: String(yearLabels[i]), value: v })), color: `#${brand.LINE_HEX[0]}` },
          { name: 'Total Liabilities', data: loanBalances.map((v, i) => ({ label: String(yearLabels[i]), value: v })), color: `#${brand.LINE_HEX[1] || brand.SECONDARY_HEX}` },
          { name: 'Total Equity', data: totalEquity.map((v, i) => ({ label: String(yearLabels[i]), value: v })), color: `#${brand.LINE_HEX[2] || brand.PRIMARY_HEX}` },
        ],
        brand,
      });
    }

    addFooters(doc, companyName, { skipPages: new Set([1]) });
    const { saveFile } = await import("@/lib/exports/saveFile");
    await saveFile(doc.output("blob"), customFilename || `${property.name.replace(/\s+/g, '_')}_Financial_Statements.pdf`);
  };

  const handleExport = async (orientation: 'landscape' | 'portrait', version: ExportVersion, customFilename?: string) => {
    if (exportType === 'pdf') {
      await exportUnifiedPDF(orientation, version, customFilename);
    } else if (exportType === 'chart') {
      await exportChartPNG(orientation, customFilename);
    } else if (exportType === 'xlsx') {
      handleExcelExport(customFilename);
    } else if (exportType === 'pptx') {
      handlePPTXExport(customFilename);
    }
  };

  return (
    <Layout>
      <AnimatedPage>
      {SaveDialog}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExport}
        title={exportType === "chart" ? "Export Chart" : `Export ${exportType.toUpperCase()}`}
        showVersionOption={exportType !== "chart"}
        premiumFormat={exportType === "chart" ? "pdf" : exportType as any}
        suggestedFilename={
          exportType === 'chart'
            ? `${property.name} Chart`
            : `${property.name} ${activeTab === "income" ? "Income Statement" : activeTab === "cashflow" ? "Cash Flow" : "Balance Sheet"}`
        }
        fileExtension={exportType === "chart" ? ".pdf" : `.${exportType}`}
        getPremiumExportData={exportType !== 'chart' && property && yearlyDetails.length > 0 ? (version: ExportVersion, includeCoverPage: boolean) => {
          const yrLabels = yearlyChartData.map((d) => d.year);
          const summaryOnly = version === "short";
          const cashFlowData = getCashFlowData();
          const pdfLoan = calculateLoanParams(property as LoanParams, global as GlobalLoanParams);
          const pdfAcqYear = Math.floor(pdfLoan.acqMonthsFromModelStart / MONTHS_PER_YEAR);
          const pdfTotalPropertyCost = (property as any).purchasePrice + ((property as any).buildingImprovements ?? 0) + ((property as any).preOpeningCosts ?? 0);

          // --- Income Statement ---
          const incomeRows: Array<{ category: string; values: number[]; indent?: number; isBold?: boolean; isHeader?: boolean }> = [];
          if (!summaryOnly) {
            incomeRows.push({ category: "REVENUE", values: yearlyDetails.map(() => 0), isHeader: true });
            incomeRows.push({ category: "Room Revenue", values: yearlyDetails.map(y => y.revenueRooms), indent: 1 });
            incomeRows.push({ category: "Event Revenue", values: yearlyDetails.map(y => y.revenueEvents), indent: 1 });
            incomeRows.push({ category: "F&B Revenue", values: yearlyDetails.map(y => y.revenueFB), indent: 1 });
            incomeRows.push({ category: "Other Revenue", values: yearlyDetails.map(y => y.revenueOther), indent: 1 });
          }
          incomeRows.push({ category: "Total Revenue", values: yearlyDetails.map(y => y.revenueTotal), isBold: true });
          if (!summaryOnly) {
            incomeRows.push({ category: "OPERATING EXPENSES", values: yearlyDetails.map(() => 0), isHeader: true });
            incomeRows.push({ category: "Room Expense", values: yearlyDetails.map(y => y.expenseRooms), indent: 1 });
            incomeRows.push({ category: "F&B Expense", values: yearlyDetails.map(y => y.expenseFB), indent: 1 });
            incomeRows.push({ category: "Event Expense", values: yearlyDetails.map(y => y.expenseEvents), indent: 1 });
            incomeRows.push({ category: "Marketing", values: yearlyDetails.map(y => y.expenseMarketing), indent: 1 });
            incomeRows.push({ category: "Property Ops", values: yearlyDetails.map(y => y.expensePropertyOps), indent: 1 });
            incomeRows.push({ category: "Admin & General", values: yearlyDetails.map(y => y.expenseAdmin), indent: 1 });
            incomeRows.push({ category: "IT", values: yearlyDetails.map(y => y.expenseIT), indent: 1 });
            incomeRows.push({ category: "Utilities", values: yearlyDetails.map(y => y.expenseUtilitiesVar + y.expenseUtilitiesFixed), indent: 1 });
            incomeRows.push({ category: "Other Expenses", values: yearlyDetails.map(y => y.expenseOther + y.expenseOtherCosts), indent: 1 });
          }
          incomeRows.push({ category: "Total Operating Expenses", values: yearlyDetails.map(y => y.totalExpenses - y.expenseFFE - y.expenseTaxes), isBold: true });
          incomeRows.push({ category: "Gross Operating Profit (GOP)", values: yearlyDetails.map(y => y.gop), isBold: true });
          if (!summaryOnly) {
            incomeRows.push({ category: "MANAGEMENT FEES", values: yearlyDetails.map(() => 0), isHeader: true });
            incomeRows.push({ category: "Base Fee", values: yearlyDetails.map(y => y.feeBase), indent: 1 });
            incomeRows.push({ category: "Incentive Fee", values: yearlyDetails.map(y => y.feeIncentive), indent: 1 });
          }
          incomeRows.push({ category: "Total Management Fees", values: yearlyDetails.map(y => y.feeBase + y.feeIncentive), isBold: true });
          incomeRows.push({ category: "Adjusted GOP (AGOP)", values: yearlyDetails.map(y => y.agop), isBold: true });
          if (!summaryOnly) {
            incomeRows.push({ category: "FIXED CHARGES", values: yearlyDetails.map(() => 0), isHeader: true });
            incomeRows.push({ category: "Property Taxes", values: yearlyDetails.map(y => y.expenseTaxes), indent: 1 });
          }
          incomeRows.push({ category: "Total Fixed Charges", values: yearlyDetails.map(y => y.expenseTaxes), isBold: true });
          incomeRows.push({ category: "Net Operating Income (NOI)", values: yearlyDetails.map(y => y.noi), isBold: true });
          if (!summaryOnly) {
            incomeRows.push({ category: "FF&E Reserve", values: yearlyDetails.map(y => y.expenseFFE), indent: 1 });
          }
          incomeRows.push({ category: "Adjusted NOI (ANOI)", values: yearlyDetails.map(y => y.anoi), isBold: true });

          // --- Cash Flow Statement ---
          const pdfCfo = yearlyDetails.map((yd, i) => yd.revenueTotal - (yd.totalExpenses - yd.expenseFFE) - cashFlowData[i].interestExpense - cashFlowData[i].taxLiability);
          const pdfCfi = cashFlowData.map((cf, i) => {
            const ffe = yearlyDetails[i].expenseFFE;
            const acqCost = i === pdfAcqYear ? pdfTotalPropertyCost : 0;
            return -acqCost - ffe + cf.exitValue;
          });
          const pdfCff = cashFlowData.map((cf, i) => {
            const eqContrib = i === pdfAcqYear ? pdfLoan.equityInvested : 0;
            const loanProceeds = i === pdfAcqYear && pdfLoan.loanAmount > 0 ? pdfLoan.loanAmount : 0;
            return eqContrib + loanProceeds - cf.principalPayment + cf.refinancingProceeds;
          });
          const pdfNetChange = pdfCfo.map((cfo, i) => cfo + pdfCfi[i] + pdfCff[i]);
          let pdfRunCash = 0;
          const pdfOpenCash: number[] = [];
          const pdfCloseCash: number[] = [];
          for (let i = 0; i < years; i++) {
            pdfOpenCash.push(pdfRunCash);
            pdfRunCash += pdfNetChange[i];
            pdfCloseCash.push(pdfRunCash);
          }

          const cfRows: Array<{ category: string; values: number[]; indent?: number; isBold?: boolean; isHeader?: boolean }> = [];
          if (!summaryOnly) {
            cfRows.push({ category: "CASH FLOW FROM OPERATING ACTIVITIES", values: yearlyDetails.map(() => 0), isHeader: true });
            cfRows.push({ category: "Cash Received from Guests & Clients", values: yearlyDetails.map(y => y.revenueTotal), isBold: true });
            cfRows.push({ category: "Guest Room Revenue", values: yearlyDetails.map(y => y.revenueRooms), indent: 1 });
            cfRows.push({ category: "Event & Venue Revenue", values: yearlyDetails.map(y => y.revenueEvents), indent: 1 });
            cfRows.push({ category: "Food & Beverage Revenue", values: yearlyDetails.map(y => y.revenueFB), indent: 1 });
            cfRows.push({ category: "Other Revenue (Spa/Experiences)", values: yearlyDetails.map(y => y.revenueOther), indent: 1 });
            cfRows.push({ category: "Cash Paid for Operating Expenses", values: yearlyDetails.map(y => -(y.totalExpenses - y.expenseFFE)) });
            cfRows.push({ category: "Less: Interest Paid", values: cashFlowData.map(y => -y.interestExpense) });
            cfRows.push({ category: "Less: Income Taxes Paid", values: cashFlowData.map(y => -y.taxLiability) });
          }
          cfRows.push({ category: "Net Cash from Operating Activities", values: pdfCfo, isBold: true });
          if (!summaryOnly) {
            cfRows.push({ category: "CASH FLOW FROM INVESTING ACTIVITIES", values: yearlyDetails.map(() => 0), isHeader: true });
            cfRows.push({ category: "Property Acquisition", values: cashFlowData.map((_, i) => i === pdfAcqYear ? -pdfTotalPropertyCost : 0) });
            cfRows.push({ category: "FF&E Reserve / Capital Improvements", values: yearlyDetails.map(y => -y.expenseFFE) });
            cfRows.push({ category: "Sale Proceeds (Net Exit Value)", values: cashFlowData.map(y => y.exitValue) });
          }
          cfRows.push({ category: "Net Cash from Investing Activities", values: pdfCfi, isBold: true });
          if (!summaryOnly) {
            cfRows.push({ category: "CASH FLOW FROM FINANCING ACTIVITIES", values: yearlyDetails.map(() => 0), isHeader: true });
            cfRows.push({ category: "Equity Contribution", values: cashFlowData.map((_, i) => i === pdfAcqYear ? pdfLoan.equityInvested : 0) });
            cfRows.push({ category: "Loan Proceeds", values: cashFlowData.map((_, i) => i === pdfAcqYear && pdfLoan.loanAmount > 0 ? pdfLoan.loanAmount : 0) });
            cfRows.push({ category: "Less: Principal Repayments", values: cashFlowData.map(y => -y.principalPayment) });
            cfRows.push({ category: "Refinancing Proceeds", values: cashFlowData.map(y => y.refinancingProceeds) });
          }
          cfRows.push({ category: "Net Cash from Financing Activities", values: pdfCff, isBold: true });
          cfRows.push({ category: "Net Increase (Decrease) in Cash", values: pdfNetChange, isBold: true });
          cfRows.push({ category: "Opening Cash Balance", values: pdfOpenCash });
          cfRows.push({ category: "Closing Cash Balance", values: pdfCloseCash, isBold: true });

          // --- Balance Sheet (summary) ---
          const bsRows: Array<{ category: string; values: number[]; indent?: number; isBold?: boolean; isHeader?: boolean }> = [];
          bsRows.push({ category: "ASSETS", values: yearlyDetails.map(() => 0), isHeader: true });
          bsRows.push({ category: "Cash & Equivalents", values: pdfCloseCash, indent: 1 });
          bsRows.push({ category: "Property (Net of Depreciation)", values: cashFlowData.map(cf => {
            const grossAsset = pdfTotalPropertyCost;
            return grossAsset - cf.depreciation;
          }), indent: 1 });
          bsRows.push({ category: "Total Assets", values: pdfCloseCash.map((cash, i) => cash + pdfTotalPropertyCost - cashFlowData[i].depreciation), isBold: true });
          bsRows.push({ category: "LIABILITIES", values: yearlyDetails.map(() => 0), isHeader: true });
          bsRows.push({ category: "Outstanding Debt", values: cashFlowData.map(cf => {
            const borrowed = pdfLoan.loanAmount + cf.refinancingProceeds;
            return borrowed - cf.principalPayment;
          }), indent: 1 });
          bsRows.push({ category: "Total Liabilities", values: cashFlowData.map(cf => pdfLoan.loanAmount + cf.refinancingProceeds - cf.principalPayment), isBold: true });
          bsRows.push({ category: "EQUITY", values: yearlyDetails.map(() => 0), isHeader: true });
          bsRows.push({ category: "Equity Invested", values: yearlyDetails.map(() => pdfLoan.equityInvested), indent: 1 });
          bsRows.push({ category: "Retained Earnings", values: cashFlowData.map((cf, i) => {
            const totalAssets = pdfCloseCash[i] + pdfTotalPropertyCost - cf.depreciation;
            const totalLiabilities = pdfLoan.loanAmount + cf.refinancingProceeds - cf.principalPayment;
            return totalAssets - totalLiabilities - pdfLoan.equityInvested;
          }), indent: 1 });
          bsRows.push({ category: "Total Equity", values: cashFlowData.map((cf, i) => {
            const totalAssets = pdfCloseCash[i] + pdfTotalPropertyCost - cf.depreciation;
            const totalLiabilities = pdfLoan.loanAmount + cf.refinancingProceeds - cf.principalPayment;
            return totalAssets - totalLiabilities;
          }), isBold: true });

          // --- Investment Analysis ---
          const investRows: Array<{ category: string; values: number[]; indent?: number; isBold?: boolean; isHeader?: boolean }> = [];
          investRows.push({ category: "Investment Summary", values: yearlyDetails.map(() => 0), isHeader: true });
          investRows.push({ category: "Equity Invested", values: yearlyDetails.map(() => pdfLoan.equityInvested), indent: 1 });
          investRows.push({ category: "Total Property Cost", values: yearlyDetails.map(() => pdfTotalPropertyCost), indent: 1 });
          investRows.push({ category: "Loan Amount", values: yearlyDetails.map(() => pdfLoan.loanAmount), indent: 1 });
          if (!summaryOnly) {
            investRows.push({ category: "Annual Revenue", values: yearlyDetails.map(y => y.revenueTotal), indent: 1 });
            investRows.push({ category: "Annual NOI", values: yearlyDetails.map(y => y.noi), indent: 1 });
            investRows.push({ category: "Annual ANOI", values: yearlyDetails.map(y => y.anoi), indent: 1 });
            investRows.push({ category: "Annual Cash Flow", values: yearlyChartData.map(d => d.CashFlow), indent: 1 });
            investRows.push({ category: "Debt Service", values: cashFlowData.map(cf => cf.debtService), indent: 1 });
          }
          investRows.push({ category: "Closing Cash Balance", values: pdfCloseCash, isBold: true });

          const mapRows = (rows: Array<{ category: string; values: number[]; indent?: number; isBold?: boolean; isHeader?: boolean; isItalic?: boolean; format?: string }>) => rows.map(r => ({
            category: r.category,
            values: r.values,
            indent: r.indent,
            isBold: r.isBold,
            isHeader: r.isHeader,
            isItalic: r.isItalic,
            format: r.format,
          }));

          return {
            entityName: property.name,
            companyName: global?.companyName || "H+ Analytics",
            statementType: activeTab === "income" ? "Income Statement" : activeTab === "cashflow" ? "Cash Flow Statement" : "Balance Sheet",
            years: yrLabels,
            statements: [
              { title: `${property.name} — Income Statement`, years: yrLabels, rows: mapRows(incomeRows) },
              { title: `${property.name} — Cash Flow Statement`, years: yrLabels, rows: mapRows(cfRows) },
              { title: `${property.name} — Balance Sheet`, years: yrLabels, rows: mapRows(bsRows) },
              { title: `${property.name} — Investment Analysis`, years: yrLabels, rows: mapRows(investRows) },
            ],
            metrics: [
              { label: "Total Revenue (Year 1)", value: yearlyChartData[0] ? formatMoney(yearlyChartData[0].Revenue) : "—" },
              { label: "GOP (Year 1)", value: yearlyChartData[0] ? formatMoney(yearlyChartData[0].GOP) : "—" },
              { label: "NOI (Year 1)", value: yearlyChartData[0] ? formatMoney(yearlyChartData[0].NOI) : "—" },
              { label: "ANOI (Year 1)", value: yearlyChartData[0] ? formatMoney(yearlyChartData[0].ANOI) : "—" },
            ],
            projectionYears,
            includeCoverPage,
            themeColors: brandingData?.themeColors?.map((c: any) => ({ name: c.name, hexCode: c.hexCode, rank: c.rank })),
          } as PremiumExportPayload;
        } : undefined}
      />
      <div className="space-y-6">
        <PropertyHeader
          property={property}
          propertyId={propertyId}
          heroCaption={heroCaption}
          onPhotoUploadComplete={handlePhotoUploadComplete}
        />

        <ScrollReveal>
          <PropertyMap
            latitude={property.latitude}
            longitude={property.longitude}
            propertyName={property.name}
            propertyId={propertyId}
          />
        </ScrollReveal>

        <BenchmarkPanel
          property={property}
          yearlyChartData={yearlyChartData}
        />

        <ScrollReveal>
        <CalcDetailsProvider show={global?.showPropertyCalculationDetails ?? true}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-4">
            <CurrentThemeTab
              tabs={[
                { value: 'income', label: 'Income Statement', icon: IconIncomeStatement },
                { value: 'cashflow', label: 'Cash Flows', icon: IconCashFlow },
                { value: 'balance', label: 'Balance Sheet', icon: IconBalanceSheet },
                { value: 'ppe', label: 'PP&E / Cost Basis', icon: IconPPE },
                { value: 'reconciliation', label: 'Reconciliation', icon: IconBanknote },
                { value: 'documents', label: 'Documents', icon: IconFileStack }
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              rightContent={
                <ExportMenu
                  variant="light"
                  actions={[
                    pdfAction(() => { setExportType('pdf'); setExportDialogOpen(true); }),
                    excelAction(() => { setExportType('xlsx'); setExportDialogOpen(true); }),
                    csvAction(() => requestSave(`${property.name} Financial Statements`, ".csv", (f) => exportAllStatementsCSV(f))),
                    pptxAction(() => { setExportType('pptx'); setExportDialogOpen(true); }),
                    docxAction(() => { setExportType('docx'); setExportDialogOpen(true); }),
                    chartAction(() => { setExportType('chart'); setExportDialogOpen(true); }),
                    pngAction(() => requestSave(`${property.name} ${activeTab} Table`, ".png", (f) => exportTablePNG('landscape', f))),
                  ]}
                />
              }
            />
          </div>
          
          <TabsContent value="income" className="mt-6">
            <IncomeStatementTab
              yearlyChartData={yearlyChartData}
              yearlyDetails={yearlyDetails}
              financials={financials}
              property={property}
              global={global}
              projectionYears={projectionYears}
              startYear={startYear}
              incomeChartRef={incomeChartRef}
              incomeTableRef={incomeTableRef}
              incomeAllExpanded={incomeAllExpanded}
            />
          </TabsContent>
          
          <TabsContent value="cashflow" className="mt-6">
            <CashFlowTab
              yearlyChartData={yearlyChartData}
              cashFlowData={cashFlowDataMemo}
              yearlyDetails={yearlyDetails}
              financials={financials}
              property={property}
              global={global}
              projectionYears={projectionYears}
              startYear={startYear}
              cashFlowChartRef={cashFlowChartRef}
              cashFlowTableRef={cashFlowTableRef}
            />
          </TabsContent>

          <TabsContent value="balance" className="mt-6">
            <div className="space-y-6">
              {balanceChartData.length > 0 && (
                <FinancialChart
                  data={balanceChartData}
                  series={[
                    { dataKey: "Assets", name: "Total Assets", color: "hsl(var(--line-1))" },
                    { dataKey: "Liabilities", name: "Total Liabilities", color: "hsl(var(--line-2))" },
                    { dataKey: "Equity", name: "Total Equity", color: "hsl(var(--line-3))" },
                  ]}
                  title={`${property.name} Balance Sheet Trends (${projectionYears}-Year Projection)`}
                  id="property-balance-chart"
                />
              )}
              <ConsolidatedBalanceSheet
                properties={[property]}
                global={global}
                allProFormas={[{ property, data: financials }]}
                year={projectionYears}
                propertyIndex={0}
              />
            </div>
          </TabsContent>

          <TabsContent value="ppe" className="mt-6">
            <PPECostBasisSchedule property={property} global={global} />
          </TabsContent>

          <TabsContent value="reconciliation" className="mt-6">
            <ReconciliationTab
              propertyId={propertyId}
              financials={financials}
              startYear={startYear}
              projectionYears={projectionYears}
            />
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <DocumentExtractionPanel propertyId={propertyId} />
            </div>
          </TabsContent>
        </Tabs>
        </CalcDetailsProvider>
        </ScrollReveal>
      </div>
      </AnimatedPage>
    </Layout>
  );
}
