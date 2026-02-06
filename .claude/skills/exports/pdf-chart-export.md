# PDF Chart Export Skill

**Implementation**: `client/src/lib/exports/pdfChartDrawer.ts`

## Overview

Renders professional line charts directly into jsPDF documents with centered titles, visible axis labels, colored data point dots, dashed grid lines, and centered legends with color indicators.

## Exported Functions

### `drawLineChart(options: DrawChartOptions)`

Draws a multi-series line chart onto an existing jsPDF document at specified coordinates.

## DrawChartOptions Interface

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

```typescript
interface ChartSeries {
  name: string;      // Legend label
  data: ChartData[]; // Array of {label, value}
  color: string;     // Hex color (#RRGGBB)
}
```

## Visual Features

- White background with subtle border
- Centered bold title in dark blue-gray
- Dashed gray grid lines (5 horizontal)
- Y-axis labels formatted with `formatValue`
- X-axis labels from data point labels
- Colored line segments with filled dots at data points
- Centered legend with colored rectangle indicators

## Standard Colors

| Series | Hex | Usage |
|--------|-----|-------|
| Revenue | `#2E7D32` | Green gradient |
| GOP | `#1565C0` | Blue gradient |
| NOI | `#7B1FA2` | Purple |
| FCFE | `#D84315` | Coral |

## Usage Pattern

```typescript
import jsPDF from "jspdf";
import { drawLineChart } from "@/lib/exports";

const doc = new jsPDF({ orientation: "landscape" });
drawLineChart({
  doc,
  x: 10, y: 10,
  width: 270, height: 120,
  title: "Revenue & NOI Trend",
  series: [
    { name: "Revenue", data: yearlyRevenue, color: "#2E7D32" },
    { name: "NOI", data: yearlyNOI, color: "#1565C0" },
  ],
});
doc.save("charts.pdf");
```

## Dependencies

- `jspdf`

## Related Skills

- **excel-export.md** — Excel workbook export companion
- **png-export.md** — PNG capture companion
- **export-controls.md** — ExportToolbar button placement
