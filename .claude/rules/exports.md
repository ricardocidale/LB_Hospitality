# Export Rules

Every financial data page **must** offer all six export formats via a single `ExportMenu` in the tab bar.

## Six Required Formats

PDF, Excel (xlsx), CSV, PowerPoint (pptx), PNG (zipped), DOCX

## Placement

One Export button per page in the tab bar `rightContent` slot. No per-tab export buttons.

## Cardinal Export Rules

1. **Full-scope export**: Clicking Export produces ALL financial statements for the entity — never just the current tab. Statements: Income Statement, Cash Flow, Balance Sheet, Investment Analysis (except Company which has no Investment Analysis).
2. **Statement → Chart interleaving**: Each statement table is followed by a chart page showing that statement's key metrics.
3. **Short/Extended**: "Short" exports header/total rows only (accordion closed). "Extended" exports all line items (accordion open). Formula rows (isItalic) are NEVER exported.
4. **Optional cover page**: Dashboard page offers a toggle for cover page + overview. Property and Company pages do not.
5. **File save**: After generation, `saveFile()` is called directly — tries native `showSaveFilePicker` (Chrome) or falls back to download (webview). No intermediate save dialog.
6. **Theme colors**: Export colors come from the user's active theme, resolved via `resolveThemeColors()`. Falls back to brand defaults.

## Format-Specific Rules

| Format | Content | Notes |
|--------|---------|-------|
| **PDF** | Full report (cover, overview, statements, charts) | Landscape or portrait, via Puppeteer HTML→PDF |
| **PPTX** | Each page = one 16:9 slide | Landscape only. Elements as PPTX objects or images |
| **Excel** | Each statement = one worksheet tab | No cover, no charts |
| **CSV** | Statement tables concatenated | No cover, no charts |
| **PNG** | Each page = separate PNG, bundled in ZIP | Sequenced filenames: `Report-01-IncomeStatement.png` |
| **DOCX** | Pages in sequence, tables/charts as PNG images | Portrait |

## ExportData Shape

```ts
interface ExportData {
  years: string[] | number[];
  rows: { category: string; values: (string | number)[]; indent?: number; isBold?: boolean; isHeader?: boolean; isItalic?: boolean; format?: string; }[];
}
```

## Per-Statement Charts

- **Income Statement**: Revenue, GOP, NOI, ANOI (multi-series line chart)
- **Cash Flow**: NOI, ANOI, Cash Flow, FCFE (multi-series line chart)
- **Balance Sheet**: Total Assets, Total Liabilities (multi-series line chart)
- **Investment Analysis**: NOI, ANOI, FCFE (multi-series line chart) + KPI metric cards (Total Equity, Exit Value, EM, CoC, IRR)

Reference: `.claude/skills/exports/SKILL.md` for full implementation guide.
