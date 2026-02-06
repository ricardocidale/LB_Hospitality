# PageHeader Component

**Location:** `client/src/components/ui/page-header.tsx`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Page title text |
| `subtitle` | `string` | optional | Subtitle text below title |
| `backLink` | `string` | optional | URL for back navigation arrow |
| `actions` | `ReactNode` | optional | Right-aligned action buttons slot |
| `className` | `string` | optional | Additional CSS classes |
| `variant` | `"dark" \| "light"` | `"dark"` | Visual variant |

## Variants

### Dark (default)
- Background: `bg-gradient-to-br from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e]`
- Text: white (`text-[#FFF9F5]`)
- Subtitle: `text-[#FFF9F5]/60`, uppercase `label-text` (tracking-wider)
- Top shine line: `h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent`
- Border: `border-white/15`
- Decorative sage green blur circles (`bg-[#9FBCA4]/20`)

### Light
- Background: `bg-white/80 backdrop-blur-xl`
- Text: `text-gray-900`
- Subtitle: `text-gray-600`, uppercase `label-text`
- Border: `border-[#9FBCA4]/20` with sage green shadow
- Decorative sage green blur circles

## Typography
- Title: `text-3xl font-display font-bold` (Playfair Display serif)
- Subtitle: `text-sm mt-1 label-text` (uppercase tracking-wider)

## Layout
- Min height: `min-h-[88px]`
- Padding: `p-6`
- Border radius: `rounded-3xl`
- Flex row on `sm:` breakpoint, column on mobile
- Actions right-aligned via `sm:justify-between`

## Back Link
- Dark variant: renders `ChevronLeft` inside `<GlassButton variant="icon" size="icon">`
- Light variant: renders custom styled back button with sage green tint

## Actions Slot
- Use `GlassButton variant="primary"` for action buttons on dark headers
- Use `GlassButton variant="export"` for export/download buttons
- Actions wrap with `flex-wrap items-center gap-2`

## Usage Example

```tsx
import { PageHeader } from "@/components/ui/page-header";
import { GlassButton } from "@/components/ui/glass-button";
import { FileDown } from "lucide-react";

<PageHeader
  title="Portfolio Overview"
  subtitle="Consolidated Financial Performance"
  backLink="/dashboard"
  actions={
    <>
      <GlassButton variant="export" size="sm">
        <FileDown className="w-4 h-4" /> Export PDF
      </GlassButton>
      <GlassButton variant="primary">
        Add Property
      </GlassButton>
    </>
  }
/>
```

## Pages Using PageHeader
- Dashboard, PropertyDetail, PropertyEdit, PropertyMarketResearch
- Company, CompanyAssumptions, CompanyResearch
- Admin, AdminUsers, AdminLoginLogs
- Portfolio, Settings, Profile, Scenarios, Methodology
- GlobalResearch, Research
