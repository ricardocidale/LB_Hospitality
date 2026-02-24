import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Slider } from "@/components/ui/slider";
import { EditableValue } from "@/components/ui/editable-value";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ResearchBadge } from "@/components/ui/research-badge";
import { formatMoneyInput, parseMoneyInput } from "@/lib/formatters";
import { 
  DEFAULT_LTV, 
  DEFAULT_INTEREST_RATE, 
  DEFAULT_TERM_YEARS,
  DEFAULT_REFI_LTV,
  DEFAULT_ACQ_CLOSING_COST_RATE,
  DEFAULT_REFI_CLOSING_COST_RATE,
  DEFAULT_LAND_VALUE_PERCENT
} from "@/lib/loanCalculations";
import { DEFAULT_REFI_PERIOD_YEARS } from "@/lib/constants";
import type { PropertyEditSectionProps } from "./types";

export default function CapitalStructureSection({ draft, onChange, onNumberChange, globalAssumptions, researchValues }: PropertyEditSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" />
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary/5 blur-xl" />
      <div className="absolute inset-0 border border-primary/20 rounded-2xl shadow-[0_8px_32px_rgba(159,188,164,0.15)]" />
      
      <div className="relative p-6 space-y-5">
        <div>
          <h3 className="text-xl font-display text-gray-900">Capital Structure</h3>
          <p className="text-gray-600 text-sm label-text">Purchase and investment details</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-1.5">
            <Label className="label-text text-gray-700 flex items-center gap-1.5">Purchase Price ($)<HelpTooltip text="Total acquisition cost of the property. This is the basis for equity investment, loan sizing, and depreciation calculations." /></Label>
            <Input 
              value={formatMoneyInput(draft.purchasePrice)} 
              onChange={(e) => onNumberChange("purchasePrice", parseMoneyInput(e.target.value).toString())}
              className="bg-white border-primary/30 text-gray-900"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="label-text text-gray-700 flex items-center gap-1.5">Building Improvements ($)<HelpTooltip text="Capital improvements and renovation costs added to the building basis. These are depreciated over 27.5 years along with the building portion of the purchase price." /></Label>
            <Input 
              value={formatMoneyInput(draft.buildingImprovements)} 
              onChange={(e) => onNumberChange("buildingImprovements", parseMoneyInput(e.target.value).toString())}
              className="bg-white border-primary/30 text-gray-900"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="label-text text-gray-700 flex items-center gap-1.5">Pre-Opening Costs ($)<HelpTooltip text="One-time costs incurred before the property opens: hiring, training, marketing launch, supplies, licensing, and initial inventory." /></Label>
            <Input 
              value={formatMoneyInput(draft.preOpeningCosts)} 
              onChange={(e) => onNumberChange("preOpeningCosts", parseMoneyInput(e.target.value).toString())}
              className="bg-white border-primary/30 text-gray-900"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="label-text text-gray-700 flex items-center gap-1.5">Operating Reserve ($)<HelpTooltip text="Cash reserve set aside at acquisition to cover working capital needs during the ramp-up period before the property reaches stabilized operations." /></Label>
            <Input 
              value={formatMoneyInput(draft.operatingReserve)} 
              onChange={(e) => onNumberChange("operatingReserve", parseMoneyInput(e.target.value).toString())}
              className="bg-white border-primary/30 text-gray-900"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-col gap-0.5">
              <Label className="label-text text-gray-700 flex items-center gap-1.5">
                Land Value (%)
                <HelpTooltip text="Percentage of the purchase price allocated to land. Land does not depreciate under IRS rules (Publication 946). Only the building portion is depreciated over 27.5 years. Typical land allocation ranges from 15-40% depending on location and property type." />
              </Label>
              <ResearchBadge value={researchValues.landValue?.display} onClick={() => researchValues.landValue && onChange("landValuePercent", researchValues.landValue.mid / 100)} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700" data-testid="text-land-value-percent">
                  {((draft.landValuePercent ?? DEFAULT_LAND_VALUE_PERCENT) * 100).toFixed(0)}%
                </span>
                <span className="text-xs text-gray-500">
                  Depreciable basis: ${((draft.purchasePrice * (1 - (draft.landValuePercent ?? DEFAULT_LAND_VALUE_PERCENT))) + draft.buildingImprovements).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <Slider
                data-testid="slider-land-value-percent"
                value={[(draft.landValuePercent ?? DEFAULT_LAND_VALUE_PERCENT) * 100]}
                onValueChange={(vals: number[]) => onNumberChange("landValuePercent", (vals[0] / 100).toString())}
                min={5}
                max={60}
                step={1}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Label className="label-text text-gray-700 flex items-center gap-1.5">Type of Funding<HelpTooltip text="How the acquisition is financed. Full Equity means 100% cash investment. Financed means a portion is covered by a mortgage loan." /></Label>
          <RadioGroup 
            value={draft.type} 
            onValueChange={(v) => onChange("type", v)}
            className="flex gap-8"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Full Equity" id="funding-equity" className="border-white/40 text-white" />
              <Label htmlFor="funding-equity" className="font-normal cursor-pointer text-gray-700">Full Equity</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Financed" id="funding-financed" className="border-white/40 text-white" />
              <Label htmlFor="funding-financed" className="font-normal cursor-pointer text-gray-700">Financed</Label>
            </div>
          </RadioGroup>
        </div>

        {draft.type === "Financed" && (
          <div className="border-t border-white/10 pt-6">
            <h4 className="font-display mb-4 text-gray-900">Acquisition Financing</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="label-text text-gray-700 flex items-center gap-1.5">LTV<HelpTooltip text="Loan-to-Value ratio: the percentage of the purchase price financed by the lender. Higher LTV means less equity required but more debt service." /></Label>
                  <EditableValue
                    value={(draft.acquisitionLTV || DEFAULT_LTV) * 100}
                    onChange={(val) => onChange("acquisitionLTV", val / 100)}
                    format="percent"
                    min={0}
                    max={95}
                    step={5}
                  />
                </div>
                <Slider
                  value={[(draft.acquisitionLTV || DEFAULT_LTV) * 100]}
                  onValueChange={(vals: number[]) => onChange("acquisitionLTV", vals[0] / 100)}
                  min={0}
                  max={95}
                  step={5}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="label-text text-gray-700 flex items-center gap-1.5">Interest Rate<HelpTooltip text="Annual interest rate on the acquisition loan. Determines monthly debt service payments." /></Label>
                  <EditableValue
                    value={(draft.acquisitionInterestRate || DEFAULT_INTEREST_RATE) * 100}
                    onChange={(val) => onChange("acquisitionInterestRate", val / 100)}
                    format="percent"
                    min={0}
                    max={20}
                    step={0.25}
                  />
                </div>
                <Slider
                  value={[(draft.acquisitionInterestRate || DEFAULT_INTEREST_RATE) * 100]}
                  onValueChange={(vals: number[]) => onChange("acquisitionInterestRate", vals[0] / 100)}
                  min={0}
                  max={20}
                  step={0.25}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="label-text text-gray-700 flex items-center gap-1.5">Loan Term<HelpTooltip text="Amortization period for the loan in years. Longer terms reduce monthly payments but increase total interest paid." /></Label>
                  <span className="text-sm font-mono text-gray-700">{draft.acquisitionTermYears || DEFAULT_TERM_YEARS} yrs</span>
                </div>
                <Slider
                  value={[draft.acquisitionTermYears || DEFAULT_TERM_YEARS]}
                  onValueChange={(vals: number[]) => onChange("acquisitionTermYears", vals[0])}
                  min={5}
                  max={30}
                  step={5}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="label-text text-gray-700 flex items-center gap-1.5">Closing Costs<HelpTooltip text="Transaction costs as a percentage of the loan amount: lender fees, appraisal, title insurance, legal fees." /></Label>
                  <EditableValue
                    value={(draft.acquisitionClosingCostRate || DEFAULT_ACQ_CLOSING_COST_RATE) * 100}
                    onChange={(val) => onChange("acquisitionClosingCostRate", val / 100)}
                    format="percent"
                    min={0}
                    max={10}
                    step={0.5}
                  />
                </div>
                <Slider
                  value={[(draft.acquisitionClosingCostRate || DEFAULT_ACQ_CLOSING_COST_RATE) * 100]}
                  onValueChange={(vals: number[]) => onChange("acquisitionClosingCostRate", vals[0] / 100)}
                  min={0}
                  max={10}
                  step={0.5}
                />
              </div>
            </div>
          </div>
        )}

        {draft.type === "Full Equity" && (
          <div className="border-t border-white/10 pt-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="label-text text-gray-700 flex items-center gap-1.5">Will this property be refinanced?<HelpTooltip text="Whether this property will refinance after the initial equity investment. Refinancing allows extracting equity by placing debt on an appreciated asset." /></Label>
                <RadioGroup 
                  value={draft.willRefinance || "No"} 
                  onValueChange={(v) => onChange("willRefinance", v)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="refinance-yes" className="border-white/40 text-white" />
                    <Label htmlFor="refinance-yes" className="font-normal cursor-pointer text-gray-700">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="refinance-no" className="border-white/40 text-white" />
                    <Label htmlFor="refinance-no" className="font-normal cursor-pointer text-gray-700">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {draft.willRefinance === "Yes" && (
                <div className="border-t border-white/10 pt-4">
                  <h4 className="font-display mb-4 text-gray-900">Refinance Terms</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="label-text text-gray-700 flex items-center gap-1.5">Refinance Date<HelpTooltip text="When the refinancing occurs. Typically 2-3 years after operations start, once the property has established a track record and appraised value." /></Label>
                      <Input 
                        type="date" 
                        value={draft.refinanceDate || (() => {
                          const refiPeriod = globalAssumptions?.debtAssumptions?.refiPeriodYears ?? DEFAULT_REFI_PERIOD_YEARS;
                          const opsDate = new Date(draft.operationsStartDate);
                          opsDate.setFullYear(opsDate.getFullYear() + refiPeriod);
                          return opsDate.toISOString().split('T')[0];
                        })()} 
                        onChange={(e) => onChange("refinanceDate", e.target.value)}
                        className="bg-white border-primary/30 text-gray-900"
                      />
                      <p className="text-xs text-gray-500">Suggested: {globalAssumptions?.debtAssumptions?.refiPeriodYears ?? DEFAULT_REFI_PERIOD_YEARS} years after operations start</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="label-text text-gray-700 flex items-center gap-1.5">Years After Acquisition<HelpTooltip text="Number of years after acquisition before refinancing occurs." /></Label>
                        <span className="text-sm font-mono text-gray-700" data-testid="text-refinance-years-after-acquisition">{draft.refinanceYearsAfterAcquisition ?? DEFAULT_REFI_PERIOD_YEARS} yrs</span>
                      </div>
                      <Slider
                        data-testid="slider-refinance-years-after-acquisition"
                        value={[draft.refinanceYearsAfterAcquisition ?? DEFAULT_REFI_PERIOD_YEARS]}
                        onValueChange={(vals: number[]) => onChange("refinanceYearsAfterAcquisition", vals[0])}
                        min={1}
                        max={10}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="label-text text-gray-700 flex items-center gap-1.5">LTV<HelpTooltip text="Loan-to-Value ratio for the refinance loan, based on the property's appraised value at the time of refinancing." /></Label>
                        <EditableValue
                          value={(draft.refinanceLTV || DEFAULT_REFI_LTV) * 100}
                          onChange={(val) => onChange("refinanceLTV", val / 100)}
                          format="percent"
                          min={0}
                          max={95}
                          step={5}
                        />
                      </div>
                      <Slider
                        value={[(draft.refinanceLTV || DEFAULT_REFI_LTV) * 100]}
                        onValueChange={(vals: number[]) => onChange("refinanceLTV", vals[0] / 100)}
                        min={0}
                        max={95}
                        step={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="label-text text-gray-700 flex items-center gap-1.5">Interest Rate<HelpTooltip text="Annual interest rate on the refinance loan." /></Label>
                        <EditableValue
                          value={(draft.refinanceInterestRate || DEFAULT_INTEREST_RATE) * 100}
                          onChange={(val) => onChange("refinanceInterestRate", val / 100)}
                          format="percent"
                          min={0}
                          max={20}
                          step={0.25}
                        />
                      </div>
                      <Slider
                        value={[(draft.refinanceInterestRate || DEFAULT_INTEREST_RATE) * 100]}
                        onValueChange={(vals: number[]) => onChange("refinanceInterestRate", vals[0] / 100)}
                        min={0}
                        max={20}
                        step={0.25}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="label-text text-gray-700 flex items-center gap-1.5">Loan Term<HelpTooltip text="Amortization period for the refinance loan in years." /></Label>
                        <span className="text-sm font-mono text-gray-700">{draft.refinanceTermYears || DEFAULT_TERM_YEARS} yrs</span>
                      </div>
                      <Slider
                        value={[draft.refinanceTermYears || DEFAULT_TERM_YEARS]}
                        onValueChange={(vals: number[]) => onChange("refinanceTermYears", vals[0])}
                        min={5}
                        max={30}
                        step={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="label-text text-gray-700 flex items-center gap-1.5">Closing Costs<HelpTooltip text="Transaction costs for the refinance as a percentage of the new loan amount." /></Label>
                        <EditableValue
                          value={(draft.refinanceClosingCostRate || DEFAULT_REFI_CLOSING_COST_RATE) * 100}
                          onChange={(val) => onChange("refinanceClosingCostRate", val / 100)}
                          format="percent"
                          min={0}
                          max={10}
                          step={0.5}
                        />
                      </div>
                      <Slider
                        value={[(draft.refinanceClosingCostRate || DEFAULT_REFI_CLOSING_COST_RATE) * 100]}
                        onValueChange={(vals: number[]) => onChange("refinanceClosingCostRate", vals[0] / 100)}
                        min={0}
                        max={10}
                        step={0.5}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
