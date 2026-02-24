/**
 * ManagementFeesSection.tsx — Read-only summary of management fee rates
 * across the portfolio.
 *
 * Unlike the property-edit ManagementFeesSection (which edits per-property
 * fees), this company-level view is a read-only table showing:
 *   • Each property's base management fee rate (% of revenue)
 *   • Each property's incentive management fee rate (% of GOP)
 *   • The service-fee category breakdown per property
 *   • Links to each property's edit page for adjustments
 *
 * This gives the management company operator a single view of their
 * fee structure across all managed properties, useful for ensuring
 * consistency and spotting outliers.
 */
import { Link } from "wouter";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { formatPercent } from "@/lib/financialEngine";
import {
  DEFAULT_BASE_MANAGEMENT_FEE_RATE,
  DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
} from "@/lib/constants";
import type { ManagementFeesSectionProps } from "./types";

export default function ManagementFeesSection({ formData, onChange, global, properties, allFeeCategories }: ManagementFeesSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
    <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary/5 blur-xl" />
    <div className="relative">
      <div className="space-y-6">
        <h3 className="text-lg font-display text-gray-900 flex items-center">
          Revenue — Management Fees
          <HelpTooltip text="Management fees are defined per property. Each property sets its own Base Fee (% of Revenue) and Incentive Fee (% of GOP). Edit these rates on each property's assumptions page." manualSection="company-formulas" />
        </h3>
        <p className="text-sm text-muted-foreground mb-3">Fee rates are set individually on each property. This table shows the current rates for reference.</p>
        <div className="rounded-lg border border-primary/20 overflow-hidden">
          {(() => {
            const allCatNames = Array.from(new Set(allFeeCategories.filter(c => c.isActive).map(c => c.name)));
            const hasCategoryData = allCatNames.length > 0;
            return (
              <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-property-fee-summary">
                <thead>
                  <tr className="bg-primary/10 border-b border-primary/20">
                    <th className="text-left px-4 py-2 font-semibold text-gray-700 whitespace-nowrap">Property</th>
                    {hasCategoryData ? (
                      <>
                        {allCatNames.map(name => (
                          <th key={name} className="text-right px-3 py-2 font-semibold text-gray-700 whitespace-nowrap text-xs">{name}</th>
                        ))}
                        <th className="text-right px-3 py-2 font-semibold text-gray-700 whitespace-nowrap">Total Service</th>
                      </>
                    ) : (
                      <th className="text-right px-4 py-2 font-semibold text-gray-700">Base Fee (% of Revenue)</th>
                    )}
                    <th className="text-right px-4 py-2 font-semibold text-gray-700 whitespace-nowrap">Incentive (% of GOP)</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.length === 0 ? (
                    <tr><td colSpan={hasCategoryData ? allCatNames.length + 3 : 3} className="px-4 py-3 text-center text-muted-foreground">No properties configured</td></tr>
                  ) : (
                    properties.map((prop: any) => {
                      const propCats = allFeeCategories.filter(c => c.propertyId === prop.id);
                      const totalServiceRate = propCats.filter(c => c.isActive).reduce((sum, c) => sum + c.rate, 0);
                      return (
                        <tr key={prop.id} className="border-b border-primary/10 last:border-b-0 hover:bg-primary/5">
                          <td className="px-4 py-2 text-gray-800 whitespace-nowrap">
                            <Link href={`/property/${prop.id}/edit`} className="text-primary hover:underline">{prop.name}</Link>
                          </td>
                          {hasCategoryData ? (
                            <>
                              {allCatNames.map(name => {
                                const cat = propCats.find(c => c.name === name);
                                return (
                                  <td key={name} className={`px-3 py-2 text-right font-mono text-xs ${cat?.isActive ? 'text-gray-700' : 'text-gray-400'}`}>
                                    {cat ? formatPercent(cat.rate) : '—'}
                                  </td>
                                );
                              })}
                              <td className="px-3 py-2 text-right font-mono font-semibold text-gray-800">{formatPercent(totalServiceRate)}</td>
                            </>
                          ) : (
                            <td className="px-4 py-2 text-right font-mono text-gray-700">{formatPercent(prop.baseManagementFeeRate ?? DEFAULT_BASE_MANAGEMENT_FEE_RATE)}</td>
                          )}
                          <td className="px-4 py-2 text-right font-mono text-gray-700">{formatPercent(prop.incentiveManagementFeeRate ?? DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              </div>
            );
          })()}
        </div>
      </div>
    </div></div>
  );
}
