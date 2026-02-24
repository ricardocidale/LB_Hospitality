import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import EditableValue from "./EditableValue";
import type { FixedOverheadSectionProps } from "./types";

export default function FixedOverheadSection({ formData, onChange, global, modelStartYear }: FixedOverheadSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
    <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary/5 blur-xl" />
    <div className="relative">
      <div className="space-y-6">
        <h3 className="text-lg font-display text-gray-900 flex items-center">
          Fixed Overhead (<span className="font-mono">{modelStartYear}</span>)
          <HelpTooltip text="Starting annual costs that escalate yearly at the fixed cost escalation rate" manualSection="company-formulas" />
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center text-gray-700 label-text">
              Fixed Cost Escalation Rate
              <HelpTooltip text="Annual percentage increase applied to all fixed costs" />
            </Label>
            <EditableValue
              value={formData.fixedCostEscalationRate ?? global.fixedCostEscalationRate}
              onChange={(v) => onChange("fixedCostEscalationRate", v)}
              format="percent"
              min={0}
              max={0.1}
              step={0.005}
            />
          </div>
          <Slider
            value={[(formData.fixedCostEscalationRate ?? global.fixedCostEscalationRate) * 100]}
            onValueChange={([v]) => onChange("fixedCostEscalationRate", v / 100)}
            min={0}
            max={10}
            step={0.5}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center text-gray-700 label-text">
              Office Lease
              <HelpTooltip text="Annual rent for corporate office space" />
            </Label>
            <EditableValue
              value={formData.officeLeaseStart ?? global.officeLeaseStart}
              onChange={(v) => onChange("officeLeaseStart", v)}
              format="dollar"
              min={0}
              max={200000}
              step={2000}
            />
          </div>
          <Slider
            value={[formData.officeLeaseStart ?? global.officeLeaseStart]}
            onValueChange={([v]) => onChange("officeLeaseStart", v)}
            min={0}
            max={200000}
            step={2000}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center text-gray-700 label-text">
              Professional Services
              <HelpTooltip text="Legal, accounting, and consulting fees" />
            </Label>
            <EditableValue
              value={formData.professionalServicesStart ?? global.professionalServicesStart}
              onChange={(v) => onChange("professionalServicesStart", v)}
              format="dollar"
              min={0}
              max={150000}
              step={2000}
            />
          </div>
          <Slider
            value={[formData.professionalServicesStart ?? global.professionalServicesStart]}
            onValueChange={([v]) => onChange("professionalServicesStart", v)}
            min={0}
            max={150000}
            step={2000}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center text-gray-700 label-text">
              Tech Infrastructure
              <HelpTooltip text="Annual cloud hosting, software, and IT services" />
            </Label>
            <EditableValue
              value={formData.techInfraStart ?? global.techInfraStart}
              onChange={(v) => onChange("techInfraStart", v)}
              format="dollar"
              min={0}
              max={100000}
              step={2000}
            />
          </div>
          <Slider
            value={[formData.techInfraStart ?? global.techInfraStart]}
            onValueChange={([v]) => onChange("techInfraStart", v)}
            min={0}
            max={100000}
            step={2000}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center text-gray-700 label-text">
              Business Insurance
              <HelpTooltip text="E&O, liability, and other corporate insurance policies" />
            </Label>
            <EditableValue
              value={formData.businessInsuranceStart ?? global.businessInsuranceStart}
              onChange={(v) => onChange("businessInsuranceStart", v)}
              format="dollar"
              min={0}
              max={100000}
              step={1000}
            />
          </div>
          <Slider
            value={[formData.businessInsuranceStart ?? global.businessInsuranceStart]}
            onValueChange={([v]) => onChange("businessInsuranceStart", v)}
            min={0}
            max={100000}
            step={1000}
          />
        </div>
      </div>
    </div></div>
  );
}
