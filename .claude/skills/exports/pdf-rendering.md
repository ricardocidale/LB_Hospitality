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
- Rendered via `@react-pdf/renderer` `Image` component
- CSS cleanup during capture ensures clean images (no borders, no shadows)

## Key Files

| File | Purpose |
|------|---------|
| `server/report/compiler.ts` | Report compiler (ReportDefinition IR) |
| `server/report/types.ts` | IR types (ImageSection, TableSection, ChartSection) |
| `server/pdf/render.tsx` | @react-pdf/renderer PDF generation |
| `server/browser-renderer.ts` | Puppeteer abstraction (PNG only) |
| `client/src/lib/exports/captureOverviewCharts.ts` | DOM chart capture |
