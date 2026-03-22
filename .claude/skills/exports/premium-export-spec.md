# Premium Export Specification (SDD)

## Pipeline

```
Client (data + theme) → POST /api/exports/premium → Server
  PDF:  buildPdfSectionsFromData() → buildPdfHtml() → Puppeteer → Buffer
  PPTX: Gemini AI → JSON → pptxgenjs → Buffer
  XLSX: Gemini AI → JSON → xlsx → Buffer
  DOCX: Gemini AI → JSON → docx → Buffer
  CSV:  Client-side only (no server)
```

## Section Ordering

| # | Section | Dashboard | Property | Company |
|---|---------|-----------|----------|---------|
| 1 | Cover Page | Optional toggle | No | No |
| 2 | Overview (KPI cards) | If cover on | No | No |
| 3 | Income Statement | Yes | Yes | Yes |
| 4 | Income charts | Yes | Yes | Yes |
| 5 | Cash Flow | Yes | Yes | Yes |
| 6 | Cash Flow charts | Yes | Yes | Yes |
| 7 | Balance Sheet | Yes | Yes | Yes |
| 8 | Balance Sheet charts | Yes | Yes | Yes |
| 9 | Investment Analysis | Yes | Yes | No |
| 10 | Investment charts | Yes | Yes | No |

## Short vs Extended

| Statement | Short | Extended |
|-----------|-------|----------|
| Income | Headers + totals only | All line items |
| Cash Flow | CFO/CFI/CFF totals | All items |
| Balance Sheet | Total Assets, Total L+E | All components |
| Investment | Summary metrics | Full breakdowns |

**Formula rows (isItalic=true) NEVER exported.**

## Per-Statement Charts

- **Income**: Revenue, GOP, NOI, ANOI (multi-series line chart, colors: #18181b, #3B82F6, #F59E0B, #6B7280)
- **Cash Flow**: NOI, ANOI, Cash Flow, FCFE (multi-series line chart, colors: #F59E0B, #6B7280, #8B5CF6, #6B7280)
- **Balance Sheet**: Total Assets, Total Liabilities (multi-series line chart, colors: #257D41, #F4795B)
- **Investment**: NOI, ANOI, FCFE (multi-series line chart, colors: #10B981, #257D41, #8B5CF6)

All charts match the UI's FinancialChart component (Recharts LineChart style) with strokeWidth 2.5, white-fill dots, and matching hex colors.

## Theme Color Mapping

Client sends `themeColors: Array<{name, hexCode, rank}>`. Server resolves:

| Rank | Role | CSS Variable | Fallback |
|------|------|-------------|----------|
| 0 (Primary) | navy — headers, cover bg | `${NAVY}` | #1A2332 |
| 1 | sage — accents, bars | `${SAGE}` | #9FBCA4 |
| 2 | darkGreen — titles | `${DK}` | #257D41 |
| 3 | darkText — body | `${TXT}` | #3D3D3D |
| 4 | gray — secondary | `${GR}` | #666666 |

Function: `resolveThemeColors()` in `pdf-html-templates.ts`.

## Format Rules

| Format | Content | AI? | Notes |
|--------|---------|-----|-------|
| PDF | Full report via Puppeteer | No | Statement→chart pages |
| PPTX | 16:9 slides, landscape only | Yes | Elements or page images |
| Excel | One worksheet per statement | Yes | No cover/charts |
| DOCX | Pages with tables/charts as images | Yes | Portrait |
| CSV | Statement tables only | No | Client-side |
| PNG | Each page as PNG in ZIP | No | Sequenced filenames |

## Schema Fields

```typescript
premiumExportSchema = {
  format: "xlsx" | "pptx" | "pdf" | "docx",
  orientation: "landscape" | "portrait",
  version: "short" | "extended",
  includeCoverPage: boolean,
  themeColors: Array<{name, hexCode, rank?}>,
  entityName: string,
  companyName: string,
  statements: Array<{title, years, rows}>,
  metrics: Array<{label, value}>,
}
```

## PNG ZIP Export

`generatePngZipBuffer()` renders each PDF section as a standalone PNG and bundles them in a ZIP:

1. Build section array via `buildPdfSectionsFromData()` (same as PDF)
2. For each section, render standalone HTML via `buildPdfHtml()` with one section
3. Screenshot via `renderPng()` (Puppeteer, 2x device scale for retina quality)
4. Viewport: 1536×864 (landscape) or 816×1056 (portrait)
5. Bundle all PNGs with `archiver` into ZIP
6. Sequential filenames: `01-Cover-Page.png`, `02-Key-Performance-Metrics.png`, `03-Consolidated-Income-Statement.png`, etc.

No AI involved. Consistent with PDF rendering (same HTML templates).

## Direct Excel Generation

`generateExcelFromData()` builds xlsx directly from statement data — no AI call:

1. One worksheet per statement (e.g., "Consolidated Income Statement", "Cash Flow")
2. Formula rows filtered via `filterFormulaRows()`
3. Header row: blank label + `FY {year}` columns
4. Indented labels, raw numeric values
5. Column widths: 38ch label + 16ch per year
6. Sheet names truncated to 31 chars (xlsx limit)

## API Reference

```
POST /api/exports/premium
  Auth: Required (session cookie)
  Body: premiumExportSchema (see Schema Fields above)
  Success: 200 → Buffer
    Content-Type: varies by format (application/pdf, application/zip, etc.)
    Content-Disposition: attachment; filename="Company - Report.ext"
  Error 400: Invalid schema → { error, details }
  Error 503: AI service unavailable → { error, format }
  Error 504: Generation timeout → { error, format }
  Error 500: Other → { error, format }

GET /api/exports/premium/status
  Auth: Required
  Response: { available: boolean, formats: ["xlsx","pptx","pdf","docx","png"] }
```

## Key Files

| File | Purpose |
|------|---------|
| `server/routes/premium-exports.ts` | Route handler, section builder, format generators |
| `server/routes/pdf-html-templates.ts` | HTML/CSS template, theme resolution |
| `server/routes/premium-export-prompts.ts` | AI prompts for PPTX/DOCX |
| `server/browser-renderer.ts` | Puppeteer abstraction (`renderPdf`, `renderPng`) |
| `client/src/components/ExportDialog.tsx` | Export dialog UI |
| `client/src/components/ui/export-toolbar.tsx` | ExportMenu dropdown |
