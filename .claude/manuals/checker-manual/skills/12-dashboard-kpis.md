# 12 — Dashboard & Portfolio KPIs

> **The Dashboard (`/`) is the landing page after login.** It presents a consolidated, portfolio-wide view of financial performance across all property SPVs. Every number displayed on this page is computed client-side by running `generatePropertyProForma` for each property, aggregating monthly results into annual totals, and rendering via Recharts charts and summary tables.

---

## Tab Structure

The Dashboard is organized into five tabs:

| Tab | Icon | Content |
|-----|------|---------|
| **Portfolio Overview** | LayoutDashboard | KPI summary cards with trend charts |
| **Consolidated Income Statement** | FileText | USALI-aligned P&L aggregated across all properties by fiscal year |
| **Consolidated Cash Flow** | Banknote | ASC 230–compliant statement of cash flows by fiscal year |
| **Consolidated Balance Sheet** | Scale | Assets, liabilities, and equity across all SPVs |
| **Investment Analysis** | TrendingUp | FCF, FCFE, IRR, and equity multiple per property and portfolio-wide |

---

## Tab 1: Portfolio Overview — KPI Cards

The overview tab displays four headline KPI cards summarizing portfolio-level performance across the full projection horizon:

| KPI Card | Definition | Source Formula |
|----------|------------|----------------|
| **Total Revenue** | Sum of all revenue line items (Rooms + Events + F&B + Other) across all properties, all projection years | `formulas/property-financials.md` §2 (Revenue Build-Up) |
| **Gross Operating Profit (GOP)** | Total Revenue − Total Operating Expenses (departmental + undistributed), aggregated | `formulas/property-financials.md` §3 (Operating Expenses & GOP) |
| **Net Operating Income (NOI)** | GOP − Management Fees − FF&E Reserve, aggregated | `formulas/property-financials.md` §4 (NOI Derivation) |
| **Portfolio Cash** | Cumulative net cash position across all SPVs at the end of each projection year | `formulas/consolidated.md` §2 (Consolidated Cash Position) |

Each KPI card shows:
- The absolute dollar value (formatted with `formatMoney`)
- A trend indicator (line or bar chart via Recharts)

---

## Tab 2: Consolidated Income Statement

Aggregates all property-level income statements into a single portfolio P&L by fiscal year. The yearly aggregator (`yearlyAggregator.ts`) sums monthly values into annual buckets aligned to the fiscal year start month.

| Line Item | Composition | Formula Reference |
|-----------|-------------|-------------------|
| **Room Revenue** | Σ (ADR × Occupancy × Rooms × 30.5) per month, per property | `formulas/property-financials.md` §2.1 |
| **Event Revenue** | Room Revenue × `revShareEvents` per property | `formulas/property-financials.md` §2.2 |
| **F&B Revenue** | Room Revenue × `revShareFB` × (1 + `cateringBoostPercent`) per property | `formulas/property-financials.md` §2.3 |
| **Other Revenue** | Room Revenue × `revShareOther` per property | `formulas/property-financials.md` §2.4 |
| **Total Revenue** | Room + Event + F&B + Other | — |
| **Operating Expenses** | Sum of all departmental cost rates × Total Revenue | `formulas/property-financials.md` §3 |
| **Gross Operating Profit (GOP)** | Total Revenue − Operating Expenses | `formulas/property-financials.md` §3 |
| **Base Management Fee** | Total Revenue × `baseManagementFee` rate | `formulas/company-financials.md` §1.1 |
| **Incentive Management Fee** | GOP × `incentiveManagementFee` rate | `formulas/company-financials.md` §1.2 |
| **FF&E Reserve** | Total Revenue × `costRateFFE` | `formulas/property-financials.md` §3 |
| **Net Operating Income (NOI)** | GOP − Management Fees − FF&E Reserve | `formulas/property-financials.md` §4 |
| **Debt Service** | Monthly PMT (principal + interest) × 12, aggregated | `formulas/funding-financing-refi.md` §2 |
| **Net Income** | NOI − Debt Service − Income Tax Provision | `formulas/property-financials.md` §5 |

Rows are expandable (chevron toggle) to show sub-line detail.

---

## Tab 3: Consolidated Cash Flow Statement (ASC 230)

Presents cash flows in the three-activity format required by ASC 230:

| Section | Key Line Items | Formula Reference |
|---------|---------------|-------------------|
| **Cash from Operations (CFO)** | Net Income + Depreciation + Working Capital changes | `formulas/consolidated.md` §1.1 |
| **Cash from Investing (CFI)** | Property acquisitions (outflow), exit/disposition proceeds (inflow) | `formulas/consolidated.md` §1.2 |
| **Cash from Financing (CFF)** | Equity contributions, loan proceeds, debt repayment (principal), refinance proceeds | `formulas/consolidated.md` §1.3 |
| **Net Change in Cash** | CFO + CFI + CFF | — |
| **Opening Cash Balance** | Prior year closing balance (Year 0 = 0) | — |
| **Closing Cash Balance** | Opening + Net Change | — |

> **Cross-reference:** See `formulas/funding-financing-refi.md` §3 for refinancing cash flow treatment and `formulas/dcf-fcf-irr.md` §1 for the relationship between operating cash flow and free cash flow.

---

## Tab 4: Consolidated Balance Sheet

Aggregates all property SPV balance sheets into a consolidated view. The fundamental accounting equation must hold in every period:

**Assets = Liabilities + Equity**

| Category | Line Items | Formula Reference |
|----------|-----------|-------------------|
| **Assets** | Land (non-depreciable), Building & Improvements (depreciable), Accumulated Depreciation, Cash & Cash Equivalents | `formulas/property-financials.md` §6 |
| **Liabilities** | Acquisition Debt Outstanding, Refinance Debt Outstanding | `formulas/funding-financing-refi.md` §2 |
| **Equity** | Contributed Equity (initial investment), Retained Earnings (cumulative net income) | `formulas/property-financials.md` §6 |

- **Depreciation:** Building & Improvements are depreciated straight-line over 39 years (IRS §168 for nonresidential real property).
- **Land** is carried at cost and is **never depreciated**.
- Land value is computed as `purchasePrice × landValuePercent`.

---

## Tab 5: Investment Analysis

Provides return metrics at the individual property level and portfolio-wide:

| Metric | Definition | Formula Reference |
|--------|-----------|-------------------|
| **Free Cash Flow (FCF)** | NOI − CapEx (unlevered) | `formulas/dcf-fcf-irr.md` §1 |
| **Free Cash Flow to Equity (FCFE)** | FCF − Debt Service + Net Borrowings | `formulas/dcf-fcf-irr.md` §2 |
| **Internal Rate of Return (IRR)** | Discount rate that sets NPV of equity cash flows to zero; computed via Newton-Raphson solver | `formulas/dcf-fcf-irr.md` §3 |
| **Equity Multiple** | Total distributions / Total equity invested | `formulas/dcf-fcf-irr.md` §4 |

The IRR calculation uses the standalone `computeIRR` solver from `analytics/returns/irr.ts`, wrapped to return an annual periodic rate.

---

## Data Flow: Assumptions → Engine → Aggregation → Display

Every number on the Dashboard traces through this pipeline:

| Step | Component | Description |
|------|-----------|-------------|
| 1 | Property Assumptions | User-configured inputs (ADR, occupancy, cost rates, financing, etc.) stored in the database |
| 2 | Global Assumptions | Portfolio-wide parameters (inflation, management fees, projection years, fiscal year start) |
| 3 | `generatePropertyProForma()` | Client-side financial engine computes monthly arrays for each property |
| 4 | `aggregatePropertyByYear()` | Sums monthly income statement items into fiscal-year buckets |
| 5 | `aggregateCashFlowByYear()` | Computes annual ATCF, exit value, refi proceeds, debt service vectors |
| 6 | Consolidated Cache | Portfolio-level yearly totals = Σ of all per-property yearly arrays |
| 7 | Recharts Rendering | Line charts (revenue trends) and bar charts (expense breakdown) for visual presentation |

---

## Charts

The Dashboard uses **Recharts** for data visualization:

| Chart Type | Data Displayed | Location |
|------------|---------------|----------|
| **Line Chart** | Revenue, GOP, NOI trends over projection years | Portfolio Overview tab |
| **Bar Chart** | Expense category breakdown by year | Income Statement tab |
| **Stacked Bar** | Cash flow composition (CFO, CFI, CFF) | Cash Flow tab |

---

## Verification Notes for Checkers

> **Every number on the Dashboard should be independently verifiable by exporting property-level data to Excel and summing manually.**

| Verification Step | Procedure |
|-------------------|-----------|
| 1. Export individual property data | Navigate to each property's detail page → export to Excel |
| 2. Sum across properties | In Excel, sum each line item across all property worksheets |
| 3. Compare to Dashboard | The manually computed totals must match the Dashboard consolidated figures exactly (to the penny) |
| 4. Check fiscal year alignment | Confirm that monthly-to-annual bucketing respects the configured `fiscalYearStartMonth` |
| 5. Verify chart data | Hover over chart data points and confirm they match the underlying table values |
| 6. Test with zero properties | Remove all properties → Dashboard KPIs should display $0 across all metrics |
| 7. Test single property | With only one property, consolidated totals must equal that property's individual financials exactly |

> **Cross-reference:** See `skills/15-testing-methodology.md` for the complete phased testing protocol.
