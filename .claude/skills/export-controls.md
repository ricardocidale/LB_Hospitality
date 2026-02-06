# Export Controls

**Component**: `ExportToolbar` (`client/src/components/ui/export-toolbar.tsx`)

## Overview

Standardized export button toolbar for financial pages. Provides PDF, Excel, PNG, and Chart export actions with consistent styling.

## ExportToolbar Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `actions` | `ExportAction[]` | required | Array of export action definitions |
| `className` | `string` | optional | Additional CSS classes |
| `variant` | `"glass" \| "light"` | `"glass"` | Visual variant |

## ExportAction Interface

```typescript
interface ExportAction {
  label: string;          // Button text ("PDF", "Excel", "PNG", "Chart")
  icon?: React.ReactNode; // Lucide icon element
  onClick: () => void;    // Export handler
  testId?: string;        // data-testid attribute
}
```

## Helper Functions

Pre-built action creators with correct icons and test IDs:

```tsx
import { pdfAction, excelAction, chartAction, pngAction } from "@/components/ui/export-toolbar";

// Each takes an onClick handler and returns an ExportAction
pdfAction(() => handlePdf())      // FileDown icon, testId: "button-export-pdf"
excelAction(() => handleExcel())  // FileSpreadsheet icon, testId: "button-export-excel"
chartAction(() => handleChart())  // ImageIcon, testId: "button-export-chart"
pngAction(() => handlePng())      // ImageIcon, testId: "button-export-table-png"
```

## Variant Styles

### Glass (default) — for dark backgrounds
- White text on transparent background
- `backdrop-blur-xl` with `border-white/20`
- Top shine line gradient
- Hover: subtle `bg-white/5` overlay

### Light — for light backgrounds
- Gray text (`text-gray-600`) on transparent background
- `border-gray-300`, hover: `border-gray-400`
- Hover: `bg-gray-100/50`

## Placement Rules

1. **Tabbed pages**: Place in `DarkGlassTabs` `rightContent` slot
2. **Non-tabbed pages**: Place in `PageHeader` `actions` slot
3. **Never** place export buttons floating in the page body

## Export Format Implementations

### PDF Export (jsPDF + autoTable)

```tsx
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function handleExportPdf() {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.text("Financial Statement", 14, 15);
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 20,
  });
  doc.save("financial-statement.pdf");
}
```

### Excel Export (XLSX)

```tsx
import * as XLSX from "xlsx";

function handleExportExcel() {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, "financial-data.xlsx");
}
```

### PNG Export (dom-to-image-more)

```tsx
import domToImage from "dom-to-image-more";

async function handleExportPng() {
  const node = document.getElementById("export-target");
  if (!node) return;
  const dataUrl = await domToImage.toPng(node, { quality: 1.0 });
  const link = document.createElement("a");
  link.download = "export.png";
  link.href = dataUrl;
  link.click();
}
```

### Chart PDF Export (pdfChartDrawer)

```tsx
import { drawChartToPdf } from "@/lib/pdfChartDrawer";

function handleExportChart() {
  drawChartToPdf({
    title: "Revenue Trend",
    chartRef: chartContainerRef,
    orientation: "landscape",
  });
}
```

## ExportDialog (Orientation Selection)

For PDF exports that benefit from orientation choice:

```tsx
import { ExportDialog } from "@/components/ui/export-dialog";

<ExportDialog
  open={showDialog}
  onClose={() => setShowDialog(false)}
  onExport={(orientation) => handlePdfExport(orientation)}
/>
```

## Full Example with DarkGlassTabs

```tsx
import { ExportToolbar, pdfAction, excelAction, pngAction } from "@/components/ui/export-toolbar";
import { DarkGlassTabs } from "@/components/ui/tabs";

<DarkGlassTabs
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  rightContent={
    <ExportToolbar
      actions={[
        pdfAction(() => exportPdf(activeTab)),
        excelAction(() => exportExcel(activeTab)),
        pngAction(() => exportPng(activeTab)),
      ]}
    />
  }
/>
```

## Related Skills

- **tab-bar-system.md** — DarkGlassTabs rightContent slot for export placement
- **button-system.md** — GlassButton export variant styling
