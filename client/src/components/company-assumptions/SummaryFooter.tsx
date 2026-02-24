/**
 * SummaryFooter.tsx — Computed summary of current company assumptions.
 *
 * Renders a read-only summary bar at the bottom of the Company Assumptions
 * page showing key derived metrics:
 *   • Total fixed overhead (sum of office, insurance, tech, professional svcs)
 *   • Current staffing tier and FTE count
 *   • Annual staff cost (FTEs × average salary × (1 + burden rate))
 *   • Total partner draws
 *   • Effective tax rate
 *
 * This gives the user a quick sanity check: "my management company will
 * cost $X/year to operate before earning any fee revenue."
 */
import { formatPercent } from "@/lib/financialEngine";
import { STAFFING_TIERS } from "@/lib/constants";
import type { CompanyAssumptionsSectionProps } from "./types";

export default function SummaryFooter({ formData, global }: CompanyAssumptionsSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary/5 blur-xl" />
      <div className="relative">
      <p className="text-sm text-gray-600 text-center label-text">
        Fixed overhead escalates at <span className="font-mono">{formatPercent(formData.fixedCostEscalationRate ?? global.fixedCostEscalationRate)}</span>/year. Staff scales: <span className="font-mono">{formData.staffTier1Fte ?? global.staffTier1Fte ?? STAFFING_TIERS[0].fte}</span> FTE (1-{formData.staffTier1MaxProperties ?? global.staffTier1MaxProperties ?? STAFFING_TIERS[0].maxProperties} properties), <span className="font-mono">{formData.staffTier2Fte ?? global.staffTier2Fte ?? STAFFING_TIERS[1].fte}</span> ({(formData.staffTier1MaxProperties ?? global.staffTier1MaxProperties ?? STAFFING_TIERS[0].maxProperties) + 1}-{formData.staffTier2MaxProperties ?? global.staffTier2MaxProperties ?? STAFFING_TIERS[1].maxProperties}), <span className="font-mono">{formData.staffTier3Fte ?? global.staffTier3Fte ?? STAFFING_TIERS[2].fte}</span> ({(formData.staffTier2MaxProperties ?? global.staffTier2MaxProperties ?? STAFFING_TIERS[1].maxProperties) + 1}+).
        All costs begin at Operations Start Date and are prorated for partial years.
      </p>
    </div></div>
  );
}
