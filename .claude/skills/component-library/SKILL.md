---
name: component-library
description: Reusable UI component library reference. Use when building new pages, adding UI elements, or checking which components to use.
---

# Component Library

Every page must use the shared component library. Inline or ad-hoc styling is not permitted.

## Core Components

| Component | File | Purpose |
|-----------|------|---------|
| PageHeader | `client/src/components/ui/page-header.tsx` | Page titles with actions slot |
| GlassButton | `client/src/components/ui/glass-button.tsx` | All buttons (primary, ghost, icon, export, settings) |
| ExportMenu | `client/src/components/ui/export-toolbar.tsx` | Unified export dropdown |
| CurrentThemeTab | `client/src/components/ui/tabs.tsx` | Tab navigation with rightContent slot |
| FinancialChart | `client/src/components/ui/financial-chart.tsx` | Standardized Recharts wrapper |
| FinancialTable | `client/src/components/ui/financial-table.tsx` | Sticky-column financial tables |
| StatCard | `client/src/components/ui/stat-card.tsx` | KPI cards |
| ChartModeToggle | `client/src/components/dashboard/OverviewTab.tsx` | Area/Line chart mode switcher |
| ContentPanel | `client/src/components/ui/content-panel.tsx` | Section wrappers |
| SaveButton | `client/src/components/ui/save-button.tsx` | Save actions with loading state |

## Additional Components

| Component | File | Purpose |
|-----------|------|---------|
| AIImagePicker | `client/src/components/ui/ai-image-picker.tsx` | Three-mode image input (upload, AI generate, URL). Configurable aspect ratio, dark/light variants, default prompt |
| AnimatedLogo | `client/src/components/ui/animated-logo.tsx` | SVG wrapper for raster images with animation support (pulse, glow, spin, bounce) |
| StatusBadge | `client/src/components/ui/status-badge.tsx` | Colored dot + label for status display (active, inactive, pending, error, warning) |
| ImagePreviewCard | `client/src/components/ui/image-preview-card.tsx` | Card with image, overlay title/subtitle, hover action buttons |
| EntityCardContainer | `client/src/components/ui/entity-card.tsx` | Responsive grid container for entity cards |
| EntityCardItem | `client/src/components/ui/entity-card.tsx` | Individual entity card with image, title, actions |
| EntityEmptyState | `client/src/components/ui/entity-card.tsx` | Empty-state placeholder for entity grids |
| HelpTooltip | `client/src/components/ui/help-tooltip.tsx` | **?** icon with hover tooltip for input field explanations |
| InfoTooltip | `client/src/components/ui/info-tooltip.tsx` | **i** icon for read-only value explanations with optional formula display |

## Usage Rules

- All buttons → GlassButton (never raw `<button>`)
- All pages → PageHeader (never inline titles)
- All export → ExportMenu (never custom export UI)
- All save/update buttons must say "Save" (never "Update")
- All interactive/display elements → `data-testid` attribute required
- No mock or placeholder data in production paths

## Export System

Full docs: `.claude/skills/exports/SKILL.md`

To add exports to any page:
1. Import ExportMenu and action helpers from `@/components/ui/export-toolbar`
2. Import export utilities from `@/lib/exports`
3. Create handlers that return `{ years: string[], rows: SlideTableRow[] }`
4. Wire handlers using `pdfAction`, `excelAction`, `csvAction`, `pptxAction`, `chartAction`, `pngAction`
5. Place ExportMenu in `CurrentThemeTab.rightContent` or `PageHeader.actions`

## Design System

Full docs: `.claude/skills/design-system/SKILL.md`

Quick reference:
- Sage Green `#9FBCA4`, Secondary Green `#257D41`, Off-White `#FFF9F5`, Coral `#F4795B`, Dark Navy `#1A2A3A`
- Dark glass for dashboards/entity views; light for assumptions/research/discovery
- Playfair Display for headings, Inter for UI/data text

## Special Effects (Magic UI)

9 special-effects components from Magic UI. All in `client/src/components/ui/`. Full reference: `.claude/skills/ui/magic-ui.md`

| Component | Import | Use For |
|-----------|--------|---------|
| `Particles` | `@/components/ui/particles` | Interactive particle backgrounds |
| `NumberTicker` | `@/components/ui/number-ticker` | Animated financial numbers (preferred over `AnimatedCounter`) |
| `BlurFade` | `@/components/ui/blur-fade` | Blur-in section reveals |
| `ShimmerButton` | `@/components/ui/shimmer-button` | Shimmer CTA buttons |
| `AnimatedGradientText` | `@/components/ui/animated-gradient-text` | Gradient-shift headings |
| `Ripple` | `@/components/ui/ripple` | Idle/loading waiting states |
| `AuroraText` | `@/components/ui/aurora-text` | Aurora color-shift hero headings |
| `AnimatedBeam` | `@/components/ui/animated-beam` | SVG beams between elements |
| `Meteors` | `@/components/ui/meteors` | Falling-streak card backgrounds |

## UI Component Skills

Individual component skills live in `.claude/skills/ui/`:

accordion-formula-rows, animation-patterns, button-system, calculation-transparency,
callout, charts, composite-tabbed-pages, entity-cards, financial-table-styling,
glass-components, graphics-component-catalog, help-tooltip, info-icons, interactions,
magic-ui, manual-table, navigation, notification-center, page-enhancement-checklist,
page-header, portfolio-pages, property-image-picker, research-badges, reusable-components,
section-card, slider, tab-bar-system, theme-engine
