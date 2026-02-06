# Excel Export Sub-Skill

**File**: `client/src/lib/exports/excelExport.ts`
**Library**: `xlsx` (SheetJS)
**Parent**: [SKILL.md](./SKILL.md)

## Overview

Generates formatted Excel workbooks (.xlsx) for financial statements. All numeric cells receive proper number formatting (currency with commas, percentages, decimals). Section headers and total rows are bolded automatically.

## Exported Functions

### Property-Level

| Function | Description | Sheet Name |
|----------|-------------|------------|
| `exportPropertyIncomeStatement` | Revenue, expenses, GOP, NOI, GAAP Net Income | "Income Statement" |
| `exportPropertyCashFlow` | Operating/Investing/Financing cash flows, FCF, FCFE | "Cash Flow" |
| `exportPropertyBalanceSheet` | Assets, liabilities, equity with yearly columns | "Balance Sheet" |
| `exportFullPropertyWorkbook` | Combined Income Statement + Cash Flow in single workbook | Multiple sheets |

### Company-Level

| Function | Description | Sheet Name |
|----------|-------------|------------|
| `exportCompanyIncomeStatement` | Management fees, expenses, net income | "Company Income Statement" |
| `exportCompanyCashFlow` | Cash inflows/outflows with cumulative totals | "Company Cash Flow" |
| `exportCompanyBalanceSheet` | SAFE notes, retained earnings | "Company Balance Sheet" |

## Number Formatting

Applied automatically via `applyCurrencyFormat()`:

| Format | Pattern | Applied to |
|--------|---------|------------|
| Currency | `#,##0` | All monetary values |
| Decimal | `#,##0.00` | ADR, RevPAR |
| Percentage | `0.0"%"` | Occupancy rates |

## Usage

```ts
import { exportPropertyIncomeStatement, exportCompanyIncomeStatement } from "@/lib/exports";

exportPropertyIncomeStatement(proFormaData, "Property Name", years, modelStartDate, fiscalYearStartMonth);
```

## Integration with ExportMenu

```tsx
excelAction(() => exportPropertyIncomeStatement(data, name, years, startDate, fyMonth))
```
