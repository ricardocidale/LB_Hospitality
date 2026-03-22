---
name: Export System
description: Premium multi-format export system using server-side Puppeteer (PDF/PNG) and AI-powered generators (PPTX/XLSX/DOCX). Single ExportMenu per page, statement→chart interleaving, theme-aware, formula filtering.
---

# Export System

## Architecture

Two pipelines, unified by a single `ExportMenu` per page:

```
ExportMenu (dropdown) → ExportDialog (options + premium toggle)
  ├─ Premium ON → POST /api/exports/premium → Server pipeline
  │    PDF:  HTML template → Puppeteer → Buffer (no AI)
  │    PPTX: Gemini AI → JSON → pptxgenjs → Buffer
  │    XLSX: Gemini AI → JSON → xlsx → Buffer
  │    DOCX: Gemini AI → JSON → docx → Buffer
  └─ Premium OFF → Client-side fallback (jsPDF, xlsx, pptxgenjs)

CSV: Always client-side (no dialog needed)
PNG: Always client-side (dom-to-image capture)
```

## Quick Start

```tsx
import { ExportMenu, pdfAction, excelAction, csvAction, pptxAction, docxAction, chartAction, pngAction } from "@/components/ui/export-toolbar";

<ExportMenu
  actions={[
    pdfAction(() => { setExportType("pdf"); setExportDialogOpen(true); }),
    excelAction(() => { setExportType("xlsx"); setExportDialogOpen(true); }),
    pptxAction(() => { setExportType("pptx"); setExportDialogOpen(true); }),
    docxAction(() => { setExportType("docx"); setExportDialogOpen(true); }),
    csvAction(handleCSV),
    chartAction(handleChartPNG),
    pngAction(handleTablePNG),
  ]}
/>
```

**Placement**: One ExportMenu per page in `CurrentThemeTab` `rightContent` slot.

## ExportDialog Props

```typescript
interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (orientation, version, filename?) => void;  // non-premium fallback
  title: string;
  premiumFormat?: "pdf" | "xlsx" | "pptx" | "docx";
  showVersionOption?: boolean;
  showCoverPageOption?: boolean;           // Dashboard only
  getPremiumExportData?: (version, includeCoverPage) => PremiumExportPayload | null;
  premiumExportData?: PremiumExportPayload | null;  // legacy static prop
}
```

## Report Structure

See [premium-export-spec.md](./premium-export-spec.md) for full SDD.

Each export produces statements interleaved with charts:
1. Cover Page (optional, Dashboard only)
2. Overview KPI cards (if cover on)
3. Income Statement → Income charts
4. Cash Flow → Cash Flow charts
5. Balance Sheet → Balance Sheet charts
6. Investment Analysis → Investment charts (not Company)

## Key Rules

1. **Full-scope**: Export from ANY tab exports ALL statements — never just the active tab
2. **Statement→Chart**: Each table is followed by a chart page
3. **Formula filtering**: Rows with `isItalic=true` are NEVER exported
4. **Short/Extended**: Short = header/total rows only; Extended = all line items
5. **Theme colors**: Passed via `themeColors` in payload, resolved by `resolveThemeColors()`
6. **File save**: `saveFile()` tries native `showSaveFilePicker`, falls back to download

## Row-Builder Helpers

**File**: `client/src/lib/exports/row-builders.ts`

Type-safe helpers for constructing export rows — use these instead of raw object literals:

```typescript
import { headerRow, lineItem, subtotalRow, spacerRow, formulaRow, yearValues, consolidate } from "@/lib/exports";

headerRow("REVENUE", values)                        // Section header (isHeader: true)
lineItem("Room Revenue", values, { indent: 1 })     // Indented line item
subtotalRow("Gross Operating Profit", values)        // Bold subtotal (isHeader + isBold)
spacerRow(yearCount)                                 // Empty separator row
formulaRow("= Revenue − Expenses", values)           // Italic formula row
yearValues(years, cache, item => item.revenueTotal)  // Extract values from yearly cache
consolidate(years, allProps, item => item.cfo)       // Sum across properties per year
```

## Export Audit

Run `npx tsx script/export-audit.ts` to validate the export system:
- Checks all core files exist
- Verifies data generators are present and wired
- Confirms all pages have all format exports wired
- Validates brand palette is centralized
- Detects stray/orphan directories

## Format Matrix

| Format | AI? | Library | Orientation | Content |
|--------|-----|---------|-------------|---------|
| PDF | No | Puppeteer | Both | Full report with charts |
| PPTX | Yes | pptxgenjs | Landscape | 16:9 slides |
| Excel | Yes | xlsx | N/A | One worksheet per statement |
| DOCX | Yes | docx | Portrait | Tables/charts as images |
| CSV | No | — | N/A | Tables only, client-side |
| PNG | No | dom-to-image | N/A | DOM capture, client-side |

## Data Generators

| Function | File | What |
|----------|------|------|
| `generatePortfolioIncomeData` | `dashboardExports.ts` | Consolidated income |
| `generatePortfolioCashFlowData` | `dashboardExports.ts` | CFO/CFI/CFF |
| `generatePortfolioBalanceSheetData` | `dashboardExports.ts` | Assets/Liabilities/Equity |
| `generatePortfolioInvestmentData` | `dashboardExports.ts` | IRR/EM/CoC + breakdowns |
| `generateCompanyIncomeData` | `company-data.ts` | Management co income |
| `generateCompanyCashFlowData` | `company-data.ts` | Management co cash flow |
| `generateCompanyBalanceData` | `company-data.ts` | Management co balance sheet |

All accept `summaryOnly` parameter for short/extended.

## Key Files

| File | Purpose |
|------|---------|
| `client/src/components/ExportDialog.tsx` | Export dialog UI, premium toggle |
| `client/src/components/ui/export-toolbar.tsx` | ExportMenu dropdown + action helpers |
| `client/src/lib/exports/saveFile.ts` | Native file picker + download fallback |
| `server/routes/premium-exports.ts` | Server export pipeline, all format generators |
| `server/routes/pdf-html-templates.ts` | HTML/CSS templates, theme resolution |
| `server/browser-renderer.ts` | Puppeteer abstraction |

## Sub-Skills

| Skill | What |
|-------|------|
| [premium-export-spec.md](./premium-export-spec.md) | Full SDD: sections, themes, format rules |
| [pdf-rendering.md](./pdf-rendering.md) | Puppeteer HTML→PDF pipeline |
| [excel-export.md](./excel-export.md) | Client-side xlsx generation |
| [pptx-export.md](./pptx-export.md) | Client-side pptxgenjs generation |
| [csv-export.md](./csv-export.md) | CSV download utility |
| [png-export.md](./png-export.md) | DOM capture utility |
