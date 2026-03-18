# PDF Rendering — Multi-Browser Strategy

## Architecture

Premium PDF exports render HTML/CSS → PDF server-side using a headless browser engine. The system uses an abstraction layer (`server/pdf/browser-renderer.ts`) to decouple from any single browser vendor.

```
Request → AI generates JSON → buildPdfHtml() → BrowserRenderer.renderPdf() → PDF buffer
```

## Browser Abstraction Layer

**File**: `server/pdf/browser-renderer.ts`

Provides a `BrowserRenderer` singleton with `renderPdf(html, options)`. Internally resolves the available browser engine at startup:

| Priority | Engine | Package | Notes |
|----------|--------|---------|-------|
| 1 | Playwright (Chromium) | `playwright` | Preferred — `page.pdf()` requires Chromium |
| 2 | Puppeteer (Chrome) | `puppeteer` | Fallback if Playwright unavailable |

Only Chromium-based engines support `page.pdf()`. Firefox and WebKit do not, so they are not valid PDF rendering targets.

If neither package is available, the server throws and the export route returns a 500.

## Cross-Browser CSS Rules

All HTML templates in `server/routes/pdf-html-templates.ts` must follow these rules:

1. **No `-webkit-` only properties** without standard equivalents
2. **Use `print-color-adjust: exact`** alongside `-webkit-print-color-adjust: exact`
3. **Avoid `backdrop-filter`** — not reliable across engines for PDF
4. **`@page` size directive** must use explicit `width` and `height` in mm (no named sizes)
5. **SVG charts preferred** over `<canvas>` — SVGs render identically across engines
6. **Avoid CSS `filter:` on page-break boundaries** — can clip in WebKit
7. **Use `break-inside: avoid`** (standard) not `-webkit-column-break-inside`
8. **Font stacks**: `'Helvetica Neue', Helvetica, Arial, sans-serif` — available on all engines
9. **All gradients use standard `linear-gradient`/`radial-gradient`** syntax
10. **No `position: sticky`** in table headers for PDF — use `display: table-header-group` on `<thead>`

## Page Dimensions

Defined in `client/src/lib/exports/exportStyles.ts` as `PAGE_DIMS`:

| Orientation | Width | Height | Ratio |
|-------------|-------|--------|-------|
| Landscape | 406.4mm | 228.6mm | 16:9 |
| Portrait | 215.9mm | 279.4mm | US Letter |

Both Puppeteer `page.pdf()` and Playwright `page.pdf()` accept `width`/`height` in mm strings.

## Chart Rendering

Charts in premium PDFs are rendered as **inline SVG** elements embedded in the HTML. No JavaScript charting library is used — the SVG is built server-side in `renderChartSection()` within `pdf-html-templates.ts`.

This approach:
- Works identically across all browser engines
- Produces crisp vector graphics at any zoom level
- Has zero runtime dependencies
- Cannot break due to JS execution timing

Chart types supported:
- Bar charts (vertical, with gradient fills)
- Grid lines with dollar-formatted axis labels
- Year labels on x-axis

## Adding New Chart Types

1. Add a new render function in `pdf-html-templates.ts` (e.g., `renderLineChart`)
2. Build the SVG string with `viewBox`, proper padding, and brand colors
3. Use `BRAND` constants from `premium-export-prompts.ts` for colors
4. Ensure `break-inside: avoid` on the chart container

## Testing PDF Rendering

To verify cross-browser compatibility:
1. Check that `server/pdf/browser-renderer.ts` resolves the correct engine
2. Generate a test PDF and verify page dimensions, chart rendering, and table formatting
3. Confirm `@page` directive matches the actual `width`/`height` passed to `page.pdf()`

## Key Files

| File | Purpose |
|------|---------|
| `server/pdf/browser-renderer.ts` | Browser abstraction layer |
| `server/routes/pdf-html-templates.ts` | HTML/CSS template builder |
| `server/routes/premium-exports.ts` | Export orchestration, chart injection |
| `server/routes/premium-export-prompts.ts` | AI prompt construction, brand constants |
| `client/src/lib/exports/exportStyles.ts` | Page dimension constants (`PAGE_DIMS`) |
