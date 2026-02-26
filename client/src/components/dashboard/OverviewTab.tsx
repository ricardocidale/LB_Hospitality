import { AnimatedSection, InsightPanel, ScrollReveal, formatCompact, type Insight } from "@/components/graphics";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { motion } from "framer-motion";
import { DashboardTabProps } from "./types";
import { formatMoney } from "@/lib/financialEngine";
import { DEFAULT_EXIT_CAP_RATE } from "@/lib/constants";
import { computeIRR } from "@analytics/returns/irr.js";
import { propertyEquityInvested } from "@/lib/equityCalculations";
import { AnimatedCounter } from "@/components/ui/animated";
import { IceGlassOrb } from "./IceGlassOrb";

function calculateIRR(cashFlows: number[]): number {
  const result = computeIRR(cashFlows, 1);
  return result.irr_periodic ?? 0;
}

const iceCardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const IRR_COLORS = ["#3B82F6", "#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981"];

function IceCard({ children, className, delay = 0, testId }: { children: React.ReactNode; className?: string; delay?: number; testId?: string }) {
  return (
    <motion.div
      variants={iceCardVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      whileHover={{
        y: -6,
        scale: 1.02,
        transition: { duration: 0.25 },
      }}
      className={`
        relative overflow-hidden rounded-2xl p-5
        bg-gradient-to-br from-white/90 via-white/80 to-sky-50/60
        backdrop-blur-2xl
        border border-white/60
        shadow-[0_8px_32px_rgba(147,197,253,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]
        hover:shadow-[0_16px_48px_rgba(147,197,253,0.25),inset_0_1px_0_rgba(255,255,255,0.9)]
        transition-shadow duration-500
        cursor-default
        ${className || ""}
      `}
      data-testid={testId}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100/20 via-transparent to-blue-50/10 pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-white/40 to-transparent blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-200/40 to-transparent" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

export function OverviewTab({ financials, properties, projectionYears }: DashboardTabProps) {
  const {
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
  const avgPurchasePrice = totalProperties > 0 ? totalPurchasePrice / totalProperties : 0;
  const avgRoomsPerProperty = totalProperties > 0 ? totalRooms / totalProperties : 0;
  const avgADR = totalRooms > 0
    ? properties.reduce((sum, p) => sum + p.startAdr * p.roomCount, 0) / totalRooms
    : 0;
  const avgExitCapRate = totalProperties > 0 ? properties.reduce((sum, p) => sum + (p.exitCapRate ?? DEFAULT_EXIT_CAP_RATE), 0) / totalProperties : 0;
  const investmentHorizon = projectionYears;
  const irrPct = portfolioIRR * 100;

  const marketCounts = properties.reduce((acc, p) => {
    acc[p.market] = (acc[p.market] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const propertyIRRData = properties.map((prop, idx) => {
    const cashFlows = Array.from({ length: projectionYears }, (_, y) => allPropertyYearlyCF[idx]?.[y]?.netCashFlowToInvestors ?? 0);
    const irr = calculateIRR(cashFlows);
    return {
      name: prop.name.length > 15 ? prop.name.substring(0, 13) + "\u2026" : prop.name,
      fullName: prop.name,
      irr: parseFloat((irr * 100).toFixed(1)),
    };
  });

  const propertyInvestmentData = properties.map((prop) => ({
    name: prop.name.length > 15 ? prop.name.substring(0, 13) + "\u2026" : prop.name,
    fullName: prop.name,
    investment: Math.round(propertyEquityInvested(prop)),
  }));

  const insights: Insight[] = [
    { text: "Portfolio IRR", metric: `${irrPct.toFixed(1)}%`, type: irrPct > 12 ? "positive" : irrPct > 8 ? "neutral" : "warning" },
    { text: `${totalProperties} properties across ${Object.keys(marketCounts).length} markets`, type: "neutral" },
    { text: "Equity Multiple", metric: `${equityMultiple.toFixed(2)}x`, type: equityMultiple > 2 ? "positive" : "neutral" },
    { text: "Avg Cash-on-Cash Return", metric: `${cashOnCash.toFixed(1)}%`, type: cashOnCash > 8 ? "positive" : "warning" },
  ];

  return (
    <div className="space-y-8">
      <AnimatedSection>
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <p className="text-sm font-medium tracking-[0.2em] text-[#2d4a5e]/50 uppercase mb-2 label-text">Investment Performance</p>
            <p className="text-[#2d4a5e]/40 text-sm label-text">
              <span className="font-mono">{investmentHorizon}</span>-Year Hold &middot; <span className="font-mono">{totalProperties}</span> Properties &middot; <span className="font-mono">{totalRooms}</span> Rooms
            </p>
          </motion.div>

          <div className="flex flex-col xl:flex-row items-center justify-center gap-8 mb-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative"
              data-testid="gauge-portfolio-irr"
            >
              <div className="relative bg-gradient-to-br from-white/95 via-sky-50/80 to-blue-50/60 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/70 shadow-[0_20px_60px_rgba(147,197,253,0.2),inset_0_2px_0_rgba(255,255,255,0.9)]">
                <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-white/30 to-transparent pointer-events-none" style={{ height: '50%' }} />
                <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-sky-200/20 blur-3xl" />
                <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-blue-200/15 blur-2xl" />

                <div className="relative flex flex-col items-center">
                  <IceGlassOrb irrPercent={irrPct} />
                  <div className="mt-2 text-center">
                    <span className="text-5xl font-bold text-[#2d4a5e] tracking-tight font-mono" data-testid="text-portfolio-irr">
                      <AnimatedCounter value={irrPct} duration={1.5} format={(n: number) => `${n.toFixed(1)}%`} />
                    </span>
                    <p className="text-sm text-[#2d4a5e]/50 font-medium mt-1 label-text tracking-wide">Portfolio IRR</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative bg-gradient-to-br from-white/95 via-sky-50/80 to-blue-50/60 backdrop-blur-2xl rounded-[2rem] p-6 border border-white/70 shadow-[0_12px_40px_rgba(147,197,253,0.15),inset_0_1px_0_rgba(255,255,255,0.8)] w-full xl:min-w-[360px]"
              data-testid="chart-property-irr-comparison"
            >
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" style={{ height: '40%' }} />
              <p className="relative text-xs font-medium tracking-[0.15em] text-[#2d4a5e]/50 uppercase mb-4 text-center label-text">Property IRR Comparison</p>
              <div className="relative">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={propertyIRRData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(147,197,253,0.15)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} angle={-25} textAnchor="end" height={50} />
                    <YAxis tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 10, fill: '#94A3B8' }} domain={[0, 'auto']} width={45} />
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'IRR']}
                      labelFormatter={(_l: string, p: Array<{ payload?: { fullName?: string } }>) => p?.[0]?.payload?.fullName || _l}
                      contentStyle={{ borderRadius: 12, border: '1px solid rgba(147,197,253,0.3)', fontSize: 12, backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.9)' }}
                    />
                    <Bar dataKey="irr" radius={[6, 6, 0, 0]} maxBarSize={36}>
                      {propertyIRRData.map((_, i) => (
                        <Cell key={i} fill={IRR_COLORS[i % IRR_COLORS.length]} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="relative bg-gradient-to-br from-white/95 via-sky-50/80 to-blue-50/60 backdrop-blur-2xl rounded-[2rem] p-6 border border-white/70 shadow-[0_12px_40px_rgba(147,197,253,0.15),inset_0_1px_0_rgba(255,255,255,0.8)] w-full xl:min-w-[360px]"
              data-testid="chart-property-investment"
            >
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" style={{ height: '40%' }} />
              <p className="relative text-xs font-medium tracking-[0.15em] text-[#2d4a5e]/50 uppercase mb-4 text-center label-text">Equity Investment by Property</p>
              <div className="relative">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={propertyInvestmentData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(147,197,253,0.15)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} angle={-25} textAnchor="end" height={50} />
                    <YAxis tickFormatter={(v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: '#94A3B8' }} domain={[0, 'auto']} width={55} />
                    <Tooltip
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Equity Invested']}
                      labelFormatter={(_l: string, p: Array<{ payload?: { fullName?: string } }>) => p?.[0]?.payload?.fullName || _l}
                      contentStyle={{ borderRadius: 12, border: '1px solid rgba(147,197,253,0.3)', fontSize: 12, backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.9)' }}
                    />
                    <Bar dataKey="investment" radius={[6, 6, 0, 0]} maxBarSize={36}>
                      {propertyInvestmentData.map((_, i) => (
                        <Cell key={i} fill={IRR_COLORS[(i + 3) % IRR_COLORS.length]} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid gap-4 grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto"
          >
            <IceCard delay={0.3} testId="card-equity-multiple">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 flex-shrink-0">
                  <svg className="w-14 h-14" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="ice_eq" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60A5FA" />
                        <stop offset="50%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#2563EB" />
                      </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(147,197,253,0.2)" strokeWidth="5" />
                    <motion.circle
                      cx="50" cy="50" r="40" fill="none" stroke="url(#ice_eq)" strokeWidth="5"
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      initial={{ strokeDasharray: "0 251" }}
                      animate={{ strokeDasharray: `${Math.min(equityMultiple * 63, 251)} 251` }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                      style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.4))' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#2d4a5e] font-mono">
                      <AnimatedCounter value={equityMultiple} duration={1.5} format={(n: number) => `${n.toFixed(1)}x`} />
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#2563EB] font-mono" data-testid="text-equity-multiple">
                    <AnimatedCounter value={equityMultiple} duration={1.5} format={(n: number) => `${n.toFixed(2)}x`} />
                  </p>
                  <p className="text-sm text-[#2d4a5e]/50 label-text">Equity Multiple</p>
                </div>
              </div>
            </IceCard>

            <IceCard delay={0.4} testId="card-cash-on-cash">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 flex-shrink-0">
                  <svg className="w-14 h-14" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="ice_coc" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FBBF24" />
                        <stop offset="50%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#D97706" />
                      </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(251,191,36,0.15)" strokeWidth="5" />
                    <motion.circle
                      cx="50" cy="50" r="40" fill="none" stroke="url(#ice_coc)" strokeWidth="5"
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      initial={{ strokeDasharray: "0 251" }}
                      animate={{ strokeDasharray: `${Math.min(Math.max(cashOnCash, 0) * 12.5, 251)} 251` }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
                      style={{ filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.4))' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#2d4a5e] font-mono">
                      <AnimatedCounter value={cashOnCash} duration={1.5} format={(n: number) => `${n.toFixed(0)}%`} />
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#D97706] font-mono" data-testid="text-cash-on-cash">
                    <AnimatedCounter value={cashOnCash} duration={1.5} format={(n: number) => `${n.toFixed(1)}%`} />
                  </p>
                  <p className="text-sm text-[#2d4a5e]/50 label-text">Cash-on-Cash</p>
                </div>
              </div>
            </IceCard>

            <IceCard delay={0.5} testId="card-equity-invested">
              <div className="mb-2">
                <p className="text-2xl font-bold text-[#2d4a5e] font-mono" data-testid="text-equity-invested">
                  <AnimatedCounter value={totalInitialEquity} duration={1.8} format={(n: number) => formatMoney(n)} />
                </p>
                <p className="text-sm text-[#2d4a5e]/50 label-text">Equity Invested</p>
              </div>
              <div className="h-1.5 bg-sky-100/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.7 }}
                />
              </div>
            </IceCard>

            <IceCard delay={0.6} testId="card-projected-exit">
              <div className="mb-2">
                <p className="text-2xl font-bold text-[#059669] font-mono" data-testid="text-exit-value">
                  <AnimatedCounter value={totalExitValue} duration={1.8} format={(n: number) => formatMoney(n)} />
                </p>
                <p className="text-sm text-[#2d4a5e]/50 label-text">Projected Exit</p>
              </div>
              <div className="flex items-center gap-1.5">
                <motion.div
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1 }}
                >
                  <svg className="w-4 h-4 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </motion.div>
                <span className="text-sm font-medium text-[#059669] font-mono">
                  +<AnimatedCounter
                    value={totalInitialEquity > 0 ? (totalExitValue / totalInitialEquity - 1) * 100 : 0}
                    duration={1.8}
                    format={(n: number) => `${n.toFixed(0)}%`}
                  /> gain
                </span>
              </div>
            </IceCard>
          </motion.div>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.3}>
        <div className="relative overflow-hidden rounded-3xl p-6 border border-sky-200/30 shadow-[0_20px_60px_rgba(147,197,253,0.12)]">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50/40 via-white/60 to-blue-50/30 backdrop-blur-3xl" />
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-1/4 w-64 h-64 rounded-full bg-sky-200/15 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full bg-blue-200/15 blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
            <div className="absolute top-1/2 right-0 w-40 h-40 rounded-full bg-indigo-100/10 blur-2xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
          </div>

          <div className="relative grid gap-6 md:grid-cols-2">
            <IceCard delay={0.4} className="!rounded-2xl">
              <h3 className="text-lg font-semibold text-[#2d4a5e] mb-4 font-display">Portfolio Composition</h3>
              <div className="space-y-3.5">
                {[
                  { label: "Properties", value: `${totalProperties}` },
                  { label: "Total Rooms", value: `${totalRooms}` },
                  { label: "Avg Rooms/Property", value: avgRoomsPerProperty.toFixed(0) },
                  { label: "Markets", value: `${Object.keys(marketCounts).length}` },
                  { label: "Avg Daily Rate", value: formatMoney(avgADR), color: "#2563EB" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center group">
                    <span className="text-sm text-[#2d4a5e]/50 label-text group-hover:text-[#2d4a5e]/70 transition-colors">{row.label}</span>
                    <span className={`font-semibold font-mono ${row.color ? `text-[${row.color}]` : 'text-[#2d4a5e]'}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </IceCard>

            <IceCard delay={0.5} className="!rounded-2xl">
              <h3 className="text-lg font-semibold text-[#2d4a5e] mb-4 font-display">Capital Structure</h3>
              <div className="space-y-3.5">
                {[
                  { label: "Total Investment", value: formatMoney(totalPurchasePrice) },
                  { label: "Avg Purchase Price", value: formatMoney(avgPurchasePrice) },
                  { label: "Avg Exit Cap Rate", value: `${(avgExitCapRate * 100).toFixed(1)}%`, color: "#D97706" },
                  { label: "Hold Period", value: `${investmentHorizon} Years` },
                  { label: "Projected Exit Value", value: formatMoney(totalExitValue), color: "#059669" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center group">
                    <span className="text-sm text-[#2d4a5e]/50 label-text group-hover:text-[#2d4a5e]/70 transition-colors">{row.label}</span>
                    <span className={`font-semibold font-mono ${row.color ? `text-[${row.color}]` : 'text-[#2d4a5e]'}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </IceCard>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="relative grid grid-cols-3 gap-4 mt-6"
          >
            {[
              { label: `${investmentHorizon}-Year Revenue`, value: totalProjectionRevenue },
              { label: `${investmentHorizon}-Year NOI`, value: totalProjectionNOI },
              { label: `${investmentHorizon}-Year Cash Flow`, value: totalProjectionCashFlow },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                variants={iceCardVariants}
                className="relative overflow-hidden bg-gradient-to-br from-white/90 via-white/80 to-sky-50/60 backdrop-blur-2xl rounded-2xl p-4 border border-white/60 shadow-[0_4px_16px_rgba(147,197,253,0.1),inset_0_1px_0_rgba(255,255,255,0.7)] text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" style={{ height: '50%' }} />
                <p className="relative text-xs text-[#2d4a5e]/50 label-text mb-1">{item.label}</p>
                <p className="relative text-xl font-bold text-[#2d4a5e] font-mono">
                  <AnimatedCounter value={item.value} duration={2} format={(n: number) => formatCompact(n)} />
                </p>
              </motion.div>
            ))}
          </motion.div>
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
