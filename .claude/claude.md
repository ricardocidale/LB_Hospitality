# Hospitality Business Group — Project Instructions

## Project Summary

Business simulation portal for **Hospitality Business Group**. Models a boutique hospitality management company alongside individual property SPVs with monthly and yearly financial projections. GAAP-compliant (ASC 230, ASC 360, ASC 470). 955 source files, ~159K lines, 3,499 tests across 151 test files. Hosted on Replit.

> **Marcela ISOLATED** — Voice agent + ElevenLabs + Twilio phone all gated behind `MARCELA_ISOLATED` flag. Config preserved, zero network calls. Rebecca sole active agent. See `.claude/plans/MARCELA-ISOLATION.md` for full restoration guide.

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
- **Always update claude.md after every task.** Mandatory — no exceptions.

---

## Current Theme

**Tuscan Olive Grove** (olive-sage) is default. 5 presets available. See `.claude/skills/ui/theme-engine.md`.

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
| Proof System | `.claude/skills/proof-system/SKILL.md` | 3,499 tests, 583 golden tests, verification commands |
| Testing (8 skills) | `.claude/skills/testing/` | Per-statement/analysis test coverage |
| 3D Graphics | `.claude/skills/3d-graphics/SKILL.md` | Three.js scenes, framer-motion wrappers |
| Database | `.claude/skills/database/SKILL.md` | Dev/prod databases, Drizzle ORM, migrations, sync |
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
| Rebecca Chatbot | `.claude/skills/rebecca-chatbot/SKILL.md` | Gemini-powered portfolio analytics chat |
| Document Intelligence | `.claude/skills/document-intelligence/SKILL.md` | Google Document AI OCR pipeline, field mapping |
| Map View | `.claude/skills/map-view/SKILL.md` | MapLibre GL, Supercluster clustering, globe animation |
| Notifications | `.claude/skills/notifications/SKILL.md` | Alert rules, Resend email, notification logs |
| Rules (21) | `.claude/rules/` | All behavioral constraints |
| Business Model | `.claude/skills/business-model/SKILL.md` | Dual-entity model, revenue streams, USALI waterfall, management fees, SAFE funding, ICP, property lifecycle |
| Product Vision | `.claude/skills/product-vision/SKILL.md` | Product identity, design tenets, workflow principles, navigation, user roles, white-labeling |
| Integrations | `.claude/skills/integrations/SKILL.md` | AI providers, voice AI, geospatial, document intelligence, communication, observability |
| Settings Architecture | `.claude/skills/settings/SKILL.md` | Two configuration surfaces (Company Assumptions for admins, Admin panel for system config), read-only Model Inputs panel for non-admins on Company page |
| Design Export | `.claude/skills/design-export/SKILL.md` | Replicate the HBG design system in another project (components, themes, icons, charts) |
| Card Widths | `.claude/skills/ui/consistent-card-widths.md` | Page layout width categories, grid patterns, PageHeader alignment |
| Save Buttons | `.claude/skills/ui/save-button-placement.md` | SaveButton component, three placement patterns, dirty-tracking |
| Business Domain Pointers (13) | `.agents/skills/` | Slim pointers to `.claude/skills/` — business model, financial engine, verification, design philosophy, integrations, Marcela AI, API contract, product vision, export system, design export, card widths, save buttons, settings architecture |

---

## Testing & Proof System (3,498 Tests, 151 Files)

| Level | Domains | Skill |
|-------|---------|-------|
| Individual Property | IS, CF, BS, trial balance, reconciliation, ASC 230 | `testing/property-statements.md` |
| Consolidated Portfolio | Aggregation, eliminations, portfolio IRR | `testing/consolidated-statements.md` |
| Management Company | Company pro forma, fee linkage, funding | `testing/management-company.md` |
| Returns Analysis | IRR, NPV, MOIC, sensitivity | `testing/analysis-returns.md` |
| Golden Scenarios | 500 hand-calculated reference tests (incl. Clearwater Inn mgmt co + 1 property, WACC) | `testing/golden-scenarios.md` |

**Commands**: `npm test` (all 3,499) · `npm run verify` (8-phase GAAP) · `npm run health` (tsc+tests+verify+doc harmony)

---

## Recent Changes (March 23, 2026)

- **Premium Overview PDF Polish** (Task #230) — Removed header accent bar, increased font sizes, denser pagination for Overview PDF exports.
- **Line-Item Detail Toggle Removal** (Task #228) — Removed conflicting line-item detail toggle from export UI.
- **Premium PDF Theme Compliance** (Task #227) — Removed out-of-theme colors from premium PDF, added LLM design pass for layout hints, dropped Puppeteer dependency for PDF (retained for PNG only).
- **Hardcoded Green → Theme Tokens** (Task #226) — Replaced all hardcoded green color values with theme CSS variable tokens.
- **Overview PDF Export & Cover Page Removal** (Task #225) — Fixed Overview tab premium PDF export (multi-page report with KPI cards, projections, portfolio, property insights, USALI waterfall). Cover pages permanently removed from all export formats.
- **Unified Report Compiler** (Task #224) — Built `server/report/compiler.ts` with single `compileReport()` → `ReportDefinition` IR consumed by all 5 format renderers. No AI calls in any renderer.
- **Premium PDF Engine Replacement** (Task #223) — Replaced puppeteer-core + AI HTML pipeline with @react-pdf/renderer for premium PDF exports.
- **Hardcoded Tailwind → Theme Variables** (Task #222) — Replaced hardcoded Tailwind color classes with theme CSS variables throughout UI.
- **Semantic Theme Colors** (Task #221) — Added success/warning/info semantic color tokens to theme engine. Fixed ExportDialog styling.
- **Export Settings 3-Column Layout** (Task #220) — Reorganized export settings UI into responsive 3-column grid.
- **Google Drive Integration Fix** (Task #219) — Fixed missing storage bindings, dev callback, and startup validation for Google Drive.
- **Google OAuth & Drive Integration** (Task #218) — Added Google OAuth login and Google Drive file storage integration.
- **Dependency Optimization** (Task #217) — Removed unused npm packages, reduced bundle size.
- **Database Audit & Optimization** (Task #216) — Comprehensive DB audit: added missing indexes, FK constraints, query optimizations.
- **Seed Data Deduplication** (Task #215) — Extracted seed data into config files, eliminated duplicate seed definitions.
- **LLM Models & UI Colors Centralization** (Task #214) — Centralized LLM model constants, UI color tokens, and local storage limits.
- **Enum & Constants Extraction** (Task #213) — Extracted enums, brand name, and protected emails into `shared/constants.ts`.
- **User Seed Config Extraction** (Task #212) — Extracted hardcoded user seeds to configuration files.
- **Skills Audit & Refresh** (Task #211) — Audited and refreshed all 191 skill files for accuracy.
- **Monolith File Splitting** (Task #210) — Split 5 monolithic files into focused, single-responsibility modules.
- **Dependency Audit & Cleanup** (Task #209) — Removed unused dependencies, updated outdated packages.
- **Directory Flattening** (Task #208) — Flattened unnecessary directory nesting for cleaner file structure.
- **Users Tab Theme Contrast** (Task #207) — Users tab card styling updated for theme-compatible contrast shading.
- **Research Export Theme Colors** (Task #206) — Threaded theme-aware colors through research PDF and PNG exports.
- **Reassign User to Entity** (Task #205) — Reassigned Ricardo Cidale to KIT Capital entity.
- **Discreet Sidebar User Section** (Task #204) — Streamlined sidebar user section for cleaner navigation.
- **Statement Parity Check** (Task #203) — Added statement parity check script and Export Parity Registry skill.
- **Users Tab Grid Layout** (Task #202) — Users tab redesigned with 3-column responsive grid.
- **Financial Statements Parity** (Task #201) — Unified 3-statement PDF exports with consistent formatting.
- **Logo Redesign** (Task #200) — H+ Analytics logo redesign (modern AI-company aesthetic), then reverted to original flower/petal pattern.
- **Dashboard Exports Split** (Task #199) — Split `dashboardExports.ts` into focused export modules.
- **Puppeteer for Premium PDF** (Task #198) — Replaced jsPDF with Puppeteer for premium PDF exports (later superseded by Task #223 @react-pdf/renderer).

## Changes (March 16, 2026)

- **Premium PDF Export Redesign** — Switched premium export AI backend from Anthropic to Gemini 2.5 Flash. Enterprise-quality PDF design with branded headers, KPI cards, callout blocks.
- **Model Defaults Admin Section** — New "Model Defaults" tab in Admin > Business group with Market & Macro and Property Underwriting sub-tabs.
- **Verification Bug Fixes** — Fixed DSCR check for pre-operational Year 1 properties, Net Income/Cash Flow identity checks for NOL carryforward.
- **Multi-Vendor Research LLMs** — Vendor-agnostic `ResearchClient` with Anthropic, OpenAI, and Gemini adapters.
- **Settings Elimination & Access Control** (Task #168) — Eliminated General Settings page. Two-surface model: Company Assumptions + Admin.
- **Governance Harmonization** (Task #153) — 7 new skills, 13 slim pointers.
- **Configuration Terminology Refresh** (Tasks #180–182) — Standardized "seed defaults", "live assumptions", "config switches" vocabulary.
- **USALI Restructure** — All property-level IS and CF statements follow USALI 12th Edition order.
- **Insurance Removal** — Removed insurance expense from entire codebase. NOI = IBFC − Property Taxes.
- **Fee Category Restructure** (Tasks #108–#109), **Funding Interest** (Task #116), **Login Redesign** (Tasks #63, #131), **ICP Split** (Task #71), **LLM Dual-Model** (Task #101), **DocuSign/Slack Removal** (Tasks #133–134), **Resend Email** (Task #68), **Excel Standardization** (Task #112), **Admin Hardening** (March 13), **Norfolk AI Theme** (Task #84), **DB Integrity** (Task #80), **Deterministic Calcs** (Task #64).

---

## Export System

Full reference: `.claude/skills/exports/SKILL.md`. SDD: `.claude/skills/exports/premium-export-spec.md`.
- **Unified Report Compiler**: `server/report/compiler.ts` — single `compileReport()` produces a `ReportDefinition` IR (types in `server/report/types.ts`) consumed by all 5 format renderers. Consolidates section selection, value formatting, formula-row filtering, chart series extraction, investment section splitting, and theme resolution.
- **Premium Export**: `POST /api/exports/premium` — All 5 formats (PDF, PPTX, DOCX, XLSX, PNG) compile once via `compileReport()` then dispatch to format-specific renderers. No LLM calls for any format.
- **Format renderers**: PDF (`server/pdf/render.tsx` via @react-pdf/renderer), PPTX (`generatePptxFromReport`), XLSX (`generateExcelFromReport`), DOCX (`generateDocxFromReport`), PNG (`generatePngFromReport` via browser screenshots). Each accepts a `ReportDefinition` with pre-formatted values and design tokens.
- **Client-side fallback** (when premium toggle off): jsPDF, pptxgenjs, SheetJS, CSV, dom-to-image-more.
- **Page dimensions**: Landscape = 16:9 (406.4mm × 228.6mm), Portrait = US Letter (215.9mm × 279.4mm).
- **Browser rendering**: `server/browser-renderer.ts` — Puppeteer with system Chromium. Used for PNG rendering only. Skill: `.claude/skills/exports/pdf-rendering.md`.
- **Report structure**: Statement→Chart interleaving. Each statement table is followed by a chart page. Overview tab produces multi-page reports with KPI cards, projection tables, portfolio composition, property insights, distribution tables, and USALI waterfall. Admin ExportConfig toggles control which sections appear.
- **Export Rules** (see `.claude/rules/exports.md`):
  1. **Full-scope**: Export from ANY tab exports ALL statements — never just the active tab.
  2. **Formula filtering**: Rows with `isItalic=true` never exported.
  3. **Short/Extended**: Short = header/total rows; Extended = all line items. Controlled via `summaryOnly` parameter.
  4. **Theme colors**: Client sends `themeColors` array; server resolves via `resolveThemeColors()`.
  5. **File save**: `saveFile()` tries native `showSaveFilePicker` (Chrome/Comet), falls back to download.
  6. **Single button**: One `ExportMenu` per page in tab bar — no per-tab export buttons.

---

## Key Rules

- **Calculations always highest priority** — never compromise financial accuracy for visuals
- **No raw hex in components** — use CSS variable tokens
- **All buttons GlassButton**, all pages PageHeader, all exports ExportMenu
- **No mock data** in production paths
- **Finance changes must state Active Skill** and pass verification (UNQUALIFIED)
- **ANOI terminology**: After-fee NOI = "Adjusted NOI (ANOI)". Internal field stays `noi`.
- **Marcela must NEVER compute financial values** — all data from the calculation engine
- **Engine chain**: `gop = revenue − opex`, `agop = gop − feeBase − feeIncentive`, `noi = agop − expenseTaxes`, `anoi = noi − expenseFFE`
- **Balance Sheet Identity**: A = L + E must hold within $1. Cash derivation uses `m.anoi` (never `m.noi`). See `rules/balance-sheet-identity.md`.
- **Brand colors**: SAGE=#9FBCA4, DARK_GREEN=#257D41, NAVY=#1A2332, SECTION_BG=#EFF5F0, ALT_ROW=#F8FAF9
- **normalizeCaps() abbreviations**: GOP, NOI, AGOP, ANOI, GAAP, FFE, FF&E, DSCR, IRR, CFO, ADR, REVPAR, LTV, EBITDA, WACC
- **Icon standard**: `IconPlay` for "Run Research", `IconEye` for "Criteria", `IconBanknote` for Reconciliation
- **Resend replaces SendGrid** for all transactional email — `server/services/resend.ts`
- **ICP = Profile + Research Center** — two separate pages, not one monolithic ICP page
- **LLM dual-model config** — primary + fallback model with vendor selection (OpenAI, Anthropic, Gemini) in Admin LLM tab. 7 domains: Company Research, Property Research, Market Research, Report Generation, Chatbot (Rebecca), Premium Exports, AI Utilities. All AI model selections defined in admin LLMs page only — no hardcoded models anywhere.
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

## Database Migration Pattern

Consolidated Drizzle-managed SQL migrations in `migrations/`. 7 migration files:
- `0000_brainy_mother_askani.sql` — initial schema
- `0001_optional_password_hash.sql` — optional password hash
- `0002_db_integrity_hardening.sql` — FK indexes, composite indexes, constraints
- `0003_add_business_insurance.sql` — business insurance fields
- `0004_consolidated_schema.sql` — consolidated schema (all tables)
- `0005_google_drive_tokens.sql` — Google Drive token storage
- `0006_add_missing_indexes.sql` — additional performance indexes

Old individual `server/migrations/*.ts` files have been superseded by this consolidated Drizzle migration structure.

---

## Governed Model Constants (DB-Backed)

`DEPRECIATION_YEARS` (27.5) and `DAYS_PER_MONTH` (30.5) are now DB-backed with constant fallbacks. Cascade: `property.depreciationYears → global.depreciationYears → DEPRECIATION_YEARS constant (27.5)`. `daysPerMonth` is global-only: `global.daysPerMonth → DAYS_PER_MONTH constant (30.5)`. Editable in Company Assumptions under "Model Constants" with governed field wrappers. All engine files (`resolve-assumptions.ts`, `property-engine.ts`), server checker files, and client audit files use the cascade.

---

## Quick Commands

```bash
npm run dev            # Start dev server (port 5000)
npm run health         # tsc + tests + verify + doc harmony (~60s)
npm run test:summary   # All 3,499 tests, 151 files (~35s)
npm run verify:summary # 8-phase financial verification (~20s)
npm run lint:summary   # TypeScript check only (<10s)
npm run stats          # File/line/test counts (<5s, no vitest)
npm run audit:quick    # Code quality: `any`, TODO, console.log (<3s)
npm run exports:check  # Unused export detection (<5s)
npm run diff:summary   # Git status + diff stats (<1s)
npm run db:push        # Push schema changes
npm run test:file -- <path>  # Single test file
```
