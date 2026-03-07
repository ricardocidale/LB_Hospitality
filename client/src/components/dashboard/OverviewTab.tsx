import React, { useRef, useState } from "react";
import { InsightPanel, type Insight } from "@/components/graphics";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, LineChart, Line, LabelList } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
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
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import * as XLSX from "xlsx";
import { RadialGauge } from "@/lib/charts";

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

              <div className="grid grid-cols-1 lg:grid-cols-3 items-stretch gap-6 mb-10">
                <div className="bg-card rounded-lg p-6 border border-border shadow-sm flex flex-col" data-testid="gauge-portfolio-irr">
                  <p className="text-xs font-medium tracking-widest text-foreground/60 uppercase mb-3 text-center label-text flex items-center justify-center gap-1">
                    Portfolio IRR
                    <InfoTooltip text="Internal Rate of Return — the annualized return that makes the net present value of all cash flows equal to zero." formula="NPV = Σ CFₜ / (1 + IRR)ᵗ = 0" light side="bottom" />
                  </p>
                  <div className="flex-1 flex items-center justify-center">
                    <RadialGauge
                      data={[{ name: "irr", value: Math.min(Math.max(portfolioIRR * 100, 0), 100), fill: "var(--chart-1)" }]}
                      config={{ irr: { label: "Portfolio IRR", color: "hsl(var(--chart-1))" } }}
                      dataKey="value"
                      centerValue={`${(portfolioIRR * 100).toFixed(1)}%`}
                      centerLabel="Portfolio IRR"
                      endAngle={Math.min(Math.max(portfolioIRR * 100, 0), 100) * 3.6}
                      innerRadius={70}
                      outerRadius={110}
                      className="mx-auto aspect-square max-h-[220px] w-full"
                    />
                  </div>
                  <div className="text-center" data-testid="text-portfolio-irr">
                    <span className="sr-only">{(portfolioIRR * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div ref={chartsRef} className="bg-card rounded-lg p-6 border border-border shadow-sm flex flex-col" data-testid="chart-property-irr-comparison">
                  <p className="text-xs font-medium tracking-widest text-foreground/60 uppercase mb-3 text-center label-text">Property IRR Comparison</p>
                  <ChartContainer config={{ irr: { label: "IRR", color: "var(--chart-1)" } } satisfies ChartConfig} className="h-[200px] w-full">
                    <BarChart data={propertyIRRData} margin={{ top: 20, right: 10, left: 0, bottom: 40 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} angle={-25} textAnchor="end" height={50} tick={{ fontSize: 10 }} />
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

                <div className="bg-card rounded-lg p-6 border border-border shadow-sm flex flex-col" data-testid="chart-property-investment">
                  <p className="text-xs font-medium tracking-widest text-foreground/60 uppercase mb-3 text-center label-text">Equity by Property</p>
                  <ChartContainer config={{ investment: { label: "Equity Invested", color: "var(--chart-2)" } } satisfies ChartConfig} className="h-[200px] w-full">
                    <BarChart data={propertyInvestmentData} margin={{ top: 20, right: 10, left: 0, bottom: 40 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} angle={-25} textAnchor="end" height={50} tick={{ fontSize: 10 }} />
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

              <div className="grid gap-6 grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
                <div className="bg-card rounded-lg p-4 border border-border shadow-sm flex flex-col items-center text-center">
                  <RadialGauge
                    data={[{ name: "em", value: Math.min(equityMultiple, 5), fill: "var(--chart-1)" }]}
                    config={{ em: { label: "Equity Multiple", color: "hsl(var(--chart-1))" } }}
                    dataKey="value"
                    centerValue={`${equityMultiple.toFixed(2)}x`}
                    centerLabel="Equity Multiple"
                    endAngle={Math.min(equityMultiple / 5, 1) * 360}
                    innerRadius={50}
                    outerRadius={80}
                    className="mx-auto aspect-square max-h-[160px] w-full"
                  />
                  <p className="text-sm text-foreground/60 label-text flex items-center gap-1 -mt-2" data-testid="text-equity-multiple">
                    <InfoTooltip text="Total distributions plus residual value divided by total equity invested. A 2.0x multiple means investors received double their investment." formula="EM = (Total Distributions + Exit Value) / Total Equity" light side="right" />
                  </p>
                </div>

                <div className="bg-card rounded-lg p-4 border border-border shadow-sm flex flex-col items-center text-center">
                  <RadialGauge
                    data={[{ name: "coc", value: Math.min(Math.max(cashOnCash, 0), 20), fill: "var(--chart-2)" }]}
                    config={{ coc: { label: "Cash-on-Cash", color: "hsl(var(--chart-2))" } }}
                    dataKey="value"
                    centerValue={`${cashOnCash.toFixed(1)}%`}
                    centerLabel="Cash-on-Cash"
                    endAngle={Math.min(Math.max(cashOnCash, 0) / 20, 1) * 360}
                    innerRadius={50}
                    outerRadius={80}
                    className="mx-auto aspect-square max-h-[160px] w-full"
                  />
                  <p className="text-sm text-foreground/60 label-text flex items-center gap-1 -mt-2" data-testid="text-cash-on-cash">
                    <InfoTooltip text="Annual pre-tax cash flow as a percentage of total equity invested. Measures the yield on your cash investment." formula="CoC = Annual Cash Flow / Total Equity Invested" light side="right" />
                  </p>
                </div>

                <div className="bg-card rounded-lg p-4 border border-border shadow-sm flex flex-col items-center text-center">
                  <RadialGauge
                    data={[{ name: "eq", value: Math.min(totalInitialEquity / 1_000_000, 50), fill: "var(--chart-3)" }]}
                    config={{ eq: { label: "Equity Invested", color: "hsl(var(--chart-3))" } }}
                    dataKey="value"
                    centerValue={totalInitialEquity >= 1_000_000 ? `$${(totalInitialEquity / 1_000_000).toFixed(1)}M` : formatMoney(totalInitialEquity)}
                    centerLabel="Equity Invested"
                    endAngle={Math.min(totalInitialEquity / 50_000_000, 1) * 360}
                    innerRadius={50}
                    outerRadius={80}
                    className="mx-auto aspect-square max-h-[160px] w-full"
                  />
                  <p className="text-sm text-foreground/60 label-text flex items-center gap-1 -mt-2" data-testid="text-equity-invested">
                    <InfoTooltip text="Total cash equity contributed by investors across all properties, excluding any debt financing." light side="right" />
                  </p>
                </div>

                <div className="bg-card rounded-lg p-4 border border-border shadow-sm flex flex-col items-center text-center">
                  <RadialGauge
                    data={[{ name: "exit", value: Math.min(totalExitValue / 1_000_000, 100), fill: "var(--chart-4)" }]}
                    config={{ exit: { label: "Projected Exit", color: "hsl(var(--chart-4))" } }}
                    dataKey="value"
                    centerValue={totalExitValue >= 1_000_000 ? `$${(totalExitValue / 1_000_000).toFixed(1)}M` : formatMoney(totalExitValue)}
                    centerLabel="Projected Exit"
                    endAngle={Math.min(totalExitValue / 100_000_000, 1) * 360}
                    innerRadius={50}
                    outerRadius={80}
                    className="mx-auto aspect-square max-h-[160px] w-full"
                  />
                  <p className="text-sm text-foreground/60 label-text flex items-center gap-1 -mt-2" data-testid="text-exit-value">
                    <span className="text-emerald-600 font-medium font-mono text-xs">+{exitGainPercent}% gain</span>
                    <InfoTooltip text="Estimated total sale proceeds at the end of the hold period, based on projected NOI and exit cap rate." formula="Exit Value = NOI / Exit Cap Rate" light side="right" />
                  </p>
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
        </Accordion>
      </CardContent>
    </Card>
  );
}
