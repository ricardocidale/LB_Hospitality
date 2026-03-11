/**
 * ExitAssumptionsSection.tsx — Company-level exit, disposition, and valuation assumptions.
 *
 * Configures:
 *   • Cost of Equity (Re) — required equity return for WACC/DCF
 *   • Exit cap rate — cap rate used for property exit valuation
 *   • Sales commission rate — broker commission on property sales
 */
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { ResearchBadge } from "@/components/ui/research-badge";
import { DEFAULT_EXIT_CAP_RATE, DEFAULT_COMMISSION_RATE } from "@/lib/constants";
import { DEFAULT_COST_OF_EQUITY } from "@shared/constants";
import EditableValue from "./EditableValue";
import type { ExitAssumptionsSectionProps } from "./types";

export default function ExitAssumptionsSection({ formData, onChange, global, researchValues }: ExitAssumptionsSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-lg p-6 bg-card border border-border shadow-sm">
      <div className="relative">
      <div className="space-y-6">
        <h3 className="text-lg font-display text-foreground flex items-center gap-2">
          Exit, Sale & Valuation Assumptions
          <HelpTooltip text="Default values for property exit valuations, WACC discount rate, and sale transactions." manualSection="investment-returns" />
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center text-foreground label-text">
              Cost of Equity (Re)
              <HelpTooltip text="Required equity return for private hospitality investment. Used as the Re component in WACC = (E/V × Re) + (D/V × Rd × (1−T)). For private companies, this is the investor's hurdle rate (typically 15–25%), not CAPM-derived." manualSection="investment-returns" />
              <ResearchBadge value={researchValues.costOfEquity?.display} onClick={() => researchValues.costOfEquity && onChange("costOfEquity", researchValues.costOfEquity.mid / 100)} sourceType="industry" sourceName="Private RE equity benchmarks" data-testid="badge-cost-of-equity" />
            </Label>
            <EditableValue
              value={formData.costOfEquity ?? global.costOfEquity ?? DEFAULT_COST_OF_EQUITY}
              onChange={(v) => onChange("costOfEquity", v)}
              format="percent"
              min={0.05}
              max={0.40}
              step={0.005}
            />
          </div>
          <Slider
            value={[(formData.costOfEquity ?? global.costOfEquity ?? DEFAULT_COST_OF_EQUITY) * 100]}
            onValueChange={([v]) => onChange("costOfEquity", v / 100)}
            min={5}
            max={40}
            step={0.5}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center text-foreground label-text">
              Default Exit Cap Rate
              <HelpTooltip text="Capitalization rate used for property valuation at exit. Higher cap rate = lower valuation." manualSection="investment-returns" />
              <ResearchBadge value={researchValues.exitCapRate?.display} onClick={() => researchValues.exitCapRate && onChange("exitCapRate", researchValues.exitCapRate.mid / 100)} sourceType="industry" sourceName="CBRE Cap Rate Survey" data-testid="badge-exit-cap" />
            </Label>
            <EditableValue
              value={formData.exitCapRate ?? global.exitCapRate ?? DEFAULT_EXIT_CAP_RATE}
              onChange={(v) => onChange("exitCapRate", v)}
              format="percent"
              min={0.04}
              max={0.15}
              step={0.005}
            />
          </div>
          <Slider
            value={[(formData.exitCapRate ?? global.exitCapRate ?? DEFAULT_EXIT_CAP_RATE) * 100]}
            onValueChange={([v]) => onChange("exitCapRate", v / 100)}
            min={4}
            max={15}
            step={0.5}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center text-foreground label-text">
              Default Sales Commission Rate (% of Gross Sale Price)
              <HelpTooltip text="Default broker commission for new properties. Each property can override this with its own disposition commission on its assumptions page." />
              <ResearchBadge value={researchValues.salesCommission?.display} onClick={() => researchValues.salesCommission && onChange("salesCommissionRate", researchValues.salesCommission.mid / 100)} sourceType="industry" sourceName="NAR transaction data" data-testid="badge-sales-commission" />
            </Label>
            <EditableValue
              value={formData.salesCommissionRate ?? global.salesCommissionRate ?? DEFAULT_COMMISSION_RATE}
              onChange={(v) => onChange("salesCommissionRate", v)}
              format="percent"
              min={0}
              max={0.10}
              step={0.005}
            />
          </div>
          <Slider
            value={[(formData.salesCommissionRate ?? global.salesCommissionRate ?? DEFAULT_COMMISSION_RATE) * 100]}
            onValueChange={([v]) => onChange("salesCommissionRate", v / 100)}
            min={0}
            max={10}
            step={0.5}
          />
        </div>
      </div>
    </div></div>
  );
}
