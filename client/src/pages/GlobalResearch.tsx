import { useState, useRef, useCallback } from "react";
import { useExportSave } from "@/hooks/useExportSave";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useMarketResearch, useGlobalAssumptions } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { ExportToolbar } from "@/components/ui/export-toolbar";
import { Loader2, ArrowLeft } from "@/components/icons/themed-icons";
import { IconRefreshCw, IconGlobe, IconTrendingUp, IconHotel, IconDollarSign, IconLandmark, IconSparkles, IconBookOpen, IconAlertTriangle, IconFileDown } from "@/components/icons";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { downloadResearchPDF } from "@/lib/exports/researchPdfExport";
import { useToast } from "@/hooks/use-toast";
import { AnimatedPage } from "@/components/graphics/AnimatedPage";
import { fireResearchConfetti } from "@/lib/confetti";

const sectionColors = {
  industry: { accent: "hsl(var(--chart-2))", bg: "bg-emerald-50", border: "border-emerald-200", iconBg: "bg-emerald-100", iconText: "text-emerald-700" },
  events: { accent: "#D97706", bg: "bg-amber-50", border: "border-amber-200", iconBg: "bg-amber-100", iconText: "text-amber-700" },
  financial: { accent: "#3B82F6", bg: "bg-blue-50", border: "border-blue-200", iconBg: "bg-blue-100", iconText: "text-blue-700" },
  debt: { accent: "#0891B2", bg: "bg-cyan-50", border: "border-cyan-200", iconBg: "bg-cyan-100", iconText: "text-cyan-700" },
  regulatory: { accent: "#DC2626", bg: "bg-red-50", border: "border-red-200", iconBg: "bg-red-100", iconText: "text-red-700" },
  sources: { accent: "#6B7280", bg: "bg-muted", border: "border-border", iconBg: "bg-muted", iconText: "text-muted-foreground" },
};

function MetricCard({ label, value, color }: { label: string; value: string; color: typeof sectionColors.industry }) {
  return (
    <AnimatedPage>
    <div className={`rounded-lg p-4 border ${color.border} ${color.bg}`}>
      <p className="text-xs font-medium uppercase tracking-wider mb-1.5 text-muted-foreground">{label}</p>
      <p className="text-base font-semibold text-foreground">{value}</p>
    </div>
    </AnimatedPage>
  );
}

function SectionCard({ icon: Icon, title, color, children }: { icon: any; title: string; color: typeof sectionColors.industry; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border" style={{ borderLeftWidth: 4, borderLeftColor: color.accent }}>
        <div className={`w-9 h-9 rounded-lg ${color.iconBg} flex items-center justify-center`}>
          <Icon className={`w-[18px] h-[18px] ${color.iconText}`} />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function GlobalResearch() {
  const { data: global } = useGlobalAssumptions();
  const { data: research, isLoading, isError } = useMarketResearch("global");
  const [, setLocation] = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const { requestSave, SaveDialog } = useExportSave();
  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const generateResearch = useCallback(async () => {
    setIsGenerating(true);
    setStreamedContent("");
    
    abortRef.current = new AbortController();
    
    try {
      const response = await fetch("/api/research/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "global" }),
        signal: abortRef.current.signal,
      });
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulated += data.content;
                setStreamedContent(accumulated);
              }
              if (data.done) {
                queryClient.invalidateQueries({ queryKey: ["research", "global"] });
                fireResearchConfetti();
              }
            } catch (error) {
              /* incomplete SSE chunk - safely skip */
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Research generation failed:", error);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [queryClient]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <IconAlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-muted-foreground">Failed to load global research. Please try refreshing the page.</p>
        </div>
      </Layout>
    );
  }

  const content = research?.content as any;
  const hasResearch = content && !content.rawResponse;

  return (
    <Layout>
      {SaveDialog}
      <div className="space-y-6">
        <PageHeader
          title="Global Industry Research"
          subtitle={`${global?.propertyLabel || "Boutique hotel"} industry data, event hospitality trends, and financial benchmarks`}
          variant="light"
          backLink="/company/assumptions"
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setLocation("/company/assumptions")}
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={generateResearch}
                disabled={isGenerating}
                variant={isGenerating ? "destructive" : "default"}
                data-testid="button-update-research"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconRefreshCw className="w-4 h-4" />}
                {isGenerating ? "Analyzing..." : "Update Research"}
              </Button>
            </div>
          }
        />

        {research?.updatedAt && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground" data-testid="text-last-updated">
              Last updated: {format(new Date(research.updatedAt), "MMM d, yyyy h:mm a")}
              {research.llmModel && ` · Model: ${research.llmModel}`}
            </span>
            {hasResearch && !isGenerating && (
              <ExportToolbar
                variant="light"
                actions={[
                  {
                    label: "Download PDF",
                    icon: <IconFileDown className="w-3.5 h-3.5" />,
                    onClick: () => requestSave("Global Industry Research", ".pdf", (f) => downloadResearchPDF({
                      type: "global",
                      title: "Global Industry Research",
                      subtitle: `${global?.propertyLabel || "Boutique hotel"} industry data and benchmarks`,
                      content,
                      updatedAt: research?.updatedAt,
                      llmModel: research?.llmModel || undefined,
                      promptConditions: (research as any)?.promptConditions || undefined,
                    }, f)),
                    testId: "button-export-research-pdf",
                  },
                ]}
              />
            )}
          </div>
        )}

        {isGenerating && (
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">Researching global {(global?.propertyLabel || "boutique hotel").toLowerCase()} industry data...</p>
            </div>
            {streamedContent && (
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto bg-muted rounded-lg p-3 border border-border">
                {streamedContent.slice(0, 500)}...
              </pre>
            )}
          </div>
        )}

        {!hasResearch && !isGenerating && (
          <div className="bg-card rounded-lg shadow-sm border border-border p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <IconBookOpen className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-display text-foreground mb-3">No Global Research Yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-lg mx-auto leading-relaxed">
              Generate AI-powered analysis of the {(global?.propertyLabel || "boutique hotel").toLowerCase()} industry — market size, growth trends, event hospitality demand, financial benchmarks, debt market conditions, and regulatory environment.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto mb-8 text-left">
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                <p className="text-xs font-semibold text-emerald-800 mb-1">Industry Trends</p>
                <p className="text-xs text-emerald-700">Market size, growth rates, and emerging segments</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                <p className="text-xs font-semibold text-blue-800 mb-1">Financial Benchmarks</p>
                <p className="text-xs text-blue-700">ADR, occupancy, cap rate, and RevPAR trends</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                <p className="text-xs font-semibold text-amber-800 mb-1">Debt & Regulatory</p>
                <p className="text-xs text-amber-700">Interest rates, LTV ranges, and compliance updates</p>
              </div>
            </div>
            <Button
              onClick={generateResearch}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all h-auto"
            >
              <IconRefreshCw className="w-4 h-4" />
              Generate Research
            </Button>
          </div>
        )}

        {hasResearch && !isGenerating && (
          <div className="space-y-5">
            {content.industryOverview && (
              <SectionCard icon={IconGlobe} title="Industry Overview" color={sectionColors.industry}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <MetricCard label="Market Size" value={content.industryOverview.marketSize || "N/A"} color={sectionColors.industry} />
                  <MetricCard label="Growth Rate" value={content.industryOverview.growthRate || "N/A"} color={sectionColors.industry} />
                  <MetricCard label="Boutique Share" value={content.industryOverview.boutiqueShare || "N/A"} color={sectionColors.industry} />
                </div>
                {content.industryOverview.keyTrends && content.industryOverview.keyTrends.length > 0 && (
                  <div className="bg-muted rounded-lg p-4 border border-border">
                    <h4 className="text-sm font-medium text-foreground mb-2">Key Industry Trends</h4>
                    <ul className="space-y-2">
                      {content.industryOverview.keyTrends.map((t: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5">·</span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </SectionCard>
            )}

            {content.eventHospitality && (
              <SectionCard icon={IconSparkles} title="Event & Experience Hospitality" color={sectionColors.events}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {content.eventHospitality.wellnessRetreats && (
                    <div className="bg-muted rounded-lg p-5 border border-border">
                      <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                        <span className="text-lg">🧘</span> Wellness Retreats
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Market Size</p>
                          <p className="text-foreground leading-relaxed">{content.eventHospitality.wellnessRetreats.marketSize}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Growth</p>
                          <p className="text-emerald-600 leading-relaxed">{content.eventHospitality.wellnessRetreats.growth}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg Rev/Event</p>
                          <p className="text-foreground leading-relaxed">{content.eventHospitality.wellnessRetreats.avgRevPerEvent}</p>
                        </div>
                        {content.eventHospitality.wellnessRetreats.seasonality && (
                          <div className="pt-2 border-t border-border">
                            <p className="text-xs text-muted-foreground leading-relaxed">{content.eventHospitality.wellnessRetreats.seasonality}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {content.eventHospitality.corporateEvents && (
                    <div className="bg-muted rounded-lg p-5 border border-border">
                      <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                        <span className="text-lg">🏢</span> Corporate Events
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Market Size</p>
                          <p className="text-foreground leading-relaxed">{content.eventHospitality.corporateEvents.marketSize}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Growth</p>
                          <p className="text-emerald-600 leading-relaxed">{content.eventHospitality.corporateEvents.growth}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg Rev/Event</p>
                          <p className="text-foreground leading-relaxed">{content.eventHospitality.corporateEvents.avgRevPerEvent}</p>
                        </div>
                        {content.eventHospitality.corporateEvents.trends && content.eventHospitality.corporateEvents.trends.length > 0 && (
                          <div className="pt-2 border-t border-border">
                            <ul className="space-y-1">
                              {content.eventHospitality.corporateEvents.trends.map((t: string, i: number) => (
                                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                  <span className="text-muted-foreground mt-0.5">·</span>
                                  <span className="leading-relaxed">{t}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {content.eventHospitality.yogaRetreats && (
                    <div className="bg-muted rounded-lg p-5 border border-border">
                      <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                        <span className="text-lg">🧘‍♀️</span> Yoga Retreats
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Market Size</p>
                          <p className="text-foreground leading-relaxed">{content.eventHospitality.yogaRetreats.marketSize}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Growth</p>
                          <p className="text-emerald-600 leading-relaxed">{content.eventHospitality.yogaRetreats.growth}</p>
                        </div>
                        {content.eventHospitality.yogaRetreats.demographics && (
                          <div className="pt-2 border-t border-border">
                            <p className="text-xs text-muted-foreground leading-relaxed">{content.eventHospitality.yogaRetreats.demographics}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {content.eventHospitality.relationshipRetreats && (
                    <div className="bg-muted rounded-lg p-5 border border-border">
                      <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                        <span className="text-lg">💑</span> Relationship Retreats
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Market Size</p>
                          <p className="text-foreground leading-relaxed">{content.eventHospitality.relationshipRetreats.marketSize}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Growth</p>
                          <p className="text-emerald-600 leading-relaxed">{content.eventHospitality.relationshipRetreats.growth}</p>
                        </div>
                        {content.eventHospitality.relationshipRetreats.positioning && (
                          <div className="pt-2 border-t border-border">
                            <p className="text-xs text-muted-foreground leading-relaxed">{content.eventHospitality.relationshipRetreats.positioning}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {content.financialBenchmarks && (
              <SectionCard icon={IconTrendingUp} title="Financial Benchmarks" color={sectionColors.financial}>
                {content.financialBenchmarks.adrTrends && content.financialBenchmarks.adrTrends.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-foreground mb-3">ADR Trends</h4>
                    <div className="bg-card rounded-lg border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted border-b border-border">
                            <th className="text-left p-3 text-muted-foreground font-medium">Year</th>
                            <th className="text-right p-3 text-muted-foreground font-medium">National</th>
                            <th className="text-right p-3 text-muted-foreground font-medium">Boutique</th>
                            <th className="text-right p-3 text-muted-foreground font-medium">Luxury</th>
                          </tr>
                        </thead>
                        <tbody>
                          {content.financialBenchmarks.adrTrends.map((r: any, i: number) => (
                            <tr key={i} className="border-b border-border">
                              <td className="p-3 text-foreground">{r.year}</td>
                              <td className="p-3 text-right text-foreground">{r.national}</td>
                              <td className="p-3 text-right text-emerald-600 font-medium">{r.boutique}</td>
                              <td className="p-3 text-right text-foreground">{r.luxury}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {content.financialBenchmarks.occupancyTrends && content.financialBenchmarks.occupancyTrends.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-foreground mb-3">Occupancy Trends</h4>
                    <div className="bg-card rounded-lg border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted border-b border-border">
                            <th className="text-left p-3 text-muted-foreground font-medium">Year</th>
                            <th className="text-right p-3 text-muted-foreground font-medium">National</th>
                            <th className="text-right p-3 text-muted-foreground font-medium">Boutique</th>
                          </tr>
                        </thead>
                        <tbody>
                          {content.financialBenchmarks.occupancyTrends.map((r: any, i: number) => (
                            <tr key={i} className="border-b border-border">
                              <td className="p-3 text-foreground">{r.year}</td>
                              <td className="p-3 text-right text-foreground">{r.national}</td>
                              <td className="p-3 text-right text-emerald-600 font-medium">{r.boutique}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {content.financialBenchmarks.capRates && content.financialBenchmarks.capRates.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">Cap Rates by Segment</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {content.financialBenchmarks.capRates.map((c: any, i: number) => (
                        <div key={i} className="bg-muted rounded-lg p-3 border border-border">
                          <p className="text-xs text-muted-foreground">{c.segment}</p>
                          <p className="text-sm text-foreground font-medium">{c.range}</p>
                          <p className="text-xs text-muted-foreground">{c.trend}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </SectionCard>
            )}

            {content.debtMarket && (
              <SectionCard icon={IconLandmark} title="Debt Market Conditions" color={sectionColors.debt}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricCard label="Current Rates" value={content.debtMarket.currentRates || "N/A"} color={sectionColors.debt} />
                  <MetricCard label="LTV Range" value={content.debtMarket.ltvRange || "N/A"} color={sectionColors.debt} />
                  <MetricCard label="Typical Terms" value={content.debtMarket.terms || "N/A"} color={sectionColors.debt} />
                  <MetricCard label="Outlook" value={content.debtMarket.outlook || "N/A"} color={sectionColors.debt} />
                </div>
              </SectionCard>
            )}

            {content.regulatoryEnvironment && content.regulatoryEnvironment.length > 0 && (
              <SectionCard icon={IconHotel} title="Regulatory Environment" color={sectionColors.regulatory}>
                <ul className="space-y-2">
                  {content.regulatoryEnvironment.map((r: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2 bg-muted rounded-lg p-3 border border-border">
                      <span className="text-primary mt-0.5">·</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {content.sources && content.sources.length > 0 && (
              <SectionCard icon={IconBookOpen} title="Sources" color={sectionColors.sources}>
                <ul className="space-y-1">
                  {content.sources.map((s: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground">· {s}</li>
                  ))}
                </ul>
              </SectionCard>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
