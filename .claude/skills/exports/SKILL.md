# Export System

## Overview

Unified export system for financial statements and charts. A single **Export** dropdown button provides access to all export formats: PDF, Excel, CSV, Chart (PNG), and Table (PNG).

## Architecture

```
Component Layer:    ExportMenu (dropdown button)
                        ↓
Action Helpers:     pdfAction, excelAction, csvAction, chartAction, pngAction
                        ↓
Implementation:     client/src/lib/exports/
                    ├── excelExport.ts    → XLSX workbooks with number formatting
                    ├── pdfChartDrawer.ts → jsPDF line chart rendering
                    ├── pngExport.ts      → DOM-to-image table/chart capture
                    └── index.ts          → Barrel re-exports
```

## ExportMenu Component

**File**: `client/src/components/ui/export-toolbar.tsx`

Single "Export" button with a dropdown menu listing available formats. Replaces the previous multi-button toolbar.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `actions` | `ExportAction[]` | required | Array of export format actions |
| `className` | `string` | optional | Additional CSS classes |
| `variant` | `"glass" \| "light"` | `"glass"` | Visual variant |

### Variants

- **Glass** (default): Dark translucent dropdown with backdrop blur, for dark backgrounds
- **Light**: White dropdown with gray borders, for light backgrounds

### Usage

```tsx
import { ExportMenu, pdfAction, excelAction, chartAction, pngAction } from "@/components/ui/export-toolbar";

<ExportMenu
  actions={[
    pdfAction(() => handlePdf()),
    excelAction(() => handleExcel()),
    chartAction(() => handleChart()),
    pngAction(() => handlePng()),
  ]}
/>
```

### Placement

1. **Tabbed pages**: Place in `DarkGlassTabs` `rightContent` slot
2. **Non-tabbed pages**: Place in `PageHeader` `actions` slot

## Sub-Skills (Implementation Details)

| Sub-Skill | File | Purpose |
|-----------|------|---------|
| [excel-export.md](./excel-export.md) | `excelExport.ts` | XLSX workbook generation with currency/percent formatting |
| [pdf-chart-export.md](./pdf-chart-export.md) | `pdfChartDrawer.ts` | Professional line charts rendered into jsPDF documents |
| [png-export.md](./png-export.md) | `pngExport.ts` | DOM capture with accordion collapse and border cleanup |

## Backward Compatibility

Legacy import paths still work via re-export files:
- `@/lib/excelExport` → re-exports from `@/lib/exports/excelExport`
- `@/lib/pdfChartDrawer` → re-exports from `@/lib/exports/pdfChartDrawer`
- `@/lib/chartExport` → re-exports from `@/lib/exports/pngExport`

## Related Skills

- **export-controls.md** — Legacy skill (now superseded by this SKILL.md)
- **tab-bar-system.md** — DarkGlassTabs rightContent slot
- **button-system.md** — GlassButton styling reference
