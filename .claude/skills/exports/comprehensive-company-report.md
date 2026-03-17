# Comprehensive Company Exports — Skill

## Purpose

When a user exports from **any management company tab**, every format produces a **comprehensive, all-tabs report** — not just the tab they're viewing. PDF and PPTX include an enterprise cover page; CSV, Excel, and PNG do not.

---

## Core Principle

**One click → complete management company report.** Regardless of which company tab (Income Statement, Cash Flow, or Balance Sheet) the user is on, the export contains all financial sections combined into one document/file.

---

## Export Formats

| Format | Cover Page | Function | File |
|--------|-----------|----------|------|
| **PDF** | Yes — `drawCoverPage()` | `exportCompanyPDF()` | `companyExports.ts` |
| **PPTX** | Yes — `addTitleSlide()` | `exportCompanyPPTX()` | `pptxExport.ts` |
| **Excel** | No | `exportCompanyFullWorkbook()` | `companyExports.ts` / `excelExport.ts` |
| **CSV** | No | `exportCompanyCSV()` | `companyExports.ts` |
| **PNG** | No | `exportTablePNG()` / `exportChartPNG()` | `companyExports.ts` |

---

## Sections Included (All Formats)

Every comprehensive company export contains these sections in order:

1. **Income Statement** — Management fee revenue (base + incentive), cost of services, G&A expenses, partner/staff compensation, fixed overhead, variable costs, EBITDA, net income
2. **Cash Flow Statement** — Operating activities (net income + adjustments), investing activities, financing activities (SAFE note funding, interest), net change in cash, cumulative cash balance
3. **Balance Sheet** — Assets (cash), Liabilities (SAFE notes payable, accrued interest), Equity (retained earnings)

PDF additionally includes a **Performance Chart** (Revenue, Expenses, Net Income trend lines).

---

## Data Generators

| Generator | Statement | File |
|-----------|-----------|------|
| `generateCompanyIncomeData()` | Income Statement | `Company.tsx` |
| `generateCompanyCashFlowData()` | Cash Flow | `Company.tsx` |
| `generateCompanyBalanceData()` | Balance Sheet | `Company.tsx` |

These generators produce the standard `{ years, rows }` shape consumed by all export functions.

---

## Cover Page Design (PDF & PPTX Only)

Both formats share the same enterprise design as Dashboard exports:

- Full-bleed navy (`#1A2332`) background with grid overlay
- Sage (`#9FBCA4`) top/bottom border bars
- Sage vertical accent bar beside company name
- Company name in large white bold text
- Report title: "Management Company Financial Report"
- Subtitle: projection period
- **Metadata card**: Report type, Date, Classification (CONFIDENTIAL)
- Confidential disclaimer at bottom

### PDF Implementation
- `drawCoverPage(doc, companyName, title, subtitle, modelStartDate?)` from `pdfHelpers.ts`
- `addFooters()` with `skipPages` to exclude cover page

### PPTX Implementation
- `addTitleSlide(ctx, title, subtitle, sourceTag)` from `pptxExport.ts`
- `addAllFooters(ctx, skipFirst=true)` skips slide 1

---

## Current Implementation Status

### Already Comprehensive
- **PPTX** — `exportCompanyPPTX()` already exports all three statements in a single deck
- **Excel** — `exportCompanyFullWorkbook()` already creates a multi-sheet workbook (IS, CF, BS, Investment Analysis)

### Per-Tab (Needs Upgrade to Comprehensive)
- **PDF** — `exportCompanyPDF()` exports only the active tab's statement
- **CSV** — `exportCompanyCSV()` exports only the active tab's data

### Capture-Based (Tab Content)
- **PNG** — `exportTablePNG()` and `exportChartPNG()` capture the visible DOM element (inherently per-tab)

---

## Trigger Points

Company exports are triggered from:

1. **Company page ExportMenu** — Export dropdown in the company header
2. **ExportDialog** — Orientation/version picker for PDF and PNG formats

### Wiring Pattern (Company.tsx)

```tsx
<ExportMenu
  actions={[
    pdfAction(() => { setExportType('pdf'); setExportDialogOpen(true); }),
    excelAction(() => handleExcelExport(activeTab, financials, projectionYears, global, fiscalYearStartMonth)),
    csvAction(() => exportCompanyCSV(activeTab, getStatementData(activeTab), companyName)),
    pptxAction(() => handlePPTXExport(global, projectionYears, getFiscalYear, incomeData, cashFlowData, balanceData)),
    chartAction(() => { setExportType('chart'); setExportDialogOpen(true); }),
    pngAction(() => exportTablePNG(tableRef, activeTab, companyName)),
  ]}
/>
```

---

## Key Files

| File | Purpose |
|------|---------|
| `client/src/pages/Company.tsx` | Export handlers, data generators, ExportMenu wiring |
| `client/src/lib/exports/companyExports.ts` | `exportCompanyPDF()`, `exportCompanyCSV()`, `handleExcelExport()`, `handlePPTXExport()` |
| `client/src/lib/exports/pptxExport.ts` | `exportCompanyPPTX()` — comprehensive deck |
| `client/src/lib/exports/excelExport.ts` | `exportCompanyIncomeStatement()`, `exportCompanyCashFlow()`, `exportCompanyBalanceSheet()` |
| `client/src/lib/exports/pdfHelpers.ts` | `drawCoverPage()`, `buildFinancialTableConfig()`, `addFooters()` |
| `client/src/lib/exports/pdfChartDrawer.ts` | `drawLineChart()` for performance charts |
| `client/src/lib/exports/csvExport.ts` | `downloadCSV()` utility |
| `client/src/lib/exports/pngExport.ts` | `exportTablePNG()`, `exportChartPNG()` |

---

## Testing Checklist

- [ ] All formats generate without errors for varying projection years
- [ ] PDF and PPTX include enterprise cover page; CSV, Excel, PNG do not
- [ ] All three financial sections appear in PDF, PPTX, and Excel exports
- [ ] Tables auto-paginate for long projection periods
- [ ] Numbers format correctly (currency, percentages, em dashes for zero)
- [ ] Company name appears in filename and document headers
- [ ] Footers appear on all pages/slides except cover
- [ ] Export works from every company tab (not just the active one)
- [ ] SAFE note funding details appear correctly in Cash Flow and Balance Sheet
