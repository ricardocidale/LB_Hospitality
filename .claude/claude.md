# L+B Hospitality Group — Project Instructions

## Project Summary

Business simulation portal for L+B Hospitality Group. Models boutique hotel management company + individual property SPVs with monthly/yearly financial projections. GAAP-compliant (ASC 230, ASC 360, ASC 470) with IRS depreciation rules. PwC-level audit engine. Five mandatory business rules enforced.

## Tech Stack

- **Frontend**: React 18 + TypeScript, Wouter routing, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts
- **Backend**: Node.js + Express 5, TypeScript ESM, Drizzle ORM, PostgreSQL
- **Build**: Vite (client), esbuild (server)

## Key Architecture Decisions

### Two-Entity Financial Model
1. **Management Company** — Income Statement, Cash Flow, Balance Sheet, FCF/IRR. Revenue from fees.
2. **Property Portfolio** — Each property is an independent SPV. Aggregated + individual views.

### Reusable Component Library

Every page MUST use the shared component library. No inline/ad-hoc styling.

| Component | File | Purpose |
|-----------|------|---------|
| `PageHeader` | `client/src/components/ui/page-header.tsx` | Page titles with actions slot |
| `GlassButton` | `client/src/components/ui/glass-button.tsx` | All buttons (primary, ghost, icon, export, settings) |
| `ExportMenu` | `client/src/components/ui/export-toolbar.tsx` | Unified export dropdown (PDF, Excel, CSV, PPTX, Chart PNG, Table PNG) |
| `DarkGlassTabs` | `client/src/components/ui/tabs.tsx` | Tab navigation with rightContent slot for exports |
| `FinancialChart` | `client/src/components/ui/financial-chart.tsx` | Standardized Recharts wrapper |
| `FinancialTable` | `client/src/components/ui/financial-table.tsx` | Sticky-column financial tables |
| `StatCard` | `client/src/components/ui/stat-card.tsx` | KPI cards (glass/light/sage variants) |
| `ContentPanel` | `client/src/components/ui/content-panel.tsx` | Section wrappers (light/dark) |
| `SaveButton` | `client/src/components/ui/save-button.tsx` | Save actions with loading state |

### Export System (Reusable Pattern)

The export system is the primary reusable pattern across all data pages. Full documentation: `.claude/skills/exports/SKILL.md`.

**Component**: `ExportMenu` — single "Export" dropdown button providing 6 formats.

**How to add exports to any page:**
1. Import `ExportMenu` and action helpers from `@/components/ui/export-toolbar`
2. Import export utilities from `@/lib/exports`
3. Create handler functions that produce `{ years: string[], rows: SlideTableRow[] }`
4. Wire handlers to action helpers: `pdfAction(fn)`, `excelAction(fn)`, `csvAction(fn)`, `pptxAction(fn)`, `chartAction(fn)`, `pngAction(fn)`
5. Place `ExportMenu` in `DarkGlassTabs.rightContent` (tabbed pages) or `PageHeader.actions` (non-tabbed pages)

**Export utilities** (`client/src/lib/exports/`):
- `excelExport.ts` — XLSX workbooks with currency/percent formatting (SheetJS)
- `pptxExport.ts` — Branded PowerPoint slides with metric cards and tables (pptxgenjs)
- `pdfChartDrawer.ts` — Line charts rendered into jsPDF documents
- `pngExport.ts` — DOM-to-image table/chart capture (dom-to-image-more)
- `index.ts` — Barrel re-exports for clean imports

**Sub-skill docs**: `.claude/skills/exports/excel-export.md`, `pptx-export.md`, `pdf-chart-export.md`, `png-export.md`

### Design System

Full reference: `.claude/rules/ui-design.md`

**Color palette**: Sage Green `#9FBCA4`, Secondary Green `#257D41`, Off-White `#FFF9F5`, Coral `#F4795B`, Dark Navy `#1a2a3a`.

**Page themes**:
- Dark glass: Dashboard, PropertyDetail, Company, Admin
- Light: Assumption pages, Research pages, PropertyFinder

**Typography**: Playfair Display (serif headings), Inter (UI/data text).

### Financial Engine

- Located in `client/src/lib/financialEngine.ts`
- Monthly pro formas → yearly aggregation
- Constants in `client/src/lib/constants.ts` (single source of truth for all `DEFAULT_*` values)
- Loan calculations in `client/src/lib/loanCalculations.ts`
- 27.5-year straight-line depreciation, configurable land value %, fiscal year start month

### AI Research

- Skills: `.claude/skills/property-market-research.md`, `company-research.md`, `global-research.md`
- Tools: `.claude/tools/*.json` (Claude function schemas)
- Orchestration: `server/aiResearch.ts`
- Output schema: `marketOverview`, `adrAnalysis`, `occupancyAnalysis`, `capRateAnalysis`, etc.

### Verification & Audit

- `client/src/lib/financialAuditor.ts` + `runVerification.ts`
- Covers: Timing, Depreciation, Loans, Income Statement, Balance Sheet, Cash Flow, Fees
- Output: UNQUALIFIED / QUALIFIED / ADVERSE opinions

## File Organization

```
client/src/
├── components/ui/          # Reusable UI components (ExportMenu, GlassButton, etc.)
├── lib/
│   ├── exports/            # Export format implementations
│   │   ├── excelExport.ts
│   │   ├── pptxExport.ts
│   │   ├── pdfChartDrawer.ts
│   │   ├── pngExport.ts
│   │   └── index.ts        # Barrel re-exports
│   ├── financialEngine.ts  # Core financial calculations
│   ├── loanCalculations.ts # Debt/equity/refinancing logic
│   ├── constants.ts        # All DEFAULT_* values
│   ├── financialAuditor.ts # GAAP verification engine
│   └── runVerification.ts  # Verification runner
├── pages/                  # Route pages
└── hooks/                  # Custom React hooks

.claude/
├── claude.md               # This file — project instructions
├── rules/                  # Coding rules (architecture, UI, financial engine, etc.)
├── skills/                 # Reusable skill documentation
│   ├── exports/            # Export system skill + sub-skills
│   │   ├── SKILL.md        # Main export methodology
│   │   ├── excel-export.md
│   │   ├── pptx-export.md
│   │   ├── pdf-chart-export.md
│   │   └── png-export.md
│   └── *.md                # Other skills (charts, buttons, research, etc.)
└── tools/                  # Claude function tool schemas for AI research

server/
├── routes.ts               # Express API routes
├── storage.ts              # Database CRUD interface
└── aiResearch.ts           # AI research orchestration
```

## Conventions

- Format all monetary values with commas and currency precision
- Use `data-testid` on all interactive and display elements
- No mock/placeholder data in production paths
- All buttons must use `GlassButton` — no raw `<button>` with inline styles
- All pages must use `PageHeader` — no ad-hoc header markup
- All export functionality must use `ExportMenu` — no scattered export buttons
- Legacy import paths preserved via re-export files (`@/lib/excelExport` → `@/lib/exports/excelExport`)
