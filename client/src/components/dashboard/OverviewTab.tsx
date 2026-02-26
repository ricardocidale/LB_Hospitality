import React from "react";
import { AnimatedSection, InsightPanel, ScrollReveal, formatCompact, type Insight } from "@/components/graphics";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { DashboardTabProps } from "./types";
import { formatMoney } from "@/lib/financialEngine";
import { DEFAULT_EXIT_CAP_RATE } from "@/lib/constants";
import { computeIRR } from "@analytics/returns/irr.js";
import { propertyEquityInvested } from "@/lib/equityCalculations";

function calculateIRR(cashFlows: number[]): number {
  const result = computeIRR(cashFlows, 1);
  return result.irr_periodic ?? 0;
}

export function OverviewTab({ financials, properties, projectionYears, getFiscalYear }: DashboardTabProps) {
  const {
    yearlyConsolidatedCache,
    allPropertyYearlyCF,
    portfolioIRR,
    equityMultiple,
    cashOnCash,
    totalInitialEquity,
    totalExitValue,
    totalProjectionRevenue,
    totalProjectionNOI,
    totalProjectionCashFlow
  } = financials;

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

  const insights: Insight[] = [
    { text: "Portfolio IRR", metric: `${(portfolioIRR * 100).toFixed(1)}%`, type: portfolioIRR > 0.12 ? "positive" as const : portfolioIRR > 0.08 ? "neutral" as const : "warning" as const },
    { text: `${totalProperties} properties across ${Object.keys(marketCounts).length} markets`, type: "neutral" as const },
    { text: "Equity Multiple", metric: `${equityMultiple.toFixed(2)}x`, type: equityMultiple > 2 ? "positive" as const : "neutral" as const },
    { text: "Avg Cash-on-Cash Return", metric: `${cashOnCash.toFixed(1)}%`, type: cashOnCash > 8 ? "positive" as const : "warning" as const },
  ];

  return (
    <div className="space-y-6">
      <AnimatedSection>
        <div className="relative">
          <div className="text-center mb-8">
            <p className="text-sm font-medium tracking-widest text-[#2d4a5e]/60 uppercase mb-2 label-text">Investment Performance</p>
            <p className="text-[#2d4a5e]/50 text-sm label-text">
              <span className="font-mono">{investmentHorizon}</span>-Year Hold | <span className="font-mono">{totalProperties}</span> Properties | <span className="font-mono">{totalRooms}</span> Rooms
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 mb-10">
            <div className="relative bg-white/95 backdrop-blur-xl rounded-[2rem] p-8 border border-primary/40 shadow-xl shadow-black/10" data-testid="gauge-portfolio-irr">
              <div className="relative">
                <svg className="w-48 h-48" viewBox="0 0 200 200">
                  <defs>
                    <linearGradient id="irrTube3D" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FFB89A" />
                      <stop offset="40%" stopColor="#F4795B" />
                      <stop offset="100%" stopColor="#E06545" />
                    </linearGradient>
                  </defs>
                  <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(45,74,94,0.1)" strokeWidth="12" />
                  <circle
                    cx="100" cy="100" r="80" fill="none" stroke="url(#irrTube3D)" strokeWidth="12"
                    strokeDasharray={`${Math.min(Math.max(portfolioIRR * 100, 0) * 5.03, 503)} 503`}
                    strokeLinecap="round"
                    transform="rotate(-90 100 100)"
                    style={{ filter: 'drop-shadow(0 0 10px rgba(244,121,91,0.5))' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold text-[#2d4a5e] tracking-tight font-mono" data-testid="text-portfolio-irr">{(portfolioIRR * 100).toFixed(1)}%</span>
                  <span className="text-sm text-[#2d4a5e]/60 font-medium mt-2 label-text">Portfolio IRR</span>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 border border-primary/40 shadow-xl shadow-black/10 w-full lg:min-w-[340px]" data-testid="chart-property-irr-comparison">
              <p className="text-xs font-medium tracking-widest text-[#2d4a5e]/60 uppercase mb-3 text-center label-text">Property IRR Comparison</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={propertyIRRData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,74,94,0.1)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} angle={-25} textAnchor="end" height={50} />
                  <YAxis tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 10, fill: '#6b7280' }} domain={[0, 'auto']} width={45} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'IRR']}
                    labelFormatter={(_label: string, payload: Array<{ payload?: { fullName?: string } }>) => payload?.[0]?.payload?.fullName || _label}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  />
                  <Bar dataKey="irr" radius={[4, 4, 0, 0]} maxBarSize={40} fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 border border-primary/40 shadow-xl shadow-black/10 w-full lg:min-w-[340px]" data-testid="chart-property-investment">
              <p className="text-xs font-medium tracking-widest text-[#2d4a5e]/60 uppercase mb-3 text-center label-text">Equity Investment by Property</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={propertyInvestmentData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,74,94,0.1)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} angle={-25} textAnchor="end" height={50} />
                  <YAxis tickFormatter={(v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: '#6b7280' }} domain={[0, 'auto']} width={55} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Equity Invested']}
                    labelFormatter={(_label: string, payload: Array<{ payload?: { fullName?: string } }>) => payload?.[0]?.payload?.fullName || _label}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  />
                  <Bar dataKey="investment" radius={[4, 4, 0, 0]} maxBarSize={40} fill="#F59E0B" />
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
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="40%" stopColor="#2563EB" />
                        <stop offset="100%" stopColor="#1D4ED8" />
                      </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(45,74,94,0.15)" strokeWidth="6" />
                    <circle
                      cx="50" cy="50" r="40" fill="none" stroke="url(#smallTube3D_eq)" strokeWidth="6"
                      strokeDasharray={`${Math.min(equityMultiple * 63, 251)} 251`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      style={{ filter: 'drop-shadow(0 0 6px rgba(37,99,235,0.5))' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#2d4a5e] font-mono">{equityMultiple.toFixed(1)}x</span>
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#2563EB] font-mono" data-testid="text-equity-multiple">{equityMultiple.toFixed(2)}x</p>
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
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="40%" stopColor="#D97706" />
                        <stop offset="100%" stopColor="#B45309" />
                      </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(45,74,94,0.15)" strokeWidth="6" />
                    <circle
                      cx="50" cy="50" r="40" fill="none" stroke="url(#smallTube3D_coc)" strokeWidth="6"
                      strokeDasharray={`${Math.min(Math.max(cashOnCash, 0) * 12.5, 251)} 251`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      style={{ filter: 'drop-shadow(0 0 6px rgba(217,119,6,0.5))' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#2d4a5e] font-mono">{cashOnCash.toFixed(0)}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#D97706] font-mono" data-testid="text-cash-on-cash">{cashOnCash.toFixed(1)}%</p>
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
                <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-white/40 shadow-lg shadow-black/10 hover:shadow-xl transition-all duration-300">
              <div className="mb-2">
                <p className="text-2xl font-bold text-[#059669] font-mono" data-testid="text-exit-value">{formatMoney(totalExitValue)}</p>
                <p className="text-sm text-[#2d4a5e]/60 label-text">Projected Exit</p>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span className="text-sm font-medium text-[#059669] font-mono">+{totalInitialEquity > 0 ? ((totalExitValue / totalInitialEquity - 1) * 100).toFixed(0) : 0}% gain</span>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <div className="relative overflow-hidden rounded-3xl p-6 border border-primary/30 shadow-2xl">
          <div className="absolute inset-0 bg-primary/25 backdrop-blur-3xl" />
          <div className="absolute inset-0">
            <div className="absolute top-0 right-1/3 w-56 h-56 rounded-full bg-secondary/20 blur-3xl animate-pulse" style={{ animationDuration: '7s' }} />
            <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-primary/30 blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-0 w-40 h-40 rounded-full bg-white/20 blur-2xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          </div>

          <div className="relative grid gap-6 md:grid-cols-2">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-lg shadow-black/10">
              <h3 className="text-lg font-semibold text-[#2d4a5e] mb-4 font-display">Portfolio Composition</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#2d4a5e]/60 label-text">Properties</span>
                  <span className="font-semibold text-[#2d4a5e] font-mono">{totalProperties}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#2d4a5e]/60 label-text">Total Rooms</span>
                  <span className="font-semibold text-[#2d4a5e] font-mono">{totalRooms}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#2d4a5e]/60 label-text">Avg Rooms/Property</span>
                  <span className="font-semibold text-[#2d4a5e] font-mono">{avgRoomsPerProperty.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#2d4a5e]/60 label-text">Markets</span>
                  <span className="font-semibold text-[#2d4a5e] font-mono">{Object.keys(marketCounts).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#2d4a5e]/60 label-text">Avg Daily Rate</span>
                  <span className="font-semibold text-[#2563EB] font-mono">{formatMoney(avgADR)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-lg shadow-black/10">
              <h3 className="text-lg font-semibold text-[#2d4a5e] mb-4 font-display">Capital Structure</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#2d4a5e]/60 label-text">Total Investment</span>
                  <span className="font-semibold text-[#2d4a5e] font-mono">{formatMoney(totalInvestment)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#2d4a5e]/60 label-text">Avg Purchase Price</span>
                  <span className="font-semibold text-[#2d4a5e] font-mono">{formatMoney(avgPurchasePrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#2d4a5e]/60 label-text">Avg Exit Cap Rate</span>
                  <span className="font-semibold text-[#D97706] font-mono">{(avgExitCapRate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#2d4a5e]/60 label-text">Hold Period</span>
                  <span className="font-semibold text-[#2d4a5e] font-mono">{investmentHorizon} Years</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#2d4a5e]/60 label-text">Projected Exit Value</span>
                  <span className="font-semibold text-[#059669] font-mono">{formatMoney(totalExitValue)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 border border-white/40 text-center">
              <p className="text-xs text-[#2d4a5e]/60 label-text mb-1">10-Year Revenue</p>
              <p className="text-xl font-bold text-[#2d4a5e] font-mono">{formatCompact(totalProjectionRevenue)}</p>
            </div>
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 border border-white/40 text-center">
              <p className="text-xs text-[#2d4a5e]/60 label-text mb-1">10-Year NOI</p>
              <p className="text-xl font-bold text-[#2d4a5e] font-mono">{formatCompact(totalProjectionNOI)}</p>
            </div>
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 border border-white/40 text-center">
              <p className="text-xs text-[#2d4a5e]/60 label-text mb-1">10-Year Cash Flow</p>
              <p className="text-xl font-bold text-[#2d4a5e] font-mono">{formatCompact(totalProjectionCashFlow)}</p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <ScrollReveal>
        <InsightPanel
          data-testid="insight-dashboard"
          title="Portfolio Insights"
          insights={insights}
        />
      </ScrollReveal>
    </div>
  );
}
