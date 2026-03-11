# Export System Skill

Shared formatting, styling, and generation patterns for all document exports
(PDF, PPTX, Excel, CSV, PNG) used across the hospitality business portal.

## Architecture

```
client/src/lib/exports/
├── exportStyles.ts      ← Brand palette, row classification, number formatting
├── pdfHelpers.ts        ← jsPDF layout, typography, table config, footers
├── pptxExport.ts        ← pptxgenjs slide generation (portfolio/property/company)
├── excelExport.ts       ← xlsx workbook generation via SheetJS
├── excel/               ← Modular Excel sheet builders
│   ├── helpers.ts
│   ├── property-sheets.ts
│   └── portfolio-sheet.ts
├── pdfChartDrawer.ts    ← Manual line-chart rendering in jsPDF
├── researchPdfExport.ts ← AI research PDF (property/company/global)
├── csvExport.ts         ← CSV download helper
├── pngExport.ts         ← DOM-to-PNG screenshot capture
├── checkerManualExport.ts ← Checker manual PDF
└── index.ts             ← Barrel re-exports
```

## Brand Palette (exportStyles.ts)

| Token          | Hex      | RGB             | Usage                        |
|----------------|----------|-----------------|------------------------------|
| SAGE_GREEN     | #9FBCA4  | 159, 188, 164   | Accent bars, table headers   |
| DARK_GREEN     | #257D41  | 37, 125, 65     | Titles, positive KPIs        |
| NAVY           | #1A2332  | 26, 35, 50      | Title slide bg, PDF header   |
| DARK_TEXT       | #3D3D3D  | 61, 61, 61      | Table body text              |
| GRAY           | #666666  | 102, 102, 102   | Labels, subtitles            |
| LIGHT_GRAY     | #999999  | 153, 153, 153   | Footer text                  |
| WHITE          | #FFFFFF  | 255, 255, 255   | Backgrounds, inverted text   |
| SECTION_BG     | #EFF5F0  | 239, 245, 240   | Section header row fill      |
| WARM_BG        | #FFF9F5  | 255, 249, 245   | Warm neutral background      |
| CARD_BG        | #F5F9F6  | 245, 249, 246   | PPTX metric card fill        |

All colors are accessible via `BRAND.SAGE_HEX` (for PPTX) or `BRAND.SAGE_RGB` (for jsPDF).

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

### Row Classification (classifyRow)

The `classifyRow(row)` function automatically detects row type:

- **Section header**: ALL CAPS category, length > 2 → bold + section background
- **Subtotal/total**: category contains "total", "gross operating", "adjusted",
  "net operating", "gaap net", "free cash flow", "closing cash", "net change",
  or `isBold`/`isHeader` flag set → bold
- **Formula/note**: category starts with "Formula:" or `isItalic` set → italic + gray

This classification is used identically in PDF and PPTX table rendering.

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

## PDF Export Rules (pdfHelpers.ts)

### Page setup
- Format: A4, orientation varies (landscape for financials, portrait for research)
- Unit: millimeters
- Library: jsPDF + jspdf-autotable

### Header functions
- `drawBrandedHeader(doc, pageW)` — navy bar with sage stripe
- `drawTitle(doc, text, x, y, opts?)` — bold title, customizable size/color
- `drawSubtitle(doc, text, x, y)` — gray secondary text
- `drawSectionHeader(doc, title, y, color?)` — colored heading with underline

### Table rendering
- `buildFinancialTableConfig(years, rows, orientation, startY)` returns a
  complete `autoTable` options object with:
  - Sage-green header row
  - Proper indent via `indentLabel()`
  - Bold/italic/fill via `didParseCell` using `classifyRow()`
  - Monospace font (courier) for numeric columns
  - Dynamic font size based on column count
  - Dynamic column widths

### Footers — MUST be called LAST
- `addFooters(doc, companyName)` iterates all pages after all content is added
- Layout: `[CompanyName — Confidential]` left, `[Page X of Y]` right
- Thin sage-green line above footer text
- Font: Helvetica 7pt, light gray color

### Typography
- Body text: Helvetica normal, 9pt
- Section headers: Helvetica bold, 13pt + colored underline
- Key-value pairs: bold label + normal value
- Formula/notes: Helvetica italic, smaller font, gray color

## PPTX Export Rules (pptxExport.ts)

### Slide setup
- Layout: `LAYOUT_WIDE` (16:9, 13.33" × 7.5")
- Library: pptxgenjs
- All presentations are landscape

### Footer (every slide, including auto-paginated overflow)
- Thin sage-green line at y = 7.15" (near bottom)
- Left: `CompanyName — Confidential` (italic, 7pt, light gray)
- Right: page number as `X / Y` (7pt, light gray)
- `addAllFooters(ctx)` is called LAST before `writeFile` — it iterates
  `pres.slides` so auto-paginated table overflow slides also receive footers
  and correct page numbers. Never add footers during slide creation.
  (pptxgenjs `{ field: "slidenum" }` is unreliable and does not render)

### Title slide
- Dark navy background (#1A2332)
- Sage-green accent stripe at top
- Company name (28pt, sage green, bold)
- Report title (22pt, white)
- Subtitle (14pt, gray)
- Generated date (10pt, gray)

### Metrics slide
- 3-column grid of rounded-corner cards
- Each card: large value (18pt, dark green, bold) + small label (9pt, gray)
- Card fill: #F5F9F6 with sage-green border

### Financial table slides
- All year columns ALWAYS fit on one slide (no splitting)
- Dynamic font size: `pptxFontSize(yearCount)` — 8pt for ≤5, 7pt for ≤7, 6pt for ≤10, 5pt for 11+
- Dynamic column widths: `pptxColumnWidths(yearCount)` — label column auto-sizes
- Header row: sage-green fill, bold
- Section headers: bold + section-bg fill (#EFF5F0)
- Subtotals: bold, white background
- Formula rows: italic, gray text
- Values: short format ($1.2M, $450K)
- `autoPage: true` with `autoPageRepeatHeader: true` for overflow

## Adding a New Export Report

1. Define your row data using `ExportRowMeta[]`
2. For PDF:
   ```typescript
   import { buildFinancialTableConfig, addFooters, drawTitle, drawSubtitle } from "@/lib/exports";
   // ... create doc, draw title/subtitle ...
   const config = buildFinancialTableConfig(years, rows, orientation, startY);
   autoTable(doc, config);
   addFooters(doc, companyName);  // LAST call before save
   ```
3. For PPTX:
   ```typescript
   // Use the existing pattern: create SlideContext, call addTitleSlide,
   // addFinancialTableSlide, etc. All internal functions handle footer
   // and formatting automatically.
   ```
4. For Excel: use helpers from `excel/helpers.ts`

## Files Modified by Export

| Export target    | PDF file                  | PPTX file        | Excel file             |
|------------------|---------------------------|------------------|------------------------|
| Portfolio        | dashboardExports.ts       | pptxExport.ts    | portfolio-sheet.ts     |
| Property         | (PNG/Excel only)          | pptxExport.ts    | property-sheets.ts     |
| Company          | companyExports.ts         | pptxExport.ts    | portfolio-sheet.ts     |
| Research         | researchPdfExport.ts      | —                | —                      |
| Checker Manual   | checkerManualExport.ts    | —                | —                      |
