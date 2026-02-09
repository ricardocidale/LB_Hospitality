# HelpTooltip — In-App Field Help System

## Purpose
The `HelpTooltip` component provides contextual help for every input field across the application. It displays a `?` icon next to field labels that reveals an explanatory tooltip on hover or click.

## Component Location
`client/src/components/ui/help-tooltip.tsx`

## API

```tsx
import { HelpTooltip } from "@/components/ui/help-tooltip";

<HelpTooltip
  text="Explanation of the field"   // Required — plain-text help content
  light={false}                      // Optional — use true on dark backgrounds
  side="top"                         // Optional — "top" | "bottom" | "left" | "right"
/>
```

### Props
| Prop    | Type    | Default | Description |
|---------|---------|---------|-------------|
| `text`  | string  | —       | Help text shown in the tooltip popup |
| `light` | boolean | `false` | Sage green icon on light backgrounds; white icon on dark backgrounds |
| `side`  | string  | `"top"` | Preferred tooltip direction. Radix auto-flips if clipped by viewport. |

## Implementation Details
- Built on top of Radix UI `Tooltip` via shadcn (`@/components/ui/tooltip`)
- Uses portal rendering for proper z-index stacking
- Collision-aware: auto-repositions when tooltip would clip viewport edges
- 200ms delay before showing to prevent accidental triggers
- Accessible: `aria-label="Help"`, keyboard focusable with visible focus ring
- Test IDs: `help-tooltip-trigger`, `help-tooltip-content`

## Placement Patterns

### Next to a Label (most common)
```tsx
<Label className="flex items-center gap-1">
  Field Name <HelpTooltip text="What this field does" />
</Label>
```

### Section-level help (standalone)
```tsx
<h3 className="flex items-center gap-2">
  Section Title
  <HelpTooltip text="Overview of this entire section" />
</h3>
```

### Co-located with ResearchBadge
When a field has both a tooltip and AI research data, place the `HelpTooltip` first (inside the label) and the `ResearchBadge` after the input:
```tsx
<Label className="flex items-center gap-1">
  ADR <HelpTooltip text="Average Daily Rate..." />
</Label>
<Input ... />
<ResearchBadge field="startAdr" ... />
```

## Writing Tooltip Text

### GAAP-Standardized Fields
For values mandated by regulation or accounting standards, cite the authority and note they are not subjective:
- "Depreciation uses 27.5-year straight-line per IRS Publication 946 for residential rental property."
- "Room revenue uses 30.5 days per month — hospitality industry standard for annualizing."

### Market-Variable Fields
For values that depend on market conditions or user judgment, describe what the field controls and provide typical ranges:
- "Annual interest rate on the acquisition loan. Market rates vary; currently 6–8% for commercial hospitality loans."
- "Expected annual inflation rate. The Federal Reserve targets 2% annually."

### Switches and Toggles
Explain the consequence of enabling/disabling:
- "Whether target properties include Food & Beverage operations like restaurants and bars."

## Coverage

### Current Usage (all fields covered)
| Page | Count | Includes |
|------|-------|----------|
| `Settings.tsx` | 37 | Portfolio profile, financing defaults, macro assumptions, branding, AI model |
| `PropertyEdit.tsx` | 52 | Revenue, costs, financing, exit, staffing, events, F&B, wellness |
| `CompanyAssumptions.tsx` | 4+ | Start date, company name, logo, operational start |
| `Dashboard.tsx` | 3 | NOI, debt service, cash flow |
| `InvestmentAnalysis.tsx` | 4 | Total equity, exit value, equity multiple, cash-on-cash |

### Mandatory Rule
Every user-facing input field **must** have a `HelpTooltip`. When adding new fields, always add a corresponding tooltip.

## Do Not
- Do not create local `HelpTooltip` functions inside page components — always import the shared component
- Do not use the old absolute-positioned custom tooltip approach
- Do not skip tooltips on any input field, even toggles and sliders
