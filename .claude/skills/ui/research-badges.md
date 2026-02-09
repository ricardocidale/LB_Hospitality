# Research Badges

**Component**: `ResearchBadge` (`client/src/components/ui/research-badge.tsx`)

## Golden Rule

**Any page with user-editable assumption fields that have corresponding AI-researched market data MUST show a gold/amber `ResearchBadge` next to the input.** Clicking the badge applies the researched value.

## Import

```tsx
import { ResearchBadge } from "@/components/ui/research-badge";
```

## Props

| Prop        | Type                           | Default   | Description                                |
| ----------- | ------------------------------ | --------- | ------------------------------------------ |
| `value`     | `string \| null \| undefined`  | —         | Display text; renders nothing if falsy      |
| `onClick`   | `() => void`                   | —         | Applies the researched value to the field   |
| `variant`   | `"light" \| "dark"`            | `"light"` | Light for white backgrounds, dark for glass |
| `className` | `string`                       | —         | Additional classes                          |

## Variants

### `light` — White/Cream Backgrounds
- **Text**: `text-amber-600`, hover `text-amber-700`
- **Background**: `bg-amber-50`, hover `bg-amber-100`
- **Border**: `border-amber-200`

```tsx
<ResearchBadge value="$350–$450" onClick={() => handleChange("startAdr", "400")} />
```

### `dark` — Glass/Dark Panels
- **Text**: `text-amber-400`, hover `text-amber-300`
- **Background**: `bg-amber-500/10`, hover `bg-amber-500/20`
- **Border**: `border-amber-500/30`

```tsx
<ResearchBadge variant="dark" value="5.5%–7.0%" onClick={() => handleChange("capRate", "0.0625")} />
```

## Usage Pattern

Place inline with the field label, to the right:

```tsx
<div className="flex items-center gap-2">
  <label>Starting ADR</label>
  <ResearchBadge
    value={researchValues.adr?.display}
    onClick={() => researchValues.adr && handleChange("startAdr", researchValues.adr.mid.toString())}
  />
</div>
<input value={draft.startAdr} onChange={...} />
```

## Data Source

Research data comes from `useMarketResearch("property", propertyId)` hook → `market_research` table → JSON `content` column.

### Available Research Fields

| Badge Field   | Research Path                                      | Format Example                               |
| ------------- | -------------------------------------------------- | -------------------------------------------- |
| ADR           | `content.adrAnalysis.recommendedRange`             | `"$350–$450"`                                |
| Occupancy     | `content.occupancyAnalysis.rampUpTimeline`          | Contains `"stabilized occupancy of 65–75%"`  |
| Cap Rate      | `content.capRateAnalysis.recommendedRange`          | `"5.5%–7.0%"`                                |
| Catering      | `content.cateringAnalysis.recommendedBoostPercent`  | `"25%"`                                      |
| Land Value    | `content.landValueAnalysis.recommendedPercent`      | `"20%–30%"`                                  |

### Parsing Helpers

```tsx
const parseRange = (rangeStr: string | undefined) => {
  if (!rangeStr) return null;
  const nums = rangeStr.replace(/[^0-9.,\-–]/g, ' ')
    .split(/[\s–\-]+/)
    .map(s => parseFloat(s.replace(/,/g, '')))
    .filter(n => !isNaN(n));
  if (nums.length >= 2) return { low: nums[0], high: nums[1], mid: Math.round((nums[0] + nums[1]) / 2) };
  if (nums.length === 1) return { low: nums[0], high: nums[0], mid: nums[0] };
  return null;
};

const parsePct = (pctStr: string | undefined) => {
  if (!pctStr) return null;
  const match = pctStr.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
};
```

## HelpTooltip + ResearchBadge Co-Location Rule

**Every user-editable input field MUST have both:**
1. A `HelpTooltip` (? icon) explaining what the field does
2. A `ResearchBadge` (amber/gold) if AI market research data exists for that field

These appear together in the Label row:

```tsx
<Label className="label-text flex items-center gap-1">
  Starting ADR
  <HelpTooltip text="The initial nightly rate charged per room..." />
  <ResearchBadge value={researchValues.adr?.display} onClick={...} />
</Label>
```

### GAAP-Standardized vs. Market-Variable Fields

Some assumptions are regulated by GAAP, IRS, or industry standards and are **not subjective**. Tooltips for these fields should reflect this certainty:

| Field | Authority | Standard Value | Tooltip Guidance |
|-------|-----------|---------------|------------------|
| Depreciation Period | IRS Pub 946 / ASC 360 | 27.5 years | "Fixed at 27.5 years per IRS Publication 946 for residential rental property." |
| Days Per Month | Industry standard | 30.5 days | "Industry convention: 365 ÷ 12 = 30.42, rounded to 30.5." |
| Amortization Terms | Market convention | 20–30 years | "Standard commercial mortgage terms. 25 years is most common." |
| Closing Costs | Market convention | 1–3% | "Includes lender fees, legal, appraisal, title insurance." |
| Broker Commission | NAR / market | 4–6% | "Industry standard, split between buyer's and seller's agents." |
| Inflation Rate | Federal Reserve | ~2% target | "Based on CPI forecasts. The Federal Reserve targets 2% annually." |

For market-variable fields (ADR, occupancy, cap rate), tooltips explain the concept and research badges show the AI-recommended range.

## Currently Implemented

- **Property Edit** (`client/src/pages/PropertyEdit.tsx`): All 39+ input fields have HelpTooltips. ResearchBadges on: startAdr, maxOccupancy, startOccupancy, occupancyRampMonths, cateringBoostPercent, exitCapRate, landValuePercent.
- **Settings** (`client/src/pages/Settings.tsx`): All input fields (portfolio, macro, other tabs) have HelpTooltips. No ResearchBadges (global settings are not property-specific).

## Integration Checklist

When adding research badges to a new page:

1. Import `ResearchBadge` from `@/components/ui/research-badge`
2. Fetch research data via `useMarketResearch(type, entityId)`
3. Parse fields with `parseRange()` / `parsePct()` into `{ display, mid }` objects
4. Place `<ResearchBadge>` next to each field that has research data
5. Wire `onClick` to apply the `mid` value to the field
6. Use `variant="dark"` on glass/dark panels

## Design Rules

1. **Never show without data** — component returns null if `value` is falsy
2. **Always clickable** — clicking applies midpoint of researched range
3. **Format matches field** — "$350–$450" for money, "65%–75%" for percentages
4. **Text format**: `(Research: {value})` with parentheses
5. **Placement**: Inline with label, to the right, same flex row
6. **Tooltip**: Always `title="Click to apply research-recommended value"`
