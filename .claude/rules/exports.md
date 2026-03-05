# Export Parity Rule

Every financial data page **must** offer all six export formats via the `ExportMenu` component. No page may ship with a partial export suite.

## Required Formats

| # | Format | Action Helper | Utility |
|---|--------|---------------|---------|
| 1 | PDF | `pdfAction` | `jspdf` + `autoTable` + `drawLineChart` |
| 2 | Excel | `excelAction` | `xlsx` (SheetJS) via `client/src/lib/exports/excelExport.ts` |
| 3 | CSV | `csvAction` | `downloadCSV` from `client/src/lib/exports/csvExport.ts` |
| 4 | PowerPoint | `pptxAction` | `pptxgenjs` via `client/src/lib/exports/pptxExport.ts` |
| 5 | Chart as Image | `chartAction` | `dom-to-image-more` or `captureChartAsImage` |
| 6 | Table as PNG | `pngAction` | `exportTablePNG` from `client/src/lib/exports/pngExport.ts` |

## Covered Pages

| Page | Scope | Data Generator |
|------|-------|----------------|
| Dashboard | Portfolio-level (consolidated) | `client/src/components/dashboard/dashboardExports.ts` |
| PropertyDetail | Single property | `client/src/lib/exports/excelExport.ts` (property functions) |
| Company | Management company | `client/src/lib/exports/excelExport.ts` (company functions) |

## Placement Rules

- **Tabbed pages** → `CurrentThemeTab` `rightContent` slot
- **Non-tabbed pages** → `PageHeader` `actions` slot

## Data Shape

All export data generators must produce the standard shape:

```ts
interface ExportData {
  years: string[] | number[];
  rows: {
    category: string;
    values: (string | number)[];
    indent?: number;
    isBold?: boolean;
    isHeader?: boolean;
  }[];
}
```

## Constraints

1. **No inline CSV generation.** Always use `downloadCSV()` from `csvExport.ts`.
2. **Filenames must include entity name** — e.g., `portfolio-income-statement.xlsx`, `Hotel Loch Sheldrake - Cash Flow.xlsx`.
3. **PPTX exports must include** a branded title slide (dark navy, sage accent) and metrics cards.
4. **PDF and Chart exports** must use `ExportDialog` for orientation selection (landscape/portrait).
5. **Portfolio exports** must use the shared data generators from `dashboardExports.ts` — never re-derive consolidated data inline.
6. **Excel workbooks** must apply currency formatting (`#,##0`), percentage formatting, and bold section headers via the shared helpers in `excelExport.ts`.
