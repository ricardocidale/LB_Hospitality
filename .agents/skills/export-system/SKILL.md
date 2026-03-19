Shared formatting, styling, and generation patterns for all document exports (PDF, PPTX, Excel, CSV, PNG) used across the hospitality business portal. Covers brand palette, row data model, number formatting, PDF/PPTX/Excel/CSV/PNG helpers, and dashboard export orchestrators. Use this skill when working on any document export feature.

## Three Cardinal Export Rules

1. **Full-scope export**: Clicking Export from ANY tab exports ALL financial statements and analysis for the entity — never just the current tab. Applies to both premium and non-premium exports equally.
2. **Dual save destination**: Both premium and non-premium exports offer Local Drive and Google Drive as save targets.
3. **File naming at save step**: The user renames the file when selecting the save folder/location — not in the export dialog. The export dialog does NOT include a filename input field.

## Quick Start

```tsx
import { ExportMenu, pdfAction, excelAction, csvAction, pptxAction, chartAction, pngAction } from "@/components/ui/export-toolbar";

<ExportMenu
  actions={[
    pdfAction(() => handlePdf()),
    excelAction(() => handleExcel()),
    csvAction(() => handleCsv()),
    pptxAction(() => handlePptx()),
    chartAction(() => handleChart()),
    pngAction(() => handleTablePng()),
  ]}
/>
```

**Placement rules:**
- Tabbed pages -> `CurrentThemeTab` `rightContent` slot
- Non-tabbed pages -> `PageHeader` `actions` slot

## ExportMenu Component

**File**: `client/src/components/ui/export-toolbar.tsx`

### Action Helpers

| Helper | Label | Test ID |
|--------|-------|---------|
| `pdfAction(fn)` | PDF | `button-export-pdf` |
| `excelAction(fn)` | Excel | `button-export-excel` |
| `csvAction(fn)` | CSV | `button-export-csv` |
| `pptxAction(fn)` | PowerPoint | `button-export-pptx` |
| `chartAction(fn)` | Chart as Image | `button-export-chart` |
| `pngAction(fn)` | Table as PNG | `button-export-table-png` |

### Variants
- `"glass"` (default) — Dark-themed pages (Dashboard, PropertyDetail, Company)
- `"light"` — Light-themed pages (assumptions, research)

## Export Formats

### 1. Excel (XLSX)
**File:** `client/src/lib/exports/excelExport.ts` | **Library:** `xlsx` (SheetJS)

Formatted workbooks with currency/percentage formatting, bold section headers, configurable column widths.

### 2. PowerPoint (PPTX)
**File:** `client/src/lib/exports/pptxExport.ts` | **Library:** `pptxgenjs`

Branded presentations with HBG colors. Three scopes: `exportPortfolioPPTX`, `exportPropertyPPTX`, `exportCompanyPPTX`. Auto-paginates when years > 5.

### 3. PDF (Charts + Tables)
**File:** `client/src/lib/exports/pdfChartDrawer.ts` | **Library:** `jspdf` + `jspdf-autotable`

Renders line charts directly into jsPDF with colored series and data points.

### 4. PNG (DOM Capture)
**File:** `client/src/lib/exports/pngExport.ts` | **Library:** `dom-to-image-more`

Captures table or chart DOM elements at 2x resolution. Auto-collapses accordion rows.

### 5. CSV
**File:** `client/src/lib/exports/csvExport.ts`

Lightweight `downloadCSV(content, filename)` Blob-based download.

## Branding Constants

| Token | Hex | Usage |
|-------|-----|-------|
| Sage Green | `#9FBCA4` | Divider lines, card borders, PPTX header backgrounds |
| Dark Green | `#257D41` | Metric values, section titles |
| Dark Text | `#3D3D3D` | Table body text |
| Warm Off-White | `#FFF9F5` | Title slide text, light backgrounds |
| Dark Navy | `#1a2a3a` | PPTX title slide background |

## Portfolio Data Generators

**File:** `client/src/components/dashboard/dashboardExports.ts`

| Function | Returns |
|----------|---------|
| `generatePortfolioIncomeData` | Revenue, expenses, GOP, fees, NOI, Net Income |
| `generatePortfolioCashFlowData` | CFO, CFI, CFF, Net Change in Cash |
| `generatePortfolioInvestmentData` | Equity, exit value, IRR, multiple |

Portfolio wrappers: `exportPortfolioExcel`, `exportPortfolioCSV`, `exportPortfolioPDF`

## Page Coverage Matrix

| Page | PDF | Excel | CSV | PPTX | Chart PNG | Table PNG |
|------|-----|-------|-----|------|-----------|-----------|
| Dashboard | Per-tab | Multi-sheet | Per-tab | Portfolio slides | Tab capture | Tab capture |
| PropertyDetail | Income + CF | Per-statement | Cash Flow | Property slides | Chart | Table |
| Company | Per-statement | Per-statement | Per-statement | Company slides | Chart | Table |
| Sensitivity | Tornado + table | Scenario data | Scenario data | Scenario slides | — | — |

## Row-Builder Helpers

**File**: `client/src/lib/exports/row-builders.ts` (re-exported from `@/lib/exports`)

Use these type-safe helpers instead of raw `{ category, values, ... }` object literals:

| Helper | Creates |
|--------|---------|
| `headerRow(label, values)` | Section header with `isHeader: true` |
| `lineItem(label, values, { indent, format })` | Indented line item |
| `subtotalRow(label, values)` | Bold subtotal row |
| `spacerRow(yearCount)` | Empty separator |
| `formulaRow(text, values)` | Italic formula/note row |
| `yearValues(years, cache, accessor)` | Extract values from yearly cache array |
| `consolidate(years, allProps, accessor)` | Sum across all properties per year |
| `toExportShape(data)` | Convert `ExportData` to PPTX-compatible shape |

## Wiring Exports into a New Page

### Step 1 — Generate structured data using row-builder helpers
```ts
import { headerRow, lineItem, subtotalRow, yearValues, type ExportData } from "@/lib/exports";

function generateData(cache, years): ExportData {
  return {
    years,
    rows: [
      headerRow("REVENUE", yearValues(years, cache, c => c.revenueTotal)),
      lineItem("Room Revenue", yearValues(years, cache, c => c.revenueRooms), { indent: 1 }),
      subtotalRow("Total Revenue", yearValues(years, cache, c => c.revenueTotal)),
    ],
  };
}
```

### Step 2 — Create format handlers (handleExcel, handlePptx, handleCsv, handlePdf, handleTablePng, handleChartPng)

### Step 3 — Wire into ExportMenu via action helpers in `CurrentThemeTab` `rightContent` or `PageHeader` `actions`

### Step 4 — Add ExportDialog for orientation-dependent formats (PDF, chart)

## Export Audit Script

Run `npx tsx script/export-audit.ts` to validate the full export wiring:
- All core export files exist
- All data generators present and referenced
- All pages × formats are wired
- Brand palette centralized in `exportStyles.ts`
- No stray/orphan modules

## Dependencies

| Package | Purpose |
|---------|---------|
| `xlsx` | Excel workbook generation |
| `pptxgenjs` | PowerPoint slide generation |
| `jspdf` + `jspdf-autotable` | PDF document + table rendering |
| `dom-to-image-more` | DOM-to-PNG capture |
