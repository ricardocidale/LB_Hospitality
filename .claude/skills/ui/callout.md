# Callout Component

**Location:** `client/src/components/ui/callout.tsx`

## Purpose
Alert/callout box for highlighting important information in documentation pages. Used by both the User Manual (`/methodology`) and Checker Manual (`/checker-manual`) for business rules, warnings, and notices.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | required | Callout content |
| `severity` | `"warning" \| "critical" \| "info" \| "success"` | `"warning"` | Visual severity level |
| `icon` | `React.ElementType` | per severity | Override default icon |
| `title` | `string` | optional | Bold title above content |

## Severity Variants

| Severity | Background | Border | Text | Default Icon |
|----------|-----------|--------|------|-------------|
| `warning` | `bg-amber-500/10` | `border-amber-500/20` | `text-amber-200/90` | `AlertTriangle` |
| `critical` | `bg-red-50` | `border-red-200` | `text-red-800` | `ShieldAlert` |
| `info` | `bg-blue-50` | `border-blue-200` | `text-blue-800` | `Info` |
| `success` | `bg-green-50` | `border-green-200` | `text-green-800` | `CheckCircle` |

## Usage Examples

```tsx
import { Callout } from "@/components/ui/callout";

// Business rule (critical)
<Callout severity="critical" title="No Negative Cash">
  Cash balances for each property, the management company, and the portfolio must never go negative.
</Callout>

// Fixed assumption warning
<Callout severity="warning" title="Fixed Assumptions">
  These values are built into the calculation engine and cannot be changed.
</Callout>

// Configurable parameter notice
<Callout severity="success" title="Now Configurable">
  <p>These parameters can be adjusted in Company Assumptions:</p>
  <ul className="list-disc pl-5 mt-1 space-y-1">
    <li>Exit Cap Rate</li>
    <li>Tax Rate</li>
  </ul>
</Callout>

// Default warning (amber)
<Callout>
  Important note about the calculation methodology.
</Callout>
```

## Notes
- Content wraps in `text-sm font-medium`
- String children are auto-wrapped in `<p>` tags
- Non-string children (JSX) are rendered as-is
- Icon is always 20×20 with `flex-shrink-0` to prevent squishing
- Uses its own background colors (works on both light and dark page backgrounds)

## Related Skills
- **section-card.md** — Collapsible section containing callouts
- **manual-table.md** — Data table component often used alongside callouts
