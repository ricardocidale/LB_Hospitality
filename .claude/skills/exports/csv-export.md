# CSV Export Sub-Skill

**File**: `client/src/lib/exports/csvExport.ts`
**Parent**: [SKILL.md](./SKILL.md)

## Overview

Lightweight browser-side CSV download utility. Accepts a pre-built CSV string and triggers a download via a temporary Blob URL.

## Dashboard Behavior

Dashboard CSV exports are **comprehensive** — clicking "CSV" on any dashboard tab produces a file containing all financial sections, not just the active tab. No cover page. See [comprehensive-pdf-report.md](./comprehensive-pdf-report.md) for the unified export design.

## Exported Function

### `downloadCSV(content: string, filename: string): void`

Creates a `text/csv` Blob from the provided content, generates a temporary object URL, and triggers a browser download with the given filename.

| Parameter | Type | Description |
|-----------|------|-------------|
| `content` | `string` | Full CSV content including headers and rows |
| `filename` | `string` | Download filename (e.g., `"portfolio-income.csv"`) |

## Standard CSV Generation Pattern

All pages use the same pattern to build CSV content from the standard `ExportData` shape:

```ts
import { downloadCSV } from "@/lib/exports/csvExport";

const headers = ["Category", ...years.map(String)];
const csvContent = [
  headers.join(","),
  ...rows.map(row => [
    `"${(row.indent ? "  ".repeat(row.indent) : "") + row.category}"`,
    ...row.values.map((v: number) => v.toFixed(2)),
  ].join(",")),
].join("\n");
downloadCSV(csvContent, "my-report.csv");
```

## Portfolio CSV Export

The Dashboard uses `exportPortfolioCSV` from `dashboardExports.ts` which wraps this pattern:

```ts
import { exportPortfolioCSV } from "@/components/dashboard/dashboardExports";

exportPortfolioCSV(years, rows, "portfolio-income-statement.csv");
```

## Integration with ExportMenu

```tsx
csvAction(() => exportPortfolioCSV(data.years, data.rows, "portfolio-cashflow.csv"))
```
