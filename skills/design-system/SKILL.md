---
name: design-system
description: L+B Hospitality Group UI design system reference. Use when building or modifying UI pages, creating new components, or ensuring visual consistency across the application. Covers color palette, typography, component catalog, layout patterns, and usage examples.
---

# L+B Hospitality Group Design System

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Sage Green | `#9FBCA4` | Primary brand, accents, borders, glows |
| Deep Green | `#257D41` | Revenue/positive indicators, icon fills |
| Gradient Green | `#34D399` | Gradient endpoints for revenue series |
| Blue | `#3B82F6` | Secondary data series (GOP, expenses) |
| Coral | `#F4795B` | Tertiary data series (NOI, FCFE), CTAs |
| Dark Blue-Gray | `#2d4a5e` | Navigation gradient start, dark text |
| Mid Blue-Gray | `#3d5a6a` | Navigation gradient mid |
| Teal-Gray | `#3a5a5e` | Navigation gradient end |
| Warm Off-White | `#FFF9F5` | Text on dark backgrounds |
| White | `#FFFFFF` | Light background surfaces |
| Near-Black | `#0a0a0f` | Dark panel backgrounds |

## Typography

- **Headings**: `font-display` (Playfair Display, serif)
- **UI/Data**: `font-sans` (Inter)
- **Monospace numbers**: `font-mono` class on any numeric value

## Theme Modes

### Dark Glass (main application pages)
- Background: gradient `from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e]`
- Cards: `GlassCard` with `backdrop-blur-xl` and white/10 borders
- Text: `text-[#FFF9F5]` primary, `text-[#FFF9F5]/60` secondary
- Buttons: `GlassButton` with frosted glass effect

### Light (assumption/research/documentation pages)
- Background: white or `bg-gray-50`
- Cards: `bg-white` with `border-gray-100` and light shadows
- Text: `text-gray-900` primary, `text-gray-500` secondary
- Charts sit inside white panels with light gray borders

## Component Catalog

### Layout Components

#### `PageHeader` — `client/src/components/ui/page-header.tsx`
Consistent page title bar. Required on every page.
```tsx
<PageHeader
  title="Portfolio Dashboard"
  subtitle="10-Year Projection | 5 Properties"
  backLink="/dashboard"
  variant="dark"  // "dark" (default) | "light"
  actions={<ExportToolbar actions={[pdfAction(fn), excelAction(fn)]} />}
/>
```

#### `ContentPanel` — `client/src/components/ui/content-panel.tsx`
Wraps content sections with consistent styling.
```tsx
<ContentPanel title="Income Statement" subtitle="Annual" variant="light">
  {children}
</ContentPanel>
<ContentPanel variant="dark" padded={false}>
  {children}
</ContentPanel>
```

#### `GlassCard` — `client/src/components/ui/glass-card.tsx`
Dark glass card for dark-themed pages. Variants: `default`, `success`, `warning`, `chart`.
```tsx
<GlassCard variant="chart">
  <h3 className="text-lg font-display text-[#FFF9F5]">Title</h3>
  {content}
</GlassCard>
```

### Data Display Components

#### `FinancialChart` — `client/src/components/ui/financial-chart.tsx`
Standardized Recharts line chart with preset color gradients and formatting.

**Preset series keys**: `revenue`, `gop`, `noi`, `expenses`, `netIncome`, `cashFlow`, `fcfe`, `btcf`, `atcf`

```tsx
import { FinancialChart } from "@/components/ui/financial-chart";

<FinancialChart
  data={yearlyChartData}
  series={["revenue", "gop", "noi"]}        // preset keys
  title="Income Statement Trends"
  subtitle="10-Year Projection"
  height={300}
  xAxisKey="year"
  chartRef={chartRef}
/>

// Custom series:
<FinancialChart
  data={data}
  series={[
    { dataKey: "Custom", name: "Custom Metric", color: "#8B5CF6", gradientTo: "#A78BFA" }
  ]}
/>
```

#### `FinancialTable` — `client/src/components/ui/financial-table.tsx`
Financial data table with sticky label column, section grouping, and money formatting.
```tsx
import { FinancialTable } from "@/components/ui/financial-table";

<FinancialTable
  title="Income Statement"
  columns={["Year 1", "Year 2", "Year 3"]}
  stickyLabel="Category"
  variant="light"  // "light" | "dark"
  rows={[
    { label: "Revenue", values: [1000000, 1100000, 1200000], isSection: true },
    { label: "Room Revenue", values: [800000, 880000, 960000], indent: 1 },
    { label: "F&B Revenue", values: [200000, 220000, 240000], indent: 1 },
    { label: "Total Revenue", values: [1000000, 1100000, 1200000], isTotal: true },
    { label: "", values: [], isSeparator: true },
    { label: "Net Operating Income", values: [400000, 450000, 500000], bold: true },
  ]}
/>
```

Row options: `indent` (number), `bold`, `isSection`, `isSeparator`, `isSubtotal`, `isTotal`, `negative`, `formatAsPercent`.

#### `StatCard` — `client/src/components/ui/stat-card.tsx`
KPI/metric display card. Three variants for different contexts.
```tsx
import { StatCard } from "@/components/ui/stat-card";

<StatCard label="Total Revenue" value={5000000} format="money" variant="glass" />
<StatCard label="Portfolio IRR" value={18.5} format="percent" variant="sage" trend="up" />
<StatCard label="Properties" value={5} format="number" variant="light" icon={<Building />} />
```

### Action Components

#### `GlassButton` — `client/src/components/ui/glass-button.tsx`
Primary action button for dark-themed pages.
Variants: `default`, `primary`, `ghost`, `icon`, `export`, `settings`.
```tsx
<GlassButton variant="primary" size="lg">Save Changes</GlassButton>
<GlassButton variant="icon" size="icon"><Settings /></GlassButton>
```

#### `SaveButton` — `client/src/components/ui/save-button.tsx`
Specialized save button with loading/success states.

#### `ExportMenu` — `client/src/components/ui/export-toolbar.tsx`
Single "Export" dropdown button with format picker. Glass and light variants. Replaces `ExportToolbar`.
```tsx
import { ExportMenu, pdfAction, excelAction, csvAction, pptxAction, chartAction, pngAction } from "@/components/ui/export-toolbar";

<ExportMenu
  variant="glass"  // "glass" | "light"
  actions={[
    pdfAction(() => exportPDF()),
    excelAction(() => exportExcel()),
    csvAction(() => exportCSV()),
    pptxAction(() => exportPPTX()),
    chartAction(() => exportChart()),
    pngAction(() => exportPng()),
  ]}
/>
```

Helper factories: `pdfAction(fn)`, `excelAction(fn)`, `csvAction(fn)`, `pptxAction(fn)`, `chartAction(fn)`, `pngAction(fn)`.

See `.claude/skills/exports/SKILL.md` for full export system documentation including PowerPoint generation.

### Utility Components

#### `Money` — `client/src/components/Money.tsx`
Inline formatted currency display. Always use for money values.
```tsx
<Money value={1234567.89} />  // renders $1,234,567.89
```

#### `HelpTooltip` — `client/src/components/ui/help-tooltip.tsx`
Info icon with hover tooltip for explaining assumptions or metrics.

## Chart Standards

All financial charts follow these conventions:
- White background with light gray dashed grid (`strokeDasharray="3 3"`)
- Horizontal gradient line strokes (color → lighter)
- White dot fills with colored borders (`r: 4`, `strokeWidth: 2`)
- Active dots slightly larger (`r: 6`)
- Y-axis formatted as `$1.2M` or `$500K`
- Tooltip shows full currency format via `formatMoney()`
- Legend with circle icons, gray text

Use `FinancialChart` with preset series keys to get all of this automatically.

## Tab System

Use `DarkGlassTabs` from `client/src/components/ui/tabs.tsx` for tabbed navigation on dark pages.

## Page Structure Pattern

```tsx
export default function MyPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Page Title"
          subtitle="Description"
          actions={<ExportToolbar actions={[...]} />}
        />
        <DarkGlassTabs ... />
        <TabsContent value="tab1" className="space-y-6">
          <FinancialChart data={...} series={[...]} title="..." />
          <FinancialTable rows={...} columns={...} title="..." />
        </TabsContent>
      </div>
    </Layout>
  );
}
```

## data-testid Convention

All interactive/meaningful elements need a `data-testid`:
- Buttons: `button-{action}` (e.g., `button-export-pdf`)
- Inputs: `input-{field}` (e.g., `input-adr`)
- Cards: `card-{type}-{id}` (e.g., `card-property-123`)
- Display values: `text-{metric}` (e.g., `text-total-revenue`)
