import { useState, useMemo, useCallback } from "react";
import Layout from "@/components/Layout";
import { useProperties, useGlobalAssumptions } from "@/lib/api";
import { generatePropertyProForma, formatMoney, getFiscalYearForModelYear } from "@/lib/financialEngine";
import { PROJECTION_YEARS, DEFAULT_EXIT_CAP_RATE, DEFAULT_TAX_RATE, DEFAULT_COMMISSION_RATE } from "@/lib/constants";
import { computeIRR } from "@analytics/returns/irr.js";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Loader2, TrendingUp, TrendingDown, BarChart3, Sliders, Building2, ArrowUpDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AnimatedPage, ScrollReveal, InsightPanel, type Insight } from "@/components/graphics";

interface SensitivityVariable {
  id: string;
  label: string;
  unit: "%" | "$" | "x";
  step: number;
  range: [number, number];
  defaultValue: number;
  description: string;
}

interface ScenarioResult {
  totalRevenue: number;
  totalNOI: number;
  totalCashFlow: number;
  avgNOIMargin: number;
  exitValue: number;
  irr: number;
}

function calculateIRR(cashFlows: number[]): number {
  const result = computeIRR(cashFlows, 1);
  return result.irr_periodic ?? 0;
}

export default function SensitivityAnalysis({ embedded }: { embedded?: boolean }) {
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: global, isLoading: globalLoading } = useGlobalAssumptions();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});

  const projectionYears = global?.projectionYears ?? PROJECTION_YEARS;
  const projectionMonths = projectionYears * 12;

  const variables: SensitivityVariable[] = useMemo(() => {
    if (!global) return [];
    return [
      {
        id: "occupancy",
        label: "Max Occupancy",
        unit: "%",
        step: 1,
        range: [-20, 20],
        defaultValue: 0,
        description: "Adjust maximum occupancy rate up or down",
      },
      {
        id: "adrGrowth",
        label: "ADR Growth Rate",
        unit: "%",
        step: 0.5,
        range: [-5, 5],
        defaultValue: 0,
        description: "Adjust annual ADR growth rate",
      },
      {
        id: "expenseGrowth",
        label: "Expense Escalation",
        unit: "%",
        step: 0.5,
        range: [-3, 5],
        defaultValue: 0,
        description: "Adjust fixed cost escalation rate",
      },
      {
        id: "exitCapRate",
        label: "Exit Cap Rate",
        unit: "%",
        step: 0.25,
        range: [-3, 3],
        defaultValue: 0,
        description: "Adjust exit cap rate (higher = lower value)",
      },
      {
        id: "inflation",
        label: "Inflation Rate",
        unit: "%",
        step: 0.5,
        range: [-3, 5],
        defaultValue: 0,
        description: "Adjust general inflation rate",
      },
      {
        id: "interestRate",
        label: "Interest Rate",
        unit: "%",
        step: 0.25,
        range: [-3, 5],
        defaultValue: 0,
        description: "Adjust debt financing interest rate",
      },
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

        const lastYearNOI = financials
          .slice(-12)
          .reduce((sum, m) => sum + m.noi, 0);
        const capRate = Math.max(0.01, (prop.exitCapRate ?? global.exitCapRate ?? DEFAULT_EXIT_CAP_RATE) + (overrides.exitCapRate ?? 0) / 100);
        const commissionRate = global.salesCommissionRate ?? global.commissionRate ?? DEFAULT_COMMISSION_RATE;
        const grossExit = lastYearNOI / capRate;
        const netExit = grossExit * (1 - commissionRate);
        const debtAtExit = financials[financials.length - 1]?.debtOutstanding ?? 0;
        const propExitValue = Math.max(0, netExit - debtAtExit);
        exitValue += propExitValue;

        const equity = prop.purchasePrice * (1 - ((prop as any).acquisitionLTV ?? 0));
        totalInitialEquity += equity;
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

  interface TornadoItem {
    name: string;
    positive: number;
    negative: number;
    spread: number;
    upLabel: string;
    downLabel: string;
  }

  const [tornadoMetric, setTornadoMetric] = useState<"noi" | "irr">("irr");

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
      insights.push({
        text: `Base case IRR of ${(baseResult.irr * 100).toFixed(1)}% exceeds typical institutional hurdle rates`,
        type: "positive",
      });
    } else if (baseResult.irr > 0) {
      insights.push({
        text: `Base case IRR is ${(baseResult.irr * 100).toFixed(1)}%`,
        type: "neutral",
      });
    }
    if (baseResult.avgNOIMargin > 30) {
      insights.push({
        text: `Strong NOI margin at ${baseResult.avgNOIMargin.toFixed(1)}% indicates healthy operations`,
        type: "positive",
      });
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
                <Select
                  value={selectedPropertyId}
                  onValueChange={setSelectedPropertyId}
                >
                  <SelectTrigger className="w-[200px] bg-white/10 border-white/20 text-white rounded-xl text-sm backdrop-blur-xl" data-testid="select-property">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
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
              sublabel={
                hasAdjustments
                  ? `${pctChange(adjustedResult.totalRevenue, baseResult.totalRevenue) >= 0 ? "+" : ""}${pctChange(adjustedResult.totalRevenue, baseResult.totalRevenue).toFixed(1)}% vs. base`
                  : `${projectionYears}-year total`
              }
              trend={
                hasAdjustments
                  ? pctChange(adjustedResult.totalRevenue, baseResult.totalRevenue) > 0
                    ? "up"
                    : pctChange(adjustedResult.totalRevenue, baseResult.totalRevenue) < 0
                    ? "down"
                    : "neutral"
                  : undefined
              }
              variant="sage"
              data-testid="stat-total-revenue"
            />
            <StatCard
              label="Total NOI"
              value={adjustedResult.totalNOI}
              format="money"
              sublabel={
                hasAdjustments
                  ? `${pctChange(adjustedResult.totalNOI, baseResult.totalNOI) >= 0 ? "+" : ""}${pctChange(adjustedResult.totalNOI, baseResult.totalNOI).toFixed(1)}% vs. base`
                  : `${adjustedResult.avgNOIMargin.toFixed(1)}% margin`
              }
              trend={
                hasAdjustments
                  ? pctChange(adjustedResult.totalNOI, baseResult.totalNOI) > 0
                    ? "up"
                    : pctChange(adjustedResult.totalNOI, baseResult.totalNOI) < 0
                    ? "down"
                    : "neutral"
                  : undefined
              }
              variant="sage"
              data-testid="stat-total-noi"
            />
            <StatCard
              label="Total Cash Flow"
              value={adjustedResult.totalCashFlow}
              format="money"
              sublabel={
                hasAdjustments
                  ? `${pctChange(adjustedResult.totalCashFlow, baseResult.totalCashFlow) >= 0 ? "+" : ""}${pctChange(adjustedResult.totalCashFlow, baseResult.totalCashFlow).toFixed(1)}% vs. base`
                  : `${projectionYears}-year total`
              }
              trend={
                hasAdjustments
                  ? pctChange(adjustedResult.totalCashFlow, baseResult.totalCashFlow) > 0
                    ? "up"
                    : pctChange(adjustedResult.totalCashFlow, baseResult.totalCashFlow) < 0
                    ? "down"
                    : "neutral"
                  : undefined
              }
              variant="sage"
              data-testid="stat-total-cashflow"
            />
            <StatCard
              label="Exit Value"
              value={adjustedResult.exitValue}
              format="money"
              sublabel={
                hasAdjustments
                  ? `${pctChange(adjustedResult.exitValue, baseResult.exitValue) >= 0 ? "+" : ""}${pctChange(adjustedResult.exitValue, baseResult.exitValue).toFixed(1)}% vs. base`
                  : "Net to equity"
              }
              trend={
                hasAdjustments
                  ? pctChange(adjustedResult.exitValue, baseResult.exitValue) > 0
                    ? "up"
                    : pctChange(adjustedResult.exitValue, baseResult.exitValue) < 0
                    ? "down"
                    : "neutral"
                  : undefined
              }
              variant="sage"
              data-testid="stat-exit-value"
            />
            <StatCard
              label="Levered IRR"
              value={`${(adjustedResult.irr * 100).toFixed(1)}%`}
              format="text"
              sublabel={
                hasAdjustments
                  ? `${((adjustedResult.irr - baseResult.irr) * 100) >= 0 ? "+" : ""}${((adjustedResult.irr - baseResult.irr) * 100).toFixed(1)}pp vs. base`
                  : "Equity return rate"
              }
              trend={
                hasAdjustments
                  ? adjustedResult.irr > baseResult.irr
                    ? "up"
                    : adjustedResult.irr < baseResult.irr
                    ? "down"
                    : "neutral"
                  : undefined
              }
              variant="sage"
              data-testid="stat-irr"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sliders Panel */}
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 border border-primary/30 shadow-xl shadow-black/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Sliders className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-gray-900" data-testid="text-adjustments-title">
                  Variable Adjustments
                </h3>
                <p className="text-xs text-gray-500">
                  Drag sliders to model different scenarios
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {variables.map((v) => {
                const currentVal = adjustments[v.id] ?? v.defaultValue;
                return (
                  <div key={v.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        {v.label}
                      </label>
                      <span
                        className={`text-sm font-mono font-bold px-2 py-0.5 rounded-md ${
                          currentVal > 0
                            ? "text-secondary bg-primary/15"
                            : currentVal < 0
                            ? "text-red-600 bg-red-50"
                            : "text-gray-500 bg-gray-100"
                        }`}
                        data-testid={`value-${v.id}`}
                      >
                        {currentVal > 0 ? "+" : ""}
                        {currentVal.toFixed(v.step < 1 ? 1 : 0)}
                        {v.unit === "%" ? "pp" : v.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-10 text-right font-mono">
                        {v.range[0]}
                      </span>
                      <div className="flex-1 relative">
                        <input
                          type="range"
                          min={v.range[0]}
                          max={v.range[1]}
                          step={v.step}
                          value={currentVal}
                          onChange={(e) =>
                            setAdjustments((prev) => ({
                              ...prev,
                              [v.id]: parseFloat(e.target.value),
                            }))
                          }
                          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary bg-gray-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-secondary [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-secondary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-grab"
                          data-testid={`slider-${v.id}`}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-10 font-mono">
                        {v.range[1] > 0 ? "+" : ""}{v.range[1]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{v.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tornado Chart Panel */}
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 border border-primary/30 shadow-xl shadow-black/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-display font-bold text-gray-900" data-testid="text-tornado-title">
                    Impact on {tornadoMetric === "irr" ? "IRR" : "NOI"}
                  </h3>
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                    <button
                      onClick={() => setTornadoMetric("irr")}
                      className={`px-2.5 py-1 font-medium transition-colors ${tornadoMetric === "irr" ? "bg-primary/20 text-secondary" : "text-gray-500 hover:text-gray-700"}`}
                      data-testid="button-tornado-irr"
                    >
                      IRR
                    </button>
                    <button
                      onClick={() => setTornadoMetric("noi")}
                      className={`px-2.5 py-1 font-medium transition-colors ${tornadoMetric === "noi" ? "bg-primary/20 text-secondary" : "text-gray-500 hover:text-gray-700"}`}
                      data-testid="button-tornado-noi"
                    >
                      NOI
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {tornadoMetric === "irr" ? "Which variables have the biggest effect on Levered IRR (pp change)" : "Which variables have the biggest effect on Net Operating Income (% change)"}
                </p>
              </div>
            </div>

            {tornadoData.length > 0 ? (
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={tornadoData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(val) => `${val > 0 ? "+" : ""}${val.toFixed(1)}%`}
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      domain={["auto", "auto"]}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "#374151", fontWeight: 500 }}
                      width={130}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value > 0 ? "+" : ""}${value.toFixed(2)}${tornadoMetric === "irr" ? "pp" : "%"}`,
                        name === "positive" ? "Upside" : "Downside",
                      ]}
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.95)",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <ReferenceLine x={0} stroke="#374151" strokeWidth={1.5} />
                    <Bar dataKey="positive" stackId="tornado" radius={[0, 4, 4, 0]} maxBarSize={28}>
                      {tornadoData.map((_, i) => (
                        <Cell key={`pos-${i}`} fill="#257D41" fillOpacity={0.8} />
                      ))}
                    </Bar>
                    <Bar dataKey="negative" stackId="tornado" radius={[4, 0, 0, 4]} maxBarSize={28}>
                      {tornadoData.map((_, i) => (
                        <Cell key={`neg-${i}`} fill="#E85D4A" fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-gray-400 text-sm">
                No data available
              </div>
            )}
            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-secondary/80" />
                <span>Upside scenario</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-[#E85D4A]/80" />
                <span>Downside scenario</span>
              </div>
            </div>
          </div>
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

        {/* Comparison Table */}
        {hasAdjustments && baseResult && adjustedResult && (
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 border border-primary/30 shadow-xl shadow-black/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <ArrowUpDown className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-gray-900" data-testid="text-comparison-title">
                  Base vs. Adjusted Scenario
                </h3>
                <p className="text-xs text-gray-500">
                  Side-by-side comparison of your current adjustments
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-comparison">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Metric</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Base Case</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Adjusted</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Total Revenue", base: baseResult.totalRevenue, adj: adjustedResult.totalRevenue, fmt: "money" as const },
                    { label: "Total NOI", base: baseResult.totalNOI, adj: adjustedResult.totalNOI, fmt: "money" as const },
                    { label: "NOI Margin", base: baseResult.avgNOIMargin, adj: adjustedResult.avgNOIMargin, fmt: "pct" as const },
                    { label: "Total Cash Flow", base: baseResult.totalCashFlow, adj: adjustedResult.totalCashFlow, fmt: "money" as const },
                    { label: "Exit Value", base: baseResult.exitValue, adj: adjustedResult.exitValue, fmt: "money" as const },
                    { label: "Levered IRR", base: baseResult.irr * 100, adj: adjustedResult.irr * 100, fmt: "pct" as const },
                  ].map((row) => {
                    const delta = row.adj - row.base;
                    const deltaPct = row.base !== 0 ? (delta / Math.abs(row.base)) * 100 : 0;
                    return (
                      <tr key={row.label} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-800">{row.label}</td>
                        <td className="py-3 px-4 text-right font-mono text-gray-600">
                          {row.fmt === "money" ? formatMoney(row.base) : `${row.base.toFixed(1)}%`}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900">
                          {row.fmt === "money" ? formatMoney(row.adj) : `${row.adj.toFixed(1)}%`}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-semibold ${
                          delta > 0 ? "text-secondary" : delta < 0 ? "text-red-600" : "text-gray-400"
                        }`}>
                          <div className="flex items-center justify-end gap-1">
                            {delta > 0 ? (
                              <TrendingUp className="w-3.5 h-3.5" />
                            ) : delta < 0 ? (
                              <TrendingDown className="w-3.5 h-3.5" />
                            ) : null}
                            <span>
                              {row.fmt === "money"
                                ? `${delta >= 0 ? "+" : ""}${formatMoney(delta)}`
                                : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}pp`}
                            </span>
                            <span className="text-xs text-gray-400 ml-1">
                              ({deltaPct >= 0 ? "+" : ""}{deltaPct.toFixed(1)}%)
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      </AnimatedPage>
    </Wrapper>
  );
}
