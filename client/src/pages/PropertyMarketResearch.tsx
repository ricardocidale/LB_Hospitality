import { useState, useRef, useCallback } from "react";
import Layout from "@/components/Layout";
import { useProperty, useMarketResearch } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Loader2, RefreshCw, MapPin, TrendingUp, Building2, Calendar, Users, AlertTriangle, ExternalLink, BookOpen } from "lucide-react";
import { useRoute } from "wouter";
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

export default function PropertyMarketResearch() {
  const [, params] = useRoute("/property/:id/research");
  const propertyId = parseInt(params?.id || "0");
  const { data: property, isLoading: propertyLoading } = useProperty(propertyId);
  const { data: research, isLoading: researchLoading } = useMarketResearch("property", propertyId);
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
          }
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
  }, [property, propertyId, queryClient]);

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
  const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(property.location + " " + property.market + " hotels")}`;

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title={`Market Research: ${property.name}`}
          subtitle={`${property.location} · ${property.market} · ${property.roomCount} rooms`}
          variant="dark"
          backLink={`/property/${property.id}/edit`}
          actions={
            <div className="flex items-center gap-3">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-google-maps"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white/90 hover:bg-white/20 transition-colors text-sm border border-white/15"
              >
                <MapPin className="w-4 h-4" />
                Google Maps
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={generateResearch}
                disabled={isGenerating}
                data-testid="button-update-research"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-[#257D41] bg-[#257D41]/10 text-[#9FBCA4] font-semibold hover:bg-[#257D41]/20 transition-colors disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {isGenerating ? "Analyzing..." : "Update Research"}
              </button>
            </div>
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
                <p className="text-white/70 text-sm">Analyzing market data for {property.name}...</p>
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
              <p className="text-sm text-white/50 mb-6">Click "Update Research" to generate AI-powered market analysis for this property.</p>
            </div>
          </GlassCard>
        )}

        {hasResearch && !isGenerating && (
          <>
            {content.marketOverview && (
              <GlassCard>
                <div className="p-6">
                  <SectionHeader icon={Building2} title="Market Overview" />
                  <p className="text-sm text-white/70 mb-4">{content.marketOverview.summary}</p>
                  {content.marketOverview.keyMetrics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {content.marketOverview.keyMetrics.map((m: any, i: number) => (
                        <MetricCard key={i} label={m.label} value={m.value} source={m.source} />
                      ))}
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {content.adrAnalysis && (
              <GlassCard>
                <div className="p-6">
                  <SectionHeader icon={TrendingUp} title="ADR Analysis" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <MetricCard label="Market Average ADR" value={content.adrAnalysis.marketAverage || "N/A"} />
                    <MetricCard label="Boutique Range" value={content.adrAnalysis.boutiqueRange || "N/A"} />
                    <MetricCard label="Recommended Range" value={content.adrAnalysis.recommendedRange || "N/A"} />
                  </div>
                  {content.adrAnalysis.rationale && (
                    <p className="text-sm text-white/60 mb-4 bg-white/5 rounded-lg p-3 border-l-2 border-[#9FBCA4]/50">
                      {content.adrAnalysis.rationale}
                    </p>
                  )}
                  {content.adrAnalysis.comparables && content.adrAnalysis.comparables.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-white/70 mb-2">Comparable Properties</h4>
                      <div className="bg-white/5 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left p-3 text-white/50 font-medium">Property</th>
                              <th className="text-right p-3 text-white/50 font-medium">ADR</th>
                              <th className="text-left p-3 text-white/50 font-medium">Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {content.adrAnalysis.comparables.map((c: any, i: number) => (
                              <tr key={i} className="border-b border-white/5">
                                <td className="p-3 text-white/80">{c.name}</td>
                                <td className="p-3 text-right text-[#9FBCA4] font-medium">{c.adr}</td>
                                <td className="p-3 text-white/60">{c.type}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {content.occupancyAnalysis && (
              <GlassCard>
                <div className="p-6">
                  <SectionHeader icon={Calendar} title="Occupancy Analysis" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <MetricCard label="Market Average" value={content.occupancyAnalysis.marketAverage || "N/A"} />
                    <MetricCard label="Ramp-Up Timeline" value={content.occupancyAnalysis.rampUpTimeline || "N/A"} />
                  </div>
                  {content.occupancyAnalysis.seasonalPattern && content.occupancyAnalysis.seasonalPattern.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-white/70 mb-2">Seasonal Pattern</h4>
                      <div className="bg-white/5 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left p-3 text-white/50 font-medium">Season</th>
                              <th className="text-right p-3 text-white/50 font-medium">Occupancy</th>
                              <th className="text-left p-3 text-white/50 font-medium">Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {content.occupancyAnalysis.seasonalPattern.map((s: any, i: number) => (
                              <tr key={i} className="border-b border-white/5">
                                <td className="p-3 text-white/80">{s.season}</td>
                                <td className="p-3 text-right text-[#9FBCA4] font-medium">{s.occupancy}</td>
                                <td className="p-3 text-white/60">{s.notes}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {content.eventDemand && (
              <GlassCard>
                <div className="p-6">
                  <SectionHeader icon={Users} title="Event & Experience Demand" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <MetricCard label="Corporate Events" value={content.eventDemand.corporateEvents || "N/A"} />
                    <MetricCard label="Wellness Retreats" value={content.eventDemand.wellnessRetreats || "N/A"} />
                    <MetricCard label="Weddings/Private" value={content.eventDemand.weddingsPrivate || "N/A"} />
                    <MetricCard label="Est. Event Rev Share" value={content.eventDemand.estimatedEventRevShare || "N/A"} />
                  </div>
                  {content.eventDemand.keyDrivers && content.eventDemand.keyDrivers.length > 0 && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-white/70 mb-2">Key Demand Drivers</h4>
                      <ul className="space-y-1">
                        {content.eventDemand.keyDrivers.map((d: string, i: number) => (
                          <li key={i} className="text-sm text-white/60 flex items-start gap-2">
                            <span className="text-[#9FBCA4] mt-1">·</span>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {content.competitiveSet && content.competitiveSet.length > 0 && (
              <GlassCard>
                <div className="p-6">
                  <SectionHeader icon={Building2} title="Competitive Set" />
                  <div className="bg-white/5 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left p-3 text-white/50 font-medium">Property</th>
                          <th className="text-right p-3 text-white/50 font-medium">Rooms</th>
                          <th className="text-right p-3 text-white/50 font-medium">ADR</th>
                          <th className="text-left p-3 text-white/50 font-medium">Positioning</th>
                        </tr>
                      </thead>
                      <tbody>
                        {content.competitiveSet.map((c: any, i: number) => (
                          <tr key={i} className="border-b border-white/5">
                            <td className="p-3 text-white/80 font-medium">{c.name}</td>
                            <td className="p-3 text-right text-white/70">{c.rooms}</td>
                            <td className="p-3 text-right text-[#9FBCA4] font-medium">{c.adr}</td>
                            <td className="p-3 text-white/60">{c.positioning}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </GlassCard>
            )}

            {content.risks && content.risks.length > 0 && (
              <GlassCard>
                <div className="p-6">
                  <SectionHeader icon={AlertTriangle} title="Risks & Mitigations" />
                  <div className="space-y-3">
                    {content.risks.map((r: any, i: number) => (
                      <div key={i} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <p className="text-sm text-white/80 font-medium mb-1">{r.risk}</p>
                        <p className="text-xs text-white/50">{r.mitigation}</p>
                      </div>
                    ))}
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
