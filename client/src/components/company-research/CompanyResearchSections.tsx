/**
 * CompanyResearchSections.tsx — Renders AI-generated company-level research.
 *
 * Analogous to property-research/ResearchSections but focused on the
 * management company rather than individual properties. Categories include:
 *
 *   • Fee Structure Benchmarks – typical base and incentive management fee
 *     rates in the hospitality industry
 *   • GAAP & Accounting Standards – relevant accounting treatment for
 *     management contracts, revenue recognition, and SAFE notes
 *   • Operating Expense Ratios – industry benchmarks for management company
 *     overhead as a percentage of fee revenue
 *   • Compensation Benchmarks – salary data for hospitality management roles
 *   • Contract Terms – standard management agreement structures, term length,
 *     termination clauses, and key-money provisions
 *   • Sources – citations for all AI-generated data
 *
 * Reuses SectionCard and MetricCard from property-research for visual
 * consistency, but with its own companySectionColors palette.
 */

import { IconBookOpen, IconBriefcase, IconDollarSign, IconFileText, IconPeople, IconScale } from "@/components/icons/brand-icons";
import { SectionCard } from "../property-research/SectionCard";
import { MetricCard } from "../property-research/MetricCard";
import { companySectionColors } from "./types";

export function CompanyResearchSections({ content }: { content: any }) {
  return (
    <>
      {content.managementFees && (
        <SectionCard icon={IconDollarSign} title="Management Fee Research" color={companySectionColors.fees}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {content.managementFees.baseFee && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Base Management Fee</h4>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard label="Industry Range" value={content.managementFees.baseFee.industryRange || "N/A"} color={companySectionColors.fees} />
                  <MetricCard label="Boutique Range" value={content.managementFees.baseFee.boutiqueRange || "N/A"} color={companySectionColors.fees} />
                </div>
                <MetricCard label="Recommended" value={content.managementFees.baseFee.recommended || "N/A"} color={companySectionColors.fees} />
                {content.managementFees.baseFee.gaapReference && (
                  <p className="text-xs text-blue-700 bg-blue-50 rounded-lg p-3 border border-blue-100">
                    GAAP: {content.managementFees.baseFee.gaapReference}
                  </p>
                )}
                {content.managementFees.baseFee.sources && (
                  <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted border-b border-border">
                          <th className="text-left p-2 text-muted-foreground font-medium">Source</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {content.managementFees.baseFee.sources.map((s: any, i: number) => (
                          <tr key={i} className="border-b border-border">
                            <td className="p-2 text-foreground">{s.source}</td>
                            <td className="p-2 text-foreground">{s.data}</td>
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
                <h4 className="text-sm font-medium text-foreground">Incentive Management Fee</h4>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard label="Industry Range" value={content.managementFees.incentiveFee.industryRange || "N/A"} color={companySectionColors.fees} />
                  <MetricCard label="Common Basis" value={content.managementFees.incentiveFee.commonBasis || "N/A"} color={companySectionColors.fees} />
                </div>
                <MetricCard label="Recommended" value={content.managementFees.incentiveFee.recommended || "N/A"} color={companySectionColors.fees} />
                {content.managementFees.incentiveFee.gaapReference && (
                  <p className="text-xs text-blue-700 bg-blue-50 rounded-lg p-3 border border-blue-100">
                    GAAP: {content.managementFees.incentiveFee.gaapReference}
                  </p>
                )}
                {content.managementFees.incentiveFee.sources && (
                  <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted border-b border-border">
                          <th className="text-left p-2 text-muted-foreground font-medium">Source</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {content.managementFees.incentiveFee.sources.map((s: any, i: number) => (
                          <tr key={i} className="border-b border-border">
                            <td className="p-2 text-foreground">{s.source}</td>
                            <td className="p-2 text-foreground">{s.data}</td>
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
        <SectionCard icon={IconScale} title="GAAP Standards & References" color={companySectionColors.gaap}>
          <div className="space-y-3">
            {content.gaapStandards.map((s: any, i: number) => (
              <div key={i} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-foreground font-medium">{s.standard}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.application}</p>
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
        <SectionCard icon={IconBriefcase} title="Industry Benchmarks" color={companySectionColors.benchmarks}>
          {content.industryBenchmarks.operatingExpenseRatios && content.industryBenchmarks.operatingExpenseRatios.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-foreground mb-3">Operating Expense Ratios (USALI)</h4>
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted border-b border-border">
                      <th className="text-left p-3 text-muted-foreground font-medium">Category</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">Range</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.industryBenchmarks.operatingExpenseRatios.map((r: any, i: number) => (
                      <tr key={i} className="border-b border-border">
                        <td className="p-3 text-foreground">{r.category}</td>
                        <td className="p-3 text-right text-emerald-600 font-medium">{r.range}</td>
                        <td className="p-3 text-foreground">{r.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {content.industryBenchmarks.revenuePerRoom && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Revenue Per Room by Segment</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard label="Economy" value={content.industryBenchmarks.revenuePerRoom.economy || "N/A"} color={companySectionColors.benchmarks} />
                <MetricCard label="Midscale" value={content.industryBenchmarks.revenuePerRoom.midscale || "N/A"} color={companySectionColors.benchmarks} />
                <MetricCard label="Upscale" value={content.industryBenchmarks.revenuePerRoom.upscale || "N/A"} color={companySectionColors.benchmarks} />
                <MetricCard label="Luxury" value={content.industryBenchmarks.revenuePerRoom.luxury || "N/A"} color={companySectionColors.benchmarks} />
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {content.compensationBenchmarks && (
        <SectionCard icon={IconPeople} title="Compensation Benchmarks" color={companySectionColors.compensation}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <MetricCard label="General Manager" value={content.compensationBenchmarks.gm || "N/A"} color={companySectionColors.compensation} />
            <MetricCard label="Director Level" value={content.compensationBenchmarks.director || "N/A"} color={companySectionColors.compensation} />
            <MetricCard label="Manager Level" value={content.compensationBenchmarks.manager || "N/A"} color={companySectionColors.compensation} />
          </div>
          {content.compensationBenchmarks.source && (
            <p className="text-xs text-muted-foreground">Source: {content.compensationBenchmarks.source}</p>
          )}
        </SectionCard>
      )}

      {content.contractTerms && content.contractTerms.length > 0 && (
        <SectionCard icon={IconFileText} title="Typical Contract Terms" color={companySectionColors.contracts}>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="text-left p-3 text-muted-foreground font-medium">Term</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Typical</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {content.contractTerms.map((t: any, i: number) => (
                  <tr key={i} className="border-b border-border">
                    <td className="p-3 text-foreground font-medium">{t.term}</td>
                    <td className="p-3 text-emerald-600">{t.typical}</td>
                    <td className="p-3 text-foreground">{t.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {content.sources && content.sources.length > 0 && (
        <SectionCard icon={IconBookOpen} title="Sources" color={companySectionColors.sources}>
          <ul className="space-y-1">
            {content.sources.map((s: string, i: number) => (
              <li key={i} className="text-xs text-muted-foreground">· {s}</li>
            ))}
          </ul>
        </SectionCard>
      )}
    </>
  );
}
