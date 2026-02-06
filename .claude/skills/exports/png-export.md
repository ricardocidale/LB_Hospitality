# PNG Export Skill

**Implementation**: `client/src/lib/exports/pngExport.ts`

## Overview

Captures DOM elements (tables and charts) as high-resolution PNG images using `dom-to-image-more`. Supports accordion collapse for clean table captures and border removal for professional output.

## Exported Functions

### `exportTablePNG(options: TablePNGOptions)`

Captures an HTML table element as a PNG with clean formatting.

**Features**:
- Automatically collapses accordion/expandable rows (`[data-expandable-row="true"]`)
- Removes cell borders, replaces with subtle bottom lines
- High-resolution output (2x scale by default)
- Restores all DOM modifications after capture

### `exportChartPNG(options: ChartPNGOptions)`

Captures a chart container element as a PNG.

### `captureChartAsImage(containerRef: HTMLDivElement): Promise<string | null>`

Captures a chart container and returns a base64 data URL (for embedding in PDFs). Includes SVG serialization fallback if dom-to-image fails.

## TablePNGOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `element` | `HTMLElement` | required | The table DOM element |
| `filename` | `string` | required | Download filename |
| `scale` | `number` | `2` | Resolution multiplier |
| `collapseAccordions` | `boolean` | `true` | Hide expandable rows |

## ChartPNGOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `element` | `HTMLElement` | required | The chart DOM element |
| `filename` | `string` | required | Download filename |
| `width` | `number` | auto | Override width |
| `height` | `number` | auto | Override height |
| `scale` | `number` | `2` | Resolution multiplier |

## Accordion Collapse Behavior

Tables with expandable detail rows should mark them with `data-expandable-row="true"`. During PNG capture:

1. All visible expandable rows are hidden
2. Cell borders are removed (replaced with light bottom borders)
3. Image is captured at 2x resolution
4. Original styles and visibility are restored

## Usage Pattern

```typescript
import { exportTablePNG, exportChartPNG, captureChartAsImage } from "@/lib/exports";

// Table PNG
const tableEl = document.getElementById("financial-table");
if (tableEl) {
  await exportTablePNG({
    element: tableEl,
    filename: "income-statement.png",
  });
}

// Chart PNG
const chartEl = chartRef.current;
if (chartEl) {
  await exportChartPNG({
    element: chartEl,
    filename: "revenue-chart.png",
  });
}

// Capture for PDF embedding
const dataUrl = await captureChartAsImage(chartRef.current);
if (dataUrl) {
  doc.addImage(dataUrl, "PNG", 10, 10, 270, 120);
}
```

## Dependencies

- `dom-to-image-more`

## Related Skills

- **excel-export.md** — Excel workbook export companion
- **pdf-chart-export.md** — PDF chart rendering companion
- **export-controls.md** — ExportToolbar button placement
