# Export System Skill

Shared formatting, styling, and generation patterns for all document exports
(PDF, PPTX, Excel, CSV, PNG) used across the hospitality business portal.

## Architecture

```
client/src/lib/exports/
├── exportStyles.ts      ← Brand palette, row classification, number formatting, caps normalization
├── pdfHelpers.ts        ← jsPDF layout, typography, table config, footers
├── pptxExport.ts        ← pptxgenjs slide generation (portfolio/property/company)
├── pdfChartDrawer.ts    ← Manual line-chart rendering in jsPDF
├── researchPdfExport.ts ← AI research PDF (property/company/global)
├── csvExport.ts         ← CSV download helper
├── pngExport.ts         ← DOM-to-PNG screenshot capture (tables + charts)
├── checkerManualExport.ts ← Checker manual PDF
├── excelExport.ts       ← Re-exports from excel/ (barrel)
├── excel/               ← Modular Excel sheet builders
│   ├── helpers.ts       ← downloadWorkbook, setColumnWidths, applyCurrencyFormat, applyHeaderStyle, aggregateByYear
│   ├── types.ts         ← YearlyAggregation interface
│   ├── property-sheets.ts ← buildPropertyISRows, exportPropertyIncomeStatement, exportPropertyCashFlow, exportFullPropertyWorkbook
│   ├── portfolio-sheet.ts ← exportPropertyBalanceSheet, exportCompanyIncomeStatement, exportCompanyCashFlow, exportCompanyBalanceSheet
│   └── index.ts         ← Barrel re-exports
└── index.ts             ← Top-level barrel re-exports for @/lib/exports

Consumers:
├── client/src/components/dashboard/dashboardExports.ts  ← Portfolio PDF/CSV/PPTX data generators + export orchestrators
└── client/src/lib/exports/companyExports.ts             ← Management company PDF/CSV/PPTX/PNG export wrappers
```

## Brand Palette (exportStyles.ts)

| Token          | Hex      | RGB             | Usage                              |
|----------------|----------|-----------------|------------------------------------|
| SAGE_GREEN     | #9FBCA4  | 159, 188, 164   | Accent bars, table headers, frame  |
| DARK_GREEN     | #257D41  | 37, 125, 65     | Titles, positive KPIs             |
| NAVY           | #1A2332  | 26, 35, 50      | Title slide bg, PDF header bar     |
| DARK_TEXT       | #3D3D3D  | 61, 61, 61      | Table body text                    |
| GRAY           | #666666  | 102, 102, 102   | Labels, subtitles, formula text    |
| LIGHT_GRAY     | #999999  | 153, 153, 153   | Footer text                        |
| WHITE          | #FFFFFF  | 255, 255, 255   | Backgrounds, inverted text         |
| SECTION_BG     | #EFF5F0  | 239, 245, 240   | Section header row fill            |
| ALT_ROW        | #F8FAF9  | 248, 250, 249   | Alternating row tint               |
| WARM_BG        | #FFF9F5  | 255, 249, 245   | Warm neutral background            |
| CARD_BG        | #F5F9F6  | 245, 249, 246   | PPTX metric card fill              |
| BORDER_LIGHT   | #D5D8DA  | —               | Light internal cell borders (PPTX) |
| BORDER_SECTION | #9FBCA4  | —               | Thick section divider lines        |

All colors are accessible via `BRAND.SAGE_HEX` (for pptxgenjs) or `BRAND.SAGE_RGB` (for jsPDF).
PPTX hex values omit the `#` prefix (pptxgenjs convention).

## Row Data Model (ExportRowMeta)

Every financial table across all export formats uses this interface:

```typescript
interface ExportRowMeta {
  category: string;        // Row label (e.g., "Room Revenue", "TOTAL ASSETS")
  values: (string | number)[];  // One value per year column
  indent?: number;         // Indent level (0 = flush, 1 = 2 spaces, 2 = 4 spaces)
  isBold?: boolean;        // Force bold (subtotals, totals)
  isHeader?: boolean;      // Section header (bold + section-bg fill)
  isItalic?: boolean;      // Formula/note rows (italic + muted color)
}
```

### Row Classification — `classifyRow(row)`

Automatically detects row type from the `ExportRowMeta`:

- **Section header**: ALL CAPS category, length > 2, not indented → bold + section-bg fill
- **Subtotal/total**: category contains "total", "gross operating", "adjusted",
  "net operating", "gaap net", "free cash flow", "closing cash", "net change",
  or `isBold`/`isHeader` flag is set → bold text
- **Formula/note**: category starts with "Formula:" or `isItalic` set → italic + gray text

This classification is used identically in PDF and PPTX table rendering.

### Label Normalization — `normalizeCaps(text)`

Converts ALL-CAPS category labels to Title Case at render time for readability.
Data generators (e.g., `dashboardExports.ts`) continue to emit ALL-CAPS section headers
like `"ASSETS"` or `"TOTAL LIABILITIES & EQUITY"`, and `normalizeCaps()` converts them
to `"Assets"` / `"Total Liabilities & Equity"` when building the PDF body or PPTX cells.

**Preserved abbreviations** (never lowercased):
GOP, NOI, AGOP, ANOI, GAAP, FFE, FF&E, DSCR, IRR, CFO, CFI, CFF, IT, F&B,
PP&E, ADR, REVPAR, LTV, EBITDA, WACC, FCFE, FCFF, FY, YOY

Non-uppercase input is returned unchanged. Short words (≤2 chars) are lowercased.

### Indent Helper — `indentLabel(category, indent?)`

Prepends `indent × 2` spaces to the category string for hierarchical display.

### Visual Readability

- **Alternating row tint**: data rows (not section headers, not subtotals) alternate
  between white and `ALT_ROW` (#F8FAF9). Both PDF and PPTX track a separate `dataRowIdx`
  counter so section headers / subtotals don't disrupt the stripe rhythm.
- **Section divider lines**: thicker top border on section header rows
  (1.2pt sage-green in PPTX, 0.6pt in PDF).
- **Subtotal separator**: medium top border (0.8pt PPTX, 0.5pt PDF) in neutral gray.
- **Table frame**: 1.5pt sage-green outer border on all four sides (PPTX);
  0.6pt `tableLineWidth` + `tableLineColor` sage (PDF via jspdf-autotable).
- **Header row**: sage-green fill with white bold text in both formats.

## Number Formatting

### Short format (slides, summaries) — `formatShort(v)`
- >= 1M → `$1.2M`
- >= 1K → `$450K`
- < 1K  → `$800`
- zero  → `—` (em dash)
- negative → `($1.2M)` (accounting parens)

### Full format (PDF tables) — `formatFull(v)`
- Positive → `$1,234,567`
- Negative → `($1,234,567)`
- Zero     → `—`

### Percentage — `formatPct(v, decimals)`
- `12.5%`

### Footer text — `footerText(companyName)`
- `CompanyName — Confidential`

## PDF Export (pdfHelpers.ts)

Library: **jsPDF** + **jspdf-autotable**

### Page Setup
- Format: A4 (297 × 210mm landscape, or 210 × 297mm portrait)
- Unit: millimeters
- Financials use landscape; research reports use portrait

### Layout Functions

| Function | Purpose | Parameters |
|----------|---------|------------|
| `drawBrandedHeader(doc, pageW, height?)` | Navy bar with sage stripe at page top | height defaults to 28mm |
| `drawTitle(doc, text, x, y, opts?)` | Bold title with customizable font/color | `{fontSize?, color?, bold?}` |
| `drawSubtitle(doc, text, x, y, opts?)` | Gray secondary text | `{fontSize?, color?}` |
| `drawSubtitleRow(doc, leftText, rightText, x, y, pageW, opts?)` | Left subtitle + right-aligned entity tag on same line | `{fontSize?, color?, rightColor?}` |
| `drawDashboardSummaryPage(doc, pageW, entityTag, companyName, metrics, propertyTable?)` | KPI card grid + property composition table — used as page 2 of comprehensive PDF | metrics: `DashboardSummaryMetric[]` |
| `drawSectionHeader(doc, title, y, color?)` | Colored heading + underline, auto-paginates | Returns new y position |
| `drawParagraph(doc, text, y, pageW, opts?)` | Word-wrapped body text, auto-paginates | `{fontSize?, indent?, italic?}` |
| `drawKeyValue(doc, label, value, y, x?)` | Bold label + normal value pair | Returns new y position |

### Table Rendering — `buildFinancialTableConfig(years, rows, orientation, startY)`

Returns a complete jspdf-autotable options object. Features:
- Sage-green header row with white bold text
- `normalizeCaps()` applied to all category labels
- Indent via `indentLabel()`
- Bold/italic/fill applied in `didParseCell` using `classifyRow()`
- Monospace font (Courier) for numeric columns
- Alternating row tint via IIFE-wrapped closure tracking `dataRowIdx`
- Thicker top borders on section headers (0.6pt sage) and subtotals (0.5pt gray)
- Outer table frame via `tableLineWidth: 0.6` + `tableLineColor: SAGE_RGB`
- Dynamic font size: 7.5pt for ≤6 columns, 7pt for ≤10, 6pt for 11+
- Dynamic column widths: label column 50mm (landscape) / 40mm (portrait)

### Footers — `addFooters(doc, companyName)` — MUST be called LAST

Iterates all pages after all content has been added:
- Thin sage-green line at `pageH - 10mm`
- Left: `CompanyName — Confidential` (Helvetica 7pt, light gray)
- Right: `Page X of Y` (Helvetica 7pt, light gray)

## PPTX Export (pptxExport.ts)

Library: **pptxgenjs**

### Slide Setup
- Layout: `LAYOUT_WIDE` (16:9, 13.33" × 7.5")
- All presentations are landscape
- Constants: `SLIDE_W = 13.33`, `SLIDE_H = 7.5`, `MARGIN_X = 0.3`

### Internal Functions

| Function | Purpose |
|----------|---------|
| `addAllFooters(ctx)` | Post-process ALL slides to add footer + page number |
| `addTitleSlide(ctx, title, subtitle, sourceTag)` | Dark navy branded title slide with right-aligned entity tag |
| `addMetricsSlide(ctx, title, subtitle, sourceTag, metrics[])` | 3-column KPI card grid with subtitle + entity tag |
| `addFinancialTableSlide(ctx, title, sourceTag, years, rows)` | Financial table with all styling + right-aligned entity tag |

### Footer — `addAllFooters(ctx)` — MUST be called LAST before `writeFile`

Iterates `pres.slides` so auto-paginated table overflow slides also receive footers
and correct page numbers. Never add footers during slide creation.
- Thin sage-green line at y = 7.15"
- Left: `CompanyName — Confidential` (italic, 7pt, light gray)
- Right: `X / Y` page number (7pt, light gray)
- pptxgenjs `{ field: "slidenum" }` is unreliable and was abandoned

### Title Slide
- Dark navy background (#1A2332)
- Sage-green accent stripe at top (0.05" tall)
- Company name (28pt, sage green, bold)
- Report title (22pt, white)
- Subtitle (14pt, gray #AAAAAA) — left-aligned
- Entity tag (11pt, sage green, bold) — right-aligned on same line as subtitle
- Generated date (10pt, gray #888888)

### Metrics Slide
- Title (20pt, dark green, bold) + subtitle (9pt, gray) + entity tag (9pt, dark green, bold, right-aligned)
- 3-column grid of rounded-corner cards
- Each card: large value (18pt, dark green, bold) + small label (9pt, gray)
- Card fill: #F5F9F6 with 1pt sage-green border, 0.1" corner radius

### Financial Table Slides
- Dynamic font size: `pptxFontSize(yearCount)` — 10pt ≤5 cols, 9pt ≤7, 8pt ≤10, 7pt 11+
- Dynamic column widths: `pptxColumnWidths(yearCount)` — label col 2.4"–3.8" auto-sized
- Header row: sage-green fill, white bold text, 1.5pt sage border
- Section headers: bold, +0.5pt larger font, section-bg fill (#EFF5F0), 1.2pt sage top border
- Subtotals: bold, white background, 0.8pt gray top border
- Formula rows: italic, gray text
- Data rows: alternating white / #F8FAF9 via `dataRowIdx` counter
- ALL CAPS labels converted to Title Case via `normalizeCaps()` at render
- Table frame: 1.5pt sage-green outer border (left, right, top of header, bottom of last row)
- Internal cell borders: 0.3pt #E8E8E8
- Row height: 0.22"
- `autoPage: true` with `autoPageRepeatHeader: true` for overflow
- `newSlideStartY: 0.4"` for overflow slides

### Export Functions

| Function | Description | Slides |
|----------|-------------|--------|
| `exportPortfolioPPTX(data, companyName?)` | Consolidated multi-property report | Title → Metrics → 4 tables (Income, Cash Flow, Balance, Investment) |
| `exportPropertyPPTX(data, companyName?)` | Single-property report | Title → 3 tables (Income, Cash Flow, Balance) |
| `exportCompanyPPTX(data, companyName?)` | Management company report | Title → 3 tables (Income, Cash Flow, Balance) |

### TypeScript Interfaces

```typescript
interface PortfolioExportData {
  projectionYears: number;
  getFiscalYear: (i: number) => number;
  totalInitialEquity, totalExitValue, equityMultiple, portfolioIRR,
  cashOnCash, totalProperties, totalRooms: number;
  totalProjectionRevenue, totalProjectionNOI, totalProjectionCashFlow: number;
  incomeData, cashFlowData, balanceSheetData, investmentData: { years: string[]; rows: ExportRowMeta[] };
}

interface PropertyExportData {
  propertyName: string;
  projectionYears: number;
  getFiscalYear: (i: number) => string;
  incomeData, cashFlowData, balanceSheetData: { years: string[]; rows: ExportRowMeta[] };
}

interface CompanyExportData {
  projectionYears: number;
  getFiscalYear: (i: number) => string;
  incomeData, cashFlowData, balanceSheetData: { years: string[]; rows: ExportRowMeta[] };
}
```

## PDF Chart Drawing (pdfChartDrawer.ts)

### `drawLineChart(options)` — Manual line chart in jsPDF

Draws a multi-series line chart at a specified position:
- White background with thin border
- Auto-scaled Y axis with 5 dashed grid lines
- X axis labels from data points
- Colored data lines with dots (0.6pt stroke, 0.9pt dot radius)
- Centered legend at bottom
- Default value formatter: `$X.XM`
- Used by company and research PDF exports for trend visualization

```typescript
interface DrawChartOptions {
  doc: any; x: number; y: number; width: number; height: number;
  title: string;
  series: { name: string; data: { label: string; value: number }[]; color: string }[];
  formatValue?: (value: number) => string;
}
```

## PNG Export (pngExport.ts)

Library: **dom-to-image-more**

| Function | Purpose | Returns |
|----------|---------|---------|
| `exportTablePNG({element, filename, scale?, collapseAccordions?})` | Screenshot table DOM, auto-collapses accordion rows, strips borders | Downloads PNG |
| `exportChartPNG({element, filename, width?, height?, scale?})` | Screenshot chart DOM at retina quality | Downloads PNG |
| `captureChartAsImage(containerRef)` | Capture chart as base64 data URL for embedding | `string | null` (fallback to SVG canvas render) |

Default scale: 2x for retina-quality output.

## CSV Export (csvExport.ts)

### `downloadCSV(content, filename)` → `boolean`

Creates a Blob from a pre-built CSV string, generates a temporary object URL,
and triggers a browser download. The caller builds the CSV content (headers + rows);
this function handles only the download mechanics. Sanitizes filename characters.

## Excel Export (excel/)

Library: **SheetJS (xlsx)**

### Helper Functions (excel/helpers.ts)

| Function | Purpose |
|----------|---------|
| `downloadWorkbook(wb, filename)` | Trigger browser download of xlsx workbook |
| `setColumnWidths(ws, widths[])` | Set column widths in character units |
| `applyCurrencyFormat(ws, rows)` | Apply number formats: `%` for occupancy, `$0.00` for ADR/RevPAR, `$#,##0` for everything else |
| `applyHeaderStyle(ws, rows)` | Bold ALL-CAPS section headers and total rows |
| `aggregateByYear(data, years, startDate, fiscalMonth)` | Roll up monthly data into fiscal-year buckets |

### Export Functions

| Function | Source File | Description |
|----------|-------------|-------------|
| `exportPropertyIncomeStatement` | property-sheets.ts | Single-property income statement xlsx |
| `exportPropertyCashFlow` | property-sheets.ts | Single-property cash flow xlsx |
| `exportFullPropertyWorkbook` | property-sheets.ts | Multi-sheet property workbook (IS + CF + BS + Ops) |
| `exportPropertyBalanceSheet` | portfolio-sheet.ts | Property balance sheet xlsx |
| `exportCompanyIncomeStatement` | portfolio-sheet.ts | Company income statement xlsx |
| `exportCompanyCashFlow` | portfolio-sheet.ts | Company cash flow xlsx |
| `exportCompanyBalanceSheet` | portfolio-sheet.ts | Company balance sheet xlsx |

## Dashboard Export Orchestrators (dashboardExports.ts)

### Data Generator Functions

| Function | Purpose |
|----------|---------|
| `generatePortfolioIncomeData(cache, years, getFY, summaryOnly?)` | USALI waterfall: Revenue → GOP → AGOP → NOI → ANOI → GAAP Net Income |
| `generatePortfolioCashFlowData(cache, cashFlows, years, getFY, summaryOnly?)` | CFO + CFI + CFF → Net Change → Closing Cash |
| `generatePortfolioBalanceSheetData(allFinancials, years, getFY, startDate?, summaryOnly?)` | Assets / Liabilities & Equity with PP&E, depreciation, retained earnings |
| `generatePortfolioInvestmentData(properties, financials, cashFlows, years, getFY)` | Per-property IRR, equity multiple, exit value analysis |
| `toExportData(data)` | Convert internal `ExportData` to PPTX-compatible shape (maps `isHeader` → `isBold`) |

### Comprehensive Dashboard Export

`exportDashboardComprehensivePDF(params)` — generates a single multi-page PDF containing ALL financial content:

1. **Title page** — company name, projection range, property/room counts, table of contents
2. **Dashboard summary page** — KPI metric cards (3-column grid, sectioned: Return Metrics, Investment Summary, Projection Totals) + property composition table (name, market, rooms, status)
3. **Income Statement** — full USALI waterfall table
4. **Cash Flow Statement** — CFO/CFI/CFF with per-property breakdown
5. **Balance Sheet** — assets, liabilities & equity
6. **Investment Analysis** — portfolio-level metrics table
7. **Performance Chart** — revenue, expenses, ANOI trend line chart

This is the primary export triggered from the Overview tab's PDF export button.

Parameters: `ComprehensiveDashboardExportParams`:
```typescript
{
  financials: DashboardFinancials;
  properties: Property[];
  projectionYears: number;
  getFiscalYear: (i: number) => number;
  companyName?: string;
  incomeRows: ExportRow[];
  modelStartDate?: Date;
}
```

### Single-Statement Export Functions

| Function | Formats | Description |
|----------|---------|-------------|
| `exportPortfolioPDF(orientation, years, rows, getYearlyConsolidated, title, companyName)` | PDF | Single-statement portfolio PDF with table + chart page (used by individual tabs) |
| `exportPortfolioCSV(years, rows, filename)` | CSV | Portfolio CSV download |
| `exportPortfolioPPTX(data, companyName)` | PPTX | Re-exported from pptxExport.ts — always includes all 4 statements |

## Company Export Orchestrators (companyExports.ts)

| Function | Format | Description |
|----------|--------|-------------|
| `exportCompanyPDF(type, data, global, years, chartData, orientation?)` | PDF | Company financial PDF with table + chart |
| `exportCompanyCSV(type, data, companyName?)` | CSV | Company financial CSV |
| `handleExcelExport(tab, financials, years, global, month)` | Excel | Dispatches to correct Excel function by tab |
| `handlePPTXExport(global, years, getFY, income, cashFlow, balance)` | PPTX | Wraps `exportCompanyPPTX` |
| `exportChartPNG(chartRef, orientation?, companyName?)` | PNG | Company chart screenshot |
| `exportTablePNG(tableRef, tab, companyName?)` | PNG | Company table screenshot |

## Adding a New Export Report

1. Define your row data using `ExportRowMeta[]`
2. For **PDF**:
   ```typescript
   import { buildFinancialTableConfig, addFooters, drawTitle, drawSubtitleRow } from "@/lib/exports";
   // Create jsPDF doc, draw title + subtitle row with entity tag ...
   drawTitle(doc, `${companyName} — Income Statement`, 14, 15);
   drawSubtitleRow(doc, `${projectionYears}-Year Projection (...)`, entityTag, 14, 22, pageW);
   const config = buildFinancialTableConfig(years, rows, orientation, startY);
   autoTable(doc, config);   // normalizeCaps + alternating rows + borders all automatic
   addFooters(doc, companyName);  // LAST call before doc.save()
   ```
3. For **PPTX**:
   ```typescript
   // Use existing pattern: create SlideContext, call addTitleSlide(ctx, title, subtitle, sourceTag),
   // addFinancialTableSlide(ctx, title, sourceTag, years, rows), etc.
   // sourceTag identifies the entity: "Consolidated Portfolio — 5 Properties"
   // normalizeCaps + alternating rows + borders are all handled inside addFinancialTableSlide.
   // Call addAllFooters(ctx) LAST before pres.writeFile().
   ```
4. For **Excel**: use helpers from `excel/helpers.ts` (downloadWorkbook, setColumnWidths, etc.)
5. For **CSV**: build content string, call `downloadCSV(content, filename)`
6. For **PNG**: use `exportTablePNG` or `exportChartPNG` from pngExport.ts

## Critical Rules

1. **Footer functions MUST be called LAST** — after all content/pages/slides are generated.
   - PDF: `addFooters(doc, companyName)` iterates `1..totalPages`
   - PPTX: `addAllFooters(ctx)` iterates `pres.slides` (includes auto-paginated overflow)
2. **Never use ALL CAPS** in exported labels — use `normalizeCaps()` at render time.
   Data generators may still emit ALL CAPS for `classifyRow()` detection; the renderers
   handle conversion. Known abbreviations (GOP, NOI, etc.) are preserved.
3. **Alternating row colors** track a `dataRowIdx` counter — section headers and subtotals
   are excluded so they don't disrupt the stripe pattern. Both PDF and PPTX use this approach.
4. **pptxgenjs `{ field: "slidenum" }` is unreliable** — always use the manual
   `addAllFooters()` post-processing approach for page numbers.
5. **`toExportData()`** maps `isHeader → isBold` for PPTX compatibility:
   `isBold: r.isBold ?? r.isHeader` preserves explicit subtotal bold intent.
6. **All formats share one brand palette** — change `BRAND.*` in `exportStyles.ts`
   and it propagates to PDF, PPTX, and Excel automatically.
7. **Entity tags identify the economic entity** — every export page/slide carries a
   right-aligned tag describing whose financials are shown (not the statement type):
   - Portfolio: `Consolidated Portfolio — X Properties`
   - Property: `[Property Name]`
   - Company: `[Company Name] — Management Company`
   The statement type is already in the page/slide title; the entity tag answers "whose."
8. **Dashboard exports are comprehensive** — pressing Export from the Overview tab
   produces a complete multi-page PDF (or PPTX) containing ALL financial statements
   plus a dashboard summary page. Individual statement tabs also produce complete
   PPTX files with all 4 statements populated.

## Files Modified by Export

| Export target    | PDF file                  | PPTX file        | Excel file             |
|------------------|---------------------------|------------------|------------------------|
| Portfolio        | dashboardExports.ts       | pptxExport.ts    | portfolio-sheet.ts     |
| Property         | (PNG/Excel only)          | pptxExport.ts    | property-sheets.ts     |
| Company          | companyExports.ts         | pptxExport.ts    | portfolio-sheet.ts     |
| Research         | researchPdfExport.ts      | —                | —                      |
| Checker Manual   | checkerManualExport.ts    | —                | —                      |

## Barrel Exports (index.ts)

All public functions and types are re-exported from `@/lib/exports`:

```typescript
// Styles & formatting
BRAND, classifyRow, normalizeCaps, formatShort, formatFull, formatPct,
indentLabel, pptxFontSize, pptxColumnWidths
type ExportRowMeta

// PDF helpers
drawBrandedHeader, drawTitle, drawSubtitle, drawSubtitleRow, drawDashboardSummaryPage,
drawSectionHeader, drawParagraph, drawKeyValue, buildFinancialTableConfig, addFooters

// PPTX
exportPortfolioPPTX, exportPropertyPPTX, exportCompanyPPTX
type PortfolioExportData, PropertyExportData, CompanyExportData

// Excel
exportPropertyIncomeStatement, exportPropertyCashFlow,
exportPropertyBalanceSheet, exportCompanyIncomeStatement,
exportCompanyCashFlow, exportCompanyBalanceSheet, exportFullPropertyWorkbook

// PNG
exportTablePNG, exportChartPNG, captureChartAsImage

// Chart
drawLineChart

// CSV
downloadCSV
```
