# Hospitality Business Group - Business Simulation Portal

## Overview
Business simulation portal for a boutique hotel management company. Financial modeling, portfolio management, and GAAP-compliant pro formas for hospitality assets across North America and Latin America. Branded "powered by Norfolk AI" (discrete, 9px, low opacity). Supports multi-tenant branding via User Groups — each group can have its own company name, logo, theme, and asset description.

## Documentation Hub
**All project documentation lives in `.claude/claude.md`** — the single source of truth for architecture, skills, rules, manuals, tools, testing, integrations, and project state. Load it for any detailed work.

Key directories inside `.claude/`:
- `skills/` — 80+ skill files across testing, finance, UI, exports, proof system, architecture
- `skills/context-loading/` — **Start here**: maps task types to minimum required skills for token efficiency
- `rules/` — 8 rule files (audit doctrine, constants, DB seeding, API routes, etc.)
- `manuals/` — Checker manual (15 sections) and user manual (16 sections)
- `tools/` — Tool schemas for analysis, financing, returns, validation, UI
- `commands/` — 8 slash commands (verify, seed, scenarios, themes, etc.)

## User Preferences
- Communication style: Simple, everyday language. Ask clarifying questions before implementing.
- **TOP PRIORITY: Calculations and correct reports always highest priority.** 477-test proof system must always pass.
- Always format money as currency. Company name is "Hospitality Business Group" (never "L+B Hospitality").
- All skills stored under `.claude/`. All UI must reference a theme via the theme engine.
- New UI features get their own skill file in `.claude/skills/ui/`.
- When updating features, always update the corresponding skills and manuals documentation.
- Percentage-based assumptions must always clarify their calculation base in the label (e.g., "% of Property Gross Revenue", "% of Mgmt Fee Revenue").
- **When a task is vague or ambiguous, research best practices online before implementing.** Don't guess — consult current industry/technical standards first.

## Current Theme
**Fluid Glass** is the active theme. All new UI work must follow Fluid Glass styling conventions.

## Recent Changes
- **Slider responsive breakpoints**: All slider grids use `sm:` (640px) instead of `md:` (768px) — sliders go multi-column on tablets and landscape phones, full-width only on extremely narrow portrait phones (<640px)
- **InfoTooltip component**: New `InfoTooltip` (ℹ icon) for read-only values and calculated metrics, complementing `HelpTooltip` (? icon) for form inputs. Full skill doc at `.claude/skills/ui/info-icons.md`
- **Per-property management fees**: Management fees (baseManagementFeeRate, incentiveManagementFeeRate) moved from global assumptions to per-property. 32 new tests in `tests/engine/per-property-fees.test.ts`. CompanyAssumptions shows read-only summary table. PropertyEdit has Management Fees section with sliders and tooltips.
- **Common-size analysis**: All financial statement subtotals (IS, CF, BS) now show percentage margin rows via shared `MarginRow` component
- **Assumption label clarity**: CompanyAssumptions.tsx labels now explicitly state the revenue/value base for each percentage input
- **Balance sheet ratios**: Debt-to-Assets and Equity-to-Assets ratios displayed after Grand Total

## Quick Reference
- `npm run dev` — Start dev server
- `npm test` — Run all 477 tests
- `npm run verify` — Full financial verification (UNQUALIFIED = pass)
- `npm run db:push` — Push schema changes
- Tech: React 18 + TypeScript + Express 5 + PostgreSQL + Drizzle ORM
- 3D: Three.js (@react-three/fiber, drei, postprocessing), framer-motion
- Fonts: Playfair Display (headings) + Inter (UI/data)
