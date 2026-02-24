/**
 * OtherAssumptionsSection.tsx — Exit strategy, cap rate, and disposition.
 *
 * Configures assumptions for modeling the eventual sale of the property:
 *
 *   • Exit year     – which projection year the property is sold (e.g. Year 7)
 *   • Exit cap rate – capitalization rate used to value the property at sale.
 *                     Valuation = NOI at exit / cap rate. A lower cap rate
 *                     implies higher value (cap rate is an inverse yield).
 *   • Sales commission rate – broker commission as % of gross sale price
 *   • Depreciation basis   – total depreciable cost (purchase − land) used
 *                            to compute gain on sale and tax implications
 *
 * The exit cap rate is arguably the most sensitive single assumption in
 * the model: a 50 bps change can swing the property IRR by several points.
 */
import { Label } from "@/components/ui/label";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Slider } from "@/components/ui/slider";
import { EditableValue } from "@/components/ui/editable-value";
import { ResearchBadge } from "@/components/ui/research-badge";
import {
  DEFAULT_EXIT_CAP_RATE,
  DEFAULT_TAX_RATE,
  DEFAULT_COMMISSION_RATE,
} from "@/lib/constants";
import type { OtherAssumptionsSectionProps } from "./types";

export default function OtherAssumptionsSection({ draft, onChange, researchValues, exitYear }: OtherAssumptionsSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" />
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary/5 blur-xl" />
      <div className="absolute inset-0 border border-primary/20 rounded-2xl shadow-[0_8px_32px_rgba(159,188,164,0.15)]" />
      
      <div className="relative p-6">
        <div className="mb-6">
          <h3 className="text-xl font-display text-gray-900 flex items-center">
            Other Assumptions
            <HelpTooltip text="Additional assumptions for investment analysis including exit valuation and tax calculations" />
          </h3>
          <p className="text-gray-600 text-sm label-text">Exit valuation and tax rate assumptions</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-0.5">
                <Label className="flex items-center label-text text-gray-700 gap-1.5">
                  Exit Cap Rate
                  <HelpTooltip text={`The capitalization rate used to determine terminal (exit) value. Exit Value = Year ${exitYear} NOI ÷ Cap Rate. A lower cap rate implies higher property valuation.`} />
                </Label>
                <ResearchBadge value={researchValues.capRate?.display} onClick={() => researchValues.capRate && onChange("exitCapRate", researchValues.capRate.mid / 100)} />
              </div>
              <EditableValue
                value={(draft.exitCapRate ?? DEFAULT_EXIT_CAP_RATE) * 100}
                onChange={(val) => onChange("exitCapRate", val / 100)}
                format="percent"
                min={1}
                max={10}
                step={0.1}
              />
            </div>
            <Slider 
              value={[(draft.exitCapRate ?? DEFAULT_EXIT_CAP_RATE) * 100]}
              onValueChange={(vals: number[]) => onChange("exitCapRate", vals[0] / 100)}
              min={1}
              max={10}
              step={0.1}
            />
            <p className="text-xs text-gray-500 mt-1">
              Exit Value = Year {exitYear} NOI ÷ {((draft.exitCapRate ?? DEFAULT_EXIT_CAP_RATE) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-0.5">
                <Label className="flex items-center label-text text-gray-700 gap-1.5">
                  Income Tax Rate
                  <HelpTooltip text="Income tax rate for this property's SPV entity, applied to taxable income (NOI minus interest and depreciation) to calculate after-tax cash flow. Set per property to reflect the jurisdiction where the property is located." />
                </Label>
                <ResearchBadge value={researchValues.incomeTax?.display} onClick={() => researchValues.incomeTax && onChange("taxRate", researchValues.incomeTax.mid / 100)} />
              </div>
              <EditableValue
                value={(draft.taxRate ?? DEFAULT_TAX_RATE) * 100}
                onChange={(val) => onChange("taxRate", val / 100)}
                format="percent"
                min={0}
                max={50}
                step={1}
              />
            </div>
            <Slider 
              value={[(draft.taxRate ?? DEFAULT_TAX_RATE) * 100]}
              onValueChange={(vals: number[]) => onChange("taxRate", vals[0] / 100)}
              min={0}
              max={50}
              step={1}
            />
            <p className="text-xs text-gray-500 mt-1">
              Applied to taxable income (NOI − interest − depreciation)
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="flex items-center label-text text-gray-700 gap-1.5">
                Sale Commission
                <HelpTooltip text="Broker commission percentage applied when this property is sold." />
              </Label>
              <EditableValue
                data-testid="editable-disposition-commission"
                value={(draft.dispositionCommission ?? DEFAULT_COMMISSION_RATE) * 100}
                onChange={(val) => onChange("dispositionCommission", val / 100)}
                format="percent"
                min={0}
                max={10}
                step={0.5}
              />
            </div>
            <Slider 
              data-testid="slider-disposition-commission"
              value={[(draft.dispositionCommission ?? DEFAULT_COMMISSION_RATE) * 100]}
              onValueChange={(vals: number[]) => onChange("dispositionCommission", vals[0] / 100)}
              min={0}
              max={10}
              step={0.5}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
