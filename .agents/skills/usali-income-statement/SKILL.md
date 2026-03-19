---
name: usali-income-statement
description: USALI-compliant Income Statement structure for hospitality properties. Defines the canonical line item order, chevron expandable rows, KPI metrics, and formula derivations for the Consolidated Income Statement. Reference when building or modifying financial statement views.
---

# USALI Income Statement Structure

This skill defines the canonical Income Statement layout for the hospitality business portal, following the Uniform System of Accounts for the Lodging Industry (USALI) 12th Edition.

## Canonical Line Item Order (Top to Bottom)

The Income Statement MUST follow this exact progression. Each header row has a chevron for expansion.

```
1.  Operational Metrics          [chevron → TRevPAR, GOPPAR, ADR, Occ, RevPAR, GOP Margin, NOI Margin]
2.  Total Revenue                [chevron → Room, Event, F&B, Other + per-property breakdown]
3.  Departmental Expenses        [chevron → Room, F&B, Event, Other departmental]
4.  Undistributed Operating Exp  [chevron → Marketing, Property Ops, Admin, IT, Insurance, Utilities, Other]
5.  Gross Operating Profit (GOP) [chevron → formula + GOP Margin + per-property breakdown]
6.  Management Fees              [chevron → Base Fee, Service Fees by Category, Incentive Fee]
7.  Adjusted GOP (AGOP)          [chevron → formula + AGOP Margin + per-property breakdown]
8.  Fixed Charges                [chevron → Property Taxes]
9.  Net Operating Income (NOI)   [chevron → formula + NOI Margin + per-property breakdown]
10. FF&E Reserve                 [chevron → FF&E % of Revenue + formula]
11. Adjusted NOI (ANOI)          [chevron → formula + ANOI Margin + per-property breakdown]
12. Debt Service                 [chevron → Interest Expense, Principal Payment, DSCR]
13. Net Income                   [chevron → Depreciation, Income Tax, Cash Flow]
```

## Key Formulas

| Line Item | Formula | Engine Field |
|-----------|---------|-------------|
| GOP | Total Revenue − Dept Expenses − Undistributed Expenses | `gop` |
| AGOP | GOP − Base Fee − Incentive Fee | `agop` |
| NOI | AGOP − Fixed Charges (Property Taxes) | `noi` |
| ANOI | NOI − FF&E Reserve | `anoi` |
| DSCR | NOI ÷ Total Debt Service | derived |
| Net Income | ANOI − Interest Expense − Depreciation − Income Tax | `netIncome` |

## NOI Display Convention

NOI uses the engine value directly: `engine.noi = agop − expenseTaxes`.
This is the USALI-standard NOI. Previously a `display_NOI = noi + feeBase + feeIncentive` convention existed — that is DEPRECATED.

## Metrics (Expanded under "Operational Metrics")

| Metric | Formula |
|--------|---------|
| ADR (Effective) | Room Revenue ÷ Sold Rooms |
| Occupancy | Sold Rooms ÷ Available Rooms |
| RevPAR | Room Revenue ÷ Available Rooms |
| TRevPAR | Total Revenue ÷ Available Rooms |
| GOPPAR | GOP ÷ Available Rooms |
| GOP Margin | GOP ÷ Total Revenue |
| NOI Margin | NOI ÷ Total Revenue |

## Expense Categories

### Departmental (Direct)
Room, F&B, Event, Other departmental

### Undistributed (Overhead)
Marketing & Sales, Property Operations & Maintenance, Admin & General, IT & Technology, Insurance, Utilities, Other Undistributed

## Implementation Files

### Income Statement Views (all follow USALI order)
- `client/src/components/dashboard/IncomeStatementTab.tsx` — Consolidated IS (portfolio-level, chevron rows)
- `client/src/components/statements/YearlyIncomeStatement.tsx` — Property-level IS (multi-year, expandable formulas)
- `client/src/components/property-detail/IncomeStatementTab.tsx` — Property detail IS wrapper (waterfall + line chart + table)
- `client/src/components/statements/FinancialStatement.tsx` — Monthly IS (12-month columns)

### NOT a Property IS (different structure)
- `client/src/components/company/CompanyIncomeTab.tsx` — Management company P&L (Revenue = fees, Expenses = company overhead, EBITDA → Net Income). This is NOT a USALI property IS.

### Support Files
- `client/src/components/dashboard/dashboardExports.ts` — Export data generation
- `client/src/components/dashboard/useExpandableRows.ts` — Shared chevron state hook
- `client/src/components/property-detail/types.ts` — Property detail type definitions (YearlyDetail, YearlyChartDataPoint)
- `client/src/components/ui/financial-chart.tsx` — Chart presets (includes `agop` series)
- `client/src/lib/financial/yearlyAggregator.ts` — Yearly consolidation of engine data
- `client/src/lib/financial/types.ts` — Engine output types
- `client/src/lib/exports/excel/property-sheets.ts` — Excel export (USALI order)
- `client/src/lib/exports/checkerManualExport.ts` — Checker manual export (USALI order)
- `client/src/pages/PropertyDetail.tsx` — Property detail page (chart data + PDF export, USALI order)

## Row Key Registry

The `IS_ROW_KEYS` array controls which chevron sections exist:

```typescript
["metrics", "revenue", "deptExpenses", "undistExpenses",
 "gop", "fees", "agop", "fixed", "noi", "ffe", "anoi",
 "debtService", "netIncome"]
```

Each key maps to a header row that toggles child rows on click.

## Chart Series

The Income Statement chart shows: Revenue, GOP, AGOP, NOI, ANOI.
AGOP uses preset color `#10B981` (emerald green).

## Rules

1. Never combine Departmental and Undistributed expenses into a single "Operating Expenses" section.
2. AGOP must always appear between Management Fees and Fixed Charges.
3. Every profitability subtotal (GOP, AGOP, NOI, ANOI) must show a margin % and per-property breakdown when expanded (consolidated) or margin % (property-level).
4. Formula rows use the blue-tinted expandable pattern (`bg-blue-50/40`).
5. All waterfall charts must follow USALI order: Revenue → Dept Exp → Undist Exp → GOP → Fees → AGOP → Fixed → NOI → FF&E → ANOI.
6. All line charts showing IS data must include AGOP series with color `#10B981`.
7. NOI always uses `engine.noi` directly — never `noi + feeBase + feeIncentive`.
8. The Company IS (`CompanyIncomeTab.tsx`) is a management company P&L, NOT a USALI property IS. Do not apply these rules to it.
