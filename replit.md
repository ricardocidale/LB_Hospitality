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

## Market Intelligence Pipeline
Three-service architecture in `server/services/`: FREDService (SOFR/Treasury/CPI, 24h cache), HospitalityBenchmarkService (CoStar/STR/AirDNA adapter, 7-day cache), GroundedResearchService (Perplexity/Tavily with citations). MarketIntelligenceAggregator composes all three. Data provenance badges: verified/cited/estimated. Types in `shared/market-intelligence.ts`. Frontend: `client/src/components/property-research/`.

## Image Processing Pipeline
Server-side image pipeline using Sharp (`server/image/pipeline.ts`, `server/image/variants.ts`). Uploaded/generated images are processed into 4 WebP+AVIF variants:
- `thumb` (400x300, q70) — album grids, property cards
- `card` (800x600, q80) — portfolio cards
- `hero` (1600x1000, q85) — hero sections
- `full` (2400 max width, q90) — lightbox/full-screen
Variants stored in `property_photos.variants` JSONB column. Originals preserved. Smart cropping via Sharp's attention strategy. Frontend uses `<picture>` elements with AVIF/WebP sources and srcset for responsive loading. Crop dialog integrated in upload flow.

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

## Property Description & Photos
Properties have optional `description` (AI-polished via Gemini) and photo album (`property_photos` table: hero + gallery). Sharp pipeline generates WebP/AVIF variants (thumb/card/hero/full). Frontend uses `<picture>` with srcset.

## Logo Assignment Policy
Logos assigned to companies only. Groups derive logos from member companies. Branding chain: user's company logo → default system logo.

## Research Skills
Property sub-skills: local-economics, marketing-costs. Company: outsourcing/make-vs-buy. Global: FX, capital markets, ESG. Source registry: `RESEARCH_SOURCES` in `shared/constants.ts`.

## Common Pitfall: Strict Zod Schemas on Admin Save Routes
When adding new fields to admin config, **always** add to: (1) TypeScript interface in `shared/schema.ts`, (2) Zod schema in route (watch `.strict()`), (3) merge/spread logic in handler.

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

## Financial Engine Additions
Working capital (AR/AP days), NOL carryforward (80% utilization cap), MIRR, day-count conventions (30/360, ACT/360, ACT/365), cost segregation accelerated depreciation.

## Observability
Sentry (error tracking), PostHog (analytics), Upstash Redis (caching with SWR), circuit breakers on all integrations. Admin Integrations tab shows health/cache/circuit state.

## Communication & Alerts
Resend email + Slack webhooks. Alert rules engine with metric thresholds, cooldowns, multi-channel delivery. Admin Notifications tab. `ShareEmailModal` for branded report sharing.

## D3.js Visualizations
WaterfallChart (revenue-to-NOI bridge), SensitivityHeatMap (ADR × Occupancy grid), TornadoDiagram (assumption impact ranking). Export to PDF/PPTX via `toCanvas()`.

## Document Intelligence Pipeline
Property detail "Documents" tab. Document AI OCR extraction, fuzzy USALI field mapping, confidence-scored review UI. Tables: `document_extractions`, `extraction_fields`. Key files: `server/integrations/document-ai.ts`, `server/document-ai/`, `server/routes/documents.ts`, `server/storage/documents.ts`, `client/src/components/documents/`.

## Scripts Directory
All utility scripts live in `script/` (single canonical directory).
