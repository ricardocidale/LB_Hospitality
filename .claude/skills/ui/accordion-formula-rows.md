# Accordion Formula Rows — Expandable Calculation Verification

> See also: [calculation-transparency](calculation-transparency.md), [help-tooltip](help-tooltip.md), [financial-table-styling](financial-table-styling.md)

## Purpose
Expandable accordion rows inside financial tables that show step-by-step formula breakdowns when clicked. Used by the checker to verify every line item's calculation chain. The rows display chevron indicators (▶/▼) and expand to reveal `FormulaDetailRow` sub-rows with the full math.

## Components

### ExpandableLineItem
Location: `client/src/components/financial-table-rows.tsx`

Used for expense/revenue line items that can expand to show calculation details.

```tsx
<ExpandableLineItem
  label="Property Operations"
  tooltip="USALI fixed cost: 4.0% of Year 1 base revenue..."
  values={yd.map((y) => y.expensePropertyOps)}
  expanded={isExpanded("propertyOps")}
  onToggle={() => toggle("propertyOps")}
>
  {/* Child rows shown when expanded */}
  <FormulaDetailRow label="Base Mo. Revenue" values={[...]} colCount={years} />
  <FormulaDetailRow label="× Rate" values={[...]} colCount={years} />
  <FormulaDetailRow label="× Escalation" values={[...]} colCount={years} />
  <FormulaDetailRow label="× 12 months" values={[...]} colCount={years} />
</ExpandableLineItem>
```

### ExpandableMetricRow
Location: `client/src/components/financial-table-rows.tsx`

Used for KPI rows (ADR, Occupancy, RevPAR) that can expand to show derivation.

```tsx
<ExpandableMetricRow
  label="ADR Rate"
  values={columns.map((_, i) => `$${adr.toFixed(2)}`)}
  tooltip="Starting ADR × (1 + ADR growth)^year"
  expanded={isExpanded("adr")}
  onToggle={() => toggle("adr")}
>
  <FormulaDetailRow label="Base ADR" values={[...]} colCount={years} />
  <FormulaDetailRow label="× Growth Factor" values={[...]} colCount={years} />
</ExpandableMetricRow>
```

### FormulaDetailRow
Location: `client/src/components/YearlyIncomeStatement.tsx` (local helper)

Sub-row rendered inside expanded accordions. Shows one line of the formula chain.

```tsx
function FormulaDetailRow({ label, values, colCount }: {
  label: string;
  values: string[];
  colCount: number;
}) {
  // Renders italic, small text in a light blue-tinted row
}
```

## State Management Pattern

Every component that uses accordion rows follows this pattern:

```tsx
const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
const toggle = (key: string) =>
  setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }));
const isExpanded = (key: string) => allExpanded || !!expandedRows[key];
```

- `allExpanded` prop (optional) — when `true`, forces all rows open (used during export capture)
- Individual row state is tracked by string key (e.g. `"propertyOps"`, `"adr"`)

## Where Accordion Rows Exist

### Income Statement (`YearlyIncomeStatement.tsx`)
- **KPI section**: ADR Rate, ADR Effective, Occupancy, RevPAR
- **Fixed-cost GOP lines**: Property Ops, Utilities (split into variable + fixed), Admin, Insurance, Taxes, IT, Other
- Fixed costs show: Base Monthly Revenue × Rate × Escalation Factor × 12 = Annual total
- Utilities show both variable and fixed portions separately

### Cash Flow Statement (`YearlyCashFlowStatement.tsx`)
- Operating Cash Flow and Free Cash Flow sections have expandable breakdowns

## Calculation Transparency Toggle Integration
All accordion components respect the `CalcDetailsProvider` context:
- When `showDetails = false`: ExpandableLineItem/ExpandableMetricRow render as plain rows (no chevron, no children, no tooltip)
- When `showDetails = true`: Full accordion behavior with chevrons, tooltips, and expandable children
- See skill: `calculation-transparency` for toggle details

## Fixed-Cost Formula Logic
The `fixedCostFormulaRows()` function in YearlyIncomeStatement generates per-year formula breakdowns:
- Computes per-month escalation factors based on `opsYear = floor(monthsSinceOps / 12)`
- Shows unique factors when a model year spans two operational years
- Explicitly displays annualization step: `monthly × 12 = annual`
- Uses `(1 + fixedCostEscalationRate)^opsYear` for each operational month

## Export Behavior
When exporting income statement with "Include formula details" checked:
1. Sets `allExpanded = true` on YearlyIncomeStatement
2. Waits 300ms for React to render all expanded rows
3. Captures the table (PDF/PNG)
4. Resets `allExpanded = false`
