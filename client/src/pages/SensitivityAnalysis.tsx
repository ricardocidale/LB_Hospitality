import { useState, useMemo, useCallback } from "react";
import Layout from "@/components/Layout";
import { useProperties, useGlobalAssumptions } from "@/lib/api";
import { generatePropertyProForma, formatMoney } from "@/lib/financialEngine";
import { PROJECTION_YEARS, DEFAULT_EXIT_CAP_RATE, DEFAULT_COMMISSION_RATE } from "@/lib/constants";
import { computeIRR } from "@analytics/returns/irr.js";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Loader2, Sliders } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AnimatedPage, ScrollReveal, InsightPanel, type Insight } from "@/components/graphics";
import { VariableSlidersPanel, TornadoChartPanel, SensitivityComparisonTable, type SensitivityVariable, type ScenarioResult, type TornadoItem } from "@/components/sensitivity";

function calculateIRR(cashFlows: number[]): number {
  const result = computeIRR(cashFlows, 1);
  return result.irr_periodic ?? 0;
}

export default function SensitivityAnalysis({ embedded }: { embedded?: boolean }) {
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: global, isLoading: globalLoading } = useGlobalAssumptions();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [tornadoMetric, setTornadoMetric] = useState<"noi" | "irr">("irr");

  const projectionYears = global?.projectionYears ?? PROJECTION_YEARS;
  const projectionMonths = projectionYears * 12;

  const variables: SensitivityVariable[] = useMemo(() => {
    if (!global) return [];
    return [
      { id: "occupancy", label: "Max Occupancy", unit: "%", step: 1, range: [-20, 20], defaultValue: 0, description: "Adjust maximum occupancy rate up or down" },
      { id: "adrGrowth", label: "ADR Growth Rate", unit: "%", step: 0.5, range: [-5, 5], defaultValue: 0, description: "Adjust annual ADR growth rate" },
      { id: "expenseGrowth", label: "Expense Escalation", unit: "%", step: 0.5, range: [-3, 5], defaultValue: 0, description: "Adjust fixed cost escalation rate" },
      { id: "exitCapRate", label: "Exit Cap Rate", unit: "%", step: 0.25, range: [-3, 3], defaultValue: 0, description: "Adjust exit cap rate (higher = lower value)" },
      { id: "inflation", label: "Inflation Rate", unit: "%", step: 0.5, range: [-3, 5], defaultValue: 0, description: "Adjust general inflation rate" },
      { id: "interestRate", label: "Interest Rate", unit: "%", step: 0.25, range: [-3, 5], defaultValue: 0, description: "Adjust debt financing interest rate" },
    ];
  }, [global]);

  const resetAll = useCallback(() => setAdjustments({}), []);

  const runScenario = useCallback(
    (overrides: Record<string, number>): ScenarioResult | null => {
      if (!properties || !global) return null;
      const targetProps =
        selectedPropertyId === "all"
          ? properties
          : properties.filter((p) => String(p.id) === selectedPropertyId);
      if (!targetProps.length) return null;

      let totalRevenue = 0;
      let totalNOI = 0;
      let totalCashFlow = 0;
      let exitValue = 0;
      let totalInitialEquity = 0;
      const annualCashFlows: number[] = new Array(projectionYears).fill(0);

      for (const prop of targetProps) {
        const adjProp = {
          ...prop,
          maxOccupancy: Math.min(1, Math.max(0.1, prop.maxOccupancy + (overrides.occupancy ?? 0) / 100)),
          startOccupancy: Math.min(
            Math.min(1, Math.max(0.1, prop.maxOccupancy + (overrides.occupancy ?? 0) / 100)),
            prop.startOccupancy
          ),
          adrGrowthRate: Math.max(0, prop.adrGrowthRate + (overrides.adrGrowth ?? 0) / 100),
          interestRate: Math.max(0.005, ((prop as any).interestRate ?? 0.065) + (overrides.interestRate ?? 0) / 100),
        };

        const adjGlobal = {
          ...global,
          inflationRate: Math.max(0, global.inflationRate + (overrides.inflation ?? 0) / 100),
          fixedCostEscalationRate: Math.max(
            0,
            (global.fixedCostEscalationRate ?? 0.03) + (overrides.expenseGrowth ?? 0) / 100
          ),
        };

        const financials = generatePropertyProForma(adjProp, adjGlobal, projectionMonths);

        for (let i = 0; i < financials.length; i++) {
          const m = financials[i];
          totalRevenue += m.revenueTotal;
          totalNOI += m.noi;
          totalCashFlow += m.cashFlow;
          const yearIdx = Math.floor(i / 12);
          if (yearIdx < projectionYears) {
            annualCashFlows[yearIdx] += m.cashFlow;
          }
        }

        const lastYearNOI = financials.slice(-12).reduce((sum, m) => sum + m.noi, 0);
        const capRate = Math.max(0.01, (prop.exitCapRate ?? global.exitCapRate ?? DEFAULT_EXIT_CAP_RATE) + (overrides.exitCapRate ?? 0) / 100);
        const commissionRate = prop.dispositionCommission ?? DEFAULT_COMMISSION_RATE;
        const grossExit = lastYearNOI / capRate;
        const netExit = grossExit * (1 - commissionRate);
        const debtAtExit = financials[financials.length - 1]?.debtOutstanding ?? 0;
        exitValue += Math.max(0, netExit - debtAtExit);

        totalInitialEquity += prop.purchasePrice * (1 - ((prop as any).acquisitionLTV ?? 0));
      }

      const irrFlows = [-totalInitialEquity, ...annualCashFlows];
      irrFlows[irrFlows.length - 1] += exitValue;
      const irr = totalInitialEquity > 0 ? calculateIRR(irrFlows) : 0;
      const avgNOIMargin = totalRevenue > 0 ? (totalNOI / totalRevenue) * 100 : 0;
      return { totalRevenue, totalNOI, totalCashFlow, avgNOIMargin, exitValue, irr };
    },
    [properties, global, selectedPropertyId, projectionMonths]
  );

  const baseResult = useMemo(() => runScenario({}), [runScenario]);
  const adjustedResult = useMemo(() => runScenario(adjustments), [runScenario, adjustments]);

  const tornadoData: TornadoItem[] = useMemo(() => {
    if (!baseResult || !variables.length) return [];
    const items: TornadoItem[] = [];
    for (const v of variables) {
      const swingPct = v.id === "exitCapRate" ? 2 : v.id === "occupancy" ? 10 : v.id === "interestRate" ? 2 : 3;
      const upResult = runScenario({ [v.id]: swingPct });
      const downResult = runScenario({ [v.id]: -swingPct });
      if (!upResult || !downResult) continue;

      let upDelta: number, downDelta: number;
      if (tornadoMetric === "irr") {
        upDelta = (upResult.irr - baseResult.irr) * 100;
        downDelta = (downResult.irr - baseResult.irr) * 100;
      } else {
        const baseNOI = baseResult.totalNOI;
        upDelta = ((upResult.totalNOI - baseNOI) / Math.abs(baseNOI)) * 100;
        downDelta = ((downResult.totalNOI - baseNOI) / Math.abs(baseNOI)) * 100;
      }

      items.push({
        name: v.label,
        positive: Math.max(upDelta, downDelta),
        negative: Math.min(upDelta, downDelta),
        spread: Math.abs(upDelta - downDelta),
        upLabel: `+${swingPct}${v.unit === "%" ? "pp" : ""}`,
        downLabel: `-${swingPct}${v.unit === "%" ? "pp" : ""}`,
      });
    }
    return items.sort((a, b) => b.spread - a.spread);
  }, [baseResult, variables, runScenario, tornadoMetric]);

  const hasAdjustments = Object.values(adjustments).some((v) => v !== 0);

  const pctChange = (adjusted: number, base: number) => {
    if (base === 0) return 0;
    return ((adjusted - base) / Math.abs(base)) * 100;
  };

  const Wrapper = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : Layout;

  if (propertiesLoading || globalLoading) {
    return (
      <Wrapper>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loading-spinner" />
        </div>
      </Wrapper>
    );
  }

  if (!properties?.length || !global) {
    return (
      <Wrapper>
        <PageHeader title="Sensitivity Analysis" subtitle="Add properties to your portfolio first" />
      </Wrapper>
    );
  }

  const sensitivityInsights: Insight[] = (() => {
    if (!tornadoData.length || !baseResult) return [];
    const insights: Insight[] = [];
    const topVar = tornadoData[0];
    if (topVar) {
      insights.push({
        text: `${topVar.name} has the largest impact on ${tornadoMetric === "irr" ? "IRR" : "NOI"} with a spread of ${topVar.spread.toFixed(1)}${tornadoMetric === "irr" ? "pp" : "%"}`,
        type: "warning",
        metric: `±${(topVar.spread / 2).toFixed(1)}${tornadoMetric === "irr" ? "pp" : "%"}`,
      });
    }
    if (baseResult.irr > 0.15) {
      insights.push({ text: `Base case IRR of ${(baseResult.irr * 100).toFixed(1)}% exceeds typical institutional hurdle rates`, type: "positive" });
    } else if (baseResult.irr > 0) {
      insights.push({ text: `Base case IRR is ${(baseResult.irr * 100).toFixed(1)}%`, type: "neutral" });
    }
    if (baseResult.avgNOIMargin > 30) {
      insights.push({ text: `Strong NOI margin at ${baseResult.avgNOIMargin.toFixed(1)}% indicates healthy operations`, type: "positive" });
    }
    return insights;
  })();

  return (
    <Wrapper>
      <AnimatedPage>
        <div className="space-y-6">
          {!embedded && (
            <PageHeader
              title="Sensitivity Analysis"
              subtitle="See how changes in key variables affect your portfolio's financial performance"
              actions={
                <div className="flex items-center gap-3">
                  <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                    <SelectTrigger className="w-[200px] bg-white border-gray-200 text-gray-900 rounded-lg text-sm" data-testid="select-property">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      {properties.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {hasAdjustments && (
                    <button
                      onClick={resetAll}
                      className="px-3 py-2 text-xs font-medium text-white/70 hover:text-white border border-white/20 hover:border-white/40 rounded-xl transition-all"
                      data-testid="button-reset-all"
                    >
                      Reset All
                    </button>
                  )}
                </div>
              }
            />
          )}

          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Sliders className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-1">What is Sensitivity Analysis?</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Sensitivity analysis shows how changes in key assumptions — like occupancy, ADR growth, expense inflation, and exit cap rates — impact your portfolio's financial performance.
                  Use the sliders below to adjust variables up or down and instantly see the effect on revenue, NOI, cash flow, and investor returns (IRR).
                  This helps identify which assumptions have the biggest impact on your investment outcomes.
                </p>
              </div>
            </div>
          </div>

          {baseResult && adjustedResult && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard
                label="Total Revenue"
                value={adjustedResult.totalRevenue}
                format="money"
                sublabel={hasAdjustments ? `${pctChange(adjustedResult.totalRevenue, baseResult.totalRevenue) >= 0 ? "+" : ""}${pctChange(adjustedResult.totalRevenue, baseResult.totalRevenue).toFixed(1)}% vs. base` : `${projectionYears}-year total`}
                trend={hasAdjustments ? pctChange(adjustedResult.totalRevenue, baseResult.totalRevenue) > 0 ? "up" : pctChange(adjustedResult.totalRevenue, baseResult.totalRevenue) < 0 ? "down" : "neutral" : undefined}
                variant="sage"
                data-testid="stat-total-revenue"
              />
              <StatCard
                label="Total NOI"
                value={adjustedResult.totalNOI}
                format="money"
                sublabel={hasAdjustments ? `${pctChange(adjustedResult.totalNOI, baseResult.totalNOI) >= 0 ? "+" : ""}${pctChange(adjustedResult.totalNOI, baseResult.totalNOI).toFixed(1)}% vs. base` : `${adjustedResult.avgNOIMargin.toFixed(1)}% margin`}
                trend={hasAdjustments ? pctChange(adjustedResult.totalNOI, baseResult.totalNOI) > 0 ? "up" : pctChange(adjustedResult.totalNOI, baseResult.totalNOI) < 0 ? "down" : "neutral" : undefined}
                variant="sage"
                data-testid="stat-total-noi"
              />
              <StatCard
                label="Total Cash Flow"
                value={adjustedResult.totalCashFlow}
                format="money"
                sublabel={hasAdjustments ? `${pctChange(adjustedResult.totalCashFlow, baseResult.totalCashFlow) >= 0 ? "+" : ""}${pctChange(adjustedResult.totalCashFlow, baseResult.totalCashFlow).toFixed(1)}% vs. base` : `${projectionYears}-year total`}
                trend={hasAdjustments ? pctChange(adjustedResult.totalCashFlow, baseResult.totalCashFlow) > 0 ? "up" : pctChange(adjustedResult.totalCashFlow, baseResult.totalCashFlow) < 0 ? "down" : "neutral" : undefined}
                variant="sage"
                data-testid="stat-total-cashflow"
              />
              <StatCard
                label="Exit Value"
                value={adjustedResult.exitValue}
                format="money"
                sublabel={hasAdjustments ? `${pctChange(adjustedResult.exitValue, baseResult.exitValue) >= 0 ? "+" : ""}${pctChange(adjustedResult.exitValue, baseResult.exitValue).toFixed(1)}% vs. base` : "Net to equity"}
                trend={hasAdjustments ? pctChange(adjustedResult.exitValue, baseResult.exitValue) > 0 ? "up" : pctChange(adjustedResult.exitValue, baseResult.exitValue) < 0 ? "down" : "neutral" : undefined}
                variant="sage"
                data-testid="stat-exit-value"
              />
              <StatCard
                label="Levered IRR"
                value={`${(adjustedResult.irr * 100).toFixed(1)}%`}
                format="text"
                sublabel={hasAdjustments ? `${((adjustedResult.irr - baseResult.irr) * 100) >= 0 ? "+" : ""}${((adjustedResult.irr - baseResult.irr) * 100).toFixed(1)}pp vs. base` : "Equity return rate"}
                trend={hasAdjustments ? adjustedResult.irr > baseResult.irr ? "up" : adjustedResult.irr < baseResult.irr ? "down" : "neutral" : undefined}
                variant="sage"
                data-testid="stat-irr"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VariableSlidersPanel
              variables={variables}
              adjustments={adjustments}
              onAdjustmentChange={(id, value) => setAdjustments(prev => ({ ...prev, [id]: value }))}
            />
            <TornadoChartPanel
              tornadoData={tornadoData}
              tornadoMetric={tornadoMetric}
              onMetricChange={setTornadoMetric}
            />
          </div>

          {sensitivityInsights.length > 0 && (
            <ScrollReveal>
              <InsightPanel
                data-testid="insight-sensitivity"
                insights={sensitivityInsights}
                title="Sensitivity Insights"
                variant="compact"
              />
            </ScrollReveal>
          )}

          {hasAdjustments && baseResult && adjustedResult && (
            <SensitivityComparisonTable baseResult={baseResult} adjustedResult={adjustedResult} />
          )}
        </div>
      </AnimatedPage>
    </Wrapper>
  );
}
