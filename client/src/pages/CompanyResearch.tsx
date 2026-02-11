import { useState, useRef, useCallback } from "react";
import Layout from "@/components/Layout";
import { useMarketResearch } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, RefreshCw, Briefcase, Scale, DollarSign, Users, FileText, BookOpen, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const sectionColors = {
  fees: { accent: "#257D41", bg: "bg-emerald-50", border: "border-emerald-200", iconBg: "bg-emerald-100", iconText: "text-emerald-700" },
  gaap: { accent: "#3B82F6", bg: "bg-blue-50", border: "border-blue-200", iconBg: "bg-blue-100", iconText: "text-blue-700" },
  benchmarks: { accent: "#8B5CF6", bg: "bg-violet-50", border: "border-violet-200", iconBg: "bg-violet-100", iconText: "text-violet-700" },
  compensation: { accent: "#D97706", bg: "bg-amber-50", border: "border-amber-200", iconBg: "bg-amber-100", iconText: "text-amber-700" },
  contracts: { accent: "#0891B2", bg: "bg-cyan-50", border: "border-cyan-200", iconBg: "bg-cyan-100", iconText: "text-cyan-700" },
  sources: { accent: "#6B7280", bg: "bg-gray-50", border: "border-gray-200", iconBg: "bg-gray-100", iconText: "text-gray-600" },
};

function MetricCard({ label, value, color }: { label: string; value: string; color: typeof sectionColors.fees }) {
  return (
    <div className={`rounded-xl p-4 border ${color.border} ${color.bg}`}>
      <p className="text-xs font-medium uppercase tracking-wider mb-1.5 text-gray-500">{label}</p>
      <p className="text-base font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function SectionCard({ icon: Icon, title, color, children }: { icon: any; title: string; color: typeof sectionColors.fees; children: React.ReactNode }) {
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

export default function CompanyResearch() {
  const { data: research, isLoading } = useMarketResearch("company");
  const [, setLocation] = useLocation();
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
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
          variant="light"
          backLink="/company/assumptions"
          actions={
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLocation("/company/assumptions")}
                data-testid="button-back"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={generateResearch}
                disabled={isGenerating}
                data-testid="button-update-research"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-70"
                style={isGenerating
                  ? { backgroundColor: '#F4795B' }
                  : { backgroundColor: '#9FBCA4' }
                }
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {isGenerating ? "Analyzing..." : "Update Research"}
              </button>
            </div>
          }
        />

        {research?.updatedAt && (
          <p className="text-xs text-gray-400 text-right" data-testid="text-last-updated">
            Last updated: {format(new Date(research.updatedAt), "MMM d, yyyy h:mm a")}
            {research.llmModel && ` · Model: ${research.llmModel}`}
          </p>
        )}

        {isGenerating && (
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
              </div>
              <p className="text-gray-600 text-sm font-medium">Researching management company standards and benchmarks...</p>
            </div>
            {streamedContent && (
              <pre className="text-xs text-gray-500 whitespace-pre-wrap max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-3 border border-gray-200">
                {streamedContent.slice(0, 500)}...
              </pre>
            )}
          </div>
        )}

        {!hasResearch && !isGenerating && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Research Data Yet</h3>
            <p className="text-sm text-gray-500 mb-6">Click "Update Research" to generate AI-powered management company analysis.</p>
          </div>
        )}

        {hasResearch && !isGenerating && (
          <>
            {content.managementFees && (
              <SectionCard icon={DollarSign} title="Management Fee Research" color={sectionColors.fees}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {content.managementFees.baseFee && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Base Management Fee</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <MetricCard label="Industry Range" value={content.managementFees.baseFee.industryRange || "N/A"} color={sectionColors.fees} />
                        <MetricCard label="Boutique Range" value={content.managementFees.baseFee.boutiqueRange || "N/A"} color={sectionColors.fees} />
                      </div>
                      <MetricCard label="Recommended" value={content.managementFees.baseFee.recommended || "N/A"} color={sectionColors.fees} />
                      {content.managementFees.baseFee.gaapReference && (
                        <p className="text-xs text-blue-700 bg-blue-50 rounded-lg p-3 border border-blue-100">
                          GAAP: {content.managementFees.baseFee.gaapReference}
                        </p>
                      )}
                      {content.managementFees.baseFee.sources && (
                        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left p-2 text-gray-500 font-medium">Source</th>
                                <th className="text-left p-2 text-gray-500 font-medium">Data</th>
                              </tr>
                            </thead>
                            <tbody>
                              {content.managementFees.baseFee.sources.map((s: any, i: number) => (
                                <tr key={i} className="border-b border-gray-50">
                                  <td className="p-2 text-gray-800">{s.source}</td>
                                  <td className="p-2 text-gray-800">{s.data}</td>
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
                      <h4 className="text-sm font-medium text-gray-700">Incentive Management Fee</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <MetricCard label="Industry Range" value={content.managementFees.incentiveFee.industryRange || "N/A"} color={sectionColors.fees} />
                        <MetricCard label="Common Basis" value={content.managementFees.incentiveFee.commonBasis || "N/A"} color={sectionColors.fees} />
                      </div>
                      <MetricCard label="Recommended" value={content.managementFees.incentiveFee.recommended || "N/A"} color={sectionColors.fees} />
                      {content.managementFees.incentiveFee.gaapReference && (
                        <p className="text-xs text-blue-700 bg-blue-50 rounded-lg p-3 border border-blue-100">
                          GAAP: {content.managementFees.incentiveFee.gaapReference}
                        </p>
                      )}
                      {content.managementFees.incentiveFee.sources && (
                        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left p-2 text-gray-500 font-medium">Source</th>
                                <th className="text-left p-2 text-gray-500 font-medium">Data</th>
                              </tr>
                            </thead>
                            <tbody>
                              {content.managementFees.incentiveFee.sources.map((s: any, i: number) => (
                                <tr key={i} className="border-b border-gray-50">
                                  <td className="p-2 text-gray-800">{s.source}</td>
                                  <td className="p-2 text-gray-800">{s.data}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {content.gaapStandards && content.gaapStandards.length > 0 && (
              <SectionCard icon={Scale} title="GAAP Standards & References" color={sectionColors.gaap}>
                <div className="space-y-3">
                  {content.gaapStandards.map((s: any, i: number) => (
                    <div key={i} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-gray-800 font-medium">{s.standard}</p>
                          <p className="text-xs text-gray-500 mt-1">{s.application}</p>
                        </div>
                        <span className="text-xs text-emerald-600 font-mono bg-emerald-50 px-2 py-1 rounded border border-emerald-200 whitespace-nowrap">
                          {s.reference}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {content.industryBenchmarks && (
              <SectionCard icon={Briefcase} title="Industry Benchmarks" color={sectionColors.benchmarks}>
                {content.industryBenchmarks.operatingExpenseRatios && content.industryBenchmarks.operatingExpenseRatios.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Operating Expense Ratios (USALI)</h4>
                    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left p-3 text-gray-500 font-medium">Category</th>
                            <th className="text-right p-3 text-gray-500 font-medium">Range</th>
                            <th className="text-left p-3 text-gray-500 font-medium">Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {content.industryBenchmarks.operatingExpenseRatios.map((r: any, i: number) => (
                            <tr key={i} className="border-b border-gray-50">
                              <td className="p-3 text-gray-800">{r.category}</td>
                              <td className="p-3 text-right text-emerald-600 font-medium">{r.range}</td>
                              <td className="p-3 text-gray-800">{r.source}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {content.industryBenchmarks.revenuePerRoom && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Revenue Per Room by Segment</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <MetricCard label="Economy" value={content.industryBenchmarks.revenuePerRoom.economy || "N/A"} color={sectionColors.benchmarks} />
                      <MetricCard label="Midscale" value={content.industryBenchmarks.revenuePerRoom.midscale || "N/A"} color={sectionColors.benchmarks} />
                      <MetricCard label="Upscale" value={content.industryBenchmarks.revenuePerRoom.upscale || "N/A"} color={sectionColors.benchmarks} />
                      <MetricCard label="Luxury" value={content.industryBenchmarks.revenuePerRoom.luxury || "N/A"} color={sectionColors.benchmarks} />
                    </div>
                  </div>
                )}
              </SectionCard>
            )}

            {content.compensationBenchmarks && (
              <SectionCard icon={Users} title="Compensation Benchmarks" color={sectionColors.compensation}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <MetricCard label="General Manager" value={content.compensationBenchmarks.gm || "N/A"} color={sectionColors.compensation} />
                  <MetricCard label="Director Level" value={content.compensationBenchmarks.director || "N/A"} color={sectionColors.compensation} />
                  <MetricCard label="Manager Level" value={content.compensationBenchmarks.manager || "N/A"} color={sectionColors.compensation} />
                </div>
                {content.compensationBenchmarks.source && (
                  <p className="text-xs text-gray-500">Source: {content.compensationBenchmarks.source}</p>
                )}
              </SectionCard>
            )}

            {content.contractTerms && content.contractTerms.length > 0 && (
              <SectionCard icon={FileText} title="Typical Contract Terms" color={sectionColors.contracts}>
                <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left p-3 text-gray-500 font-medium">Term</th>
                        <th className="text-left p-3 text-gray-500 font-medium">Typical</th>
                        <th className="text-left p-3 text-gray-500 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {content.contractTerms.map((t: any, i: number) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="p-3 text-gray-800 font-medium">{t.term}</td>
                          <td className="p-3 text-emerald-600">{t.typical}</td>
                          <td className="p-3 text-gray-800">{t.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
          </>
        )}
      </div>
    </Layout>
  );
}
