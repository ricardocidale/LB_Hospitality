# PowerPoint Export Sub-Skill

**File**: `client/src/lib/exports/pptxExport.ts`
**Library**: `pptxgenjs`
**Parent**: [SKILL.md](./SKILL.md)

## Overview

Generates branded `.pptx` presentations from financial data. Supports portfolio-level, property-level, and management company reports with title slides, metric cards, and financial tables.

## Branding

| Token | Hex | Usage |
|-------|-----|-------|
| Sage Green | `#9FBCA4` | Divider lines, card borders, header backgrounds |
| Dark Green | `#257D41` | Metric values, section titles |
| Dark Text | `#3D3D3D` | Table body text |
| Warm Off-White | `#FFF9F5` | Title slide text |
| Dark Navy | `#1a2a3a` | Title slide background |

## Slide Types

| Type | Description |
|------|-------------|
| Title Slide | Dark navy background, sage accent bar, company name, report title, date |
| Metrics Slide | 3-column grid of rounded cards with green values and gray labels (up to 9) |
| Table Slide | Full-width table with sage header row, bold totals, section highlighting |

## Exported Functions

### `exportPortfolioPPTX(data: PortfolioExportData)`
Full portfolio report: title, metrics, four financial table sections.

### `exportPropertyPPTX(data: PropertyExportData)`
Single property report: title slide + three financial tables.

### `exportCompanyPPTX(data: CompanyExportData)`
Management company report: title slide + three financial tables.

## Data Interface

```ts
interface SlideTableRow {
  category: string;
  values: (string | number)[];
  indent?: number;
  isBold?: boolean;
}
```

All export functions expect table data in the shape:
```ts
{ years: string[], rows: SlideTableRow[] }
```

## Auto-Pagination

When projection years exceed 5, tables split across multiple slides with year ranges in the title (e.g., "Income Statement (2025–2029)" and "Income Statement (2030–2034)").

## Usage

```ts
import { exportPortfolioPPTX } from "@/lib/exports";

exportPortfolioPPTX({
  projectionYears,
  getFiscalYear,
  totalInitialEquity, totalExitValue, equityMultiple, portfolioIRR, cashOnCash,
  totalProperties, totalRooms,
  totalProjectionRevenue, totalProjectionNOI, totalProjectionCashFlow,
  incomeData: { years: years.map(String), rows: incomeRows },
  cashFlowData: { years: years.map(String), rows: cashFlowRows },
  balanceSheetData: { years: years.map(String), rows: balanceRows },
  investmentData: { years: years.map(String), rows: investmentRows },
});
```

## Integration with ExportMenu

```tsx
pptxAction(() => handlePptxExport())
```
