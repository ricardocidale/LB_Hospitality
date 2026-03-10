# Hospitality Business Group - Business Simulation Portal

> **Source of truth:** `.claude/claude.md` — all detailed documentation lives there. This file is a slim pointer. If conflicts arise, `.claude/claude.md` wins.

## Overview
Business simulation portal for boutique hotel investment. Financial modeling, property management, investment analysis, and AI-powered assistant (Marcela). GAAP-compliant with independent audit/verification engine.

See `.claude/claude.md` for codebase stats, test counts, and line counts (kept current by doc harmony checks).

## Quick Commands
See `.claude/claude.md` § Quick Commands for the full list. The most common:
```bash
npm run dev            # Start dev server (port 5000)
npm run health         # tsc + tests + verify + doc harmony
npm run test:summary   # All tests, 1-line output
npm run verify:summary # GAAP verification
npm run stats          # Live codebase metrics
```

## Tech Stack
React 18, TypeScript, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts, Three.js, framer-motion, Express 5, Drizzle ORM, PostgreSQL, Zod, jsPDF, xlsx, pptxgenjs

## Key References
| Topic | Location |
|-------|----------|
| Full project instructions | `.claude/claude.md` |
| Architecture & tech stack | `.claude/claude.md` § Tech Stack |
| Financial engine rules | `.claude/rules/financial-engine.md` |
| Admin page (10 tabs + AI Agent 9 sub-tabs) | `.claude/skills/admin/SKILL.md` |
| AI assistant (Marcela) | `.claude/skills/marcela-ai/SKILL.md` |
| ElevenLabs architecture | `.claude/skills/codebase-architecture/SKILL.md` |
| Twilio telephony | `.claude/skills/twilio-telephony/` |
| Design system & themes | `.claude/skills/design-system/SKILL.md` |
| Chart library (9 components) | `.claude/skills/charts/SKILL.md` |
| Testing & proof system | `.claude/claude.md` § Testing & Proof System |
| Codebase architecture | `.claude/skills/codebase-architecture/SKILL.md` |
| Admin components & hooks | `.claude/skills/admin-components/SKILL.md` |
| Context loading protocol | `.claude/skills/context-loading/SKILL.md` |
| All invariants & rules | `.claude/claude.md` § Key Rules, `.claude/rules/` |

## Invariants (summary — see `.claude/claude.md` for full list)
- UNQUALIFIED audit opinion required at all times
- All tests must pass before delivering changes
- No LLM-computed financial values — engine only
- Ricardo Cidale is sole Admin
- Button labels: always "Save", never "Update"

## Inflation System
Three-tier cascade: `property.inflationRate → companyInflationRate → global.inflationRate`. The `DEFAULT_INFLATION_RATE` constant in `shared/constants.ts` is the single source of truth (0.03). Per-property and per-company rates are nullable; null means use the next level up in the cascade.

## Admin Sidebar Structure
Five categories + Logs + Help:
- **Brand**: Management Company (Identity/contact), Ideal Customer Profile (asset type definition), Revenue Share (unified: service categories with toggles/rates + incentive fee + USALI waterfall summary), Other Assumptions (company inflation)
- **Business**: Users (sub-tabs: Users, Company Assignment, Group Assignment), Companies (CRUD with logo + theme), Groups (CRUD with logo, theme, asset description, property visibility)
- **Design**: Logos (upload/manage logos), Themes (color themes)
- **AI Agent**: Configuration (9 sub-tabs), Knowledge Base (direct to KB tab), Twilio (direct to telephony tab)
- **System**: Research (sub-tabs: Research, Market Rates), Navigation, Verification, Database
- **Logs**: Activity (Login Log, Activity Feed, Checker Activity)
- Help link at bottom (navigates to /help)

Note: The old "Services" sidebar item was merged into "Revenue Share" — all service category CRUD, toggles, rates, industry benchmarks, centralized/direct models, and the incentive management fee are now in one unified screen.

Companies table now includes `theme_id` column for per-company theme assignment.

## Property Photos
Each property has a photo album in the `property_photos` table (hero image + 2 gallery photos). The `HeroImage` component supports an optional `caption` prop displayed as an italic overlay at the bottom. The `PropertyHeader` on the detail page fetches the hero photo's caption from the photos API and passes it to `HeroImage`. Seed data in `server/seeds/photos.ts` covers both seed-file properties and live-database properties. Photos are stored as static files in `client/public/images/`.

## Logo Assignment Policy
Logos are assigned to **companies only**, not to groups. Groups derive their display logo automatically: if all members belong to the same company and that company has a logo, the company logo is shown; otherwise an initials-based pseudo logo is displayed. The branding resolution chain for users is: user's company logo → default system logo.

## Research Skills
Property sub-skills: local-economics, insurance-costs, marketing-costs. Company: outsourcing/make-vs-buy analysis. Global: FX, capital markets, ESG. Source registry in `shared/constants.ts` (`RESEARCH_SOURCES`).

## Common Pitfall: Strict Zod Schemas on Admin Save Routes
When adding new fields to any admin config (research, voice, etc.), **always** add the field to the backend Zod validation schema AND the merge logic. Backend `.strict()` schemas reject unknown fields silently — the frontend sends the data, Zod strips/rejects it, and saves fail. Checklist:
1. Add field to TypeScript interface in `shared/schema.ts`
2. Add field to the Zod schema in the backend route (watch for `.strict()`)
3. Add field to the merge/spread logic in the PUT/PATCH handler
4. Test a round-trip save from the UI

## Analysis Page Tabs
The `/analysis` page contains 4 tabs: Sensitivity, Financing (debt DSCR/yield/stress), Compare, Timeline. Executive Summary is a separate sidebar page (`/executive-summary`), not part of Analysis.

## Management Company Page Tabs
The `/company` page contains 4 tabs: Income Statement, Cash Flows, Balance Sheet, **Tools**. The Tools tab (`client/src/pages/FundingPredictor.tsx`) has a single sub-tab:
- **Capital Strategy**: Engine-computed capital raise analysis — KPI grid (Capital Raise Target, Tranches, Path to Breakeven, Funding Gap), Investment Thesis, Capital Structure Mermaid flowchart, Cash Runway chart, Tranche cards with terms/rationale, Early-Stage Terms Comparison table, Capital Strategy narrative, Risk Factors & Milestones.

The engine at `client/src/lib/financial/funding-predictor.ts` is instrument-agnostic — it uses `fundingSourceLabel` (not hardcoded "SAFE") for all terminology. Vocabulary follows hospitality investment industry standards: "Capital Raise Target", "Net Burn Rate", "Operating Breakeven", "Investment Thesis", "Capital Strategy".

## Scripts Directory
All utility scripts live in `script/` (single canonical directory).
