# Hospitality Business Group — Project Instructions

## Overview

This project is a business simulation portal for Hospitality Business Group, modeling a boutique hospitality management company and its individual property Special Purpose Vehicles (SPVs). It provides monthly and yearly financial projections, adhering to GAAP standards (ASC 230, ASC 360, ASC 470). The platform aims to deliver a premium, bespoke financial platform experience with a focus on financial accuracy and robust data governance. The vision is to enable precise financial modeling and reporting for the hospitality industry.

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

## System Architecture

The application features a React 18 frontend built with TypeScript, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts, D3.js, and framer-motion. The backend is an Express 5 application utilizing Drizzle ORM and PostgreSQL.

**Core Design Principles & Features:**
-   **Financial Accuracy & Compliance:** Highest priority, enforced by a comprehensive proof system (3,599 tests across 156 files), GAAP verification, and USALI 12th Edition compliance for property-level Income and Cash Flow Statements. The Balance Sheet Identity (A = L + E) must hold within $1.
-   **Precision Hardening:** `calc/shared/decimal.ts` provides `decimal.js`-backed arithmetic (`dSum`/`dMul`/`dDiv`/`dRound`/`dPow`) to eliminate floating-point drift in financial accumulations. `assertFinite` replaces silent NaN→0 coercion with fail-fast validation. Full codebase coverage: zero `Math.pow` remaining in financial code (replaced with `dPow` in MIRR, DSCR, hold-vs-sell, prepayment, capex-reserve, refinance sizing, debt-capacity, ADR projection, amortization, property-engine, company-engine, resolve-assumptions). Zero `safeNum` remaining (replaced with `assertFinite`). Verified by 15 `fast-check` property-based tests (10K+ random inputs).
-   **Modular Skill-Based Architecture:** Domain knowledge and context management are handled through a skill-based system located in `.claude/skills/`.
-   **Theming & UI/UX:** A robust theme engine provides consistent UI with 5 presets (default: Tuscan Olive Grove). All UI components are theme-compliant. Specific UI patterns (e.g., GlassButton, PageHeader, ExportMenu) and consistent button labels ("Save") are enforced. Every financial line item includes an `InfoTooltip`.
-   **Shared Financial Engine (`engine/`):** Pure financial calculation logic extracted into a shared `engine/` package with subdirectories: `property/` (pro-forma generation), `company/` (company-level projections), `aggregation/` (yearly rollup, consolidation, cash flow), `debt/` (amortization, loan/equity calculations), `funding/` (funding predictor), `helpers/` (portfolio helpers, utilities). Both client and server import from `@engine/*` (server directly, client via re-export shims in `client/src/lib/financial/`). The pre-existing `engine/posting/` module (journal posting) is independent.
-   **Server-Authoritative Finance Engine:** `server/finance/service.ts` orchestrates the full portfolio computation pipeline server-side, importing from `@engine/*` (single source of truth). POST `/api/finance/compute` (auth-required) returns per-property yearly data, consolidated financials, deterministic output hash, and GAAP identity validation. GET `/api/finance/health` (public) reports engine status. The `USE_SERVER_COMPUTE` feature flag (default: `true`) in `shared/constants.ts` switches Dashboard, Executive Summary, and Property Detail pages to fetch pre-computed results from the server via React Query instead of running the engine in-browser. `useServerFinancials` hook (in `client/src/hooks/useServerFinancials.ts`) handles the POST, superjson deserialization, and mapping of `PortfolioComputeResult` → `DashboardFinancials`. `usePortfolioFinancials` returns `{ financials, isLoading, isError, error }` with proper async status. The client-side fallback path is retained and activatable by setting the flag to `false`.
-   **Deterministic Hashing & Tenant Isolation:** `server/scenarios/stable-json.ts` provides deterministic JSON serialization via `json-stable-stringify` + full 64-char SHA-256 hashing. Scenario diff engine uses `fast-deep-equal` for structural comparisons. `loadScenario()` scopes all DB writes to the caller's userId, preventing cross-tenant mutation of shared records.
-   **Financial Field Registry:** `shared/field-registry.ts` is the single source of truth for all financial fields that flow from Global Assumptions to property defaults. The `FIELD_REGISTRY` array defines each field's property column, GA source (direct or via `debtAssumptions`), fallback constant, type, category, and validation bounds. `buildPropertyDefaultsFromRegistry()` replaces the old 40+ hand-coded mapping. Proof tests in `tests/server/field-registry.test.ts` verify schema parity. See `.local/skills/financial-field-registry/SKILL.md` for how to add new fields.
-   **Data Governance:** Model constants are primarily DB-backed with fallbacks, editable via admin interfaces. Inflation rates cascade globally.
-   **Configuration Management:** Settings are managed via "Company Assumptions" (admin-only, entity configuration), an "Admin panel" (system configuration), and a read-only "Model Inputs" panel for non-admins.
-   **Unified Export System:** A `server/report/compiler.ts` generates `ReportDefinition` IR, which is then rendered into PDF, PPTX, XLSX, and DOCX formats. Premium PDF exports leverage `@react-pdf/renderer` with embedded chart screenshots (captured client-side via `dom-to-image-more`), while client-side exports use jsPDF, pptxgenjs, and SheetJS. No cover pages, no KPI sections — ever.
-   **Export Reproducibility Lock:** When a `computeRef` field is present in export requests, `server/report/server-export-data.ts` fetches properties + global assumptions from DB, runs `computePortfolioProjection` server-side, and produces deterministic IS/CF statements, rows, and metrics — ignoring the client payload entirely. Response headers `X-Finance-Output-Hash` (SHA-256) and `X-Finance-Engine-Version` accompany each server-recomputed export. Legacy export path (client-supplied data) remains unchanged when `computeRef` is absent.
-   **Server-Side Export Generation (Phase 4):** `POST /api/exports/generate` endpoint accepts `{ entityType, entityId?, format, orientation, version, projectionYears, reportScope }` and generates PDF/Excel/PPTX/DOCX/CSV exports entirely server-side from cached compute results. Entity types: `portfolio | property | company`. The `version` parameter controls row detail (`short` = summary-only, `extended` = full line items). The `reportScope` parameter filters which statements to include (`all | income | cashflow | balance | overview | investment`). Server export builders in `server/report/server-export-data.ts` (`buildExportData`, `buildPropertyExportData`, `buildCompanyExportData`). CSV generator in `server/exports/csv-generator.ts`. `USE_SERVER_EXPORTS` feature flag (default: `true`) in `shared/constants.ts` enables the server path. Client `ExportDialog` passes `ServerExportConfig` with `entityType`, `entityId`, and `reportScope`; client-side fallback preserved when flag is `false`. Domain errors map to proper HTTP status codes (404 for not-found, 422 for missing assumptions).
-   **Scenario Computed Snapshot Persistence:** `scenario_results` table stores immutable computed artifacts (consolidated yearly JSON, output hash, inputs hash, audit opinion, engine version) per scenario. Three API endpoints: `POST /api/scenarios/:id/recompute` runs the full pipeline and persists results with drift detection; `GET /api/scenarios/:id/results/latest` returns the most recent result; `POST /api/scenarios/:id/drift-check` compares current computation against stored baseline with engine-version awareness (returns `match`, `input_changed`, or `engine_changed` status). Scenarios table carries denormalized `lastOutputHash`, `lastComputedAt`, `lastEngineVersion` pointers for quick staleness checks.
-   **Multi-Tenancy:** Supports users, groups, logos, themes, and branding resolution for multiple entities.
-   **LLM Integration:** Features a dual-model configuration (primary + fallback) for AI-powered functionalities across 7 domains, with configurable defaults in the Admin panel.
-   **Observability:** Structured logging via `server/logger.ts` (timestamped `[LEVEL] [source]` format) replaces all `console.error/warn` in server code. Sentry for error tracking, PostHog for analytics, Upstash Redis for caching, and circuit breakers for integration stability. Health endpoints: `GET /api/health/live` (uptime), `GET /api/health/ready` (DB connectivity), `GET /api/health/deep` (DB pool stats, cache stats, process memory). Export generation logs activity via `logActivity`.
-   **Image Processing:** A server-side Sharp pipeline generates responsive WebP/AVIF image variants.

## Tech Stack

- **Frontend:** React 18, TypeScript, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts, D3.js, framer-motion
- **Backend:** Express 5, TypeScript, Drizzle ORM, PostgreSQL
- **PDF:** jsPDF (client), @react-pdf/renderer (server premium)
- **AI/LLM:** Anthropic, Gemini (dual-model config with 7 domains)
- **Observability:** Sentry, PostHog, Upstash Redis

---

## Skill Router

| Domain | Skill Path | What It Covers |
|--------|-----------|---------------|
| Architecture | `.claude/skills/architecture/SKILL.md` | Tech stack, two-entity model, file organization |
| Design System | `.claude/skills/design-system/SKILL.md` | Colors, typography, component catalog |
| Theme Engine | `.claude/skills/ui/theme-engine.md` | Multi-theme system, token structure |
| Component Library | `.claude/skills/component-library/SKILL.md` | PageHeader, GlassButton, ExportMenu |
| Proof System | `.claude/skills/proof-system/SKILL.md` | 3,599 tests, verification commands |
| Finance (22 skills) | `.claude/skills/finance/` | IS, CF, BS, IRR, DCF, fee categories |
| Research (23 skills) | `.claude/skills/research/` | Market, ADR, occupancy, cap rate |
| UI (45 skills) | `.claude/skills/ui/` | Graphics, animation, navigation |
| Exports | `.claude/skills/exports/SKILL.md` | PDF, Excel, PPTX, PNG, CSV export system |
| Database | `.claude/skills/database/SKILL.md` | Dev/prod databases, Drizzle ORM, migrations |

---

## Key Rules

- **Calculations always highest priority** — never compromise financial accuracy for visuals
- **No raw hex in components** — use CSS variable tokens
- **All buttons GlassButton**, all pages PageHeader, all exports ExportMenu
- **No mock data** in production paths
- **Finance changes must pass verification** (UNQUALIFIED opinion)
- **Engine chain**: `gop = revenue − opex`, `agop = gop − feeBase − feeIncentive`, `noi = agop − expenseTaxes`, `anoi = noi − expenseFFE`
- **Balance Sheet Identity**: A = L + E must hold within $1
- **Cover pages never included** in any export format
- **LLM dual-model config** — primary + fallback model with vendor selection in Admin LLM tab

---

## User Roles

| Role | Access |
|------|--------|
| `admin` | Full — all pages + Admin Settings |
| `user` | Management-level — no Admin panel |
| `checker` | User + verification tools |
| `investor` | Limited — Dashboard, Properties, Profile, Help |

---

## Quick Commands

```bash
npm run dev            # Start dev server (port 5000)
npm run health         # tsc + tests + verify + doc harmony (~60s)
npm run test:summary   # All 3,599 tests, 156 files (~35s)
npm run verify:summary # 8-phase financial verification (~20s)
npm run lint:summary   # TypeScript check only (<10s)
npm run stats          # File/line/test counts (<5s)
npm run audit:quick    # Code quality checks (<3s)
npm run exports:check  # Unused export detection (<5s)
npm run diff:summary   # Git status + diff stats (<1s)
npm run db:push        # Push schema changes
npm run test:file -- <path>  # Single test file
```

---

## External Dependencies

-   **Database:** PostgreSQL (managed by Drizzle ORM)
-   **Frontend Libraries:** React 18, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts, D3.js, framer-motion
-   **PDF Generation:** jsPDF (client-side), @react-pdf/renderer (server-side premium)
-   **Document Processing:** Google Document AI (OCR)
-   **Image Processing:** Sharp
-   **Mapping:** MapLibre GL
-   **Monitoring & Analytics:** Sentry, PostHog
-   **Caching:** Upstash Redis
-   **AI/LLM Providers:** `@anthropic-ai/sdk`, Gemini
-   **Icons:** @phosphor-icons/react, Lucide
-   **Email:** Resend
-   **Voice AI:** ElevenLabs (for Marcela AI functionality)
-   **Telephony:** Twilio (for voice webhooks, SMS, Media Streams)
-   **Research/Data APIs:** RapidAPI (Property Finder), FREDService (economic data), HospitalityBenchmarkService (CoStar/STR/AirDNA adapter), MoodysService (credit risk analytics, default probability, property risk scores — requires MOODYS_API_KEY), SPGlobalService (Case-Shiller indices, economic forecasts, sector analytics — requires SPGLOBAL_API_KEY), Perplexity SDK, Tavily (for GroundedResearchService)
-   **Spreadsheet/Presentation:** xlsx, pptxgenjs (client-side)