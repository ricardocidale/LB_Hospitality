import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { ResearchBadge } from "@/components/ui/research-badge";
import EditableValue from "./EditableValue";
import type { VariableCostsSectionProps } from "./types";

export default function VariableCostsSection({ formData, onChange, global, researchValues }: VariableCostsSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
    <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary/5 blur-xl" />
    <div className="relative">
      <div className="space-y-6">
        <h3 className="text-lg font-display text-gray-900 flex items-center">
          Variable Costs
          <HelpTooltip text="Costs that scale with property count or revenue" />
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center text-gray-700 label-text">
              Travel Cost per Client
              <HelpTooltip text="Annual travel expense budget per managed property" />
            </Label>
            <EditableValue
              value={formData.travelCostPerClient ?? global.travelCostPerClient}
              onChange={(v) => onChange("travelCostPerClient", v)}
              format="dollar"
              min={0}
              max={50000}
              step={1000}
            />
          </div>
          <Slider
            value={[formData.travelCostPerClient ?? global.travelCostPerClient]}
            onValueChange={([v]) => onChange("travelCostPerClient", v)}
            min={0}
            max={50000}
            step={1000}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center text-gray-700 label-text">
              IT/Licensing per Client
              <HelpTooltip text="PMS, revenue management, and software licenses per B&B property" />
            </Label>
            <EditableValue
              value={formData.itLicensePerClient ?? global.itLicensePerClient}
              onChange={(v) => onChange("itLicensePerClient", v)}
              format="dollar"
              min={0}
              max={15000}
              step={500}
            />
          </div>
          <Slider
            value={[formData.itLicensePerClient ?? global.itLicensePerClient]}
            onValueChange={([v]) => onChange("itLicensePerClient", v)}
            min={0}
            max={15000}
            step={500}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center text-gray-700 label-text">
              Marketing (% of Mgmt Fee Revenue)
              <HelpTooltip text="Corporate marketing spend as a percentage of total management fee revenue (base + incentive fees collected from properties)" />
              <ResearchBadge value={researchValues.marketingRate?.display} onClick={() => researchValues.marketingRate && onChange("marketingRate", researchValues.marketingRate.mid / 100)} data-testid="badge-marketing-rate" />
            </Label>
            <EditableValue
              value={formData.marketingRate ?? global.marketingRate}
              onChange={(v) => onChange("marketingRate", v)}
              format="percent"
              min={0}
              max={0.15}
              step={0.01}
            />
          </div>
          <Slider
            value={[(formData.marketingRate ?? global.marketingRate) * 100]}
            onValueChange={([v]) => onChange("marketingRate", v / 100)}
            min={0}
            max={15}
            step={1}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center text-gray-700 label-text">
              Misc Operations (% of Mgmt Fee Revenue)
              <HelpTooltip text="General operating expenses as a percentage of total management fee revenue (base + incentive fees collected from properties)" />
            </Label>
            <EditableValue
              value={formData.miscOpsRate ?? global.miscOpsRate}
              onChange={(v) => onChange("miscOpsRate", v)}
              format="percent"
              min={0}
              max={0.1}
              step={0.005}
            />
          </div>
          <Slider
            value={[(formData.miscOpsRate ?? global.miscOpsRate) * 100]}
            onValueChange={([v]) => onChange("miscOpsRate", v / 100)}
            min={0}
            max={10}
            step={0.5}
          />
        </div>
      </div>
    </div></div>
  );
}
