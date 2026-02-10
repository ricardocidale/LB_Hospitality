# Hospitality Business Group — Project Instructions

## Project Summary
Business simulation portal for Hospitality Business Group. Models a boutique hospitality management company alongside individual property SPVs with monthly and yearly financial projections. The system is GAAP-compliant (ASC 230, ASC 360, ASC 470), applies IRS depreciation rules, and includes an internal audit and verification engine designed to support PwC-level review rigor. Five mandatory business rules are enforced across all scenarios.

## Tech Stack
Frontend: React 18, TypeScript, Wouter routing, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts  
Backend: Node.js, Express 5, TypeScript (ESM), Drizzle ORM, PostgreSQL  
Build: Vite (client), esbuild (server)

## Key Architecture Decisions

### Two-Entity Financial Model
1. Management Company  
   Maintains its own Income Statement, Cash Flow Statement, Balance Sheet, and FCF/IRR. Generates revenue through management and service fees charged to properties.
2. Property Portfolio  
   Each property is modeled as an independent SPV with its own full financial statements and returns. The system also produces aggregated and consolidated portfolio views.

### Reusable Component Library
Every page must use the shared component library. Inline or ad-hoc styling is not permitted.

| Component | File | Purpose |
|---------|------|---------|
| PageHeader | client/src/components/ui/page-header.tsx | Page titles with actions slot |
| GlassButton | client/src/components/ui/glass-button.tsx | All buttons (primary, ghost, icon, export, settings) |
| ExportMenu | client/src/components/ui/export-toolbar.tsx | Unified export dropdown |
| DarkGlassTabs | client/src/components/ui/tabs.tsx | Tab navigation with rightContent slot |
| FinancialChart | client/src/components/ui/financial-chart.tsx | Standardized Recharts wrapper |
| FinancialTable | client/src/components/ui/financial-table.tsx | Sticky-column financial tables |
| StatCard | client/src/components/ui/stat-card.tsx | KPI cards |
| ContentPanel | client/src/components/ui/content-panel.tsx | Section wrappers |
| SaveButton | client/src/components/ui/save-button.tsx | Save actions with loading state |

### Export System (Reusable Pattern)
The export system is a core reusable pattern across all data-driven pages. Full documentation lives in `.claude/skills/exports/SKILL.md`.

Component: ExportMenu — a single “Export” dropdown supporting PDF, Excel, CSV, PPTX, chart PNG, and table PNG.

To add exports to any page:
1. Import ExportMenu and action helpers from `@/components/ui/export-toolbar`
2. Import export utilities from `@/lib/exports`
3. Create handlers that return `{ years: string[], rows: SlideTableRow[] }`
4. Wire handlers using `pdfAction`, `excelAction`, `csvAction`, `pptxAction`, `chartAction`, `pngAction`
5. Place ExportMenu in `DarkGlassTabs.rightContent` or `PageHeader.actions`

Export utilities live in `client/src/lib/exports/` and include Excel, PPTX, PDF chart, PNG, and barrel exports.

### Design System
Authoritative reference: `.claude/skills/design-system/SKILL.md`

Color palette:  
Sage Green `#9FBCA4`, Secondary Green `#257D41`, Off-White `#FFF9F5`, Coral `#F4795B`, Dark Navy `#1A2A3A`

Page themes:  
Dark glass for dashboards and entity views; light for assumptions, research, and discovery pages.

Typography:  
Playfair Display for headings, Inter for UI and data text.

### Financial Engine
Core financial logic resides in:
- `client/src/lib/financialEngine.ts`
- `client/src/lib/loanCalculations.ts`
- `client/src/lib/constants.ts`

The engine produces monthly pro formas with yearly aggregation. Depreciation defaults to 27.5-year straight-line with configurable land value percentage and fiscal year start.

### Verification and Audit
The verification system enforces GAAP consistency and internal invariants:
- `client/src/lib/financialAuditor.ts`
- `client/src/lib/runVerification.ts`

Coverage includes timing, depreciation, loans, income statement, balance sheet, cash flow, and management fees. Outputs UNQUALIFIED, QUALIFIED, or ADVERSE opinions.

## AI Research
Research skills are defined in `.claude/skills/research/` with co-located tool schemas in each skill's `tools/` subfolder. Orchestrated via `server/aiResearch.ts` with data-driven tool prompts and dev-mode cache bypass. Outputs include structured market, ADR, occupancy, cap rate, catering, competitive set, event demand, and land value analyses.

- **Seed Data**: Pre-seeded research data for all 5 properties, auto-seeded on startup.
- **Auto-Refresh on Login**: `ResearchRefreshOverlay` component detects seed data (`llmModel === "seed-data"`) and automatically regenerates it with a 3D animated overlay when users log in. Research data older than 7 days is also refreshed. Skill docs: `.claude/skills/research/auto-refresh/SKILL.md`.

## Automated Financial Proof System
- **Purpose**: Eliminates human Excel verification. Code proves itself correct.
- **Test Files**: `tests/proof/scenarios.test.ts` (5 golden scenarios), `tests/proof/hardcoded-detection.test.ts` (magic number scanner), `tests/proof/reconciliation-report.test.ts` (artifact generator).
- **Verify Runner**: `tests/proof/verify-runner.ts` — 4-phase orchestrator (scenarios → hardcoded detection → reconciliation → artifact summary).
- **Artifacts**: `test-artifacts/` — JSON + Markdown reconciliation reports for each scenario.
- **Test Count**: 384 total tests (315 existing + 40 proof tests + 29 input verification tests).
- **Commands**: `npm test` (all tests), `npx tsx tests/proof/verify-runner.ts` (full verification).
- **Skill Docs**: `.claude/skills/finance/automated-proof-system.md`.

## 3D Graphics & Animation
- **3D Engine**: Three.js via @react-three/fiber, @react-three/drei, @react-three/postprocessing.
- **Animation**: framer-motion for entrance animations, transitions, and staggered reveals.
- **Components**:
  - `Dashboard3DBackground` (`client/src/components/Dashboard3DBackground.tsx`) — Three.js spheres, rings, and particles behind the dashboard.
  - `Login3DScene` (`client/src/components/Login3DScene.tsx`) — Glowing orbs, orbital rings, floating dots, and stars on the login page.
  - `animated.tsx` (`client/src/components/ui/animated.tsx`) — Reusable framer-motion wrappers: `FadeIn`, `FadeInUp`, `ScaleIn`, `StaggerContainer`, `PageTransition`.
- **Usage Pattern**: 3D scenes are overlaid as background layers (pointer-events-none). Animated wrappers enhance page content with entrance effects.

## Database Environments
- **Separate Databases**: Development and Production PostgreSQL databases with distinct data.
- **Syncing Production Data**: Manual process involving identifying differences, writing SQL UPDATE statements, and executing them in the Production Database shell.

## Tool Schema Categories
Tool schemas are organized in two locations:

**`.claude/tools/`** — Non-research tool schemas by category:
- **analysis/** — Statement consolidation, scenario comparison, break-even analysis
- **financing/** — DSCR, debt yield, prepayment, sensitivity, loan comparison, FSA
- **property-finder/** — URL validation, property search, favorites management
- **returns/** — DCF/NPV, IRR cash flow vector, equity multiple, exit valuation
- **validation/** — Financial identity checks, funding gates, debt schedule reconciliation, assumption consistency, export verification

**`.claude/skills/research/*/tools/`** — Research tool schemas co-located with their skills:
- `market-overview/tools/` — analyze_market
- `adr-analysis/tools/` — analyze_adr
- `occupancy-analysis/tools/` — analyze_occupancy
- `event-demand/tools/` — analyze_event_demand
- `catering-analysis/tools/` — analyze_catering
- `cap-rate-analysis/tools/` — analyze_cap_rates
- `competitive-set/tools/` — analyze_competitive_set
- `land-value/tools/` — analyze_land_value

**`.claude/skills/property-finder/tools/`** — Property finder tool schemas:
- `validate-listing-url.json` — validate_listing_url (format-based realtor.com URL validation)
- `search-properties.json` — search_properties (RapidAPI Realty in US integration)
- `manage-favorites.json` — manage_favorites (CRUD for saved properties)

## File Organization

```
client/src/
├── components/
│   ├── ui/                    # Reusable component library
│   │   └── animated.tsx       # framer-motion wrappers (FadeIn, FadeInUp, ScaleIn, etc.)
│   ├── Dashboard3DBackground.tsx  # Three.js dashboard background
│   ├── Login3DScene.tsx           # Three.js login background
│   └── ResearchRefreshOverlay.tsx # Auto-refresh 3D overlay
├── lib/
│   ├── exports/           # Excel, PPTX, PDF, PNG export utilities
│   ├── financialEngine.ts # Primary calculation engine
│   ├── loanCalculations.ts
│   ├── equityCalculations.ts
│   ├── cashFlowAggregator.ts
│   ├── cashFlowSections.ts
│   ├── yearlyAggregator.ts
│   ├── constants.ts       # All named constants and defaults
│   ├── financialAuditor.ts
│   └── runVerification.ts
├── pages/
└── hooks/

tests/proof/
├── scenarios.test.ts          # 5 golden scenario tests
├── input-verification.test.ts # Revenue, cost, ADR, occupancy, escalation, refi verification
├── hardcoded-detection.test.ts # Magic number scanner (8 finance files)
├── reconciliation-report.test.ts # Artifact generator
├── verify-runner.ts           # 4-phase orchestrator
└── NO_EXCEL_GUARANTEE.md      # 31-item guarantee checklist enforced by code

test-artifacts/                # Generated reconciliation reports (JSON + Markdown)

.claude/
├── claude.md              # This file (project instructions)
├── commands/              # Slash commands for Claude Code
├── manuals/
│   ├── checker-manual/    # Verification procedures (admin/checker)
│   │   ├── skills/        # Narrative explanations (15 sections)
│   │   ├── formulas/      # Pure formula references (5 entity files)
│   │   └── tools/         # Validation check schemas (JSON)
│   └── user-manual/       # Financial model docs (all users)
│       └── skills/        # Narrative content (16 sections)
├── rules/                 # Coding rules and constraints
├── skills/
│   ├── design-system/     # Color, typography, component catalog
│   ├── exports/           # Export system methodology
│   ├── features/          # Feature-specific skills
│   ├── finance/           # 17 finance calculation skills
│   ├── property-finder/   # External property search, URL validation, favorites (with co-located tools/)
│   ├── research/          # AI research skills (each with co-located tools/)
│   └── ui/                # UI component skills
└── tools/
    ├── analysis/          # Consolidation, scenario comparison, break-even
    ├── financing/         # Financing tool schemas (DSCR, sensitivity, loan comparison)
    ├── property-finder/   # URL validation, property search, favorites management
    ├── returns/           # DCF/NPV, IRR vector, equity multiple, exit valuation
    └── validation/        # Financial identities, funding gates, debt reconciliation, assumptions, exports

server/
├── routes.ts
├── storage.ts
└── aiResearch.ts

calc/                      # Standalone calculation modules
├── shared/pmt.ts          # PMT formula
└── refinance/             # Refinance calculator

analytics/
└── returns/irr.ts         # IRR computation (Newton-Raphson)
```


## Conventions
All monetary values must be formatted with currency precision and thousands separators. All interactive and display elements require `data-testid`. No mock or placeholder data is permitted in production paths. All buttons must use GlassButton. All pages must use PageHeader. All export functionality must use ExportMenu. Legacy import paths are preserved via re-export barrels.

Agent persona: `.claude/rules/agent-persona.md` is mandatory behavior for all finance and statement work.

Audit doctrine: `.claude/rules/audit-doctrine.md` defines what an “audit” must cover (math, variables, workflows, reports, code risks, and GAAP). For any request using the word “audit,” follow that doctrine and its output format.

Audits must explicitly check for hardcoded values in calculation paths and monthly→yearly rollup correctness.


## Authoritative Finance Skill Specification

Finance authority tool: `.claude/tools/financing/financial_standards_authority.json` (tool name: `get_financial_standards_authority`). For any finance/stats/consolidation/refi work, consult this tool output before implementing classification-sensitive logic.

The finance skills directory `.claude/skills/finance/` contains 17 individual skill files that collectively define:
- Income Statement, Cash Flow Statement, Balance Sheet construction
- Financing, refinancing, and funding/tranche logic
- Fee linkage between properties and management company
- FCF, IRR, and DCF calculations
- Validation identities and cross-statement references
- Timing and activation rules

When working on any finance-related code:
- Claude must consult the relevant skill file(s) in `.claude/skills/finance/` before making changes
- Claude must explicitly state the Active Skill before making changes
- Claude must not modify accounting logic outside the allowed scope of the Active Skill
- Violations must be reported and explained, not silently corrected
- Finance changes must pass the verification engine with an UNQUALIFIED result, or clearly explain why verification cannot yet be run

Before implementing finance changes, Claude must state the Active Skill being used
(e.g., Finance.RefinanceCalculator) and the allowed write scope for that task.

Finance changes must run verification:
- `client/src/lib/runVerification.ts` (or equivalent) must pass with UNQUALIFIED.
If verification cannot be run, Claude must state why and provide a minimal reproduction plan.
