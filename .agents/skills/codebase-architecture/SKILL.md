---
name: codebase-architecture
description: Client-side codebase organization, barrel files, re-export wrappers, helper functions, utility scripts, and module boundaries. Use when restructuring code, adding new modules, or auditing imports.
---

# Codebase Architecture

## Client Folder Structure

```
client/src/
├── components/          # Shared app-level components
│   ├── ui/              # shadcn/ui primitives (Button, Card, Input, Dialog, etc.)
│   ├── admin/           # Admin panel tabs and sub-components
│   ├── dashboard/       # Dashboard tabs (KPIs, charts, export)
│   ├── financial-table/ # Financial statement table components
│   ├── graphics/        # Visual components (motion, cards, 3D)
│   ├── property-detail/ # Property detail sub-views
│   ├── property-edit/   # Property edit form sections
│   ├── property-research/ # Research display components
│   ├── property-finder/ # Property search/finder UI
│   ├── statements/      # Financial statement components
│   ├── settings/        # User settings tabs
│   └── *.tsx            # Top-level shared components (Layout, Breadcrumbs, etc.)
├── features/            # Self-contained feature modules
│   ├── ai-agent/        # Marcela AI (ElevenLabs, voice, chat)
│   └── design-themes/   # Theme management (ThemeManager, ThemePreview)
├── hooks/               # Shared React hooks
├── lib/                 # Utilities, API clients, engine
│   ├── api/             # API client modules (properties, admin, research, etc.)
│   ├── audits/          # Client-side audit/validation utilities
│   ├── exports/         # Export generators (PDF, Excel, PNG, CSV, PPTX)
│   └── financial/       # Financial engine (calculators, types, utils)
└── pages/               # Route-level page components
```

## Module Boundaries

### Rule: features/ = self-contained, components/ = shared
- `features/` modules own their hooks, types, components, and API calls
- `components/` contains shared UI used across multiple pages
- `components/ui/` contains shadcn primitives — never modify these except via shadcn CLI

### Rule: Import direction
- Pages import from features, components, hooks, and lib
- Features may import from lib and components/ui, NOT from other features
- Components may import from lib and components/ui
- lib has no UI imports

## Barrel Files (index.ts)

Barrel files aggregate exports from a directory into a single import path.

| Directory | Barrel | Exports |
|-----------|--------|---------|
| `components/admin/` | `index.ts` | All admin tab components |
| `components/dashboard/` | `index.ts` | Dashboard tabs and hooks |
| `components/financial-table/` | `index.ts` | Row components, table shell |
| `components/property-detail/` | `index.ts` | Detail sub-components |
| `components/property-edit/` | `index.ts` | Edit form sections |
| `components/property-research/` | `index.ts` | Research sub-components |
| `components/property-finder/` | `index.ts` | Finder sub-components |
| `components/settings/` | `index.ts` | Settings tab components |
| `features/ai-agent/` | `index.ts` | ElevenLabsWidget, VoiceChat*, Speaker, Transcriber |
| `features/ai-agent/components/` | `index.ts` | 16+ AI agent UI components |
| `features/ai-agent/hooks/` | `index.ts` | AI agent hooks + query keys |
| `lib/api/` | `index.ts` | API client modules |
| `lib/financial/` | `index.ts` | Financial engine (types, utils, calculators) |
| `lib/exports/` | `index.ts` | Export utilities |
| `lib/exports/excel/` | `index.ts` | Excel-specific exports |

## Thin Re-export Wrappers

These files re-export from a canonical source to provide backward-compatible or convenience import paths. They contain zero logic — pure `export` statements only.

| Wrapper | Source of Truth | Purpose |
|---------|----------------|---------|
| `components/admin/MarcelaTab.tsx` | `./marcela/MarcelaTab` | Barrel convenience |
| `components/admin/marcela/hooks.ts` | `@/features/ai-agent/hooks` | Bridge admin→feature |
| `components/admin/marcela/types.ts` | `features/ai-agent/types` | Bridge admin→feature |
| `components/financial-table-rows.tsx` | `./financial-table/index` | Legacy path |
| `components/ConsolidatedBalanceSheet.tsx` | `./statements/ConsolidatedBalanceSheet` | Legacy path |
| `lib/api.ts` | `./api/index` | Shorthand `@/lib/api` |
| `lib/financialEngine.ts` | `./financial` | Shorthand `@/lib/financialEngine` |
| `lib/exports/excelExport.ts` | `./excel/index` | Legacy path |
| `pages/CheckerManual.tsx` | `./checker-manual/index` | Router entry |

### Wrapper Rules
1. Wrappers must be pure re-exports — no logic, no side effects
2. New code should import from the canonical source, not wrappers
3. Never create new wrappers — use barrel files instead
4. Orphan wrappers (zero importers) should be deleted during cleanup

## Animation Modules

Two complementary animation modules exist:

| Module | Path | Components | Used By |
|--------|------|------------|---------|
| Motion primitives | `components/ui/animated.tsx` | FadeIn, FadeInUp, ScaleIn, SlideIn, StaggerContainer, AnimatedCounter, HoverScale, etc. (12 exports) | 4 files (cards, portfolio) |
| Page transitions | `components/graphics/motion/AnimatedPage.tsx` | AnimatedPage, AnimatedSection, AnimatedGrid, ScrollReveal (5 exports) | 25+ pages |

These are complementary, NOT duplicates. Do not consolidate without checking all consumers.

## Helper Functions & Utilities

### lib/themeUtils.ts — Theme Engine
- `hexToHslString(hex)` — Convert hex to CSS HSL string
- `applyThemeColors(colors)` — Inject DesignColor[] as :root CSS variables
- `resetThemeColors()` — Remove all dynamic theme variables

### lib/financial/ — Financial Engine
Core calculation engine. Never use LLM to compute financial values.
- `financialEngine.ts` → re-exports from `./financial/` (convenience)
- Calculators: loan, cash flow, returns, depreciation, tax
- Types: all financial interfaces

### lib/exports/ — Export Generators
- `pdfChartDrawer.ts` — Draw charts in jsPDF documents
- `pptxExport.ts` — PowerPoint generation
- `pngExport.ts` — PNG table captures via dom-to-image
- `csvExport.ts` — CSV downloads
- `excel/` — Multi-sheet Excel workbooks

### lib/api/ — API Client
- `properties.ts`, `admin.ts`, `research.ts`, `scenarios.ts`, `services.ts`
- `types.ts` — shared API response interfaces

### lib/audits/ — Client-side Validation
- `crossCalculatorValidation.ts` — cross-check financial calculators
- `formulaChecker.ts` — verify formula correctness
- `helpers.ts` — shared audit utilities

## Scripts (`script/`)

| Script | Command | Purpose |
|--------|---------|---------|
| `health.ts` | `npm run health` | tsc + tests + verification |
| `stats.ts` | `npm run stats` | Codebase metrics |
| `audit-quick.ts` | `npm run audit:quick` | Quality scan |
| `test-summary.ts` | `npm run test:summary` | Compact test output |
| `test-file.ts` | `npm run test:file -- <path>` | Single file test |
| `lint-summary.ts` | `npm run lint:summary` | tsc --noEmit check |
| `diff-summary.ts` | `npm run diff:summary` | Git diff stats |
| `build.ts` | `npm run build` | Production build |
| `exports-check.ts` | `npm run exports:check` | Find unused exports |
| `seed-preset-themes.ts` | `npx tsx script/seed-preset-themes.ts` | Seed 5 preset themes |
| `seed-lb-brand-theme.ts` | `npx tsx script/seed-lb-brand-theme.ts` | Seed L+B Brand theme |
| `seed-production.sql` | Manual | Production data sync |
| `manual-sync/` | Manual | 00-06 SQL sync scripts |
| `admin-structure.ts` | Manual | Analyze admin page |
| `marcela-check.ts` | Manual | Check Marcela AI endpoints |
| `marcela-conversations.ts` | Manual | Manage Marcela conversations |
| `create-boutique-logos.ts` | Manual | Seed boutique hotel logos |
| `list-tables.ts` | Manual | List DB tables |

## Cleanup Checklist

When auditing the codebase:
1. Run `npm run exports:check` — find unused exports
2. Search for orphan wrappers: re-export files with zero importers
3. Check `components/` for feature-specific code that should be in `features/`
4. Verify all barrel files export everything from their directory
5. Confirm no `console.log` in production code (except AI agent debug logs)
