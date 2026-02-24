/**
 * PropertyExpenseRatesSection.tsx — Default USALI expense rates for new properties.
 *
 * Sets the global default operating expense percentages that are applied to
 * newly created properties. When a property is added to the portfolio, these
 * rates pre-fill its OperatingCostRatesSection; users can then override
 * them per-property.
 *
 * The rates follow the USALI (Uniform System of Accounts for the Lodging
 * Industry) chart of accounts:
 *   • Rooms expense, F&B expense (departmental)
 *   • A&G, S&M, POM, Utilities (undistributed)
 *   • Property tax, insurance, FF&E reserve (fixed charges)
 *
 * Research badges show AI-generated benchmarks for the configured property
 * type and market, giving users a sense of what's "normal" before they
 * customize individual properties.
 */
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { ResearchBadge } from "@/components/ui/research-badge";
import {
  DEFAULT_EVENT_EXPENSE_RATE,
  DEFAULT_OTHER_EXPENSE_RATE,
  DEFAULT_UTILITIES_VARIABLE_SPLIT,
} from "@/lib/constants";
import EditableValue from "./EditableValue";
import type { PropertyExpenseRatesSectionProps } from "./types";

export default function PropertyExpenseRatesSection({ formData, onChange, global, researchValues }: PropertyExpenseRatesSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary/5 blur-xl" />
      <div className="relative">
      <div className="space-y-6">
        <h3 className="text-lg font-display text-gray-900 flex items-center gap-2">
          Property Expense Rates
          <HelpTooltip text="Default expense rates applied to specific revenue streams at the property level" />
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center text-gray-700 label-text">
              Event Expense Rate (% of Event Revenue)
              <HelpTooltip text="Operating costs for events as a percentage of event revenue (labor, setup, coordination)" />
              <ResearchBadge value={researchValues.eventExpense?.display} onClick={() => researchValues.eventExpense && onChange("eventExpenseRate", researchValues.eventExpense.mid / 100)} data-testid="badge-event-expense" />
            </Label>
            <EditableValue
              value={formData.eventExpenseRate ?? global.eventExpenseRate ?? DEFAULT_EVENT_EXPENSE_RATE}
              onChange={(v) => onChange("eventExpenseRate", v)}
              format="percent"
              min={0.30}
              max={0.90}
              step={0.05}
            />
          </div>
          <Slider
            value={[(formData.eventExpenseRate ?? global.eventExpenseRate ?? DEFAULT_EVENT_EXPENSE_RATE) * 100]}
            onValueChange={([v]) => onChange("eventExpenseRate", v / 100)}
            min={30}
            max={90}
            step={5}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center text-gray-700 label-text">
              Other Revenue Expense Rate (% of Other Revenue)
              <HelpTooltip text="Operating costs for other revenue (spa, parking, retail) as a percentage of that department's revenue" />
            </Label>
            <EditableValue
              value={formData.otherExpenseRate ?? global.otherExpenseRate ?? DEFAULT_OTHER_EXPENSE_RATE}
              onChange={(v) => onChange("otherExpenseRate", v)}
              format="percent"
              min={0.30}
              max={0.90}
              step={0.05}
            />
          </div>
          <Slider
            value={[(formData.otherExpenseRate ?? global.otherExpenseRate ?? DEFAULT_OTHER_EXPENSE_RATE) * 100]}
            onValueChange={([v]) => onChange("otherExpenseRate", v / 100)}
            min={30}
            max={90}
            step={5}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center text-gray-700 label-text">
              Utilities Variable Split (% Variable vs Fixed)
              <HelpTooltip text="How much of the utilities expense rate scales with current property revenue (variable) vs stays anchored to Year 1 base revenue (fixed). Example: 60% means 60% of utilities cost varies with occupancy, 40% is fixed overhead." />
            </Label>
            <EditableValue
              value={formData.utilitiesVariableSplit ?? global.utilitiesVariableSplit ?? DEFAULT_UTILITIES_VARIABLE_SPLIT}
              onChange={(v) => onChange("utilitiesVariableSplit", v)}
              format="percent"
              min={0.20}
              max={0.80}
              step={0.05}
            />
          </div>
          <Slider
            value={[(formData.utilitiesVariableSplit ?? global.utilitiesVariableSplit ?? DEFAULT_UTILITIES_VARIABLE_SPLIT) * 100]}
            onValueChange={([v]) => onChange("utilitiesVariableSplit", v / 100)}
            min={20}
            max={80}
            step={5}
          />
          <p className="text-xs text-gray-600 mt-2">
            Variable utilities scale with revenue, fixed utilities remain constant regardless of occupancy
          </p>
        </div>
      </div>
    </div></div>
  );
}
