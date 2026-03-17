# Comprehensive PDF Report — Skill

## Purpose

When a user exports **any** report from the Dashboard, the system produces a single, enterprise-quality, multi-page PDF that combines **all five financial sections** into one unified document — not just the tab they're currently viewing. The result should look like it was produced by a professional graphic designer at a top-tier investment firm.

---

## Core Principle

**One click → complete investor report.** Regardless of which dashboard tab (Overview, Income Statement, Cash Flow, Balance Sheet, or Investment Analysis) the user is on when they click "Export PDF", the output is the same comprehensive report containing all sections.

---

## Existing Implementation

**File:** `client/src/components/dashboard/dashboardExports.ts`
**Function:** `exportDashboardComprehensivePDF(params)`

This function already generates a multi-page report. The current pages are:

1. **Cover Page** — Company name, portfolio summary (years, properties, rooms), generation date, TOC note
2. **Dashboard Summary** — KPI metric cards (IRR, Equity Multiple, Cash-on-Cash, Total Equity, Exit Value) + property roster table
3. **Income Statement** — USALI-structured consolidated table
4. **Cash Flow Statement** — CFO / CFI / CFF / Net Change in Cash
5. **Balance Sheet** — Assets / Liabilities / Equity with ratios
6. **Investment Analysis** — BTCF / ATCF / IRR / Equity Multiple / Cash-on-Cash detail
7. **Performance Charts** — Revenue, Operating Expenses, and ANOI trend lines

### Interface

```ts
interface ComprehensiveDashboardExportParams {
  financials: DashboardFinancials;
  properties: Property[];
  projectionYears: number;
  getFiscalYear: (i: number) => number;
  companyName?: string;
  incomeRows: ExportRow[];
  modelStartDate?: Date;
}
```

### Data Generators Used

| Generator | Statement | File |
|-----------|-----------|------|
| `generatePortfolioIncomeData()` | Income Statement | `dashboardExports.ts` |
| `generatePortfolioCashFlowData()` | Cash Flow | `dashboardExports.ts` |
| `generatePortfolioBalanceSheetData()` | Balance Sheet | `dashboardExports.ts` |
| `generatePortfolioInvestmentData()` | Investment Analysis | `dashboardExports.ts` |

---

## Report Structure — Full Page Inventory

The comprehensive PDF should contain the following pages in order:

### Page 1: Cover Page
- Full-bleed navy (`#1A2332`) background with subtle sage grid overlay
- Sage vertical accent bar (4mm) beside company name
- Company name in large white text (32pt, left-aligned at x=28)
- White horizontal divider rule below company name
- Report title in sage green (18pt)
- Projection subtitle in muted sage (12pt)
- Metadata card (navy-blue rounded rectangle with sage border):
  - Report type, projection period, classification
- Date string at bottom (sage text)
- Confidential disclaimer in italic (muted)
- Sage green top/bottom border bars (3mm)
- Generated via `drawCoverPage()` from `pdfHelpers.ts` — reusable across all dashboard PDF exports
- **All dashboard PDF exports** (comprehensive and individual tab) use this same cover page
- Company logo (future: if available from `/api/logos/active`)

### Page 2: Table of Contents
- Numbered section list with page references
- Sections: Executive Summary, Income Statement, Cash Flow Statement, Balance Sheet, Investment Analysis, Performance Charts, Appendix
- Clean typography with sage green section numbers

### Page 3: Executive Summary / Dashboard KPIs
- Use `drawDashboardSummaryPage()` from `pdfHelpers.ts`
- KPI cards arranged in a grid:
  - **Return Metrics**: Portfolio IRR, Equity Multiple, Cash-on-Cash
  - **Investment Summary**: Total Equity, Exit Value, Properties/Rooms
  - **Projection Totals**: 10-Year Revenue, NOI, Cash Flow
- Property roster table: Name, Market, Rooms, Status

### Page 4–5: Consolidated Income Statement (USALI)
- Title: "Consolidated Income Statement (USALI)"
- Full `buildFinancialTableConfig()` table with all revenue/expense line items
- Branded table with section headers (sage green fill), alternating row tint, courier numerics
- Landscape orientation for 10+ year projections
- Auto-pagination via `jspdf-autotable` if rows exceed page height

### Page 6: Cash Flow Statement
- Title: "Consolidated Cash Flow Statement"
- CFO, CFI, CFF, Net Change in Cash with proper subtotals
- Formula rows in italic with muted color

### Page 7: Balance Sheet
- Title: "Consolidated Balance Sheet"
- Assets (Current + Fixed + Other), Liabilities, Equity
- Debt-to-Assets and Equity-to-Assets ratio rows

### Page 8: Investment Analysis
- Title: "Portfolio Investment Analysis"
- Before-Tax Cash Flow, Tax Calculations, After-Tax Cash Flow
- Disposition/Exit proceeds in final year
- IRR, Equity Multiple, Cash-on-Cash summary metrics

### Page 9: Performance Charts
- Revenue, Operating Expenses, ANOI trend lines
- Uses `drawLineChart()` from `pdfChartDrawer.ts`
- Color-coded series: Revenue (#7C3AED), OpEx (#2563EB), ANOI (#257D41)
- Grid lines, axis labels, centered legend

### Page 10 (Optional): Appendix / Disclaimers
- "This report was generated by [Company Name]'s financial projection engine."
- "Past performance is not indicative of future results."
- "All figures represent projected values based on current assumptions."
- Assumption summary: inflation rate, cost of equity, cap rates used

---

## Design Standards — Enterprise Quality

### Typography
- **Titles**: Helvetica Bold, 18–20pt, dark text (`#3D3D3D`)
- **Subtitles**: Helvetica Normal, 10pt, gray (`#666666`)
- **Table headers**: Helvetica Bold, 7–8pt, white on sage green
- **Table body**: Helvetica Normal, 6–7.5pt (auto-sized based on column count)
- **Numerics**: Courier font for right-aligned financial data
- **Footers**: Helvetica Normal, 7pt, light gray (`#999999`)

### Color Palette (Brand)

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| Navy | `#1A2332` | `[26, 35, 50]` | Cover page, branded headers |
| Sage Green | `#9FBCA4` | `[159, 188, 164]` | Table headers, accent bars, divider lines |
| Dark Green | `#257D41` | `[37, 125, 65]` | Section titles, positive KPI values |
| Dark Text | `#3D3D3D` | `[61, 61, 61]` | Body text |
| Gray | `#666666` | `[102, 102, 102]` | Labels, subtitles |
| Light Gray | `#999999` | `[153, 153, 153]` | Footer text |
| Section BG | `#EFF5F0` | `[239, 245, 240]` | Section header row fill |
| Alt Row | `#F8FAF9` | `[248, 250, 249]` | Alternating row tint |

### Layout Rules
- **Margins**: 14mm on all sides
- **Branded header**: Navy rectangle (28mm height) with sage green 2mm accent bar at bottom — drawn by `drawBrandedHeader()` on section title pages
- **Section dividers**: Sage green horizontal rule between sections
- **Page footers**: "[Company Name] — Confidential" (left), "Page X of Y" (right), sage green rule above
- **Landscape orientation**: Always use landscape A4 for 10-year projection tables
- **Table frame**: 0.6pt sage green outer border around all financial tables

### Number Formatting
- Currency: `$1,234,567` or `($1,234,567)` for negatives — via `formatFull()` from `exportStyles.ts`
- Compact: `$1.2M`, `$450K` — via compact Intl formatter for KPI cards
- Percentages: `12.5%`
- Zero/empty: `—` (em dash)
- Negative values in parentheses, never with minus sign

---

## Trigger Points

The comprehensive PDF should be triggered from:

1. **Dashboard ExportMenu** — Any "PDF" export action on any dashboard tab
2. **Dashboard toolbar** — A dedicated "Full Report" export option
3. **Premium Export dialog** — When user selects PDF format with "Full Report" scope

### Wiring Pattern

```tsx
// In Dashboard.tsx or the active tab component:
import { exportDashboardComprehensivePDF } from "./dashboardExports";

const handleComprehensivePDF = async () => {
  await exportDashboardComprehensivePDF({
    financials,
    properties,
    projectionYears,
    getFiscalYear,
    companyName: company?.name,
    incomeRows,
    modelStartDate,
  });
};

// In ExportMenu:
pdfAction(() => handleComprehensivePDF())
```

---

## Shared Utilities

| Utility | File | Purpose |
|---------|------|---------|
| `drawCoverPage()` | `pdfHelpers.ts` | Enterprise navy cover page with branded metadata |
| `drawBrandedHeader()` | `pdfHelpers.ts` | Navy header bar with sage accent |
| `drawTitle()` | `pdfHelpers.ts` | Section titles |
| `drawSubtitle()` | `pdfHelpers.ts` | Subtitle text |
| `drawSubtitleRow()` | `pdfHelpers.ts` | Left subtitle + right-aligned tag |
| `drawDashboardSummaryPage()` | `pdfHelpers.ts` | KPI metric grid + property table |
| `buildFinancialTableConfig()` | `pdfHelpers.ts` | Branded autoTable config |
| `addFooters()` | `pdfHelpers.ts` | Confidential footer on all pages |
| `drawLineChart()` | `pdfChartDrawer.ts` | Multi-series line chart |
| `BRAND` | `exportStyles.ts` | All color constants |
| `classifyRow()` | `exportStyles.ts` | Row type detection (header/subtotal/formula) |
| `formatFull()` | `exportStyles.ts` | Currency formatting |

---

## Dependencies

| Package | Version | Import |
|---------|---------|--------|
| `jspdf` | ^2.5 | `import jsPDF from "jspdf"` |
| `jspdf-autotable` | ^3.8 | `import autoTable from "jspdf-autotable"` |

Both are dynamically imported at export time to avoid bloating the main bundle.

---

## Testing Checklist

- [ ] PDF generates without errors for portfolios with 1, 3, and 10+ properties
- [ ] All 7+ pages render with correct content and branded styling
- [ ] Tables auto-paginate when rows exceed page height
- [ ] Charts render with correct data series and legends
- [ ] Page numbers are correct ("Page 1 of N") across all pages
- [ ] Footers appear on every page with company name
- [ ] Numbers format correctly (currency, percentages, em dashes for zero)
- [ ] File saves with correct filename: `{Company} - Consolidated Portfolio Report.pdf`
- [ ] Works in both portrait and landscape orientations where applicable
- [ ] Cover page shows correct property count, room count, and projection period

---

## Future Enhancements

- **Company logo on cover page** — Fetch from `/api/logos/active` and embed as PNG
- **Table of Contents with clickable links** — jsPDF supports internal link annotations
- **Per-property appendix pages** — Individual property income statements after the consolidated sections
- **Waterfall chart** — Revenue-to-ANOI waterfall visualization (currently only in UI, not PDF)
- **Sensitivity analysis page** — Tornado chart and scenario comparison tables
- **Digital signature / watermark** — "DRAFT" watermark option for internal reviews
