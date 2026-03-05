---
name: Export System
description: `ExportMenu` is the standard reusable export component for every data page in the application. It provides a single "Export" dropdown button offeri...
---

# Export System — Reusable Component Skill

## Purpose

`ExportMenu` is the standard reusable export component for every data page in the application. It provides a single "Export" dropdown button offering up to six download formats. This skill documents the component, the underlying export utilities, and the step-by-step methodology for wiring exports into any new or existing page.

---

## Quick Start (Adding Exports to a New Page)

```tsx
import { ExportMenu, pdfAction, excelAction, csvAction, pptxAction, chartAction, pngAction } from "@/components/ui/export-toolbar";

<ExportMenu
  actions={[
    pdfAction(() => handlePdf()),
    excelAction(() => handleExcel()),
    csvAction(() => handleCsv()),
    pptxAction(() => handlePptx()),
    chartAction(() => handleChart()),
    pngAction(() => handleTablePng()),
  ]}
/>
```

**Placement rules:**
- Tabbed pages → `CurrentThemeTab` `rightContent` slot
- Non-tabbed pages → `PageHeader` `actions` slot

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Page Component (Dashboard, PropertyDetail, Company, etc.)      │
│                                                                 │
│  1. Generate structured data:                                   │
│     { years: string[], rows: SlideTableRow[] }                  │
│                                                                 │
│  2. Create handler functions for each format                    │
│                                                                 │
│  3. Wire handlers to ExportMenu via action helpers              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │      ExportMenu         │
              │  (dropdown component)   │
              │                         │
              │  Action Helpers:        │
              │  pdfAction(fn)          │
              │  excelAction(fn)        │
              │  csvAction(fn)          │
              │  pptxAction(fn)         │
              │  chartAction(fn)        │
              │  pngAction(fn)          │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  Export Utilities        │
              │  client/src/lib/exports/ │
              │                         │
              │  excelExport.ts    XLSX  │
              │  pptxExport.ts     PPTX  │
              │  pdfChartDrawer.ts PDF   │
              │  pngExport.ts      PNG   │
              │  index.ts (barrel)       │
              └─────────────────────────┘
```

---

## ExportMenu Component

**File**: `client/src/components/ui/export-toolbar.tsx`

### Interface

```ts
interface ExportAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  testId?: string;
}

interface ExportMenuProps {
  actions: ExportAction[];
  className?: string;
  variant?: "glass" | "light";
}
```

### Variants

| Variant | When to use | Visual |
|---------|-------------|--------|
| `"glass"` (default) | Dark-themed pages (Dashboard, PropertyDetail, Company) | White text, backdrop blur, translucent navy dropdown |
| `"light"` | Light-themed pages (assumptions, research) | Gray text, white dropdown, gray borders |

### Action Helpers

Each returns a pre-configured `ExportAction` with the correct icon and `data-testid`:

| Helper | Label | Icon | Test ID |
|--------|-------|------|---------|
| `pdfAction(fn)` | PDF | `FileDown` | `button-export-pdf` |
| `excelAction(fn)` | Excel | `FileSpreadsheet` | `button-export-excel` |
| `csvAction(fn)` | CSV | `FileSpreadsheet` | `button-export-csv` |
| `pptxAction(fn)` | PowerPoint | `Presentation` | `button-export-pptx` |
| `chartAction(fn)` | Chart as Image | `FileBarChart` | `button-export-chart` |
| `pngAction(fn)` | Table as PNG | `ImageIcon` | `button-export-table-png` |

### Accessibility

- Click-outside dismissal via `mousedown` listener
- Escape key closes the dropdown
- All items have `data-testid` attributes

---

## Export Formats

### 1. Excel (XLSX)

**Utility**: `client/src/lib/exports/excelExport.ts`
**Library**: `xlsx` (SheetJS)
**Detail**: [excel-export.md](./excel-export.md)

Generates formatted workbooks with currency formatting (`#,##0`), percentage formatting, bold section headers, and configurable column widths. Separate functions for property-level, company-level, and portfolio-level workbooks.

### 2. PowerPoint (PPTX)

**Utility**: `client/src/lib/exports/pptxExport.ts`
**Library**: `pptxgenjs`
**Detail**: [pptx-export.md](./pptx-export.md)

Branded presentations with Hospitality Business colors (sage green headers, dark navy title slides, metric cards). Three export scopes: `exportPortfolioPPTX`, `exportPropertyPPTX`, `exportCompanyPPTX`. Auto-paginates tables when projection years exceed 5.

### 3. PDF (Charts + Tables)

**Utility**: `client/src/lib/exports/pdfChartDrawer.ts`
**Library**: `jspdf` + `jspdf-autotable`
**Detail**: [pdf-chart-export.md](./pdf-chart-export.md)

Renders line charts directly into jsPDF with colored series, data point dots, dashed grids, and centered legends. Used in combination with `autoTable` for full financial statement PDFs.

### 4. PNG (DOM Capture)

**Utility**: `client/src/lib/exports/pngExport.ts`
**Library**: `dom-to-image-more`
**Detail**: [png-export.md](./png-export.md)

Captures table or chart DOM elements at 2x resolution. Auto-collapses accordion rows for clean table captures. Includes SVG serialization fallback.

### 5. CSV

**Utility**: `client/src/lib/exports/csvExport.ts`
**Detail**: [csv-export.md](./csv-export.md)

Provides `downloadCSV(content, filename)` — a lightweight Blob-based download trigger. Pages build the CSV string from their `{ years, rows }` data and call `downloadCSV`. The Dashboard wraps this pattern in `exportPortfolioCSV` from `dashboardExports.ts`.

---

## Portfolio Data Generators

**File**: `client/src/components/dashboard/dashboardExports.ts`

The Dashboard page uses shared data generator functions that produce the standard `{ years, rows }` shape for each financial statement. These generators are used by all six export formats.

| Function | Returns | Input |
|----------|---------|-------|
| `generatePortfolioIncomeData` | Revenue, expenses, GOP, fees, NOI, below-NOI, GAAP Net Income | `yearlyConsolidatedCache`, `projectionYears`, `getFiscalYear` |
| `generatePortfolioCashFlowData` | CFO, CFI, CFF, Net Change in Cash | `allPropertyYearlyCF`, `projectionYears`, `getFiscalYear` |
| `generatePortfolioInvestmentData` | Equity, exit value, IRR, multiple, cash-on-cash | `financials`, `properties`, `projectionYears`, `getFiscalYear` |

Portfolio-level export wrappers:

| Function | Description |
|----------|-------------|
| `exportPortfolioExcel` | Multi-sheet workbook (Income Statement + Cash Flow) |
| `exportPortfolioCSV` | Single CSV for the active tab's data |
| `exportPortfolioPDF` | PDF with table + chart page, orientation-aware |

---

## Page Coverage Matrix

| Page | PDF | Excel | CSV | PowerPoint | Chart PNG | Table PNG |
|------|-----|-------|-----|------------|-----------|-----------|
| Dashboard | ✅ Per-tab (orientation dialog) | ✅ Multi-sheet workbook | ✅ Per-tab | ✅ Portfolio slides | ✅ Tab capture | ✅ Tab capture |
| PropertyDetail | ✅ Income + Cash Flow | ✅ Per-statement | ✅ Cash Flow | ✅ Property slides | ✅ Chart capture | ✅ Table capture |
| Company | ✅ Per-statement | ✅ Per-statement | ✅ Per-statement | ✅ Company slides | ✅ Chart capture | ✅ Table capture |
| SensitivityAnalysis | ✅ Tornado + table | ✅ Scenario data | ✅ Scenario data | ✅ Scenario slides | — | — |

---

## Step-by-Step: Wiring Exports into a New Page

### Step 1 — Generate structured data

Create functions that return the standard data shape:

```ts
interface ExportData {
  years: string[];
  rows: {
    category: string;
    values: (string | number)[];
    indent?: number;
    isBold?: boolean;
    isHeader?: boolean;
  }[];
}
```

### Step 2 — Create format handlers

```ts
const handleExcel = () => {
  const data = generateMyData();
  // Use shared utility or build workbook inline
  exportMyWorkbook(data);
};

const handlePptx = () => {
  const data = generateMyData();
  exportMyPPTX({ years: data.years.map(String), rows: data.rows });
};

const handleCsv = () => {
  const data = generateMyData();
  exportCSV(data, 'my-report.csv');
};

const handlePdf = () => {
  setExportType('pdf');
  setExportDialogOpen(true); // Opens orientation picker
};

const handleTablePng = () => {
  if (!tableRef.current) return;
  exportTablePNG({ element: tableRef.current, filename: 'my-table.png' });
};

const handleChartPng = () => {
  setExportType('chart');
  setExportDialogOpen(true);
};
```

### Step 3 — Wire into ExportMenu

```tsx
<CurrentThemeTab
  tabs={myTabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  rightContent={
    <ExportMenu
      actions={[
        pdfAction(() => handlePdf()),
        excelAction(() => handleExcel()),
        csvAction(() => handleCsv()),
        pptxAction(() => handlePptx()),
        chartAction(() => handleChartPng()),
        pngAction(() => handleTablePng()),
      ]}
    />
  }
/>
```

### Step 4 — Add ExportDialog for orientation-dependent formats

```tsx
import { ExportDialog } from "@/components/ui/export-dialog";

<ExportDialog
  open={exportDialogOpen}
  onClose={() => setExportDialogOpen(false)}
  onExport={(orientation) => handleExport(orientation)}
  title="Export PDF"
/>
```

---

## Branding Constants

All exports use consistent Hospitality Business branding:

| Token | Hex | Usage |
|-------|-----|-------|
| Sage Green | `#9FBCA4` | Divider lines, card borders, PPTX header backgrounds |
| Dark Green | `#257D41` | Metric values, section titles, chart revenue line |
| Dark Text | `#3D3D3D` | Table body text |
| Warm Off-White | `#FFF9F5` | Title slide text, light backgrounds |
| Dark Navy | `#1a2a3a` | PPTX title slide background |

---

## Dependencies

| Package | Purpose | Import |
|---------|---------|--------|
| `xlsx` | Excel workbook generation | `import * as XLSX from "xlsx"` |
| `pptxgenjs` | PowerPoint slide generation | `import pptxgen from "pptxgenjs"` |
| `jspdf` | PDF document creation | `import jsPDF from "jspdf"` |
| `jspdf-autotable` | PDF table rendering | `import autoTable from "jspdf-autotable"` |
| `dom-to-image-more` | DOM-to-PNG capture | `import domtoimage from "dom-to-image-more"` |

---

## Backward Compatibility

Legacy import paths still work via re-export shim files:
- `@/lib/excelExport` → `@/lib/exports/excelExport`
- `@/lib/pdfChartDrawer` → `@/lib/exports/pdfChartDrawer`
- `@/lib/chartExport` → `@/lib/exports/pngExport`

---

## Related Skills & Rules

| Resource | Path | What it covers |
|----------|------|----------------|
| Export Parity Rule | `.claude/rules/exports.md` | Enforces 6-format export on every financial page |
| Design System | `.claude/skills/design-system/SKILL.md` | Color palette, component library, page themes |
| Tab Bar System | `.claude/skills/ui/tab-bar-system.md` | CurrentThemeTab `rightContent` slot |
| Button System | `.claude/skills/ui/button-system.md` | GlassButton variants including `export` |
| Page Header | `.claude/skills/ui/page-header.md` | PageHeader `actions` slot |
