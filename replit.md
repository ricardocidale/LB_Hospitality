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
React 18, TypeScript, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts, D3.js, Three.js, framer-motion, Express 5, Drizzle ORM, PostgreSQL, Zod, jsPDF, xlsx, pptxgenjs, Sharp, MapLibre GL, Sentry, PostHog, Upstash Redis, `@anthropic-ai/sdk@0.78.0`

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
- **Brand**: Management Company, Ideal Customer Profile, Revenue Streams, Other Assumptions
- **Business**: Users (3 sub-tabs), Companies, Groups
- **Design**: Logos, Themes
- **AI Agents**: Marcela/Voice (9 sub-tabs), Rebecca/Text, Knowledge Base, Twilio
- **System**: Research, Notifications, Navigation, Diagrams, Verification, Database, Integrations
- **Logs**: Activity (Login Log, Activity Feed, Checker Activity)

## Property Description
Each property has an optional `description` text field with "Improve with AI" button (Gemini). Component: `client/src/components/property-edit/DescriptionSection.tsx`.

## Property Photos
Photo album in `property_photos` table (hero + gallery). Sharp image pipeline generates WebP/AVIF variants (thumb/card/hero/full). Crop dialog integrated in upload flow. Frontend uses `<picture>` elements with srcset.

## Logo Assignment Policy
Logos assigned to companies only. Groups derive logos from member companies. Branding chain: user's company logo → default system logo.

## Common Pitfall: Strict Zod Schemas on Admin Save Routes
When adding new fields to any admin config, **always** add the field to the backend Zod schema AND the merge logic. Backend `.strict()` schemas reject unknown fields silently.

## Simulation and Analysis Page
`/analysis` — 4 tabs: Sensitivity (sliders + tornado/heatmap), Compare (side-by-side properties), Timeline (Gantt), Financing (DSCR/Debt Yield/Stress Test/Prepayment).

## Dashboard Overview
Investment Performance (IRR gauge), KPI cards, Revenue & ANOI chart, Portfolio tables, Insights, Composition, USALI Waterfall. Executive Summary merged into Dashboard.

## Management Company Page
`/company` — 4 tabs: Income Statement, Cash Flows, Balance Sheet, Tools (Capital Strategy with engine-computed capital raise analysis).

## Export System
Shared formatting in `client/src/lib/exports/`. Full reference: `.agents/skills/export-system/SKILL.md`
- **Premium Export**: `POST /api/exports/premium` — Agent Skills path (PDF/PPTX/DOCX via Anthropic sandbox) with template fallback; XLSX stays template-based. Service: `server/ai/agentSkillsExport.ts`
- **Client-side**: PDF (jsPDF), PPTX (pptxgenjs), Excel (SheetJS), CSV, PNG (dom-to-image-more)
- **Design rules**: `normalizeCaps()`, alternating row tint, sage-green table frames, branded footers

## Market Intelligence Pipeline
Three-service architecture: FREDService (interest rates, 24h cache), HospitalityBenchmarkService (RevPAR/ADR/occupancy, 7d cache), GroundedResearchService (web search with citations). Aggregator composes all three. Provenance badges: verified/cited/estimated.

## Geospatial Intelligence
Properties have optional lat/lng. Google Maps API for geocoding/autocomplete/POI search. MapLibre GL for rendering. Portfolio map with DSCR coloring + Supercluster clustering.

## Financial Engine Additions
Working capital (AR/AP days), NOL carryforward (80% utilization cap), MIRR, day-count conventions (30/360, ACT/360, ACT/365), cost segregation accelerated depreciation.

## Observability
Sentry (error tracking), PostHog (analytics), Upstash Redis (caching with SWR), circuit breakers on all integrations. Admin Integrations tab shows health/cache/circuit state.

## Communication & Alerts
SendGrid email + Slack webhooks. Alert rules engine with metric thresholds, cooldowns, multi-channel delivery. Admin Notifications tab. `ShareEmailModal` for branded report sharing.

## D3.js Visualizations
WaterfallChart (revenue-to-NOI bridge), SensitivityHeatMap (ADR × Occupancy grid), TornadoDiagram (assumption impact ranking). Export to PDF/PPTX via `toCanvas()`.

## Scripts Directory
All utility scripts live in `script/` (single canonical directory).
