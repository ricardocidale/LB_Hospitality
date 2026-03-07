import React, { useRef, useState } from "react";
import { InsightPanel, type Insight } from "@/components/graphics";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, LineChart, Line } from "recharts";
import { DashboardTabProps } from "./types";
import PortfolioResearchCard from "./PortfolioResearchCard";
import { formatMoney } from "@/lib/financialEngine";
import { DEFAULT_EXIT_CAP_RATE } from "@/lib/constants";
import { computeIRR } from "@analytics/returns/irr.js";
import { propertyEquityInvested } from "@/lib/financial/equityCalculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { ExportMenu, pdfAction, csvAction, excelAction, pptxAction, chartAction, pngAction } from "@/components/ui/export-toolbar";
import { dashboardExports, generatePortfolioCashFlowData, generatePortfolioInvestmentData, exportPortfolioPDF, exportPortfolioCSV } from "./dashboardExports";
import * as XLSX from "xlsx";

function calculateIRR(cashFlows: number[]): number {
  const result = computeIRR(cashFlows, 1);
  return result.irr_periodic ?? 0;
}

type ChartMode = "area" | "line";

function ChartModeToggle({ mode, onChange }: { mode: ChartMode; onChange: (m: ChartMode) => void }) {
  return (
    <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5" data-testid="chart-mode-toggle">
      <button
        onClick={() => onChange("area")}
        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
          mode === "area"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        data-testid="toggle-area-chart"
      >
        Area
      </button>
      <button
        onClick={() => onChange("line")}
        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
          mode === "line"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        data-testid="toggle-line-chart"
      >
        Line
      </button>
    </div>
  );
}

export function OverviewTab({ financials, properties, projectionYears, getFiscalYear }: DashboardTabProps) {
  const {
    yearlyConsolidatedCache,
    allPropertyYearlyCF,
    allPropertyYearlyIS,
    portfolioIRR,
    equityMultiple,
    cashOnCash,
    totalInitialEquity,
    totalExitValue,
    totalProjectionRevenue,
    totalProjectionNOI,
    totalProjectionCashFlow
  } = financials;

  const [chartMode, setChartMode] = useState<ChartMode>("area");

  const tabContentRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);

  const totalProperties = properties.length;
  const totalRooms = properties.reduce((sum, p) => sum + p.roomCount, 0);
  const totalPurchasePrice = properties.reduce((sum, p) => sum + p.purchasePrice, 0);
  const avgPurchasePrice = totalPurchasePrice / totalProperties;
  const avgRoomsPerProperty = totalRooms / totalProperties;
  const avgADR = totalRooms > 0
    ? properties.reduce((sum, p) => sum + p.startAdr * p.roomCount, 0) / totalRooms
    : 0;
  const avgExitCapRate = properties.reduce((sum, p) => sum + (p.exitCapRate ?? DEFAULT_EXIT_CAP_RATE), 0) / totalProperties;
  const totalInvestment = totalPurchasePrice;
  const investmentHorizon = projectionYears;

  const marketCounts = properties.reduce((acc, p) => {
    acc[p.market] = (acc[p.market] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getPropertyCashFlows = (idx: number): number[] =>
    Array.from({ length: projectionYears }, (_, y) => allPropertyYearlyCF[idx]?.[y]?.netCashFlowToInvestors ?? 0);

  const getPropertyInvestment = (prop: typeof properties[0]): number =>
    propertyEquityInvested(prop);

  const propertyIRRData = properties.map((prop, idx) => {
    const cashFlows = getPropertyCashFlows(idx);
    const irr = calculateIRR(cashFlows);
    return {
      name: prop.name.length > 15 ? prop.name.substring(0, 13) + '\u2026' : prop.name,
      fullName: prop.name,
      irr: parseFloat((irr * 100).toFixed(1)),
    };
  });

  const propertyInvestmentData = properties.map((prop) => {
    const investment = getPropertyInvestment(prop);
    return {
      name: prop.name.length > 15 ? prop.name.substring(0, 13) + '\u2026' : prop.name,
      fullName: prop.name,
      investment: Math.round(investment),
    };
  });

  const revenueNOIData = Array.from({ length: projectionYears }, (_, y) => {
    const rev = yearlyConsolidatedCache[y]?.revenueTotal ?? 0;
    const noi = yearlyConsolidatedCache[y]?.noi ?? 0;
    const anoi = yearlyConsolidatedCache[y]?.anoi ?? 0;
    const cf = allPropertyYearlyCF.reduce((sum, propCF) => sum + (propCF[y]?.netCashFlowToInvestors ?? 0), 0);
    return {
      year: getFiscalYear(y),
      revenue: Math.round(rev),
      noi: Math.round(noi),
      anoi: Math.round(anoi),
      cashFlow: Math.round(cf),
    };
  });

  const exitGainPercent = totalInitialEquity > 0 ? ((totalExitValue / totalInitialEquity - 1) * 100).toFixed(0) : "0";

  const marketList = Object.entries(marketCounts).map(([m, c]) => `${m} (${c})`).join(', ');
  const insights: Insight[] = [
    { text: `Markets: ${marketList}`, type: "neutral" as const },
    { text: `${investmentHorizon}-year total revenue`, metric: formatMoney(totalProjectionRevenue), type: "neutral" as const },
    { text: `${investmentHorizon}-year total NOI`, metric: formatMoney(totalProjectionNOI), type: "neutral" as const },
    { text: `${investmentHorizon}-year total ANOI`, metric: formatMoney(financials.totalProjectionANOI || 0), type: "neutral" as const },
    { text: `${investmentHorizon}-year total cash flow`, metric: formatMoney(totalProjectionCashFlow), type: "neutral" as const },
  ];

  const generateOverviewData = () => {
    const years = [getFiscalYear(0)];
    const rows: any[] = [
      { category: "Portfolio IRR", values: [portfolioIRR * 100], isHeader: true },
      { category: "Equity Multiple", values: [equityMultiple], indent: 1 },
      { category: "Cash-on-Cash Return", values: [cashOnCash], indent: 1 },
      { category: "Total Initial Equity", values: [totalInitialEquity], indent: 1 },
      { category: "Total Exit Value", values: [totalExitValue], indent: 1 },
      { category: "Total Projected Revenue", values: [totalProjectionRevenue], indent: 1 },
      { category: "Total Projected NOI", values: [totalProjectionNOI], indent: 1 },
      { category: "Total Projected ANOI", values: [financials.totalProjectionANOI || 0], indent: 1 },
      { category: "Total Projected Cash Flow", values: [totalProjectionCashFlow], indent: 1 },
      { category: "Portfolio Composition", values: [0], isHeader: true },
      { category: "Properties", values: [totalProperties], indent: 1 },
      { category: "Total Rooms", values: [totalRooms], indent: 1 },
      { category: "Markets", values: [Object.keys(marketCounts).length], indent: 1 },
    ];
    return { years, rows };
  };

  const handleExport = (action: string) => {
    const { years, rows } = generateOverviewData();
    switch (action) {
      case 'pdf':
        exportPortfolioPDF("portrait", 1, years, rows, (i) => yearlyConsolidatedCache[i], "Portfolio Overview");
        break;
      case 'csv':
        exportPortfolioCSV(years, rows, "portfolio-overview.csv");
        break;
      case 'excel':
        const wb = XLSX.utils.book_new();
        const wsData = [
          ["Metric", "Value"],
          ...rows.map(r => [r.category, r.values[0]])
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Overview");
        XLSX.writeFile(wb, "portfolio-overview.xlsx");
        break;
      case 'pptx':
        dashboardExports.exportToPPTX({
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
          incomeData: { years: [], rows: [] },
          cashFlowData: (() => { const cf = generatePortfolioCashFlowData(allPropertyYearlyCF, projectionYears, getFiscalYear); return { years: cf.years.map(String), rows: cf.rows.map(r => ({ category: r.category, values: r.values, indent: r.indent, isBold: r.isHeader })) }; })(),
          balanceSheetData: { years: [], rows: [] },
          investmentData: (() => { const inv = generatePortfolioInvestmentData(financials, properties, projectionYears, getFiscalYear); return { years: inv.years.map(String), rows: inv.rows.map(r => ({ category: r.category, values: r.values, indent: r.indent, isBold: r.isHeader })) }; })()
        });
        break;
      case 'chart':
        dashboardExports.exportToPNG(chartsRef as React.RefObject<HTMLElement>);
        break;
      case 'png':
        dashboardExports.exportToPNG(tabContentRef as React.RefObject<HTMLElement>);
        break;
    }
  };

  return (
    <Card className="bg-card border-border shadow-sm relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle>Portfolio Overview</CardTitle>
        <ExportMenu
          actions={[
            pdfAction(() => handleExport('pdf')),
            csvAction(() => handleExport('csv')),
            excelAction(() => handleExport('excel')),
            pptxAction(() => handleExport('pptx')),
            chartAction(() => handleExport('chart')),
            pngAction(() => handleExport('png')),
          ]}
        />
      </CardHeader>
      <CardContent ref={tabContentRef} className="relative z-10">
        <Accordion type="multiple" defaultValue={["performance", "projection", "composition", "research", "insights"]} className="space-y-4">

          <AccordionItem value="performance" className="border-none">
            <AccordionTrigger className="hover:no-underline py-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground tracking-wide uppercase">Investment Performance</span>
                <InfoTooltip
                  text="Key return metrics for the entire portfolio across all properties and the full hold period."
                  formula="IRR = discount rate where NPV of all cash flows = 0"
                  light
                  side="right"
                />
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
            <div className="relative">
              <div className="text-center mb-8">
                <p className="text-foreground/50 text-sm label-text">
                  <span className="font-mono">{investmentHorizon}</span>-Year Hold | <span className="font-mono">{totalProperties}</span> Properties | <span className="font-mono">{totalRooms}</span> Rooms
                </p>
              </div>

              <div className="flex flex-col lg:flex-row items-center justify-center gap-8 mb-10">
                <div className="relative bg-card rounded-lg p-8 border border-border shadow-sm" data-testid="gauge-portfolio-irr">
                  <div className="relative">
                    <svg className="w-48 h-48" viewBox="0 0 200 200">
                      <defs>
                        <linearGradient id="irrTube3D" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="hsl(var(--chart-1))" />
                          <stop offset="50%" stopColor="hsl(var(--chart-2))" />
                          <stop offset="100%" stopColor="hsl(var(--chart-3))" />
                        </linearGradient>
                      </defs>
                      <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(45,74,94,0.1)" strokeWidth="12" />
                      <circle
                        cx="100" cy="100" r="80" fill="none" stroke="url(#irrTube3D)" strokeWidth="12"
                        strokeDasharray={`${Math.min(Math.max(portfolioIRR * 100, 0) * 5.03, 503)} 503`}
                        strokeLinecap="round"
                        transform="rotate(-90 100 100)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-bold text-foreground tracking-tight font-mono" data-testid="text-portfolio-irr">{(portfolioIRR * 100).toFixed(1)}%</span>
                      <span className="text-sm text-foreground/60 font-medium mt-2 label-text flex items-center">Portfolio IRR<InfoTooltip text="Internal Rate of Return — the annualized return that makes the net present value of all cash flows equal to zero." formula="NPV = Σ CFₜ / (1 + IRR)ᵗ = 0" light side="bottom" /></span>
                    </div>
                  </div>
                </div>

                <div ref={chartsRef} className="bg-card rounded-lg p-6 border border-border shadow-sm w-full lg:min-w-[340px]" data-testid="chart-property-irr-comparison">
                  <p className="text-xs font-medium tracking-widest text-foreground/60 uppercase mb-3 text-center label-text">Property IRR Comparison</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={propertyIRRData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,74,94,0.08)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} angle={-25} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 'auto']} width={45} axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'IRR']}
                        labelFormatter={(_label: string, payload: Array<{ payload?: { fullName?: string } }>) => payload?.[0]?.payload?.fullName || _label}
                        contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 12, boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                      />
                      <Bar dataKey="irr" radius={[4, 4, 0, 0]} maxBarSize={40} fill="var(--primary)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-card rounded-lg p-6 border border-border shadow-sm w-full lg:min-w-[340px]" data-testid="chart-property-investment">
                  <p className="text-xs font-medium tracking-widest text-foreground/60 uppercase mb-3 text-center label-text">Equity by Property</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={propertyInvestmentData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,74,94,0.08)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} angle={-25} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v: number) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 'auto']} width={55} axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Equity Invested']}
                        labelFormatter={(_label: string, payload: Array<{ payload?: { fullName?: string } }>) => payload?.[0]?.payload?.fullName || _label}
                        contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 12, boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                      />
                      <Bar dataKey="investment" radius={[4, 4, 0, 0]} maxBarSize={40} fill="hsl(var(--chart-2))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
                <div className="bg-card rounded-lg p-5 border border-border shadow-sm transition-all duration-300">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="relative w-14 h-14 flex-shrink-0">
                      <svg className="w-14 h-14" viewBox="0 0 100 100">
                        <defs>
                          <linearGradient id="smallTube3D_eq" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="hsl(var(--chart-1))" />
                            <stop offset="50%" stopColor="hsl(var(--chart-2))" />
                            <stop offset="100%" stopColor="hsl(var(--chart-3))" />
                          </linearGradient>
                        </defs>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(45,74,94,0.15)" strokeWidth="6" />
                        <circle
                          cx="50" cy="50" r="40" fill="none" stroke="url(#smallTube3D_eq)" strokeWidth="6"
                          strokeDasharray={`${Math.min(equityMultiple * 63, 251)} 251`}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-foreground font-mono">{equityMultiple.toFixed(1)}x</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-700 font-mono" data-testid="text-equity-multiple">{equityMultiple.toFixed(2)}x</p>
                      <p className="text-sm text-foreground/60 label-text flex items-center">Equity Multiple<InfoTooltip text="Total distributions plus residual value divided by total equity invested. A 2.0x multiple means investors received double their investment." formula="EM = (Total Distributions + Exit Value) / Total Equity" light side="right" /></p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg p-5 border border-border shadow-sm transition-all duration-300">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="relative w-14 h-14 flex-shrink-0">
                      <svg className="w-14 h-14" viewBox="0 0 100 100">
                        <defs>
                          <linearGradient id="smallTube3D_coc" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="hsl(var(--chart-4))" />
                            <stop offset="50%" stopColor="hsl(var(--chart-1))" />
                            <stop offset="100%" stopColor="hsl(var(--chart-3))" />
                          </linearGradient>
                        </defs>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(45,74,94,0.15)" strokeWidth="6" />
                        <circle
                          cx="50" cy="50" r="40" fill="none" stroke="url(#smallTube3D_coc)" strokeWidth="6"
                          strokeDasharray={`${Math.min(Math.max(cashOnCash, 0) * 12.5, 251)} 251`}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-foreground font-mono">{cashOnCash.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary font-mono" data-testid="text-cash-on-cash">{cashOnCash.toFixed(1)}%</p>
                      <p className="text-sm text-foreground/60 label-text flex items-center">Cash-on-Cash<InfoTooltip text="Annual pre-tax cash flow as a percentage of total equity invested. Measures the yield on your cash investment." formula="CoC = Annual Cash Flow / Total Equity Invested" light side="right" /></p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg p-5 border border-border shadow-sm transition-all duration-300">
                  <div className="mb-2">
                    <p className="text-2xl font-bold text-foreground font-mono" data-testid="text-equity-invested">{formatMoney(totalInitialEquity)}</p>
                    <p className="text-sm text-foreground/60 label-text flex items-center">Equity Invested<InfoTooltip text="Total cash equity contributed by investors across all properties, excluding any debt financing." light side="right" /></p>
                  </div>
                  <div className="h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: '100%', background: 'linear-gradient(to right, hsl(var(--chart-1)), hsl(var(--chart-2)))' }} />
                  </div>
                </div>

                <div className="bg-card rounded-lg p-5 border border-border shadow-sm transition-all duration-300">
                  <div className="mb-2">
                    <p className="text-2xl font-bold text-emerald-700 font-mono" data-testid="text-exit-value">{formatMoney(totalExitValue)}</p>
                    <p className="text-sm text-foreground/60 label-text flex items-center">Projected Exit<InfoTooltip text="Estimated total sale proceeds at the end of the hold period, based on projected NOI and exit cap rate." formula="Exit Value = NOI / Exit Cap Rate" light side="right" /></p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span className="text-sm font-medium text-emerald-700 font-mono">+{exitGainPercent}% gain</span>
                  </div>
                </div>
              </div>
            </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="projection" className="border-none">
            <AccordionTrigger className="hover:no-underline py-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground tracking-wide uppercase">Revenue & ANOI Projection</span>
                <InfoTooltip
                  text="Revenue is total income from all hotel operations. ANOI (Adjusted Net Operating Income) is the bottom operating line after all expenses, management fees, insurance, taxes, and FF&E reserve."
                  formula="ANOI = Revenue − OpEx − Mgmt Fees − Insurance − Taxes − FF&E"
                  light
                  side="right"
                />
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
            <div className="bg-card rounded-lg border border-border shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground font-display">Revenue & ANOI</h3>
                  <p className="text-sm text-muted-foreground label-text">{investmentHorizon}-year consolidated projection</p>
                </div>
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-4 text-xs label-text">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
                      <span className="text-muted-foreground">Revenue</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
                      <span className="text-muted-foreground">ANOI</span>
                    </span>
                  </div>
                  <ChartModeToggle mode={chartMode} onChange={setChartMode} />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                {chartMode === "area" ? (
                  <AreaChart data={revenueNOIData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="anoiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="year"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      tickFormatter={(v: number) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                    />
                    <Tooltip
                      cursor={false}
                      formatter={(value: number, name: string) => [formatMoney(value), name === 'revenue' ? 'Revenue' : 'ANOI']}
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid hsl(var(--border))',
                        backgroundColor: 'hsl(var(--card))',
                        fontSize: 12,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                    <Area type="monotone" dataKey="revenue" fill="url(#revenueGrad)" stroke="none" dot={false} />
                    <Area type="monotone" dataKey="anoi" fill="url(#anoiGrad)" stroke="none" dot={false} />
                  </AreaChart>
                ) : (
                  <LineChart data={revenueNOIData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="year"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      tickFormatter={(v: number) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                    />
                    <Tooltip
                      cursor={false}
                      formatter={(value: number, name: string) => [formatMoney(value), name === 'revenue' ? 'Revenue' : 'ANOI']}
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid hsl(var(--border))',
                        backgroundColor: 'hsl(var(--card))',
                        fontSize: 12,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="anoi" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="composition" className="border-none">
            <AccordionTrigger className="hover:no-underline py-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground tracking-wide uppercase">Portfolio & Capital Structure</span>
                <InfoTooltip
                  text="Composition shows the physical portfolio makeup. Capital Structure breaks down how the investments are funded and what returns are projected."
                  light
                  side="right"
                />
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-card/80 rounded-lg p-6 border border-primary/10 shadow-[0_2px_8px_rgba(var(--primary-rgb,159,188,164),0.08)]">
                <h3 className="text-sm font-semibold text-foreground mb-5 font-display">Portfolio Composition</h3>
                <div className="space-y-4">
                  {[
                    { label: "Properties", value: String(totalProperties), tip: "Number of hotel assets in the portfolio." },
                    { label: "Total Rooms", value: String(totalRooms), tip: "Combined room count across all properties." },
                    { label: "Avg Rooms/Property", value: avgRoomsPerProperty.toFixed(0), tip: "Average number of rooms per hotel — indicates typical asset size." },
                    { label: "Markets", value: String(Object.keys(marketCounts).length), tip: "Number of distinct geographic markets for diversification." },
                    { label: "Avg Daily Rate", value: formatMoney(avgADR), highlight: true, tip: "Weighted average ADR across all properties. ADR = Room Revenue / Rooms Sold." },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-1 border-b border-foreground/5 last:border-0">
                      <span className="text-sm text-foreground/60 label-text flex items-center">{row.label}<InfoTooltip text={row.tip} light side="right" /></span>
                      <span className={`font-semibold font-mono text-sm ${row.highlight ? 'text-emerald-700' : 'text-foreground'}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card/80 rounded-lg p-6 border border-primary/10 shadow-[0_2px_8px_rgba(var(--primary-rgb,159,188,164),0.08)]">
                <h3 className="text-sm font-semibold text-foreground mb-5 font-display">Capital Structure</h3>
                <div className="space-y-4">
                  {[
                    { label: "Total Purchase Price", value: formatMoney(totalPurchasePrice), tip: "Combined acquisition cost of all hotel properties." },
                    { label: "Avg Purchase Price", value: formatMoney(avgPurchasePrice), tip: "Mean acquisition cost per property." },
                    { label: "Avg Exit Cap Rate", value: `${(avgExitCapRate * 100).toFixed(1)}%`, highlight: true, tip: "Capitalization rate used to value properties at sale. Lower cap rate = higher valuation.", formula: "Cap Rate = NOI / Property Value" },
                    { label: "Hold Period", value: `${investmentHorizon} Years`, tip: "Total planned ownership duration before exit/sale." },
                    { label: "ANOI Margin", value: `${totalProjectionRevenue > 0 ? ((totalProjectionNOI / totalProjectionRevenue) * 100).toFixed(1) : '0.0'}%`, highlight: true, tip: "ANOI as a percentage of total revenue — measures overall operating efficiency after all charges.", formula: "ANOI Margin = ANOI / Revenue × 100" },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-1 border-b border-foreground/5 last:border-0">
                      <span className="text-sm text-foreground/60 label-text flex items-center">{row.label}<InfoTooltip text={row.tip} formula={'formula' in row ? row.formula : undefined} light side="right" /></span>
                      <span className={`font-semibold font-mono text-sm ${row.highlight ? 'text-emerald-700' : 'text-foreground'}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="research" className="border-none">
            <AccordionTrigger className="hover:no-underline py-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground tracking-wide uppercase">Market Research</span>
                <InfoTooltip
                  text="AI-powered market intelligence and comparable analysis for your portfolio markets."
                  light
                  side="right"
                />
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
            <PortfolioResearchCard
              properties={properties}
              yearlyConsolidatedCache={yearlyConsolidatedCache}
              allPropertyYearlyIS={allPropertyYearlyIS}
            />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="insights" className="border-none">
            <AccordionTrigger className="hover:no-underline py-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground tracking-wide uppercase">Portfolio Insights</span>
                <InfoTooltip
                  text="Automated intelligence observations about portfolio performance, diversification, and risk factors."
                  light
                  side="right"
                />
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
            <InsightPanel
              data-testid="insight-dashboard"
              title="Portfolio Insights"
              insights={insights}
            />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
