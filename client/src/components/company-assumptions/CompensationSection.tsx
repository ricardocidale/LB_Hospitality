/**
 * CompensationSection.tsx — Staff compensation and headcount tiers.
 *
 * Configures the management company's people costs. Staffing scales with
 * portfolio size through "staffing tiers" — discrete FTE headcount
 * thresholds that increase as more properties are acquired:
 *
 *   Tier 1 (1–2 properties): minimal team (e.g. 3 FTEs)
 *   Tier 2 (3–5 properties): expanded team (e.g. 8 FTEs)
 *   Tier 3 (6+ properties): full team (e.g. 15 FTEs)
 *
 * Inputs:
 *   • Average salary per FTE
 *   • Payroll burden rate (benefits, taxes — typically 20–30% of salary)
 *   • Annual salary escalation rate (cost-of-living raises)
 *   • FTE counts for each tier
 *
 * Research badges show AI-generated salary benchmarks for hospitality
 * management roles in the user's market, when available.
 */
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { ResearchBadge } from "@/components/ui/research-badge";
import EditableValue from "./EditableValue";
import type { CompensationSectionProps } from "./types";

export default function CompensationSection({ formData, onChange, global, researchValues }: CompensationSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
    <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary/5 blur-xl" />
    <div className="relative">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-display text-gray-900 flex items-center">
            Compensation
            <HelpTooltip text="Annual salaries for management company team members" />
          </h3>
          <p className="text-gray-600 text-sm label-text">Configure partner compensation, staff salaries, and staffing tiers</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center text-gray-700 label-text">
              Staff Salary (Avg)
              <HelpTooltip text="Average annual salary per staff FTE. Staffing scales based on the tiers configured below." />
              <ResearchBadge value={researchValues.staffSalary?.display} onClick={() => researchValues.staffSalary && onChange("staffSalary", researchValues.staffSalary.mid)} data-testid="badge-staff-salary" />
            </Label>
            <EditableValue
              value={formData.staffSalary ?? global.staffSalary}
              onChange={(v) => onChange("staffSalary", v)}
              format="dollar"
              min={40000}
              max={200000}
              step={5000}
            />
          </div>
          <Slider
            value={[formData.staffSalary ?? global.staffSalary]}
            onValueChange={([v]) => onChange("staffSalary", v)}
            min={40000}
            max={200000}
            step={5000}
          />
        </div>

        <div className="pt-4 border-t border-primary/20">
          <div className="mb-3">
            <Label className="flex items-center text-gray-700 label-text font-medium">
              Staffing Tiers
              <HelpTooltip text="Define how many full-time employees (FTE) are needed based on the number of properties under management. Each tier sets a maximum property count and the FTE required." />
            </Label>
            <p className="text-xs text-gray-500 mt-1">Set the FTE headcount for each portfolio size bracket</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 bg-primary/5 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-600 w-20 shrink-0">Tier 1:</span>
              <span className="text-xs text-gray-500">Up to</span>
              <Input
                type="number"
                value={formData.staffTier1MaxProperties ?? global.staffTier1MaxProperties ?? 3}
                onChange={(e) => onChange("staffTier1MaxProperties", Math.max(1, parseInt(e.target.value) || 3))}
                min={1}
                max={20}
                className="w-16 bg-white border-primary/30 text-gray-900 text-center"
                data-testid="input-tier1-max-properties"
              />
              <span className="text-xs text-gray-500">properties →</span>
              <Input
                type="number"
                value={formData.staffTier1Fte ?? global.staffTier1Fte ?? 2.5}
                onChange={(e) => onChange("staffTier1Fte", Math.max(0.5, parseFloat(e.target.value) || 2.5))}
                min={0.5}
                max={20}
                step={0.5}
                className="w-20 bg-white border-primary/30 text-gray-900 text-center"
                data-testid="input-tier1-fte"
              />
              <span className="text-xs text-gray-500">FTE</span>
            </div>
            <div className="flex items-center gap-3 bg-primary/5 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-600 w-20 shrink-0">Tier 2:</span>
              <span className="text-xs text-gray-500">Up to</span>
              <Input
                type="number"
                value={formData.staffTier2MaxProperties ?? global.staffTier2MaxProperties ?? 6}
                onChange={(e) => onChange("staffTier2MaxProperties", Math.max(1, parseInt(e.target.value) || 6))}
                min={1}
                max={30}
                className="w-16 bg-white border-primary/30 text-gray-900 text-center"
                data-testid="input-tier2-max-properties"
              />
              <span className="text-xs text-gray-500">properties →</span>
              <Input
                type="number"
                value={formData.staffTier2Fte ?? global.staffTier2Fte ?? 4.5}
                onChange={(e) => onChange("staffTier2Fte", Math.max(0.5, parseFloat(e.target.value) || 4.5))}
                min={0.5}
                max={30}
                step={0.5}
                className="w-20 bg-white border-primary/30 text-gray-900 text-center"
                data-testid="input-tier2-fte"
              />
              <span className="text-xs text-gray-500">FTE</span>
            </div>
            <div className="flex items-center gap-3 bg-primary/5 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-600 w-20 shrink-0">Tier 3:</span>
              <span className="text-xs text-gray-500">Above {formData.staffTier2MaxProperties ?? global.staffTier2MaxProperties ?? 6} properties →</span>
              <Input
                type="number"
                value={formData.staffTier3Fte ?? global.staffTier3Fte ?? 7.0}
                onChange={(e) => onChange("staffTier3Fte", Math.max(0.5, parseFloat(e.target.value) || 7.0))}
                min={0.5}
                max={50}
                step={0.5}
                className="w-20 bg-white border-primary/30 text-gray-900 text-center"
                data-testid="input-tier3-fte"
              />
              <span className="text-xs text-gray-500">FTE</span>
            </div>
          </div>
        </div>
      </div>
    </div></div>
  );
}
