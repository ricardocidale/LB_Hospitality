import React, { useRef } from "react";
import { AnimatedSection, InsightPanel, ScrollReveal, formatCompact, type Insight } from "@/components/graphics";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from "recharts";
import { DashboardTabProps } from "./types";
import PortfolioResearchCard from "./PortfolioResearchCard";
import { formatMoney } from "@/lib/financialEngine";
import { DEFAULT_EXIT_CAP_RATE } from "@/lib/constants";
import { computeIRR } from "@analytics/returns/irr.js";
import { propertyEquityInvested } from "@/lib/financial/equityCalculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { ExportMenu, pdfAction, csvAction, excelAction, pptxAction, chartAction, pngAction } from "@/components/ui/export-toolbar";
import { dashboardExports, generatePortfolioCashFlowData, generatePortfolioInvestmentData, exportPortfolioPDF, exportPortfolioCSV } from "./dashboardExports";
import * as XLSX from "xlsx";

function calculateIRR(cashFlows: number[]): number {
  const result = computeIRR(cashFlows, 1);
  return result.irr_periodic ?? 0;
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
    const rev = yearlyConsolidatedCache[y]?.totalRevenue ?? 0;
    const noi = yearlyConsolidatedCache[y]?.noi ?? 0;
    const cf = allPropertyYearlyCF.reduce((sum, propCF) => sum + (propCF[y]?.netCashFlowToInvestors ?? 0), 0);
    return {
      year: getFiscalYear(y),
      revenue: Math.round(rev),
      noi: Math.round(noi),
      cashFlow: Math.round(cf),
    };
  });

  const exitGainPercent = totalInitialEquity > 0 ? ((totalExitValue / totalInitialEquity - 1) * 100).toFixed(0) : "0";

  const insights: Insight[] = [
    { text: "Portfolio IRR", metric: `${(portfolioIRR * 100).toFixed(1)}%`, type: portfolioIRR > 0.12 ? "positive" as const : portfolioIRR > 0.08 ? "neutral" as const : "warning" as const },
    { text: `${totalProperties} properties across ${Object.keys(marketCounts).length} markets`, type: "neutral" as const },
    { text: "Equity Multiple", metric: `${equityMultiple.toFixed(2)}x`, type: equityMultiple > 2 ? "positive" as const : "neutral" as const },
    { text: "Avg Cash-on-Cash Return", metric: `${cashOnCash.toFixed(1)}%`, type: cashOnCash > 8 ? "positive" as const : "warning" as const },
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
    <Card className="bg-white/60 backdrop-blur-sm border-white/40 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
      <CardContent ref={tabContentRef}>
        <div className="space-y-8">

          <AnimatedSection>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <StatCard
                variant="dashboard"
                label="Portfolio IRR"
                value={portfolioIRR * 100}
                format="percent"
                trend={portfolioIRR > 0.12 ? "up" : portfolioIRR > 0.08 ? "neutral" : "down"}
                trendValue={portfolioIRR > 0.12 ? "Strong" : portfolioIRR > 0.08 ? "Moderate" : "Below target"}
                description={`${investmentHorizon}-year hold across ${totalProperties} properties`}
                data-testid="text-portfolio-irr"
              />
              <StatCard
                variant="dashboard"
                label="Equity Multiple"
                value={`${equityMultiple.toFixed(2)}x`}
                trend={equityMultiple > 2 ? "up" : "neutral"}
                trendValue={equityMultiple > 2 ? `+${((equityMultiple - 1) * 100).toFixed(0)}%` : `${((equityMultiple - 1) * 100).toFixed(0)}%`}
                description={`${formatMoney(totalInitialEquity)} invested`}
                data-testid="text-equity-multiple"
              />
              <StatCard
                variant="dashboard"
                label="Cash-on-Cash"
                value={cashOnCash}
                format="percent"
                trend={cashOnCash > 8 ? "up" : cashOnCash > 5 ? "neutral" : "down"}
                trendValue={cashOnCash > 8 ? "Above target" : cashOnCash > 5 ? "On track" : "Below target"}
                description="Average annual return on equity"
                data-testid="text-cash-on-cash"
              />
              <StatCard
                variant="dashboard"
                label="Projected Exit"
                value={totalExitValue}
                format="money"
                trend="up"
                trendValue={`+${exitGainPercent}%`}
                description={`${formatMoney(totalExitValue - totalInitialEquity)} projected gain`}
                data-testid="text-exit-value"
              />
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <div ref={chartsRef} className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#2d4a5e] font-display">Revenue & NOI</h3>
                  <p className="text-sm text-[#2d4a5e]/50 label-text">{investmentHorizon}-year consolidated projection</p>
                </div>
                <div className="flex items-center gap-4 text-xs label-text">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#9FBCA4' }} />
                    Revenue
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#257D41' }} />
                    NOI
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueNOIData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9FBCA4" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#9FBCA4" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="noiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#257D41" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#257D41" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,74,94,0.08)" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={(v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [formatMoney(value), name === 'revenue' ? 'Revenue' : 'NOI']}
                    contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)', fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#9FBCA4" strokeWidth={2.5} fill="url(#revGrad)" dot={false} />
                  <Area type="monotone" dataKey="noi" stroke="#257D41" strokeWidth={2.5} fill="url(#noiGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6" data-testid="chart-property-irr-comparison">
                <h3 className="text-sm font-semibold text-[#2d4a5e] mb-1 font-display">Property IRR Comparison</h3>
                <p className="text-xs text-[#2d4a5e]/40 mb-4 label-text">Individual property returns</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={propertyIRRData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,74,94,0.08)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} angle={-25} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 10, fill: '#6b7280' }} domain={[0, 'auto']} width={45} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'IRR']}
                      labelFormatter={(_label: string, payload: Array<{ payload?: { fullName?: string } }>) => payload?.[0]?.payload?.fullName || _label}
                      contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)', fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    />
                    <Bar dataKey="irr" radius={[4, 4, 0, 0]} maxBarSize={40} fill="#9FBCA4" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6" data-testid="chart-property-investment">
                <h3 className="text-sm font-semibold text-[#2d4a5e] mb-1 font-display">Equity by Property</h3>
                <p className="text-xs text-[#2d4a5e]/40 mb-4 label-text">Capital allocation across portfolio</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={propertyInvestmentData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,74,94,0.08)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} angle={-25} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: '#6b7280' }} domain={[0, 'auto']} width={55} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Equity Invested']}
                      labelFormatter={(_label: string, payload: Array<{ payload?: { fullName?: string } }>) => payload?.[0]?.payload?.fullName || _label}
                      contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)', fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    />
                    <Bar dataKey="investment" radius={[4, 4, 0, 0]} maxBarSize={40} fill="#257D41" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-sm">
                <h3 className="text-sm font-semibold text-[#2d4a5e] mb-5 font-display">Portfolio Composition</h3>
                <div className="space-y-4">
                  {[
                    { label: "Properties", value: String(totalProperties) },
                    { label: "Total Rooms", value: String(totalRooms) },
                    { label: "Avg Rooms/Property", value: avgRoomsPerProperty.toFixed(0) },
                    { label: "Markets", value: String(Object.keys(marketCounts).length) },
                    { label: "Avg Daily Rate", value: formatMoney(avgADR), highlight: true },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-1 border-b border-[#2d4a5e]/5 last:border-0">
                      <span className="text-sm text-[#2d4a5e]/60 label-text">{row.label}</span>
                      <span className={`font-semibold font-mono text-sm ${row.highlight ? 'text-[#257D41]' : 'text-[#2d4a5e]'}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-sm">
                <h3 className="text-sm font-semibold text-[#2d4a5e] mb-5 font-display">Capital Structure</h3>
                <div className="space-y-4">
                  {[
                    { label: "Total Investment", value: formatMoney(totalInvestment) },
                    { label: "Avg Purchase Price", value: formatMoney(avgPurchasePrice) },
                    { label: "Avg Exit Cap Rate", value: `${(avgExitCapRate * 100).toFixed(1)}%`, highlight: true },
                    { label: "Hold Period", value: `${investmentHorizon} Years` },
                    { label: "Projected Exit Value", value: formatMoney(totalExitValue), highlight: true },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-1 border-b border-[#2d4a5e]/5 last:border-0">
                      <span className="text-sm text-[#2d4a5e]/60 label-text">{row.label}</span>
                      <span className={`font-semibold font-mono text-sm ${row.highlight ? 'text-[#257D41]' : 'text-[#2d4a5e]'}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 border border-white/50 shadow-sm text-center">
                <p className="text-xs text-[#2d4a5e]/50 label-text mb-2">{investmentHorizon}-Year Revenue</p>
                <p className="text-2xl font-bold text-[#2d4a5e] font-mono">{formatCompact(totalProjectionRevenue)}</p>
              </div>
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 border border-white/50 shadow-sm text-center">
                <p className="text-xs text-[#2d4a5e]/50 label-text mb-2">{investmentHorizon}-Year NOI</p>
                <p className="text-2xl font-bold text-[#257D41] font-mono">{formatCompact(totalProjectionNOI)}</p>
              </div>
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 border border-white/50 shadow-sm text-center">
                <p className="text-xs text-[#2d4a5e]/50 label-text mb-2">{investmentHorizon}-Year Cash Flow</p>
                <p className="text-2xl font-bold text-[#2d4a5e] font-mono">{formatCompact(totalProjectionCashFlow)}</p>
              </div>
            </div>
          </AnimatedSection>

          <ScrollReveal>
            <PortfolioResearchCard
              properties={properties}
              yearlyConsolidatedCache={yearlyConsolidatedCache}
              allPropertyYearlyIS={allPropertyYearlyIS}
            />
          </ScrollReveal>

          <ScrollReveal>
            <InsightPanel
              data-testid="insight-dashboard"
              title="Portfolio Insights"
              insights={insights}
            />
          </ScrollReveal>
        </div>
      </CardContent>
    </Card>
  );
}
