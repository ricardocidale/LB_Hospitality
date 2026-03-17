# Export Parity Rule

Every financial data page **must** offer all six export formats via `ExportMenu`. No partial suites.

## Six Required Formats

PDF (`pdfAction`), Excel (`excelAction`), CSV (`csvAction`), PowerPoint (`pptxAction`), Chart PNG (`chartAction`), Table PNG (`pngAction`)

## Placement

- **Tabbed pages** → `CurrentThemeTab` `rightContent` slot
- **Non-tabbed pages** → `PageHeader` `actions` slot

## Three Cardinal Export Rules

1. **Full-scope export**: Clicking Export from ANY tab exports ALL financial statements and analysis for the entity — never just the current tab. Applies to both premium and non-premium exports equally.
2. **Dual save destination**: Both premium and non-premium exports offer Local Drive and Google Drive as save targets.
3. **File naming at save step**: The user renames the file when selecting the save folder/location — not in the export dialog. The export dialog does NOT include a filename input field.

## Additional Constraints

1. CSV: always use `downloadCSV()` from `csvExport.ts` — no inline generation
2. Filenames must include entity name (e.g. `Hotel Loch Sheldrake - Cash Flow.xlsx`)
3. PPTX: branded title slide (dark navy, sage accent) + metrics cards
4. PDF/Chart: use `ExportDialog` for orientation selection
5. Portfolio exports: use generators from `dashboardExports.ts` — never re-derive inline
6. Excel: apply `#,##0` currency, percentage formatting, bold headers via `excelExport.ts` helpers

## ExportData Shape

```ts
interface ExportData {
  years: string[] | number[];
  rows: { category: string; values: (string | number)[]; indent?: number; isBold?: boolean; isHeader?: boolean; }[];
}
```

Reference: `.claude/skills/exports/SKILL.md` for full implementation guide.
