import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { ContentPanel } from "@/components/ui/content-panel";
import { CurrentThemeTab } from "@/components/ui/tabs";
import { AnimatedPage, ScrollReveal, KPIGrid, InsightPanel, formatCompact } from "@/components/graphics";
import { IconWallet, IconTrending, IconTarget, IconDollarSign, IconCheckCircle, IconAlertTriangle, IconSettings, IconBarChart3 } from "@/components/icons";
import { useProperties, useGlobalAssumptions, useAllFeeCategories } from "@/lib/api";
import { useServiceTemplates } from "@/lib/api/services";
import { useMarketRates } from "@/lib/api/market-rates";
import { generateCompanyProForma, formatMoney } from "@/lib/financialEngine";
import { analyzeFundingNeeds } from "@/lib/financial/funding-predictor";
import { PROJECTION_YEARS } from "@/lib/constants";
import { OPERATING_RESERVE_BUFFER, COMPANY_FUNDING_BUFFER } from "@/lib/constants";
import { DEFAULT_SAFE_VALUATION_CAP, DEFAULT_SAFE_DISCOUNT_RATE } from "@shared/constants";
import { Loader2, ExternalLink, Search } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { MermaidChart } from "@/lib/charts";
import { useLocation } from "wouter";

const FUNDING_TABS = [
  { value: "recommended", label: "Recommended", icon: IconTarget },
  { value: "current", label: "Current Plan", icon: IconSettings },
  { value: "research", label: "Research", icon: Search },
];

function RunwayTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl text-sm max-w-xs">
      <p className="font-semibold text-foreground mb-2 border-b pb-1">Month {label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}</span>
          </span>
          <span className="font-mono font-medium text-foreground">{formatMoney(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

function StatRow({ label, value, muted }: { label: string; value: React.ReactNode; muted?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/40 last:border-b-0">
      <span className={`text-sm ${muted ? "text-muted-foreground/60" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-sm font-mono ${muted ? "text-muted-foreground/60" : "font-medium text-foreground"}`}>{value}</span>
    </div>
  );
}

export default function FundingPredictor({ embedded }: { embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState("recommended");
  const [, navigate] = useLocation();
  const { data: properties, isLoading: propsLoading } = useProperties();
  const { data: global, isLoading: globalLoading } = useGlobalAssumptions();
  const { data: allFeeCategories } = useAllFeeCategories();
  const { data: serviceTemplates } = useServiceTemplates();
  const { data: marketRates } = useMarketRates();

  const projectionYears = global?.projectionYears ?? PROJECTION_YEARS;
  const projectionMonths = projectionYears * 12;

  const enrichedProperties = useMemo(() => {
    if (!properties) return [];
    return properties.map(p => {
      const cats = allFeeCategories?.filter(c => c.propertyId === p.id) ?? [];
      if (cats.length > 0) {
        return { ...p, feeCategories: cats.map(c => ({ name: c.name, rate: c.rate, isActive: c.isActive })) };
      }
      return p;
    });
  }, [properties, allFeeCategories]);

  const financials = useMemo(() => {
    if (!enrichedProperties.length || !global) return [];
    const templates = serviceTemplates?.map(t => ({
      ...t,
      serviceModel: t.serviceModel as 'centralized' | 'direct',
    }));
    return generateCompanyProForma(enrichedProperties, global, projectionMonths, templates);
  }, [enrichedProperties, global, projectionMonths, serviceTemplates]);

  const analysis = useMemo(() => {
    if (!financials.length || !global) return null;
    return analyzeFundingNeeds(financials, global, marketRates ?? undefined);
  }, [financials, global, marketRates]);

  if (propsLoading || globalLoading) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analysis || !global) {
    return (
      <div className="flex flex-col items-center justify-center h-[40vh] gap-3">
        <IconAlertTriangle className="w-8 h-8 text-destructive" />
        <p className="text-muted-foreground">Unable to generate funding analysis. Ensure properties and assumptions are configured.</p>
      </div>
    );
  }

  const fundingLabel = global.fundingSourceLabel ?? "Funding Vehicle";

  const chartData = analysis.cashRunway
    .filter((_, i) => i % 3 === 0 || i === analysis.cashRunway.length - 1)
    .map(p => ({
      month: p.month,
      withFunding: Math.round(p.cashWithFunding),
      withoutFunding: Math.round(p.cashWithoutFunding),
    }));

  const gapType = analysis.fundingGap > 0 ? "negative" : analysis.fundingGap < 0 ? "positive" : "neutral";

  const Wrapper = embedded
    ? ({ children }: { children: React.ReactNode }) => <>{children}</>
    : Layout;

  return (
    <Wrapper>
      <AnimatedPage>
        <div className="space-y-6 p-4 md:p-6">
          {!embedded && (
            <PageHeader
              title="Capital Raise Analysis"
              subtitle={`${fundingLabel} strategy and projections for ${global.companyName || 'the management company'}`}
            />
          )}

          <CurrentThemeTab
            tabs={FUNDING_TABS.map(t => ({ ...t }))}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {activeTab === "recommended" && (
            <RecommendedTab
              analysis={analysis}
              fundingLabel={fundingLabel}
              chartData={chartData}
              gapType={gapType}
              projectionYears={projectionYears}
              global={global}
              marketRates={marketRates}
            />
          )}

          {activeTab === "current" && (
            <CurrentPlanTab
              analysis={analysis}
              fundingLabel={fundingLabel}
              global={global}
              chartData={chartData}
              navigate={navigate}
            />
          )}

          {activeTab === "research" && (
            <ResearchTab
              analysis={analysis}
              fundingLabel={fundingLabel}
              marketRates={marketRates}
              global={global}
              navigate={navigate}
            />
          )}
        </div>
      </AnimatedPage>
    </Wrapper>
  );
}


function RecommendedTab({ analysis, fundingLabel, chartData, gapType, projectionYears, global, marketRates }: {
  analysis: NonNullable<ReturnType<typeof analyzeFundingNeeds>>;
  fundingLabel: string;
  chartData: { month: number; withFunding: number; withoutFunding: number }[];
  gapType: string;
  projectionYears: number;
  global: any;
  marketRates: any;
}) {
  return (
    <>
      <ScrollReveal>
        <KPIGrid
          data-testid="kpi-funding-overview"
          items={[
            { label: "Capital Raise Target", value: analysis.totalRaiseNeeded, format: formatCompact },
            { label: "Tranches", value: analysis.tranches.length, sublabel: `via ${fundingLabel}` },
            { label: "Path to Breakeven", value: analysis.breakevenMonth ?? 0, sublabel: analysis.breakevenMonth !== null ? `Month ${analysis.breakevenMonth}` : "Not within projection" },
            {
              label: "Funding Gap",
              value: Math.abs(analysis.fundingGap),
              format: formatCompact,
              sublabel: analysis.fundingGap > 0 ? "Shortfall" : analysis.fundingGap < 0 ? "Surplus" : "Balanced",
              trend: gapType === "negative" ? "down" as const : gapType === "positive" ? "up" as const : undefined,
            },
          ]}
          columns={4}
          variant="glass"
        />
      </ScrollReveal>

      <ScrollReveal>
        <ContentPanel data-testid="panel-investor-thesis">
          <div className="flex items-start gap-3 mb-3">
            <IconTarget className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-display text-foreground">Investment Thesis</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Why investors fund this management company</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground/80 leading-relaxed" data-testid="text-investor-thesis">
            {analysis.investorThesis}
          </p>
        </ContentPanel>
      </ScrollReveal>

      <ScrollReveal>
        <ContentPanel data-testid="panel-capital-flow">
          <div className="flex items-start gap-3 mb-3">
            <IconWallet className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-display text-foreground">Capital Structure</h3>
              <p className="text-xs text-muted-foreground mt-0.5">How {fundingLabel} capital flows through the management company</p>
            </div>
          </div>
          <MermaidChart
            chart={(() => {
              const fmt = (v: number) => `$${(v / 1000).toFixed(0)}K`;
              const trancheNodes = analysis.tranches.map(t =>
                `T${t.index}["Tranche ${t.index}\\n${fmt(t.amount)}\\nMonth ${t.month}"]`
              ).join("\n    ");
              const trancheLinks = analysis.tranches.map(t =>
                `INVESTORS -->|"${fmt(t.amount)}"| T${t.index}`
              ).join("\n    ");
              const trancheToOps = analysis.tranches.map(t =>
                `T${t.index} --> OPS`
              ).join("\n    ");
              const beNode = analysis.breakevenMonth !== null
                ? `BREAKEVEN(("Breakeven\\nMonth ${analysis.breakevenMonth}"))`
                : `BREAKEVEN(("Breakeven\\nNot yet reached"))`;
              const beStyle = analysis.breakevenMonth !== null
                ? "style BREAKEVEN fill:#22c55e,stroke:#16a34a,color:#fff"
                : "style BREAKEVEN fill:#ef4444,stroke:#dc2626,color:#fff";
              return `graph LR
    INVESTORS["${fundingLabel}\\nInvestors"]
    ${trancheNodes}
    OPS["Operating Expenses\\n${fmt(analysis.monthlyBurnRate)}/mo burn"]
    REVENUE["Fee Revenue\\nRamp-Up"]
    ${beNode}

    ${trancheLinks}
    ${trancheToOps}
    OPS --> REVENUE
    REVENUE --> BREAKEVEN

    style INVESTORS fill:#3b82f6,stroke:#2563eb,color:#fff
    style OPS fill:#f59e0b,stroke:#d97706,color:#fff
    style REVENUE fill:#8b5cf6,stroke:#7c3aed,color:#fff
    ${beStyle}`;
            })()}
            theme="neutral"
          />
        </ContentPanel>
      </ScrollReveal>

      <ScrollReveal>
        <ContentPanel title="Cash Runway" subtitle="Cumulative cash position with and without funding" data-testid="panel-cash-runway">
          <CashRunwayChart chartData={chartData} analysis={analysis} />
        </ContentPanel>
      </ScrollReveal>

      <ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analysis.tranches.map((tranche) => (
            <TrancheCard key={tranche.index} tranche={tranche} totalTranches={analysis.tranches.length} />
          ))}
        </div>
      </ScrollReveal>

      {analysis.tranches.length > 1 && (
        <ScrollReveal>
          <ContentPanel title="Early-Stage Terms Comparison" data-testid="panel-terms-comparison">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Term</th>
                    {analysis.tranches.map(t => (
                      <th key={t.index} className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">
                        Tranche {t.index}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-3 text-muted-foreground">Amount</td>
                    {analysis.tranches.map(t => (
                      <td key={t.index} className="py-2 px-3 text-right font-mono font-medium text-foreground">
                        {formatMoney(t.amount)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-3 text-muted-foreground">Valuation Cap</td>
                    {analysis.tranches.map(t => (
                      <td key={t.index} className="py-2 px-3 text-right font-mono text-foreground">
                        {formatMoney(t.valuationCap)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-3 text-muted-foreground">Discount Rate</td>
                    {analysis.tranches.map(t => (
                      <td key={t.index} className="py-2 px-3 text-right font-mono text-foreground">
                        {(t.discountRate * 100).toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 px-3 text-muted-foreground">Timing</td>
                    {analysis.tranches.map(t => (
                      <td key={t.index} className="py-2 px-3 text-right text-foreground">
                        Month {t.month}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-muted-foreground">Risk Profile</td>
                    {analysis.tranches.map(t => (
                      <td key={t.index} className="py-2 px-3 text-right text-foreground">
                        {t.index === 1 ? 'Pre-revenue (highest)' : t.index === analysis.tranches.length ? 'Revenue-generating (lowest)' : 'Early revenue (moderate)'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </ContentPanel>
        </ScrollReveal>
      )}

      <ScrollReveal>
        <ContentPanel data-testid="panel-narrative">
          <div className="flex items-start gap-3 mb-3">
            <IconDollarSign className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-display text-foreground">Capital Strategy</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Engine-computed analysis of the capital raise</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground/80 leading-relaxed" data-testid="text-narrative">
            {analysis.narrativeSummary}
          </p>
        </ContentPanel>
      </ScrollReveal>

      <ScrollReveal>
        <InsightPanel
          data-testid="insights-funding"
          title="Risk Factors & Milestones"
          insights={[
            {
              text: `Net burn rate during ramp-up: ${formatMoney(analysis.monthlyBurnRate)}/month`,
              type: "warning" as const,
            },
            {
              text: analysis.breakevenMonth !== null
                ? `Operating breakeven at month ${analysis.breakevenMonth} with ${analysis.propertiesAtBreakeven} propert${analysis.propertiesAtBreakeven === 1 ? 'y' : 'ies'} in the portfolio`
                : `Company does not reach operating breakeven within the ${projectionYears}-year projection`,
              type: analysis.breakevenMonth !== null ? "positive" as const : "negative" as const,
            },
            {
              text: `Peak cash deficit without funding: ${formatMoney(analysis.peakCashDeficit)}`,
              type: "negative" as const,
            },
            {
              text: analysis.fundingGap <= 0
                ? `Configured ${fundingLabel} of ${formatMoney(analysis.currentFunding)} covers the raise (${formatMoney(Math.abs(analysis.fundingGap))} surplus)`
                : `Configured ${fundingLabel} of ${formatMoney(analysis.currentFunding)} leaves a ${formatMoney(analysis.fundingGap)} shortfall — increase the raise or reduce operating expenses`,
              type: analysis.fundingGap <= 0 ? "positive" as const : "negative" as const,
            },
          ]}
        />
      </ScrollReveal>
    </>
  );
}


function CurrentPlanTab({ analysis, fundingLabel, global, chartData, navigate }: {
  analysis: NonNullable<ReturnType<typeof analyzeFundingNeeds>>;
  fundingLabel: string;
  global: any;
  chartData: { month: number; withFunding: number; withoutFunding: number }[];
  navigate: (to: string) => void;
}) {
  const t1Amount = global.safeTranche1Amount ?? 0;
  const t2Amount = global.safeTranche2Amount ?? 0;
  const configuredTotal = t1Amount + t2Amount;
  const t1Date = global.safeTranche1Date ?? "—";
  const t2Date = global.safeTranche2Date ?? "—";
  const valCap = global.safeValuationCap ?? DEFAULT_SAFE_VALUATION_CAP;
  const discRate = global.safeDiscountRate ?? DEFAULT_SAFE_DISCOUNT_RATE;
  const gap = analysis.totalRaiseNeeded - configuredTotal;
  const gapPct = analysis.totalRaiseNeeded > 0 ? (gap / analysis.totalRaiseNeeded * 100) : 0;
  const coveragePct = analysis.totalRaiseNeeded > 0 ? Math.min(100, configuredTotal / analysis.totalRaiseNeeded * 100) : 100;

  return (
    <>
      <ScrollReveal>
        <KPIGrid
          data-testid="kpi-current-plan"
          items={[
            { label: "Configured Capital", value: configuredTotal, format: formatCompact },
            { label: "Engine Recommendation", value: analysis.totalRaiseNeeded, format: formatCompact },
            {
              label: "Coverage",
              value: Math.round(coveragePct),
              format: (v: number) => `${v}%`,
              sublabel: gap > 0 ? `${formatMoney(gap)} shortfall` : gap < 0 ? `${formatMoney(Math.abs(gap))} surplus` : "Fully covered",
              trend: gap > 0 ? "down" as const : gap <= 0 ? "up" as const : undefined,
            },
            { label: "Runway", value: analysis.monthsOfRunway, format: (v: number) => `${v} mo`, sublabel: analysis.monthsOfRunway >= 24 ? "Healthy" : analysis.monthsOfRunway >= 12 ? "Adequate" : "At risk" },
          ]}
          columns={4}
          variant="glass"
        />
      </ScrollReveal>

      {gap > 0 && (
        <ScrollReveal>
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3" data-testid="alert-funding-gap">
            <IconAlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Funding Gap: {formatMoney(gap)}</p>
              <p className="text-xs text-destructive/80 mt-1">
                Your configured {fundingLabel} raises {formatMoney(configuredTotal)}, but the engine recommends {formatMoney(analysis.totalRaiseNeeded)} to reach operating breakeven with adequate reserves. Consider increasing tranche amounts or reducing operating expenses.
              </p>
            </div>
          </div>
        </ScrollReveal>
      )}

      <ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ContentPanel data-testid="panel-tranche1-config">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div>
                <h4 className="text-sm font-display text-foreground">Tranche 1</h4>
                <p className="text-xs text-muted-foreground">Initial capital deployment</p>
              </div>
            </div>
            <div className="space-y-0">
              <StatRow label="Amount" value={formatMoney(t1Amount)} />
              <StatRow label="Target Date" value={t1Date} />
              <StatRow label="Valuation Cap" value={formatMoney(valCap)} />
              <StatRow label="Discount Rate" value={`${(discRate * 100).toFixed(1)}%`} />
            </div>
            {analysis.tranches[0] && (
              <div className="mt-3 pt-3 border-t border-border/40">
                <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider mb-1">Engine recommends</p>
                <p className="text-xs text-muted-foreground">
                  {formatMoney(analysis.tranches[0].amount)} at month {analysis.tranches[0].month} with {formatMoney(analysis.tranches[0].valuationCap)} cap / {(analysis.tranches[0].discountRate * 100).toFixed(1)}% discount
                </p>
              </div>
            )}
          </ContentPanel>

          <ContentPanel data-testid="panel-tranche2-config">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <div>
                <h4 className="text-sm font-display text-foreground">Tranche 2</h4>
                <p className="text-xs text-muted-foreground">Growth-phase capital</p>
              </div>
            </div>
            <div className="space-y-0">
              <StatRow label="Amount" value={formatMoney(t2Amount)} />
              <StatRow label="Target Date" value={t2Date} />
              <StatRow label="Valuation Cap" value={formatMoney(valCap)} />
              <StatRow label="Discount Rate" value={`${(discRate * 100).toFixed(1)}%`} />
            </div>
            {analysis.tranches[1] && (
              <div className="mt-3 pt-3 border-t border-border/40">
                <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider mb-1">Engine recommends</p>
                <p className="text-xs text-muted-foreground">
                  {formatMoney(analysis.tranches[1].amount)} at month {analysis.tranches[1].month} with {formatMoney(analysis.tranches[1].valuationCap)} cap / {(analysis.tranches[1].discountRate * 100).toFixed(1)}% discount
                </p>
              </div>
            )}
          </ContentPanel>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <ContentPanel title="Cash Runway — Current Plan" subtitle="Projected cash position using your configured funding" data-testid="panel-current-runway">
          <CashRunwayChart chartData={chartData} analysis={analysis} />
        </ContentPanel>
      </ScrollReveal>

      <ScrollReveal>
        <ContentPanel data-testid="panel-gap-analysis">
          <div className="flex items-start gap-3 mb-3">
            <IconBarChart3 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-display text-foreground">Gap Analysis</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Your plan vs. the engine recommendation</p>
            </div>
          </div>
          <div className="space-y-0">
            <StatRow label="Your Total Raise" value={formatMoney(configuredTotal)} />
            <StatRow label="Engine Target" value={formatMoney(analysis.totalRaiseNeeded)} />
            <StatRow label="Difference" value={gap > 0 ? `-${formatMoney(gap)}` : gap < 0 ? `+${formatMoney(Math.abs(gap))}` : "—"} />
            <StatRow label="Coverage Ratio" value={`${coveragePct.toFixed(1)}%`} />
            <StatRow label={`${fundingLabel} Label`} value={fundingLabel} />
          </div>
          <div className="mt-4">
            <button
              onClick={() => navigate("/admin")}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
              data-testid="link-edit-assumptions"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Edit funding assumptions in Company Assumptions
            </button>
          </div>
        </ContentPanel>
      </ScrollReveal>
    </>
  );
}


function ResearchTab({ analysis, fundingLabel, marketRates, global, navigate }: {
  analysis: NonNullable<ReturnType<typeof analyzeFundingNeeds>>;
  fundingLabel: string;
  marketRates: any;
  global: any;
  navigate: (to: string) => void;
}) {
  const rateCards = [
    { key: 'fed_funds', label: 'Fed Funds Rate', description: 'Federal Reserve benchmark rate' },
    { key: 'sofr', label: 'SOFR', description: 'Secured Overnight Financing Rate' },
    { key: 'treasury_10y', label: '10-Year Treasury', description: 'U.S. Treasury yield benchmark' },
    { key: 'hotel_lending_spread', label: 'Hotel Lending Spread', description: 'Basis points over SOFR for hospitality debt' },
  ];

  return (
    <>
      <ScrollReveal>
        <ContentPanel data-testid="panel-market-rates">
          <div className="flex items-start gap-3 mb-4">
            <IconTrending className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-display text-foreground">Market Intelligence</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Live rates that inform {fundingLabel} terms and valuation</p>
            </div>
          </div>

          {marketRates && marketRates.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {rateCards.map(({ key, label, description }) => {
                const rate = marketRates.find((r: any) => r.rateKey === key);
                return (
                  <div key={key} className="rounded-lg bg-muted/50 p-3 border border-border/50" data-testid={`metric-rate-${key}`}>
                    <p className="text-xs font-medium text-foreground">{label}</p>
                    <p className="text-lg font-mono font-semibold text-foreground mt-1">
                      {rate?.value !== null && rate?.value !== undefined
                        ? key === 'hotel_lending_spread' ? `${rate.value} bps` : `${Number(rate.value).toFixed(2)}%`
                        : '—'}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{description}</p>
                    {rate?.source && (
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5">Source: {rate.source}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg bg-muted/30 border border-border/40 p-4 text-center">
              <p className="text-sm text-muted-foreground">No market rate data available. Refresh rates in Admin &gt; Research &gt; Market Rates.</p>
            </div>
          )}

          <p className="text-sm text-muted-foreground/80 leading-relaxed mt-3" data-testid="text-market-context">
            {analysis.marketContext}
          </p>
        </ContentPanel>
      </ScrollReveal>

      <ScrollReveal>
        <ContentPanel data-testid="panel-funding-instruments">
          <div className="flex items-start gap-3 mb-4">
            <IconDollarSign className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-display text-foreground">Funding Instruments</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Reference only — does not affect the simulation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                name: "SAFE",
                fit: "Pre-revenue / seed",
                pros: ["Fast to close", "No debt on balance sheet", "Delays valuation"],
                cons: ["Dilution uncertain until conversion", "No investor governance rights"],
              },
              {
                name: "Convertible Note",
                fit: "Early stage",
                pros: ["Investor downside protection", "Familiar to institutional investors"],
                cons: ["Creates debt obligation", "Maturity date pressure"],
              },
              {
                name: "Priced Equity",
                fit: "Revenue-stage / Series A+",
                pros: ["Clear ownership math", "Investor governance rights"],
                cons: ["Requires defensible valuation", "Slower to close"],
              },
              {
                name: "Revenue-Based",
                fit: "Post-revenue",
                pros: ["Non-dilutive", "Payments flex with revenue"],
                cons: ["Requires existing revenue", "Reduces near-term cash flow"],
              },
              {
                name: "Mezzanine",
                fit: "Asset-backed / later stage",
                pros: ["Leverages property collateral", "Structured for hospitality"],
                cons: ["Requires tangible assets", "Higher cost of capital"],
              },
            ].map((inst) => (
              <div key={inst.name} className="rounded-lg border border-border/50 bg-muted/30 p-3" data-testid={`instrument-${inst.name.toLowerCase().replace(/\s+/g, "-")}`}>
                <h4 className="text-sm font-display font-medium text-foreground">{inst.name}</h4>
                <p className="text-[11px] text-primary/80 font-medium mb-2">{inst.fit}</p>
                <div className="space-y-1.5">
                  {inst.pros.map((p, i) => (
                    <p key={`p${i}`} className="text-[11px] text-muted-foreground/70 flex items-start gap-1">
                      <span className="text-green-500 shrink-0">+</span> {p}
                    </p>
                  ))}
                  {inst.cons.map((c, i) => (
                    <p key={`c${i}`} className="text-[11px] text-muted-foreground/70 flex items-start gap-1">
                      <span className="text-amber-500 shrink-0">–</span> {c}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground/60 mt-3">
            Set your chosen instrument label in Company Assumptions. The simulation engine is instrument-agnostic.
          </p>
        </ContentPanel>
      </ScrollReveal>

      <ScrollReveal>
        <ContentPanel data-testid="panel-engine-parameters">
          <div className="flex items-start gap-3 mb-4">
            <IconSettings className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-display text-foreground">Engine Parameters</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Constants and assumptions used by the funding analysis engine</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider mb-2">Reserves & Buffers</p>
              <div className="space-y-0">
                <StatRow label="Operating Reserve" value={formatMoney(OPERATING_RESERVE_BUFFER)} />
                <StatRow label="Company Funding Buffer" value={formatMoney(COMPANY_FUNDING_BUFFER)} />
                <StatRow label="Tranche Buffer Multiplier" value="1.15×" />
              </div>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider mb-2">Default Instrument Terms</p>
              <div className="space-y-0">
                <StatRow label="Default Valuation Cap" value={formatMoney(DEFAULT_SAFE_VALUATION_CAP)} />
                <StatRow label="Default Discount Rate" value={`${(DEFAULT_SAFE_DISCOUNT_RATE * 100).toFixed(0)}%`} />
                <StatRow label="Early-Stage Cap Discount" value="20%" />
                <StatRow label="Early-Stage Discount Premium" value="5 pp" />
              </div>
            </div>
          </div>
        </ContentPanel>
      </ScrollReveal>

      <ScrollReveal>
        <ContentPanel data-testid="panel-methodology">
          <div className="flex items-start gap-3 mb-3">
            <IconCheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-display text-foreground">Methodology</h3>
              <p className="text-xs text-muted-foreground mt-0.5">How the engine computes the recommended capital raise</p>
            </div>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground/80 leading-relaxed">
            <p>
              The engine generates a month-by-month company pro forma from all property-level financials, computing net income (fee revenue minus corporate overhead) each month. The cumulative cash position without funding reveals the peak cash deficit — the maximum capital the company needs before fee revenue exceeds expenses.
            </p>
            <p>
              The total raise target adds the operating reserve ({formatMoney(OPERATING_RESERVE_BUFFER)}) and company funding buffer ({formatMoney(COMPANY_FUNDING_BUFFER)}) to the peak deficit, then rounds up to the nearest $50K. Tranches are sized using the 1.15× buffer multiplier applied to the cash deficit at each tranche timing point.
            </p>
            <p>
              Valuation caps and discount rates are calibrated against the 10-Year Treasury yield (risk-free rate proxy). Early tranches receive a 20% cap discount and 5 percentage point discount premium to compensate investors for pre-revenue risk. Later tranches use the configured base terms as the company demonstrates revenue traction.
            </p>
          </div>
        </ContentPanel>
      </ScrollReveal>

      <ScrollReveal>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/admin")}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors rounded-lg border border-border/50 px-3 py-2"
            data-testid="link-admin-research"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Admin &gt; Research &gt; Market Rates
          </button>
          <button
            onClick={() => navigate("/admin")}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors rounded-lg border border-border/50 px-3 py-2"
            data-testid="link-admin-assumptions"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Company Assumptions
          </button>
        </div>
      </ScrollReveal>
    </>
  );
}


function TrancheCard({ tranche, totalTranches }: { tranche: any; totalTranches: number }) {
  return (
    <ContentPanel data-testid={`card-tranche-${tranche.index}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-bold text-primary">{tranche.index}</span>
        </div>
        <div>
          <h4 className="text-sm font-display text-foreground">Tranche {tranche.index}</h4>
          <p className="text-xs text-muted-foreground">Month {tranche.month}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Amount</span>
          <span className="text-sm font-mono font-semibold text-foreground" data-testid={`text-tranche-amount-${tranche.index}`}>
            {formatMoney(tranche.amount)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Valuation Cap</span>
          <span className="text-sm font-mono text-foreground" data-testid={`text-tranche-cap-${tranche.index}`}>
            {formatMoney(tranche.valuationCap)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Discount Rate</span>
          <span className="text-sm font-mono text-foreground" data-testid={`text-tranche-discount-${tranche.index}`}>
            {(tranche.discountRate * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Date</span>
          <span className="text-sm text-foreground">
            {tranche.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground/70 leading-relaxed" data-testid={`text-tranche-rationale-${tranche.index}`}>
          {tranche.rationale}
        </p>
      </div>
    </ContentPanel>
  );
}


function CashRunwayChart({ chartData, analysis }: {
  chartData: { month: number; withFunding: number; withoutFunding: number }[];
  analysis: NonNullable<ReturnType<typeof analyzeFundingNeeds>>;
}) {
  return (
    <div className="h-[320px] sm:h-[360px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradWithFunding" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradWithout" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11 }}
            className="text-muted-foreground"
            tickFormatter={(m: number) => `M${m}`}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            className="text-muted-foreground"
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
          />
          <Tooltip content={<RunwayTooltip />} />
          <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeOpacity={0.6} />
          {analysis.breakevenMonth !== null && (
            <ReferenceLine
              x={analysis.breakevenMonth}
              stroke="hsl(var(--chart-2))"
              strokeDasharray="4 4"
              label={{ value: "Breakeven", position: "top", fill: "hsl(var(--chart-2))", fontSize: 11 }}
            />
          )}
          {analysis.tranches.map((t, i) => (
            <ReferenceLine
              key={i}
              x={t.month}
              stroke="hsl(var(--primary))"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
              label={{ value: `T${t.index}`, position: "top", fill: "hsl(var(--primary))", fontSize: 10 }}
            />
          ))}
          <Area
            type="monotone"
            dataKey="withFunding"
            name="With Funding"
            stroke="hsl(var(--chart-1))"
            fill="url(#gradWithFunding)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="withoutFunding"
            name="Without Funding"
            stroke="hsl(var(--chart-4))"
            fill="url(#gradWithout)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
