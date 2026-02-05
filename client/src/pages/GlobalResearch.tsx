import { useState, useRef, useCallback } from "react";
import Layout from "@/components/Layout";
import { useMarketResearch } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Loader2, RefreshCw, Globe, TrendingUp, Hotel, DollarSign, Landmark, Sparkles, BookOpen } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

function MetricCard({ label, value, source }: { label: string; value: string; source?: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <p className="text-xs text-white/50 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
      {source && <p className="text-xs text-white/40 mt-1">{source}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-[#9FBCA4]/20 flex items-center justify-center">
        <Icon className="w-4 h-4 text-[#9FBCA4]" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
    </div>
  );
}

export default function GlobalResearch() {
  const { data: research, isLoading } = useMarketResearch("global");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);

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
          <Loader2 className="w-8 h-8 animate-spin text-[#9FBCA4]" />
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
          subtitle="Boutique hotel industry data, event hospitality trends, and financial benchmarks"
          variant="dark"
          backLink="/settings"
          actions={
            <button
              onClick={generateResearch}
              disabled={isGenerating}
              data-testid="button-update-research"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-[#257D41] bg-[#257D41]/10 text-[#9FBCA4] font-semibold hover:bg-[#257D41]/20 transition-colors disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {isGenerating ? "Analyzing..." : "Update Research"}
            </button>
          }
        />

        {research?.updatedAt && (
          <p className="text-xs text-white/40 text-right" data-testid="text-last-updated">
            Last updated: {format(new Date(research.updatedAt), "MMM d, yyyy h:mm a")}
            {research.llmModel && ` · Model: ${research.llmModel}`}
          </p>
        )}

        {isGenerating && (
          <GlassCard>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#9FBCA4]" />
                <p className="text-white/70 text-sm">Researching global boutique hotel industry data...</p>
              </div>
              {streamedContent && (
                <pre className="text-xs text-white/50 whitespace-pre-wrap max-h-40 overflow-y-auto bg-white/5 rounded-lg p-3">
                  {streamedContent.slice(0, 500)}...
                </pre>
              )}
            </div>
          </GlassCard>
        )}

        {!hasResearch && !isGenerating && (
          <GlassCard>
            <div className="p-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto text-white/20 mb-4" />
              <h3 className="text-lg font-semibold text-white/70 mb-2">No Research Data Yet</h3>
              <p className="text-sm text-white/50 mb-6">Click "Update Research" to generate AI-powered global industry analysis.</p>
            </div>
          </GlassCard>
        )}

        {hasResearch && !isGenerating && (
          <>
            {content.industryOverview && (
              <GlassCard>
                <div className="p-6">
                  <SectionHeader icon={Globe} title="Industry Overview" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <MetricCard label="Market Size" value={content.industryOverview.marketSize || "N/A"} />
                    <MetricCard label="Growth Rate" value={content.industryOverview.growthRate || "N/A"} />
                    <MetricCard label="Boutique Share" value={content.industryOverview.boutiqueShare || "N/A"} />
                  </div>
                  {content.industryOverview.keyTrends && content.industryOverview.keyTrends.length > 0 && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-white/70 mb-2">Key Industry Trends</h4>
                      <ul className="space-y-2">
                        {content.industryOverview.keyTrends.map((t: string, i: number) => (
                          <li key={i} className="text-sm text-white/60 flex items-start gap-2">
                            <span className="text-[#9FBCA4] mt-0.5">·</span>
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {content.eventHospitality && (
              <GlassCard>
                <div className="p-6">
                  <SectionHeader icon={Sparkles} title="Event & Experience Hospitality" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {content.eventHospitality.wellnessRetreats && (
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                          <span className="text-lg">🧘</span> Wellness Retreats
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-white/50">Market Size</span><span className="text-white/80">{content.eventHospitality.wellnessRetreats.marketSize}</span></div>
                          <div className="flex justify-between"><span className="text-white/50">Growth</span><span className="text-[#9FBCA4]">{content.eventHospitality.wellnessRetreats.growth}</span></div>
                          <div className="flex justify-between"><span className="text-white/50">Avg Rev/Event</span><span className="text-white/80">{content.eventHospitality.wellnessRetreats.avgRevPerEvent}</span></div>
                          {content.eventHospitality.wellnessRetreats.seasonality && (
                            <p className="text-xs text-white/40 mt-2">{content.eventHospitality.wellnessRetreats.seasonality}</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {content.eventHospitality.corporateEvents && (
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                          <span className="text-lg">🏢</span> Corporate Events
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-white/50">Market Size</span><span className="text-white/80">{content.eventHospitality.corporateEvents.marketSize}</span></div>
                          <div className="flex justify-between"><span className="text-white/50">Growth</span><span className="text-[#9FBCA4]">{content.eventHospitality.corporateEvents.growth}</span></div>
                          <div className="flex justify-between"><span className="text-white/50">Avg Rev/Event</span><span className="text-white/80">{content.eventHospitality.corporateEvents.avgRevPerEvent}</span></div>
                          {content.eventHospitality.corporateEvents.trends && (
                            <div className="mt-2">
                              {content.eventHospitality.corporateEvents.trends.map((t: string, i: number) => (
                                <p key={i} className="text-xs text-white/40">· {t}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {content.eventHospitality.yogaRetreats && (
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                          <span className="text-lg">🧘‍♀️</span> Yoga Retreats
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-white/50">Market Size</span><span className="text-white/80">{content.eventHospitality.yogaRetreats.marketSize}</span></div>
                          <div className="flex justify-between"><span className="text-white/50">Growth</span><span className="text-[#9FBCA4]">{content.eventHospitality.yogaRetreats.growth}</span></div>
                          {content.eventHospitality.yogaRetreats.demographics && (
                            <p className="text-xs text-white/40 mt-2">{content.eventHospitality.yogaRetreats.demographics}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {content.eventHospitality.relationshipRetreats && (
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                          <span className="text-lg">💑</span> Relationship Retreats
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-white/50">Market Size</span><span className="text-white/80">{content.eventHospitality.relationshipRetreats.marketSize}</span></div>
                          <div className="flex justify-between"><span className="text-white/50">Growth</span><span className="text-[#9FBCA4]">{content.eventHospitality.relationshipRetreats.growth}</span></div>
                          {content.eventHospitality.relationshipRetreats.positioning && (
                            <p className="text-xs text-white/40 mt-2">{content.eventHospitality.relationshipRetreats.positioning}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            )}

            {content.financialBenchmarks && (
              <GlassCard>
                <div className="p-6">
                  <SectionHeader icon={TrendingUp} title="Financial Benchmarks" />
                  
                  {content.financialBenchmarks.adrTrends && content.financialBenchmarks.adrTrends.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-white/70 mb-3">ADR Trends</h4>
                      <div className="bg-white/5 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left p-3 text-white/50 font-medium">Year</th>
                              <th className="text-right p-3 text-white/50 font-medium">National</th>
                              <th className="text-right p-3 text-white/50 font-medium">Boutique</th>
                              <th className="text-right p-3 text-white/50 font-medium">Luxury</th>
                            </tr>
                          </thead>
                          <tbody>
                            {content.financialBenchmarks.adrTrends.map((r: any, i: number) => (
                              <tr key={i} className="border-b border-white/5">
                                <td className="p-3 text-white/80">{r.year}</td>
                                <td className="p-3 text-right text-white/70">{r.national}</td>
                                <td className="p-3 text-right text-[#9FBCA4] font-medium">{r.boutique}</td>
                                <td className="p-3 text-right text-white/70">{r.luxury}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {content.financialBenchmarks.occupancyTrends && content.financialBenchmarks.occupancyTrends.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-white/70 mb-3">Occupancy Trends</h4>
                      <div className="bg-white/5 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left p-3 text-white/50 font-medium">Year</th>
                              <th className="text-right p-3 text-white/50 font-medium">National</th>
                              <th className="text-right p-3 text-white/50 font-medium">Boutique</th>
                            </tr>
                          </thead>
                          <tbody>
                            {content.financialBenchmarks.occupancyTrends.map((r: any, i: number) => (
                              <tr key={i} className="border-b border-white/5">
                                <td className="p-3 text-white/80">{r.year}</td>
                                <td className="p-3 text-right text-white/70">{r.national}</td>
                                <td className="p-3 text-right text-[#9FBCA4] font-medium">{r.boutique}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {content.financialBenchmarks.capRates && content.financialBenchmarks.capRates.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-white/70 mb-3">Cap Rates by Segment</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {content.financialBenchmarks.capRates.map((c: any, i: number) => (
                          <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <p className="text-xs text-white/50">{c.segment}</p>
                            <p className="text-sm text-white/80 font-medium">{c.range}</p>
                            <p className="text-xs text-white/40">{c.trend}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {content.debtMarket && (
              <GlassCard>
                <div className="p-6">
                  <SectionHeader icon={Landmark} title="Debt Market Conditions" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <MetricCard label="Current Rates" value={content.debtMarket.currentRates || "N/A"} />
                    <MetricCard label="LTV Range" value={content.debtMarket.ltvRange || "N/A"} />
                    <MetricCard label="Typical Terms" value={content.debtMarket.terms || "N/A"} />
                    <MetricCard label="Outlook" value={content.debtMarket.outlook || "N/A"} />
                  </div>
                </div>
              </GlassCard>
            )}

            {content.regulatoryEnvironment && content.regulatoryEnvironment.length > 0 && (
              <GlassCard>
                <div className="p-6">
                  <SectionHeader icon={Hotel} title="Regulatory Environment" />
                  <ul className="space-y-2">
                    {content.regulatoryEnvironment.map((r: string, i: number) => (
                      <li key={i} className="text-sm text-white/60 flex items-start gap-2 bg-white/5 rounded-lg p-3">
                        <span className="text-[#9FBCA4] mt-0.5">·</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </GlassCard>
            )}

            {content.sources && content.sources.length > 0 && (
              <GlassCard>
                <div className="p-6">
                  <SectionHeader icon={BookOpen} title="Sources" />
                  <ul className="space-y-1">
                    {content.sources.map((s: string, i: number) => (
                      <li key={i} className="text-xs text-white/50">· {s}</li>
                    ))}
                  </ul>
                </div>
              </GlassCard>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
