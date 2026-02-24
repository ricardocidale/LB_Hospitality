import { useState } from "react";
import { formatMoney } from "@/lib/financialEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { DEPRECIATION_YEARS, DAYS_PER_MONTH, DEFAULT_LAND_VALUE_PERCENT, DEFAULT_REV_SHARE_EVENTS, DEFAULT_REV_SHARE_FB, DEFAULT_REV_SHARE_OTHER, DEFAULT_CATERING_BOOST_PCT } from "@shared/constants";
import { DEFAULT_LTV } from "@/lib/loanCalculations";
import type { PPECostBasisScheduleProps } from "./types";

export default function PPECostBasisSchedule({ property, global }: PPECostBasisScheduleProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    acquisition: true,
    depreciation: false,
    fixedCostAnchor: false,
    loanBasis: false,
  });

  const toggle = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const fmt = (n: number) => formatMoney(n);
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

  const purchasePrice = property.purchasePrice ?? 0;
  const buildingImprovements = property.buildingImprovements ?? 0;
  const preOpeningCosts = property.preOpeningCosts ?? 0;
  const operatingReserve = property.operatingReserve ?? 0;
  const landPct = property.landValuePercent ?? DEFAULT_LAND_VALUE_PERCENT;
  const landValue = purchasePrice * landPct;
  const buildingValue = purchasePrice * (1 - landPct);
  const totalDepreciableBasis = buildingValue + buildingImprovements;
  const annualDepreciation = totalDepreciableBasis / DEPRECIATION_YEARS;
  const monthlyDepreciation = annualDepreciation / 12;
  const totalProjectCost = purchasePrice + buildingImprovements + preOpeningCosts + operatingReserve;
  const totalPropertyValue = purchasePrice + buildingImprovements;

  const revShareEvents = property.revShareEvents ?? DEFAULT_REV_SHARE_EVENTS;
  const revShareFB = property.revShareFB ?? DEFAULT_REV_SHARE_FB;
  const revShareOther = property.revShareOther ?? DEFAULT_REV_SHARE_OTHER;
  const cateringBoostPct = property.cateringBoostPercent ?? DEFAULT_CATERING_BOOST_PCT;
  const cateringBoostMultiplier = 1 + cateringBoostPct;

  const baseMonthlyRoomRev = property.roomCount * DAYS_PER_MONTH * property.startAdr * property.startOccupancy;
  const baseMonthlyEventsRev = baseMonthlyRoomRev * revShareEvents;
  const baseMonthlyFBRev = baseMonthlyRoomRev * revShareFB * cateringBoostMultiplier;
  const baseMonthlyOtherRev = baseMonthlyRoomRev * revShareOther;
  const baseMonthlyTotalRev = baseMonthlyRoomRev + baseMonthlyEventsRev + baseMonthlyFBRev + baseMonthlyOtherRev;
  const baseAnnualTotalRev = baseMonthlyTotalRev * 12;

  const fixedCostEscRate = global.fixedCostEscalationRate ?? 0.03;
  const costRatePropertyOps = property.costRatePropertyOps ?? 0.04;
  const costRateAdmin = property.costRateAdmin ?? 0.08;
  const costRateInsurance = property.costRateInsurance ?? 0.02;
  const costRateTaxes = property.costRateTaxes ?? 0.03;
  const costRateIT = property.costRateIT ?? 0.02;
  const costRateOther = property.costRateOther ?? 0.05;

  const ltv = property.acquisitionLTV ?? DEFAULT_LTV;
  const loanAmount = property.type === "Financed" ? totalPropertyValue * ltv : 0;
  const equityRequired = totalProjectCost - loanAmount;

  const SectionRow = ({ sectionKey, label, value, tooltip }: { sectionKey: string; label: string; value: string; tooltip?: string }) => {
    const isOpen = openSections[sectionKey];
    return (
      <tr
        className="cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-colors"
        onClick={() => toggle(sectionKey)}
        data-testid={`ppe-section-${sectionKey}`}
      >
        <td className="py-3 px-4 font-semibold text-gray-900 flex items-center gap-2">
          {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          {label}
          {tooltip && <HelpTooltip text={tooltip} />}
        </td>
        <td className="py-3 px-4 text-right font-semibold font-mono text-gray-900">{value}</td>
      </tr>
    );
  };

  const DetailRow = ({ label, value, indent, muted, bold, tooltip }: { label: string; value: string; indent?: boolean; muted?: boolean; bold?: boolean; tooltip?: string }) => (
    <tr className={`border-b border-gray-50 ${bold ? "bg-gray-50" : ""}`}>
      <td className={`py-2 px-4 ${indent ? "pl-12" : "pl-8"} ${muted ? "text-gray-400" : "text-gray-600"} ${bold ? "font-semibold text-gray-900" : ""}`}>
        <span className="flex items-center gap-1">
          {label}
          {tooltip && <HelpTooltip text={tooltip} />}
        </span>
      </td>
      <td className={`py-2 px-4 text-right font-mono ${muted ? "text-gray-400" : "text-gray-600"} ${bold ? "font-semibold text-gray-900" : ""}`}>{value}</td>
    </tr>
  );

  return (
    <Card className="overflow-hidden bg-white shadow-lg border border-gray-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-gray-900 flex items-center gap-2">
          PP&E / Cost Basis Schedule
          <HelpTooltip text="Shows the underlying asset values, depreciation basis, and fixed-cost anchors used by the financial engine. Click each section to expand details." manualSection="property-formulas" />
        </CardTitle>
        <p className="text-sm text-gray-500">
          {property.name} — Checker transparency view
        </p>
      </CardHeader>
      <div className="px-6 pb-6">
        <table className="w-full" data-testid="ppe-schedule-table">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 px-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Item</th>
              <th className="text-right py-2 px-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Value</th>
            </tr>
          </thead>
          <tbody>
            <SectionRow sectionKey="acquisition" label="Acquisition & Project Cost" value={fmt(totalProjectCost)} tooltip="Total capital required to acquire, improve, and open the property." />
            {openSections.acquisition && (
              <>
                <DetailRow label="Purchase Price" value={fmt(purchasePrice)} />
                <DetailRow label={`Land Value (${pct(landPct)} of purchase)`} value={fmt(landValue)} indent tooltip="Land does not depreciate per IRS Publication 946." />
                <DetailRow label={`Building Value (${pct(1 - landPct)} of purchase)`} value={fmt(buildingValue)} indent />
                <DetailRow label="Building Improvements" value={fmt(buildingImprovements)} />
                <DetailRow label="Pre-Opening Costs" value={fmt(preOpeningCosts)} />
                <DetailRow label="Operating Reserve" value={fmt(operatingReserve)} />
                <DetailRow label="Total Property Value (Price + Improvements)" value={fmt(totalPropertyValue)} bold tooltip="Used as the basis for loan calculations (LTV applied to this amount)." />
                <DetailRow label="Total Project Cost" value={fmt(totalProjectCost)} bold />
              </>
            )}

            <SectionRow sectionKey="depreciation" label="Depreciation Schedule (ASC 360)" value={fmt(annualDepreciation) + " /yr"} tooltip="Straight-line depreciation over 27.5 years. Land is excluded from the depreciable basis." />
            {openSections.depreciation && (
              <>
                <DetailRow label="Building Value (from purchase)" value={fmt(buildingValue)} />
                <DetailRow label="+ Building Improvements" value={fmt(buildingImprovements)} />
                <DetailRow label="= Total Depreciable Basis" value={fmt(totalDepreciableBasis)} bold />
                <DetailRow label="Depreciation Period" value={`${DEPRECIATION_YEARS} years`} />
                <DetailRow label="Annual Depreciation" value={fmt(annualDepreciation)} bold />
                <DetailRow label="Monthly Depreciation" value={fmt(monthlyDepreciation)} />
                <DetailRow label="Full Depreciation Date" value={`~${DEPRECIATION_YEARS} years after acquisition`} muted />
              </>
            )}

            <SectionRow
              sectionKey="fixedCostAnchor"
              label="Fixed Cost Anchor (Year 1 Base Revenue)"
              value={fmt(baseAnnualTotalRev) + " /yr"}
              tooltip="Fixed operating costs (Property Ops, Admin, IT, etc.) are calculated as a rate × this Year 1 base revenue, then escalated annually. They do NOT scale with actual revenue growth. Insurance and Property Taxes are calculated separately based on property value."
            />
            {openSections.fixedCostAnchor && (
              <>
                <DetailRow label="Room Count" value={`${property.roomCount} rooms`} />
                <DetailRow label="Days per Month" value={`${DAYS_PER_MONTH}`} />
                <DetailRow label="Starting ADR" value={fmt(property.startAdr)} />
                <DetailRow label="Starting Occupancy" value={pct(property.startOccupancy)} />
                <DetailRow label="Base Monthly Room Revenue" value={fmt(baseMonthlyRoomRev)} bold />
                <DetailRow label={`Events Revenue (${pct(revShareEvents)} of rooms)`} value={fmt(baseMonthlyEventsRev)} indent />
                <DetailRow label={`F&B Revenue (${pct(revShareFB)} × ${pct(cateringBoostMultiplier - 1)} boost)`} value={fmt(baseMonthlyFBRev)} indent />
                <DetailRow label={`Other Revenue (${pct(revShareOther)} of rooms)`} value={fmt(baseMonthlyOtherRev)} indent />
                <DetailRow label="Base Monthly Total Revenue" value={fmt(baseMonthlyTotalRev)} bold />
                <DetailRow label="Base Annual Total Revenue" value={fmt(baseAnnualTotalRev)} bold />

                <tr className="border-b border-gray-50">
                  <td colSpan={2} className="py-3 px-8">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" /> Fixed Cost Rates Applied to Base Revenue
                      </p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-blue-700">
                        <span>Property Operations: {pct(costRatePropertyOps)} → {fmt(baseMonthlyTotalRev * costRatePropertyOps)}/mo</span>
                        <span>Admin & General: {pct(costRateAdmin)} → {fmt(baseMonthlyTotalRev * costRateAdmin)}/mo</span>
                        <span>Insurance: {pct(costRateInsurance)} of property value → {fmt(totalPropertyValue / 12 * costRateInsurance)}/mo</span>
                        <span>Property Taxes: {pct(costRateTaxes)} of property value → {fmt(totalPropertyValue / 12 * costRateTaxes)}/mo</span>
                        <span>IT & Technology: {pct(costRateIT)} → {fmt(baseMonthlyTotalRev * costRateIT)}/mo</span>
                        <span>Other Costs: {pct(costRateOther)} → {fmt(baseMonthlyTotalRev * costRateOther)}/mo</span>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        These base amounts escalate at {pct(fixedCostEscRate)}/year (compounding). Year 2 = base × {(1 + fixedCostEscRate).toFixed(4)}, Year 3 = base × {((1 + fixedCostEscRate) ** 2).toFixed(4)}, etc.
                      </p>
                    </div>
                  </td>
                </tr>
              </>
            )}

            {property.type === "Financed" && (
              <>
                <SectionRow sectionKey="loanBasis" label="Loan & Equity Basis" value={fmt(loanAmount)} tooltip="Loan amount is based on LTV × Total Property Value (purchase price + improvements). Equity = Total Project Cost − Loan." />
                {openSections.loanBasis && (
                  <>
                    <DetailRow label="Financing Type" value={property.type} />
                    <DetailRow label="Total Property Value (Loan Basis)" value={fmt(totalPropertyValue)} tooltip="LTV is applied to this amount, not the total project cost." />
                    <DetailRow label={`Loan-to-Value (LTV): ${pct(ltv)}`} value={fmt(loanAmount)} bold />
                    <DetailRow label="Equity Required" value={fmt(equityRequired)} bold />
                    <DetailRow label="Interest Rate" value={pct(property.acquisitionInterestRate ?? global.debtAssumptions?.interestRate ?? 0.09)} />
                    <DetailRow label="Amortization Term" value={`${property.acquisitionTermYears ?? global.debtAssumptions?.amortizationYears ?? 25} years`} />
                  </>
                )}
              </>
            )}
            {property.type === "Full Equity" && (
              <>
                <SectionRow sectionKey="loanBasis" label="Equity Basis" value={fmt(totalProjectCost)} tooltip="Full equity deal — no debt financing. Total equity equals the full project cost." />
                {openSections.loanBasis && (
                  <>
                    <DetailRow label="Financing Type" value="Full Equity (No Debt)" />
                    <DetailRow label="Total Equity Required" value={fmt(totalProjectCost)} bold />
                    {property.willRefinance === "Yes" && property.refinanceDate && (
                      <DetailRow label="Planned Refinance Date" value={new Date(property.refinanceDate).toLocaleDateString()} muted />
                    )}
                  </>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
