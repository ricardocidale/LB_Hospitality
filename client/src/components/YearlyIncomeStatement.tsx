import { useState } from "react";
import { MonthlyFinancials, formatMoney } from "@/lib/financialEngine";
import {
  TableShell,
  SectionHeader,
  SubtotalRow,
  LineItem,
  SpacerRow,
  MarginRow,
  MetricRow,
  ExpandableMetricRow,
  ExpandableLineItem,
  useCalcDetails,
} from "@/components/financial-table-rows";
import { aggregatePropertyByYear } from "@/lib/yearlyAggregator";
import { TableRow, TableCell } from "@/components/ui/table";
import {
  DAYS_PER_MONTH,
  DEFAULT_REV_SHARE_EVENTS,
  DEFAULT_REV_SHARE_FB,
  DEFAULT_REV_SHARE_OTHER,
  DEFAULT_CATERING_BOOST_PCT,
} from "@shared/constants";

interface Props {
  data: MonthlyFinancials[];
  years?: number;
  startYear?: number;
  property?: any;
  global?: any;
  allExpanded?: boolean;
}


function FormulaDetailRow({ label, values, colCount }: { label: string; values: string[]; colCount: number }) {
  return (
    <TableRow className="bg-blue-50/40" data-expandable-row="true">
      <TableCell className="pl-12 sticky left-0 bg-blue-50/40 py-0.5 text-xs text-gray-500 italic">
        {label}
      </TableCell>
      {values.map((v, i) => (
        <TableCell key={i} className="text-right py-0.5 font-mono text-xs text-gray-500">
          {v}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function YearlyIncomeStatement({ data, years = 5, startYear = 2026, property, global, allExpanded = false }: Props) {
  const yd = aggregatePropertyByYear(data, years);
  const columns = yd.map((y) => `${startYear + y.year}`);
  const colSpan = years + 1;

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const toggle = (key: string) =>
    setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }));
  const isExpanded = (key: string) => allExpanded || !!expandedRows[key];

  const hasContext = property && global;

  let baseMonthlyTotalRev = 0;
  let fixedEscRate = 0;
  let costRates: Record<string, number> = {};
  let totalPropertyValue = 0;

  if (hasContext) {
    const revShareEvents = property.revShareEvents ?? DEFAULT_REV_SHARE_EVENTS;
    const revShareFB = property.revShareFB ?? DEFAULT_REV_SHARE_FB;
    const revShareOther = property.revShareOther ?? DEFAULT_REV_SHARE_OTHER;
    const cateringBoostPct = property.cateringBoostPercent ?? DEFAULT_CATERING_BOOST_PCT;
    const cateringBoostMultiplier = 1 + cateringBoostPct;

    const baseMonthlyRoomRev = property.roomCount * DAYS_PER_MONTH * property.startAdr * property.startOccupancy;
    const baseMonthlyEventsRev = baseMonthlyRoomRev * revShareEvents;
    const baseMonthlyFBRev = baseMonthlyRoomRev * revShareFB * cateringBoostMultiplier;
    const baseMonthlyOtherRev = baseMonthlyRoomRev * revShareOther;
    baseMonthlyTotalRev = baseMonthlyRoomRev + baseMonthlyEventsRev + baseMonthlyFBRev + baseMonthlyOtherRev;

    totalPropertyValue = property.purchasePrice + (property.buildingImprovements ?? 0);
    fixedEscRate = global.fixedCostEscalationRate ?? global.inflationRate ?? 0.03;
    costRates = {
      propertyOps: property.costRatePropertyOps ?? 0.04,
      utilities: property.costRateUtilities ?? 0.05,
      admin: property.costRateAdmin ?? 0.08,
      insurance: property.costRateInsurance ?? 0.02,
      taxes: property.costRateTaxes ?? 0.03,
      it: property.costRateIT ?? 0.02,
      other: property.costRateOther ?? 0.05,
    };
  }

  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const fmt = (n: number) => formatMoney(n);

  const getMonthlyFactors = (yearIndex: number): number[] => {
    if (!hasContext) return [];
    const opsStart = new Date(property.operationsStartDate);
    const modelStart = new Date(global.modelStartDate);
    const factors: number[] = [];
    for (let m = 0; m < 12; m++) {
      const monthOffset = yearIndex * 12 + m;
      const currentDate = new Date(modelStart);
      currentDate.setMonth(currentDate.getMonth() + monthOffset);
      const isOperational = currentDate >= opsStart;
      if (!isOperational) {
        factors.push(0);
        continue;
      }
      const monthsSinceOps = (currentDate.getFullYear() - opsStart.getFullYear()) * 12 + currentDate.getMonth() - opsStart.getMonth();
      const opsYear = Math.floor(monthsSinceOps / 12);
      factors.push(Math.pow(1 + fixedEscRate, opsYear));
    }
    return factors;
  };

  const fixedCostFormulaRows = (rateKey: string, yearlyValues: number[], isUtilities?: boolean) => {
    if (!hasContext) return null;
    const rate = costRates[rateKey];
    const utilitiesVariableSplit = global.utilitiesVariableSplit ?? 0.60;
    const effectiveRate = isUtilities ? rate * (1 - utilitiesVariableSplit) : rate;
    return (
      <>
        <FormulaDetailRow
          label={`Base Mo. Revenue`}
          values={yd.map(() => fmt(baseMonthlyTotalRev))}
          colCount={years}
        />
        <FormulaDetailRow
          label={isUtilities ? `Fixed portion rate (${pct(rate)} × ${pct(1 - utilitiesVariableSplit)} = ${pct(effectiveRate)})` : `Rate: ${pct(rate)}`}
          values={yd.map(() => `${fmt(baseMonthlyTotalRev * effectiveRate)}/mo base`)}
          colCount={years}
        />
        <FormulaDetailRow
          label="Monthly base × escalation factor, summed over 12 months"
          values={yd.map((y) => {
            const factors = getMonthlyFactors(y.year);
            const operatingMonths = factors.filter(f => f > 0).length;
            const uniqueFactors = Array.from(new Set(factors.filter(f => f > 0)));
            if (uniqueFactors.length === 1) {
              return `×${uniqueFactors[0].toFixed(4)} × ${operatingMonths} mo`;
            }
            return uniqueFactors.map(f => `×${f.toFixed(4)}`).join(", ") + ` (${operatingMonths} mo)`;
          })}
          colCount={years}
        />
        <FormulaDetailRow
          label="= Annual total (sum of monthly amounts)"
          values={yd.map((_, i) => fmt(yearlyValues[i]))}
          colCount={years}
        />
      </>
    );
  };

  return (
    <TableShell title="Income Statement" columns={columns} stickyLabel="Income Statement">
      {/* ── Revenue ── */}
      <SectionHeader label="Revenue" colSpan={colSpan} />

      <MetricRow
        label="Total Rooms Available"
        tooltip="Total room-nights available for the year. Calculated as Room Count × Days per Month × 12."
        values={yd.map((y) => y.availableRooms.toLocaleString())}
      />

      <ExpandableMetricRow
        label="ADR (Rate)"
        tooltip="Average Daily Rate — the published end-of-year room rate after annual ADR growth is applied. This is the 'clean' rate, not blended across rate changes."
        values={yd.map((y) =>
          y.cleanAdr > 0 ? `$${y.cleanAdr.toFixed(2)}` : "-"
        )}
        expanded={isExpanded("adrRate")}
        onToggle={() => toggle("adrRate")}
      >
        <FormulaDetailRow
          label="Starting ADR × (1 + growth rate)^year"
          values={yd.map((y) =>
            y.cleanAdr > 0 ? `$${property?.startAdr?.toFixed(2) ?? "?"} × (1+${pct(property?.adrGrowthRate ?? 0)})^${y.year}` : "-"
          )}
          colCount={years}
        />
      </ExpandableMetricRow>

      <ExpandableMetricRow
        label="ADR (Effective)"
        tooltip="Effective ADR — the actual blended average rate earned. Calculated as Room Revenue ÷ Sold Rooms. Differs from the Rate ADR when rates change mid-year."
        values={yd.map((y) =>
          y.soldRooms > 0 ? `$${(y.revenueRooms / y.soldRooms).toFixed(2)}` : "-"
        )}
        expanded={isExpanded("adrEffective")}
        onToggle={() => toggle("adrEffective")}
      >
        <FormulaDetailRow
          label="Room Revenue ÷ Sold Rooms"
          values={yd.map((y) =>
            y.soldRooms > 0 ? `${fmt(y.revenueRooms)} ÷ ${y.soldRooms.toLocaleString()}` : "-"
          )}
          colCount={years}
        />
      </ExpandableMetricRow>

      <ExpandableMetricRow
        label="Occupancy"
        tooltip="Occupancy Rate — percentage of available rooms that were sold. Calculated as Sold Rooms ÷ Available Rooms × 100."
        values={yd.map((y) =>
          y.availableRooms > 0
            ? `${((y.soldRooms / y.availableRooms) * 100).toFixed(1)}%`
            : "0%"
        )}
        expanded={isExpanded("occupancy")}
        onToggle={() => toggle("occupancy")}
      >
        <FormulaDetailRow
          label="Sold Rooms"
          values={yd.map((y) => y.soldRooms.toLocaleString())}
          colCount={years}
        />
        <FormulaDetailRow
          label="Available Rooms"
          values={yd.map((y) => y.availableRooms.toLocaleString())}
          colCount={years}
        />
      </ExpandableMetricRow>

      <ExpandableMetricRow
        label="RevPAR"
        tooltip="Revenue Per Available Room — measures how well rooms generate revenue, including unsold nights. Calculated as Room Revenue ÷ Available Rooms (or ADR × Occupancy)."
        values={yd.map((y) =>
          y.availableRooms > 0 ? `$${(y.revenueRooms / y.availableRooms).toFixed(2)}` : "-"
        )}
        expanded={isExpanded("revpar")}
        onToggle={() => toggle("revpar")}
      >
        <FormulaDetailRow
          label="Room Revenue ÷ Available Rooms"
          values={yd.map((y) =>
            y.availableRooms > 0 ? `${fmt(y.revenueRooms)} ÷ ${y.availableRooms.toLocaleString()}` : "-"
          )}
          colCount={years}
        />
        <FormulaDetailRow
          label="Cross-check: ADR × Occupancy"
          values={yd.map((y) => {
            if (y.availableRooms === 0) return "-";
            const effAdr = y.soldRooms > 0 ? y.revenueRooms / y.soldRooms : 0;
            const occ = y.soldRooms / y.availableRooms;
            return `$${effAdr.toFixed(2)} × ${(occ * 100).toFixed(1)}% = $${(effAdr * occ).toFixed(2)}`;
          })}
          colCount={years}
        />
      </ExpandableMetricRow>

      <LineItem label="Room Revenue"        values={yd.map((y) => y.revenueRooms)} />
      <LineItem label="Food & Beverage"     values={yd.map((y) => y.revenueFB)} />
      <LineItem label="Events & Functions"   values={yd.map((y) => y.revenueEvents)} />
      <LineItem label="Other Revenue"        values={yd.map((y) => y.revenueOther)} />
      <SubtotalRow label="Total Revenue"     values={yd.map((y) => y.revenueTotal)} positive />

      <SpacerRow colSpan={colSpan} />

      {/* ── Operating Expenses ── */}
      <SectionHeader label="Operating Expenses" colSpan={colSpan} />

      <LineItem label="Housekeeping"             values={yd.map((y) => y.expenseRooms)} tooltip="Variable cost: percentage of room revenue. Scales directly with occupancy and ADR." />
      <LineItem label="Food & Beverage"          values={yd.map((y) => y.expenseFB)} tooltip="Variable cost: percentage of F&B revenue. Scales with food & beverage volume." />
      <LineItem label="Events & Functions"        values={yd.map((y) => y.expenseEvents)} tooltip="Variable cost: percentage of events revenue. Scales with event bookings." />
      <LineItem label="Other Departments"         values={yd.map((y) => y.expenseOther)} tooltip="Variable cost: percentage of other revenue." />
      <LineItem label="Sales & Marketing"         values={yd.map((y) => y.expenseMarketing)} tooltip="Variable cost: percentage of total revenue allocated to marketing." />

      {/* Fixed cost lines — expandable with formula breakdown */}
      {hasContext ? (
        <>
          <ExpandableLineItem
            label="Property Operations"
            tooltip={`USALI fixed cost: ${pct(costRates.propertyOps)} of Year 1 base revenue (${fmt(baseMonthlyTotalRev)}/mo), escalating ${pct(fixedEscRate)}/yr. NOT a percentage of current revenue.`}
            values={yd.map((y) => y.expensePropertyOps)}
            expanded={isExpanded("propertyOps")}
            onToggle={() => toggle("propertyOps")}
          >
            {fixedCostFormulaRows("propertyOps", yd.map((y) => y.expensePropertyOps))}
          </ExpandableLineItem>

          <ExpandableLineItem
            label="Utilities"
            tooltip={`Split into variable (${pct(global.utilitiesVariableSplit ?? 0.60)} of rate, scales with revenue) and fixed (${pct(1 - (global.utilitiesVariableSplit ?? 0.60))} of rate, anchored to Year 1 base revenue). Total rate: ${pct(costRates.utilities)}.`}
            values={yd.map((y) => y.expenseUtilities)}
            expanded={isExpanded("utilities")}
            onToggle={() => toggle("utilities")}
          >
            <FormulaDetailRow
              label="Variable portion (scales with revenue)"
              values={yd.map((y) => fmt(y.expenseUtilitiesVar))}
              colCount={years}
            />
            <FormulaDetailRow
              label="Fixed portion (anchored to Year 1 base)"
              values={yd.map((y) => fmt(y.expenseUtilitiesFixed))}
              colCount={years}
            />
            {fixedCostFormulaRows("utilities", yd.map((y) => y.expenseUtilitiesFixed), true)}
          </ExpandableLineItem>

          <ExpandableLineItem
            label="Administrative & General"
            tooltip={`USALI fixed cost: ${pct(costRates.admin)} of Year 1 base revenue (${fmt(baseMonthlyTotalRev)}/mo), escalating ${pct(fixedEscRate)}/yr. NOT a percentage of current revenue.`}
            values={yd.map((y) => y.expenseAdmin)}
            expanded={isExpanded("admin")}
            onToggle={() => toggle("admin")}
          >
            {fixedCostFormulaRows("admin", yd.map((y) => y.expenseAdmin))}
          </ExpandableLineItem>

          <ExpandableLineItem
            label="IT & Technology"
            tooltip={`USALI fixed cost: ${pct(costRates.it)} of Year 1 base revenue (${fmt(baseMonthlyTotalRev)}/mo), escalating ${pct(fixedEscRate)}/yr.`}
            values={yd.map((y) => y.expenseIT)}
            expanded={isExpanded("it")}
            onToggle={() => toggle("it")}
          >
            {fixedCostFormulaRows("it", yd.map((y) => y.expenseIT))}
          </ExpandableLineItem>

          <ExpandableLineItem
            label="Insurance"
            tooltip={`Based on property value: ${pct(costRates.insurance)} of ${fmt(totalPropertyValue)} (${fmt(totalPropertyValue / 12)}/mo), escalating ${pct(fixedEscRate)}/yr.`}
            values={yd.map((y) => y.expenseInsurance)}
            expanded={isExpanded("insurance")}
            onToggle={() => toggle("insurance")}
          >
            {hasContext && (
              <>
                <FormulaDetailRow
                  label={`Property Value (Purchase + Improvements)`}
                  values={yd.map(() => fmt(totalPropertyValue))}
                  colCount={years}
                />
                <FormulaDetailRow
                  label={`Monthly base: ${fmt(totalPropertyValue)} ÷ 12 × ${pct(costRates.insurance)}`}
                  values={yd.map(() => `${fmt(totalPropertyValue / 12 * costRates.insurance)}/mo base`)}
                  colCount={years}
                />
                <FormulaDetailRow
                  label="Monthly base × escalation factor, summed over 12 months"
                  values={yd.map((y) => {
                    const factors = getMonthlyFactors(y.year);
                    const operatingMonths = factors.filter(f => f > 0).length;
                    const uniqueFactors = Array.from(new Set(factors.filter(f => f > 0)));
                    if (uniqueFactors.length === 1) {
                      return `×${uniqueFactors[0].toFixed(4)} × ${operatingMonths} mo`;
                    }
                    return uniqueFactors.map(f => `×${f.toFixed(4)}`).join(", ") + ` (${operatingMonths} mo)`;
                  })}
                  colCount={years}
                />
                <FormulaDetailRow
                  label="= Annual total (sum of monthly amounts)"
                  values={yd.map((_, i) => fmt(yd[i].expenseInsurance))}
                  colCount={years}
                />
              </>
            )}
          </ExpandableLineItem>

          <ExpandableLineItem
            label="Property Taxes"
            tooltip={`Based on property value: ${pct(costRates.taxes)} of ${fmt(totalPropertyValue)} (${fmt(totalPropertyValue / 12)}/mo), escalating ${pct(fixedEscRate)}/yr.`}
            values={yd.map((y) => y.expenseTaxes)}
            expanded={isExpanded("taxes")}
            onToggle={() => toggle("taxes")}
          >
            {hasContext && (
              <>
                <FormulaDetailRow
                  label={`Property Value (Purchase + Improvements)`}
                  values={yd.map(() => fmt(totalPropertyValue))}
                  colCount={years}
                />
                <FormulaDetailRow
                  label={`Monthly base: ${fmt(totalPropertyValue)} ÷ 12 × ${pct(costRates.taxes)}`}
                  values={yd.map(() => `${fmt(totalPropertyValue / 12 * costRates.taxes)}/mo base`)}
                  colCount={years}
                />
                <FormulaDetailRow
                  label="Monthly base × escalation factor, summed over 12 months"
                  values={yd.map((y) => {
                    const factors = getMonthlyFactors(y.year);
                    const operatingMonths = factors.filter(f => f > 0).length;
                    const uniqueFactors = Array.from(new Set(factors.filter(f => f > 0)));
                    if (uniqueFactors.length === 1) {
                      return `×${uniqueFactors[0].toFixed(4)} × ${operatingMonths} mo`;
                    }
                    return uniqueFactors.map(f => `×${f.toFixed(4)}`).join(", ") + ` (${operatingMonths} mo)`;
                  })}
                  colCount={years}
                />
                <FormulaDetailRow
                  label="= Annual total (sum of monthly amounts)"
                  values={yd.map((_, i) => fmt(yd[i].expenseTaxes))}
                  colCount={years}
                />
              </>
            )}
          </ExpandableLineItem>

          <ExpandableLineItem
            label="Other Costs"
            tooltip={`USALI fixed cost: ${pct(costRates.other)} of Year 1 base revenue (${fmt(baseMonthlyTotalRev)}/mo), escalating ${pct(fixedEscRate)}/yr.`}
            values={yd.map((y) => y.expenseOtherCosts)}
            expanded={isExpanded("otherCosts")}
            onToggle={() => toggle("otherCosts")}
          >
            {fixedCostFormulaRows("other", yd.map((y) => y.expenseOtherCosts))}
          </ExpandableLineItem>
        </>
      ) : (
        <>
          <LineItem label="Property Operations"       values={yd.map((y) => y.expensePropertyOps)} tooltip="Fixed cost per USALI: Year 1 base revenue × rate, escalating annually. Not a percentage of current-year revenue." />
          <LineItem label="Utilities"                 values={yd.map((y) => y.expenseUtilities)} tooltip="Split into variable (scales with revenue) and fixed (anchored to Year 1 base revenue)." />
          <LineItem label="Administrative & General"  values={yd.map((y) => y.expenseAdmin)} tooltip="Fixed cost per USALI: anchored to Year 1 base revenue." />
          <LineItem label="IT & Technology"           values={yd.map((y) => y.expenseIT)} tooltip="Fixed cost per USALI: anchored to Year 1 base revenue." />
          <LineItem label="Insurance"                 values={yd.map((y) => y.expenseInsurance)} tooltip="Based on property value (Purchase Price + Building Improvements), adjusted annually by inflation." />
          <LineItem label="Property Taxes"            values={yd.map((y) => y.expenseTaxes)} tooltip="Based on property value (Purchase Price + Building Improvements), adjusted annually by inflation." />
          <LineItem label="Other Costs"               values={yd.map((y) => y.expenseOtherCosts)} tooltip="Fixed cost per USALI: anchored to Year 1 base revenue." />
        </>
      )}

      <SubtotalRow label="Total Operating Expenses" values={yd.map((y) => y.revenueTotal - y.gop)} tooltip="Sum of all departmental and undistributed operating expenses." />
      <MarginRow label="% of Total Revenue" values={yd.map((y) => y.revenueTotal - y.gop)} baseValues={yd.map((y) => y.revenueTotal)} />

      <SpacerRow colSpan={colSpan} />

      {/* ── Profitability ── */}
      <SubtotalRow label="Gross Operating Profit (GOP)" values={yd.map((y) => y.gop)} positive tooltip="Total Revenue minus all Operating Expenses. The property's core operating profitability before management fees and reserves." />
      <MarginRow label="% of Total Revenue" values={yd.map((y) => y.gop)} baseValues={yd.map((y) => y.revenueTotal)} />

      <SpacerRow colSpan={colSpan} />

      {/* ── Non-Operating ── */}
      <SectionHeader label="Non-Operating Expenses" colSpan={colSpan} />

      <LineItem label="Base Management Fee"       values={yd.map((y) => y.feeBase)} tooltip="Percentage of total revenue paid to the management company for operating the property." />
      <LineItem label="Incentive Management Fee"  values={yd.map((y) => y.feeIncentive)} tooltip="Performance-based fee paid to the management company, calculated as a percentage of GOP." />
      <LineItem label="FF&E Reserve"              values={yd.map((y) => y.expenseFFE)} tooltip="Furniture, Fixtures & Equipment reserve — set aside for capital replacements and renovations." />

      <SpacerRow colSpan={colSpan} />

      <SubtotalRow label="Net Operating Income (NOI)" values={yd.map((y) => y.noi)} positive tooltip="GOP minus management fees and FF&E reserve. The property's income available for debt service and returns." />
      <MarginRow label="% of Total Revenue" values={yd.map((y) => y.noi)} baseValues={yd.map((y) => y.revenueTotal)} />

      <SpacerRow colSpan={colSpan} />

      {/* ── Below NOI ── */}
      <SectionHeader label="Below NOI" colSpan={colSpan} />

      <LineItem label="Interest Expense"  values={yd.map((y) => y.interestExpense)} tooltip="Interest portion of mortgage debt service payments." />
      <LineItem label="Depreciation"      values={yd.map((y) => y.depreciationExpense)} tooltip="Non-cash expense per ASC 360: straight-line depreciation of the depreciable building basis over 27.5 years." />
      <LineItem label="Income Tax"        values={yd.map((y) => y.incomeTax)} tooltip="Federal/state income tax applied to pre-tax income (NOI minus interest and depreciation)." />

      <SpacerRow colSpan={colSpan} />

      {/* ── Bottom Line ── */}
      <SubtotalRow label="GAAP Net Income" values={yd.map((y) => y.netIncome)} positive tooltip="The bottom line: NOI minus interest, depreciation, and income tax. This is the GAAP-compliant net income figure." />
      <MarginRow label="% of Total Revenue" values={yd.map((y) => y.netIncome)} baseValues={yd.map((y) => y.revenueTotal)} />
    </TableShell>
  );
}
