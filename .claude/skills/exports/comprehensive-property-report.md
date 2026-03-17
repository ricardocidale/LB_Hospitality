# Comprehensive Property Exports — Skill

## Purpose

When a user exports from **any property detail tab**, every format produces a **comprehensive, all-tabs report** — not just the tab they're viewing. PDF and PPTX include an enterprise cover page; CSV, Excel, and PNG do not.

---

## Core Principle

**One click → complete property investor report.** Regardless of which property tab (Income Statement, Cash Flow, or Balance Sheet) the user is on, the export contains all financial sections combined into one document/file.

---

## Export Formats

| Format | Cover Page | Function | File |
|--------|-----------|----------|------|
| **PDF** | Yes — `drawCoverPage()` | `exportComprehensivePropertyPDF()` | `companyExports.ts` (or inline in `PropertyDetail.tsx`) |
| **PPTX** | Yes — `addTitleSlide()` | `exportPropertyPPTX()` | `pptxExport.ts` |
| **Excel** | No | `exportFullPropertyWorkbook()` | `excelExport.ts` |
| **CSV** | No | `exportPropertyCSV()` | inline in `PropertyDetail.tsx` |
| **PNG** | No | `exportTablePNG()` / `exportChartPNG()` | `pngExport.ts` |

---

## Sections Included (All Formats)

Every comprehensive property export contains these sections in order:

1. **Income Statement** — Revenue (rooms, F&B, events, other), departmental expenses, undistributed expenses, GOP, management fees, NOI, below-NOI items, GAAP Net Income (USALI format)
2. **Cash Flow Statement** — Operating (CFO), Investing (CFI), Financing (CFF), Free Cash Flow (FCF), Free Cash Flow to Equity (FCFE)
3. **Balance Sheet** — Assets (current + fixed + other), Liabilities (current + long-term), Equity, with Debt-to-Assets and Equity-to-Assets ratios

PDF additionally includes **Performance Charts** (Revenue, OpEx, ANOI trend lines).

---

## Data Sources

| Data | Source | File |
|------|--------|------|
| Income Statement rows | `proFormaData` monthly → yearly aggregation | `PropertyDetail.tsx` |
| Cash Flow rows | `yearlyCashFlow` from financial engine | `PropertyDetail.tsx` |
| Balance Sheet rows | `yearlyBalanceSheet` from financial engine | `PropertyDetail.tsx` |
| Chart data | `yearlyChartData` aggregated metrics | `PropertyDetail.tsx` |

---

## Cover Page Design (PDF & PPTX Only)

Both formats share the same enterprise design as Dashboard exports:

- Full-bleed navy (`#1A2332`) background with grid overlay
- Sage (`#9FBCA4`) top/bottom border bars
- Sage vertical accent bar beside property name
- Property name in large white bold text
- Report title: "Comprehensive Property Financial Report"
- Subtitle: projection period and property market/location
- **Metadata card**: Report type, Date, Classification (CONFIDENTIAL)
- Confidential disclaimer at bottom

### PDF Implementation
- `drawCoverPage(doc, propertyName, title, subtitle, modelStartDate?)` from `pdfHelpers.ts`
- `addFooters()` with `skipPages` to exclude cover page

### PPTX Implementation
- `addTitleSlide(ctx, title, subtitle, sourceTag)` from `pptxExport.ts`
- `addAllFooters(ctx, skipFirst=true)` skips slide 1

---

## Current Implementation Status

### Already Comprehensive
- **PPTX** — `exportPropertyPPTX()` already exports all three statements (Income, Cash Flow, Balance Sheet) in a single deck
- **Excel** — `exportFullPropertyWorkbook()` already creates a multi-sheet workbook with Income Statement + Cash Flow sheets

### Per-Tab (Needs Upgrade to Comprehensive)
- **PDF** — `exportIncomeStatementPDF()` and `exportCashFlowPDF()` export only the active tab
- **CSV** — `exportCashFlowCSV()` exports only Cash Flow data

### Capture-Based (Tab Content)
- **PNG** — `exportTablePNG()` and `exportChartPNG()` capture the visible DOM element (inherently per-tab)

---

## Trigger Points

Property exports are triggered from:

1. **PropertyDetail ExportMenu** — Export dropdown on the property detail page
2. **ExportDialog** — Orientation/version picker for PDF and PNG formats

### Wiring Pattern (PropertyDetail.tsx)

```tsx
<ExportMenu
  actions={[
    pdfAction(() => { setExportType('pdf'); setExportDialogOpen(true); }),
    excelAction(() => handleExcelExport()),
    csvAction(() => exportCashFlowCSV()),
    pptxAction(() => handlePPTXExport()),
    chartAction(() => { setExportType('chart'); setExportDialogOpen(true); }),
    pngAction(() => { setExportType('tablePng'); setExportDialogOpen(true); }),
  ]}
/>
```

---

## Key Files

| File | Purpose |
|------|---------|
| `client/src/pages/PropertyDetail.tsx` | Export handlers and ExportMenu wiring |
| `client/src/lib/exports/pptxExport.ts` | `exportPropertyPPTX()` — comprehensive deck |
| `client/src/lib/exports/excelExport.ts` | `exportFullPropertyWorkbook()` — multi-sheet workbook |
| `client/src/lib/exports/pdfHelpers.ts` | `drawCoverPage()`, `buildFinancialTableConfig()`, `addFooters()` |
| `client/src/lib/exports/pdfChartDrawer.ts` | `drawLineChart()` for performance charts |
| `client/src/lib/exports/csvExport.ts` | `downloadCSV()` utility |
| `client/src/lib/exports/pngExport.ts` | `exportTablePNG()`, `exportChartPNG()` |

---

## Testing Checklist

- [ ] All formats generate without errors for properties with varying projection years (5, 10, 15)
- [ ] PDF and PPTX include enterprise cover page; CSV, Excel, PNG do not
- [ ] All three financial sections appear in PDF, PPTX, and Excel exports
- [ ] Tables auto-paginate for long projection periods
- [ ] Numbers format correctly (currency, percentages, em dashes for zero)
- [ ] Property name appears in filename and document headers
- [ ] Footers appear on all pages/slides except cover
- [ ] Export works from every property detail tab (not just the active one)
