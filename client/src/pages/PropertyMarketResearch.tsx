import { useState } from "react";
import { AnimatedPage } from "@/components/graphics/motion/AnimatedPage";
import Layout from "@/components/Layout";
import { useProperty, useMarketResearch, useGlobalAssumptions } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ExportToolbar } from "@/components/ui/export-toolbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import {
  IconRefreshCw, IconMapPin, IconBookOpen,
  IconMail, IconFileDown, IconTrendingUp, IconDollarSign,
  IconBarChart3, IconPieChart, IconTarget,
} from "@/components/icons";
import { useRoute } from "wouter";
import { downloadResearchPDF, emailResearchPDF } from "@/lib/exports/researchPdfExport";
import { useToast } from "@/hooks/use-toast";
import { useResearchStream } from "@/components/property-research/useResearchStream";
import { ResearchFreshnessBadge } from "@/components/research/ResearchFreshnessBadge";
import { ResearchCriteriaTab } from "@/components/research/ResearchCriteriaTab";
import { MarketRateBenchmark } from "@/components/property-research/MarketRateBenchmark";
import { ProvenanceBadge } from "@/components/property-research/ProvenanceBadge";
import { SourceCitations } from "@/components/property-research/SourceCitations";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

// ---------------------------------------------------------------------------
// Chart palette & shared helpers
// ---------------------------------------------------------------------------
const COLORS = [
  "hsl(var(--primary))",
  "hsl(160, 60%, 45%)",
  "hsl(220, 70%, 55%)",
  "hsl(35, 90%, 55%)",
  "hsl(280, 55%, 55%)",
  "hsl(0, 65%, 55%)",
];

const card = "bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-primary/10 rounded-2xl shadow-lg";
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-xl border border-primary/15 shadow-xl px-4 py-2.5 text-xs">
      {label && <p className="font-display font-semibold mb-1 text-foreground">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold">{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</span>
        </p>
      ))}
    </div>
  );
}

function MetricCard({ label, value, sub, delay = 0 }: { label: string; value: string | number; sub?: string; delay?: number }) {
  return (
    <motion.div variants={fadeUp} custom={delay} className={`${card} p-5`}>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-display font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </motion.div>
  );
}

function EmptySection({ message = "Generate research to see this section" }: { message?: string }) {
  return (
    <div className={`${card} p-12 text-center`}>
      <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
        <IconBookOpen className="w-7 h-7 text-primary/60" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// SVG semicircle gauge
function CapRateGauge({ value, min, max }: { value: number; min: number; max: number }) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const angle = -180 + pct * 180;
  const r = 80;
  const cx = 100;
  const cy = 95;
  const rad = (angle * Math.PI) / 180;
  const nx = cx + r * Math.cos(rad);
  const ny = cy + r * Math.sin(rad);
  return (
    <svg viewBox="0 0 200 120" className="w-full max-w-[260px] mx-auto">
      <path d="M 20 95 A 80 80 0 0 1 180 95" fill="none" stroke="hsl(var(--primary)/0.15)" strokeWidth="14" strokeLinecap="round" />
      <path d="M 20 95 A 80 80 0 0 1 180 95" fill="none" stroke="url(#gaugeGrad)" strokeWidth="14" strokeLinecap="round"
        strokeDasharray={`${pct * 251} 251`} />
      <circle cx={nx} cy={ny} r="7" fill="hsl(var(--primary))" stroke="white" strokeWidth="3" />
      <text x="100" y="88" textAnchor="middle" className="fill-foreground font-display text-2xl font-bold">{value.toFixed(1)}%</text>
      <text x="20" y="115" textAnchor="middle" className="fill-muted-foreground text-[10px]">{min}%</text>
      <text x="180" y="115" textAnchor="middle" className="fill-muted-foreground text-[10px]">{max}%</text>
      <defs>
        <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(160, 60%, 45%)" />
          <stop offset="100%" stopColor="hsl(var(--primary))" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Tab content components
// ---------------------------------------------------------------------------
function MarketTab({ content }: { content: any }) {
  const mo = content?.marketOverview;
  const cs = content?.competitiveSet;
  if (!mo && !cs) return <EmptySection />;

  const compRadar = cs?.competitors?.slice(0, 6).map((c: any) => ({
    subject: c.name?.slice(0, 14) || "Comp",
    ADR: c.adr ?? 0, Occupancy: c.occupancy ?? 0, RevPAR: c.revpar ?? 0,
    Rooms: c.roomCount ?? 0, Quality: c.quality ?? 50, Reviews: c.reviewScore ?? 50,
  })) || [];

  const supplyData = mo?.supplyPipeline?.map((s: any, i: number) => ({
    name: s.name || `Pipeline ${i + 1}`, rooms: s.rooms ?? s.units ?? 0, status: s.status || "Planned",
  })) || [];

  const drivers = mo?.demandDrivers?.slice(0, 5) || [];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <MarketRateBenchmark compact applicableRates={[]} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comp set radar */}
        <motion.div variants={fadeUp} className={`${card} p-6`}>
          <h3 className="font-display text-lg font-semibold mb-4">Competitive Set Radar</h3>
          {compRadar.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={compRadar}>
                <PolarGrid stroke="hsl(var(--primary)/0.15)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <Radar name="ADR" dataKey="ADR" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.2} />
                <Radar name="Occupancy" dataKey="Occupancy" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.15} />
                <Tooltip content={<ChartTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground">No competitive set data available.</p>}
        </motion.div>

        {/* Supply pipeline */}
        <motion.div variants={fadeUp} className={`${card} p-6`}>
          <h3 className="font-display text-lg font-semibold mb-4">Supply Pipeline</h3>
          {supplyData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={supplyData} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary)/0.08)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={55} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="rooms" fill={COLORS[2]} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground">No supply pipeline data.</p>}
        </motion.div>
      </div>

      {/* Demand drivers */}
      {drivers.length > 0 && (
        <motion.div variants={fadeUp}>
          <h3 className="font-display text-lg font-semibold mb-3">Demand Drivers</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {drivers.map((d: any, i: number) => (
              <motion.div key={i} variants={fadeUp} className={`${card} p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${COLORS[i % COLORS.length]}22` }}>
                    <IconTarget className="w-4 h-4" style={{ color: COLORS[i % COLORS.length] }} />
                  </div>
                  <p className="text-sm font-semibold truncate">{d.name || d.driver || `Driver ${i + 1}`}</p>
                </div>
                {d.distance && <p className="text-xs text-muted-foreground">{d.distance}</p>}
                {(d.impact || d.impactScore) && (
                  <div className="mt-2 h-1.5 rounded-full bg-primary/10 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(d.impact ?? d.impactScore ?? 50)}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {mo?.positioning && (
        <motion.div variants={fadeUp} className={`${card} p-6`}>
          <h3 className="font-display text-lg font-semibold mb-2">Market Positioning</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{mo.positioning}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

function BenchmarkBanner({ content, metrics }: { content: any; metrics: { key: string; label: string; format: (v: number) => string }[] }) {
  const mi = content?._marketIntelligence;
  const benchmarks = mi?.benchmarks;

  const items = metrics.map((m) => {
    const apiVal = benchmarks?.[m.key];
    if (apiVal) {
      return { label: m.label, value: m.format(apiVal.value), provenance: "verified" as const, source: apiVal.source };
    }
    const llmVal = m.key === "adr" ? content?.adrAnalysis?.recommendedAdr
      : m.key === "occupancy" ? (content?.occupancyAnalysis?.stabilizedOccupancy ? content.occupancyAnalysis.stabilizedOccupancy / 100 : null)
      : m.key === "revpar" ? content?.adrAnalysis?.revpar
      : m.key === "capRate" ? (content?.capRateAnalysis?.recommendedCapRate ?? content?.capRateAnalysis?.capRate)
      : null;
    if (llmVal != null) {
      return { label: m.label, value: m.format(llmVal), provenance: "estimated" as const, source: "AI estimate" };
    }
    return null;
  }).filter(Boolean) as { label: string; value: string; provenance: "verified" | "estimated"; source: string }[];

  if (items.length === 0) return null;

  return (
    <motion.div variants={fadeUp} data-testid="benchmark-banner" className={`${card} p-4 mb-4`}>
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Market Benchmarks</h4>
        {items.some(i => i.provenance === "verified") && <ProvenanceBadge provenance="verified" />}
        {items.every(i => i.provenance === "estimated") && <ProvenanceBadge provenance="estimated" />}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item) => (
          <div key={item.label} data-testid={`benchmark-${item.label.toLowerCase().replace(/\s+/g, "-")}`} className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-display font-bold text-foreground">{item.value}</span>
              <ProvenanceBadge provenance={item.provenance} className="scale-75" />
            </div>
            <span className="text-[10px] text-muted-foreground">{item.label}</span>
            <span className="text-[9px] text-muted-foreground/70">{item.source}</span>
          </div>
        ))}
      </div>
      {items.every(i => i.provenance === "estimated") && (
        <p className="text-[10px] text-muted-foreground mt-2 italic" data-testid="benchmark-estimated-note">
          These benchmarks are AI estimates. Connect CoStar, STR, or AirDNA for verified market data.
        </p>
      )}
    </motion.div>
  );
}

function RevenueTab({ content }: { content: any }) {
  const adr = content?.adrAnalysis;
  const occ = content?.occupancyAnalysis;
  const cat = content?.cateringAnalysis;
  if (!adr && !occ && !cat) return <EmptySection />;

  const adrProj = adr?.projections?.map((p: any, i: number) => ({
    year: p.year || `Y${i + 1}`, base: p.base ?? p.adr ?? 0,
    upside: p.upside ?? (p.base ?? p.adr ?? 0) * 1.1,
    downside: p.downside ?? (p.base ?? p.adr ?? 0) * 0.9,
  })) || (adr?.recommendedAdr ? [
    { year: "Y1", base: adr.recommendedAdr, upside: adr.recommendedAdr * 1.08, downside: adr.recommendedAdr * 0.92 },
    { year: "Y2", base: adr.recommendedAdr * 1.03, upside: adr.recommendedAdr * 1.12, downside: adr.recommendedAdr * 0.94 },
    { year: "Y3", base: adr.recommendedAdr * 1.06, upside: adr.recommendedAdr * 1.16, downside: adr.recommendedAdr * 0.95 },
  ] : []);

  const occRamp = occ?.ramp?.map((r: any, i: number) => ({
    month: r.month || r.label || `M${i + 1}`, occupancy: r.occupancy ?? r.value ?? 0,
  })) || (occ?.stabilizedOccupancy ? [
    { month: "M1", occupancy: (occ.stabilizedOccupancy * 0.4) },
    { month: "M6", occupancy: (occ.stabilizedOccupancy * 0.7) },
    { month: "M12", occupancy: (occ.stabilizedOccupancy * 0.9) },
    { month: "M18", occupancy: occ.stabilizedOccupancy },
  ] : []);

  const mixData = [];
  if (adr?.recommendedAdr) mixData.push({ name: "Rooms", value: 65 });
  if (cat?.foodAndBevRevenue || cat?.cateringRevenue) mixData.push({ name: "F&B", value: 20 });
  if (content?.eventDemand) mixData.push({ name: "Events", value: 10 });
  if (mixData.length) mixData.push({ name: "Other", value: 100 - mixData.reduce((s, d) => s + d.value, 0) });

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <BenchmarkBanner
        content={content}
        metrics={[
          { key: "adr", label: "ADR", format: (v) => `$${Math.round(v)}` },
          { key: "revpar", label: "RevPAR", format: (v) => `$${Math.round(v)}` },
          { key: "occupancy", label: "Occupancy", format: (v) => `${(v * 100).toFixed(1)}%` },
        ]}
      />

      <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {adr?.recommendedAdr && <MetricCard label="Recommended ADR" value={`$${Math.round(adr.recommendedAdr)}`} sub={adr.confidence ? `${adr.confidence}% confidence` : undefined} />}
        {occ?.stabilizedOccupancy && <MetricCard label="Stabilized Occupancy" value={`${Math.round(occ.stabilizedOccupancy)}%`} />}
        {adr?.revpar && <MetricCard label="RevPAR" value={`$${Math.round(adr.revpar)}`} />}
        {cat?.cateringRevenue && <MetricCard label="Catering Revenue" value={`$${Math.round(cat.cateringRevenue / 1000)}K`} />}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ADR projection */}
        <motion.div variants={fadeUp} className={`${card} p-6`}>
          <h3 className="font-display text-lg font-semibold mb-4">ADR Projection</h3>
          {adrProj.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={adrProj}>
                <defs>
                  <linearGradient id="adrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS[0]} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={COLORS[0]} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary)/0.08)" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="upside" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.08} strokeDasharray="4 2" name="Upside" />
                <Area type="monotone" dataKey="base" stroke={COLORS[0]} fill="url(#adrGrad)" strokeWidth={2} name="Base" />
                <Area type="monotone" dataKey="downside" stroke={COLORS[5]} fill={COLORS[5]} fillOpacity={0.06} strokeDasharray="4 2" name="Downside" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground">No ADR projection data.</p>}
        </motion.div>

        {/* Occupancy ramp */}
        <motion.div variants={fadeUp} className={`${card} p-6`}>
          <h3 className="font-display text-lg font-semibold mb-4">Occupancy Ramp</h3>
          {occRamp.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={occRamp}>
                <defs>
                  <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS[1]} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={COLORS[1]} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary)/0.08)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="stepAfter" dataKey="occupancy" stroke={COLORS[1]} fill="url(#occGrad)" strokeWidth={2} name="Occupancy %" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground">No occupancy ramp data.</p>}
        </motion.div>
      </div>

      {/* Revenue mix donut */}
      {mixData.length > 0 && (
        <motion.div variants={fadeUp} className={`${card} p-6`}>
          <h3 className="font-display text-lg font-semibold mb-4">Revenue Mix</h3>
          <div className="flex items-center justify-center gap-8">
            <ResponsiveContainer width={220} height={220}>
              <PieChart>
                <Pie data={mixData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3} strokeWidth={0}>
                  {mixData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {mixData.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-semibold">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function FinancialTab({ content }: { content: any }) {
  const cap = content?.capRateAnalysis;
  const land = content?.landValueAllocation;
  if (!cap && !land) return <EmptySection />;

  const capValue = cap?.recommendedCapRate ?? cap?.capRate ?? 7.5;
  const capMin = cap?.marketRange?.low ?? cap?.rangeMin ?? capValue - 2;
  const capMax = cap?.marketRange?.high ?? cap?.rangeMax ?? capValue + 2;

  // Sensitivity tornado
  const sensFactors = [
    { factor: "Cap Rate +50bp", impact: -(cap?.sensitivity?.capRateUp ?? 8) },
    { factor: "Cap Rate -50bp", impact: cap?.sensitivity?.capRateDown ?? 10 },
    { factor: "ADR +5%", impact: cap?.sensitivity?.adrUp ?? 6 },
    { factor: "ADR -5%", impact: -(cap?.sensitivity?.adrDown ?? 5) },
    { factor: "Occupancy +3%", impact: cap?.sensitivity?.occUp ?? 4 },
    { factor: "Occupancy -3%", impact: -(cap?.sensitivity?.occDown ?? 3) },
  ];

  // Exit scenarios
  const holds = [5, 7];
  const exitCaps = [capValue - 0.5, capValue, capValue + 0.5];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <BenchmarkBanner
        content={content}
        metrics={[
          { key: "capRate", label: "Cap Rate", format: (v) => `${v.toFixed(1)}%` },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cap rate gauge */}
        <motion.div variants={fadeUp} className={`${card} p-6 flex flex-col items-center`}>
          <h3 className="font-display text-lg font-semibold mb-4 self-start">Cap Rate</h3>
          <CapRateGauge value={capValue} min={capMin} max={capMax} />
          <p className="text-xs text-muted-foreground mt-2">Market range: {capMin.toFixed(1)}% – {capMax.toFixed(1)}%</p>
        </motion.div>

        {/* Debt capacity cards */}
        <motion.div variants={fadeUp} className="lg:col-span-2 grid grid-cols-3 gap-4">
          <MetricCard label="LTV" value={`${cap?.ltv ?? land?.ltv ?? 65}%`} sub="Loan-to-Value" />
          <MetricCard label="DSCR" value={`${(cap?.dscr ?? land?.dscr ?? 1.35).toFixed(2)}x`} sub="Debt Service Coverage" />
          <MetricCard label="Debt Yield" value={`${(cap?.debtYield ?? 9.5).toFixed(1)}%`} sub="NOI / Loan Amount" />
        </motion.div>
      </div>

      {/* IRR sensitivity tornado */}
      <motion.div variants={fadeUp} className={`${card} p-6`}>
        <h3 className="font-display text-lg font-semibold mb-4">IRR Sensitivity</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={sensFactors} layout="vertical" margin={{ left: 90 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary)/0.08)" />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}%`} />
            <YAxis dataKey="factor" type="category" tick={{ fontSize: 11 }} width={85} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="impact" radius={[4, 4, 4, 4]} name="IRR Impact %">
              {sensFactors.map((d, i) => (
                <Cell key={i} fill={d.impact >= 0 ? COLORS[1] : COLORS[5]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Exit scenario table */}
      <motion.div variants={fadeUp} className={`${card} p-6 overflow-x-auto`}>
        <h3 className="font-display text-lg font-semibold mb-4">Exit Scenarios</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-primary/10">
              <th className="text-left py-2 text-muted-foreground font-medium">Exit Cap Rate</th>
              {holds.map((h) => <th key={h} className="text-right py-2 text-muted-foreground font-medium">{h}-Year Hold</th>)}
            </tr>
          </thead>
          <tbody>
            {exitCaps.map((ec) => (
              <tr key={ec} className="border-b border-primary/5">
                <td className="py-2.5 font-medium">{ec.toFixed(1)}%</td>
                {holds.map((h) => {
                  const mult = (1 + (capValue / 100)) ** h / (ec / 100) * (capValue / 100);
                  return <td key={h} className="text-right py-2.5 font-mono">{mult.toFixed(2)}x</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
}

function OperatingTab({ content }: { content: any }) {
  const ops = content?.operatingCosts;
  const pv = content?.propertyValueCosts;
  if (!ops && !pv) return <EmptySection />;

  // USALI department breakdown
  const depts = ops?.departments?.map((d: any) => ({
    name: d.name || d.department, labor: d.labor ?? 0, other: d.other ?? d.expenses ?? 0,
  })) || (ops ? [
    { name: "Rooms", labor: ops.roomsLabor ?? 25, other: ops.roomsOther ?? 10 },
    { name: "F&B", labor: ops.fbLabor ?? 18, other: ops.fbOther ?? 12 },
    { name: "Admin", labor: ops.adminLabor ?? 10, other: ops.adminOther ?? 8 },
    { name: "Maint.", labor: ops.maintLabor ?? 6, other: ops.maintOther ?? 5 },
    { name: "Marketing", labor: ops.mktLabor ?? 3, other: ops.mktOther ?? 4 },
  ] : []);

  // Cost composition donut
  const costPie = [];
  if (ops?.laborPct || ops?.totalLabor) costPie.push({ name: "Labor", value: ops.laborPct ?? 45 });
  if (ops?.utilitiesPct || ops?.utilities) costPie.push({ name: "Utilities", value: ops.utilitiesPct ?? 8 });
  if (pv?.insurance) costPie.push({ name: "Insurance", value: pv.insurancePct ?? 5 });
  if (pv?.propertyTax) costPie.push({ name: "Property Tax", value: pv.propertyTaxPct ?? 7 });
  if (costPie.length) costPie.push({ name: "Other", value: Math.max(5, 100 - costPie.reduce((s, d) => s + d.value, 0)) });

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* Metric cards */}
      <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ops?.costPerRoom && <MetricCard label="Cost per Room" value={`$${Math.round(ops.costPerRoom).toLocaleString()}`} />}
        {ops?.laborPerKey && <MetricCard label="Labor per Key" value={`$${Math.round(ops.laborPerKey).toLocaleString()}`} />}
        {pv?.insurance && <MetricCard label="Insurance" value={`$${Math.round(pv.insurance).toLocaleString()}`} sub="Annual premium" />}
        {pv?.propertyTax && <MetricCard label="Property Tax" value={`$${Math.round(pv.propertyTax).toLocaleString()}`} sub="Annual" />}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* USALI stacked bar */}
        <motion.div variants={fadeUp} className={`${card} p-6`}>
          <h3 className="font-display text-lg font-semibold mb-4">USALI Department Costs</h3>
          {depts.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={depts} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary)/0.08)" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={55} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="labor" stackId="a" fill={COLORS[0]} name="Labor %" radius={[0, 0, 0, 0]} />
                <Bar dataKey="other" stackId="a" fill={COLORS[2]} name="Other %" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground">No department data.</p>}
        </motion.div>

        {/* Cost composition donut */}
        <motion.div variants={fadeUp} className={`${card} p-6`}>
          <h3 className="font-display text-lg font-semibold mb-4">Cost Composition</h3>
          {costPie.length ? (
            <div className="flex items-center justify-center gap-6">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie data={costPie} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={2} strokeWidth={0}>
                    {costPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {costPie.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-semibold">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-sm text-muted-foreground">No cost data.</p>}
        </motion.div>
      </div>

      {/* Staffing ratio cards */}
      {ops?.staffingRatios && (
        <motion.div variants={fadeUp}>
          <h3 className="font-display text-lg font-semibold mb-3">Staffing Ratios</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(ops.staffingRatios).slice(0, 4).map(([k, v]: [string, any]) => (
              <MetricCard key={k} label={k.replace(/([A-Z])/g, " $1").trim()} value={typeof v === "number" ? v.toFixed(2) : String(v)} sub="per room" />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function SourcesTab({ content }: { content: any }) {
  const sources = content?._marketIntelligence?.groundedResearch || [];
  const benchmarkSource = content?._marketIntelligence?.benchmarks;
  const rateErrors = content?._marketIntelligence?.errors || [];

  const allSources: { title: string; url: string; snippet: string; publishedDate?: string }[] = [];
  for (const result of sources) {
    if (result.sources) {
      allSources.push(...result.sources);
    }
  }

  const uniqueSources = allSources.filter(
    (s, i, arr) => arr.findIndex((a) => a.url === s.url) === i
  );

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {benchmarkSource && (
        <motion.div variants={fadeUp} className={`${card} p-6`}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-display text-lg font-semibold">Hospitality Benchmarks</h3>
            <ProvenanceBadge provenance="verified" />
          </div>
          <p className="text-sm text-muted-foreground">
            Submarket: {benchmarkSource.submarket}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            {benchmarkSource.revpar && (
              <MetricCard label="RevPAR" value={`$${Math.round(benchmarkSource.revpar.value)}`} sub={benchmarkSource.revpar.source} />
            )}
            {benchmarkSource.adr && (
              <MetricCard label="ADR" value={`$${Math.round(benchmarkSource.adr.value)}`} sub={benchmarkSource.adr.source} />
            )}
            {benchmarkSource.occupancy && (
              <MetricCard label="Occupancy" value={`${(benchmarkSource.occupancy.value * 100).toFixed(1)}%`} sub={benchmarkSource.occupancy.source} />
            )}
            {benchmarkSource.capRate && (
              <MetricCard label="Cap Rate" value={`${benchmarkSource.capRate.value.toFixed(1)}%`} sub={benchmarkSource.capRate.source} />
            )}
          </div>
        </motion.div>
      )}

      {uniqueSources.length > 0 && (
        <motion.div variants={fadeUp} className={`${card} p-6`}>
          <SourceCitations sources={uniqueSources} title="Web Research Sources" />
        </motion.div>
      )}

      {sources.length > 0 && (
        <motion.div variants={fadeUp} className={`${card} p-6`}>
          <h3 className="font-display text-lg font-semibold mb-3">Research Queries</h3>
          <div className="space-y-4">
            {sources.map((result: any, i: number) => (
              <div key={i} className="p-4 rounded-xl bg-blue-50/30 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <ProvenanceBadge provenance="cited" />
                  <span className="text-xs text-muted-foreground">{result.fetchedAt ? new Date(result.fetchedAt).toLocaleDateString() : ""}</span>
                </div>
                <p className="text-sm font-medium text-foreground mb-1">{result.query}</p>
                {result.answer && (
                  <p className="text-xs text-muted-foreground line-clamp-4">{result.answer}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {!benchmarkSource && uniqueSources.length === 0 && sources.length === 0 && (
        <motion.div variants={fadeUp}>
          <EmptySection message="No external sources available. Regenerate research to fetch grounded data from FRED, STR, and web sources." />
        </motion.div>
      )}

      {rateErrors.length > 0 && (
        <motion.div variants={fadeUp} className={`${card} p-4`}>
          <p className="text-xs text-muted-foreground">
            Some data sources were unavailable: {rateErrors.join("; ")}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function PropertyMarketResearch() {
  const [, params] = useRoute("/property/:id/research");
  const propertyId = parseInt(params?.id || "0");
  const { data: property, isLoading: propertyLoading } = useProperty(propertyId);
  const { data: global } = useGlobalAssumptions();
  const { data: research, isLoading: researchLoading } = useMarketResearch("property", propertyId);
  const [isEmailing, setIsEmailing] = useState(false);
  const [activeTab, setActiveTab] = useState("market");
  const { toast } = useToast();

  const { isGenerating, streamedContent, generateResearch } = useResearchStream({
    property,
    propertyId,
    global,
  });

  if (propertyLoading || researchLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout>
        <div className="text-center py-12 text-white/60">Property not found</div>
      </Layout>
    );
  }

  const content = research?.content as any;
  const hasResearch = content && !content.rawResponse;
  const adrValue = property.startAdr ? Math.round(property.startAdr) : null;
  const propertyLabel = global?.propertyLabel || "boutique hotel";

  return (
    <Layout>
      <AnimatedPage>
        <div className="space-y-6">
          <PageHeader
            title={`Market Research: ${property.name}`}
            subtitle={`${property.location} · ${property.market} · ${property.roomCount} rooms${adrValue ? ` · $${adrValue} ADR` : ""}`}
            variant="dark"
            backLink={`/property/${property.id}/edit`}
            actions={
              <div className="flex items-center gap-3">
                {research?.updatedAt && (
                  <ResearchFreshnessBadge updatedAt={research.updatedAt} className="hidden sm:flex" />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 h-9 text-xs font-medium hover:scale-[1.03] active:scale-[0.97] transition-transform"
                  onClick={generateResearch}
                  disabled={isGenerating}
                  data-testid="button-update-research"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconRefreshCw className="w-4 h-4" />}
                  {isGenerating ? "Analyzing..." : "Regenerate"}
                </Button>
                {hasResearch && !isGenerating && (
                  <ExportToolbar
                    variant="glass"
                    actions={[
                      {
                        label: "Download PDF",
                        icon: <IconFileDown className="w-3.5 h-3.5" />,
                        onClick: () => downloadResearchPDF({
                          type: "property",
                          title: `Market Research: ${property.name}`,
                          subtitle: `${property.location} · ${property.market} · ${property.roomCount} rooms`,
                          content,
                          updatedAt: research?.updatedAt,
                          llmModel: research?.llmModel || undefined,
                          promptConditions: (research as any)?.promptConditions || undefined,
                        }),
                        testId: "button-export-research-pdf",
                      },
                      {
                        label: isEmailing ? "Sending..." : "Email PDF",
                        icon: <IconMail className="w-3.5 h-3.5" />,
                        onClick: async () => {
                          if (isEmailing) return;
                          setIsEmailing(true);
                          try {
                            const result = await emailResearchPDF({
                              type: "property",
                              title: `Market Research: ${property.name}`,
                              subtitle: `${property.location} · ${property.market} · ${property.roomCount} rooms`,
                              content,
                              updatedAt: research?.updatedAt,
                              llmModel: research?.llmModel || undefined,
                              promptConditions: (research as any)?.promptConditions || undefined,
                            });
                            if (result.success) {
                              toast({ title: "Email sent", description: "Research PDF has been emailed to you." });
                            } else {
                              toast({ title: "Email failed", description: result.error || "Could not send email.", variant: "destructive" });
                            }
                          } catch {
                            toast({ title: "Email failed", description: "Could not send email.", variant: "destructive" });
                          } finally {
                            setIsEmailing(false);
                          }
                        },
                        testId: "button-email-research-pdf",
                      },
                    ]}
                  />
                )}
              </div>
            }
          />

          {/* Streaming indicator */}
          {isGenerating && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`${card} p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-700 dark:text-emerald-400" />
                </div>
                <p className="text-muted-foreground text-sm font-medium">Analyzing market data for {property.name}...</p>
              </div>
              {streamedContent && (
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto bg-muted rounded-lg p-3 border border-border">
                  {streamedContent.slice(0, 500)}...
                </pre>
              )}
            </motion.div>
          )}

          {/* Empty state */}
          {!hasResearch && !isGenerating && (
            <div className={`${card} p-12 text-center`}>
              <div className="w-20 h-20 mx-auto mb-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <IconBookOpen className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-display text-foreground mb-3">No Market Research Yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-lg mx-auto leading-relaxed">
                Generate AI-powered market analysis for <strong>{property.name}</strong>. The research covers ADR benchmarks,
                occupancy patterns, competitive set, cap rates, operating costs, event demand, and more — all tailored to <strong>{property.location}</strong>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto mb-8 text-left">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">Market Data</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">ADR, occupancy, RevPAR, and comp set analysis</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">Cost Benchmarks</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">Operating costs, insurance, taxes, and USALI rates</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">Assumption Guidance</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">Research values appear as clickable badges on the edit page</p>
                </div>
              </div>
              <Button
                onClick={generateResearch}
                variant="default"
                className="gap-2 shadow-lg shadow-primary/20 hover:scale-[1.03] active:scale-[0.97] transition-transform"
              >
                <IconRefreshCw className="w-4 h-4" />
                Generate Research
              </Button>
            </div>
          )}

          {/* Tabbed research content */}
          {hasResearch && !isGenerating && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-primary/10 p-1 rounded-xl">
                <TabsTrigger value="market" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg text-xs">
                  <IconMapPin className="w-3.5 h-3.5" /> Market
                </TabsTrigger>
                <TabsTrigger value="revenue" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg text-xs">
                  <IconTrendingUp className="w-3.5 h-3.5" /> Revenue
                </TabsTrigger>
                <TabsTrigger value="financial" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg text-xs">
                  <IconDollarSign className="w-3.5 h-3.5" /> Financial
                </TabsTrigger>
                <TabsTrigger value="operating" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg text-xs">
                  <IconBarChart3 className="w-3.5 h-3.5" /> Operating
                </TabsTrigger>
                <TabsTrigger value="rates" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg text-xs">
                  <IconDollarSign className="w-3.5 h-3.5" /> Rates
                </TabsTrigger>
                <TabsTrigger value="sources" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg text-xs">
                  <IconBookOpen className="w-3.5 h-3.5" /> Sources
                </TabsTrigger>
                <TabsTrigger value="criteria" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg text-xs">
                  <IconPieChart className="w-3.5 h-3.5" /> Criteria
                </TabsTrigger>
              </TabsList>

              <TabsContent value="market"><MarketTab content={content} /></TabsContent>
              <TabsContent value="revenue"><RevenueTab content={content} /></TabsContent>
              <TabsContent value="financial"><FinancialTab content={content} /></TabsContent>
              <TabsContent value="operating"><OperatingTab content={content} /></TabsContent>
              <TabsContent value="rates">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                  <div className={`${card} p-6 space-y-6`}>
                    <MarketRateBenchmark
                      applicableRates={["sofr", "treasury10y", "primeRate"]}
                    />
                  </div>
                </motion.div>
              </TabsContent>
              <TabsContent value="sources">
                <SourcesTab content={content} />
              </TabsContent>
              <TabsContent value="criteria">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                  <ResearchCriteriaTab type="property" />
                </motion.div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </AnimatedPage>
    </Layout>
  );
}
