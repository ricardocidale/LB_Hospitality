/**
 * YearlyCashFlowStatement — Refactored with shared row components
 *
 * Uses shared financial-table-rows for consistent visual language
 * across Income Statement, Cash Flow, and Balance Sheet.
 */

import { useState } from "react";
import { MonthlyFinancials, formatMoney } from "@/lib/financialEngine";
import { AlertTriangle, CheckCircle } from "lucide-react";
import {
  TableShell,
  SectionHeader,
  SubtotalRow,
  LineItem,
  ExpandableLineItem,
  ExpandableMetricRow,
  GrandTotalRow,
  SpacerRow,
  MetricRow,
  MarginRow,
} from "@/components/financial-table-rows";
import { TableRow, TableCell } from "@/components/ui/table";
import {
  LoanParams,
  GlobalLoanParams,
  calculateLoanParams,
  getAcquisitionYear,
  YearlyCashFlowResult,
} from "@/lib/loanCalculations";
import { OPERATING_RESERVE_BUFFER, RESERVE_ROUNDING_INCREMENT, DEFAULT_COMMISSION_RATE } from "@/lib/constants";
import { aggregateCashFlowByYear } from "@/lib/cashFlowAggregator";
import { aggregatePropertyByYear } from "@/lib/yearlyAggregator";
import { computeCashFlowSections } from "@/lib/cashFlowSections";

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

interface CashPositionAnalysis {
  operatingReserve: number;
  minCashPosition: number;
  minCashMonth: number | null;
  shortfall: number;
  isAdequate: boolean;
  suggestedReserve: number;
}

function analyzeMonthlyCashPosition(
  data: MonthlyFinancials[],
  operatingReserve: number
): CashPositionAnalysis {
  if (!data || data.length === 0) {
    return {
      operatingReserve,
      minCashPosition: operatingReserve,
      minCashMonth: null,
      shortfall: 0,
      isAdequate: true,
      suggestedReserve: operatingReserve
    };
  }

  let cashPosition = operatingReserve;
  let minCashPosition = operatingReserve;
  let minCashMonth: number | null = null;
  let hasActivity = false;

  for (let i = 0; i < data.length; i++) {
    const month = data[i];
    if (month.cashFlow === 0 && month.revenueTotal === 0 && month.debtPayment === 0) {
      continue;
    }
    hasActivity = true;
    cashPosition += month.cashFlow;

    if (cashPosition < minCashPosition) {
      minCashPosition = cashPosition;
      minCashMonth = i + 1;
    }
  }

  if (!hasActivity) {
    return {
      operatingReserve,
      minCashPosition: operatingReserve,
      minCashMonth: null,
      shortfall: 0,
      isAdequate: true,
      suggestedReserve: operatingReserve
    };
  }

  const shortfall = minCashPosition < 0 ? Math.abs(minCashPosition) : 0;
  const isAdequate = minCashPosition >= 0;
  const suggestedReserve = isAdequate ? operatingReserve : operatingReserve + shortfall + OPERATING_RESERVE_BUFFER;

  return {
    operatingReserve,
    minCashPosition,
    minCashMonth,
    shortfall,
    isAdequate,
    suggestedReserve: Math.ceil(suggestedReserve / RESERVE_ROUNDING_INCREMENT) * RESERVE_ROUNDING_INCREMENT
  };
}

interface Props {
  data: MonthlyFinancials[];
  property: LoanParams;
  global?: GlobalLoanParams;
  years?: number;
  startYear?: number;
  defaultLTV?: number;
}

export function YearlyCashFlowStatement({ data, property, global, years = 10, startYear = 2026 }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const yearlyData = aggregateCashFlowByYear(data, property, global, years);
  const yearlyDetails = aggregatePropertyByYear(data, years);

  const loan = calculateLoanParams(property, global);
  const equityInvested = loan.equityInvested;
  const acquisitionYear = getAcquisitionYear(loan);

  const operatingReserve = property.operatingReserve || 0;
  const cashAnalysis = analyzeMonthlyCashPosition(data, operatingReserve);

  const toggleSection = (section: string) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const colSpan = years + 1;
  const columns = yearlyData.map((y) => `FY ${startYear + y.year}`);

  const totalPropertyCost = property.purchasePrice + (property.buildingImprovements ?? 0) + property.preOpeningCosts;

  const sections = computeCashFlowSections(yearlyDetails, yearlyData, loan, acquisitionYear, totalPropertyCost, years);
  const { cashFromOperations, cashFromInvesting, cashFromFinancing, netChangeCash, openingCash, closingCash, fcf: fcfValues, fcfe: fcfeValues } = sections;

  // Pre-format metric values
  const cocValues = yearlyData.map((y) =>
    equityInvested > 0 ? `${((y.atcf / equityInvested) * 100).toFixed(1)}%` : "-"
  );
  const cocHighlights = yearlyData.map((y) => {
    const cocReturn = equityInvested > 0 ? (y.atcf / equityInvested) * 100 : 0;
    return cocReturn > 0 ? "text-accent" : "text-muted-foreground";
  });

  const dscrValues = yearlyData.map((y) =>
    y.debtService > 0 ? `${(y.noi / y.debtService).toFixed(2)}x` : "N/A"
  );
  const dscrHighlights = yearlyData.map((y) =>
    y.debtService > 0 && y.noi / y.debtService < 1.25 ? "text-destructive" : undefined
  );

  const banner = !cashAnalysis.isAdequate ? (
    <div data-testid="banner-equity-warning" className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
      <div className="text-sm">
        <p data-testid="text-equity-warning-title" className="font-semibold text-destructive">Additional Equity Investment Required</p>
        <p className="text-muted-foreground mt-1">
          The current Operating Reserve of <span data-testid="text-current-reserve">{formatMoney(operatingReserve)}</span> is insufficient.
          Monthly cash position drops to <span data-testid="text-min-cash-position">{formatMoney(cashAnalysis.minCashPosition)}</span>
          {cashAnalysis.minCashMonth !== null && <> in month <span data-testid="text-min-cash-month">{cashAnalysis.minCashMonth}</span></>}.
        </p>
        <p className="text-muted-foreground mt-1">
          <span className="font-medium">Suggested:</span> Increase Operating Reserve to at least{' '}
          <span data-testid="text-suggested-reserve" className="font-semibold text-foreground">{formatMoney(cashAnalysis.suggestedReserve)}</span> in{' '}
          <span className="font-medium text-primary">Property Assumptions &rarr; Capital & Acquisition</span>.
        </p>
      </div>
    </div>
  ) : (
    <div data-testid="banner-cash-adequate" className="mt-3 p-3 bg-accent/10 border border-accent/30 rounded-lg flex items-start gap-3">
      <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
      <div className="text-sm">
        <p data-testid="text-cash-adequate-title" className="font-semibold text-accent">Cash Position Adequate</p>
        <p className="text-muted-foreground mt-1">
          The Operating Reserve of <span data-testid="text-current-reserve">{formatMoney(operatingReserve)}</span> covers all costs during ramp-up.
          {cashAnalysis.minCashMonth !== null && (
            <> Minimum cash position: <span data-testid="text-min-cash-position">{formatMoney(cashAnalysis.minCashPosition)}</span> (month <span data-testid="text-min-cash-month">{cashAnalysis.minCashMonth}</span>).</>
          )}
        </p>
      </div>
    </div>
  );

  return (
    <TableShell
      title="Cash Flow Statement"
      subtitle="Statement of Cash Flows — ASC 230 Indirect Method"
      columns={columns}
      stickyLabel="Cash Flow Statement"
      banner={banner}
    >
      {/* ── Operating Cash Flow ── */}
      <SectionHeader
        label="Cash Flow from Operating Activities"
        colSpan={colSpan}
        tooltip="Cash generated from day-to-day property operations (ASC 230). Shows actual cash received from guests and paid to vendors/staff."
      />

      <ExpandableLineItem
        label="Cash Received from Guests & Clients"
        values={yearlyDetails.map(y => y.revenueTotal)}
        tooltip="Click to expand: ADR, Occupancy, RevPAR, and revenue by stream."
        expanded={!!expanded.revenue}
        onToggle={() => toggleSection('revenue')}
      >
        <ExpandableMetricRow
          label="ADR (Rate)"
          tooltip="Average Daily Rate — the published end-of-year room rate after annual ADR growth. This is the 'clean' rate, not blended across rate changes."
          values={yearlyDetails.map(y => y.cleanAdr > 0 ? `$${y.cleanAdr.toFixed(2)}` : "-")}
          expanded={!!expanded.cfAdrRate}
          onToggle={() => toggleSection('cfAdrRate')}
        >
          <FormulaDetailRow
            label="Starting ADR × (1 + growth rate)^year"
            values={yearlyDetails.map(y => {
              if (y.cleanAdr <= 0) return "-";
              const prop = property as Record<string, number>;
              const startAdr = prop.startAdr ?? 0;
              const growthRate = prop.adrGrowthRate ?? 0;
              return `$${startAdr.toFixed(2)} × (1+${(growthRate * 100).toFixed(1)}%)^${y.year}`;
            })}
            colCount={years}
          />
        </ExpandableMetricRow>

        <ExpandableMetricRow
          label="ADR (Effective)"
          tooltip="Effective ADR — the actual blended average rate earned. Room Revenue ÷ Sold Rooms."
          values={yearlyDetails.map(y => y.soldRooms > 0 ? `$${(y.revenueRooms / y.soldRooms).toFixed(2)}` : "-")}
          expanded={!!expanded.cfAdrEff}
          onToggle={() => toggleSection('cfAdrEff')}
        >
          <FormulaDetailRow
            label="Room Revenue ÷ Sold Rooms"
            values={yearlyDetails.map(y =>
              y.soldRooms > 0 ? `${formatMoney(y.revenueRooms)} ÷ ${y.soldRooms.toLocaleString()}` : "-"
            )}
            colCount={years}
          />
        </ExpandableMetricRow>

        <ExpandableMetricRow
          label="Occupancy"
          tooltip="Occupancy Rate — percentage of available rooms sold. Sold Rooms ÷ Available Rooms × 100."
          values={yearlyDetails.map(y =>
            y.availableRooms > 0 ? `${((y.soldRooms / y.availableRooms) * 100).toFixed(1)}%` : "0%"
          )}
          expanded={!!expanded.cfOcc}
          onToggle={() => toggleSection('cfOcc')}
        >
          <FormulaDetailRow
            label="Sold Rooms"
            values={yearlyDetails.map(y => y.soldRooms.toLocaleString())}
            colCount={years}
          />
          <FormulaDetailRow
            label="Available Rooms"
            values={yearlyDetails.map(y => y.availableRooms.toLocaleString())}
            colCount={years}
          />
        </ExpandableMetricRow>

        <ExpandableMetricRow
          label="RevPAR"
          tooltip="Revenue Per Available Room — Room Revenue ÷ Available Rooms (or ADR × Occupancy)."
          values={yearlyDetails.map(y =>
            y.availableRooms > 0 ? `$${(y.revenueRooms / y.availableRooms).toFixed(2)}` : "-"
          )}
          expanded={!!expanded.cfRevpar}
          onToggle={() => toggleSection('cfRevpar')}
        >
          <FormulaDetailRow
            label="Room Revenue ÷ Available Rooms"
            values={yearlyDetails.map(y =>
              y.availableRooms > 0 ? `${formatMoney(y.revenueRooms)} ÷ ${y.availableRooms.toLocaleString()}` : "-"
            )}
            colCount={years}
          />
          <FormulaDetailRow
            label="Cross-check: ADR × Occupancy"
            values={yearlyDetails.map(y => {
              if (y.availableRooms === 0) return "-";
              const effAdr = y.soldRooms > 0 ? y.revenueRooms / y.soldRooms : 0;
              const occ = y.soldRooms / y.availableRooms;
              return `$${effAdr.toFixed(2)} × ${(occ * 100).toFixed(1)}% = $${(effAdr * occ).toFixed(2)}`;
            })}
            colCount={years}
          />
        </ExpandableMetricRow>

        <LineItem label="Guest Room Revenue" values={yearlyDetails.map(y => y.revenueRooms)} indent />
        <LineItem label="Event & Venue Revenue" values={yearlyDetails.map(y => y.revenueEvents)} indent />
        <LineItem label="Food & Beverage Revenue" values={yearlyDetails.map(y => y.revenueFB)} indent />
        <LineItem label="Other Revenue (Spa/Experiences)" values={yearlyDetails.map(y => y.revenueOther)} indent />
      </ExpandableLineItem>

      <ExpandableLineItem
        label="Cash Paid for Operating Expenses"
        values={yearlyDetails.map(y => y.totalExpenses - y.expenseFFE)}
        tooltip="Click to expand: Direct costs, overhead & admin, and management fees. Excludes FF&E (shown in Investing)."
        expanded={!!expanded.expenses}
        onToggle={() => toggleSection('expenses')}
        negate
      >
        <ExpandableLineItem
          label="Direct Costs"
          values={yearlyDetails.map(y => y.expenseRooms + y.expenseFB + y.expenseEvents + y.expenseOther)}
          tooltip="Variable departmental costs that scale with occupancy and revenue."
          expanded={!!expanded.cfDirect}
          onToggle={() => toggleSection('cfDirect')}
        >
          <LineItem label="Housekeeping & Room Operations" values={yearlyDetails.map(y => y.expenseRooms)} indent />
          <LineItem label="Food & Beverage Costs" values={yearlyDetails.map(y => y.expenseFB)} indent />
          <LineItem label="Event Operations" values={yearlyDetails.map(y => y.expenseEvents)} indent />
          <LineItem label="Other Direct Costs" values={yearlyDetails.map(y => y.expenseOther)} indent />
        </ExpandableLineItem>

        <ExpandableLineItem
          label="Overhead & Administration"
          values={yearlyDetails.map(y => y.expenseMarketing + y.expensePropertyOps + y.expenseUtilitiesVar + y.expenseUtilitiesFixed + y.expenseInsurance + y.expenseTaxes + y.expenseAdmin + y.expenseIT + y.expenseOtherCosts)}
          tooltip="Fixed and semi-variable overhead: marketing, property ops, utilities, insurance, taxes, admin, IT, and other costs."
          expanded={!!expanded.cfOverhead}
          onToggle={() => toggleSection('cfOverhead')}
        >
          <LineItem label="Marketing & Platform Fees" values={yearlyDetails.map(y => y.expenseMarketing)} indent />
          <LineItem label="Property Operations & Maintenance" values={yearlyDetails.map(y => y.expensePropertyOps)} indent />
          <LineItem label="Utilities (Variable)" values={yearlyDetails.map(y => y.expenseUtilitiesVar)} indent />
          <LineItem label="Utilities (Fixed)" values={yearlyDetails.map(y => y.expenseUtilitiesFixed)} indent />
          <LineItem label="Insurance" values={yearlyDetails.map(y => y.expenseInsurance)} indent />
          <LineItem label="Property Taxes" values={yearlyDetails.map(y => y.expenseTaxes)} indent />
          <LineItem label="Administrative & Compliance" values={yearlyDetails.map(y => y.expenseAdmin)} indent />
          <LineItem label="IT Systems" values={yearlyDetails.map(y => y.expenseIT)} indent />
          <LineItem label="Other Operating Costs" values={yearlyDetails.map(y => y.expenseOtherCosts)} indent />
        </ExpandableLineItem>

        <ExpandableLineItem
          label="Management Fees"
          values={yearlyDetails.map(y => y.feeBase + y.feeIncentive)}
          tooltip="Fees paid to the management company: base fee (% of total revenue) and incentive fee (% of GOP)."
          expanded={!!expanded.cfMgmtFees}
          onToggle={() => toggleSection('cfMgmtFees')}
        >
          <LineItem label="Base Management Fee" values={yearlyDetails.map(y => y.feeBase)} indent />
          <LineItem label="Incentive Management Fee" values={yearlyDetails.map(y => y.feeIncentive)} indent />
        </ExpandableLineItem>
      </ExpandableLineItem>

      <LineItem
        label="Less: Interest Paid"
        values={yearlyData.map(y => y.interestExpense)}
        negate
        tooltip="Interest portion of debt service payments. Classified as operating under ASC 230."
      />

      <LineItem
        label="Less: Income Taxes Paid"
        values={yearlyData.map(y => y.taxLiability)}
        negate
        tooltip="Income tax on taxable income (NOI - Interest - Depreciation). Only when taxable income is positive."
      />

      <SubtotalRow
        label="Net Cash from Operating Activities"
        values={cashFromOperations}
        tooltip="Total cash generated from property operations = Revenue - Operating Expenses - Interest - Taxes (ASC 230)."
      />
      <MarginRow label="% of Total Revenue" values={cashFromOperations} baseValues={yearlyDetails.map(y => y.revenueTotal)} />

      <SpacerRow colSpan={colSpan} />

      {/* ── Investing Cash Flow ── */}
      <SectionHeader
        label="Cash Flow from Investing Activities"
        colSpan={colSpan}
        tooltip="Cash spent on property acquisition, renovation, and capital improvements (ASC 230)."
      />

      <LineItem
        label="Property Acquisition"
        values={yearlyData.map((_, i) => i === acquisitionYear ? totalPropertyCost : 0)}
        negate
        tooltip="Total property cost in acquisition year (purchase price + building improvements + pre-opening costs)."
      />

      <LineItem
        label="FF&E Reserve / Capital Improvements"
        values={yearlyDetails.map(y => y.expenseFFE)}
        negate
        tooltip="Furniture, fixtures & equipment reserve. Reclassified from operating to investing as a capital expenditure."
      />

      <LineItem
        label="Sale Proceeds (Net Exit Value)"
        values={yearlyData.map(y => y.exitValue)}
        tooltip={`Property sale price minus ${((global?.commissionRate ?? DEFAULT_COMMISSION_RATE) * 100).toFixed(0)}% commission and outstanding loan payoff. Classified as investing per ASC 360.`}
      />

      <SubtotalRow
        label="Net Cash from Investing Activities"
        values={cashFromInvesting}
        tooltip="Net cash from investing activities = -(Acquisition + FF&E) + Sale Proceeds (ASC 230)."
      />

      <SpacerRow colSpan={colSpan} />

      {/* ── Financing Cash Flow ── */}
      <SectionHeader
        label="Cash Flow from Financing Activities"
        colSpan={colSpan}
        tooltip="Cash from equity contributions, debt financing, and capital returns (ASC 230)."
      />

      <LineItem
        label="Equity Contribution"
        values={yearlyData.map((_, i) => i === acquisitionYear ? equityInvested : 0)}
        tooltip="Initial equity invested by owners/investors, including operating reserve."
      />

      <LineItem
        label="Loan Proceeds"
        values={yearlyData.map((_, i) => i === acquisitionYear && loan.loanAmount > 0 ? loan.loanAmount : 0)}
        tooltip="Mortgage proceeds received at acquisition."
      />

      <LineItem
        label="Less: Principal Repayments"
        values={yearlyData.map(y => y.principalPayment)}
        negate
        tooltip="Principal portion of debt service. Reduces outstanding loan balance."
      />

      <LineItem
        label="Refinancing Proceeds"
        values={yearlyData.map(y => y.refinancingProceeds)}
        tooltip="Net cash-out from refinancing, after closing costs and payoff of existing loan."
      />

      <SubtotalRow
        label="Net Cash from Financing Activities"
        values={cashFromFinancing}
        tooltip="Net cash from financing activities = Equity + Loan Proceeds - Principal + Refinancing (ASC 230)."
      />

      <SpacerRow colSpan={colSpan} />

      {/* ── Net Change & Balances ── */}
      <GrandTotalRow
        label="Net Increase (Decrease) in Cash"
        values={netChangeCash}
        tooltip="Operating + Investing + Financing = Net change in cash per ASC 230."
      />

      <LineItem label="Opening Cash Balance" values={openingCash} showZero />

      <SubtotalRow
        label="Closing Cash Balance"
        values={closingCash}
        positive
        bgColor="white"
        tooltip="Opening balance + Net change in cash. This should match the Balance Sheet cash position."
      />

      <SpacerRow colSpan={colSpan} />

      {/* ── Free Cash Flow ── */}
      <SectionHeader
        label="Free Cash Flow"
        colSpan={colSpan}
        tooltip="Cash from Operations minus capital expenditures. Shows cash available before debt repayment."
      />

      <LineItem label="Net Cash from Operating Activities" values={cashFromOperations} showZero />

      <LineItem
        label="Less: Capital Expenditures (FF&E)"
        values={yearlyDetails.map(y => y.expenseFFE)}
        negate
        tooltip="FF&E reserve deducted from CFO to arrive at Free Cash Flow."
      />

      <SubtotalRow
        label="Free Cash Flow (FCF)"
        values={fcfValues}
        positive
        bgColor="rgba(37, 125, 65, 0.08)"
        tooltip="FCF = Net Cash from Operating Activities - Capital Expenditures. Cash available to service debt and distribute to investors."
      />
      <MarginRow label="% of Total Revenue" values={fcfValues} baseValues={yearlyDetails.map(y => y.revenueTotal)} />

      <LineItem
        label="Less: Principal Payments"
        values={yearlyData.map(y => y.principalPayment)}
        negate
        tooltip="Principal portion of debt service. Reduces cash available to equity investors."
      />

      <SubtotalRow
        label="Free Cash Flow to Equity (FCFE)"
        values={fcfeValues}
        positive
        bgColor="rgba(37, 125, 65, 0.08)"
        tooltip="FCFE = FCF - Principal Payments. Cash available for distribution to investors after all obligations."
      />
      <MarginRow label="% of Total Revenue" values={fcfeValues} baseValues={yearlyDetails.map(y => y.revenueTotal)} />

      <SpacerRow colSpan={colSpan} />

      {/* ── Key Metrics ── */}
      <SectionHeader label="Key Metrics" colSpan={colSpan} />

      <MetricRow
        label="Cash-on-Cash Return"
        values={cocValues}
        highlights={cocHighlights}
        tooltip="Annual after-tax cash flow divided by initial equity. Shows the cash yield on your investment each year."
      />

      <MetricRow
        label="Debt Service Coverage Ratio"
        values={dscrValues}
        highlights={dscrHighlights}
        tooltip="NOI divided by debt service. Lenders typically require 1.25x minimum. Higher is better."
      />
    </TableShell>
  );
}
