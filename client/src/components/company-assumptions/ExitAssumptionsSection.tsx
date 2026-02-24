import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { DEFAULT_EXIT_CAP_RATE, DEFAULT_COMMISSION_RATE } from "@/lib/constants";
import EditableValue from "./EditableValue";
import type { CompanyAssumptionsSectionProps } from "./types";

export default function ExitAssumptionsSection({ formData, onChange, global }: CompanyAssumptionsSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary/5 blur-xl" />
      <div className="relative">
      <div className="space-y-6">
        <h3 className="text-lg font-display text-gray-900 flex items-center gap-2">
          Exit & Sale Assumptions
          <HelpTooltip text="Default values for property exit valuations and sale transactions" />
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center text-gray-700 label-text">
              Default Exit Cap Rate
              <HelpTooltip text="Capitalization rate used for property valuation at exit. Higher cap rate = lower valuation." />
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
            <Label className="flex items-center text-gray-700 label-text">
              Default Sales Commission Rate (% of Gross Sale Price)
              <HelpTooltip text="Default broker commission for new properties. Each property can override this with its own disposition commission on its assumptions page." />
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
