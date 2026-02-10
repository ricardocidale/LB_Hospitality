/**
 * YearlyIncomeStatement — Refactored with shared row components
 *
 * MIGRATION EXAMPLE: Shows how to replace ~200 lines of hardcoded
 * <TableRow>/<TableCell> markup with shared financial-table-rows.
 *
 * Before: hardcoded hex colors (#257D41, #3B82F6, #F4795B, #7C3AED),
 *         inline className strings repeated on every row.
 * After:  shared components with centralized styling.
 *
 * To apply: replace client/src/components/YearlyIncomeStatement.tsx
 */

import { MonthlyFinancials } from "@/lib/financialEngine";
import {
  TableShell,
  SectionHeader,
  SubtotalRow,
  LineItem,
  SpacerRow,
  MetricRow,
} from "@/components/financial-table-rows";
import { aggregatePropertyByYear } from "@/lib/yearlyAggregator";

interface Props {
  data: MonthlyFinancials[];
  years?: number;
  startYear?: number;
}

export function YearlyIncomeStatement({ data, years = 5, startYear = 2026 }: Props) {
  const yd = aggregatePropertyByYear(data, years);
  const columns = yd.map((y) => `${startYear + y.year}`);
  const colSpan = years + 1;

  return (
    <TableShell title="Income Statement" columns={columns} stickyLabel="Income Statement">
      {/* ── Revenue ── */}
      <SectionHeader label="Revenue" colSpan={colSpan} />

      <MetricRow
        label="ADR (Rate)"
        values={yd.map((y) =>
          y.cleanAdr > 0 ? `$${y.cleanAdr.toFixed(0)}` : "-"
        )}
      />
      <MetricRow
        label="ADR (Effective)"
        values={yd.map((y) =>
          y.soldRooms > 0 ? `$${(y.revenueRooms / y.soldRooms).toFixed(0)}` : "-"
        )}
      />
      <MetricRow
        label="Occupancy"
        values={yd.map((y) =>
          y.availableRooms > 0
            ? `${((y.soldRooms / y.availableRooms) * 100).toFixed(1)}%`
            : "0%"
        )}
      />
      <MetricRow
        label="RevPAR"
        values={yd.map((y) =>
          y.availableRooms > 0 ? `$${(y.revenueRooms / y.availableRooms).toFixed(0)}` : "-"
        )}
      />

      <LineItem label="Room Revenue"        values={yd.map((y) => y.revenueRooms)} />
      <LineItem label="Food & Beverage"     values={yd.map((y) => y.revenueFB)} />
      <LineItem label="Events & Functions"   values={yd.map((y) => y.revenueEvents)} />
      <LineItem label="Other Revenue"        values={yd.map((y) => y.revenueOther)} />
      <SubtotalRow label="Total Revenue"     values={yd.map((y) => y.revenueTotal)} positive />

      <SpacerRow colSpan={colSpan} />

      {/* ── Operating Expenses ── */}
      <SectionHeader label="Operating Expenses" colSpan={colSpan} />

      <LineItem label="Housekeeping"             values={yd.map((y) => y.expenseRooms)} />
      <LineItem label="Food & Beverage"          values={yd.map((y) => y.expenseFB)} />
      <LineItem label="Events & Functions"        values={yd.map((y) => y.expenseEvents)} />
      <LineItem label="Other Departments"         values={yd.map((y) => y.expenseOther)} />
      <LineItem label="Sales & Marketing"         values={yd.map((y) => y.expenseMarketing)} />
      <LineItem label="Property Operations"       values={yd.map((y) => y.expensePropertyOps)} />
      <LineItem label="Utilities"                 values={yd.map((y) => y.expenseUtilities)} />
      <LineItem label="Administrative & General"  values={yd.map((y) => y.expenseAdmin)} />
      <LineItem label="IT & Technology"           values={yd.map((y) => y.expenseIT)} />
      <LineItem label="Insurance"                 values={yd.map((y) => y.expenseInsurance)} />
      <LineItem label="Property Taxes"            values={yd.map((y) => y.expenseTaxes)} />
      <LineItem label="Other Costs"               values={yd.map((y) => y.expenseOtherCosts)} />

      <SpacerRow colSpan={colSpan} />

      {/* ── Profitability ── */}
      <SubtotalRow label="Gross Operating Profit (GOP)" values={yd.map((y) => y.gop)} positive />

      <SpacerRow colSpan={colSpan} />

      {/* ── Non-Operating ── */}
      <SectionHeader label="Non-Operating Expenses" colSpan={colSpan} />

      <LineItem label="Base Management Fee"       values={yd.map((y) => y.feeBase)} />
      <LineItem label="Incentive Management Fee"  values={yd.map((y) => y.feeIncentive)} />
      <LineItem label="FF&E Reserve"              values={yd.map((y) => y.expenseFFE)} />

      <SpacerRow colSpan={colSpan} />

      <SubtotalRow label="Net Operating Income (NOI)" values={yd.map((y) => y.noi)} positive />

      <SpacerRow colSpan={colSpan} />

      {/* ── Below NOI ── */}
      <SectionHeader label="Below NOI" colSpan={colSpan} />

      <LineItem label="Interest Expense"  values={yd.map((y) => y.interestExpense)} />
      <LineItem label="Depreciation"      values={yd.map((y) => y.depreciationExpense)} />
      <LineItem label="Income Tax"        values={yd.map((y) => y.incomeTax)} />

      <SpacerRow colSpan={colSpan} />

      {/* ── Bottom Line ── */}
      <SubtotalRow label="GAAP Net Income" values={yd.map((y) => y.netIncome)} positive />
    </TableShell>
  );
}
