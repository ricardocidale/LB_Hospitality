# Comprehensive Dashboard Exports — Skill

## Purpose

When a user exports from **any dashboard tab**, every format produces a **comprehensive, all-tabs report** — not just the tab they're viewing. PDF and PPTX include an enterprise cover page; CSV, Excel, and PNG do not.

---

## Core Principle

**One click → complete investor report.** Regardless of which dashboard tab (Overview, Income Statement, Cash Flow, Balance Sheet, or Investment Analysis) the user is on, the export contains all five financial sections combined into one document/file.

---

## Export Formats

| Format | Cover Page | File | Trigger |
|--------|-----------|------|---------|
| **PDF** | Yes — `drawCoverPage()` | `dashboardExports.ts` → `exportDashboardComprehensivePDF()` | `pdfAction()` on any tab |
| **PPTX** | Yes — `addTitleSlide()` | `pptxExport.ts` → `exportPortfolioPPTX()` | `pptxAction()` on any tab |
| **Excel** | No | `dashboardExports.ts` → `exportPortfolioExcel()` | `excelAction()` on any tab |
| **CSV** | No | `dashboardExports.ts` → `exportPortfolioCSV()` | `csvAction()` on any tab |
| **PNG** | No | `dashboardExports.ts` → `exportTablePNG()` | `pngAction()` on any tab |

---

## Sections Included (All Formats)

Every comprehensive export contains these sections in order:

1. **Executive Summary / Dashboard KPIs** — IRR, Equity Multiple, Cash-on-Cash, Total Equity, Exit Value, Properties/Rooms, Projection Totals
2. **Consolidated Income Statement (USALI)** — Revenue, departmental expenses, undistributed expenses, NOI, ANOI
3. **Cash Flow Statement** — CFO, CFI, CFF, Net Change in Cash
4. **Balance Sheet** — Assets, Liabilities, Equity with ratios
5. **Investment Analysis** — BTCF, ATCF, IRR, Equity Multiple, Cash-on-Cash detail

PDF additionally includes a **Performance Charts** page (Revenue, OpEx, ANOI trend lines).

---

## Data Generators

| Generator | Statement | File |
|-----------|-----------|------|
| `generatePortfolioIncomeData()` | Income Statement | `dashboardExports.ts` |
| `generatePortfolioCashFlowData()` | Cash Flow | `dashboardExports.ts` |
| `generatePortfolioBalanceSheetData()` | Balance Sheet | `dashboardExports.ts` |
| `generatePortfolioInvestmentData()` | Investment Analysis | `dashboardExports.ts` |

---

## Cover Page Design (PDF & PPTX Only)

Both formats share identical enterprise design language:

- Full-bleed navy (`#1A2332`) background with subtle grid overlay
- Sage (`#9FBCA4`) top and bottom border bars
- Sage vertical accent bar beside company name
- Company name in large white text, bold
- White horizontal divider rule below company name
- Report title in sage green
- Projection subtitle in muted sage
- **Metadata card** (navy-blue rounded rectangle with sage border):
  - REPORT type, DATE, CLASSIFICATION (CONFIDENTIAL)
- Confidential disclaimer in italic muted text at bottom
- Footer/page-numbering skipped on cover page

### PDF Implementation

- `drawCoverPage(doc, companyName, title, subtitle, modelStartDate?)` in `pdfHelpers.ts`
- `addFooters()` accepts `skipPages?: Set<number>` to exclude cover page

### PPTX Implementation

- `addTitleSlide(ctx, title, subtitle, sourceTag)` in `pptxExport.ts`
- Grid overlay via thin rectangles at 0.5" intervals
- Metadata card via `roundRect` shape with sage border
- `addAllFooters(ctx, skipFirst=true)` skips slide 1

---

## PDF-Specific Details

**File:** `client/src/components/dashboard/dashboardExports.ts`
**Function:** `exportDashboardComprehensivePDF(params)`

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

### Page Inventory

1. **Cover Page** — via `drawCoverPage()`
2. **Table of Contents** — numbered section list with page refs
3. **Executive Summary** — via `drawDashboardSummaryPage()`
4. **Income Statement** — branded autoTable, multi-page
5. **Cash Flow Statement** — CFO/CFI/CFF table
6. **Balance Sheet** — Assets/Liabilities/Equity table
7. **Investment Analysis** — BTCF/ATCF/IRR table
8. **Performance Charts** — via `drawLineChart()` from `pdfChartDrawer.ts`

### Design Standards

**Typography:**
- Titles: Helvetica Bold, 18–20pt, dark (`#3D3D3D`)
- Subtitles: Helvetica Normal, 10pt, gray (`#666666`)
- Table headers: Helvetica Bold, 7–8pt, white on sage green
- Table body: Helvetica Normal, 6–7.5pt
- Numerics: Courier, right-aligned
- Footers: Helvetica Normal, 7pt, light gray (`#999999`)

**Layout:**
- Margins: 14mm all sides
- Branded header: navy bar (28mm) + sage 2mm accent — `drawBrandedHeader()`
- Page footers: "[Company] — Confidential" left, "Page X of Y" right
- Landscape A4 for 10+ year projections
- Table frame: 0.6pt sage green outer border

---

## PPTX-Specific Details

**File:** `client/src/lib/exports/pptxExport.ts`
**Function:** `exportPortfolioPPTX(data, companyName?)`

### Slide Inventory

1. **Title Slide** — enterprise cover via `addTitleSlide()`
2. **Portfolio KPIs** — metrics slide with key values
3. **Income Statement** — financial data table slide
4. **Cash Flow Statement** — financial data table slide
5. **Balance Sheet** — financial data table slide
6. **Investment Analysis** — financial data table slide

### Design Standards

- Slide size: 13.33" × 7.5" (widescreen 16:9)
- Navy background on title slide, white on content slides
- Sage green section header bars on content slides
- `addAllFooters()` adds "[Company] — Confidential" + page numbers (skips title slide)

---

## Color Palette (Shared)

| Color | Hex | Usage |
|-------|-----|-------|
| Navy | `#1A2332` | Cover page, branded headers |
| Sage Green | `#9FBCA4` | Table headers, accent bars, dividers |
| Dark Green | `#257D41` | Section titles, positive values |
| Dark Text | `#3D3D3D` | Body text |
| Gray | `#666666` | Labels, subtitles |
| Light Gray | `#999999` | Footer text |
| Section BG | `#EFF5F0` | Section header row fill |
| Alt Row | `#F8FAF9` | Alternating row tint |

---

## Number Formatting (All Formats)

- Currency: `$1,234,567` or `($1,234,567)` for negatives
- Compact: `$1.2M`, `$450K` for KPI cards
- Percentages: `12.5%`
- Zero/empty: `—` (em dash)
- Negatives in parentheses, never minus sign

---

## Trigger Points

All comprehensive exports are triggered from:

1. **Dashboard ExportMenu** — Any export action on any dashboard tab
2. **Dashboard toolbar** — Dedicated export buttons in `Dashboard.tsx`
3. **Premium Export dialog** — PDF format with "Full Report" scope (PDF only)

### Wiring Pattern (Dashboard.tsx)

```tsx
// PDF — comprehensive
exportDashboardComprehensivePDF({ financials, properties, projectionYears, getFiscalYear, companyName, incomeRows, modelStartDate });

// PPTX — comprehensive
exportPortfolioPPTX({ projectionYears, getFiscalYear, ...metrics, incomeData, cashFlowData, balanceSheetData, investmentData });

// Excel — comprehensive (multi-sheet workbook)
exportPortfolioExcel(buildAllPortfolioStatements(...), companyName);

// CSV — tab-specific data
exportPortfolioCSV(years, rows, filename);

// PNG — screenshot of tab content
exportTablePNG({ element: ref.current, filename });
```

---

## Shared Utilities

| Utility | File | Purpose |
|---------|------|---------|
| `drawCoverPage()` | `pdfHelpers.ts` | Enterprise navy cover page (PDF) |
| `addTitleSlide()` | `pptxExport.ts` | Enterprise navy title slide (PPTX) |
| `drawBrandedHeader()` | `pdfHelpers.ts` | Navy header bar with sage accent (PDF) |
| `drawTitle()` | `pdfHelpers.ts` | Section titles (PDF) |
| `drawSubtitle()` | `pdfHelpers.ts` | Subtitle text (PDF) |
| `drawSubtitleRow()` | `pdfHelpers.ts` | Left subtitle + right tag (PDF) |
| `drawDashboardSummaryPage()` | `pdfHelpers.ts` | KPI grid + property table (PDF) |
| `buildFinancialTableConfig()` | `pdfHelpers.ts` | Branded autoTable config (PDF) |
| `addFooters()` | `pdfHelpers.ts` | Confidential footer (PDF) |
| `addAllFooters()` | `pptxExport.ts` | Confidential footer (PPTX) |
| `drawLineChart()` | `pdfChartDrawer.ts` | Multi-series line chart (PDF) |
| `BRAND` | `exportStyles.ts` | All color constants |
| `classifyRow()` | `exportStyles.ts` | Row type detection |
| `formatFull()` | `exportStyles.ts` | Currency formatting |

---

## Dependencies

| Package | Format | Import |
|---------|--------|--------|
| `jspdf` | PDF | `import jsPDF from "jspdf"` |
| `jspdf-autotable` | PDF | `import autoTable from "jspdf-autotable"` |
| `pptxgenjs` | PPTX | `import PptxGenJS from "pptxgenjs"` |
| `xlsx` | Excel | `import * as XLSX from "xlsx"` |
| `html-to-image` | PNG | `import { toPng } from "html-to-image"` |

All are dynamically imported at export time to avoid bloating the main bundle.

---

## Testing Checklist

- [ ] All formats generate without errors for portfolios with 1, 3, and 10+ properties
- [ ] PDF and PPTX include enterprise cover page; CSV, Excel, PNG do not
- [ ] All five financial sections appear in every export
- [ ] PDF tables auto-paginate when rows exceed page height
- [ ] PDF charts render with correct data series and legends
- [ ] Page/slide numbers are correct across all pages (cover excluded)
- [ ] Numbers format correctly (currency, percentages, em dashes for zero)
- [ ] Footers appear on every page/slide (except cover) with company name
- [ ] Excel produces multi-sheet workbook (one sheet per statement)
- [ ] Export works from every dashboard tab (not just Overview)

---

## Future Enhancements

- **Company logo on cover page** — Fetch from `/api/logos/active` and embed as PNG (PDF) or image shape (PPTX)
- **Table of Contents with clickable links** — jsPDF internal link annotations
- **Per-property appendix pages** — Individual property statements after consolidated sections
- **Waterfall chart** — Revenue-to-ANOI waterfall (PDF)
- **Sensitivity analysis page** — Tornado chart and scenario comparison
- **Digital signature / watermark** — "DRAFT" watermark option for internal reviews
