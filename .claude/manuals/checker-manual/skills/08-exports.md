# 08 — Export System

> Every financial data page in the platform includes an **Export Menu** — a dropdown button offering multiple output formats. The checker should use exports extensively to verify calculations outside the application.

---

## Available Export Formats

| Format | Extension | Best For | Key Characteristics |
|--------|-----------|----------|-------------------|
| PDF | `.pdf` | Formal reports, investor presentations | Formatted tables matching on-screen display; includes headers and branding |
| Excel | `.xlsx` | Offline analysis, formula verification | Separate worksheet per statement; raw numeric values; column headers preserved |
| CSV | `.csv` | Data import to other tools | Flat file format; no formatting; ideal for loading into independent spreadsheets |
| PowerPoint | `.pptx` | Investor presentations | Follows Hospitality Business branding (sage green palette, dark backgrounds); slide-per-statement |
| Chart PNG | `.png` | Embedding charts in documents | Rasterized chart image at screen resolution; white background |
| Table PNG | `.png` | Embedding tables in documents | Rasterized table image matching on-screen rendering |

---

## Export Menu Location

The Export Menu appears as a **dropdown button** labeled "Export" with a chevron indicator on every financial data page, including:

- Property Income Statement
- Property Cash Flow Statement
- Property Balance Sheet
- Management Company financials
- Consolidated Portfolio statements
- Investment Analysis / Returns
- Dashboard KPI views
- Financing Analysis
- Sensitivity Analysis

---

## Format Details

### PDF Export
- Generates a formatted document matching the on-screen table layout
- Includes page headers with property/entity name and date range
- Tables use the same column structure as the UI display
- Suitable for formal deliverables and board presentations

### Excel Export (.xlsx)
- Each financial statement is placed on a **separate worksheet** (tab)
- Column headers include year labels matching the fiscal year configuration
- Numeric values are exported as raw numbers (not formatted strings)
- Formulas are **not** embedded — values are static snapshots
- Best format for independent calculation verification

### CSV Export
- Single flat file with comma-separated values
- No formatting, styles, or multiple sheets
- Ideal for importing into a separate spreadsheet application for independent recalculation
- Column headers in first row; data rows follow

### PowerPoint Export (.pptx)
- Presentation-ready slides following Hospitality Business branding
- Color scheme: Sage Green (#9FBCA4), dark backgrounds
- One slide per major financial statement or chart
- Suitable for investor meetings and stakeholder presentations

### Chart PNG Export
- Captures the rendered chart as a PNG image
- White background with gradient data lines
- Includes axis labels, legends, and data point markers
- Resolution matches screen display

### Table PNG Export
- Captures the rendered financial table as a PNG image
- Preserves all formatting, row grouping, and highlighting
- Useful for embedding in external documents or emails

---

## Important Reminders for the Checker

> **Critical workflow:** Always export to **Excel or CSV first** before verifying any calculations. This gives you raw numeric values that can be cross-checked against the formulas defined in `formulas/`.

### Recommended Verification Workflow

| Step | Action | Format |
|------|--------|--------|
| 1 | Export the statement you want to verify | Excel (.xlsx) |
| 2 | Open in a spreadsheet application | — |
| 3 | Rebuild the calculation independently using formulas from `formulas/` | — |
| 4 | Compare your independent calculation to the exported values | — |
| 5 | Flag any discrepancy exceeding rounding tolerance (±$1) | — |
| 6 | Export a PDF for visual comparison against the UI display | PDF (.pdf) |

### Key Reminders

| Reminder | Detail |
|----------|--------|
| Excel sheets | Each statement gets its own worksheet — check sheet tabs |
| CSV flatness | CSV has no sheet separation; use it for single-statement imports |
| PDF fidelity | PDF tables should match the on-screen display exactly |
| PowerPoint branding | Slides use Hospitality Business brand colors — verify consistency with design system |
| Export availability | The Export Menu dropdown is present on **every** financial data page |
| Full Data Export | Available to **checker and admin roles only** — produces a complete PDF of ALL assumptions, property configurations, and financial statements in a single document |

---

## Full Data Export (Checker/Admin Only)

The Full Data Export is a privileged function accessible only to users with the **checker** or **admin** role. It produces a comprehensive PDF containing:

| Section | Contents |
|---------|----------|
| Global Assumptions | All global model parameters (inflation, fees, debt terms, staffing, etc.) |
| Property Configurations | Per-property assumptions (ADR, occupancy, cost rates, financing terms) |
| Income Statements | All properties, yearly |
| Cash Flow Statements | All properties, yearly |
| Balance Sheets | All properties, yearly |
| Management Company | Company income statement and cash flow |
| Consolidated | Portfolio-level aggregated statements |
| Investment Analysis | IRR, equity multiple, FCF/FCFE series |

This export serves as the **master reference document** for comprehensive verification. The checker should generate a Full Data Export before beginning any systematic verification session.

---

## Checker Export Checklist

| Check | Description |
|-------|-------------|
| ☐ | Export Menu dropdown appears on all financial data pages |
| ☐ | All 6 formats are available in the dropdown |
| ☐ | Excel export contains separate sheets per statement |
| ☐ | CSV export opens correctly in external spreadsheet |
| ☐ | PDF tables match on-screen display |
| ☐ | PowerPoint uses correct Hospitality Business branding colors |
| ☐ | Chart PNG captures the full chart with legend |
| ☐ | Table PNG captures the full table with headers |
| ☐ | Full Data Export is accessible with checker role |
| ☐ | Full Data Export PDF contains all sections listed above |
