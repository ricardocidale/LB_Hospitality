import { DollarSign, Scale, Briefcase, Users, FileText, BookOpen } from "lucide-react";
import { SectionCard } from "../property-research/SectionCard";
import { MetricCard } from "../property-research/MetricCard";
import { companySectionColors } from "./types";

export function CompanyResearchSections({ content }: { content: any }) {
  return (
    <>
      {content.managementFees && (
        <SectionCard icon={DollarSign} title="Management Fee Research" color={companySectionColors.fees}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {content.managementFees.baseFee && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Base Management Fee</h4>
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
        <SectionCard icon={Scale} title="GAAP Standards & References" color={companySectionColors.gaap}>
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
        <SectionCard icon={Briefcase} title="Industry Benchmarks" color={companySectionColors.benchmarks}>
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
        <SectionCard icon={Users} title="Compensation Benchmarks" color={companySectionColors.compensation}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <MetricCard label="General Manager" value={content.compensationBenchmarks.gm || "N/A"} color={companySectionColors.compensation} />
            <MetricCard label="Director Level" value={content.compensationBenchmarks.director || "N/A"} color={companySectionColors.compensation} />
            <MetricCard label="Manager Level" value={content.compensationBenchmarks.manager || "N/A"} color={companySectionColors.compensation} />
          </div>
          {content.compensationBenchmarks.source && (
            <p className="text-xs text-gray-500">Source: {content.compensationBenchmarks.source}</p>
          )}
        </SectionCard>
      )}

      {content.contractTerms && content.contractTerms.length > 0 && (
        <SectionCard icon={FileText} title="Typical Contract Terms" color={companySectionColors.contracts}>
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
        <SectionCard icon={BookOpen} title="Sources" color={companySectionColors.sources}>
          <ul className="space-y-1">
            {content.sources.map((s: string, i: number) => (
              <li key={i} className="text-xs text-gray-500">· {s}</li>
            ))}
          </ul>
        </SectionCard>
      )}
    </>
  );
}
