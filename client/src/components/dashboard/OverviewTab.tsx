import React, { useRef } from "react";
import { AnimatedSection, InsightPanel, ScrollReveal, type Insight } from "@/components/graphics";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from "recharts";
import { DashboardTabProps } from "./types";
import PortfolioResearchCard from "./PortfolioResearchCard";
import { formatMoney } from "@/lib/financialEngine";
import { DEFAULT_EXIT_CAP_RATE } from "@/lib/constants";
import { computeIRR } from "@analytics/returns/irr.js";
import { propertyEquityInvested } from "@/lib/financial/equityCalculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    const rev = yearlyConsolidatedCache[y]?.revenueTotal ?? 0;
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

  const marketList = Object.entries(marketCounts).map(([m, c]) => `${m} (${c})`).join(', ');
  const insights: Insight[] = [
    { text: `Markets: ${marketList}`, type: "neutral" as const },
    { text: `${investmentHorizon}-year total revenue`, metric: formatMoney(totalProjectionRevenue), type: "neutral" as const },
    { text: `${investmentHorizon}-year total NOI`, metric: formatMoney(totalProjectionNOI), type: "neutral" as const },
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
    <Card className="bg-white/60 backdrop-blur-sm border-white/40 shadow-lg relative overflow-hidden">
      <svg className="absolute top-0 left-0 w-40 h-40 pointer-events-none opacity-[0.07]" viewBox="0 0 160 160" fill="none">
        <circle cx="20" cy="20" r="80" stroke="#257D41" strokeWidth="1" />
        <circle cx="20" cy="20" r="60" stroke="#9FBCA4" strokeWidth="0.8" />
        <circle cx="20" cy="20" r="40" stroke="#257D41" strokeWidth="0.6" />
        <path d="M0 80 Q40 40 80 0" stroke="#9FBCA4" strokeWidth="1.2" fill="none" />
        <path d="M0 120 Q60 60 120 0" stroke="#257D41" strokeWidth="0.8" fill="none" />
        <path d="M10 10 Q30 50 10 90" stroke="#9FBCA4" strokeWidth="1" fill="none" />
        <path d="M10 10 Q50 30 90 10" stroke="#9FBCA4" strokeWidth="1" fill="none" />
        <ellipse cx="10" cy="10" rx="3" ry="3" fill="#257D41" />
      </svg>

      <svg className="absolute top-0 right-0 w-48 h-48 pointer-events-none opacity-[0.06]" viewBox="0 0 200 200" fill="none">
        <path d="M200 0 C180 40 160 80 200 120" stroke="#9FBCA4" strokeWidth="1.5" />
        <path d="M170 0 C150 50 140 90 170 130" stroke="#257D41" strokeWidth="1" />
        <path d="M200 0 L160 40" stroke="#9FBCA4" strokeWidth="0.8" />
        <path d="M200 20 L170 50" stroke="#257D41" strokeWidth="0.6" />
        <path d="M200 40 L180 60" stroke="#9FBCA4" strokeWidth="0.6" />
        <path d="M160 0 Q180 20 200 60 Q180 40 160 0Z" fill="#9FBCA4" opacity="0.3" />
        <path d="M180 0 Q190 15 200 40 Q190 20 180 0Z" fill="#257D41" opacity="0.3" />
        <circle cx="190" cy="10" r="2" fill="#257D41" opacity="0.5" />
        <circle cx="175" cy="25" r="1.5" fill="#9FBCA4" opacity="0.4" />
      </svg>

      <svg className="absolute bottom-0 left-0 w-44 h-44 pointer-events-none opacity-[0.05]" viewBox="0 0 180 180" fill="none">
        <path d="M0 180 Q40 120 0 60" stroke="#9FBCA4" strokeWidth="1.2" />
        <path d="M0 180 Q60 140 120 180" stroke="#257D41" strokeWidth="1" />
        <path d="M0 180 Q30 150 60 180" stroke="#9FBCA4" strokeWidth="0.8" />
        <path d="M0 140 Q20 160 0 180" stroke="#257D41" strokeWidth="1.5" fill="none" />
        <path d="M0 140 Q20 160 0 180 Q10 155 0 140Z" fill="#9FBCA4" opacity="0.25" />
        <path d="M30 180 Q35 160 30 140 Q40 155 50 170 Q40 180 30 180Z" fill="#257D41" opacity="0.15" />
        <circle cx="15" cy="170" r="2" fill="#257D41" opacity="0.4" />
      </svg>

      <svg className="absolute bottom-0 right-0 w-56 h-56 pointer-events-none opacity-[0.05]" viewBox="0 0 220 220" fill="none">
        <path d="M220 220 Q160 180 140 220" stroke="#9FBCA4" strokeWidth="1" />
        <path d="M220 220 Q180 160 220 140" stroke="#257D41" strokeWidth="1" />
        <path d="M220 180 Q190 190 180 220" stroke="#9FBCA4" strokeWidth="0.8" />
        <circle cx="220" cy="220" r="50" stroke="#9FBCA4" strokeWidth="0.6" fill="none" />
        <circle cx="220" cy="220" r="35" stroke="#257D41" strokeWidth="0.5" fill="none" />
        <path d="M220 170 Q200 190 220 210 Q210 185 220 170Z" fill="#257D41" opacity="0.15" />
        <path d="M170 220 Q190 200 210 220 Q185 210 170 220Z" fill="#9FBCA4" opacity="0.15" />
        <circle cx="200" cy="205" r="1.5" fill="#257D41" opacity="0.3" />
        <circle cx="210" cy="195" r="1" fill="#9FBCA4" opacity="0.3" />
      </svg>

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
        <div className="space-y-8">

          <AnimatedSection>
            <div className="relative">
              <div className="text-center mb-8">
                <p className="text-sm font-medium tracking-widest text-[#2d4a5e]/60 uppercase mb-2 label-text">Investment Performance</p>
                <p className="text-[#2d4a5e]/50 text-sm label-text">
                  <span className="font-mono">{investmentHorizon}</span>-Year Hold | <span className="font-mono">{totalProperties}</span> Properties | <span className="font-mono">{totalRooms}</span> Rooms
                </p>
              </div>

              <div className="flex flex-col lg:flex-row items-center justify-center gap-8 mb-10">
                <div className="relative bg-white/95 backdrop-blur-xl rounded-[2rem] p-8 border border-[#9FBCA4]/40 shadow-xl shadow-black/10" data-testid="gauge-portfolio-irr">
                  <div className="relative">
                    <svg className="w-48 h-48" viewBox="0 0 200 200">
                      <defs>
                        <linearGradient id="irrTube3D" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#9FBCA4" />
                          <stop offset="40%" stopColor="#257D41" />
                          <stop offset="100%" stopColor="#1a5c2e" />
                        </linearGradient>
                      </defs>
                      <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(45,74,94,0.1)" strokeWidth="12" />
                      <circle
                        cx="100" cy="100" r="80" fill="none" stroke="url(#irrTube3D)" strokeWidth="12"
                        strokeDasharray={`${Math.min(Math.max(portfolioIRR * 100, 0) * 5.03, 503)} 503`}
                        strokeLinecap="round"
                        transform="rotate(-90 100 100)"
                        style={{ filter: 'drop-shadow(0 0 10px rgba(37,125,65,0.4))' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-bold text-[#2d4a5e] tracking-tight font-mono" data-testid="text-portfolio-irr">{(portfolioIRR * 100).toFixed(1)}%</span>
                      <span className="text-sm text-[#2d4a5e]/60 font-medium mt-2 label-text">Portfolio IRR</span>
                    </div>
                  </div>
                </div>

                <div ref={chartsRef} className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 border border-[#9FBCA4]/40 shadow-xl shadow-black/10 w-full lg:min-w-[340px]" data-testid="chart-property-irr-comparison">
                  <p className="text-xs font-medium tracking-widest text-[#2d4a5e]/60 uppercase mb-3 text-center label-text">Property IRR Comparison</p>
                  <ResponsiveContainer width="100%" height={200}>
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

                <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 border border-[#9FBCA4]/40 shadow-xl shadow-black/10 w-full lg:min-w-[340px]" data-testid="chart-property-investment">
                  <p className="text-xs font-medium tracking-widest text-[#2d4a5e]/60 uppercase mb-3 text-center label-text">Equity by Property</p>
                  <ResponsiveContainer width="100%" height={200}>
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

              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-white/40 shadow-lg shadow-black/10 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="relative w-14 h-14 flex-shrink-0">
                      <svg className="w-14 h-14" viewBox="0 0 100 100">
                        <defs>
                          <linearGradient id="smallTube3D_eq" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#9FBCA4" />
                            <stop offset="40%" stopColor="#257D41" />
                            <stop offset="100%" stopColor="#1a5c2e" />
                          </linearGradient>
                        </defs>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(45,74,94,0.15)" strokeWidth="6" />
                        <circle
                          cx="50" cy="50" r="40" fill="none" stroke="url(#smallTube3D_eq)" strokeWidth="6"
                          strokeDasharray={`${Math.min(equityMultiple * 63, 251)} 251`}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                          style={{ filter: 'drop-shadow(0 0 6px rgba(37,125,65,0.4))' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-[#2d4a5e] font-mono">{equityMultiple.toFixed(1)}x</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#257D41] font-mono" data-testid="text-equity-multiple">{equityMultiple.toFixed(2)}x</p>
                      <p className="text-sm text-[#2d4a5e]/60 label-text">Equity Multiple</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-white/40 shadow-lg shadow-black/10 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="relative w-14 h-14 flex-shrink-0">
                      <svg className="w-14 h-14" viewBox="0 0 100 100">
                        <defs>
                          <linearGradient id="smallTube3D_coc" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#c4d8c7" />
                            <stop offset="40%" stopColor="#9FBCA4" />
                            <stop offset="100%" stopColor="#7da383" />
                          </linearGradient>
                        </defs>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(45,74,94,0.15)" strokeWidth="6" />
                        <circle
                          cx="50" cy="50" r="40" fill="none" stroke="url(#smallTube3D_coc)" strokeWidth="6"
                          strokeDasharray={`${Math.min(Math.max(cashOnCash, 0) * 12.5, 251)} 251`}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                          style={{ filter: 'drop-shadow(0 0 6px rgba(159,188,164,0.5))' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-[#2d4a5e] font-mono">{cashOnCash.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#9FBCA4] font-mono" data-testid="text-cash-on-cash">{cashOnCash.toFixed(1)}%</p>
                      <p className="text-sm text-[#2d4a5e]/60 label-text">Cash-on-Cash</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-white/40 shadow-lg shadow-black/10 hover:shadow-xl transition-all duration-300">
                  <div className="mb-2">
                    <p className="text-2xl font-bold text-[#2d4a5e] font-mono" data-testid="text-equity-invested">{formatMoney(totalInitialEquity)}</p>
                    <p className="text-sm text-[#2d4a5e]/60 label-text">Equity Invested</p>
                  </div>
                  <div className="h-1.5 bg-[#2d4a5e]/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#9FBCA4] to-[#257D41] rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-white/40 shadow-lg shadow-black/10 hover:shadow-xl transition-all duration-300">
                  <div className="mb-2">
                    <p className="text-2xl font-bold text-[#257D41] font-mono" data-testid="text-exit-value">{formatMoney(totalExitValue)}</p>
                    <p className="text-sm text-[#2d4a5e]/60 label-text">Projected Exit</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#257D41]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span className="text-sm font-medium text-[#257D41] font-mono">+{exitGainPercent}% gain</span>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6">
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
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9FBCA4" stopOpacity={0.6} />
                      <stop offset="60%" stopColor="#9FBCA4" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#9FBCA4" stopOpacity={0.08} />
                    </linearGradient>
                    <linearGradient id="noiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#257D41" stopOpacity={0.65} />
                      <stop offset="60%" stopColor="#257D41" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#257D41" stopOpacity={0.08} />
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
                  <Area type="monotone" dataKey="revenue" stroke="#9FBCA4" strokeWidth={2} fill="url(#revenueGrad)" dot={false} />
                  <Area type="monotone" dataKey="noi" stroke="#257D41" strokeWidth={2.5} fill="url(#noiGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
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
                    { label: "Total Purchase Price", value: formatMoney(totalPurchasePrice) },
                    { label: "Avg Purchase Price", value: formatMoney(avgPurchasePrice) },
                    { label: "Avg Exit Cap Rate", value: `${(avgExitCapRate * 100).toFixed(1)}%`, highlight: true },
                    { label: "Hold Period", value: `${investmentHorizon} Years` },
                    { label: "NOI Margin", value: `${totalProjectionRevenue > 0 ? ((totalProjectionNOI / totalProjectionRevenue) * 100).toFixed(1) : '0.0'}%`, highlight: true },
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
