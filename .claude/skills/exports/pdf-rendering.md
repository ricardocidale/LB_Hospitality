# PDF Rendering — @react-pdf/renderer + Puppeteer (PNG)

## Architecture

Premium PDF uses `@react-pdf/renderer` (server-side React PDF generation). Puppeteer is used only for PNG rendering.

```
PDF:  compileReport() → ReportDefinition → @react-pdf/renderer → Buffer
PNG:  compileReport() → ReportDefinition → Puppeteer screenshots → ZIP
```

## PDF Pipeline

1. **Report compiler** (`server/report/compiler.ts`): `compileReport(payload)` creates `ReportDefinition` with ordered sections:
   - `ImageSection` entries for chart screenshots (Overview only)
   - `TableSection` / `ChartSection` pairs for each statement
   - Formula rows filtered (`isItalic=true` excluded)
   - No KPI sections, no cover pages

2. **React PDF renderer** (`server/pdf/render.tsx`): Renders `ReportDefinition` to PDF buffer:
   - Two render paths: dense (landscape) and non-dense (portrait)
   - `ImageSection` → `@react-pdf/renderer` `Image` component with aspect ratio preservation
   - `TableSection` → Paginated financial tables with headers/footers
   - `ChartSection` → SVG line charts via react-pdf primitives
   - Design tokens from `ReportDefinition.tokens` control all colors/fonts

3. **Design Pass** (optional): LLM-powered layout hints for pagination and spacing.

## PDF Layout Rules (CRITICAL)

These rules are mandatory for all PDF rendering:

1. **Tables never split across pages**: All section `View` containers use `wrap={false}` in `@react-pdf/renderer`. A table will move to the next page rather than split.
2. **Oversized table exception**: Only tables that exceed a full page height are chunked by `splitOversizedSections()`. Each chunk gets a "(cont'd)" title suffix.
3. **Image border safety**: Chart screenshots use `width: "96%"` with `paddingHorizontal: 4` to prevent borders being clipped at page edges.
4. **Vertical positioning**: On the last page(s), all table rows must fit. The `wrap={false}` + grouping algorithm ensures tables are pushed to the next page intact rather than being split.
5. **No cover pages**: Cover pages are NEVER generated. No KPI sections either.

## PNG Pipeline (Puppeteer)

`server/browser-renderer.ts` — Puppeteer with system Chromium:
- Singleton browser pool with health checks
- `renderPng(html, opts)` produces PNG buffer
- Viewport: 1536×864 (landscape) or 816×1056 (portrait)
- 2x device scale for retina quality

## Theme Colors

Client sends `themeColors: Array<{name, hexCode, rank}>`. Server resolves via `resolveThemeColors()`:

```typescript
resolveThemeColors(themeColors) → { navy, sage, darkGreen, darkText, gray, altRow, sectionBg }
```

## Page Dimensions

| Orientation | Width | Height |
|-------------|-------|--------|
| Landscape | 406.4mm | 228.6mm |
| Portrait | 215.9mm | 279.4mm |

## Image Sections

Chart screenshots from client are embedded as `ImageSection`:
- `dataUri`: base64 PNG from `dom-to-image-more` capture
- `aspectRatio`: defaults to 16/9 if not specified
- Rendered via `@react-pdf/renderer` `Image` component with `width: "96%"`, `objectFit: "contain"`
- CSS cleanup during capture ensures clean images (no borders, no shadows)
- `paddingHorizontal: 4` prevents edge clipping

## Dense Pagination

When `densePagination` is enabled (default):
- `groupSectionsIntoPages()` bins sections onto pages by estimated height
- `splitOversizedSections()` only chunks tables exceeding a full page
- Each section View uses `wrap={false}` to prevent mid-section page breaks
- Result: tables either fit entirely on a page or get chunked into page-sized pieces

## Key Files

| File | Purpose |
|------|---------|
| `server/report/compiler.ts` | Report compiler (ReportDefinition IR) |
| `server/report/types.ts` | IR types (ImageSection, TableSection, ChartSection) |
| `server/pdf/render.tsx` | @react-pdf/renderer PDF generation |
| `server/browser-renderer.ts` | Puppeteer abstraction (PNG only) |
| `client/src/lib/exports/captureOverviewCharts.ts` | DOM chart capture |
