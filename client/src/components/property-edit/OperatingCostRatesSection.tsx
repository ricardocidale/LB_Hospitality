/**
 * OperatingCostRatesSection.tsx — USALI departmental expense rates.
 *
 * Configures every operating expense line on the property income statement,
 * following the USALI (Uniform System of Accounts for the Lodging Industry)
 * chart of accounts. Expenses are expressed as a percentage of total revenue:
 *
 *   Departmental Expenses (directly tied to revenue departments):
 *     • Rooms expense rate (housekeeping, front desk labor, amenities)
 *     • F&B expense rate (kitchen labor, food cost, beverage cost)
 *
 *   Undistributed Operating Expenses:
 *     • Admin & General (A&G) — back-office, accounting, HR
 *     • Sales & Marketing — advertising, commissions, loyalty programs
 *     • Property Operations & Maintenance (POM) — repairs, engineering
 *     • Utilities — energy, water, waste (split between fixed & variable)
 *
 *   Fixed Charges:
 *     • Property tax rate
 *     • Insurance rate
 *     • FF&E reserve (Furniture, Fixtures & Equipment replacement fund,
 *       typically 3–5% of revenue, required by most lenders)
 *     • Income tax rate (property-level, separate from company tax)
 *
 * Together these rates determine GOP (Gross Operating Profit) and NOI (Net
 * Operating Income), the two key profitability metrics.
 */
import { Label } from "@/components/ui/label";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Slider } from "@/components/ui/slider";
import { EditableValue } from "@/components/ui/editable-value";
import { ResearchBadge } from "@/components/ui/research-badge";
import { GaapBadge } from "@/components/ui/gaap-badge";
import { Link } from "wouter";
import {
  DEFAULT_COST_RATE_ROOMS,
  DEFAULT_COST_RATE_FB,
  DEFAULT_COST_RATE_ADMIN,
  DEFAULT_COST_RATE_MARKETING,
  DEFAULT_COST_RATE_PROPERTY_OPS,
  DEFAULT_COST_RATE_UTILITIES,
  DEFAULT_UTILITIES_VARIABLE_SPLIT,
  DEFAULT_COST_RATE_INSURANCE,
  DEFAULT_COST_RATE_TAXES,
  DEFAULT_COST_RATE_IT,
  DEFAULT_COST_RATE_FFE,
  DEFAULT_COST_RATE_OTHER,
} from "@/lib/constants";
import type { PropertyEditSectionProps } from "./types";

export default function OperatingCostRatesSection({ draft, onChange, globalAssumptions, researchValues }: PropertyEditSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="relative p-6">
        <div className="mb-6">
          <h3 className="text-xl font-display text-foreground flex items-center">
            Operating Cost Rates
            <InfoTooltip text="Expense rates grouped by calculation basis — some scale with revenue, others are fixed amounts that escalate with inflation, and property-value-based charges like insurance and taxes." />
          </h3>
          <p className="text-muted-foreground text-sm label-text">Expense allocation as percentage of revenue</p>
        </div>
        <div className="space-y-6">
        {(() => {
          const costRateTotal = (
            (draft.costRateRooms ?? DEFAULT_COST_RATE_ROOMS) +
            (draft.costRateFB ?? DEFAULT_COST_RATE_FB) +
            (draft.costRateAdmin ?? DEFAULT_COST_RATE_ADMIN) +
            (draft.costRateMarketing ?? DEFAULT_COST_RATE_MARKETING) +
            (draft.costRatePropertyOps ?? DEFAULT_COST_RATE_PROPERTY_OPS) +
            (draft.costRateUtilities ?? DEFAULT_COST_RATE_UTILITIES) +
            (draft.costRateIT ?? DEFAULT_COST_RATE_IT) +
            (draft.costRateFFE ?? DEFAULT_COST_RATE_FFE) +
            (draft.costRateOther ?? DEFAULT_COST_RATE_OTHER)
          );
          
          return (
            <>
              <div className="p-4 rounded-lg bg-muted border border-border">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Total Allocation:</span>
                  <span className="text-lg font-bold text-primary">
                    {(costRateTotal * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Based on Room Revenue</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-sm label-text text-foreground flex items-center gap-1">Housekeeping<InfoTooltip text="Variable cost covering cleaning labor, linens, guest supplies, and room maintenance. Scales directly with room revenue. USALI Rooms Department." /></Label>
                        <ResearchBadge entry={researchValues.costHousekeeping} onClick={() => researchValues.costHousekeeping && onChange("costRateRooms", researchValues.costHousekeeping.mid / 100)} />
                      </div>
                      <EditableValue
                        value={(draft.costRateRooms ?? DEFAULT_COST_RATE_ROOMS) * 100}
                        onChange={(val) => onChange("costRateRooms", val / 100)}
                        format="percent"
                        min={0}
                        max={50}
                        step={1}
                      />
                    </div>
                    <Slider 
                      value={[(draft.costRateRooms ?? DEFAULT_COST_RATE_ROOMS) * 100]}
                      onValueChange={(vals: number[]) => onChange("costRateRooms", vals[0] / 100)}
                      min={0}
                      max={50}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-sm label-text text-foreground flex items-center gap-1">F&B<InfoTooltip text="Variable cost covering kitchen labor, food costs, beverages, and dining operations. Scales with room revenue for consistent cost modeling. USALI F&B Department." /></Label>
                        <ResearchBadge entry={researchValues.costFB} onClick={() => researchValues.costFB && onChange("costRateFB", researchValues.costFB.mid / 100)} />
                      </div>
                      <EditableValue
                        value={(draft.costRateFB ?? DEFAULT_COST_RATE_FB) * 100}
                        onChange={(val) => onChange("costRateFB", val / 100)}
                        format="percent"
                        min={0}
                        max={50}
                        step={1}
                      />
                    </div>
                    <Slider 
                      value={[(draft.costRateFB ?? DEFAULT_COST_RATE_FB) * 100]}
                      onValueChange={(vals: number[]) => onChange("costRateFB", vals[0] / 100)}
                      min={0}
                      max={50}
                      step={1}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Based on Total Revenue</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-sm label-text text-foreground flex items-center gap-1">Admin & General<InfoTooltip text="Fixed cost covering management salaries, accounting, legal, HR, and office operations. Dollar amount is set from Year 1 revenue and escalates annually with inflation. USALI A&G Department." /></Label>
                        <ResearchBadge entry={researchValues.costAdmin} onClick={() => researchValues.costAdmin && onChange("costRateAdmin", researchValues.costAdmin.mid / 100)} />
                      </div>
                      <EditableValue
                        value={(draft.costRateAdmin ?? DEFAULT_COST_RATE_ADMIN) * 100}
                        onChange={(val) => onChange("costRateAdmin", val / 100)}
                        format="percent"
                        min={0}
                        max={25}
                        step={1}
                      />
                    </div>
                    <Slider 
                      value={[(draft.costRateAdmin ?? DEFAULT_COST_RATE_ADMIN) * 100]}
                      onValueChange={(vals: number[]) => onChange("costRateAdmin", vals[0] / 100)}
                      min={0}
                      max={25}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-sm label-text text-foreground flex items-center gap-1">Property Ops<InfoTooltip text="Fixed cost covering engineering, repairs, grounds maintenance, and facilities. Dollar amount is set from Year 1 revenue and escalates annually with inflation. USALI POM Department." /></Label>
                        <ResearchBadge entry={researchValues.costPropertyOps} onClick={() => researchValues.costPropertyOps && onChange("costRatePropertyOps", researchValues.costPropertyOps.mid / 100)} />
                      </div>
                      <EditableValue
                        value={(draft.costRatePropertyOps ?? DEFAULT_COST_RATE_PROPERTY_OPS) * 100}
                        onChange={(val) => onChange("costRatePropertyOps", val / 100)}
                        format="percent"
                        min={0}
                        max={25}
                        step={1}
                      />
                    </div>
                    <Slider 
                      value={[(draft.costRatePropertyOps ?? DEFAULT_COST_RATE_PROPERTY_OPS) * 100]}
                      onValueChange={(vals: number[]) => onChange("costRatePropertyOps", vals[0] / 100)}
                      min={0}
                      max={25}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-sm label-text text-foreground flex items-center gap-1">Utilities<InfoTooltip text="Covers electricity, gas, water, sewer, and waste. Split between a variable portion that scales with revenue and a fixed portion that escalates with inflation. USALI Utilities." /></Label>
                        <ResearchBadge entry={researchValues.costUtilities} onClick={() => researchValues.costUtilities && onChange("costRateUtilities", researchValues.costUtilities.mid / 100)} />
                      </div>
                      <EditableValue
                        value={(draft.costRateUtilities ?? DEFAULT_COST_RATE_UTILITIES) * 100}
                        onChange={(val) => onChange("costRateUtilities", val / 100)}
                        format="percent"
                        min={0}
                        max={25}
                        step={1}
                      />
                    </div>
                    <Slider 
                      value={[(draft.costRateUtilities ?? DEFAULT_COST_RATE_UTILITIES) * 100]}
                      onValueChange={(vals: number[]) => onChange("costRateUtilities", vals[0] / 100)}
                      min={0}
                      max={25}
                      step={1}
                    />
                    {(() => {
                      const split = globalAssumptions?.utilitiesVariableSplit ?? DEFAULT_UTILITIES_VARIABLE_SPLIT;
                      const rate = (draft.costRateUtilities ?? DEFAULT_COST_RATE_UTILITIES) * 100;
                      return (
                        <div className="mt-1 pl-2 border-l-2 border-border space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Variable (scales with revenue)</span>
                            <span className="font-mono">{(rate * split).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Fixed (escalates with inflation)</span>
                            <span className="font-mono">{(rate * (1 - split)).toFixed(1)}%</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground/70">
                            Split is {(split * 100).toFixed(0)}% variable / {((1 - split) * 100).toFixed(0)}% fixed — set in <Link href="/assumptions" className="underline hover:text-primary">Company Assumptions</Link>
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-sm label-text text-foreground flex items-center gap-1">FF&E Reserve<InfoTooltip text="Variable set-aside for future replacement of furniture, fixtures, and equipment. Scales with total revenue. Industry standard: 3–5%." /><GaapBadge rule="USALI Standard: FF&E reserve is deducted from NOI (Net Operating Income) to arrive at ANOI (Adjusted Net Operating Income). Actual FF&E replacements are capitalized and depreciated over 5–7 years (IRS Class Life), not expensed. The reserve funds future CapEx." /></Label>
                        <ResearchBadge entry={researchValues.costFFE} onClick={() => researchValues.costFFE && onChange("costRateFFE", researchValues.costFFE.mid / 100)} />
                      </div>
                      <EditableValue
                        value={(draft.costRateFFE ?? DEFAULT_COST_RATE_FFE) * 100}
                        onChange={(val) => onChange("costRateFFE", val / 100)}
                        format="percent"
                        min={0}
                        max={15}
                        step={1}
                      />
                    </div>
                    <Slider 
                      value={[(draft.costRateFFE ?? DEFAULT_COST_RATE_FFE) * 100]}
                      onValueChange={(vals: number[]) => onChange("costRateFFE", vals[0] / 100)}
                      min={0}
                      max={15}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-sm label-text text-foreground flex items-center gap-1">Other<InfoTooltip text="Fixed cost for miscellaneous operating expenses not categorized elsewhere. Dollar amount is set from Year 1 revenue and escalates annually with inflation." /></Label>
                        <ResearchBadge entry={researchValues.costOther} onClick={() => researchValues.costOther && onChange("costRateOther", researchValues.costOther.mid / 100)} />
                      </div>
                      <EditableValue
                        value={(draft.costRateOther ?? DEFAULT_COST_RATE_OTHER) * 100}
                        onChange={(val) => onChange("costRateOther", val / 100)}
                        format="percent"
                        min={0}
                        max={15}
                        step={1}
                      />
                    </div>
                    <Slider 
                      value={[(draft.costRateOther ?? DEFAULT_COST_RATE_OTHER) * 100]}
                      onValueChange={(vals: number[]) => onChange("costRateOther", vals[0] / 100)}
                      min={0}
                      max={25}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-sm label-text text-foreground flex items-center gap-1">Marketing<InfoTooltip text="Variable cost covering property-level advertising, OTA commissions, and local promotions. Scales with total revenue. USALI Sales & Marketing Department." /></Label>
                        <ResearchBadge entry={researchValues.costMarketing} onClick={() => researchValues.costMarketing && onChange("costRateMarketing", researchValues.costMarketing.mid / 100)} />
                      </div>
                      <EditableValue
                        value={(draft.costRateMarketing ?? DEFAULT_COST_RATE_MARKETING) * 100}
                        onChange={(val) => onChange("costRateMarketing", val / 100)}
                        format="percent"
                        min={0}
                        max={15}
                        step={1}
                      />
                    </div>
                    <Slider 
                      value={[(draft.costRateMarketing ?? DEFAULT_COST_RATE_MARKETING) * 100]}
                      onValueChange={(vals: number[]) => onChange("costRateMarketing", vals[0] / 100)}
                      min={0}
                      max={15}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-sm label-text text-foreground flex items-center gap-1">IT<InfoTooltip text="Fixed cost covering property-level IT needs — WiFi, in-room tech, PMS, and basic support. Dollar amount is set from Year 1 revenue and escalates annually with inflation." /></Label>
                        <ResearchBadge entry={researchValues.costIT} onClick={() => researchValues.costIT && onChange("costRateIT", researchValues.costIT.mid / 100)} />
                      </div>
                      <EditableValue
                        value={(draft.costRateIT ?? DEFAULT_COST_RATE_IT) * 100}
                        onChange={(val) => onChange("costRateIT", val / 100)}
                        format="percent"
                        min={0}
                        max={15}
                        step={1}
                      />
                    </div>
                    <Slider 
                      value={[(draft.costRateIT ?? DEFAULT_COST_RATE_IT) * 100]}
                      onValueChange={(vals: number[]) => onChange("costRateIT", vals[0] / 100)}
                      min={0}
                      max={15}
                      step={1}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Based on Property Value</h4>
                <p className="text-xs text-muted-foreground mb-4">Calculated as a percentage of total property value (Purchase Price + Building Improvements), adjusted annually by the Inflation Escalator Factor.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-sm label-text text-foreground flex items-center gap-1">Insurance<InfoTooltip text="Based on total property value, not revenue. Covers property liability, damage, workers' comp, and business interruption coverage. Escalates annually with inflation." /><GaapBadge rule="GAAP Matching Principle: Insurance premiums are expensed as incurred over the policy period. Prepaid portions are recorded as current assets and amortized monthly. Not capitalizable into property basis." /></Label>
                        <ResearchBadge entry={researchValues.costInsurance} onClick={() => researchValues.costInsurance && onChange("costRateInsurance", researchValues.costInsurance.mid / 100)} />
                      </div>
                      <EditableValue
                        value={(draft.costRateInsurance ?? DEFAULT_COST_RATE_INSURANCE) * 100}
                        onChange={(val) => onChange("costRateInsurance", val / 100)}
                        format="percent"
                        min={0}
                        max={15}
                        step={1}
                      />
                    </div>
                    <Slider 
                      value={[(draft.costRateInsurance ?? DEFAULT_COST_RATE_INSURANCE) * 100]}
                      onValueChange={(vals: number[]) => onChange("costRateInsurance", vals[0] / 100)}
                      min={0}
                      max={15}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-sm label-text text-foreground flex items-center gap-1">Property Taxes<InfoTooltip text="Based on total property value, not revenue. Covers real estate taxes and assessments. Escalates annually with inflation." /><GaapBadge rule="IRC §164: Property taxes are fully deductible as an operating expense for income tax purposes. Based on assessed value, not market value. Reassessment may occur upon sale or significant improvement." /></Label>
                        <ResearchBadge entry={researchValues.costPropertyTaxes} onClick={() => researchValues.costPropertyTaxes && onChange("costRateTaxes", researchValues.costPropertyTaxes.mid / 100)} />
                      </div>
                      <EditableValue
                        value={(draft.costRateTaxes ?? DEFAULT_COST_RATE_TAXES) * 100}
                        onChange={(val) => onChange("costRateTaxes", val / 100)}
                        format="percent"
                        min={0}
                        max={15}
                        step={1}
                      />
                    </div>
                    <Slider 
                      value={[(draft.costRateTaxes ?? DEFAULT_COST_RATE_TAXES) * 100]}
                      onValueChange={(vals: number[]) => onChange("costRateTaxes", vals[0] / 100)}
                      min={0}
                      max={15}
                      step={1}
                    />
                  </div>
                </div>
              </div>

            </>
          );
        })()}
        </div>
      </div>
    </div>
  );
}
