import { useMemo } from "react";
import Layout from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { ContentPanel } from "@/components/ui/content-panel";
import { AnimatedPage, ScrollReveal, KPIGrid, InsightPanel, formatCompact } from "@/components/graphics";
import { IconWallet, IconTrending, IconTarget, IconDollarSign, IconCheckCircle, IconAlertTriangle } from "@/components/icons";
import { useProperties, useGlobalAssumptions, useAllFeeCategories } from "@/lib/api";
import { useServiceTemplates } from "@/lib/api/services";
import { useMarketRates } from "@/lib/api/market-rates";
import { generateCompanyProForma, formatMoney } from "@/lib/financialEngine";
import { analyzeFundingNeeds } from "@/lib/financial/funding-predictor";
import { PROJECTION_YEARS } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

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

export default function FundingPredictor({ embedded }: { embedded?: boolean }) {
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
              title="Funding Predictor"
              subtitle={`${fundingLabel} raise analysis for ${global.companyName || 'the management company'}`}
            />
          )}

          <ScrollReveal>
            <KPIGrid
              data-testid="kpi-funding-overview"
              items={[
                { label: "Total Raise Needed", value: analysis.totalRaiseNeeded, format: formatCompact },
                { label: "Tranches", value: analysis.tranches.length, sublabel: `via ${fundingLabel}` },
                { label: "Months to Breakeven", value: analysis.breakevenMonth ?? 0, sublabel: analysis.breakevenMonth !== null ? `Month ${analysis.breakevenMonth}` : "Not within projection" },
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
                  <h3 className="text-lg font-display text-foreground">Investor Thesis</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Why investors fund this management company</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground/80 leading-relaxed" data-testid="text-investor-thesis">
                {analysis.investorThesis}
              </p>
            </ContentPanel>
          </ScrollReveal>

          <ScrollReveal>
            <ContentPanel title="Cash Runway" subtitle="Cumulative cash position with and without funding" data-testid="panel-cash-runway">
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
            </ContentPanel>
          </ScrollReveal>

          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysis.tranches.map((tranche) => (
                <ContentPanel key={tranche.index} data-testid={`card-tranche-${tranche.index}`}>
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
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <ContentPanel data-testid="panel-market-context">
              <div className="flex items-start gap-3 mb-3">
                <IconTrending className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-display text-foreground">Market Context</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Live market rates informing {fundingLabel} terms</p>
                </div>
              </div>

              {marketRates && marketRates.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { key: 'fed_funds', label: 'Fed Funds' },
                    { key: 'sofr', label: 'SOFR' },
                    { key: 'treasury_10y', label: '10Y Treasury' },
                    { key: 'hotel_lending_spread', label: 'Hotel Lending Spread' },
                  ].map(({ key, label }) => {
                    const rate = marketRates.find(r => r.rateKey === key);
                    return (
                      <div key={key} className="rounded-lg bg-muted/50 p-3 border border-border/50" data-testid={`metric-rate-${key}`}>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-lg font-mono font-semibold text-foreground mt-1">
                          {rate?.value !== null && rate?.value !== undefined
                            ? key === 'hotel_lending_spread' ? `${rate.value} bps` : `${Number(rate.value).toFixed(2)}%`
                            : '—'}
                        </p>
                        {rate?.source && (
                          <p className="text-[10px] text-muted-foreground/60 mt-1">{rate.source}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <p className="text-sm text-muted-foreground/80 leading-relaxed" data-testid="text-market-context">
                {analysis.marketContext}
              </p>
            </ContentPanel>
          </ScrollReveal>

          {analysis.tranches.length > 1 && (
            <ScrollReveal>
              <ContentPanel title="Early Money Terms Comparison" data-testid="panel-terms-comparison">
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
                  <h3 className="text-lg font-display text-foreground">Funding Strategy</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Research-backed analysis of the capital raise</p>
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
              title="Key Observations"
              insights={[
                {
                  text: `Monthly burn rate during ramp-up: ${formatMoney(analysis.monthlyBurnRate)}/month`,
                  type: "warning" as const,
                },
                {
                  text: analysis.breakevenMonth !== null
                    ? `Company reaches profitability at month ${analysis.breakevenMonth} with ${analysis.propertiesAtBreakeven} propert${analysis.propertiesAtBreakeven === 1 ? 'y' : 'ies'}`
                    : `Company does not reach breakeven within the ${projectionYears}-year projection`,
                  type: analysis.breakevenMonth !== null ? "positive" as const : "negative" as const,
                },
                {
                  text: `Peak cash deficit without funding: ${formatMoney(analysis.peakCashDeficit)}`,
                  type: "negative" as const,
                },
                {
                  text: analysis.fundingGap <= 0
                    ? `Current ${fundingLabel} funding of ${formatMoney(analysis.currentFunding)} is sufficient (${formatMoney(Math.abs(analysis.fundingGap))} surplus)`
                    : `Current ${fundingLabel} funding of ${formatMoney(analysis.currentFunding)} leaves a ${formatMoney(analysis.fundingGap)} shortfall`,
                  type: analysis.fundingGap <= 0 ? "positive" as const : "negative" as const,
                },
              ]}
            />
          </ScrollReveal>
        </div>
      </AnimatedPage>
    </Wrapper>
  );
}
