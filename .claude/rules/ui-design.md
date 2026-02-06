# UI/UX Design System

## Design Philosophy

Swiss Modernist design principles with L+B brand colors. Clean typography, generous whitespace, glass-morphism effects, and data-dense financial tables. Every page must use the shared component library — no inline/ad-hoc styling for buttons, headers, tabs, or exports.

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Primary Sage Green | `#9FBCA4` | Accents, borders, decorative blur orbs, tab shine |
| Secondary Green | `#257D41` | Chart lines (revenue/NOI), active icon gradients |
| Warm Off-White | `#FFF9F5` | Background tint, text on dark surfaces |
| Coral Accent | `#F4795B` | Chart lines (FCFE/secondary), alerts |
| Black | `#000000`, `#0a0a0f` | Text, dark backgrounds, tab bar base |
| Dark Blue-Gray Gradient | `#2d4a5e → #3d5a6a → #3a5a5e` | PageHeader, GlassButton primary, navigation |

## Page Themes

### Login Page
- Near-black (`#0a0a0f`) background
- Centered glass dialog card
- Subtle sage green blur orbs for depth
- Swiss Modernist typography

### Assumption Pages (Light Theme)
- `bg-white/80 backdrop-blur-xl` cards
- Sage green accent borders (`border-[#9FBCA4]/20`)
- Gray text for labels, dark gray for values
- White input backgrounds
- Decorative blur orbs in sage green

### Main App Pages (Dark Glass Theme)
- Dark blue-gray gradient background cards
- Off-white text (`text-white/90`)
- Semi-transparent white input backgrounds (`bg-white/10`)
- Glass morphism with backdrop blur

### Financial Statement Tables (Light Theme)
- White/gray-50/gray-100 backgrounds
- Dark gray text for readability
- Alternating row colors for data density

---

## Hero Headers

**Component**: `PageHeader` (`client/src/components/ui/page-header.tsx`)

Every page MUST use `PageHeader`. No ad-hoc header markup.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Page title (Playfair Display serif) |
| `subtitle` | `string` | optional | Uppercase tracking-wider subtitle |
| `backLink` | `string` | optional | URL for back navigation chevron |
| `actions` | `ReactNode` | optional | Right-aligned action buttons slot |
| `variant` | `"dark" \| "light"` | `"dark"` | Visual variant |

### Variant Rules
- **Default (`"dark"`)**: Used on all pages (Dashboard, PropertyDetail, Company, Admin, etc.)
- **`"light"`**: Used only on `PropertyFinder` page

### Back Navigation Pattern
- `backLink` renders a `<GlassButton variant="icon" size="icon">` with `ChevronLeft` icon
- Use for drill-down pages that return to a parent (PropertyDetail → Dashboard, PropertyEdit → PropertyDetail)

### Actions Slot
- Use `GlassButton variant="primary"` for action buttons
- Use `SaveButton` for save operations
- Use `GlassButton variant="export"` for export/download buttons
- Actions wrap with `flex-wrap items-center gap-2`

---

## Button System

**Component**: `GlassButton` (`client/src/components/ui/glass-button.tsx`)

**RULE**: All buttons MUST use `GlassButton`. No raw `<button>` elements with inline glass/gradient styling anywhere in the codebase.

### Variants

| Variant | Background | Text | Use Case |
|---------|-----------|------|----------|
| `primary` | Dark glass gradient (`#2d4a5e → #3d5a6a → #3a5a5e`) | White | **Main action buttons on dark backgrounds** |
| `export` | Transparent → `bg-gray-100/50` on hover | `text-gray-600` | PDF/Excel/PNG/Chart export buttons |
| `ghost` | `bg-white/10` → `bg-white/20` on hover | `text-[#FFF9F5]` | Secondary/subtle actions |
| `icon` | `bg-white/10` → `bg-white/20` on hover | `text-[#FFF9F5]` | Icon-only buttons (back arrows, close) |
| `default` | `bg-white/10 backdrop-blur-xl` | `text-[#FFF9F5]` | General buttons on dark backgrounds |

### Sizes

| Size | Classes |
|------|---------|
| `default` | `px-5 py-2.5 text-sm` |
| `sm` | `px-4 py-2 text-xs` |
| `lg` | `px-6 py-3 text-base` |
| `icon` | `p-2.5` |

### Primary Variant Details
- Top shine line: `h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent`
- Hover glow: `shadow-[0_0_20px_rgba(159,188,164,0.3)]` (sage green)
- Disabled: flat `#4a5a6a` background, reduced shine opacity

### SaveButton Wrapper

**Component**: `SaveButton` (`client/src/components/ui/save-button.tsx`)

Convenience wrapper around `GlassButton variant="primary"` with:
- Save icon (lucide `Save`) → spinning `Loader2` when `isPending`
- `data-testid="button-save-changes"`
- Props: `onClick`, `disabled`, `isPending`, `children` (default: "Save Changes")

### Anti-Patterns (NEVER do this)
```tsx
// BAD - inline glass styling
<button className="bg-gradient-to-br from-[#2d4a5e] ...">Save</button>

// GOOD
<GlassButton variant="primary">Save</GlassButton>
```

---

## Tab-Bar System

**Component**: `DarkGlassTabs` (`client/src/components/ui/tabs.tsx`)

Filing-system style tabs for multi-view pages. Used on pages with dark glass theme.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `tabs` | `DarkGlassTabItem[]` | Tab definitions (`value`, `label`, `icon?`) |
| `activeTab` | `string` | Currently active tab value |
| `onTabChange` | `(value: string) => void` | Tab change handler |
| `rightContent` | `ReactNode` | **Right-aligned slot for export controls** |

### Usage Pattern
```tsx
<DarkGlassTabs
  tabs={[
    { value: "income", label: "Income Statement", icon: DollarSign },
    { value: "balance", label: "Balance Sheet", icon: Scale },
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  rightContent={
    <ExportMenu
      actions={[
        pdfAction(handlePdf),
        excelAction(handleExcel),
        csvAction(handleCsv),
        pptxAction(handlePptx),
        chartAction(handleChart),
        pngAction(handlePng),
      ]}
    />
  }
/>
```

### Rules
- Use `DarkGlassTabs` on all dark-themed pages with multiple views
- Standard `Tabs`/`TabsList`/`TabsTrigger` (shadcn) should NOT be used on dark pages — use `DarkGlassTabs` instead
- Export controls always go in `rightContent`, never in the page header

---

## Export Controls

**Component**: `ExportMenu` (`client/src/components/ui/export-toolbar.tsx`)
**Full documentation**: `.claude/skills/exports/SKILL.md`

Single "Export" dropdown button with 6 formats: PDF, Excel, CSV, PowerPoint, Chart PNG, Table PNG.

### Variants
- `"glass"` (default): Dark translucent dropdown with backdrop blur for dark backgrounds
- `"light"`: White dropdown with gray borders for light backgrounds

### Action Helpers

| Function | Label | Icon |
|----------|-------|------|
| `pdfAction(onClick)` | PDF | `FileDown` |
| `excelAction(onClick)` | Excel | `FileSpreadsheet` |
| `csvAction(onClick)` | CSV | `FileSpreadsheet` |
| `pptxAction(onClick)` | PowerPoint | `Presentation` |
| `chartAction(onClick)` | Chart as Image | `FileBarChart` |
| `pngAction(onClick)` | Table as PNG | `ImageIcon` |

### Format Implementations
Located in `client/src/lib/exports/`:
- **Excel**: `excelExport.ts` — XLSX workbooks via SheetJS
- **PowerPoint**: `pptxExport.ts` — Branded slides via pptxgenjs
- **PDF**: `pdfChartDrawer.ts` — Line charts via jsPDF
- **PNG**: `pngExport.ts` — DOM capture via dom-to-image-more
- **CSV**: Inline per page (lightweight, no shared utility needed)

### Placement Rules
- Export controls go in `DarkGlassTabs` `rightContent` slot on tabbed pages
- On non-tabbed pages, use `ExportMenu` in `PageHeader` `actions` slot
- Never place export buttons in the page body or floating

---

## Navigation Controls

### Save / Back / Assumptions Pattern

Financial pages follow a consistent navigation pattern:

1. **Save**: `SaveButton` in `PageHeader` actions slot for persisting edits
2. **Back**: `PageHeader backLink` prop with `ChevronLeft` icon for returning to parent
3. **Assumptions**: `GlassButton variant="primary"` linking to the assumptions edit page

### Standard Navigation Flows
- Dashboard → PropertyDetail → PropertyEdit (back to PropertyDetail)
- Dashboard → Company → CompanyAssumptions (back to Company)
- Admin tabs: Users / Login Activity / Verification (in-page tab switching)

---

## Charts

All Recharts visualizations follow these rules:

1. **White background** with `shadow-lg` and gray border
2. **Gradient line colors**:
   - Green: `#257D41 → #34D399` (revenue, NOI)
   - Blue: `#3B82F6 → #60A5FA` (GOP, FCF)
   - Coral: `#F4795B → #FB923C` (FCFE, secondary)
3. **Data point dots** on every line:
   ```tsx
   dot={{ fill: '#257D41', stroke: '#fff', strokeWidth: 2, r: 4 }}
   ```
4. **Light gray dashed grid**: `#E5E7EB`, no vertical lines
5. **Line width**: `strokeWidth={3}`

---

## Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Page titles | Playfair Display | 700 | text-3xl |
| Card headings | Playfair Display | 600 | text-lg |
| Labels | Inter | 400 | text-sm |
| Data values | Inter (mono) | 600 | text-sm |
| Body text | Inter | 400 | text-base |

---

## Navigation Sidebar
- Dark glass gradient background
- White text for active items
- Sage green accent for active indicator

## Admin Page

Consolidated admin functionality in single `/admin` route with tabs:
- **Users** — User management (CRUD)
- **Login Activity** — Authentication audit log
- **Verification** — Financial verification runner and results

## Data Test IDs

All interactive elements must have `data-testid` attributes:
- Interactive: `{action}-{target}` (e.g., `button-submit`, `input-email`)
- Display: `{type}-{content}` (e.g., `text-username`, `status-payment`)
- Dynamic: append unique ID (e.g., `card-property-${id}`)

## Related Skills

- **`.claude/skills/button-system.md`** — Full GlassButton variant reference and usage patterns
- **`.claude/skills/tab-bar-system.md`** — DarkGlassTabs + ExportMenu wiring pattern
- **`.claude/skills/exports/SKILL.md`** — Export system methodology, ExportMenu component, format implementations
- **`.claude/skills/page-header.md`** — PageHeader component reference and variant rules
- **`.claude/skills/glass-components.md`** — GlassCard, GlassButton, SaveButton component specs
- **`.claude/skills/property-image-picker.md`** — PropertyImagePicker (upload + AI generate), useGenerateImage hook
