import { useMemo, useState, useRef } from "react";
import Layout from "@/components/Layout";
import { useProperty, useGlobalAssumptions } from "@/lib/api";
import { generatePropertyProForma, formatMoney, getFiscalYearForModelYear } from "@/lib/financialEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { YearlyIncomeStatement } from "@/components/YearlyIncomeStatement";
import { YearlyCashFlowStatement } from "@/components/YearlyCashFlowStatement";
import { ConsolidatedBalanceSheet } from "@/components/ConsolidatedBalanceSheet";
import { CalcDetailsProvider } from "@/components/financial-table-rows";
import { Tabs, TabsContent, DarkGlassTabs } from "@/components/ui/tabs";
import { FileText, Banknote, Scale, Building2, ArrowLeft, MapPin, Loader2, Settings2, Sheet, ChevronDown, ChevronRight, Info, Map, AlertTriangle } from "lucide-react";
import { ExportMenu, pdfAction, excelAction, csvAction, pptxAction, chartAction, pngAction } from "@/components/ui/export-toolbar";
import { downloadCSV } from "@/lib/exports/csvExport";
import { exportPropertyPPTX } from "@/lib/exports/pptxExport";
import {
  exportPropertyIncomeStatement,
  exportPropertyCashFlow,
  exportPropertyBalanceSheet,
  exportFullPropertyWorkbook,
} from "@/lib/exports/excelExport";
import domtoimage from 'dom-to-image-more';
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { GlassButton } from "@/components/ui/glass-button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { drawLineChart } from "@/lib/pdfChartDrawer";
import { calculateLoanParams, LoanParams, GlobalLoanParams, DEFAULT_LTV, PROJECTION_YEARS } from "@/lib/loanCalculations";
import { DEPRECIATION_YEARS, DAYS_PER_MONTH, DEFAULT_LAND_VALUE_PERCENT, DEFAULT_REV_SHARE_EVENTS, DEFAULT_REV_SHARE_FB, DEFAULT_REV_SHARE_OTHER, DEFAULT_CATERING_BOOST_PCT } from "@shared/constants";
import { aggregateCashFlowByYear } from "@/lib/cashFlowAggregator";
import { aggregatePropertyByYear } from "@/lib/yearlyAggregator";
import { computeCashFlowSections } from "@/lib/cashFlowSections";
import { PropertyPhotoUpload } from "@/components/PropertyPhotoUpload";
import { useQueryClient } from "@tanstack/react-query";
import { ExportDialog } from "@/components/ExportDialog";

import { HelpTooltip } from "@/components/ui/help-tooltip";
import { KPIGrid, Gauge, InsightPanel, AnimatedPage, ScrollReveal, formatCompact, formatPercent, type KPIItem } from "@/components/graphics";

function PPECostBasisSchedule({ property, global }: { property: any; global: any }) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    acquisition: true,
    depreciation: false,
    fixedCostAnchor: false,
    loanBasis: false,
  });

  const toggle = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const fmt = (n: number) => formatMoney(n);
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

  const purchasePrice = property.purchasePrice ?? 0;
  const buildingImprovements = property.buildingImprovements ?? 0;
  const preOpeningCosts = property.preOpeningCosts ?? 0;
  const operatingReserve = property.operatingReserve ?? 0;
  const landPct = property.landValuePercent ?? DEFAULT_LAND_VALUE_PERCENT;
  const landValue = purchasePrice * landPct;
  const buildingValue = purchasePrice * (1 - landPct);
  const totalDepreciableBasis = buildingValue + buildingImprovements;
  const annualDepreciation = totalDepreciableBasis / DEPRECIATION_YEARS;
  const monthlyDepreciation = annualDepreciation / 12;
  const totalProjectCost = purchasePrice + buildingImprovements + preOpeningCosts + operatingReserve;
  const totalPropertyValue = purchasePrice + buildingImprovements;

  const revShareEvents = property.revShareEvents ?? DEFAULT_REV_SHARE_EVENTS;
  const revShareFB = property.revShareFB ?? DEFAULT_REV_SHARE_FB;
  const revShareOther = property.revShareOther ?? DEFAULT_REV_SHARE_OTHER;
  const cateringBoostPct = property.cateringBoostPercent ?? DEFAULT_CATERING_BOOST_PCT;
  const cateringBoostMultiplier = 1 + cateringBoostPct;

  const baseMonthlyRoomRev = property.roomCount * DAYS_PER_MONTH * property.startAdr * property.startOccupancy;
  const baseMonthlyEventsRev = baseMonthlyRoomRev * revShareEvents;
  const baseMonthlyFBRev = baseMonthlyRoomRev * revShareFB * cateringBoostMultiplier;
  const baseMonthlyOtherRev = baseMonthlyRoomRev * revShareOther;
  const baseMonthlyTotalRev = baseMonthlyRoomRev + baseMonthlyEventsRev + baseMonthlyFBRev + baseMonthlyOtherRev;
  const baseAnnualTotalRev = baseMonthlyTotalRev * 12;

  const fixedCostEscRate = global.fixedCostEscalationRate ?? 0.03;
  const costRatePropertyOps = property.costRatePropertyOps ?? 0.04;
  const costRateAdmin = property.costRateAdmin ?? 0.08;
  const costRateInsurance = property.costRateInsurance ?? 0.02;
  const costRateTaxes = property.costRateTaxes ?? 0.03;
  const costRateIT = property.costRateIT ?? 0.02;
  const costRateOther = property.costRateOther ?? 0.05;

  const ltv = property.acquisitionLTV ?? DEFAULT_LTV;
  const loanAmount = property.type === "Financed" ? totalPropertyValue * ltv : 0;
  const equityRequired = totalProjectCost - loanAmount;

  const SectionRow = ({ sectionKey, label, value, tooltip }: { sectionKey: string; label: string; value: string; tooltip?: string }) => {
    const isOpen = openSections[sectionKey];
    return (
      <tr
        className="cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-colors"
        onClick={() => toggle(sectionKey)}
        data-testid={`ppe-section-${sectionKey}`}
      >
        <td className="py-3 px-4 font-semibold text-gray-900 flex items-center gap-2">
          {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          {label}
          {tooltip && <HelpTooltip text={tooltip} />}
        </td>
        <td className="py-3 px-4 text-right font-semibold font-mono text-gray-900">{value}</td>
      </tr>
    );
  };

  const DetailRow = ({ label, value, indent, muted, bold, tooltip }: { label: string; value: string; indent?: boolean; muted?: boolean; bold?: boolean; tooltip?: string }) => (
    <tr className={`border-b border-gray-50 ${bold ? "bg-gray-50" : ""}`}>
      <td className={`py-2 px-4 ${indent ? "pl-12" : "pl-8"} ${muted ? "text-gray-400" : "text-gray-600"} ${bold ? "font-semibold text-gray-900" : ""}`}>
        <span className="flex items-center gap-1">
          {label}
          {tooltip && <HelpTooltip text={tooltip} />}
        </span>
      </td>
      <td className={`py-2 px-4 text-right font-mono ${muted ? "text-gray-400" : "text-gray-600"} ${bold ? "font-semibold text-gray-900" : ""}`}>{value}</td>
    </tr>
  );

  return (
    <Card className="overflow-hidden bg-white shadow-lg border border-gray-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-gray-900 flex items-center gap-2">
          PP&E / Cost Basis Schedule
          <HelpTooltip text="Shows the underlying asset values, depreciation basis, and fixed-cost anchors used by the financial engine. Click each section to expand details." manualSection="property-formulas" />
        </CardTitle>
        <p className="text-sm text-gray-500">
          {property.name} — Checker transparency view
        </p>
      </CardHeader>
      <div className="px-6 pb-6">
        <table className="w-full" data-testid="ppe-schedule-table">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 px-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Item</th>
              <th className="text-right py-2 px-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Value</th>
            </tr>
          </thead>
          <tbody>
            <SectionRow sectionKey="acquisition" label="Acquisition & Project Cost" value={fmt(totalProjectCost)} tooltip="Total capital required to acquire, improve, and open the property." />
            {openSections.acquisition && (
              <>
                <DetailRow label="Purchase Price" value={fmt(purchasePrice)} />
                <DetailRow label={`Land Value (${pct(landPct)} of purchase)`} value={fmt(landValue)} indent tooltip="Land does not depreciate per IRS Publication 946." />
                <DetailRow label={`Building Value (${pct(1 - landPct)} of purchase)`} value={fmt(buildingValue)} indent />
                <DetailRow label="Building Improvements" value={fmt(buildingImprovements)} />
                <DetailRow label="Pre-Opening Costs" value={fmt(preOpeningCosts)} />
                <DetailRow label="Operating Reserve" value={fmt(operatingReserve)} />
                <DetailRow label="Total Property Value (Price + Improvements)" value={fmt(totalPropertyValue)} bold tooltip="Used as the basis for loan calculations (LTV applied to this amount)." />
                <DetailRow label="Total Project Cost" value={fmt(totalProjectCost)} bold />
              </>
            )}

            <SectionRow sectionKey="depreciation" label="Depreciation Schedule (ASC 360)" value={fmt(annualDepreciation) + " /yr"} tooltip="Straight-line depreciation over 27.5 years. Land is excluded from the depreciable basis." />
            {openSections.depreciation && (
              <>
                <DetailRow label="Building Value (from purchase)" value={fmt(buildingValue)} />
                <DetailRow label="+ Building Improvements" value={fmt(buildingImprovements)} />
                <DetailRow label="= Total Depreciable Basis" value={fmt(totalDepreciableBasis)} bold />
                <DetailRow label="Depreciation Period" value={`${DEPRECIATION_YEARS} years`} />
                <DetailRow label="Annual Depreciation" value={fmt(annualDepreciation)} bold />
                <DetailRow label="Monthly Depreciation" value={fmt(monthlyDepreciation)} />
                <DetailRow label="Full Depreciation Date" value={`~${DEPRECIATION_YEARS} years after acquisition`} muted />
              </>
            )}

            <SectionRow
              sectionKey="fixedCostAnchor"
              label="Fixed Cost Anchor (Year 1 Base Revenue)"
              value={fmt(baseAnnualTotalRev) + " /yr"}
              tooltip="Fixed operating costs (Property Ops, Admin, IT, etc.) are calculated as a rate × this Year 1 base revenue, then escalated annually. They do NOT scale with actual revenue growth. Insurance and Property Taxes are calculated separately based on property value."
            />
            {openSections.fixedCostAnchor && (
              <>
                <DetailRow label="Room Count" value={`${property.roomCount} rooms`} />
                <DetailRow label="Days per Month" value={`${DAYS_PER_MONTH}`} />
                <DetailRow label="Starting ADR" value={fmt(property.startAdr)} />
                <DetailRow label="Starting Occupancy" value={pct(property.startOccupancy)} />
                <DetailRow label="Base Monthly Room Revenue" value={fmt(baseMonthlyRoomRev)} bold />
                <DetailRow label={`Events Revenue (${pct(revShareEvents)} of rooms)`} value={fmt(baseMonthlyEventsRev)} indent />
                <DetailRow label={`F&B Revenue (${pct(revShareFB)} × ${pct(cateringBoostMultiplier - 1)} boost)`} value={fmt(baseMonthlyFBRev)} indent />
                <DetailRow label={`Other Revenue (${pct(revShareOther)} of rooms)`} value={fmt(baseMonthlyOtherRev)} indent />
                <DetailRow label="Base Monthly Total Revenue" value={fmt(baseMonthlyTotalRev)} bold />
                <DetailRow label="Base Annual Total Revenue" value={fmt(baseAnnualTotalRev)} bold />

                <tr className="border-b border-gray-50">
                  <td colSpan={2} className="py-3 px-8">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" /> Fixed Cost Rates Applied to Base Revenue
                      </p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-blue-700">
                        <span>Property Operations: {pct(costRatePropertyOps)} → {fmt(baseMonthlyTotalRev * costRatePropertyOps)}/mo</span>
                        <span>Admin & General: {pct(costRateAdmin)} → {fmt(baseMonthlyTotalRev * costRateAdmin)}/mo</span>
                        <span>Insurance: {pct(costRateInsurance)} of property value → {fmt(totalPropertyValue / 12 * costRateInsurance)}/mo</span>
                        <span>Property Taxes: {pct(costRateTaxes)} of property value → {fmt(totalPropertyValue / 12 * costRateTaxes)}/mo</span>
                        <span>IT & Technology: {pct(costRateIT)} → {fmt(baseMonthlyTotalRev * costRateIT)}/mo</span>
                        <span>Other Costs: {pct(costRateOther)} → {fmt(baseMonthlyTotalRev * costRateOther)}/mo</span>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        These base amounts escalate at {pct(fixedCostEscRate)}/year (compounding). Year 2 = base × {(1 + fixedCostEscRate).toFixed(4)}, Year 3 = base × {((1 + fixedCostEscRate) ** 2).toFixed(4)}, etc.
                      </p>
                    </div>
                  </td>
                </tr>
              </>
            )}

            {property.type === "Financed" && (
              <>
                <SectionRow sectionKey="loanBasis" label="Loan & Equity Basis" value={fmt(loanAmount)} tooltip="Loan amount is based on LTV × Total Property Value (purchase price + improvements). Equity = Total Project Cost − Loan." />
                {openSections.loanBasis && (
                  <>
                    <DetailRow label="Financing Type" value={property.type} />
                    <DetailRow label="Total Property Value (Loan Basis)" value={fmt(totalPropertyValue)} tooltip="LTV is applied to this amount, not the total project cost." />
                    <DetailRow label={`Loan-to-Value (LTV): ${pct(ltv)}`} value={fmt(loanAmount)} bold />
                    <DetailRow label="Equity Required" value={fmt(equityRequired)} bold />
                    <DetailRow label="Interest Rate" value={pct(property.acquisitionInterestRate ?? global.debtAssumptions?.interestRate ?? 0.09)} />
                    <DetailRow label="Amortization Term" value={`${property.acquisitionTermYears ?? global.debtAssumptions?.amortizationYears ?? 25} years`} />
                  </>
                )}
              </>
            )}
            {property.type === "Full Equity" && (
              <>
                <SectionRow sectionKey="loanBasis" label="Equity Basis" value={fmt(totalProjectCost)} tooltip="Full equity deal — no debt financing. Total equity equals the full project cost." />
                {openSections.loanBasis && (
                  <>
                    <DetailRow label="Financing Type" value="Full Equity (No Debt)" />
                    <DetailRow label="Total Equity Required" value={fmt(totalProjectCost)} bold />
                    {property.willRefinance === "Yes" && property.refinanceDate && (
                      <DetailRow label="Planned Refinance Date" value={new Date(property.refinanceDate).toLocaleDateString()} muted />
                    )}
                  </>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

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
  const [incomeAllExpanded, setIncomeAllExpanded] = useState(false);
  
  const { data: property, isLoading: propertyLoading, isError: propertyError } = useProperty(propertyId);
  const { data: global, isLoading: globalLoading, isError: globalError } = useGlobalAssumptions();
  
  const handlePhotoUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId] });
  };

  const projectionYears = global?.projectionYears ?? PROJECTION_YEARS;
  const projectionMonths = projectionYears * 12;
  const fiscalYearStartMonth = global?.fiscalYearStartMonth ?? 1;
  const getFiscalYear = (yearIndex: number) => global ? getFiscalYearForModelYear(global.modelStartDate, fiscalYearStartMonth, yearIndex) : 2026 + yearIndex;
  const financials = useMemo(
    () => (property && global) ? generatePropertyProForma(property, global, projectionMonths) : [],
    [property, global, projectionMonths]
  );

  const yearlyChartData = useMemo(() => {
    const data = [];
    for (let y = 0; y < projectionYears; y++) {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      if (yearData.length === 0) continue;
      data.push({
        year: String(getFiscalYear(y)),
        Revenue: yearData.reduce((a, m) => a + m.revenueTotal, 0),
        GOP: yearData.reduce((a, m) => a + m.gop, 0),
        NOI: yearData.reduce((a, m) => a + m.noi, 0),
        CashFlow: yearData.reduce((a, m) => a + m.cashFlow, 0),
      });
    }
    return data;
  }, [financials, projectionYears]);

  const years = projectionYears;
  const startYear = getFiscalYear(0);

  const cashFlowDataMemo = useMemo(() => {
    if (!property || !global || financials.length === 0) return [];
    return aggregateCashFlowByYear(financials, property as LoanParams, global as GlobalLoanParams, years);
  }, [financials, property, global, years]);

  const yearlyDetails = useMemo(
    () => aggregatePropertyByYear(financials, years),
    [financials, years]
  );

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
          <AlertTriangle className="w-8 h-8 text-destructive" />
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

  const exportCashFlowCSV = () => {

    const cashFlowData = getCashFlowData();
    const headers = ["Line Item", ...Array.from({length: years}, (_, i) => `FY ${startYear + i}`)];
    
    const csvLoan = calculateLoanParams(property as LoanParams, global as GlobalLoanParams);
    const csvAcqYear = Math.floor(csvLoan.acqMonthsFromModelStart / 12);
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
      ["  Insurance", ...yearlyDetails.map(y => y.expenseInsurance.toFixed(0))],
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
      `${property.name.replace(/\s+/g, '_')}_CashFlow.csv`,
    );
  };

  const handleExcelExport = () => {
    if (activeTab === "income") {
      exportPropertyIncomeStatement(
        financials,
        property.name,
        projectionYears,
        global.modelStartDate,
        fiscalYearStartMonth
      );
    } else if (activeTab === "cashflow") {
      exportPropertyCashFlow(
        financials,
        property as unknown as LoanParams,
        global as unknown as GlobalLoanParams,
        property.name,
        projectionYears,
        global.modelStartDate,
        fiscalYearStartMonth
      );
    } else if (activeTab === "balance") {
      exportPropertyBalanceSheet(
        [property] as unknown as LoanParams[],
        global,
        [{ property: property as unknown as LoanParams, data: financials }],
        projectionYears,
        global.modelStartDate,
        fiscalYearStartMonth,
        property.name,
        0
      );
    }
  };

  const exportCashFlowPDF = async (orientation: 'landscape' | 'portrait' = 'landscape') => {

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
    
    const pdfLoan = calculateLoanParams(property as LoanParams, global as GlobalLoanParams);
    const pdfAcqYear = Math.floor(pdfLoan.acqMonthsFromModelStart / 12);
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
    
    const iceBlueHeader = [232, 244, 253];

    const body = [
      [{ content: "CASH FLOW FROM OPERATING ACTIVITIES", colSpan: years + 1, styles: { fontStyle: "bold", fillColor: iceBlueHeader } }],
      [{ content: "Cash Received from Guests & Clients", styles: { fontStyle: "bold" } }, ...yearlyDetails.map(y => ({ content: fmtNum(y.revenueTotal), styles: { fontStyle: "bold" } }))],
      ["  Guest Room Revenue", ...yearlyDetails.map(y => fmtNum(y.revenueRooms))],
      ["  Event & Venue Revenue", ...yearlyDetails.map(y => fmtNum(y.revenueEvents))],
      ["  Food & Beverage Revenue", ...yearlyDetails.map(y => fmtNum(y.revenueFB))],
      ["  Other Revenue (Spa/Experiences)", ...yearlyDetails.map(y => fmtNum(y.revenueOther))],
      ["Cash Paid for Operating Expenses", ...yearlyDetails.map(y => fmtNum(-(y.totalExpenses - y.expenseFFE)))],
      ["Less: Interest Paid", ...cashFlowData.map(y => fmtNum(-y.interestExpense))],
      ["Less: Income Taxes Paid", ...cashFlowData.map(y => fmtNum(-y.taxLiability))],
      [{ content: "Net Cash from Operating Activities", styles: { fontStyle: "bold", fillColor: [208, 234, 251] } }, ...pdfCfo.map(v => ({ content: fmtNum(v), styles: { fontStyle: "bold", fillColor: [208, 234, 251] } }))],
      [{ content: "CASH FLOW FROM INVESTING ACTIVITIES", colSpan: years + 1, styles: { fontStyle: "bold", fillColor: iceBlueHeader } }],
      ["Property Acquisition", ...cashFlowData.map((_, i) => fmtNum(i === pdfAcqYear ? -pdfTotalPropertyCost : 0))],
      ["FF&E Reserve / Capital Improvements", ...yearlyDetails.map(y => fmtNum(-y.expenseFFE))],
      ["Sale Proceeds (Net Exit Value)", ...cashFlowData.map(y => fmtNum(y.exitValue))],
      [{ content: "Net Cash from Investing Activities", styles: { fontStyle: "bold", fillColor: [208, 234, 251] } }, ...pdfCfi.map(v => ({ content: fmtNum(v), styles: { fontStyle: "bold", fillColor: [208, 234, 251] } }))],
      [{ content: "CASH FLOW FROM FINANCING ACTIVITIES", colSpan: years + 1, styles: { fontStyle: "bold", fillColor: iceBlueHeader } }],
      ["Equity Contribution", ...cashFlowData.map((_, i) => fmtNum(i === pdfAcqYear ? pdfLoan.equityInvested : 0))],
      ["Loan Proceeds", ...cashFlowData.map((_, i) => fmtNum(i === pdfAcqYear && pdfLoan.loanAmount > 0 ? pdfLoan.loanAmount : 0))],
      ["Less: Principal Repayments", ...cashFlowData.map(y => fmtNum(-y.principalPayment))],
      ["Refinancing Proceeds", ...cashFlowData.map(y => fmtNum(y.refinancingProceeds))],
      [{ content: "Net Cash from Financing Activities", styles: { fontStyle: "bold", fillColor: [208, 234, 251] } }, ...pdfCff.map(v => ({ content: fmtNum(v), styles: { fontStyle: "bold", fillColor: [208, 234, 251] } }))],
      [{ content: "Net Increase (Decrease) in Cash", styles: { fontStyle: "bold" } }, ...pdfNetChange.map(v => ({ content: fmtNum(v), styles: { fontStyle: "bold" } }))],
      ["Opening Cash Balance", ...pdfOpenCash.map(v => fmtNum(v))],
      [{ content: "Closing Cash Balance", styles: { fontStyle: "bold" } }, ...pdfCloseCash.map(v => ({ content: fmtNum(v), styles: { fontStyle: "bold" } }))],
      [{ content: "FREE CASH FLOW", colSpan: years + 1, styles: { fontStyle: "bold", fillColor: iceBlueHeader } }],
      ["Net Cash from Operating Activities", ...pdfCfo.map(v => fmtNum(v))],
      ["Less: Capital Expenditures (FF&E)", ...yearlyDetails.map(y => fmtNum(-y.expenseFFE))],
      [{ content: "Free Cash Flow (FCF)", styles: { fontStyle: "bold" } }, ...pdfCfo.map((cfo, i) => ({ content: fmtNum(cfo - yearlyDetails[i].expenseFFE), styles: { fontStyle: "bold" } }))],
      ["Less: Principal Payments", ...cashFlowData.map(y => fmtNum(-y.principalPayment))],
      [{ content: "Free Cash Flow to Equity (FCFE)", styles: { fontStyle: "bold" } }, ...pdfCfo.map((cfo, i) => ({ content: fmtNum(cfo - yearlyDetails[i].expenseFFE - cashFlowData[i].principalPayment), styles: { fontStyle: "bold" } }))],
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
        ? `${projectionYears}-Year Revenue, NOI, and Cash Flow Trend`
        : `${projectionYears}-Year Revenue, GOP, and NOI Trend`;
      doc.text(chartTitle, 14, 22);
      
      drawLineChart({
        doc,
        x: 14,
        y: 30,
        width: chartWidth,
        height: 150,
        title: `${property.name} - Financial Performance (${projectionYears}-Year Projection)`,
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

  const handlePPTXExport = () => {

    const cashFlowData = getCashFlowData();
    const yearLabels = Array.from({ length: years }, (_, i) => `FY ${startYear + i}`);

    const incomeRows = [
      { category: "REVENUE", values: yearlyDetails.map(() => 0) },
      { category: "Room Revenue", values: yearlyDetails.map(y => y.revenueRooms), indent: 1 },
      { category: "Event Revenue", values: yearlyDetails.map(y => y.revenueEvents), indent: 1 },
      { category: "F&B Revenue", values: yearlyDetails.map(y => y.revenueFB), indent: 1 },
      { category: "Other Revenue", values: yearlyDetails.map(y => y.revenueOther), indent: 1 },
      { category: "Total Revenue", values: yearlyDetails.map(y => y.revenueTotal), isBold: true },
      { category: "OPERATING EXPENSES", values: yearlyDetails.map(() => 0) },
      { category: "Housekeeping", values: yearlyDetails.map(y => y.expenseRooms), indent: 1 },
      { category: "F&B", values: yearlyDetails.map(y => y.expenseFB), indent: 1 },
      { category: "Marketing", values: yearlyDetails.map(y => y.expenseMarketing), indent: 1 },
      { category: "Property Ops", values: yearlyDetails.map(y => y.expensePropertyOps), indent: 1 },
      { category: "Admin & General", values: yearlyDetails.map(y => y.expenseAdmin), indent: 1 },
      { category: "Net Operating Income", values: yearlyDetails.map(y => y.noi), isBold: true },
    ];

    const cfRows = [
      { category: "Net Cash from Operating Activities", values: yearlyDetails.map((yd, i) => yd.revenueTotal - (yd.totalExpenses - yd.expenseFFE) - cashFlowData[i].interestExpense - cashFlowData[i].taxLiability), isBold: true },
      { category: "FCFE", values: yearlyDetails.map((yd, i) => {
        const cfo = yd.revenueTotal - (yd.totalExpenses - yd.expenseFFE) - cashFlowData[i].interestExpense - cashFlowData[i].taxLiability;
        return cfo - yd.expenseFFE - cashFlowData[i].principalPayment;
      }), isBold: true },
    ];

    const bsRows = [
      { category: "Balance Sheet data exported via Excel", values: yearlyDetails.map(() => 0) },
    ];

    exportPropertyPPTX({
      propertyName: property.name,
      projectionYears,
      getFiscalYear: (i: number) => `FY ${startYear + i}`,
      incomeData: { years: yearLabels, rows: incomeRows },
      cashFlowData: { years: yearLabels, rows: cfRows },
      balanceSheetData: { years: yearLabels, rows: bsRows },
    });
  };

  const handleExport = async (orientation: 'landscape' | 'portrait', includeDetails?: boolean) => {
    if (includeDetails && activeTab === "income") {
      setIncomeAllExpanded(true);
      await new Promise((r) => setTimeout(r, 300));
    }
    try {
      if (exportType === 'pdf') {
        await exportCashFlowPDF(orientation);
      } else if (exportType === 'tablePng') {
        await exportTablePNG(orientation);
      } else {
        await exportChartPNG(orientation);
      }
    } finally {
      if (includeDetails) {
        setIncomeAllExpanded(false);
      }
    }
  };

  const kpiItems: KPIItem[] = yearlyChartData.length > 0 ? [
    {
      label: "Year 1 Revenue",
      value: yearlyChartData[0].Revenue,
      format: formatCompact,
      trend: yearlyChartData.length > 1 && yearlyChartData[1].Revenue > yearlyChartData[0].Revenue ? "up" : "neutral",
      sublabel: `${projectionYears}-year projection`,
    },
    {
      label: "Year 1 GOP",
      value: yearlyChartData[0].GOP,
      format: formatCompact,
      trend: yearlyChartData[0].GOP > 0 ? "up" : "down",
      sublabel: yearlyChartData[0].Revenue > 0 ? `${((yearlyChartData[0].GOP / yearlyChartData[0].Revenue) * 100).toFixed(1)}% margin` : undefined,
    },
    {
      label: "Year 1 NOI",
      value: yearlyChartData[0].NOI,
      format: formatCompact,
      trend: yearlyChartData[0].NOI > 0 ? "up" : "down",
      sublabel: yearlyChartData[0].Revenue > 0 ? `${((yearlyChartData[0].NOI / yearlyChartData[0].Revenue) * 100).toFixed(1)}% margin` : undefined,
    },
    {
      label: "Year 1 Cash Flow",
      value: yearlyChartData[0].CashFlow,
      format: formatCompact,
      trend: yearlyChartData[0].CashFlow > 0 ? "up" : "down",
      sublabel: "After debt service",
    },
  ] : [];

  return (
    <Layout>
      <AnimatedPage>
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExport}
        title={exportType === 'pdf' ? 'Export PDF' : exportType === 'tablePng' ? 'Export Table as PNG' : 'Export Chart'}
        showDetailOption={activeTab === "income" && (exportType === 'pdf' || exportType === 'tablePng')}
      />
      <div className="space-y-6">
        {/* Liquid Glass Header */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl">
          {/* Property Image */}
          <div className="relative h-[180px] sm:h-[280px]">
            <img src={property.imageUrl.startsWith("/objects/") ? property.imageUrl : property.imageUrl} alt={property.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <PropertyPhotoUpload 
              propertyId={propertyId} 
              currentImageUrl={property.imageUrl}
              onUploadComplete={handlePhotoUploadComplete}
            />
          </div>
          
          {/* Liquid Glass Info Bar */}
          <div className="relative overflow-hidden p-3 sm:p-6">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e]" />
            {/* Top Edge Sheen */}
            <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            {/* Floating Color Orbs */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-primary/25 blur-3xl" />
              <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full bg-primary/15 blur-3xl" />
            </div>
            
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <Link href="/portfolio">
                  <button className="relative overflow-hidden p-2 text-white rounded-xl transition-all duration-300 group/back">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-xl" />
                    <div className="absolute inset-0 rounded-xl border border-white/20 group-hover/back:border-white/40 transition-all duration-300" />
                    <ArrowLeft className="relative w-5 h-5" />
                  </button>
                </Link>
                <div>
                  <h1 className="text-lg sm:text-2xl font-display text-background">{property.name}</h1>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-background/70 text-sm mt-1 label-text">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {property.location}</span>
                    <span className="font-mono">{property.roomCount} Rooms</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/15 border border-white/25 text-white text-xs">
                      {getStatusLabel(property.status)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {(() => {
                  const addressParts = [property.streetAddress, property.city, property.stateProvince, property.zipPostalCode, property.country].filter(Boolean);
                  const hasAddress = addressParts.length > 0;
                  const mapQuery = hasAddress ? addressParts.join(", ") : "";
                  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
                  return (
                    <button
                      onClick={() => hasAddress && window.open(mapUrl, "_blank")}
                      disabled={!hasAddress}
                      title={hasAddress ? `View ${mapQuery} on Google Maps` : "No address provided — add address details in Assumptions"}
                      className={`relative overflow-hidden px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 flex items-center gap-2 ${hasAddress ? "text-white group/map cursor-pointer" : "text-white/40 cursor-not-allowed"}`}
                    >
                      <div className={`absolute inset-0 backdrop-blur-xl rounded-xl ${hasAddress ? "bg-white/12" : "bg-white/5"}`} />
                      <div className={`absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent ${hasAddress ? "via-white/40" : "via-white/15"} to-transparent`} />
                      <div className={`absolute inset-0 rounded-xl border ${hasAddress ? "border-white/25 group-hover/map:border-white/40" : "border-white/10"} transition-all duration-300`} />
                      {hasAddress && <div className="absolute inset-0 rounded-xl shadow-[0_0_20px_rgba(159,188,164,0.3)] group-hover/map:shadow-[0_0_30px_rgba(159,188,164,0.5)] transition-all duration-300" />}
                      <Map className="relative w-4 h-4" />
                      <span className="relative">Map</span>
                    </button>
                  );
                })()}
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
        </div>

        {kpiItems.length > 0 && (
          <KPIGrid
            data-testid="kpi-property-detail"
            items={kpiItems}
            columns={4}
            variant="glass"
          />
        )}

        <ScrollReveal>
        <CalcDetailsProvider show={global?.showPropertyCalculationDetails ?? true}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-4">
            <DarkGlassTabs
              tabs={[
                { value: 'income', label: 'Income Statement', icon: FileText },
                { value: 'cashflow', label: 'Cash Flows', icon: Banknote },
                { value: 'balance', label: 'Balance Sheet', icon: Scale },
                { value: 'ppe', label: 'PP&E / Cost Basis', icon: Building2 }
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              rightContent={
                <ExportMenu
                  actions={[
                    pdfAction(() => { setExportType('pdf'); setExportDialogOpen(true); }),
                    excelAction(() => handleExcelExport()),
                    csvAction(() => exportCashFlowCSV()),
                    pptxAction(() => handlePPTXExport()),
                    chartAction(() => { setExportType('chart'); setExportDialogOpen(true); }),
                    pngAction(() => exportTablePNG()),
                  ]}
                />
              }
            />
          </div>
          
          <TabsContent value="income" className="mt-6 space-y-6">
            {/* Income Statement Chart Card - Light Theme */}
            <div ref={incomeChartRef} className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-3 sm:p-6 bg-white shadow-lg border border-gray-100">
              <div className="relative">
                <h3 className="text-lg font-display text-gray-900 mb-4">Income Statement Trends ({projectionYears}-Year Projection)</h3>
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
              <YearlyIncomeStatement data={financials} years={projectionYears} startYear={getFiscalYear(0)} property={property} global={global} allExpanded={incomeAllExpanded} />
            </div>
          </TabsContent>
          
          <TabsContent value="cashflow" className="mt-6 space-y-6">
            {/* Cash Flow Chart Card - Light Theme */}
            <div ref={cashFlowChartRef} className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-3 sm:p-6 bg-white shadow-lg border border-gray-100">
              <div className="relative">
                <h3 className="text-lg font-display text-gray-900 mb-4">Cash Flow Trends ({projectionYears}-Year Projection)</h3>
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
                years={projectionYears} 
                startYear={getFiscalYear(0)} 
                defaultLTV={property.acquisitionLTV ?? DEFAULT_LTV}
              />
            </div>
          </TabsContent>

          <TabsContent value="balance" className="mt-6">
            <ConsolidatedBalanceSheet
              properties={[property]}
              global={global}
              allProFormas={[{ property, data: financials }]}
              year={projectionYears}
              propertyIndex={0}
            />
          </TabsContent>

          <TabsContent value="ppe" className="mt-6">
            <PPECostBasisSchedule property={property} global={global} />
          </TabsContent>
        </Tabs>
        </CalcDetailsProvider>
        </ScrollReveal>
      </div>
      </AnimatedPage>
    </Layout>
  );
}
