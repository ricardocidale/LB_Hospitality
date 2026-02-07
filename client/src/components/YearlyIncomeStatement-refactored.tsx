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

interface Props {
  data: MonthlyFinancials[];
  years?: number;
  startYear?: number;
}

interface YearlyData {
  year: number;
  soldRooms: number;
  availableRooms: number;
  revenueRooms: number;
  revenueFB: number;
  revenueEvents: number;
  revenueOther: number;
  revenueTotal: number;
  expenseRooms: number;
  expenseFB: number;
  expenseEvents: number;
  expenseOther: number;
  expenseMarketing: number;
  expensePropertyOps: number;
  expenseUtilities: number;
  expenseAdmin: number;
  expenseIT: number;
  expenseInsurance: number;
  expenseTaxes: number;
  expenseOtherCosts: number;
  expenseFFE: number;
  feeBase: number;
  feeIncentive: number;
  gop: number;
  noi: number;
  interestExpense: number;
  depreciationExpense: number;
  incomeTax: number;
  netIncome: number;
}

function aggregateByYear(data: MonthlyFinancials[], years: number): YearlyData[] {
  const result: YearlyData[] = [];
  for (let y = 0; y < years; y++) {
    const yd = data.slice(y * 12, (y + 1) * 12);
    if (yd.length === 0) continue;
    result.push({
      year: y + 1,
      soldRooms: yd.reduce((a, m) => a + m.soldRooms, 0),
      availableRooms: yd.reduce((a, m) => a + m.availableRooms, 0),
      revenueRooms: yd.reduce((a, m) => a + m.revenueRooms, 0),
      revenueFB: yd.reduce((a, m) => a + m.revenueFB, 0),
      revenueEvents: yd.reduce((a, m) => a + m.revenueEvents, 0),
      revenueOther: yd.reduce((a, m) => a + m.revenueOther, 0),
      revenueTotal: yd.reduce((a, m) => a + m.revenueTotal, 0),
      expenseRooms: yd.reduce((a, m) => a + m.expenseRooms, 0),
      expenseFB: yd.reduce((a, m) => a + m.expenseFB, 0),
      expenseEvents: yd.reduce((a, m) => a + m.expenseEvents, 0),
      expenseOther: yd.reduce((a, m) => a + m.expenseOther, 0),
      expenseMarketing: yd.reduce((a, m) => a + m.expenseMarketing, 0),
      expensePropertyOps: yd.reduce((a, m) => a + m.expensePropertyOps, 0),
      expenseUtilities: yd.reduce((a, m) => a + m.expenseUtilitiesVar + m.expenseUtilitiesFixed, 0),
      expenseAdmin: yd.reduce((a, m) => a + m.expenseAdmin, 0),
      expenseIT: yd.reduce((a, m) => a + m.expenseIT, 0),
      expenseInsurance: yd.reduce((a, m) => a + m.expenseInsurance, 0),
      expenseTaxes: yd.reduce((a, m) => a + m.expenseTaxes, 0),
      expenseOtherCosts: yd.reduce((a, m) => a + m.expenseOtherCosts, 0),
      expenseFFE: yd.reduce((a, m) => a + m.expenseFFE, 0),
      feeBase: yd.reduce((a, m) => a + m.feeBase, 0),
      feeIncentive: yd.reduce((a, m) => a + m.feeIncentive, 0),
      gop: yd.reduce((a, m) => a + m.gop, 0),
      noi: yd.reduce((a, m) => a + m.noi, 0),
      interestExpense: yd.reduce((a, m) => a + m.interestExpense, 0),
      depreciationExpense: yd.reduce((a, m) => a + m.depreciationExpense, 0),
      incomeTax: yd.reduce((a, m) => a + m.incomeTax, 0),
      netIncome: yd.reduce((a, m) => a + m.netIncome, 0),
    });
  }
  return result;
}

export function YearlyIncomeStatement({ data, years = 5, startYear = 2026 }: Props) {
  const yd = aggregateByYear(data, years);
  const columns = yd.map((y) => `${startYear + y.year - 1}`);
  const colSpan = years + 1;

  return (
    <TableShell title="Income Statement" columns={columns} stickyLabel="Income Statement">
      {/* ── Revenue ── */}
      <SectionHeader label="Revenue" colSpan={colSpan} />

      <MetricRow
        label="ADR"
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
