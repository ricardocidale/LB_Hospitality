/**
 * FixedOverheadSection.tsx — Fixed monthly/annual overhead costs.
 *
 * These are the management company's operating expenses that don't scale
 * directly with portfolio size (unlike variable costs). They escalate
 * annually at the configured inflation / escalation rate.
 *
 * Categories:
 *   • Office lease — monthly rent for the management company's office
 *   • Insurance — annual general liability, E&O, D&O coverage
 *   • Technology — software subscriptions, PMS licenses, IT infrastructure
 *   • Professional services — legal, accounting, audit fees
 *   • Escalation rate — annual % increase applied to all fixed costs
 *     (tracks CPI / general inflation)
 *
 * The model start year is shown in the section header so the user knows
 * which year's dollars are being entered as the "base year" cost.
 */
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { ResearchBadge } from "@/components/ui/research-badge";
import EditableValue from "./EditableValue";
import type { FixedOverheadSectionProps } from "./types";

export default function FixedOverheadSection({ formData, onChange, global, modelStartYear, researchValues }: FixedOverheadSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-lg p-6 bg-white border border-border shadow-sm">
    <div className="relative">
      <div className="space-y-6">
        <h3 className="text-lg font-display text-foreground flex items-center">
          Fixed Overhead (<span className="font-mono">{modelStartYear}</span>)
          <HelpTooltip text="Starting annual costs that escalate yearly at the fixed cost escalation rate" manualSection="company-formulas" />
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center text-foreground label-text">
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
            <Label className="flex items-center text-foreground label-text">
              Office Lease
              <HelpTooltip text="Annual rent for corporate office space" />
              <ResearchBadge value={researchValues.officeLease?.display} onClick={() => researchValues.officeLease && onChange("officeLeaseStart", researchValues.officeLease.mid)} sourceType="industry" sourceName="HFTP/AICPA benchmarks" data-testid="badge-office-lease" />
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
            <Label className="flex items-center text-foreground label-text">
              Professional Services
              <HelpTooltip text="Legal, accounting, and consulting fees" />
              <ResearchBadge value={researchValues.professionalServices?.display} onClick={() => researchValues.professionalServices && onChange("professionalServicesStart", researchValues.professionalServices.mid)} sourceType="industry" sourceName="AICPA practice benchmarks" data-testid="badge-professional-services" />
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
            <Label className="flex items-center text-foreground label-text">
              Tech Infrastructure
              <HelpTooltip text="Annual cloud hosting, software, and IT services" />
              <ResearchBadge value={researchValues.techInfra?.display} onClick={() => researchValues.techInfra && onChange("techInfraStart", researchValues.techInfra.mid)} sourceType="industry" sourceName="HFTP Technology Survey" data-testid="badge-tech-infra" />
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
            <Label className="flex items-center text-foreground label-text">
              Business Insurance
              <HelpTooltip text="E&O, liability, and other corporate insurance policies" />
              <ResearchBadge value={researchValues.businessInsurance?.display} onClick={() => researchValues.businessInsurance && onChange("businessInsuranceStart", researchValues.businessInsurance.mid)} sourceType="industry" sourceName="AICPA/industry benchmarks" data-testid="badge-business-insurance" />
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
