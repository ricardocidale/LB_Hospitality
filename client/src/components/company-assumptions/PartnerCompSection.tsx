/**
 * PartnerCompSection.tsx — Partner / founder compensation schedule.
 *
 * Configures the annual compensation for founding partners of the management
 * company. Partner comp is a significant expense line, especially in early
 * years when fee revenue is low.
 *
 * Inputs:
 *   • Number of partners
 *   • Per-partner annual draw (salary equivalent)
 *   • Draw escalation rate (annual increase %)
 *   • Year-by-year override table — lets users model a stepped schedule
 *     where draws start low and increase as the portfolio grows
 *
 * The model start year is passed in so column headers show actual calendar
 * years (e.g. 2025, 2026, 2027…) rather than abstract "Year 1, Year 2…".
 */
import { Label } from "@/components/ui/label";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { formatMoney } from "@/lib/financialEngine";
import { DEFAULT_PARTNER_COMP, DEFAULT_PARTNER_COUNT } from "@/lib/constants";
import EditableValue from "./EditableValue";
import type { PartnerCompSectionProps } from "./types";

export default function PartnerCompSection({ formData, onChange, global, modelStartYear }: PartnerCompSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary/5 blur-xl" />
      <div className="relative">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-display text-gray-900 flex items-center gap-2">
            Partner Compensation Schedule
            <HelpTooltip text="Annual total partner compensation and partner count for each year. Individual partner compensation = Total ÷ Partner Count." manualSection="company-formulas" />
          </h3>
          <p className="text-gray-600 text-sm label-text">Configure total partner compensation and headcount by year</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary/20">
                <th className="text-left py-2 px-2 font-display text-gray-900">Year</th>
                <th className="text-right py-2 px-2 font-display text-gray-900">Total Partner Comp</th>
                <th className="text-center py-2 px-2 font-display text-gray-900">Partner Count</th>
                <th className="text-right py-2 px-2 font-display text-gray-600">Per Partner</th>
              </tr>
            </thead>
            <tbody>
              {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map((year) => {
                type PartnerCompKey = `partnerCompYear${typeof year}`;
                type PartnerCountKey = `partnerCountYear${typeof year}`;
                const compKey = `partnerCompYear${year}` as PartnerCompKey;
                const countKey = `partnerCountYear${year}` as PartnerCountKey;
                const compValue = (formData[compKey] ?? global[compKey] ?? DEFAULT_PARTNER_COMP[year - 1]) as number;
                const countValue = (formData[countKey] ?? global[countKey] ?? DEFAULT_PARTNER_COUNT) as number;
                const perPartner = countValue > 0 ? compValue / countValue : 0;
                
                return (
                  <tr key={year} className="border-b border-primary/20 last:border-0">
                    <td className="py-2 px-2 font-medium text-gray-900">Year {year} (<span className="font-mono">{modelStartYear + year - 1}</span>)</td>
                    <td className="py-2 px-2 text-right">
                      <EditableValue
                        value={compValue}
                        onChange={(v) => onChange(compKey, v)}
                        format="dollar"
                        min={0}
                        max={2000000}
                        step={10000}
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Select
                        value={String(countValue)}
                        onValueChange={(v) => onChange(countKey, parseInt(v))}
                      >
                        <SelectTrigger className="w-16 text-center font-mono" data-testid={`select-partner-count-year${year}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-2 px-2 text-right text-gray-600 font-mono">
                      {formatMoney(perPartner)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-600 mt-4">
          Total Partner Comp is the annual budget (12 months). Actual spending is automatically prorated for years with fewer operating months (e.g., if operations start mid-year). Per Partner = Total ÷ Count.
        </p>
      </div>
    </div></div>
  );
}
