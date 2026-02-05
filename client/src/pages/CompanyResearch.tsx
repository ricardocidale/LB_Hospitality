import { useState, useRef, useCallback } from "react";
import Layout from "@/components/Layout";
import { useMarketResearch } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Loader2, RefreshCw, Briefcase, Scale, DollarSign, Users, FileText, BookOpen } from "lucide-react";
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

export default function CompanyResearch() {
  const { data: research, isLoading } = useMarketResearch("company");
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
        body: JSON.stringify({ type: "company" }),
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
                queryClient.invalidateQueries({ queryKey: ["research", "company"] });
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
          title="Management Company Research"
          subtitle="GAAP standards, fee structures, and industry benchmarks for hotel management"
          variant="dark"
          backLink="/company/assumptions"
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
                <p className="text-white/70 text-sm">Researching management company standards and benchmarks...</p>
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
              <p className="text-sm text-white/50 mb-6">Click "Update Research" to generate AI-powered management company analysis.</p>
            </div>
          </GlassCard>
        )}

        {hasResearch && !isGenerating && (
          <>
            {content.managementFees && (
              <GlassCard>
                <div className="p-6">
                  <SectionHeader icon={DollarSign} title="Management Fee Research" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {content.managementFees.baseFee && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-white/80">Base Management Fee</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <MetricCard label="Industry Range" value={content.managementFees.baseFee.industryRange || "N/A"} />
                          <MetricCard label="Boutique Range" value={content.managementFees.baseFee.boutiqueRange || "N/A"} />
                        </div>
                        <MetricCard label="Recommended" value={content.managementFees.baseFee.recommended || "N/A"} />
                        {content.managementFees.baseFee.gaapReference && (
                          <p className="text-xs text-white/40 bg-white/5 rounded p-2">
                            GAAP: {content.managementFees.baseFee.gaapReference}
                          </p>
                        )}
                        {content.managementFees.baseFee.sources && (
                          <div className="bg-white/5 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-white/10">
                                  <th className="text-left p-2 text-white/50 font-medium">Source</th>
                                  <th className="text-left p-2 text-white/50 font-medium">Data</th>
                                </tr>
                              </thead>
                              <tbody>
                                {content.managementFees.baseFee.sources.map((s: any, i: number) => (
                                  <tr key={i} className="border-b border-white/5">
                                    <td className="p-2 text-white/70">{s.source}</td>
                                    <td className="p-2 text-white/60">{s.data}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {content.managementFees.incentiveFee && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-white/80">Incentive Management Fee</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <MetricCard label="Industry Range" value={content.managementFees.incentiveFee.industryRange || "N/A"} />
                          <MetricCard label="Common Basis" value={content.managementFees.incentiveFee.commonBasis || "N/A"} />
                        </div>
                        <MetricCard label="Recommended" value={content.managementFees.incentiveFee.recommended || "N/A"} />
                        {content.managementFees.incentiveFee.gaapReference && (
                          <p className="text-xs text-white/40 bg-white/5 rounded p-2">
                            GAAP: {content.managementFees.incentiveFee.gaapReference}
                          </p>
                        )}
                        {content.managementFees.incentiveFee.sources && (
                          <div className="bg-white/5 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-white/10">
                                  <th className="text-left p-2 text-white/50 font-medium">Source</th>
                                  <th className="text-left p-2 text-white/50 font-medium">Data</th>
                                </tr>
                              </thead>
                              <tbody>
                                {content.managementFees.incentiveFee.sources.map((s: any, i: number) => (
                                  <tr key={i} className="border-b border-white/5">
                                    <td className="p-2 text-white/70">{s.source}</td>
                                    <td className="p-2 text-white/60">{s.data}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            )}

            {content.gaapStandards && content.gaapStandards.length > 0 && (
              <GlassCard>
                <div className="p-6">
                  <SectionHeader icon={Scale} title="GAAP Standards & References" />
                  <div className="space-y-3">
                    {content.gaapStandards.map((s: any, i: number) => (
                      <div key={i} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm text-white/80 font-medium">{s.standard}</p>
                            <p className="text-xs text-white/50 mt-1">{s.application}</p>
                          </div>
                          <span className="text-xs text-[#9FBCA4] font-mono bg-[#9FBCA4]/10 px-2 py-1 rounded whitespace-nowrap">
                            {s.reference}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            )}

            {content.industryBenchmarks && (
              <GlassCard>
                <div className="p-6">
                  <SectionHeader icon={Briefcase} title="Industry Benchmarks" />
                  
                  {content.industryBenchmarks.operatingExpenseRatios && content.industryBenchmarks.operatingExpenseRatios.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-white/70 mb-3">Operating Expense Ratios (USALI)</h4>
                      <div className="bg-white/5 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left p-3 text-white/50 font-medium">Category</th>
                              <th className="text-right p-3 text-white/50 font-medium">Range</th>
                              <th className="text-left p-3 text-white/50 font-medium">Source</th>
                            </tr>
                          </thead>
                          <tbody>
                            {content.industryBenchmarks.operatingExpenseRatios.map((r: any, i: number) => (
                              <tr key={i} className="border-b border-white/5">
                                <td className="p-3 text-white/80">{r.category}</td>
                                <td className="p-3 text-right text-[#9FBCA4] font-medium">{r.range}</td>
                                <td className="p-3 text-white/60">{r.source}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {content.industryBenchmarks.revenuePerRoom && (
                    <div>
                      <h4 className="text-sm font-medium text-white/70 mb-3">Revenue Per Room by Segment</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <MetricCard label="Economy" value={content.industryBenchmarks.revenuePerRoom.economy || "N/A"} />
                        <MetricCard label="Midscale" value={content.industryBenchmarks.revenuePerRoom.midscale || "N/A"} />
                        <MetricCard label="Upscale" value={content.industryBenchmarks.revenuePerRoom.upscale || "N/A"} />
                        <MetricCard label="Luxury" value={content.industryBenchmarks.revenuePerRoom.luxury || "N/A"} />
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {content.compensationBenchmarks && (
              <GlassCard>
                <div className="p-6">
                  <SectionHeader icon={Users} title="Compensation Benchmarks" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <MetricCard label="General Manager" value={content.compensationBenchmarks.gm || "N/A"} />
                    <MetricCard label="Director Level" value={content.compensationBenchmarks.director || "N/A"} />
                    <MetricCard label="Manager Level" value={content.compensationBenchmarks.manager || "N/A"} />
                  </div>
                  {content.compensationBenchmarks.source && (
                    <p className="text-xs text-white/40">Source: {content.compensationBenchmarks.source}</p>
                  )}
                </div>
              </GlassCard>
            )}

            {content.contractTerms && content.contractTerms.length > 0 && (
              <GlassCard>
                <div className="p-6">
                  <SectionHeader icon={FileText} title="Typical Contract Terms" />
                  <div className="bg-white/5 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left p-3 text-white/50 font-medium">Term</th>
                          <th className="text-left p-3 text-white/50 font-medium">Typical</th>
                          <th className="text-left p-3 text-white/50 font-medium">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {content.contractTerms.map((t: any, i: number) => (
                          <tr key={i} className="border-b border-white/5">
                            <td className="p-3 text-white/80 font-medium">{t.term}</td>
                            <td className="p-3 text-[#9FBCA4]">{t.typical}</td>
                            <td className="p-3 text-white/60">{t.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
