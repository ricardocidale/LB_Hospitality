# Hospitality Business Group - Business Simulation Portal

## Overview
Business simulation portal for a boutique hotel management company. Financial modeling, portfolio management, and GAAP-compliant pro formas for hospitality assets across North America and Latin America. Branded "powered by Norfolk AI" (discrete, 9px, low opacity).

## User Preferences
- Communication style: Simple, everyday language. Ask clarifying questions before implementing.
- **TOP PRIORITY: Calculations and correct reports always highest priority.** 445-test proof system must always pass.
- Always format money as currency. Company name is "Hospitality Business Group" (never "L+B Hospitality").
- All skills stored under `.claude/`. All UI must reference a theme via the theme engine.
- Always keep `replit.md` in sync with `.claude/claude.md` — they must reflect the same project state.
- New UI features get their own skill file in `.claude/skills/ui/`.
- Create skills when they can help divide tasks and reduce context. Always in `.claude/`.
- When updating features, always update the corresponding skills and manuals documentation.

## Current Theme
**Fluid Glass** is the active theme. All new UI work must follow Fluid Glass styling conventions.

## Testing & Proof System (445 Tests, 42 Files)

| Entity Level | Test Domains | Skill |
|-------------|-------------|-------|
| Individual Property | IS, CF, BS, trial balance, reconciliation, ASC 230 identities, pro forma golden | `testing/property-statements.md` |
| Consolidated Portfolio | Portfolio aggregation, intercompany eliminations, portfolio IRR | `testing/consolidated-statements.md` |
| Management Company | Company pro forma, fee linkage, funding instruments, cash balance | `testing/management-company.md` |
| Returns Analysis | IRR, NPV, MOIC, sensitivity, portfolio IRR, refi/exit vectors | `testing/analysis-returns.md` |
| DCF/FCF Analysis | FCF computation, FCFE two-method reconciliation | `testing/analysis-dcf-fcf.md` |
| Financing & Debt | Acquisition sizing, closing costs, refi schedule, funding engine | `testing/financing-refinance-funding.md` |

**Commands**: `npm test` (all 445), `npm run verify` (4-phase, UNQUALIFIED required)

## Recent Changes
- **Testing Skills Suite**: New `.claude/skills/testing/` directory with 7 skill files documenting test coverage for every financial statement and analysis at property, consolidated, and management company levels.
- **Accordion Chevron Standardization**: All expandable/accordion row indicators standardized to the same size across the entire app.
- **Unified Analysis Page**: `/analysis` route merges Sensitivity, Financing, Executive Summary, Compare, and Timeline into a single tabbed page. Components use `embedded` prop to skip Layout wrapper. Old standalone routes (`/compare`, `/timeline`) redirect to `/analysis`.
- **Map View in Properties**: Map View is now a tab inside the Properties page (`/portfolio`) instead of a separate sidebar item.
- **Admin 3D Redesign**: Admin dashboard upgraded with floating glass panel 3D background, glassmorphism stat cards with gradient borders, polished AdminCard with hover lift/glow effects.
- **Composite Tabbed Pages Skill**: New skill (`.claude/skills/ui/composite-tabbed-pages.md`) documenting the pattern for merging standalone pages into unified tabbed views.
- **Asset Descriptions**: Admin-managed asset descriptions (asset_descriptions table) with per-user assignment. Seeded: "Boutique Hotel", "Exotic Experience Hotel". Extended `/api/my-branding` returns logo, theme, and asset description with default fallbacks.
- **Sidebar Visibility**: Admin-controlled sidebar navigation. 9 boolean fields in global_assumptions control which optional nav items appear for non-admin users. Layout uses `sb()` helper for filtering.
- **Calculation Transparency Toggles**: Two on/off switches in Settings > Other tab control visibility of formula help icons and expandable accordion rows.
- **Accordion Formula Rows**: Expandable rows in income statements showing step-by-step calculation breakdowns.
- **Funding Instrument Rename**: All UI labels changed from hardcoded "SAFE" to dynamic `fundingSourceLabel` (default "SAFE"). Supports SAFE, Seed, Series A, etc. DB field names unchanged for backward compatibility.
- **Negative Cash Balance Entity Identification**: Verification check now clearly identifies which entity (Management Company vs specific property by name) has negative cash balance issues. Management Company gets its own independent cash balance check.
- **Expanded Test Suite**: 445 tests (up from 384). New suites: NPV-IRR cross-validation, FCFE two-method reconciliation, ASC 230 cash flow identities, portfolio IRR, refinancing/exit vectors, realistic 10-year hotel golden scenario.

## Full Documentation
**All project instructions, skills, rules, manuals, and tools live in `.claude/claude.md`** (the single source of truth). Load it for detailed architecture, pages, integrations, tech stack, and skill routing.

## Key Skills (in `.claude/skills/`)
- `testing/SKILL.md` — Master testing skill with 42-file map, entity-level coverage
- `testing/property-statements.md` — Property-level IS, CF, BS test coverage
- `testing/consolidated-statements.md` — Portfolio aggregation, elimination tests
- `testing/management-company.md` — Management company pro forma, fee linkage, funding tests
- `testing/analysis-returns.md` — IRR, NPV, MOIC, sensitivity, portfolio IRR tests
- `testing/analysis-dcf-fcf.md` — FCF, FCFE computation and reconciliation tests
- `testing/financing-refinance-funding.md` — Debt sizing, refi schedule, funding instrument tests
- `ui/composite-tabbed-pages.md` — Pattern for unified tabbed pages (Analysis, Properties+Map)
- `ui/calculation-transparency.md` — Toggle system for showing/hiding formula details
- `ui/accordion-formula-rows.md` — Expandable formula verification rows
- `ui/help-tooltip.md` — The `?` help icon system
- `ui/financial-table-styling.md` — Financial table visual conventions
- `ui/theme-engine.md` — Multi-theme system, token structure
- `ui/navigation.md` — Command Palette, Breadcrumbs, Favorites, Activity Feed
- `finance/income-statement.md` — Income statement architecture
- `finance/cash-flow-statement.md` — Cash flow statement architecture
- `finance/balance-sheet.md` — Balance sheet architecture (ASC 210, 360, 835-30)
- `proof-system/SKILL.md` — 445 tests, 5 golden scenarios, verification

## Quick Reference
- `npm run dev` — Start dev server
- `npm test` — Run all 445 tests
- `npm run verify` — Full financial verification
- `npm run db:push` — Push schema changes
- Tech: React 18 + TypeScript + Express 5 + PostgreSQL + Drizzle ORM
- 3D: Three.js (@react-three/fiber, drei, postprocessing), framer-motion
- Fonts: Playfair Display (headings) + Inter (UI/data)
