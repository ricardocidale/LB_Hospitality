# PDF Chart Export Sub-Skill

**File**: `client/src/lib/exports/pdfChartDrawer.ts`
**Library**: `jspdf`
**Parent**: [SKILL.md](./SKILL.md)

## Overview

Renders professional line charts directly into jsPDF documents. Features: centered titles, colored lines with data point dots, dashed grid lines, formatted Y-axis labels, centered legend with color indicators.

## Exported Function

### `drawLineChart(options: DrawChartOptions)`

Draws a multi-series line chart onto an existing jsPDF document at specified coordinates.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `doc` | `jsPDF` | required | The jsPDF document instance |
| `x` | `number` | required | Left edge X position (mm) |
| `y` | `number` | required | Top edge Y position (mm) |
| `width` | `number` | required | Chart width (mm) |
| `height` | `number` | required | Chart height (mm) |
| `title` | `string` | required | Centered chart title |
| `series` | `ChartSeries[]` | required | Array of data series |
| `formatValue` | `(v: number) => string` | `$XM` format | Y-axis label formatter |

## ChartSeries Interface

```ts
interface ChartSeries {
  name: string;      // Legend label
  data: ChartData[]; // Array of { label: string, value: number }
  color: string;     // Hex color (#RRGGBB)
}
```

## Standard Chart Colors

| Series | Hex | Visual |
|--------|-----|--------|
| Revenue | `#2E7D32` | Green |
| GOP | `#1565C0` | Blue |
| NOI | `#7B1FA2` | Purple |
| FCFE | `#D84315` | Coral |

## Usage

```ts
import jsPDF from "jspdf";
import { drawLineChart } from "@/lib/exports";

const doc = new jsPDF({ orientation: "landscape" });
drawLineChart({
  doc, x: 10, y: 10, width: 270, height: 120,
  title: "Revenue & NOI Trend",
  series: [
    { name: "Revenue", data: yearlyRevenue, color: "#2E7D32" },
    { name: "NOI", data: yearlyNOI, color: "#1565C0" },
  ],
});
doc.save("charts.pdf");
```

## Integration with ExportMenu

PDF exports typically use the `ExportDialog` for orientation selection:

```tsx
pdfAction(() => { setExportType('pdf'); setExportDialogOpen(true); })
```
