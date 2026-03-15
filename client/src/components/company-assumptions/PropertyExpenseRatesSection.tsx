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
 * Research Badges show AI-generated benchmarks for the configured property
 * type and market, giving users a sense of what's "normal" before they
 * customize individual properties.
 */
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { InfoTooltip } from "@/components/ui/info-tooltip";
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
    <div className="relative overflow-hidden rounded-lg p-6 bg-card border border-border shadow-sm">
      <div className="relative">
      <div className="space-y-6">
        <h3 className="text-lg font-display text-foreground flex items-center gap-2">
          Property Expense Rates
          <InfoTooltip text="Default expense rates applied to specific revenue streams at the property level" />
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center text-foreground label-text">
              Event Expense Rate
              <InfoTooltip text="As a percentage of event revenue. Operating costs for events (labor, setup, coordination)." />
              <ResearchBadge value={researchValues.eventExpense?.display} onClick={() => researchValues.eventExpense && onChange("eventExpenseRate", researchValues.eventExpense.mid / 100)} sourceType="industry" sourceName="USALI benchmarks" data-testid="badge-event-expense" />
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
            <Label className="flex items-center text-foreground label-text">
              Other Revenue Expense Rate
              <InfoTooltip text="As a percentage of other revenue. Operating costs for ancillary departments (spa, parking, retail) as a percentage of that department's revenue." />
              <ResearchBadge value={researchValues.otherExpenseRate?.display} onClick={() => researchValues.otherExpenseRate && onChange("otherExpenseRate", researchValues.otherExpenseRate.mid / 100)} sourceType="industry" sourceName="USALI benchmarks" data-testid="badge-other-expense" />
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
            <Label className="flex items-center text-foreground label-text">
              Utilities Variable Split (% Variable vs Fixed)
              <InfoTooltip text="How much of the utilities expense rate scales with current property revenue (variable) vs stays anchored to Year 1 base revenue (fixed). Example: 60% means 60% of utilities cost varies with occupancy, 40% is fixed overhead." />
              <ResearchBadge value={researchValues.utilitiesVariableSplit?.display} onClick={() => researchValues.utilitiesVariableSplit && onChange("utilitiesVariableSplit", researchValues.utilitiesVariableSplit.mid / 100)} sourceType="industry" sourceName="USALI benchmarks" data-testid="badge-utilities-split" />
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
          <p className="text-xs text-muted-foreground mt-2">
            Variable utilities scale with revenue, fixed utilities remain constant regardless of occupancy
          </p>
        </div>
      </div>
    </div></div>
  );
}
