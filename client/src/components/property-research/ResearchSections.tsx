/**
 * ResearchSections.tsx — Renders all AI-generated research for a property.
 *
 * Takes the parsed research JSON (produced by useResearchStream) and maps
 * each category to a SectionCard + MetricCard layout:
 *
 *   • Market Overview       – macro market data, tourism stats, demand drivers
 *   • ADR Analysis          – nightly-rate benchmarks vs. comp set
 *   • Occupancy Analysis    – seasonal occupancy patterns, ramp-up timing
 *   • Events & Demand       – local events that drive transient/group demand
 *   • Cap Rate Analysis     – capitalization rate comps for the submarket
 *   • Competitive Landscape – identified competitor properties
 *   • Risk Factors          – market, operational, and regulatory risks
 *   • Stabilization         – expected timeline to reach stabilized occupancy
 *   • Land Value            – underlying land valuation for the basis split
 *   • Catering              – F&B / wedding / event revenue potential
 *   • Sources               – citations for the AI-generated data
 *
 * Each section is conditionally rendered only if the research JSON includes
 * data for that category; sections stream in progressively as the LLM
 * generates more content.
 */
import { TrendingUp, Building2, Calendar, Users, AlertTriangle, BookOpen, Target, Clock, Shield, Mountain, UtensilsCrossed } from "lucide-react";
import { SectionCard } from "./SectionCard";
import { MetricCard } from "./MetricCard";
import { sectionColors } from "./types";

export function ResearchSections({ content }: { content: any }) {
  return (
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

      {content.cateringAnalysis && (
        <SectionCard icon={UtensilsCrossed} title="Catering & F&B Boost Analysis" color={sectionColors.catering}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <MetricCard label="Recommended Boost" value={content.cateringAnalysis.recommendedBoostPercent || "N/A"} color={sectionColors.catering} />
            <MetricCard label="Market Range" value={content.cateringAnalysis.marketRange || "N/A"} color={sectionColors.catering} />
            <div className="rounded-xl p-4 border border-fuchsia-200 bg-fuchsia-50">
              <p className="text-xs font-medium uppercase tracking-wider mb-1.5 text-gray-500">Formula</p>
              <p className="text-sm font-mono text-gray-800">Total F&B = Base F&B × (1 + Boost%)</p>
            </div>
          </div>
          {content.cateringAnalysis.rationale && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Rationale</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{content.cateringAnalysis.rationale}</p>
            </div>
          )}
          {content.cateringAnalysis.eventMixBreakdown && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
              {content.cateringAnalysis.eventMixBreakdown.fullyCatered && (
                <div className="rounded-xl border border-fuchsia-200 bg-fuchsia-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-fuchsia-200 text-fuchsia-800 font-semibold uppercase tracking-wider">Fully Catered</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{content.cateringAnalysis.eventMixBreakdown.fullyCatered}</p>
                </div>
              )}
              {content.cateringAnalysis.eventMixBreakdown.partiallyCatered && (
                <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 font-semibold uppercase tracking-wider">Partially Catered</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{content.cateringAnalysis.eventMixBreakdown.partiallyCatered}</p>
                </div>
              )}
              {content.cateringAnalysis.eventMixBreakdown.noCatering && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 font-semibold uppercase tracking-wider">No Catering</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{content.cateringAnalysis.eventMixBreakdown.noCatering}</p>
                </div>
              )}
            </div>
          )}
          {content.cateringAnalysis.factors && content.cateringAnalysis.factors.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Key Factors</h4>
              <ul className="space-y-2">
                {content.cateringAnalysis.factors.map((f: string, i: number) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-fuchsia-100 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-fuchsia-700">{i + 1}</span>
                    </span>
                    {f}
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
                <tr className="bg-primary/10">
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
  );
}
