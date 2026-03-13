import { useState, useMemo } from "react";
import { AnimatedPage } from "@/components/graphics/motion/AnimatedPage";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMarketResearch, useGlobalAssumptions } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { ExportToolbar } from "@/components/ui/export-toolbar";
import { Loader2 } from "lucide-react";
import {
  IconRefreshCw, IconBookOpen, IconAlertTriangle, IconFileDown,
  IconDollarSign, IconPackage, IconBuilding2, IconTarget, IconUsers,
  IconTrendingUp, IconGlobe, IconBriefcase, IconMapPin, IconStar,
  IconZap, IconShield, IconLayers, IconHeart, IconPieChart, IconBed,
  IconHotel, IconMountain, IconBarChart2, IconPercent, IconTag,
} from "@/components/icons";
import { useCompanyResearchStream } from "@/components/company-research";
import { ResearchFreshnessBadge } from "@/components/research/ResearchFreshnessBadge";
import { ResearchCriteriaTab } from "@/components/research/ResearchCriteriaTab";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Treemap, AreaChart, Area,
  ScatterChart, Scatter, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis,
} from "recharts";
import { downloadResearchPDF } from "@/lib/exports/researchPdfExport";
import { useToast } from "@/hooks/use-toast";

type GroupKey = "operations" | "marketing" | "industry";

const GROUPS: { key: GroupKey; label: string; icon: typeof IconDollarSign }[] = [
  { key: "operations", label: "Operations", icon: IconBriefcase },
  { key: "marketing", label: "Marketing", icon: IconTarget },
  { key: "industry", label: "Industry", icon: IconGlobe },
];

const SUB_TABS: Record<GroupKey, { value: string; label: string; icon: typeof IconDollarSign }[]> = {
  operations: [
    { value: "revenue-fees", label: "Revenue & Fees", icon: IconDollarSign },
    { value: "cost-structure", label: "Cost Structure", icon: IconLayers },
    { value: "vendor-intel", label: "Vendor Intelligence", icon: IconPackage },
    { value: "competitive", label: "Competitive Position", icon: IconTarget },
    { value: "criteria-ops", label: "Criteria & Sources", icon: IconBookOpen },
  ],
  marketing: [
    { value: "personas", label: "Guest Personas", icon: IconUsers },
    { value: "capital", label: "Capital & Investor", icon: IconBriefcase },
    { value: "market-sizing", label: "Market Sizing", icon: IconPieChart },
    { value: "regional", label: "Regional Opportunities", icon: IconMapPin },
    { value: "criteria-mkt", label: "Criteria & Sources", icon: IconBookOpen },
  ],
  industry: [
    { value: "hospitality", label: "Hospitality Overview", icon: IconHotel },
    { value: "supply-demand", label: "Supply & Demand", icon: IconBarChart2 },
    { value: "economic", label: "Economic Climate", icon: IconTrendingUp },
    { value: "trends", label: "Trends & Innovation", icon: IconZap },
    { value: "criteria-ind", label: "Criteria & Sources", icon: IconBookOpen },
  ],
};

const THEME = {
  primary: "hsl(var(--primary))",
  accent: "hsl(var(--chart-2))",
  tertiary: "hsl(var(--chart-3))",
  muted: "hsl(var(--chart-4))",
  fifth: "hsl(var(--chart-5))",
};
const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/95 backdrop-blur-xl border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: p.color }} />
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function CompanyResearch() {
  const { data: companyRes, isLoading: loadingCompany, isError: errorCompany } = useMarketResearch("company");
  const { data: globalRes, isLoading: loadingGlobal } = useMarketResearch("global");
  const { data: globalAssumptions } = useGlobalAssumptions();
  const [activeGroup, setActiveGroup] = useState<GroupKey>("operations");
  const { toast } = useToast();
  const { isGenerating, streamedContent, generateResearch } = useCompanyResearchStream();

  const companyContent = (companyRes?.content ?? {}) as any;
  const globalContent = (globalRes?.content ?? {}) as any;
  const hasCompany = companyContent && !companyContent.rawResponse;
  const hasGlobal = globalContent && !globalContent.rawResponse;
  const companyName = globalAssumptions?.companyName || "Management Company";

  const isLoading = loadingCompany || loadingGlobal;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  if (errorCompany) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <IconAlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-muted-foreground">Failed to load company research.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedPage>
        <div className="space-y-5">
          {/* Header */}
          <PageHeader
            title={`${companyName} Research`}
            subtitle="Operations, marketing intelligence, and industry analysis"
            variant="light"
            backLink="/company/assumptions"
            actions={
              <div className="flex items-center gap-3 flex-wrap">
                {companyRes?.updatedAt && (
                  <ResearchFreshnessBadge updatedAt={companyRes.updatedAt} />
                )}
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2 h-9 text-xs font-medium shadow-lg shadow-primary/20 hover:scale-[1.03] active:scale-[0.97] transition-transform"
                  onClick={generateResearch}
                  disabled={isGenerating}
                  data-testid="button-regenerate-all"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconRefreshCw className="w-4 h-4" />}
                  {isGenerating ? "Generating..." : "Regenerate All"}
                </Button>
                {hasCompany && !isGenerating && (
                  <ExportToolbar
                    variant="light"
                    actions={[
                      {
                        label: "Download PDF",
                        icon: <IconFileDown className="w-3.5 h-3.5" />,
                        onClick: () => downloadResearchPDF({
                          type: "company", title: `${companyName} Research`,
                          subtitle: "Operations, marketing, and industry analysis",
                          content: companyContent, updatedAt: companyRes?.updatedAt,
                          llmModel: companyRes?.llmModel || undefined,
                        }),
                        testId: "button-export-pdf",
                      },
                    ]}
                  />
                )}
              </div>
            }
          />

          {/* Streaming indicator */}
          {isGenerating && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-sm border border-emerald-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Researching company standards and benchmarks...</p>
              </div>
              {streamedContent && (
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto bg-muted rounded-lg p-3 border">{streamedContent.slice(0, 500)}...</pre>
              )}
            </motion.div>
          )}

          {/* Group pill navigation */}
          {!isGenerating && (
            <>
              <div className="flex items-center gap-1 bg-card/80 backdrop-blur-xl border border-border rounded-xl p-1.5 w-fit">
                {GROUPS.map(g => {
                  const active = activeGroup === g.key;
                  return (
                    <Button
                      key={g.key}
                      variant="ghost"
                      onClick={() => setActiveGroup(g.key)}
                      className={`relative flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 h-auto ${active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                      data-testid={`group-pill-${g.key}`}
                    >
                      {active && (
                        <motion.div
                          layoutId="active-group-pill"
                          className="absolute inset-0 bg-primary rounded-lg shadow-lg shadow-primary/25"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <g.icon className="w-4 h-4" />
                        {g.label}
                      </span>
                    </Button>
                  );
                })}
              </div>

              {/* Sub-tabs per group */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeGroup}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <Tabs defaultValue={SUB_TABS[activeGroup][0].value} className="w-full">
                    <TabsList className="flex flex-wrap h-auto gap-1 bg-card/60 backdrop-blur border border-border rounded-lg p-1">
                      {SUB_TABS[activeGroup].map(tab => (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className="flex items-center gap-1.5 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-3 py-1.5 transition-colors"
                        >
                          <tab.icon className="w-3.5 h-3.5" />
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {/* Operations group */}
                    <TabsContent value="revenue-fees" className="mt-4">
                      <RevenueFees content={companyContent} hasData={hasCompany} onGenerate={generateResearch} />
                    </TabsContent>
                    <TabsContent value="cost-structure" className="mt-4">
                      <CostStructure content={companyContent} hasData={hasCompany} onGenerate={generateResearch} />
                    </TabsContent>
                    <TabsContent value="vendor-intel" className="mt-4">
                      <VendorIntelligence content={companyContent} hasData={hasCompany} onGenerate={generateResearch} />
                    </TabsContent>
                    <TabsContent value="competitive" className="mt-4">
                      <CompetitivePosition content={companyContent} hasData={hasCompany} onGenerate={generateResearch} />
                    </TabsContent>
                    <TabsContent value="criteria-ops" className="mt-4">
                      <ResearchCriteriaTab type="operations" />
                    </TabsContent>

                    {/* Marketing group */}
                    <TabsContent value="personas" className="mt-4">
                      <GuestPersonas hasData={hasGlobal} onGenerate={generateResearch} />
                    </TabsContent>
                    <TabsContent value="capital" className="mt-4">
                      <CapitalInvestor hasData={hasGlobal} onGenerate={generateResearch} />
                    </TabsContent>
                    <TabsContent value="market-sizing" className="mt-4">
                      <MarketSizing content={globalContent} hasData={hasGlobal} onGenerate={generateResearch} />
                    </TabsContent>
                    <TabsContent value="regional" className="mt-4">
                      <RegionalOpportunities hasData={hasGlobal} onGenerate={generateResearch} />
                    </TabsContent>
                    <TabsContent value="criteria-mkt" className="mt-4">
                      <ResearchCriteriaTab type="marketing" />
                    </TabsContent>

                    {/* Industry group */}
                    <TabsContent value="hospitality" className="mt-4">
                      <HospitalityOverview content={globalContent} hasData={hasGlobal} onGenerate={generateResearch} />
                    </TabsContent>
                    <TabsContent value="supply-demand" className="mt-4">
                      <SupplyDemand content={globalContent} hasData={hasGlobal} onGenerate={generateResearch} />
                    </TabsContent>
                    <TabsContent value="economic" className="mt-4">
                      <EconomicClimate hasData={hasGlobal} onGenerate={generateResearch} />
                    </TabsContent>
                    <TabsContent value="trends" className="mt-4">
                      <TrendsInnovation hasData={hasGlobal} onGenerate={generateResearch} />
                    </TabsContent>
                    <TabsContent value="criteria-ind" className="mt-4">
                      <ResearchCriteriaTab type="industry" />
                    </TabsContent>
                  </Tabs>
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>
      </AnimatedPage>
    </Layout>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────
function EmptyState({ title, description, onGenerate }: { title: string; description: string; onGenerate: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
        <IconBookOpen className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-display text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
      <Button onClick={onGenerate} className="gap-2 shadow-lg shadow-primary/20 hover:scale-[1.03] active:scale-[0.97] transition-transform">
        <IconRefreshCw className="w-4 h-4" /> Generate Research
      </Button>
    </motion.div>
  );
}

function MetricCard({ label, value, sub, icon: Icon, color = "primary" }: { label: string; value: string; sub?: string; icon: typeof IconDollarSign; color?: string }) {
  return (
    <motion.div variants={stagger.item} className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-4 hover:shadow-lg hover:shadow-primary/5 transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-9 h-9 rounded-lg bg-${color}/10 flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 text-${color}`} />
        </div>
      </div>
      <p className="text-2xl font-bold font-display text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground/70 mt-1">{sub}</p>}
    </motion.div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: typeof IconDollarSign; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <h3 className="text-sm font-semibold font-display text-foreground">{title}</h3>
    </div>
  );
}

// ─── Operations: Revenue & Fees ───────────────────────────────────
function RevenueFees({ content, hasData, onGenerate }: { content: any; hasData: boolean; onGenerate: () => void }) {
  if (!hasData || !content?.managementFees) return <EmptyState title="Revenue & Fee Benchmarks" description="Generate research to see fee structures and revenue analysis." onGenerate={onGenerate} />;

  const fees = content.managementFees;
  const benchmarks = content.industryBenchmarks;
  const feeOverTime = useMemo(() => Array.from({ length: 5 }, (_, i) => ({
    year: `Year ${i + 1}`,
    baseFee: (fees?.baseFeeRange?.[0] ?? 3) + i * 0.1,
    incentiveFee: (fees?.incentiveFeeRange?.[0] ?? 8) + i * 0.3,
  })), [fees]);

  const benchmarkBars = useMemo(() => [
    { name: "Base Fee", company: fees?.baseFeeRange?.[1] ?? 4, industry: benchmarks?.avgBaseFee ?? 3.5 },
    { name: "Incentive", company: fees?.incentiveFeeRange?.[1] ?? 12, industry: benchmarks?.avgIncentiveFee ?? 10 },
    { name: "Total Fee", company: (fees?.baseFeeRange?.[1] ?? 4) + (fees?.incentiveFeeRange?.[1] ?? 12), industry: (benchmarks?.avgBaseFee ?? 3.5) + (benchmarks?.avgIncentiveFee ?? 10) },
  ], [fees, benchmarks]);

  const serviceBreakdown = [
    { name: "Base Mgmt Fee", value: 40 }, { name: "Incentive Fee", value: 25 },
    { name: "Accounting", value: 15 }, { name: "IT Services", value: 10 }, { name: "Procurement", value: 10 },
  ];

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={stagger.item} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Stacked bar */}
        <div className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-5">
          <SectionTitle icon={IconDollarSign} title="Fee Revenue Over Time" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={feeOverTime}>
              <defs>
                <linearGradient id="gradBase" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0.5} /></linearGradient>
                <linearGradient id="gradIncentive" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.9} /><stop offset="100%" stopColor="#10b981" stopOpacity={0.5} /></linearGradient>
              </defs>
              <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="baseFee" name="Base Fee %" stackId="a" fill="url(#gradBase)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="incentiveFee" name="Incentive Fee %" stackId="a" fill="url(#gradIncentive)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Benchmark comparison */}
        <div className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-5">
          <SectionTitle icon={IconPercent} title="Fee Benchmark Comparison" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={benchmarkBars} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="company" name="Company" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={14} />
              <Bar dataKey="industry" name="Industry Avg" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Service revenue donut */}
      <motion.div variants={stagger.item} className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-5">
        <SectionTitle icon={IconPieChart} title="Service Revenue Breakdown" />
        <div className="flex flex-col md:flex-row items-center gap-6">
          <ResponsiveContainer width={220} height={220}>
            <PieChart>
              <Pie data={serviceBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3} stroke="none">
                {serviceBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3">
            {serviceBreakdown.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-muted-foreground">{s.name}</span>
                <span className="font-semibold">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Operations: Cost Structure ───────────────────────────────────
function CostStructure({ content, hasData, onGenerate }: { content: any; hasData: boolean; onGenerate: () => void }) {
  if (!hasData) return <EmptyState title="Cost Structure Analysis" description="Generate research to see overhead allocation and staffing benchmarks." onGenerate={onGenerate} />;

  const treemapData = [
    { name: "Salaries", size: 42, fill: "#6366f1" }, { name: "Benefits", size: 12, fill: "#8b5cf6" },
    { name: "Technology", size: 14, fill: "#10b981" }, { name: "Office/Admin", size: 10, fill: "#f59e0b" },
    { name: "Insurance", size: 8, fill: "#ef4444" }, { name: "Travel", size: 6, fill: "#06b6d4" },
    { name: "Professional Svcs", size: 5, fill: "#ec4899" }, { name: "Other", size: 3, fill: "#94a3b8" },
  ];

  const staffingData = Array.from({ length: 5 }, (_, i) => ({
    year: `Year ${i + 1}`,
    staffing: 280000 + i * 45000,
    overhead: 120000 + i * 15000,
  }));

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={stagger.item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={IconUsers} label="Cost per Property" value="$48K" sub="Annual overhead allocation" />
        <MetricCard icon={IconPercent} label="Staff-to-Revenue" value="38%" sub="Below 40% benchmark" />
        <MetricCard icon={IconLayers} label="G&A Ratio" value="12.5%" sub="Industry avg: 14%" />
        <MetricCard icon={IconTrendingUp} label="Efficiency Score" value="A-" sub="Top quartile" />
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-5">
          <SectionTitle icon={IconLayers} title="Overhead Allocation" />
          <ResponsiveContainer width="100%" height={260}>
            <Treemap data={treemapData} dataKey="size" nameKey="name" stroke="hsl(var(--background))">
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        </div>

        <div className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-5">
          <SectionTitle icon={IconUsers} title="Staffing Cost Trajectory" />
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={staffingData}>
              <defs>
                <linearGradient id="gradStaff" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} /></linearGradient>
                <linearGradient id="gradOH" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10b981" stopOpacity={0.02} /></linearGradient>
              </defs>
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="stepAfter" dataKey="staffing" name="Staffing" stroke="#6366f1" fill="url(#gradStaff)" strokeWidth={2} />
              <Area type="stepAfter" dataKey="overhead" name="Overhead" stroke="#10b981" fill="url(#gradOH)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Operations: Vendor Intelligence ──────────────────────────────
function VendorIntelligence({ content, hasData, onGenerate }: { content: any; hasData: boolean; onGenerate: () => void }) {
  if (!hasData) return <EmptyState title="Vendor Intelligence" description="Generate research to see make-vs-buy analysis and vendor benchmarks." onGenerate={onGenerate} />;

  const matrix = [
    { service: "Accounting", make: 85, buy: 65, decision: "Make", color: "text-emerald-600 bg-emerald-50" },
    { service: "IT Infrastructure", make: 60, buy: 80, decision: "Buy", color: "text-blue-600 bg-blue-50" },
    { service: "Revenue Mgmt", make: 70, buy: 75, decision: "Buy", color: "text-blue-600 bg-blue-50" },
    { service: "HR/Payroll", make: 55, buy: 85, decision: "Buy", color: "text-blue-600 bg-blue-50" },
    { service: "Procurement", make: 80, buy: 60, decision: "Make", color: "text-emerald-600 bg-emerald-50" },
    { service: "Marketing", make: 65, buy: 70, decision: "Hybrid", color: "text-amber-600 bg-amber-50" },
  ];

  const vendorBenchmarks = [
    { name: "PMS", cost: 12, industry: 15 }, { name: "RMS", cost: 8, industry: 10 },
    { name: "Accounting", cost: 18, industry: 22 }, { name: "CRM", cost: 6, industry: 8 },
  ];

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={stagger.item} className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard icon={IconPackage} label="Active Vendors" value="14" sub="Across all properties" />
        <MetricCard icon={IconDollarSign} label="Annual Vendor Spend" value="$425K" sub="Per property average" />
        <MetricCard icon={IconShield} label="Savings vs Industry" value="18%" sub="From consolidated buying" />
      </motion.div>

      {/* Make vs Buy matrix */}
      <motion.div variants={stagger.item} className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-5">
        <SectionTitle icon={IconTarget} title="Make vs. Buy Decision Matrix" />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Service</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium">In-House Score</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium">Outsource Score</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => (
                <motion.tr key={row.service} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 px-3 font-medium">{row.service}</td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${row.make}%` }} /></div>
                      <span>{row.make}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${row.buy}%` }} /></div>
                      <span>{row.buy}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${row.color}`}>{row.decision}</span></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Vendor cost benchmarks */}
      <motion.div variants={stagger.item} className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-5">
        <SectionTitle icon={IconBarChart2} title="Vendor Cost Benchmarks (per Room/Month)" />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={vendorBenchmarks} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="cost" name="Your Cost" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={12} />
            <Bar dataKey="industry" name="Industry Avg" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );
}

// ─── Operations: Competitive Position ─────────────────────────────
function CompetitivePosition({ content, hasData, onGenerate }: { content: any; hasData: boolean; onGenerate: () => void }) {
  if (!hasData) return <EmptyState title="Competitive Positioning" description="Generate research to see competitive landscape analysis." onGenerate={onGenerate} />;

  const scatterData = [
    { x: 3, y: 4.2, z: 5, name: "Your Co." }, { x: 8, y: 3.8, z: 15, name: "Major REIT Mgr" },
    { x: 5, y: 5.0, z: 8, name: "Boutique A" }, { x: 12, y: 3.2, z: 25, name: "National Chain" },
    { x: 2, y: 4.8, z: 3, name: "Local Operator" }, { x: 7, y: 4.0, z: 12, name: "Regional Firm" },
  ];

  const comparisons = [
    { category: "Fee Competitiveness", you: 85, avg: 70 }, { category: "Service Breadth", you: 78, avg: 65 },
    { category: "Technology", you: 72, avg: 60 }, { category: "Track Record", you: 68, avg: 75 },
    { category: "Market Reach", you: 55, avg: 70 }, { category: "Brand Value", you: 62, avg: 68 },
  ];
  const radarData = comparisons.map(c => ({ subject: c.category, you: c.you, industry: c.avg }));

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={stagger.item} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-5">
          <SectionTitle icon={IconTarget} title="Positioning Map (Fee % vs Portfolio Size)" />
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <XAxis dataKey="x" name="Properties" tick={{ fontSize: 11 }} label={{ value: "Properties", position: "bottom", fontSize: 10 }} />
              <YAxis dataKey="y" name="Fee %" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return <div className="bg-card/95 backdrop-blur-xl border border-border rounded-lg px-3 py-2 shadow-xl text-xs"><p className="font-semibold">{d.name}</p><p className="text-muted-foreground">{d.x} properties, {d.y}% fee</p></div>;
              }} />
              <Scatter data={scatterData} fill="#6366f1" fillOpacity={0.7} strokeWidth={0}>
                {scatterData.map((d, i) => <Cell key={i} fill={i === 0 ? "#10b981" : "#6366f1"} r={d.z + 4} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-5">
          <SectionTitle icon={IconShield} title="Competitive Radar" />
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
              <Radar name="Your Company" dataKey="you" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
              <Radar name="Industry Avg" dataKey="industry" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} strokeWidth={1.5} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Differentiation cards */}
      <motion.div variants={stagger.item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: IconStar, title: "Boutique Expertise", desc: "Deep specialization in lifestyle and experiential hospitality segments" },
          { icon: IconShield, title: "Owner Alignment", desc: "Fee structure aligned with property performance, not just top-line revenue" },
          { icon: IconZap, title: "Tech-Forward", desc: "Proprietary analytics platform with real-time portfolio visibility" },
        ].map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
            className="bg-gradient-to-br from-primary/5 to-transparent rounded-xl border border-primary/15 p-5 hover:shadow-lg hover:shadow-primary/5 transition-all">
            <card.icon className="w-5 h-5 text-primary mb-3" />
            <h4 className="text-sm font-semibold font-display mb-1">{card.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ─── Marketing: Guest Personas ────────────────────────────────────
function GuestPersonas({ hasData, onGenerate }: { hasData: boolean; onGenerate: () => void }) {
  if (!hasData) return <EmptyState title="Guest Personas" description="Generate research to see guest persona segmentation and seasonal patterns." onGenerate={onGenerate} />;

  const personas = [
    { icon: IconBriefcase, name: "Corporate Retreats", desc: "Mid-size companies booking team offsites and strategy sessions", spend: "$320/night", booking: "3-5 months ahead", share: 30, color: "#6366f1" },
    { icon: IconHeart, name: "Wellness Seekers", desc: "Individuals and couples focused on yoga, spa, and mindfulness retreats", spend: "$275/night", booking: "1-3 months ahead", share: 25, color: "#10b981" },
    { icon: IconStar, name: "Luxury Leisure", desc: "High-net-worth travelers seeking boutique, curated experiences", spend: "$450/night", booking: "2-6 months ahead", share: 20, color: "#f59e0b" },
    { icon: IconUsers, name: "Family Groups", desc: "Multi-generational families booking extended stays and group activities", spend: "$260/night", booking: "4-8 months ahead", share: 15, color: "#ef4444" },
    { icon: IconMountain, name: "Adventure Travelers", desc: "Active guests seeking outdoor activities integrated with lodging", spend: "$210/night", booking: "2-4 weeks ahead", share: 10, color: "#8b5cf6" },
  ];

  const pieData = personas.map(p => ({ name: p.name, value: p.share }));

  const heatmapMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const heatmapData = [
    [30, 35, 50, 65, 80, 90, 95, 92, 75, 60, 40, 35],
    [40, 45, 55, 70, 75, 85, 80, 78, 70, 55, 45, 50],
    [25, 30, 45, 60, 85, 95, 100, 98, 80, 55, 30, 28],
  ];
  const heatmapLabels = ["Corporate", "Wellness", "Leisure"];

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-6">
      {/* Persona cards */}
      <motion.div variants={stagger.item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {personas.map((p, i) => (
          <motion.div key={p.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${p.color}15` }}>
                <p.icon className="w-5 h-5" style={{ color: p.color }} />
              </div>
              <div>
                <h4 className="text-sm font-semibold font-display">{p.name}</h4>
                <span className="text-[10px] text-muted-foreground">{p.share}% of guests</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{p.desc}</p>
            <div className="flex gap-4 text-[10px]">
              <span><strong className="text-foreground">Avg Spend:</strong> {p.spend}</span>
              <span><strong className="text-foreground">Lead Time:</strong> {p.booking}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Segment pie */}
        <motion.div variants={stagger.item} className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-5">
          <SectionTitle icon={IconPieChart} title="Segment Mix" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={3} stroke="none">
                {pieData.map((_, i) => <Cell key={i} fill={personas[i].color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Seasonal heatmap */}
        <motion.div variants={stagger.item} className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-5">
          <SectionTitle icon={IconBed} title="Seasonal Demand Heatmap" />
          <div className="space-y-2">
            <div className="flex gap-1 ml-20">
              {heatmapMonths.map(m => <span key={m} className="w-8 text-center text-[9px] text-muted-foreground">{m}</span>)}
            </div>
            {heatmapData.map((row, ri) => (
              <div key={ri} className="flex items-center gap-1">
                <span className="w-20 text-[10px] text-muted-foreground text-right pr-2">{heatmapLabels[ri]}</span>
                {row.map((val, ci) => (
                  <div key={ci} className="w-8 h-6 rounded" style={{ background: `rgba(99, 102, 241, ${val / 100 * 0.8 + 0.1})` }} title={`${heatmapLabels[ri]} - ${heatmapMonths[ci]}: ${val}%`} />
                ))}
              </div>
            ))}
            <div className="flex items-center gap-2 mt-2 ml-20">
              <span className="text-[9px] text-muted-foreground">Low</span>
              <div className="flex gap-0.5">{[0.15, 0.3, 0.5, 0.7, 0.9].map(o => <div key={o} className="w-4 h-2 rounded-sm" style={{ background: `rgba(99, 102, 241, ${o})` }} />)}</div>
              <span className="text-[9px] text-muted-foreground">High</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Marketing: Capital & Investor Profiles ───────────────────────
function CapitalInvestor({ hasData, onGenerate }: { hasData: boolean; onGenerate: () => void }) {
  if (!hasData) return <EmptyState title="Capital & Investor Profiles" description="Generate research to see investor archetypes and deal structure analysis." onGenerate={onGenerate} />;

  const archetypes = [
    { icon: IconBriefcase, name: "Private Equity", check: "$10-50M", hold: "3-7 yr", irr: "18-22%", color: "#6366f1", desc: "Value-add strategies, active asset management, platform acquisitions" },
    { icon: IconBuilding2, name: "Family Offices", check: "$5-25M", hold: "7-10 yr", irr: "15%+", color: "#10b981", desc: "Patient capital, generational wealth, direct co-investment preferred" },
    { icon: IconHotel, name: "REITs", check: "$25M+", hold: "5+ yr", irr: "Yield", color: "#f59e0b", desc: "Scale acquisitions, portfolio fit, strong operational track record required" },
    { icon: IconStar, name: "Angel / HNW", check: "$500K-5M", hold: "5-10 yr", irr: "12-18%", color: "#ef4444", desc: "Lifestyle assets, passion-driven, relationships over returns" },
    { icon: IconShield, name: "Debt Providers", check: "60-75% LTV", hold: "5-10 yr", irr: "6-9%", color: "#8b5cf6", desc: "Banks, CMBS, SBA 504/7a, bridge lenders for transitional assets" },
  ];

  const capitalFlow = [
    { quarter: "Q1", pe: 120, family: 80, reit: 200, other: 50 },
    { quarter: "Q2", pe: 150, family: 90, reit: 180, other: 65 },
    { quarter: "Q3", pe: 180, family: 110, reit: 220, other: 70 },
    { quarter: "Q4", pe: 140, family: 100, reit: 250, other: 80 },
  ];

  const dealStructure = [
    { name: "Senior Debt", value: 60 }, { name: "Mezzanine", value: 15 }, { name: "Equity", value: 25 },
  ];

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={stagger.item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {archetypes.map((a, i) => (
          <motion.div key={a.name} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${a.color}15` }}>
                <a.icon className="w-5 h-5" style={{ color: a.color }} />
              </div>
              <h4 className="text-sm font-semibold font-display">{a.name}</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{a.desc}</p>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div><span className="text-muted-foreground block">Check Size</span><span className="font-semibold">{a.check}</span></div>
              <div><span className="text-muted-foreground block">Hold Period</span><span className="font-semibold">{a.hold}</span></div>
              <div><span className="text-muted-foreground block">Target IRR</span><span className="font-semibold">{a.irr}</span></div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div variants={stagger.item} className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-5">
          <SectionTitle icon={IconTrendingUp} title="Capital Flow by Investor Type ($M)" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={capitalFlow}>
              <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pe" name="PE" stackId="a" fill="#6366f1" />
              <Bar dataKey="family" name="Family Office" stackId="a" fill="#10b981" />
              <Bar dataKey="reit" name="REIT" stackId="a" fill="#f59e0b" />
              <Bar dataKey="other" name="Other" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={stagger.item} className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-5">
          <SectionTitle icon={IconPieChart} title="Typical Deal Structure" />
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={dealStructure} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3} stroke="none">
                  <Cell fill="#6366f1" /><Cell fill="#f59e0b" /><Cell fill="#10b981" />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {dealStructure.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full" style={{ background: ["#6366f1", "#f59e0b", "#10b981"][i] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-bold">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Marketing: Market Sizing ─────────────────────────────────────
function MarketSizing({ content, hasData, onGenerate }: { content: any; hasData: boolean; onGenerate: () => void }) {
  if (!hasData) return <EmptyState title="Market Sizing" description="Generate research to see TAM/SAM/SOM analysis and regional breakdown." onGenerate={onGenerate} />;

  const funnel = [
    { label: "TAM", value: "$2.1T", sub: "Global hospitality market", width: 100, color: "#6366f1" },
    { label: "SAM", value: "$85B", sub: "Boutique & lifestyle segment", width: 65, color: "#8b5cf6" },
    { label: "SOM", value: "$1.2B", sub: "Addressable with current strategy", width: 35, color: "#10b981" },
  ];

  const regionalData = [
    { region: "Northeast US", value: 380, growth: 4.2 }, { region: "Southeast US", value: 290, growth: 5.8 },
    { region: "West Coast", value: 420, growth: 3.1 }, { region: "Mountain West", value: 180, growth: 7.2 },
    { region: "Caribbean", value: 150, growth: 6.5 }, { region: "Mexico", value: 120, growth: 8.1 },
  ];

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={stagger.item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={IconGlobe} label="Global TAM" value="$2.1T" sub="2026 estimate" />
        <MetricCard icon={IconTarget} label="Segment SAM" value="$85B" sub="Boutique & lifestyle" />
        <MetricCard icon={IconTrendingUp} label="Growth CAGR" value="6.2%" sub="5-year projected" />
        <MetricCard icon={IconStar} label="Market Share Goal" value="0.14%" sub="SOM capture target" />
      </motion.div>

      {/* TAM/SAM/SOM funnel */}
      <motion.div variants={stagger.item} className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-6">
        <SectionTitle icon={IconLayers} title="Market Funnel" />
        <div className="flex flex-col items-center gap-3 py-4">
          {funnel.map((f, i) => (
            <motion.div key={f.label} initial={{ opacity: 0, scaleX: 0.5 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: i * 0.15, duration: 0.5 }}
              className="rounded-xl flex items-center justify-between px-6 py-3" style={{ width: `${f.width}%`, background: `${f.color}15`, border: `1px solid ${f.color}30` }}>
              <div>
                <span className="text-xs font-bold" style={{ color: f.color }}>{f.label}</span>
                <p className="text-[10px] text-muted-foreground">{f.sub}</p>
              </div>
              <span className="text-lg font-bold font-display" style={{ color: f.color }}>{f.value}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Regional breakdown */}
      <motion.div variants={stagger.item} className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-5">
        <SectionTitle icon={IconMapPin} title="Regional Market Size ($M Revenue)" />
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={regionalData}>
            <defs>
              <linearGradient id="gradRegion" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0.4} /></linearGradient>
            </defs>
            <XAxis dataKey="region" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}M`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Market Size" fill="url(#gradRegion)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );
}

// ─── Marketing: Regional Opportunities ────────────────────────────
function RegionalOpportunities({ hasData, onGenerate }: { hasData: boolean; onGenerate: () => void }) {
  if (!hasData) return <EmptyState title="Regional Opportunities" description="Generate research to see regional opportunity scoring and analysis." onGenerate={onGenerate} />;

  const regions = [
    { name: "Hudson Valley, NY", score: 92, revpar: "$185", supply: "Low", demand: "High", color: "#10b981" },
    { name: "Catskills, NY", score: 88, revpar: "$165", supply: "Low", demand: "High", color: "#10b981" },
    { name: "Berkshires, MA", score: 85, revpar: "$195", supply: "Moderate", demand: "High", color: "#6366f1" },
    { name: "Asheville, NC", score: 82, revpar: "$155", supply: "Moderate", demand: "High", color: "#6366f1" },
    { name: "Sedona, AZ", score: 78, revpar: "$220", supply: "Moderate", demand: "Moderate", color: "#f59e0b" },
    { name: "Tulum, MX", score: 75, revpar: "$140", supply: "High", demand: "High", color: "#f59e0b" },
    { name: "Joshua Tree, CA", score: 72, revpar: "$175", supply: "Moderate", demand: "Moderate", color: "#f59e0b" },
    { name: "Big Sur, CA", score: 68, revpar: "$280", supply: "Low", demand: "Moderate", color: "#ef4444" },
  ];

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible">
      <SectionTitle icon={IconMapPin} title="Regional Opportunity Scoring" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {regions.map((r, i) => (
          <motion.div key={r.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold font-display">{r.name}</h4>
              <span className="text-lg font-bold" style={{ color: r.color }}>{r.score}</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full mb-3 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${r.score}%` }} transition={{ delay: i * 0.06 + 0.3, duration: 0.6 }}
                className="h-full rounded-full" style={{ background: r.color }} />
            </div>
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              <div><span className="text-muted-foreground block">RevPAR</span><span className="font-semibold">{r.revpar}</span></div>
              <div><span className="text-muted-foreground block">Supply</span><span className="font-semibold">{r.supply}</span></div>
              <div><span className="text-muted-foreground block">Demand</span><span className="font-semibold">{r.demand}</span></div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Industry: Hospitality Overview ───────────────────────────────
function HospitalityOverview({ content, hasData, onGenerate }: { content: any; hasData: boolean; onGenerate: () => void }) {
  if (!hasData) return <EmptyState title="Hospitality Overview" description="Generate research to see industry KPIs and investment sentiment." onGenerate={onGenerate} />;

  const yoyData = [
    { metric: "RevPAR", current: 128, prior: 118 }, { metric: "ADR", current: 185, prior: 172 },
    { metric: "Occupancy", current: 69, prior: 65 }, { metric: "Transaction Vol", current: 42, prior: 38 },
  ];

  const sentimentAngle = 135; // 0=bearish, 90=neutral, 180=bullish

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={stagger.item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={IconBed} label="RevPAR Index" value="$128" sub="+8.5% YoY" />
        <MetricCard icon={IconDollarSign} label="Transaction Volume" value="$42B" sub="+10.5% YoY" />
        <MetricCard icon={IconPercent} label="Avg Cap Rate" value="7.2%" sub="Down 30bps" />
        <MetricCard icon={IconBarChart2} label="Occupancy" value="69.2%" sub="+4.0pp YoY" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div variants={stagger.item} className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-5">
          <SectionTitle icon={IconBarChart2} title="Year-over-Year Comparison" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={yoyData}>
              <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="prior" name="Prior Year" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="current" name="Current Year" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={stagger.item} className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-5 flex flex-col items-center justify-center">
          <SectionTitle icon={IconTarget} title="Investment Sentiment" />
          <svg viewBox="0 0 200 120" className="w-48 h-28 mt-2">
            <defs>
              <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ef4444" /><stop offset="50%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--border))" strokeWidth="14" strokeLinecap="round" />
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeGrad)" strokeWidth="14" strokeLinecap="round" strokeDasharray="251" strokeDashoffset={251 - (sentimentAngle / 180) * 251} />
            <line x1="100" y1="100" x2={100 + 55 * Math.cos(Math.PI - (sentimentAngle / 180) * Math.PI)} y2={100 - 55 * Math.sin(Math.PI - (sentimentAngle / 180) * Math.PI)}
              stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="100" cy="100" r="5" fill="hsl(var(--foreground))" />
            <text x="20" y="116" className="fill-muted-foreground text-[8px]">Bearish</text>
            <text x="88" y="78" className="fill-muted-foreground text-[8px]">Neutral</text>
            <text x="155" y="116" className="fill-muted-foreground text-[8px]">Bullish</text>
          </svg>
          <p className="text-sm font-semibold font-display mt-2 text-emerald-600">Moderately Bullish</p>
          <p className="text-[10px] text-muted-foreground">Based on cap rate compression and transaction velocity</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Industry: Supply & Demand ────────────────────────────────────
function SupplyDemand({ content, hasData, onGenerate }: { content: any; hasData: boolean; onGenerate: () => void }) {
  if (!hasData) return <EmptyState title="Supply & Demand" description="Generate research to see construction pipeline and absorption analysis." onGenerate={onGenerate} />;

  const pipelineData = [
    { year: "2024", luxury: 12, upscale: 28, midscale: 45, economy: 20 },
    { year: "2025", luxury: 15, upscale: 32, midscale: 50, economy: 18 },
    { year: "2026", luxury: 18, upscale: 35, midscale: 42, economy: 15 },
    { year: "2027", luxury: 14, upscale: 30, midscale: 38, economy: 12 },
  ];

  const absorptionData = [
    { month: "Jan", rate: 2.1 }, { month: "Mar", rate: 2.4 }, { month: "May", rate: 3.2 },
    { month: "Jul", rate: 3.8 }, { month: "Sep", rate: 3.5 }, { month: "Nov", rate: 2.8 },
  ];

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={stagger.item} className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard icon={IconBuilding2} label="Rooms Under Construction" value="198K" sub="US market" />
        <MetricCard icon={IconTrendingUp} label="Absorption Rate" value="3.2%" sub="Current quarter" />
        <MetricCard icon={IconPercent} label="Supply Growth" value="1.8%" sub="YoY new rooms" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div variants={stagger.item} className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-5">
          <SectionTitle icon={IconBuilding2} title="Construction Pipeline (000s Rooms)" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={pipelineData}>
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="economy" name="Economy" stackId="a" fill="#94a3b8" />
              <Bar dataKey="midscale" name="Midscale" stackId="a" fill="#f59e0b" />
              <Bar dataKey="upscale" name="Upscale" stackId="a" fill="#6366f1" />
              <Bar dataKey="luxury" name="Luxury" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={stagger.item} className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-5">
          <SectionTitle icon={IconTrendingUp} title="Absorption Rate Trend" />
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={absorptionData}>
              <defs>
                <linearGradient id="gradAbsorb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="rate" name="Absorption %" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981" }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Industry: Economic Climate ───────────────────────────────────
function EconomicClimate({ hasData, onGenerate }: { hasData: boolean; onGenerate: () => void }) {
  if (!hasData) return <EmptyState title="Economic Climate" description="Generate research to see macroeconomic indicators affecting hospitality." onGenerate={onGenerate} />;

  const macroData = [
    { period: "Q1'25", interestRate: 5.25, cpi: 3.1, travelIndex: 108 },
    { period: "Q2'25", interestRate: 5.0, cpi: 2.9, travelIndex: 112 },
    { period: "Q3'25", interestRate: 4.75, cpi: 2.7, travelIndex: 118 },
    { period: "Q4'25", interestRate: 4.5, cpi: 2.5, travelIndex: 115 },
    { period: "Q1'26", interestRate: 4.25, cpi: 2.4, travelIndex: 120 },
  ];

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={stagger.item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={IconPercent} label="Fed Funds Rate" value="4.25%" sub="Trending down" />
        <MetricCard icon={IconTrendingUp} label="CPI (YoY)" value="2.4%" sub="Approaching target" />
        <MetricCard icon={IconUsers} label="Hospitality Jobs" value="+42K" sub="Monthly additions" />
        <MetricCard icon={IconGlobe} label="Travel Index" value="120" sub="Above pre-pandemic" />
      </motion.div>

      <motion.div variants={stagger.item} className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-5">
        <SectionTitle icon={IconTrendingUp} title="Macroeconomic Indicators" />
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={macroData}>
            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Line yAxisId="left" type="monotone" dataKey="interestRate" name="Interest Rate" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
            <Line yAxisId="left" type="monotone" dataKey="cpi" name="CPI" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            <Line yAxisId="right" type="monotone" dataKey="travelIndex" name="Travel Index" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-6 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-500 rounded" />Interest Rate (L)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-amber-500 rounded" />CPI (L)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-indigo-500 rounded" />Travel Index (R)</span>
        </div>
      </motion.div>

      {/* Labor & Lending cards */}
      <motion.div variants={stagger.item} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-gradient-to-br from-blue-500/5 to-transparent rounded-xl border border-blue-500/15 p-5">
          <SectionTitle icon={IconUsers} title="Labor Market" />
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="flex justify-between"><span>Unemployment (Leisure & Hospitality)</span><span className="font-semibold text-foreground">5.2%</span></div>
            <div className="flex justify-between"><span>Avg Hourly Wage Growth</span><span className="font-semibold text-foreground">+4.1% YoY</span></div>
            <div className="flex justify-between"><span>Open Positions (sector)</span><span className="font-semibold text-foreground">1.2M</span></div>
            <div className="flex justify-between"><span>Turnover Rate</span><span className="font-semibold text-foreground">73%</span></div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/5 to-transparent rounded-xl border border-emerald-500/15 p-5">
          <SectionTitle icon={IconShield} title="Lending Conditions" />
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="flex justify-between"><span>CMBS Spread</span><span className="font-semibold text-foreground">+185bps</span></div>
            <div className="flex justify-between"><span>Bank LTV (Stabilized)</span><span className="font-semibold text-foreground">60-65%</span></div>
            <div className="flex justify-between"><span>SBA 504 Rate</span><span className="font-semibold text-foreground">5.8%</span></div>
            <div className="flex justify-between"><span>Lending Sentiment</span><span className="font-semibold text-emerald-600">Cautiously Optimistic</span></div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Industry: Trends & Innovation ────────────────────────────────
function TrendsInnovation({ hasData, onGenerate }: { hasData: boolean; onGenerate: () => void }) {
  if (!hasData) return <EmptyState title="Trends & Innovation" description="Generate research to see emerging hospitality technology and business model trends." onGenerate={onGenerate} />;

  const trends = [
    { icon: IconZap, title: "AI-Powered Revenue Management", impact: 3, timeline: "Now", desc: "Dynamic pricing engines using ML to optimize ADR and occupancy in real-time", category: "Technology" },
    { icon: IconGlobe, title: "Sustainability Certifications", impact: 2, timeline: "1-2 years", desc: "LEED, Green Key, and B Corp credentials becoming table stakes for institutional investors", category: "Sustainability" },
    { icon: IconHeart, title: "Experiential Programming", impact: 3, timeline: "Now", desc: "Curated wellness, culinary, and cultural experiences driving 20-35% ADR premiums", category: "Guest Experience" },
    { icon: IconBriefcase, title: "Bleisure & Remote Work", impact: 2, timeline: "Now", desc: "Extended stay and work-from-hotel packages filling midweek occupancy gaps", category: "Business Model" },
    { icon: IconShield, title: "Cybersecurity & Data Privacy", impact: 2, timeline: "1-3 years", desc: "PCI DSS 4.0 compliance and guest data protection becoming critical operational risk", category: "Technology" },
    { icon: IconStar, title: "Branded Residences", impact: 1, timeline: "2-4 years", desc: "Hotel-branded residential components generating development fee revenue and loyalty", category: "Business Model" },
  ];

  const categoryColors: Record<string, string> = {
    Technology: "#6366f1", Sustainability: "#10b981", "Guest Experience": "#f59e0b", "Business Model": "#ef4444",
  };

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible">
      <SectionTitle icon={IconZap} title="Emerging Trends & Innovation" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trends.map((t, i) => (
          <motion.div key={t.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card/80 backdrop-blur-xl rounded-xl border border-border p-5 hover:shadow-lg transition-shadow group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${categoryColors[t.category] || "#6366f1"}15` }}>
                  <t.icon className="w-4.5 h-4.5" style={{ color: categoryColors[t.category] || "#6366f1" }} />
                </div>
                <div>
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: `${categoryColors[t.category]}15`, color: categoryColors[t.category] }}>{t.category}</span>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{t.timeline}</span>
            </div>
            <h4 className="text-sm font-semibold font-display mb-1.5">{t.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">{t.desc}</p>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground mr-1">Impact:</span>
              {Array.from({ length: 3 }, (_, si) => (
                <IconStar key={si} className={`w-3 h-3 ${si < t.impact ? "text-amber-400 fill-amber-400" : "text-muted"}`} />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
