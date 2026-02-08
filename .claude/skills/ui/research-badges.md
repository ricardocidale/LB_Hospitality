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

## Currently Implemented

- **Property Edit** (`client/src/pages/PropertyEdit.tsx`): ADR, Occupancy, Cap Rate, Catering Boost

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
