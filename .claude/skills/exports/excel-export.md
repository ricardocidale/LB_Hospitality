# Excel Export Skill

**Implementation**: `client/src/lib/exports/excelExport.ts`

## Overview

Generates formatted Excel workbooks (.xlsx) for financial statements using the SheetJS (xlsx) library. All numeric cells receive proper number formatting (currency with commas, percentage, decimal).

## Exported Functions

### Property-Level Exports

| Function | Description | Sheet Name |
|----------|-------------|------------|
| `exportPropertyIncomeStatement` | Revenue, expenses, GOP, NOI, GAAP Net Income | "Income Statement" |
| `exportPropertyCashFlow` | Operating/Investing/Financing cash flows, FCF, FCFE | "Cash Flow" |
| `exportPropertyBalanceSheet` | Assets, liabilities, equity with yearly columns | "Balance Sheet" |
| `exportFullPropertyWorkbook` | Combined Income Statement + Cash Flow in single workbook | Multiple sheets |

### Company-Level Exports

| Function | Description | Sheet Name |
|----------|-------------|------------|
| `exportCompanyIncomeStatement` | Management fees, expenses, net income, SAFE funding | "Company Income Statement" |
| `exportCompanyCashFlow` | Cash inflows/outflows with cumulative totals | "Company Cash Flow" |
| `exportCompanyBalanceSheet` | SAFE notes, retained earnings, point-in-time snapshot | "Company Balance Sheet" |

## Number Formatting

Applied automatically via `applyCurrencyFormat()`:
- **Currency**: `#,##0` for all monetary values (revenue, expenses, cash flows)
- **Decimal**: `#,##0.00` for ADR and RevPAR
- **Percentage**: `0.0` for occupancy rates
- **Bold styling**: Section headers (ALL CAPS) and total/summary rows

## Usage Pattern

```typescript
import {
  exportPropertyIncomeStatement,
  exportCompanyIncomeStatement,
  exportFullPropertyWorkbook,
} from "@/lib/exports";

exportPropertyIncomeStatement(proFormaData, "Property Name", years, modelStartDate, fiscalYearStartMonth);
```

## Dependencies

- `xlsx` (SheetJS)
- `../financialEngine` (MonthlyFinancials, CompanyMonthlyFinancials, getFiscalYearForModelYear)
- `../loanCalculations` (LoanParams, GlobalLoanParams, calculateLoanParams)
- `../constants` (PROJECTION_YEARS, DEFAULT_EXIT_CAP_RATE)

## Related Skills

- **export-controls.md** — ExportToolbar component for button placement
- **pdf-chart-export.md** — PDF chart rendering companion
- **png-export.md** — PNG table/chart capture companion
