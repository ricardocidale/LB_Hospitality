import { useState, useRef, useCallback } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useMarketResearch, useGlobalAssumptions } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { ExportToolbar } from "@/components/ui/export-toolbar";
import { Loader2, RefreshCw, Globe, TrendingUp, Hotel, DollarSign, Landmark, Sparkles, BookOpen, ArrowLeft, AlertTriangle, Mail, FileDown } from "lucide-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { downloadResearchPDF, emailResearchPDF } from "@/lib/exports/researchPdfExport";
import { useToast } from "@/hooks/use-toast";

const sectionColors = {
  industry: { accent: "#257D41", bg: "bg-emerald-50", border: "border-emerald-200", iconBg: "bg-emerald-100", iconText: "text-emerald-700" },
  events: { accent: "#D97706", bg: "bg-amber-50", border: "border-amber-200", iconBg: "bg-amber-100", iconText: "text-amber-700" },
  financial: { accent: "#3B82F6", bg: "bg-blue-50", border: "border-blue-200", iconBg: "bg-blue-100", iconText: "text-blue-700" },
  debt: { accent: "#0891B2", bg: "bg-cyan-50", border: "border-cyan-200", iconBg: "bg-cyan-100", iconText: "text-cyan-700" },
  regulatory: { accent: "#DC2626", bg: "bg-red-50", border: "border-red-200", iconBg: "bg-red-100", iconText: "text-red-700" },
  sources: { accent: "#6B7280", bg: "bg-gray-50", border: "border-gray-200", iconBg: "bg-gray-100", iconText: "text-gray-600" },
};

function MetricCard({ label, value, color }: { label: string; value: string; color: typeof sectionColors.industry }) {
  return (
    <div className={`rounded-xl p-4 border ${color.border} ${color.bg}`}>
      <p className="text-xs font-medium uppercase tracking-wider mb-1.5 text-gray-500">{label}</p>
      <p className="text-base font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function SectionCard({ icon: Icon, title, color, children }: { icon: any; title: string; color: typeof sectionColors.industry; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100" style={{ borderLeftWidth: 4, borderLeftColor: color.accent }}>
        <div className={`w-9 h-9 rounded-lg ${color.iconBg} flex items-center justify-center`}>
          <Icon className={`w-[18px] h-[18px] ${color.iconText}`} />
        </div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
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
  const [isEmailing, setIsEmailing] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
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
              }
            } catch {}
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
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-muted-foreground">Failed to load global research. Please try refreshing the page.</p>
        </div>
      </Layout>
    );
  }

  const content = research?.content as any;
  const hasResearch = content && !content.rawResponse;

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Global Industry Research"
          subtitle={`${global?.propertyLabel || "Boutique hotel"} industry data, event hospitality trends, and financial benchmarks`}
          variant="light"
          backLink="/settings"
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setLocation("/settings")}
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
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {isGenerating ? "Analyzing..." : "Update Research"}
              </Button>
            </div>
          }
        />

        {research?.updatedAt && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-400" data-testid="text-last-updated">
              Last updated: {format(new Date(research.updatedAt), "MMM d, yyyy h:mm a")}
              {research.llmModel && ` · Model: ${research.llmModel}`}
            </span>
            {hasResearch && !isGenerating && (
              <ExportToolbar
                variant="light"
                actions={[
                  {
                    label: "Download PDF",
                    icon: <FileDown className="w-3.5 h-3.5" />,
                    onClick: () => downloadResearchPDF({
                      type: "global",
                      title: "Global Industry Research",
                      subtitle: `${global?.propertyLabel || "Boutique hotel"} industry data and benchmarks`,
                      content,
                      updatedAt: research?.updatedAt,
                      llmModel: research?.llmModel || undefined,
                      promptConditions: (research as any)?.promptConditions || undefined,
                    }),
                    testId: "button-export-research-pdf",
                  },
                  {
                    label: isEmailing ? "Sending..." : "Email PDF",
                    icon: <Mail className="w-3.5 h-3.5" />,
                    onClick: async () => {
                      if (isEmailing) return;
                      setIsEmailing(true);
                      try {
                        const result = await emailResearchPDF({
                          type: "global",
                          title: "Global Industry Research",
                          subtitle: `${global?.propertyLabel || "Boutique hotel"} industry data and benchmarks`,
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
        )}

        {isGenerating && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
              </div>
              <p className="text-gray-600 text-sm font-medium">Researching global {(global?.propertyLabel || "boutique hotel").toLowerCase()} industry data...</p>
            </div>
            {streamedContent && (
              <pre className="text-xs text-gray-500 whitespace-pre-wrap max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-3 border border-gray-200">
                {streamedContent.slice(0, 500)}...
              </pre>
            )}
          </div>
        )}

        {!hasResearch && !isGenerating && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Research Data Yet</h3>
            <p className="text-sm text-gray-500 mb-6">Click "Update Research" to generate AI-powered global industry analysis.</p>
          </div>
        )}

        {hasResearch && !isGenerating && (
          <div className="space-y-5">
            {content.industryOverview && (
              <SectionCard icon={Globe} title="Industry Overview" color={sectionColors.industry}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <MetricCard label="Market Size" value={content.industryOverview.marketSize || "N/A"} color={sectionColors.industry} />
                  <MetricCard label="Growth Rate" value={content.industryOverview.growthRate || "N/A"} color={sectionColors.industry} />
                  <MetricCard label="Boutique Share" value={content.industryOverview.boutiqueShare || "N/A"} color={sectionColors.industry} />
                </div>
                {content.industryOverview.keyTrends && content.industryOverview.keyTrends.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Key Industry Trends</h4>
                    <ul className="space-y-2">
                      {content.industryOverview.keyTrends.map((t: string, i: number) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
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
              <SectionCard icon={Sparkles} title="Event & Experience Hospitality" color={sectionColors.events}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {content.eventHospitality.wellnessRetreats && (
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-lg">🧘</span> Wellness Retreats
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Market Size</p>
                          <p className="text-gray-800 leading-relaxed">{content.eventHospitality.wellnessRetreats.marketSize}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Growth</p>
                          <p className="text-emerald-600 leading-relaxed">{content.eventHospitality.wellnessRetreats.growth}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Avg Rev/Event</p>
                          <p className="text-gray-800 leading-relaxed">{content.eventHospitality.wellnessRetreats.avgRevPerEvent}</p>
                        </div>
                        {content.eventHospitality.wellnessRetreats.seasonality && (
                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-500 leading-relaxed">{content.eventHospitality.wellnessRetreats.seasonality}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {content.eventHospitality.corporateEvents && (
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-lg">🏢</span> Corporate Events
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Market Size</p>
                          <p className="text-gray-800 leading-relaxed">{content.eventHospitality.corporateEvents.marketSize}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Growth</p>
                          <p className="text-emerald-600 leading-relaxed">{content.eventHospitality.corporateEvents.growth}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Avg Rev/Event</p>
                          <p className="text-gray-800 leading-relaxed">{content.eventHospitality.corporateEvents.avgRevPerEvent}</p>
                        </div>
                        {content.eventHospitality.corporateEvents.trends && content.eventHospitality.corporateEvents.trends.length > 0 && (
                          <div className="pt-2 border-t border-gray-100">
                            <ul className="space-y-1">
                              {content.eventHospitality.corporateEvents.trends.map((t: string, i: number) => (
                                <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                                  <span className="text-gray-400 mt-0.5">·</span>
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
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-lg">🧘‍♀️</span> Yoga Retreats
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Market Size</p>
                          <p className="text-gray-800 leading-relaxed">{content.eventHospitality.yogaRetreats.marketSize}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Growth</p>
                          <p className="text-emerald-600 leading-relaxed">{content.eventHospitality.yogaRetreats.growth}</p>
                        </div>
                        {content.eventHospitality.yogaRetreats.demographics && (
                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-500 leading-relaxed">{content.eventHospitality.yogaRetreats.demographics}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {content.eventHospitality.relationshipRetreats && (
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-lg">💑</span> Relationship Retreats
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Market Size</p>
                          <p className="text-gray-800 leading-relaxed">{content.eventHospitality.relationshipRetreats.marketSize}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Growth</p>
                          <p className="text-emerald-600 leading-relaxed">{content.eventHospitality.relationshipRetreats.growth}</p>
                        </div>
                        {content.eventHospitality.relationshipRetreats.positioning && (
                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-500 leading-relaxed">{content.eventHospitality.relationshipRetreats.positioning}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {content.financialBenchmarks && (
              <SectionCard icon={TrendingUp} title="Financial Benchmarks" color={sectionColors.financial}>
                {content.financialBenchmarks.adrTrends && content.financialBenchmarks.adrTrends.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">ADR Trends</h4>
                    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left p-3 text-gray-500 font-medium">Year</th>
                            <th className="text-right p-3 text-gray-500 font-medium">National</th>
                            <th className="text-right p-3 text-gray-500 font-medium">Boutique</th>
                            <th className="text-right p-3 text-gray-500 font-medium">Luxury</th>
                          </tr>
                        </thead>
                        <tbody>
                          {content.financialBenchmarks.adrTrends.map((r: any, i: number) => (
                            <tr key={i} className="border-b border-gray-50">
                              <td className="p-3 text-gray-800">{r.year}</td>
                              <td className="p-3 text-right text-gray-800">{r.national}</td>
                              <td className="p-3 text-right text-emerald-600 font-medium">{r.boutique}</td>
                              <td className="p-3 text-right text-gray-800">{r.luxury}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {content.financialBenchmarks.occupancyTrends && content.financialBenchmarks.occupancyTrends.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Occupancy Trends</h4>
                    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left p-3 text-gray-500 font-medium">Year</th>
                            <th className="text-right p-3 text-gray-500 font-medium">National</th>
                            <th className="text-right p-3 text-gray-500 font-medium">Boutique</th>
                          </tr>
                        </thead>
                        <tbody>
                          {content.financialBenchmarks.occupancyTrends.map((r: any, i: number) => (
                            <tr key={i} className="border-b border-gray-50">
                              <td className="p-3 text-gray-800">{r.year}</td>
                              <td className="p-3 text-right text-gray-800">{r.national}</td>
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
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Cap Rates by Segment</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {content.financialBenchmarks.capRates.map((c: any, i: number) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <p className="text-xs text-gray-500">{c.segment}</p>
                          <p className="text-sm text-gray-800 font-medium">{c.range}</p>
                          <p className="text-xs text-gray-400">{c.trend}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </SectionCard>
            )}

            {content.debtMarket && (
              <SectionCard icon={Landmark} title="Debt Market Conditions" color={sectionColors.debt}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricCard label="Current Rates" value={content.debtMarket.currentRates || "N/A"} color={sectionColors.debt} />
                  <MetricCard label="LTV Range" value={content.debtMarket.ltvRange || "N/A"} color={sectionColors.debt} />
                  <MetricCard label="Typical Terms" value={content.debtMarket.terms || "N/A"} color={sectionColors.debt} />
                  <MetricCard label="Outlook" value={content.debtMarket.outlook || "N/A"} color={sectionColors.debt} />
                </div>
              </SectionCard>
            )}

            {content.regulatoryEnvironment && content.regulatoryEnvironment.length > 0 && (
              <SectionCard icon={Hotel} title="Regulatory Environment" color={sectionColors.regulatory}>
                <ul className="space-y-2">
                  {content.regulatoryEnvironment.map((r: string, i: number) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <span className="text-primary mt-0.5">·</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {content.sources && content.sources.length > 0 && (
              <SectionCard icon={BookOpen} title="Sources" color={sectionColors.sources}>
                <ul className="space-y-1">
                  {content.sources.map((s: string, i: number) => (
                    <li key={i} className="text-xs text-gray-500">· {s}</li>
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
