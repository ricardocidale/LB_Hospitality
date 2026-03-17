# Hospitality Business Group — Project Instructions

## Project Summary

Business simulation portal for **Hospitality Business Group**. Models a boutique hospitality management company alongside individual property SPVs with monthly and yearly financial projections. GAAP-compliant (ASC 230, ASC 360, ASC 470). 841 source files, ~148K lines, 3,320 tests across 145 test files. Hosted on Replit.

---

## User Preferences

- Simple, everyday language. Ask clarifying questions before implementing — do not assume.
- **TOP PRIORITY: Financial accuracy always beats UI enhancements.** The proof system must always pass.
- Always format money as currency (commas, appropriate precision).
- All skills live in `.claude/skills/`; `.agents/skills/` contains slim pointers for Replit task agent compatibility.
- Company name is "Hospitality Business Group" (or "Hospitality Business" for short).
- Update skills and manuals after every feature change.
- **Doc Harmony Rule:** `replit.md` and `.claude/claude.md` must stay in sync. Both are standalone, comprehensive project docs — neither is a "pointer" to the other. When updating one, update the other. The health check enforces matching test counts and stats across both files.
- All UI components must reference a theme via the theme engine.
- New UI features get their own skill file in `.claude/skills/ui/`.
- **Button Label Consistency:** Always "Save" — never "Update". See `rules/ui-patterns.md`.
- **100% Session Memory:** Save decisions to `.claude/session-memory.md` at session end.
- **Every financial line item** should have a ? tooltip (HelpTooltip or InfoTooltip).
- **Every page must be graphics-rich** — charts, animations, visual elements required.
- **Context reduction is mandatory.** Every refactor must produce skills, helpers, scripts. See `skills/coding-conventions/context-reduction.md`.
- **Premium design, always.** $50K+ bespoke financial platform feel. See `rules/design-standards.md`.
- **Always update replit.md and claude.md after every task.** Mandatory — no exceptions.

---

## Current Theme

**Tuscan Olive Grove** (olive-sage) is default. 5 presets available. See `.claude/skills/ui/theme-engine.md`.

---

## Tech Stack

React 18, TypeScript, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts, D3.js, Three.js, framer-motion, Express 5, Drizzle ORM, PostgreSQL, Zod, jsPDF, xlsx, pptxgenjs, Sharp, MapLibre GL, Sentry, PostHog, Upstash Redis, `@anthropic-ai/sdk@0.78.0`, `@phosphor-icons/react`

---

## Context Loading Protocol

With 191 skill files, **never load all skills at once**. Use `.claude/skills/context-loading/SKILL.md` to find the minimum required set. Quick rules:
- **Financial calc** → specific finance skill + `rules/audit-persona.md` + `proof-system/SKILL.md`
- **UI/visual** → `component-library/SKILL.md` + `ui/theme-engine.md` + specific UI skill
- **Testing** → `testing/SKILL.md` + relevant sub-skill only
- **Cross-domain** → 2–4 skills max per domain

---

## Skill Router

| Domain | Skill Path | What It Covers |
|--------|-----------|---------------|
| Context Loading | `.claude/skills/context-loading/SKILL.md` | Task-to-skill map, loading tiers |
| Architecture | `.claude/skills/architecture/SKILL.md` | Tech stack, two-entity model, file organization |
| Design System | `.claude/skills/design-system/SKILL.md` | Colors, typography, component catalog, CSS classes |
| Theme Engine | `.claude/skills/ui/theme-engine.md` | Multi-theme system, token structure |
| Component Library | `.claude/skills/component-library/SKILL.md` | PageHeader, GlassButton, ExportMenu, CurrentThemeTab |
| Proof System | `.claude/skills/proof-system/SKILL.md` | 3,320 tests, 583 golden tests, verification commands |
| Testing (8 skills) | `.claude/skills/testing/` | Per-statement/analysis test coverage |
| 3D Graphics | `.claude/skills/3d-graphics/SKILL.md` | Three.js scenes, framer-motion wrappers |
| Database | `.claude/skills/database-environments/SKILL.md` | Dev/prod databases, migrations, sync |
| Multi-Tenancy | `.claude/skills/multi-tenancy/SKILL.md` | Users, groups, logos, themes, branding resolution |
| Exports | `.claude/skills/exports/SKILL.md` | PDF, Excel, PPTX, PNG, CSV export system |
| Source Code | `.claude/skills/source-code/SKILL.md` | Full source code map |
| Codebase Arch | `.claude/skills/codebase-architecture/SKILL.md` | Client folder structure, UI component catalog (80+), ElevenLabs architecture |
| Admin Components | `.claude/skills/admin-components/SKILL.md` | Admin panel hooks, styles, tooltip patterns |
| Admin (16 sections) | `.claude/skills/admin/SKILL.md` | 16-section shell pattern, extraction guide, API routes |
| Marcela AI | `.claude/skills/marcela-ai/SKILL.md` | Multi-channel assistant, audio pipeline, ElevenLabs |
| Twilio | `.claude/skills/twilio-telephony/SKILL.md` | Voice webhooks, SMS, Media Streams |
| Finance (22 skills) | `.claude/skills/finance/` | Income statement, cash flow, balance sheet, IRR, DCF, fee categories, funding interest, diagnostic decision tree, etc. |
| Funding Strategy | `.claude/skills/funding-strategy/SKILL.md` | SAFE tranche modeling, cash runway, investor thesis, FRED rates |
| Research (23 skills) | `.claude/skills/research/` | Market, ADR, occupancy, cap rate, auto-refresh, ICP profile, research center, etc. |
| Chart Library | `.claude/skills/charts/SKILL.md` | 12 Recharts + 3 D3.js chart components |
| Mobile Responsive | `.claude/skills/mobile-responsive/SKILL.md` | Breakpoints, tablet layouts, responsive helpers |
| UI (45 skills) | `.claude/skills/ui/` | Graphics, animation, entity cards, interactions, navigation, Magic UI effects, consistent card widths, save button placement |
| API Routes | `.claude/skills/architecture/api-routes.md` | All REST endpoints (load when writing API code) |
| Constants Ref | `.claude/skills/finance/constants-and-config.md` | All named constants and protected fields |
| Verification | `.claude/skills/proof-system/verification-system.md` | GAAP verification pipeline detail |
| Release Checklist | `.claude/skills/proof-system/release-audit-checklist.md` | Pre-release audit (load for releases) |
| Coding Conventions | `.claude/skills/coding-conventions/SKILL.md` | Naming, formatting, context reduction, skill organization |
| ElevenLabs | `.claude/skills/elevenlabs/SKILL.md` | ElevenLabs SDK reference, speech-to-text, text-to-speech, conversational AI |
| Help Page | `.claude/skills/help-page/SKILL.md` | Help page with User Manual, Checker Manual, Guided Tour tabs |
| Property Finder | `.claude/skills/property-finder/SKILL.md` | External listing search, favorites, saved searches via RapidAPI |
| Tool Schemas | `.claude/skills/tool-schemas/SKILL.md` | Tool schema organization for calc/ deterministic tools |
| Tour | `.claude/skills/tour/SKILL.md` | Guided tour/walkthrough component for onboarding |
| UI Blocks | `.claude/skills/ui-blocks/SKILL.md` | Reference shadcn block patterns |
| Market Intelligence | `.claude/skills/market-intelligence/SKILL.md` | FRED, hospitality benchmarks, grounded research, BaseIntegrationService |
| ICP Research | `.claude/skills/icp-research/SKILL.md` | ICP profile definition, AI research center, prompt builder |
| Rebecca Chatbot | `.claude/skills/rebecca-chatbot/SKILL.md` | AI-powered portfolio analytics chat (Gemini or Perplexity engine) |
| Document Intelligence | `.claude/skills/document-intelligence/SKILL.md` | Google Document AI OCR pipeline, field mapping |
| Map View | `.claude/skills/map-view/SKILL.md` | MapLibre GL, Supercluster clustering, globe animation |
| Notifications | `.claude/skills/notifications/SKILL.md` | Alert rules, Resend email, notification logs |
| Rules (19) | `.claude/rules/` | All behavioral constraints |
| Business Model | `.claude/skills/business-model/SKILL.md` | Dual-entity model, revenue streams, USALI waterfall, management fees, SAFE funding, ICP, property lifecycle |
| Product Vision | `.claude/skills/product-vision/SKILL.md` | Product identity, design tenets, workflow principles, navigation, user roles, white-labeling |
| Integrations | `.claude/skills/integrations/SKILL.md` | AI providers, voice AI, geospatial, document intelligence, communication, observability |
| Settings Architecture | `.claude/skills/settings/SKILL.md` | Two configuration surfaces (Company Assumptions for admins, Admin panel for system config), read-only Model Inputs panel for non-admins on Company page |
| Design Export | `.claude/skills/design-export/SKILL.md` | Replicate the HBG design system in another project (components, themes, icons, charts) |
| Card Widths | `.claude/skills/ui/consistent-card-widths.md` | Page layout width categories, grid patterns, PageHeader alignment |
| Save Buttons | `.claude/skills/ui/save-button-placement.md` | SaveButton component, three placement patterns, dirty-tracking |
| Business Domain Pointers (13) | `.agents/skills/` | Slim pointers to `.claude/skills/` — business model, financial engine, verification, design philosophy, integrations, Marcela AI, API contract, product vision, export system, design export, card widths, save buttons, settings architecture |

---

## Testing & Proof System (3,320 Tests, 145 Files)

| Level | Domains | Skill |
|-------|---------|-------|
| Individual Property | IS, CF, BS, trial balance, reconciliation, ASC 230 | `testing/property-statements.md` |
| Consolidated Portfolio | Aggregation, eliminations, portfolio IRR | `testing/consolidated-statements.md` |
| Management Company | Company pro forma, fee linkage, funding | `testing/management-company.md` |
| Returns Analysis | IRR, NPV, MOIC, sensitivity | `testing/analysis-returns.md` |
| Golden Scenarios | 500 hand-calculated reference tests (incl. Clearwater Inn mgmt co + 1 property, WACC) | `testing/golden-scenarios.md` |

**Commands**: `npm test` (all 3,320) · `npm run verify` (7-phase GAAP) · `npm run health` (tsc+tests+verify)

---

## Key Rules

- **Calculations always highest priority** — never compromise financial accuracy for visuals
- **No raw hex in components** — use CSS variable tokens
- **All buttons GlassButton**, all pages PageHeader, all exports ExportMenu
- **No mock data** in production paths
- **Finance changes must state Active Skill** and pass verification (UNQUALIFIED)
- **ANOI terminology**: After-fee NOI = "Adjusted NOI (ANOI)". Internal field stays `noi`.
- **Marcela ISOLATED** — Voice agent + ElevenLabs + Twilio phone all gated behind `MARCELA_ISOLATED` flag. Config preserved, zero network calls. Rebecca sole active agent. See `.claude/plans/MARCELA-ISOLATION.md` for restoration.
- **Marcela must NEVER compute financial values** — all data from the calculation engine
- **Engine chain**: `gop = revenue − opex`, `agop = gop − feeBase − feeIncentive`, `noi = agop − expenseTaxes`, `anoi = noi − expenseFFE`
- **Brand colors**: SAGE=#9FBCA4, DARK_GREEN=#257D41, NAVY=#1A2332, SECTION_BG=#EFF5F0, ALT_ROW=#F8FAF9
- **normalizeCaps() abbreviations**: GOP, NOI, AGOP, ANOI, GAAP, FFE, FF&E, DSCR, IRR, CFO, ADR, REVPAR, LTV, EBITDA, WACC
- **Icon standard**: `IconPlay` for "Run Research", `IconEye` for "Criteria", `IconBanknote` for Reconciliation
- **Resend replaces SendGrid** for all transactional email — `server/services/resend.ts`
- **ICP = Profile + Research Center** — two separate pages, not one monolithic ICP page
- **LLM dual-model config** — primary + fallback model with vendor selection (OpenAI, Anthropic, Gemini) in Admin LLM tab
- **Norfolk AI theme** — additional theme preset alongside Tuscan Olive Grove
- **Settings placement** — General Settings page eliminated (Task #168). Two surfaces: Company Assumptions (admin-only, entity config), Admin panel (system config). Calc transparency + tour toggles moved to Admin Navigation tab. Auto-research toggle moved to Admin Research Center tab. Non-admins see read-only Model Inputs panel on Company page.

---

## User Roles

| Role | Access |
|------|--------|
| `admin` | Full — all pages + Admin Settings |
| `user` | Management-level — no Admin panel |
| `checker` | User + verification tools |
| `investor` | Limited — Dashboard, Properties, Profile, Help |

---

## Icon Set System

Design themes support switchable icon libraries (Lucide default, Phosphor alternative). `design_themes.icon_set` column stores the selection. `IconSetContext` provider in Layout reads from branding API. All UI icons use `themed-icons.tsx` wrappers (60+ mapped icons) that auto-switch based on context. Brand icons in `brand-icons.tsx` are unaffected. Admin ThemeManager has icon set selector dropdown.

---

## Market Intelligence Pipeline

Three-service architecture in `server/services/`: FREDService (SOFR/Treasury/CPI, 24h cache), HospitalityBenchmarkService (CoStar/STR/AirDNA adapter, 7-day cache), GroundedResearchService (Perplexity SDK/Tavily with citations). MarketIntelligenceAggregator composes all three. Data provenance badges: verified/cited/estimated. Types in `shared/market-intelligence.ts`. Frontend: `client/src/components/property-research/`.

---

## Image Processing Pipeline

Server-side image pipeline using Sharp (`server/image/pipeline.ts`, `server/image/variants.ts`). Uploaded/generated images are processed into 4 WebP+AVIF variants:
- `thumb` (400x300, q70) — album grids, property cards
- `card` (800x600, q80) — portfolio cards
- `hero` (1600x1000, q85) — hero sections
- `full` (2400 max width, q90) — lightbox/full-screen
Variants stored in `property_photos.variants` JSONB column. Originals preserved. Smart cropping via Sharp's attention strategy. Frontend uses `<picture>` elements with AVIF/WebP sources and srcset for responsive loading. Crop dialog integrated in upload flow.

---

## Settings Architecture

- **Company Assumptions** (`/company/assumptions`): Admin-only. Single source of truth for company config — identity, contact, inflation, funding, service categories & fees, compensation, overhead, costs, tax, exit, property expense rates, partner comp
- **Admin** (`/admin`): System-only config (users, groups, logos, themes, navigation, calc transparency, tour prompt, research automation, etc.)
- **Company page Model Inputs panel**: Read-only collapsible panel for non-admins showing key model parameters (funding, fees, staffing, overhead)
- `/settings` route redirects: admins → Admin Navigation tab, non-admins → Company page

---

## Admin Sidebar Structure

Five groups + Logs + Help (15 sections total):
- **Business**: Users (3 sub-tabs), Companies, Groups
- **Research**: ICP Management Co, Research Center
- **Design**: Logos, Themes
- **AI Agents**: AI Agents (9 sub-tabs: Marcela/Voice, Rebecca/Text, Knowledge Base, Twilio, etc.)
- **System**: Notifications, Navigation, Diagrams, Verification, Database, Integrations
- **Logs**: Activity (Login Log, Activity Feed, Checker Activity)

---

## Database Migration Pattern

All migrations are idempotent SQL scripts in `server/migrations/`. Each is wired into `server/index.ts` startup sequence before `seedAdminUser()`. Migration files: `prod-sync-001.ts`, `prod-sync-002.ts`, `research-config-001.ts`, `inflation-per-entity-001.ts`, `companies-theme-001.ts`, `icp-config-001.ts`, `marcela-voice-001.ts`, `property-photos-001.ts`, `documents-001.ts`, `funding-interest-001.ts`, `google-id-001.ts`, `composite-indexes-001.ts`, `auto-research-refresh-001.ts`, `notification-logs-001.ts`, `fk-indexes-001.ts`, `drop-plaid-001.ts`, `role-partner-to-user-001.ts`.

---

## Dashboard Overview

Investment Performance (IRR gauge), KPI cards, Revenue & ANOI chart, Portfolio tables, Insights, Composition, USALI Waterfall. Executive Summary merged into Dashboard.

---

## Management Company Page

`/company` — 4 tabs: Income Statement, Cash Flows, Balance Sheet, Tools (Capital Strategy with engine-computed capital raise analysis).

---

## Simulation and Analysis Page

`/analysis` — 4 tabs: Sensitivity (sliders + tornado/heatmap), Compare (side-by-side properties), Timeline (Gantt), Financing (DSCR/Debt Yield/Stress Test/Prepayment).

---

## Export System

Shared formatting in `client/src/lib/exports/`. Full reference: `.claude/skills/exports/SKILL.md`
- **Premium Export**: `POST /api/exports/premium` — Agent Skills path (PDF/PPTX/DOCX via Anthropic sandbox) with template fallback; XLSX stays template-based. Service: `server/ai/agentSkillsExport.ts`
- **Client-side**: PDF (jsPDF), PPTX (pptxgenjs), Excel (SheetJS), CSV, PNG (dom-to-image-more)
- **Design rules**: `normalizeCaps()`, alternating row tint, sage-green table frames, branded footers

---

## Financial Engine Additions

Working capital (AR/AP days), NOL carryforward (80% utilization cap), MIRR, day-count conventions (30/360, ACT/360, ACT/365), cost segregation accelerated depreciation.

---

## Inflation System

Three-tier cascade: `property.inflationRate → companyInflationRate → global.inflationRate`. The `DEFAULT_INFLATION_RATE` constant in `shared/constants.ts` is the single source of truth (0.03). Per-property and per-company rates are nullable; null means use the next level up in the cascade.

---

## Governed Model Constants (DB-Backed)

`DEPRECIATION_YEARS` (27.5) and `DAYS_PER_MONTH` (30.5) are now DB-backed with constant fallbacks. Cascade: `property.depreciationYears → global.depreciationYears → DEPRECIATION_YEARS constant (27.5)`. `daysPerMonth` is global-only: `global.daysPerMonth → DAYS_PER_MONTH constant (30.5)`. Editable in Company Assumptions under "Model Constants" with governed field wrappers. All engine files (`resolve-assumptions.ts`, `property-engine.ts`), server checker files, and client audit files use the cascade.

---

## Property Description & Photos

Properties have optional `description` (AI-polished via Gemini) and photo album (`property_photos` table: hero + gallery). Sharp pipeline generates WebP/AVIF variants (thumb/card/hero/full). Frontend uses `<picture>` with srcset.

---

## Logo Assignment Policy

Logos assigned to companies only. Groups derive logos from member companies. Branding chain: user's company logo → default system logo.

---

## Observability

Sentry (error tracking), PostHog (analytics), Upstash Redis (caching with SWR), circuit breakers on all integrations. Admin Integrations tab shows health/cache/circuit state.

---

## Communication & Alerts

Resend email. Alert rules engine with metric thresholds, cooldowns, multi-channel delivery. Admin Notifications tab. `ShareEmailModal` for branded report sharing.

---

## D3.js Visualizations

WaterfallChart (revenue-to-NOI bridge), SensitivityHeatMap (ADR × Occupancy grid), TornadoDiagram (assumption impact ranking). Export to PDF/PPTX via `toCanvas()`.

---

## Document Intelligence Pipeline

Property detail "Documents" tab. Document AI OCR extraction, fuzzy USALI field mapping, confidence-scored review UI. Tables: `document_extractions`, `extraction_fields`. Key files: `server/integrations/document-ai.ts`, `server/document-ai/`, `server/routes/documents.ts`, `server/storage/documents.ts`, `client/src/components/documents/`.

---

## Research Skills

Property sub-skills: local-economics, marketing-costs. Company: outsourcing/make-vs-buy. Global: FX, capital markets, ESG. Source registry: `RESEARCH_SOURCES` in `shared/constants.ts`.

---

## Common Pitfall: Strict Zod Schemas on Admin Save Routes

When adding new fields to admin config, **always** add to: (1) TypeScript interface in `shared/schema.ts`, (2) Zod schema in route (watch `.strict()`), (3) merge/spread logic in handler.

---

## Scripts Directory

All utility scripts live in `script/` (single canonical directory).

---

## Quick Commands

```bash
npm run dev            # Start dev server (port 5000)
npm run health         # tsc + tests + verify + doc harmony
npm run test:summary   # All 3,320 tests, 1-line output
npm run verify:summary # 7-phase verification, compact output
npm run db:push        # Push schema changes
npm run diff:summary   # Compact git status + diff stat
npm run test:file -- <path>  # Single test file
npm run stats          # Codebase metrics
```

---

## Recent Changes (March 16, 2026)

- **Premium PDF Export Redesign** — Switched premium export AI backend from Anthropic (broken Agent Skills stub) to Gemini 2.0 Flash. Removed dead `agentSkillsExport` code path. Completely redesigned PDF rendering with enterprise-quality design: full-bleed navy cover page with grid overlay, branded section headers, decorative page chrome (navy/sage borders + vertical rules), KPI metric cards with green accent bars, warm background callout blocks for executive summaries, and professional confidential footer treatment. Both server-side premium PDF and client-side comprehensive dashboard PDF upgraded.
- **Model Defaults Admin Section** — "Model Defaults" tab in Admin > Business group. Two sub-tabs: Market & Macro (inflation, cost of equity, days per month, fiscal calendar) and Property Underwriting (revenue assumptions with 10 fields, USALI operating cost rates with 11 fields, revenue stream expense rates, acquisition/refi financing, depreciation & tax with property tax rate and land value %, exit/disposition, default acquisition package). 23 nullable columns in `globalAssumptions` (schema: `shared/schema/config.ts`). Nullable design: NULL = use `shared/constants.ts` fallback. `buildPropertyDefaultsFromGlobal()` in `server/routes/properties.ts` reads DB values with constant fallbacks. Premium UI using EditableValue + Slider pattern from company-assumptions sections.
- **Verification Bug Fixes** — Fixed DSCR check (was failing for pre-operational Year 1 properties), fixed Net Income/Cash Flow identity checks (were using naive tax formula ignoring NOL carryforward). Added `incomeTax` to checker engine output.
- **Role Rename: Partner → User** (Task #163) — Renamed `partner` role to `user` across entire codebase: schema, seeds, auth, UI, AI prompts, diagrams, tests. Data migration updates existing rows.
- **Property Engine Split** (Task #162) — Split `property-engine.ts` into `resolve-assumptions.ts`, `refinance-pass.ts`, and slimmed core engine.
- **Insurance Display** (Task #160) — Insurance cost rate display and sensitivity/comparison support.
- **Governance Harmonization** (Task #153) — Created 7 new `.claude/skills/` files. All 13 `.agents/skills/` files converted to slim pointers.
- **Configuration Architecture Terminology Refresh** (Tasks #180–182) — Standardized vocabulary: "seed defaults" (templates copied into new properties), "live assumptions" (values the engine reads directly), "config switches" (UI/behavior toggles). Documented dual-residence principle: most financial parameters exist as both a seed default in Model Defaults AND a live assumption in Company Assumptions. Fixed `defaultPropertyTaxRate` label/range/fallback (income tax at 25%, not property tax at 1.2%). Wired `buildPropertyDefaultsFromGlobal()` to map it to `taxRate`. Eliminated `/settings` page and all references. Removed CateringSection placeholder from Company Assumptions. Updated `.claude/skills/settings/SKILL.md` and `.claude/skills/constants-governance/SKILL.md`.
- **Settings Architecture Governance** (Task #148) — Three configuration surfaces with decision tree.
- **Property Creation Defaults from Global Assumptions** (Task #147) — `buildPropertyDefaultsFromGlobal()` reads `global_assumptions` for property defaults.
- **Settings Elimination & Access Control** (Task #168) — Eliminated General Settings page. Migrated calc transparency + tour toggles to Admin Navigation tab, auto-research to Research Center tab. Company Assumptions restricted to admin-only. Non-admins get read-only Model Inputs panel on Company page. `/settings` redirects role-appropriately. Deleted 5 settings components (−684 lines).
- **Settings Consolidation** (Task #146) — ManagementFeesSection is single source for revenue model. General Settings reduced to 3 tabs.
- **Insurance Removal** — Removed insurance expense from entire codebase. NOI formula is now `IBFC − Property Taxes`.
