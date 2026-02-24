/**
 * ManagementFeesSection.tsx — Per-property management fee configuration.
 *
 * Hotels pay the management company two types of fees:
 *
 *   1. Base Management Fee (% of Total Revenue)
 *      Broken into named service categories (e.g. Revenue Management,
 *      Marketing, Accounting, Operations) via the fee category grid.
 *      Each category can be toggled active/inactive and has its own rate.
 *      The total service fee rate is the sum of all active categories.
 *
 *   2. Incentive Management Fee (% of GOP — Gross Operating Profit)
 *      A performance bonus paid only when the property exceeds a
 *      profitability threshold. GOP = Revenue − Departmental Expenses −
 *      Undistributed Expenses (before fixed charges and debt service).
 *
 * These fees flow as revenue to the management company's income statement
 * (see company/CompanyIncomeTab) and as an expense on the property's
 * income statement. This dual-entity structure is central to the platform.
 */
import { Label } from "@/components/ui/label";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Slider } from "@/components/ui/slider";
import { EditableValue } from "@/components/ui/editable-value";
import { ResearchBadge } from "@/components/ui/research-badge";
import { DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE } from "@/lib/constants";
import type { ManagementFeesSectionProps } from "./types";

export default function ManagementFeesSection({ draft, onChange, researchValues, feeDraft, onFeeCategoryChange, totalServiceFeeRate }: ManagementFeesSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" />
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary/5 blur-xl" />
      <div className="absolute inset-0 border border-primary/20 rounded-2xl shadow-[0_8px_32px_rgba(159,188,164,0.15)]" />
      
      <div className="relative p-6">
        <div className="mb-6">
          <h3 className="text-xl font-display text-gray-900 flex items-center">
            Management and Service Fees by Hospitality Management Company
            <HelpTooltip text="Fees paid by this property to the management company. Service fees are broken into categories (each a % of Total Revenue). The Incentive Fee is a % of Gross Operating Profit (GOP) collected when GOP is positive." />
          </h3>
          <p className="text-gray-600 text-sm label-text">Fees charged by the management company for operating this property</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-semibold text-gray-800 label-text">
              Service Fee Categories (% of Total Revenue)
            </Label>
            <span className={`text-sm font-mono font-semibold ${totalServiceFeeRate > 0.10 ? 'text-amber-600' : 'text-gray-700'}`} data-testid="text-total-service-fee">
              Total: {(totalServiceFeeRate * 100).toFixed(1)}%
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {feeDraft?.map((cat, idx) => {
              const svcFeeMap: Record<string, { display: string; mid: number } | null> = {
                'Marketing': researchValues.svcFeeMarketing ?? null,
                'IT': researchValues.svcFeeIT ?? null,
                'Accounting': researchValues.svcFeeAccounting ?? null,
                'Reservations': researchValues.svcFeeReservations ?? null,
                'General Management': researchValues.svcFeeGeneralMgmt ?? null,
              };
              const rv = svcFeeMap[cat.name];
              return (
              <div key={cat.id} className="space-y-2" data-testid={`fee-category-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-0.5">
                    <Label className={`flex items-center label-text gap-1.5 ${cat.isActive ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                      {cat.name}
                      <HelpTooltip text={`${cat.name} service fee = Total Revenue × ${(cat.rate * 100).toFixed(1)}%. Charged monthly as part of the management company's service fees.`} />
                    </Label>
                    <ResearchBadge value={rv?.display} onClick={() => rv && onFeeCategoryChange(idx, "rate", rv.mid / 100)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <EditableValue
                      value={cat.rate * 100}
                      onChange={(val) => onFeeCategoryChange(idx, "rate", val / 100)}
                      format="percent"
                      min={0}
                      max={5}
                      step={0.1}
                    />
                    <button
                      type="button"
                      onClick={() => onFeeCategoryChange(idx, "isActive", !cat.isActive)}
                      className={`w-8 h-5 rounded-full transition-colors ${cat.isActive ? 'bg-primary' : 'bg-gray-300'} relative`}
                      title={cat.isActive ? "Disable this fee" : "Enable this fee"}
                      data-testid={`toggle-fee-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${cat.isActive ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
                <Slider 
                  value={[cat.rate * 100]}
                  onValueChange={(vals: number[]) => onFeeCategoryChange(idx, "rate", vals[0] / 100)}
                  min={0}
                  max={5}
                  step={0.1}
                  disabled={!cat.isActive}
                />
              </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-primary/20 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-0.5">
                  <Label className="flex items-center label-text text-gray-700 gap-1.5">
                    Incentive Fee (% of GOP)
                    <HelpTooltip text="Incentive Management Fee = max(0, GOP) × this rate. Only charged when Gross Operating Profit is positive, rewarding the management company for strong performance. Industry standard: 10–20% of GOP." />
                  </Label>
                  <ResearchBadge value={researchValues.incentiveFee?.display} onClick={() => researchValues.incentiveFee && onChange("incentiveManagementFeeRate", researchValues.incentiveFee.mid / 100)} />
                </div>
                <EditableValue
                  value={(draft.incentiveManagementFeeRate ?? DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE) * 100}
                  onChange={(val) => onChange("incentiveManagementFeeRate", val / 100)}
                  format="percent"
                  min={0}
                  max={25}
                  step={1}
                />
              </div>
              <Slider 
                value={[(draft.incentiveManagementFeeRate ?? DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE) * 100]}
                onValueChange={(vals: number[]) => onChange("incentiveManagementFeeRate", vals[0] / 100)}
                min={0}
                max={25}
                step={1}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
