import React, { useRef, useState, useMemo } from "react";
import { InsightPanel, type Insight } from "@/components/graphics";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Tooltip as RechartsTooltip, AreaChart, Area, LineChart, Line, LabelList, PieChart, Pie, Cell, ReferenceLine } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { DashboardTabProps } from "./types";
import { formatMoney, getFiscalYearForModelYear } from "@/lib/financialEngine";
import { DEFAULT_EXIT_CAP_RATE } from "@/lib/constants";
import { computeIRR } from "@analytics/returns/irr.js";
import { propertyEquityInvested } from "@/lib/financial/equityCalculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { CurrentThemeTab } from "@/components/ui/tabs";
import { ExportMenu, pdfAction, csvAction, excelAction, pptxAction, chartAction, pngAction } from "@/components/ui/export-toolbar";
import { dashboardExports, generatePortfolioCashFlowData, generatePortfolioInvestmentData, exportPortfolioPDF, exportPortfolioCSV, toExportData } from "./dashboardExports";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadialGauge } from "@/lib/charts";

const PIE_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const STATUS_COLORS: Record<string, string> = {
  Operating: "bg-emerald-500",
  Improvements: "bg-amber-500",
  Acquired: "bg-blue-500",
  "In Negotiation": "bg-violet-500",
  Planned: "bg-sky-500",
  Pipeline: "bg-slate-400",
};

const STATUSES = ["Operating", "Improvements", "Acquired", "In Negotiation", "Planned", "Pipeline"] as const;

const formatCompact = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

interface WaterfallItem {
  name: string;
  value: number;
  base: number;
  fill: string;
  isSubtotal: boolean;
}

function buildWaterfallData(yearData: {
  revenueTotal: number;
  gop: number;
  agop: number;
  noi: number;
  anoi: number;
  feeBase: number;
  feeIncentive: number;
  expenseFFE: number;
}): WaterfallItem[] {
  const deptExpenses = yearData.revenueTotal - yearData.gop;
  const undistributed = yearData.gop - yearData.agop - yearData.feeBase - yearData.feeIncentive;
  const fees = yearData.feeBase + yearData.feeIncentive;
  const fixedCharges = yearData.agop - yearData.noi;
  const ffe = yearData.expenseFFE;

  const items: WaterfallItem[] = [];
  let running = yearData.revenueTotal;

  items.push({ name: "Total Revenue", value: running, base: 0, fill: "hsl(var(--chart-1))", isSubtotal: true });
  items.push({ name: "Dept. Expenses", value: deptExpenses, base: running - deptExpenses, fill: "hsl(var(--chart-2))", isSubtotal: false });
  running -= deptExpenses;
  items.push({ name: "GOP", value: running, base: 0, fill: "hsl(var(--chart-1))", isSubtotal: true });
  items.push({ name: "Undistributed", value: undistributed, base: running - undistributed, fill: "hsl(var(--chart-3))", isSubtotal: false });
  running -= undistributed;
  items.push({ name: "Mgmt Fees", value: fees, base: running - fees, fill: "hsl(var(--chart-4))", isSubtotal: false });
  running -= fees;
  items.push({ name: "AGOP", value: running, base: 0, fill: "hsl(var(--chart-1))", isSubtotal: true });
  items.push({ name: "Fixed Charges", value: fixedCharges, base: running - fixedCharges, fill: "hsl(var(--chart-5))", isSubtotal: false });
  running -= fixedCharges;
  items.push({ name: "NOI", value: running, base: 0, fill: "hsl(var(--chart-1))", isSubtotal: true });
  items.push({ name: "FF&E Reserve", value: ffe, base: running - ffe, fill: "hsl(var(--chart-2))", isSubtotal: false });
  running -= ffe;
  items.push({ name: "ANOI", value: running, base: 0, fill: "hsl(var(--primary))", isSubtotal: true });

  return items;
}

function WaterfallTooltipContent({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload as WaterfallItem;
  if (!item) return null;
  return (
    <div className="rounded-md border bg-card px-3 py-2 shadow-md text-sm">
      <p className="font-medium text-card-foreground">{item.name}</p>
      <p className="text-muted-foreground">
        {item.isSubtotal ? "" : "−"}{formatCompact(item.value)}
      </p>
    </div>
  );
}

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

export function OverviewTab({ financials, properties, projectionYears, getFiscalYear, global }: DashboardTabProps) {
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
  const totalRooms = financials.totalRooms;
  const totalPurchasePrice = properties.reduce((sum, p) => sum + p.purchasePrice, 0);
  const avgPurchasePrice = totalPurchasePrice / totalProperties;
  const avgRoomsPerProperty = totalRooms / totalProperties;
  const avgADR = totalRooms > 0
    ? properties.reduce((sum, p) => sum + p.startAdr * p.roomCount, 0) / totalRooms
    : 0;
  const avgExitCapRate = properties.reduce((sum, p) => sum + (p.exitCapRate ?? DEFAULT_EXIT_CAP_RATE), 0) / totalProperties;
  const totalInvestment = totalPurchasePrice;
  const investmentHorizon = projectionYears;

  const [waterfallYear, setWaterfallYear] = useState<string>("0");

  const marketCounts = properties.reduce((acc, p) => {
    acc[p.market] = (acc[p.market] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const marketEntries = Object.entries(marketCounts);
  const marketData = marketEntries.map(([name, value], i) => ({
    market: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    value,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));
  const marketChartConfig: ChartConfig = {
    value: { label: "Properties" },
    ...Object.fromEntries(
      marketEntries.map(([name], i) => [
        name.toLowerCase().replace(/\s+/g, "-"),
        { label: name, color: PIE_COLORS[i % PIE_COLORS.length] },
      ])
    ),
  };

  const statusCounts = properties.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const yearTabs = useMemo(() => {
    const tabs = Array.from({ length: projectionYears }, (_, i) => {
      const fy = global?.modelStartDate
        ? getFiscalYearForModelYear(global.modelStartDate, global?.fiscalYearStartMonth ?? 1, i)
        : `Year ${i + 1}`;
      return { value: String(i), label: String(fy) };
    });
    tabs.push({ value: "all", label: "Consolidated" });
    return tabs;
  }, [projectionYears, global?.modelStartDate, global?.fiscalYearStartMonth]);

  const waterfallData = useMemo(() => {
    if (!yearlyConsolidatedCache?.length) return null;
    if (waterfallYear === "all") {
      const summed = yearlyConsolidatedCache.reduce((acc, y) => ({
        revenueTotal: acc.revenueTotal + y.revenueTotal,
        gop: acc.gop + y.gop,
        agop: acc.agop + y.agop,
        noi: acc.noi + y.noi,
        anoi: acc.anoi + y.anoi,
        feeBase: acc.feeBase + y.feeBase,
        feeIncentive: acc.feeIncentive + y.feeIncentive,
        expenseFFE: acc.expenseFFE + y.expenseFFE,
      }), { revenueTotal: 0, gop: 0, agop: 0, noi: 0, anoi: 0, feeBase: 0, feeIncentive: 0, expenseFFE: 0 });
      return buildWaterfallData(summed);
    }
    const idx = Math.min(Number(waterfallYear), yearlyConsolidatedCache.length - 1);
    return buildWaterfallData(yearlyConsolidatedCache[idx]);
  }, [yearlyConsolidatedCache, waterfallYear]);

  const getPropertyCashFlows = (idx: number): number[] =>
    Array.from({ length: projectionYears }, (_, y) => allPropertyYearlyCF[idx]?.[y]?.netCashFlowToInvestors ?? 0);

  const getPropertyInvestment = (prop: typeof properties[0]): number =>
    propertyEquityInvested(prop);

  const truncName = (name: string) => {
    const limit = typeof window !== "undefined" && window.innerWidth < 640 ? 10 : 15;
    return name.length > limit ? name.substring(0, limit - 2) + '\u2026' : name;
  };

  const propertyIRRData = properties.map((prop, idx) => {
    const cashFlows = getPropertyCashFlows(idx);
    const irr = calculateIRR(cashFlows);
    return {
      name: truncName(prop.name),
      fullName: prop.name,
      irr: parseFloat((irr * 100).toFixed(1)),
    };
  });

  const propertyInvestmentData = properties.map((prop) => {
    const investment = getPropertyInvestment(prop);
    return {
      name: truncName(prop.name),
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
        dashboardExports.exportToExcel(years, rows, "portfolio-overview.xlsx", "Overview");
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
          cashFlowData: toExportData(generatePortfolioCashFlowData(allPropertyYearlyCF, projectionYears, getFiscalYear)),
          balanceSheetData: { years: [], rows: [] },
          investmentData: toExportData(generatePortfolioInvestmentData(financials, properties, projectionYears, getFiscalYear))
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
        <Accordion type="multiple" defaultValue={["performance", "projection", "composition", "insights", "marketStatus", "waterfall"]} className="space-y-4">

          <AccordionItem value="performance" className="border-none">
            <div className="flex items-center gap-2 py-3 px-1">
              <AccordionTrigger className="hover:no-underline p-0">
                <span className="text-sm font-semibold text-foreground tracking-wide uppercase">Investment Performance</span>
              </AccordionTrigger>
              <InfoTooltip
                text="Key return metrics for the entire portfolio across all properties and the full hold period."
                formula="IRR = discount rate where NPV of all cash flows = 0"
                light
                side="right"
              />
            </div>
            <AccordionContent className="pt-2 pb-4">
            <div className="relative">
              <div className="text-center mb-8">
                <p className="text-foreground/50 text-sm label-text">
                  <span className="font-mono">{investmentHorizon}</span>-Year Hold | <span className="font-mono">{totalProperties}</span> Properties | <span className="font-mono">{totalRooms}</span> Rooms
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 items-stretch gap-4 sm:gap-6 mb-6 sm:mb-10">
                <div className="bg-card rounded-lg p-3 sm:p-6 border border-border shadow-sm flex flex-col" data-testid="gauge-portfolio-irr">
                  <p className="text-xs font-medium tracking-widest text-foreground/60 uppercase mb-3 text-center label-text flex items-center justify-center gap-1">
                    Portfolio IRR
                    <InfoTooltip text="Internal Rate of Return — the annualized return that makes the net present value of all cash flows equal to zero." formula="NPV = Σ CFₜ / (1 + IRR)ᵗ = 0" light side="bottom" />
                  </p>
                  <div className="flex-1 flex items-center justify-center">
                    <RadialGauge
                      data={[{ name: "irr", value: Math.min(Math.max(portfolioIRR * 100, 0), 100), fill: "hsl(var(--accent-pop))" }]}
                      config={{ irr: { label: "Portfolio IRR", color: "hsl(var(--accent-pop))" } }}
                      dataKey="value"
                      centerValue={`${(portfolioIRR * 100).toFixed(1)}%`}
                      centerLabel="Portfolio IRR"
                      endAngle={Math.min(Math.max(portfolioIRR * 100, 0), 100) * 3.6}
                      innerRadius={70}
                      outerRadius={110}
                      className="mx-auto aspect-square max-h-[180px] sm:max-h-[220px] w-full"
                    />
                  </div>
                  <div className="text-center" data-testid="text-portfolio-irr">
                    <span className="sr-only">{(portfolioIRR * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div ref={chartsRef} className="bg-card rounded-lg p-3 sm:p-6 border border-border shadow-sm flex flex-col" data-testid="chart-property-irr-comparison">
                  <p className="text-xs font-medium tracking-widest text-foreground/60 uppercase mb-3 text-center label-text">Property IRR Comparison</p>
                  <ChartContainer config={{ irr: { label: "IRR", color: "var(--chart-1)" } } satisfies ChartConfig} className="h-[180px] sm:h-[200px] w-full">
                    <BarChart data={propertyIRRData} margin={{ top: 20, right: 5, left: 0, bottom: 30 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="name" tickLine={false} tickMargin={8} axisLine={false} angle={-30} textAnchor="end" height={45} tick={{ fontSize: 9 }} />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent
                          hideLabel
                          formatter={(value) => [`${Number(value).toFixed(1)}%`, 'IRR']}
                        />}
                      />
                      <Bar dataKey="irr" fill="var(--color-irr)" radius={8} maxBarSize={44}>
                        <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} formatter={(v: number) => `${v}%`} />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>

                <div className="bg-card rounded-lg p-3 sm:p-6 border border-border shadow-sm flex flex-col" data-testid="chart-property-investment">
                  <p className="text-xs font-medium tracking-widest text-foreground/60 uppercase mb-3 text-center label-text">Equity by Property</p>
                  <ChartContainer config={{ investment: { label: "Equity Invested", color: "var(--chart-2)" } } satisfies ChartConfig} className="h-[180px] sm:h-[200px] w-full">
                    <BarChart data={propertyInvestmentData} margin={{ top: 20, right: 5, left: 0, bottom: 30 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="name" tickLine={false} tickMargin={8} axisLine={false} angle={-30} textAnchor="end" height={45} tick={{ fontSize: 9 }} />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent
                          hideLabel
                          formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Equity']}
                        />}
                      />
                      <Bar dataKey="investment" fill="var(--color-investment)" radius={8} maxBarSize={44}>
                        <LabelList position="top" offset={12} className="fill-foreground" fontSize={11} formatter={(v: number) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`} />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>
              </div>

              <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <div className="bg-card rounded-lg p-3 sm:p-5 border border-border shadow-sm transition-all duration-300">
                  <div className="flex items-center gap-2 sm:gap-4 mb-3">
                    <div className="relative w-10 h-10 sm:w-14 sm:h-14 flex-shrink-0">
                      <svg className="w-10 h-10 sm:w-14 sm:h-14" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                        <circle
                          cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--accent-pop))" strokeWidth="6"
                          strokeDasharray={`${Math.min(equityMultiple * 63, 251)} 251`}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] sm:text-sm font-bold text-foreground font-mono">{equityMultiple.toFixed(1)}x</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg sm:text-2xl font-bold text-emerald-700 font-mono" data-testid="text-equity-multiple">{equityMultiple.toFixed(2)}x</p>
                      <p className="text-xs sm:text-sm text-foreground/60 label-text flex items-center">Equity Multiple<InfoTooltip text="Total distributions plus residual value divided by total equity invested. A 2.0x multiple means investors received double their investment." formula="EM = (Total Distributions + Exit Value) / Total Equity" light side="right" /></p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg p-3 sm:p-5 border border-border shadow-sm transition-all duration-300">
                  <div className="flex items-center gap-2 sm:gap-4 mb-3">
                    <div className="relative w-10 h-10 sm:w-14 sm:h-14 flex-shrink-0">
                      <svg className="w-10 h-10 sm:w-14 sm:h-14" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                        <circle
                          cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--accent-pop))" strokeWidth="6"
                          strokeDasharray={`${Math.min(Math.max(cashOnCash, 0) * 12.5, 251)} 251`}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] sm:text-sm font-bold text-foreground font-mono">{cashOnCash.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg sm:text-2xl font-bold text-primary font-mono" data-testid="text-cash-on-cash">{cashOnCash.toFixed(1)}%</p>
                      <p className="text-xs sm:text-sm text-foreground/60 label-text flex items-center whitespace-nowrap">Cash-on-Cash<InfoTooltip text="Annual pre-tax cash flow as a percentage of total equity invested. Measures the yield on your cash investment." formula="CoC = Annual Cash Flow / Total Equity Invested" light side="right" /></p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg p-3 sm:p-5 border border-border shadow-sm transition-all duration-300">
                  <div className="mb-2">
                    <p className="text-base sm:text-2xl font-bold text-foreground font-mono truncate" data-testid="text-equity-invested">{formatMoney(totalInitialEquity)}</p>
                    <p className="text-xs sm:text-sm text-foreground/60 label-text flex items-center">Equity Invested<InfoTooltip text="Total cash equity contributed by investors across all properties, excluding any debt financing." light side="right" /></p>
                  </div>
                  <div className="h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: '100%', background: 'linear-gradient(to right, hsl(var(--accent-pop)), hsl(var(--accent-pop-2)))' }} />
                  </div>
                </div>

                <div className="bg-card rounded-lg p-3 sm:p-5 border border-border shadow-sm transition-all duration-300">
                  <div className="mb-2">
                    <p className="text-base sm:text-2xl font-bold text-emerald-700 font-mono truncate" data-testid="text-exit-value">{formatMoney(totalExitValue)}</p>
                    <p className="text-xs sm:text-sm text-foreground/60 label-text flex items-center">Projected Exit<InfoTooltip text="Estimated total sale proceeds at the end of the hold period, based on projected NOI and exit cap rate." formula="Exit Value = NOI / Exit Cap Rate" light side="right" /></p>
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
            <div className="flex items-center gap-2 py-3 px-1">
              <AccordionTrigger className="hover:no-underline p-0">
                <span className="text-sm font-semibold text-foreground tracking-wide uppercase">Revenue & ANOI Projection</span>
              </AccordionTrigger>
              <InfoTooltip
                text="Revenue is total income from all hotel operations. ANOI (Adjusted Net Operating Income) is the bottom operating line after all expenses, management fees, insurance, taxes, and FF&E reserve."
                formula="ANOI = Revenue − OpEx − Mgmt Fees − Insurance − Taxes − FF&E"
                light
                side="right"
              />
            </div>
            <AccordionContent className="pt-2 pb-4">
            <div className="bg-card rounded-lg border border-border shadow-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground font-display">Revenue & ANOI</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground label-text">{investmentHorizon}-year consolidated projection</p>
                </div>
                <div className="flex items-center gap-3 sm:gap-5">
                  <div className="flex items-center gap-3 sm:gap-4 text-xs label-text">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
                      <span className="text-muted-foreground">Revenue</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
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
                      formatter={(value: number, name: string) => {
                        const labels: Record<string, string> = { revenue: "Revenue — Total Revenue", anoi: "ANOI — Adjusted Net Operating Income" };
                        return [formatMoney(value), labels[name] ?? name];
                      }}
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid hsl(var(--border))',
                        backgroundColor: 'hsl(var(--card))',
                        fontSize: 12,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                    <Area type="monotone" dataKey="revenue" fill="url(#revenueGrad)" stroke="hsl(var(--line-1))" strokeWidth={2} dot={{ fill: "hsl(var(--line-1))", stroke: "#fff", strokeWidth: 2, r: 3 }} activeDot={{ r: 5, fill: "hsl(var(--line-1))", stroke: "#fff", strokeWidth: 2 }} />
                    <Area type="monotone" dataKey="anoi" fill="url(#anoiGrad)" stroke="hsl(var(--line-2))" strokeWidth={2} dot={{ fill: "hsl(var(--line-2))", stroke: "#fff", strokeWidth: 2, r: 3 }} activeDot={{ r: 5, fill: "hsl(var(--line-2))", stroke: "#fff", strokeWidth: 2 }} />
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
                      formatter={(value: number, name: string) => {
                        const labels: Record<string, string> = { revenue: "Revenue — Total Revenue", anoi: "ANOI — Adjusted Net Operating Income" };
                        return [formatMoney(value), labels[name] ?? name];
                      }}
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid hsl(var(--border))',
                        backgroundColor: 'hsl(var(--card))',
                        fontSize: 12,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--line-1))" strokeWidth={2.5} dot={{ fill: "hsl(var(--line-1))", stroke: "#fff", strokeWidth: 2, r: 3.5 }} activeDot={{ r: 5.5, fill: "hsl(var(--line-1))", stroke: "#fff", strokeWidth: 2 }} />
                    <Line type="monotone" dataKey="anoi" stroke="hsl(var(--line-2))" strokeWidth={2.5} dot={{ fill: "hsl(var(--line-2))", stroke: "#fff", strokeWidth: 2, r: 3.5 }} activeDot={{ r: 5.5, fill: "hsl(var(--line-2))", stroke: "#fff", strokeWidth: 2 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="composition" className="border-none">
            <div className="flex items-center gap-2 py-3 px-1">
              <AccordionTrigger className="hover:no-underline p-0">
                <span className="text-sm font-semibold text-foreground tracking-wide uppercase">Portfolio & Capital Structure</span>
              </AccordionTrigger>
              <InfoTooltip
                text="Composition shows the physical portfolio makeup. Capital Structure breaks down how the investments are funded and what returns are projected."
                light
                side="right"
              />
            </div>
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

          <AccordionItem value="insights" className="border-none">
            <div className="flex items-center gap-2 py-3 px-1">
              <AccordionTrigger className="hover:no-underline p-0">
                <span className="text-sm font-semibold text-foreground tracking-wide uppercase">Portfolio Insights</span>
              </AccordionTrigger>
              <InfoTooltip
                text="Automated intelligence observations about portfolio performance, diversification, and risk factors."
                light
                side="right"
              />
            </div>
            <AccordionContent className="pt-2 pb-4 space-y-4">
            <div className="rounded-lg border border-border overflow-hidden" data-testid="portfolio-property-table">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-xs font-semibold text-muted-foreground w-[30px]">#</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Property</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Market</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-center">Rooms</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-center">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right">Acquisition</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right">ADR</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right">IRR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((prop, idx) => {
                    const irr = propertyIRRData[idx]?.irr ?? 0;
                    return (
                      <TableRow key={prop.id} className="hover:bg-muted/30" data-testid={`row-property-${prop.id}`}>
                        <TableCell className="text-xs text-muted-foreground font-mono py-2.5">{idx + 1}</TableCell>
                        <TableCell className="py-2.5">
                          <Link href={`/property/${prop.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                            {prop.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-2.5">{prop.market}</TableCell>
                        <TableCell className="text-xs text-foreground font-mono text-center py-2.5">{prop.roomCount}</TableCell>
                        <TableCell className="text-center py-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            prop.status === "Operating" ? "bg-emerald-500/10 text-emerald-600" :
                            prop.status === "Improvements" ? "bg-amber-500/10 text-amber-600" :
                            prop.status === "Acquired" ? "bg-blue-500/10 text-blue-600" :
                            prop.status === "Planned" ? "bg-sky-500/10 text-sky-600" :
                            prop.status === "In Negotiation" ? "bg-purple-500/10 text-purple-600" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {prop.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-foreground font-mono text-right py-2.5">{formatMoney(prop.purchasePrice)}</TableCell>
                        <TableCell className="text-xs text-foreground font-mono text-right py-2.5">${prop.startAdr.toFixed(0)}</TableCell>
                        <TableCell className="text-xs font-mono text-right py-2.5">
                          <span className={irr >= 0 ? "text-emerald-600" : "text-destructive"}>{irr.toFixed(1)}%</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <InsightPanel
              data-testid="insight-dashboard"
              title="Portfolio Insights"
              insights={insights}
            />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="marketStatus" className="border-none">
            <div className="flex items-center gap-2 py-3 px-1">
              <AccordionTrigger className="hover:no-underline p-0">
                <span className="text-sm font-semibold text-foreground tracking-wide uppercase">Portfolio Composition</span>
              </AccordionTrigger>
              <InfoTooltip
                text="Geographic distribution of properties across markets and the lifecycle status of each asset in the portfolio."
                light
                side="right"
              />
            </div>
            <AccordionContent className="pt-2 pb-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="flex flex-col">
                  <CardHeader className="items-center pb-0">
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                      Portfolio by Market
                      <InfoTooltip text="Number of properties in each geographic market. Diversification across markets reduces concentration risk." light side="right" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 pb-0">
                    {marketData.length > 0 ? (
                      <ChartContainer
                        config={marketChartConfig}
                        className="mx-auto aspect-square max-h-[280px]"
                      >
                        <PieChart>
                          <Pie data={marketData} dataKey="value" nameKey="market" />
                          <ChartLegend
                            content={<ChartLegendContent nameKey="market" />}
                            className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                          />
                        </PieChart>
                      </ChartContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                        No properties to display
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                      Properties by Status
                      <InfoTooltip text="Lifecycle status of each property: Operating (revenue-generating), Improvements (under renovation), Acquired (closed but not yet operating), In Negotiation (under contract), Planned (in pipeline)." light side="right" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-4 py-2">
                      {STATUSES.map((status) => {
                        const count = statusCounts[status] || 0;
                        if (count === 0) return null;
                        const pct = totalProperties > 0 ? (count / totalProperties) * 100 : 0;
                        return (
                          <div key={status} className="flex items-center gap-3" data-testid={`status-bar-${status.toLowerCase().replace(/\s+/g, '-')}`}>
                            <span className="text-sm font-medium w-[120px] shrink-0">{status}</span>
                            <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                              <div
                                className={`h-full rounded transition-all duration-300 ${STATUS_COLORS[status] || "bg-primary/70"}`}
                                style={{ width: `${pct}%`, minWidth: count > 0 ? 4 : 0 }}
                              />
                            </div>
                            <span className="text-base font-bold font-mono tabular-nums w-6 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>

          {waterfallData && (
            <AccordionItem value="waterfall" className="border-none">
              <div className="flex items-center gap-2 py-3 px-1">
                <AccordionTrigger className="hover:no-underline p-0">
                  <span className="text-sm font-semibold text-foreground tracking-wide uppercase">USALI Profit Waterfall</span>
                </AccordionTrigger>
                <InfoTooltip
                  text="Revenue cascade through operating expenses to net income following the Uniform System of Accounts for the Lodging Industry (USALI). Shows how total revenue flows down to ANOI after departmental expenses, undistributed costs, management fees, fixed charges, and FF&E reserve."
                  formula="Revenue → GOP → AGOP → NOI → ANOI"
                  light
                  side="right"
                />
              </div>
              <AccordionContent className="pt-2 pb-4">
                <Card data-testid="usali-waterfall-card">
                  <CardHeader className="pb-2">
                    <p className="text-xs text-muted-foreground">Revenue cascade through operating expenses to net income (consolidated portfolio)</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <CurrentThemeTab
                      tabs={yearTabs}
                      activeTab={waterfallYear}
                      onTabChange={setWaterfallYear}
                    />
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={waterfallData} margin={{ top: 16, right: 16, bottom: 4, left: 8 }}>
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tickFormatter={(v: number) => formatCompact(Math.abs(v))}
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          tickLine={false}
                          axisLine={false}
                          width={60}
                        />
                        <RechartsTooltip content={<WaterfallTooltipContent />} />
                        <ReferenceLine y={0} stroke="hsl(var(--border))" />
                        <Bar dataKey="base" stackId="waterfall" fill="transparent" isAnimationActive={false} />
                        <Bar dataKey="value" stackId="waterfall" radius={[4, 4, 0, 0]} isAnimationActive>
                          {waterfallData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} opacity={entry.isSubtotal ? 1 : 0.75} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-center gap-6 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm" style={{ background: "hsl(var(--chart-1))" }} />
                        Subtotals
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm opacity-75" style={{ background: "hsl(var(--chart-2))" }} />
                        Deductions
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm" style={{ background: "hsl(var(--primary))" }} />
                        Net Result
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
}
