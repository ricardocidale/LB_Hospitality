# Hospitality Business Group - Business Simulation Portal

> **Source of truth:** `.claude/claude.md` — all detailed documentation lives there. This file is a slim pointer. If conflicts arise, `.claude/claude.md` wins.

## Overview
Business simulation portal for boutique hotel investment. Financial modeling, property management, investment analysis, and AI assistants (Marcela voice + Rebecca text). GAAP-compliant with independent audit/verification engine.

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
| Chart library (12 components) | `.claude/skills/charts/SKILL.md` |
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
- **Brand**: Management Company (Identity/contact), Ideal Customer Profile (asset type definition), Revenue Streams (unified: service categories with toggles/rates + incentive fee + USALI waterfall summary), Other Assumptions (company inflation)
- **Business**: Users (sub-tabs: Users, Company Assignment, Group Assignment), Companies (CRUD with logo + theme), Groups (CRUD with logo, theme, asset description, property visibility)
- **Design**: Logos (upload/manage logos), Themes (color themes)
- **AI Agents**: Marcela / Voice (9 sub-tabs), Rebecca / Text (enable, name, prompt), Knowledge Base, Twilio
- **System**: Research, Navigation, Diagrams (Mermaid workflow charts L1/L2/L3), Verification, Database
- **Logs**: Activity (Login Log, Activity Feed, Checker Activity)
- Help link at bottom (navigates to /help)

Note: The old "Services" sidebar item was merged into "Revenue Streams" — all service category CRUD, toggles, rates, industry benchmarks, centralized/direct models, and the incentive management fee are now in one unified screen.

Companies table now includes `theme_id` column for per-company theme assignment.

## Property Description
Each property has an optional `description` text field. On the property edit page, a "Description" section appears between Basic Info and Timeline. It includes an "Improve with AI" button that calls `POST /api/ai/rewrite-description` (Gemini) to polish the text. Component: `client/src/components/property-edit/DescriptionSection.tsx`. AI route: `server/routes/ai.ts`.

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

## Simulation and Analysis Page
The `/analysis` page (sidebar label: "Simulation", title: "Simulation and Analysis") contains 4 tabs in order: Sensitivity, Compare, Timeline, Financing. Uses shadcn Tabs with icons and framer-motion transitions. Located under the "Tools" sidebar group.
- **Sensitivity**: What-if modeling with variable sliders (occupancy, ADR growth, expense escalation, exit cap, inflation, interest rate). Tornado chart, comparison table, KPI summary strip.
- **Compare**: Side-by-side property comparison (up to 4). Radar chart, winner summary bar, detailed table with best-value badges.
- **Timeline**: Horizontal Gantt-style timeline of property acquisitions and operations milestones with color-coded nodes and tooltips.
- **Financing**: 4 sub-tabs — DSCR Sizing (gauges with threshold markers), Debt Yield (pass/fail indicators), Stress Test (color-gradient DSCR heatmap with tooltips), Prepayment (3 penalty types with side-by-side comparison).

## Dashboard Overview Sections
The Dashboard Overview tab contains (in order): Investment Performance (IRR gauge, property IRR comparison, equity by property), KPI cards (Equity Multiple, Cash-on-Cash, Equity Invested, Projected Exit), Revenue & ANOI Projection chart, Portfolio & Capital Structure tables, Portfolio Insights (property table + InsightPanel), Portfolio Composition (market pie chart + status bars), USALI Profit Waterfall (revenue cascade with year switcher). Executive Summary content was merged into the Dashboard — `/executive-summary` redirects to `/`. Research status moved to sidebar (dot indicators).

## Sidebar Research Status
Research freshness is shown as a compact card in the sidebar footer (above Sign Out) with 4 dot indicators: Property, Operations, Marketing, Industry. Green = fresh, red = missing/stale. Clicking navigates to `/research`. Component: `client/src/components/research/SidebarResearchStatus.tsx`.

## Management Company Page Tabs
The `/company` page contains 4 tabs: Income Statement, Cash Flows, Balance Sheet, **Tools**. The Tools tab (`client/src/pages/FundingPredictor.tsx`) has a single sub-tab:
- **Capital Strategy**: Engine-computed capital raise analysis — KPI grid (Capital Raise Target, Tranches, Path to Breakeven, Funding Gap), Investment Thesis, Capital Structure Mermaid flowchart, Cash Runway chart, Tranche cards with terms/rationale, Early-Stage Terms Comparison table, Capital Strategy narrative, Risk Factors & Milestones.

The engine at `client/src/lib/financial/funding-predictor.ts` is instrument-agnostic — it uses `fundingSourceLabel` (not hardcoded "SAFE") for all terminology. Vocabulary follows hospitality investment industry standards: "Capital Raise Target", "Net Burn Rate", "Operating Breakeven", "Investment Thesis", "Capital Strategy".

## Scripts Directory
All utility scripts live in `script/` (single canonical directory).
