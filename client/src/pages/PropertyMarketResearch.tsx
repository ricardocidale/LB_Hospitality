import { useState, useRef, useCallback } from "react";
import Layout from "@/components/Layout";
import { useProperty, useMarketResearch, useGlobalAssumptions } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { GlassButton } from "@/components/ui/glass-button";
import { Loader2, RefreshCw, MapPin, TrendingUp, Building2, Calendar, Users, AlertTriangle, ExternalLink, BookOpen, Target, Clock, Shield, Mountain, ArrowLeft } from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const sectionColors = {
  market: { accent: "#257D41", bg: "bg-emerald-50", border: "border-emerald-200", iconBg: "bg-emerald-100", iconText: "text-emerald-700", badge: "bg-emerald-100 text-emerald-800" },
  adr: { accent: "#3B82F6", bg: "bg-blue-50", border: "border-blue-200", iconBg: "bg-blue-100", iconText: "text-blue-700", badge: "bg-blue-100 text-blue-800" },
  occupancy: { accent: "#8B5CF6", bg: "bg-violet-50", border: "border-violet-200", iconBg: "bg-violet-100", iconText: "text-violet-700", badge: "bg-violet-100 text-violet-800" },
  events: { accent: "#F4795B", bg: "bg-orange-50", border: "border-orange-200", iconBg: "bg-orange-100", iconText: "text-orange-700", badge: "bg-orange-100 text-orange-800" },
  capRate: { accent: "#0891B2", bg: "bg-cyan-50", border: "border-cyan-200", iconBg: "bg-cyan-100", iconText: "text-cyan-700", badge: "bg-cyan-100 text-cyan-800" },
  competitive: { accent: "#9FBCA4", bg: "bg-emerald-50/50", border: "border-[#9FBCA4]/30", iconBg: "bg-[#9FBCA4]/20", iconText: "text-[#257D41]", badge: "bg-[#9FBCA4]/20 text-[#257D41]" },
  risks: { accent: "#DC2626", bg: "bg-red-50", border: "border-red-200", iconBg: "bg-red-100", iconText: "text-red-700", badge: "bg-red-100 text-red-800" },
  sources: { accent: "#6B7280", bg: "bg-gray-50", border: "border-gray-200", iconBg: "bg-gray-100", iconText: "text-gray-600", badge: "bg-gray-100 text-gray-700" },
  stabilization: { accent: "#D97706", bg: "bg-amber-50", border: "border-amber-200", iconBg: "bg-amber-100", iconText: "text-amber-700", badge: "bg-amber-100 text-amber-800" },
  landValue: { accent: "#78716C", bg: "bg-stone-50", border: "border-stone-200", iconBg: "bg-stone-100", iconText: "text-stone-700", badge: "bg-stone-100 text-stone-800" },
};

function MetricCard({ label, value, source, color }: { label: string; value: string; source?: string; color: typeof sectionColors.market }) {
  return (
    <div className={`rounded-xl p-4 border ${color.border} ${color.bg}`}>
      <p className="text-xs font-medium uppercase tracking-wider mb-1.5 text-gray-500">{label}</p>
      <p className="text-base font-semibold text-gray-900">{value}</p>
      {source && <p className="text-[11px] text-gray-400 mt-1.5 leading-tight">{source}</p>}
    </div>
  );
}

function SectionCard({ icon: Icon, title, color, children }: { icon: any; title: string; color: typeof sectionColors.market; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100" style={{ borderLeftWidth: 4, borderLeftColor: color.accent }}>
        <div className={`w-9 h-9 rounded-lg ${color.iconBg} flex items-center justify-center`}>
          <Icon className={`w-[18px] h-[18px] ${color.iconText}`} />
        </div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

export default function PropertyMarketResearch() {
  const [, params] = useRoute("/property/:id/research");
  const propertyId = parseInt(params?.id || "0");
  const { data: property, isLoading: propertyLoading } = useProperty(propertyId);
  const { data: global } = useGlobalAssumptions();
  const { data: research, isLoading: researchLoading } = useMarketResearch("property", propertyId);
  const [, setLocation] = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);

  const generateResearch = useCallback(async () => {
    if (!property) return;
    setIsGenerating(true);
    setStreamedContent("");
    
    abortRef.current = new AbortController();
    
    try {
      const response = await fetch("/api/research/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "property",
          propertyId: property.id,
          propertyContext: {
            name: property.name,
            location: property.location,
            market: property.market,
            roomCount: property.roomCount,
            startAdr: property.startAdr,
            maxOccupancy: property.maxOccupancy,
            cateringLevel: property.cateringLevel,
            type: property.type,
          },
          boutiqueDefinition: global?.boutiqueDefinition,
        }),
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
                queryClient.invalidateQueries({ queryKey: ["research", "property", propertyId] });
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
  }, [property, global, propertyId, queryClient]);

  if (propertyLoading || researchLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#9FBCA4]" />
        </div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout>
        <div className="text-center py-12 text-white/60">Property not found</div>
      </Layout>
    );
  }

  const content = research?.content as any;
  const hasResearch = content && !content.rawResponse;
  const adrValue = property.startAdr ? Math.round(property.startAdr) : null;
  const propertyLabel = global?.propertyLabel || "boutique hotel";
  const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${propertyLabel.toLowerCase()}s near ${property.location}${adrValue ? ` $${adrValue} ADR` : ""}`)}`;

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title={`Market Research: ${property.name}`}
          subtitle={`${property.location} · ${property.market} · ${property.roomCount} rooms${adrValue ? ` · $${adrValue} ADR` : ""}`}
          variant="dark"
          backLink={`/property/${property.id}/edit`}
          actions={
            <div className="flex items-center gap-3">
              <GlassButton
                variant="ghost"
                onClick={() => setLocation(`/property/${property.id}/edit`)}
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </GlassButton>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-google-maps"
              >
                <GlassButton variant="primary">
                  <MapPin className="w-4 h-4" />
                  Google Maps
                  <ExternalLink className="w-3 h-3" />
                </GlassButton>
              </a>
              <GlassButton
                variant="primary"
                onClick={generateResearch}
                disabled={isGenerating}
                data-testid="button-update-research"
                style={isGenerating ? { background: 'linear-gradient(135deg, #F4795B 0%, #e0694e 50%, #d45a40 100%)', opacity: 1 } : undefined}
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {isGenerating ? "Analyzing..." : "Update Research"}
              </GlassButton>
            </div>
          }
        />

        {research?.updatedAt && (
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-gray-400" data-testid="text-last-updated">
              Last updated: {format(new Date(research.updatedAt), "MMM d, yyyy h:mm a")}
              {research.llmModel && ` · Model: ${research.llmModel}`}
            </span>
          </div>
        )}

        {isGenerating && (
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
              </div>
              <p className="text-gray-600 text-sm font-medium">Analyzing market data for {property.name}...</p>
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
            <p className="text-sm text-gray-500 mb-6">Click "Update Research" to generate AI-powered market analysis for this property.</p>
          </div>
        )}

        {hasResearch && !isGenerating && (
          <div className="space-y-5">
            {content.marketOverview && (
              <SectionCard icon={Building2} title="Market Overview" color={sectionColors.market}>
                <p className="text-sm text-gray-700 leading-relaxed mb-5">{content.marketOverview.summary}</p>
                {content.marketOverview.keyMetrics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {content.marketOverview.keyMetrics.map((m: any, i: number) => (
                      <MetricCard key={i} label={m.label} value={m.value} source={m.source} color={sectionColors.market} />
                    ))}
                  </div>
                )}
              </SectionCard>
            )}

            {content.stabilizationTimeline && (
              <SectionCard icon={Clock} title="Stabilization Timeline" color={sectionColors.stabilization}>
                <p className="text-sm text-gray-700 leading-relaxed mb-5">{content.stabilizationTimeline.summary}</p>
                {content.stabilizationTimeline.phases && content.stabilizationTimeline.phases.length > 0 && (
                  <div className="space-y-3">
                    {content.stabilizationTimeline.phases.map((phase: any, i: number) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center">
                          <span className="text-sm font-bold text-amber-800">{i + 1}</span>
                        </div>
                        <div className="flex-1 rounded-xl bg-amber-50 border border-amber-200 p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900">{phase.phase}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-medium">{phase.duration}</span>
                          </div>
                          <p className="text-sm text-gray-600">{phase.description}</p>
                          {phase.occupancyTarget && (
                            <p className="text-xs text-amber-700 mt-1 font-medium">Target Occupancy: {phase.occupancyTarget}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {content.stabilizationTimeline.totalMonths && (
                  <div className="mt-4 rounded-xl bg-amber-100 border border-amber-300 p-4 text-center">
                    <p className="text-xs text-amber-700 uppercase tracking-wider font-medium mb-1">Estimated Time to Stabilization</p>
                    <p className="text-2xl font-bold text-amber-900">{content.stabilizationTimeline.totalMonths}</p>
                  </div>
                )}
              </SectionCard>
            )}

            {content.adrAnalysis && (
              <SectionCard icon={TrendingUp} title="ADR Analysis" color={sectionColors.adr}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                  <MetricCard label="Market Average ADR" value={content.adrAnalysis.marketAverage || "N/A"} color={sectionColors.adr} />
                  <MetricCard label="Boutique Range" value={content.adrAnalysis.boutiqueRange || "N/A"} color={sectionColors.adr} />
                  <MetricCard label="Recommended Range" value={content.adrAnalysis.recommendedRange || "N/A"} color={sectionColors.adr} />
                </div>
                {content.adrAnalysis.rationale && (
                  <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-400 mb-5">
                    <p className="text-sm text-gray-700 leading-relaxed">{content.adrAnalysis.rationale}</p>
                  </div>
                )}
                {content.adrAnalysis.comparables && content.adrAnalysis.comparables.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Comparable Properties</h4>
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-blue-50/80">
                            <th className="text-left p-3 text-gray-600 font-semibold">Property</th>
                            <th className="text-right p-3 text-gray-600 font-semibold">ADR</th>
                            <th className="text-left p-3 text-gray-600 font-semibold">Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {content.adrAnalysis.comparables.map((c: any, i: number) => (
                            <tr key={i} className="border-t border-gray-100 hover:bg-blue-50/40 transition-colors">
                              <td className="p-3 text-gray-800 font-medium">{c.name}</td>
                              <td className="p-3 text-right font-semibold text-blue-700">{c.adr}</td>
                              <td className="p-3 text-gray-500">{c.type}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </SectionCard>
            )}

            {content.occupancyAnalysis && (
              <SectionCard icon={Calendar} title="Occupancy Analysis" color={sectionColors.occupancy}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                  <MetricCard label="Market Average" value={content.occupancyAnalysis.marketAverage || "N/A"} color={sectionColors.occupancy} />
                  <MetricCard label="Ramp-Up Timeline" value={content.occupancyAnalysis.rampUpTimeline || "N/A"} color={sectionColors.occupancy} />
                </div>
                {content.occupancyAnalysis.seasonalPattern && content.occupancyAnalysis.seasonalPattern.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Seasonal Pattern</h4>
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-violet-50/80">
                            <th className="text-left p-3 text-gray-600 font-semibold">Season</th>
                            <th className="text-right p-3 text-gray-600 font-semibold">Occupancy</th>
                            <th className="text-left p-3 text-gray-600 font-semibold">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {content.occupancyAnalysis.seasonalPattern.map((s: any, i: number) => (
                            <tr key={i} className="border-t border-gray-100 hover:bg-violet-50/40 transition-colors">
                              <td className="p-3 text-gray-800 font-medium">{s.season}</td>
                              <td className="p-3 text-right font-semibold text-violet-700">{s.occupancy}</td>
                              <td className="p-3 text-gray-500">{s.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </SectionCard>
            )}

            {content.eventDemand && (
              <SectionCard icon={Users} title="Event & Experience Demand" color={sectionColors.events}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                  {content.eventDemand.corporateEvents && (
                    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-200 text-orange-800 font-semibold uppercase tracking-wider">Corporate</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{content.eventDemand.corporateEvents}</p>
                    </div>
                  )}
                  {content.eventDemand.exoticEvents && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 font-semibold uppercase tracking-wider">Exotic & Unique</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{content.eventDemand.exoticEvents}</p>
                    </div>
                  )}
                  {content.eventDemand.wellnessRetreats && (
                    <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-200 text-teal-800 font-semibold uppercase tracking-wider">Wellness</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{content.eventDemand.wellnessRetreats}</p>
                    </div>
                  )}
                  {content.eventDemand.weddingsPrivate && (
                    <div className="rounded-xl border border-pink-200 bg-pink-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-pink-200 text-pink-800 font-semibold uppercase tracking-wider">Weddings & Private</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{content.eventDemand.weddingsPrivate}</p>
                    </div>
                  )}
                </div>
                {content.eventDemand.estimatedEventRevShare && (
                  <div className="rounded-xl bg-orange-100 border border-orange-300 p-3 text-center mb-5">
                    <p className="text-xs text-orange-700 uppercase tracking-wider font-medium mb-0.5">Estimated Event Revenue Share</p>
                    <p className="text-lg font-bold text-orange-900">{content.eventDemand.estimatedEventRevShare}</p>
                  </div>
                )}
                {content.eventDemand.keyDrivers && content.eventDemand.keyDrivers.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Key Demand Drivers</h4>
                    <ul className="space-y-2">
                      {content.eventDemand.keyDrivers.map((d: string, i: number) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2.5">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center mt-0.5">
                            <span className="text-xs font-bold text-orange-700">{i + 1}</span>
                          </span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </SectionCard>
            )}

            {content.capRateAnalysis && (
              <SectionCard icon={Target} title="Cap Rate Analysis" color={sectionColors.capRate}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                  <MetricCard label="Market Range" value={content.capRateAnalysis.marketRange || "N/A"} color={sectionColors.capRate} />
                  <MetricCard label="Boutique Range" value={content.capRateAnalysis.boutiqueRange || "N/A"} color={sectionColors.capRate} />
                  <MetricCard label="Recommended Range" value={content.capRateAnalysis.recommendedRange || "N/A"} color={sectionColors.capRate} />
                </div>
                {content.capRateAnalysis.rationale && (
                  <div className="bg-cyan-50 rounded-xl p-4 border-l-4 border-cyan-400 mb-5">
                    <p className="text-sm text-gray-700 leading-relaxed" data-testid="text-cap-rate-rationale">{content.capRateAnalysis.rationale}</p>
                  </div>
                )}
                {content.capRateAnalysis.comparables && content.capRateAnalysis.comparables.length > 0 && (
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-cyan-50/80">
                          <th className="text-left p-3 text-gray-600 font-semibold">Property</th>
                          <th className="text-right p-3 text-gray-600 font-semibold">Cap Rate</th>
                          <th className="text-right p-3 text-gray-600 font-semibold">Sale Year</th>
                          <th className="text-left p-3 text-gray-600 font-semibold">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {content.capRateAnalysis.comparables.map((c: any, i: number) => (
                          <tr key={i} className="border-t border-gray-100 hover:bg-cyan-50/40 transition-colors" data-testid={`row-cap-rate-comp-${i}`}>
                            <td className="p-3 text-gray-800 font-medium">{c.name}</td>
                            <td className="p-3 text-right font-semibold text-cyan-700">{c.capRate}</td>
                            <td className="p-3 text-right text-gray-500">{c.saleYear}</td>
                            <td className="p-3 text-gray-500">{c.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>
            )}

            {content.landValueAllocation && (
              <SectionCard icon={Mountain} title="Land Value Allocation" color={sectionColors.landValue}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                  <MetricCard label="Recommended Land %" value={content.landValueAllocation.recommendedPercent || "N/A"} color={sectionColors.landValue} />
                  <MetricCard label="Market Range" value={content.landValueAllocation.marketRange || "N/A"} color={sectionColors.landValue} />
                  <MetricCard label="Assessment Method" value={content.landValueAllocation.assessmentMethod || "N/A"} color={sectionColors.landValue} />
                </div>
                {content.landValueAllocation.rationale && (
                  <div className="bg-stone-50 rounded-xl p-4 border-l-4 border-stone-400 mb-5">
                    <p className="text-sm text-gray-700 leading-relaxed">{content.landValueAllocation.rationale}</p>
                  </div>
                )}
                {content.landValueAllocation.factors && content.landValueAllocation.factors.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Key Factors</h4>
                    <ul className="space-y-2">
                      {content.landValueAllocation.factors.map((f: string, i: number) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2.5">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center mt-0.5">
                            <span className="text-xs font-bold text-stone-700">{i + 1}</span>
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </SectionCard>
            )}

            {content.competitiveSet && content.competitiveSet.length > 0 && (
              <SectionCard icon={Building2} title="Competitive Set" color={sectionColors.competitive}>
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#9FBCA4]/10">
                        <th className="text-left p-3 text-gray-600 font-semibold">Property</th>
                        <th className="text-right p-3 text-gray-600 font-semibold">Rooms</th>
                        <th className="text-right p-3 text-gray-600 font-semibold">ADR</th>
                        <th className="text-left p-3 text-gray-600 font-semibold">Positioning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {content.competitiveSet.map((c: any, i: number) => (
                        <tr key={i} className="border-t border-gray-100 hover:bg-emerald-50/40 transition-colors">
                          <td className="p-3 text-gray-800 font-medium">{c.name}</td>
                          <td className="p-3 text-right text-gray-600">{c.rooms}</td>
                          <td className="p-3 text-right font-semibold text-emerald-700">{c.adr}</td>
                          <td className="p-3 text-gray-500">{c.positioning}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}

            {content.risks && content.risks.length > 0 && (
              <SectionCard icon={AlertTriangle} title="Risks & Mitigations" color={sectionColors.risks}>
                <div className="space-y-3">
                  {content.risks.map((r: any, i: number) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-gray-200">
                      <div className="bg-red-50 px-4 py-3 border-b border-red-100">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-red-500" />
                          <p className="text-sm text-gray-800 font-semibold">{r.risk}</p>
                        </div>
                      </div>
                      <div className="bg-white px-4 py-3">
                        <p className="text-sm text-gray-600 leading-relaxed">{r.mitigation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {content.sources && content.sources.length > 0 && (
              <SectionCard icon={BookOpen} title="Sources" color={sectionColors.sources}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {content.sources.map((s: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                      <span className="text-gray-400 font-semibold">{i + 1}.</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
