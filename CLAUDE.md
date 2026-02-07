# L+B Hospitality Group - Business Simulation Portal

## Project Overview

A financial modeling and portfolio management portal for L+B Hospitality Group, a boutique hotel management company. The system generates monthly/yearly pro forma projections, income statements, balance sheets, and cash flow statements for hospitality assets across North America and Latin America. Includes independent financial verification against GAAP standards (ASC 230, 360, 470, 606) and AI-powered market research.

## Tech Stack

- **Frontend**: React 18 + TypeScript, Wouter routing, TanStack Query, shadcn/ui, Tailwind CSS v4, Recharts
- **Backend**: Node.js + Express 5, TypeScript ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Build**: Vite (client), esbuild (server)
- **AI**: Multi-provider support (OpenAI, Anthropic/Claude, Gemini) for market research and image generation (gpt-image-1)

## Key Commands

```bash
npm run dev          # Start development server (port 5000)
npm test             # Run vitest tests (calc/, domain/)
npx tsx server/seed.ts        # Seed database with dev data
npx tsx server/seed.ts --force # Force re-seed (clears existing data)
npx drizzle-kit push          # Push schema changes to database
```

## Directory Structure

```
shared/schema.ts              # Drizzle ORM schema (single source of truth)
client/src/pages/              # React page components
client/src/lib/                # Financial engine, constants, utilities
client/src/components/         # Shared UI components
client/src/features/           # Self-contained feature modules (see below)
server/routes.ts               # Express API routes
server/storage.ts              # Database access layer (IStorage interface)
server/auth.ts                 # Authentication & session management
server/calculationChecker.ts   # Independent server-side financial verification
server/seed.ts                 # Database seeding script
server/replit_integrations/    # External service integrations (image gen, object storage)
domain/types/                  # Shared domain types (accounting policy, rounding, journal deltas)
calc/shared/                   # Shared math: PMT formula, schedule builder, common types
calc/financing/                # Standalone acquisition debt calculator (Skill 1)
calc/refinance/                # Standalone refinance calculator (Skill 2)
tests/financing/               # Vitest tests for calc/financing/
tests/refinance/               # Vitest tests for calc/refinance/
```

### Feature Modules (`client/src/features/`)

Self-contained feature folders for functionality outside the core financial engine. Each feature exports via a barrel `index.ts`.

| Feature | Path | Description |
|---------|------|-------------|
| Property Images | `features/property-images/` | AI image generation + upload picker for property photos |
| Design Themes | `features/design-themes/` | Per-user theme CRUD with palette/chart colors |

## Coding Standards

- All financial constants live in `client/src/lib/constants.ts`
- Fallback pattern: `property-specific value → global value → DEFAULT constant`
- Dynamic config: `const projectionYears = global?.projectionYears ?? PROJECTION_YEARS`
- Action buttons on dark backgrounds: use `GlassButton variant="primary"`
- Schema changes require both `shared/schema.ts` update and SQL migration
- Never expose API keys or secrets in client code
- Non-core features (AI image gen, etc.) go in `client/src/features/<feature>/` with barrel exports — not in shared `hooks/` or `components/ui/`

## Mandatory Business Rules

These are non-negotiable constraints — see `.claude/rules/financial-engine.md` for full details:

- **Income Statement: Interest only, never principal** — Net Income = NOI - Interest - Depreciation - Tax. Principal is a financing activity (ASC 470), not an expense
- **Debt-free at exit** — All outstanding debt is repaid from gross sale proceeds at end of projection. Exit = Gross Value - Commission - Outstanding Debt
- **No negative cash** — Cash balances for each property, the management company, and the portfolio must never go negative
- **No over-distribution** — FCF distributions and refinancing proceeds must not be distributed to the point that any entity's cash goes negative
- **Capital sources on separate lines** — Equity (cash infusion), loan proceeds, and refinancing proceeds must always appear as separate line items in all reports (UI, PDF, CSV)
- **Funding gates** — Management company cannot operate before SAFE funding; properties cannot operate before acquisition/funding

## Common Gotchas

- `PROJECTION_YEARS` and `PROJECTION_MONTHS` are fallback defaults only; always prefer dynamic values from global assumptions
- Depreciation uses 27.5-year straight-line (IRS Publication 946 / ASC 360) - this is immutable
- Room revenue uses 30.5 days/month (365/12 rounded) - industry standard, not configurable
- Balance sheet entries only appear after property acquisition date
- Principal payments are financing activities, NOT income statement expenses (ASC 470)
- The `checker` user has role "user" but gets verification access via email check in `requireChecker` middleware
- Seeding is idempotent - it skips if data already exists

## Environment Variables

- `ADMIN_PASSWORD` - Admin user password (required)
- `CHECKER_PASSWORD` - Checker user password (required)
- `DATABASE_URL` - PostgreSQL connection string (auto-configured)
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API key for AI image generation (auto-configured on Replit)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI base URL for AI image generation (auto-configured on Replit)

## Documentation

See `.claude/rules/` for detailed documentation on:
- Architecture, database & seeding, financial engine, verification system
- UI design system, shared constants, API route reference

See `.claude/skills/` for component-level documentation (organized by category: `ui/`, `exports/`, `finance/`, `research/`, `features/`):
- `features/property-image-picker.md` — PropertyImagePicker component, useGenerateImage hook, AI image endpoint

## Finance Skill Modules

Standalone, GAAP-compliant calculator modules per `skills/finance/FINANCE_SKILL_SPECS.md`. Framework-agnostic pure TypeScript with vitest coverage.

| Module | Path | Description |
|--------|------|-------------|
| Domain Types | `domain/types/` | `AccountingPolicy`, `RoundingPolicy`, `JournalDelta` — shared across all finance Skills |
| Shared Math | `calc/shared/` | PMT formula, IO payment, schedule builder, `NewLoanTerms`/`ScheduleEntry` types — used by Skills 1 & 2 |
| Financing Calculator | `calc/financing/` | Skill 1: acquisition debt sizing (LTV/override), closing costs, amort schedules, journal hooks |
| Financing Tests | `tests/financing/` | 34 tests: sizing, closing costs, golden scenario, IO-then-amort, journal hooks, validation |
| Refinance Calculator | `calc/refinance/` | Skill 2: payoff, LTV/DSCR sizing, IO-to-amort schedules, journal hooks, proceeds breakdown |
| Refinance Tests | `tests/refinance/` | 58 tests: unit, golden scenario, schedule reconciliation, flag determinism |

These modules are isolated from the existing `client/src/lib/financialEngine.ts` engine. They do not import from or modify any existing application code.

## Authoritative Skill Specifications

The file `skills/finance/FINANCE_SKILL_SPECS.md` defines the mandatory Skill boundaries,
GAAP constraints, and invariants for all work related to:

- Financing
- Refinancing
- Funding and tranches
- Income Statement, Cash Flow, Balance Sheet
- FCF and IRR analysis

Claude Code must:
- Treat this file as authoritative
- Not violate Skill boundaries defined there
- Not modify accounting logic outside the allowed scope of the active Skill
- Fail fast and report violations instead of silently compensating
