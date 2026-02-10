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
| DarkGlassTabs | `client/src/components/ui/tabs.tsx` | Tab navigation with rightContent slot |
| FinancialChart | `client/src/components/ui/financial-chart.tsx` | Standardized Recharts wrapper |
| FinancialTable | `client/src/components/ui/financial-table.tsx` | Sticky-column financial tables |
| StatCard | `client/src/components/ui/stat-card.tsx` | KPI cards |
| ContentPanel | `client/src/components/ui/content-panel.tsx` | Section wrappers |
| SaveButton | `client/src/components/ui/save-button.tsx` | Save actions with loading state |

## Usage Rules

- All buttons → GlassButton (never raw `<button>`)
- All pages → PageHeader (never inline titles)
- All export → ExportMenu (never custom export UI)
- All interactive/display elements → `data-testid` attribute required
- No mock or placeholder data in production paths

## Export System

Full docs: `.claude/skills/exports/SKILL.md`

To add exports to any page:
1. Import ExportMenu and action helpers from `@/components/ui/export-toolbar`
2. Import export utilities from `@/lib/exports`
3. Create handlers that return `{ years: string[], rows: SlideTableRow[] }`
4. Wire handlers using `pdfAction`, `excelAction`, `csvAction`, `pptxAction`, `chartAction`, `pngAction`
5. Place ExportMenu in `DarkGlassTabs.rightContent` or `PageHeader.actions`

## Design System

Full docs: `.claude/skills/design-system/SKILL.md`

Quick reference:
- Sage Green `#9FBCA4`, Secondary Green `#257D41`, Off-White `#FFF9F5`, Coral `#F4795B`, Dark Navy `#1A2A3A`
- Dark glass for dashboards/entity views; light for assumptions/research/discovery
- Playfair Display for headings, Inter for UI/data text

## UI Component Skills

Individual component skills live in `.claude/skills/ui/`:
- button-system, callout, charts, financial-table-styling, glass-components
- help-tooltip, manual-table, page-header, research-badges, section-card
- slider, tab-bar-system
