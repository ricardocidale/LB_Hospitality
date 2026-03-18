# PDF Rendering — Puppeteer Pipeline

## Architecture

Premium PDF skips AI entirely — builds HTML directly from financial data:

```
PremiumExportPayload → buildPdfSectionsFromData() → buildPdfHtml() → renderPdf() → Buffer
```

## Pipeline

1. **Section builder** (`premium-exports.ts`): `buildPdfSectionsFromData(data)` creates ordered sections:
   - Optional cover + overview (if `includeCoverPage`)
   - Statement → Chart pairs (Income, CashFlow, BalanceSheet, InvestmentAnalysis)
   - Formula rows filtered via `filterFormulaRows()` (`isItalic=true` excluded)
   - Charts extracted per-statement via `buildChartsForStatement()`

2. **HTML template** (`pdf-html-templates.ts`): `buildPdfHtml(sections, data)` renders sections to HTML:
   - Theme colors via `resolveThemeColors(data.colors)` — maps rank→functional role
   - Section renderers: `renderCoverSection`, `renderMetricsDashboardSection`, `renderChartSection`, `renderLineChartSection`, `renderFinancialTableSection`
   - All charts are inline SVG (no JS, no canvas)

3. **Browser render** (`browser-renderer.ts`): `renderPdf(html, opts)` produces PDF buffer:
   - Puppeteer-core + system Chromium (preferred on Replit)
   - Fallback: bundled puppeteer → Playwright
   - Singleton browser pool with health checks

## Theme Colors

Client sends `themeColors: Array<{name, hexCode, rank}>`. Server resolves:

```typescript
resolveThemeColors(themeColors) → { navy, sage, darkGreen, darkText, gray, altRow, sectionBg }
```

Falls back to `BRAND` defaults if no theme provided.

## Page Dimensions

| Orientation | Width | Height |
|-------------|-------|--------|
| Landscape | 406.4mm | 228.6mm |
| Portrait | 215.9mm | 279.4mm |

## CSS Rules for Templates

1. Use `print-color-adjust: exact` (standard) alongside `-webkit-` variant
2. SVG charts only — no canvas
3. `break-inside: avoid` on all card/table elements
4. `@page` uses explicit mm dimensions
5. Font: `Helvetica Neue, Helvetica, Arial, sans-serif`
6. No `backdrop-filter`, `position: sticky`, or CSS `filter:` at page breaks

## Chart Types

- **Bar charts**: Vertical bars with gradient fills, per-statement (2-4 per page in 2×2 grid)
- **Line charts**: Multi-series with data dots, for Investment Analysis trends
- Both use inline SVG with `viewBox` for scaling

## Key Files

| File | Purpose |
|------|---------|
| `server/pdf/browser-renderer.ts` | Puppeteer abstraction |
| `server/routes/pdf-html-templates.ts` | HTML/CSS templates + theme resolution |
| `server/routes/premium-exports.ts` | Section builder + format generators |
