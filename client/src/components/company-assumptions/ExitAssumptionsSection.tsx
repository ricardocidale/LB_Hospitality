/**
 * ExitAssumptionsSection.tsx — Company-level exit / disposition assumptions.
 *
 * Configures how the model values the management company at the end
 * of the projection period:
 *
 *   • Exit multiple — EBITDA multiple used to value the management company
 *     at sale (e.g. 8× means sale price = 8 × trailing EBITDA)
 *   • Exit year — which projection year the company is sold
 *   • Disposition fee rate — commission or advisory fee on the sale
 *
 * These are conceptually different from the property-level exit assumptions
 * (which use cap rates on NOI). Management companies are typically valued
 * on an EBITDA multiple because they are operating businesses, not
 * real estate assets.
 */
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { ResearchBadge } from "@/components/ui/research-badge";
import { DEFAULT_EXIT_CAP_RATE, DEFAULT_COMMISSION_RATE } from "@/lib/constants";
import EditableValue from "./EditableValue";
import type { ExitAssumptionsSectionProps } from "./types";

export default function ExitAssumptionsSection({ formData, onChange, global, researchValues }: ExitAssumptionsSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-lg p-6 bg-card border border-border shadow-sm">
      <div className="relative">
      <div className="space-y-6">
        <h3 className="text-lg font-display text-foreground flex items-center gap-2">
          Exit & Sale Assumptions
          <HelpTooltip text="Default values for property exit valuations and sale transactions" />
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center text-foreground label-text">
              Default Exit Cap Rate
              <HelpTooltip text="Capitalization rate used for property valuation at exit. Higher cap rate = lower valuation." />
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
