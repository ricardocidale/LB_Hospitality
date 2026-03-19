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

## Cash Flow Statement Structure (ASC 230 Indirect Method)

Cash Flow Statements follow ASC 230 and use USALI-aligned expense grouping within CFO.

### Canonical Section Order

```
1.  Cash Flow from Operating Activities (CFO)
    ├── Cash Received from Guests & Clients [chevron → ADR, Occ, RevPAR, TRevPAR, revenue by stream]
    ├── Cash Paid for Operating Expenses [chevron]
    │   ├── Departmental Expenses [chevron → Rooms, F&B, Events, Other]
    │   ├── Undistributed Operating Expenses [chevron → Marketing, Prop Ops, Utilities, Taxes, Insurance, Admin, IT, Other]
    │   └── Management Fees [chevron → Base Fee, Incentive Fee]
    ├── USALI Profitability Subtotals
    │   ├── GOP [chevron → Revenue, Dept Exp, Undist Exp, GOP Margin, GOPPAR]
    │   ├── AGOP [chevron → GOP, Base Fee, Incentive Fee, AGOP Margin]
    │   ├── NOI [chevron → AGOP, Fixed Charges, NOI Margin, NOIPOR]
    │   └── ANOI [chevron → NOI, FF&E Reserve, ANOI Margin]
    ├── Cash Adjustments
    │   ├── Less: Interest Paid
    │   └── Less: Income Taxes Paid
    = Net Cash from Operating Activities
2.  Cash Flow from Investing Activities (CFI)
    ├── Property Acquisition
    ├── FF&E Reserve / Capital Improvements
    └── Sale Proceeds (Net Exit Value)
    = Net Cash from Investing Activities
3.  Cash Flow from Financing Activities (CFF)
    ├── Equity Contribution
    ├── Loan Proceeds
    ├── Less: Principal Repayments
    └── Refinancing Proceeds
    = Net Cash from Financing Activities
4.  Net Increase (Decrease) in Cash = CFO + CFI + CFF
5.  Opening / Closing Cash Balance
6.  Free Cash Flow [chevron → CFO, FF&E]
    ├── FCF = CFO − FF&E
    └── FCFE = FCF − Principal Payments [chevron → formula]
7.  Key Metrics [chevron → DSCR, CoC, FCF Margin, FCFE Margin]
```

### Dashboard Consolidated CF Structure

The Dashboard CF mirrors the property-level structure but at portfolio level:
- CFO/CFI/CFF each expand to show consolidated line items + per-property breakdown
- CFO shows: Revenue, NOI, ANOI, Interest, Taxes, CFO Margin
- CFI shows: Capital Expenditures (FF&E), Sale Proceeds (Net Exit)
- CFF shows: Principal Repayments, Refinancing Proceeds
- FCF section with formula + line item breakdown
- FCFE row with formula
- Key Metrics: DSCR, Cash-on-Cash Return, FCF Margin, FCFE Margin

### Key CF Formulas

| Line Item | Formula | Source |
|-----------|---------|-------|
| CFO | Revenue − OpEx (excl. FF&E) − Interest − Taxes | `cashFlowSections.ts` |
| CFI | −Acquisition − FF&E + Exit Value | `cashFlowSections.ts` |
| CFF | Equity + Loan − Principal + Refinancing | `cashFlowSections.ts` |
| FCF | CFO − FF&E | `cashFlowSections.ts` |
| FCFE | FCF − Principal | `cashFlowSections.ts` |
| DSCR | ANOI ÷ Debt Service | derived |

### Cash Flow Implementation Files

- `client/src/components/statements/YearlyCashFlowStatement.tsx` — Property-level CF (multi-year, ASC 230, USALI expense grouping)
- `client/src/components/dashboard/CashFlowTab.tsx` — Consolidated CF (portfolio-level, chevron rows)
- `client/src/components/property-detail/CashFlowTab.tsx` — Property detail CF wrapper (line chart + table)
- `client/src/lib/financial/cashFlowSections.ts` — Single source of truth for CFO/CFI/CFF/FCF/FCFE computation
- `client/src/lib/financial/cashFlowAggregator.ts` — Yearly CF data aggregation

### NOT a Property CF (different structure)
- `client/src/components/company/CompanyCashFlowTab.tsx` — Management company CF (Revenue = fees, Expenses = company overhead, SAFE funding). This is NOT a property CF.

### CF Chart Series

The Cash Flow chart shows: ANOI, FCF, FCFE.
Dashboard consolidated CF chart shows: NOI, ANOI, CashFlow, FCFE.

## Rules

1. Never combine Departmental and Undistributed expenses into a single "Operating Expenses" section — applies to both IS and CF views.
2. AGOP must always appear between Management Fees and Fixed Charges.
3. Every profitability subtotal (GOP, AGOP, NOI, ANOI) must show a margin % and per-property breakdown when expanded (consolidated) or margin % (property-level).
4. Formula rows use the blue-tinted expandable pattern (`bg-blue-50/40`).
5. All waterfall charts must follow USALI order: Revenue → Dept Exp → Undist Exp → GOP → Fees → AGOP → Fixed → NOI → FF&E → ANOI.
6. All line charts showing IS data must include AGOP series with color `#10B981`.
7. NOI always uses `engine.noi` directly — never `noi + feeBase + feeIncentive`.
8. The Company IS/CF (`CompanyIncomeTab.tsx`, `CompanyCashFlowTab.tsx`) is a management company P&L/CF, NOT a USALI property statement. Do not apply these rules to it.
9. CF operating expense grouping must mirror IS: Departmental → Undistributed → Management Fees (never "Direct Costs" + "Overhead").
10. FCF formula: CFO − FF&E (not ANOI − CapEx). Always reference CFO correctly in formula displays.
