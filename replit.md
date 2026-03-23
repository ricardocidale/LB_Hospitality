# Hospitality Business Group — Project Instructions

## Overview

Business simulation portal for **Hospitality Business Group**. Models a boutique hospitality management company alongside individual property SPVs with monthly and yearly financial projections. GAAP-compliant (ASC 230, ASC 360, ASC 470). 952 source files, ~158K lines, 3,498 tests across 151 test files. Hosted on Replit.

> **Marcela ISOLATED** — Voice agent + ElevenLabs + Twilio phone all gated behind `MARCELA_ISOLATED` flag. Config preserved, zero network calls. Rebecca sole active agent.

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

The application is built with a React 18 frontend (TypeScript, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts, D3.js, framer-motion) and an Express 5 backend (Drizzle ORM, PostgreSQL, Zod).

**Core Design Principles:**
- **Financial Accuracy:** The highest priority, ensured by a comprehensive proof system with 3,498 tests across 151 files, including GAAP verification.
- **Modular Skills:** The project uses a skill-based architecture (`.claude/skills/`) for managing domain knowledge and context loading.
- **Theming:** A robust theme engine (Tuscan Olive Grove default, 5 presets) ensures consistent UI appearance, with all components referencing a central theme.
- **Consistent UI/UX:** Adherence to specific UI patterns (e.g., GlassButton, PageHeader, ExportMenu), consistent button labels ("Save"), and detailed design standards. Every financial line item requires an `InfoTooltip`.
- **Image Processing:** A server-side Sharp pipeline generates multiple WebP/AVIF image variants for responsive loading.
- **Data Governance:** Governed model constants are primarily DB-backed with constant fallbacks, editable via specific admin interfaces. Inflation rates cascade from property to company to global defaults.
- **Settings Architecture:** Configuration is managed across "Company Assumptions" (admin-only, entity configuration), the "Admin panel" (system configuration), and a read-only "Model Inputs" panel for non-admins.
- **Export System:** A unified report compiler (`server/report/compiler.ts`) generates `ReportDefinition` IR, which is then rendered into PDF, PPTX, XLSX, and DOCX formats. Premium PDF exports utilize `@react-pdf/renderer` and an LLM Design Pass for intelligent layout. Client-side exports use jsPDF, pptxgenjs, and SheetJS.
- **USALI Compliance:** All property-level Income Statements and Cash Flow Statements are structured according to USALI 12th Edition standards.
- **Balance Sheet Identity:** The equation A = L + E must hold within $1 on every balance sheet.
- **Multi-Tenancy:** Supports users, groups, logos, themes, and branding resolution.
- **LLM Integration:** Dual-model configuration (primary + fallback) for various AI-powered features across 7 domains, with configurable defaults in the Admin panel.
- **Observability:** Sentry for error tracking, PostHog for analytics, Upstash Redis for caching, and circuit breakers for integration stability.

## Tech Stack

- **Frontend:** React 18 · TypeScript · Wouter · TanStack Query · Zustand · shadcn/ui · Tailwind CSS v4 · Recharts · D3.js · framer-motion
- **Backend:** Express 5 · Drizzle ORM · PostgreSQL · Zod
- **PDF:** jsPDF (client), @react-pdf/renderer (server premium) with LLM Design Pass
- **AI/LLM:** Anthropic Claude, Gemini — dual-model config (primary + fallback) across 7 domains
- **Mapping:** MapLibre GL
- **Voice/Telephony:** ElevenLabs, Twilio
- **Email:** Resend
- **Image Processing:** Sharp (WebP/AVIF pipeline)
- **Icons:** @phosphor-icons/react, Lucide
- **Monitoring:** Sentry, PostHog, Upstash Redis

## Skill Router

| Domain | Skill Path |
|--------|-----------|
| Context Loading | `.claude/skills/context-loading/SKILL.md` |
| Architecture | `.claude/skills/architecture/SKILL.md` |
| Design System | `.claude/skills/design-system/SKILL.md` |
| Theme Engine | `.claude/skills/ui/theme-engine.md` |
| Proof System | `.claude/skills/proof-system/SKILL.md` |
| Finance (22 skills) | `.claude/skills/finance/` |
| Research (23 skills) | `.claude/skills/research/` |
| UI (45 skills) | `.claude/skills/ui/` |
| Exports | `.claude/skills/exports/SKILL.md` |
| Database | `.claude/skills/database/SKILL.md` |
| Admin (16 sections) | `.claude/skills/admin/SKILL.md` |
| Marcela AI | `.claude/skills/marcela-ai/SKILL.md` |
| Coding Conventions | `.claude/skills/coding-conventions/SKILL.md` |

## Key Rules

- **Financial accuracy always beats UI enhancements.** The proof system must always pass.
- **No cover pages EVER** in any PDF export.
- **Balance Sheet Identity:** A = L + E must hold within $1.
- **USALI 12th Edition** compliance for all property-level statements.
- **Doc Harmony:** `replit.md` and `.claude/claude.md` must stay in sync.
- **Button labels:** Always "Save" — never "Update".
- **Theme compliance:** All UI components must reference the theme engine.
- **LLM dual-model config** — primary + fallback, 7 domains, no hardcoded models.
- **Brand colors:** SAGE=#9FBCA4, DARK_GREEN=#257D41, NAVY=#1A2332

## User Roles

| Role | Access |
|------|--------|
| `admin` | Full — all pages + Admin Settings |
| `user` | Management-level — no Admin panel |
| `checker` | User + verification tools |
| `investor` | Limited — Dashboard, Properties, Profile, Help |

## Quick Commands

```bash
npm run dev            # Start dev server (port 5000)
npm run health         # tsc + tests + verify + doc harmony (~60s)
npm run test:summary   # All 3,498 tests, 151 files (~35s)
npm run verify:summary # 8-phase financial verification (~20s)
npm run lint:summary   # TypeScript check only (<10s)
npm run stats          # File/line/test counts (<5s, no vitest)
npm run audit:quick    # Code quality: `any`, TODO, console.log (<3s)
npm run exports:check  # Unused export detection (<5s)
npm run diff:summary   # Git status + diff stats (<1s)
npm run db:push        # Push schema changes
```

## External Dependencies

- **Database:** PostgreSQL (managed via Drizzle ORM)
- **UI Libraries:** React 18, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts, D3.js, framer-motion
- **PDF Generation:** jsPDF (client-side), @react-pdf/renderer (server-side premium)
- **Document Processing:** Google Document AI (OCR)
- **Image Processing:** Sharp
- **Mapping:** MapLibre GL
- **Monitoring & Analytics:** Sentry, PostHog
- **Caching:** Upstash Redis
- **AI/LLM Providers:** `@anthropic-ai/sdk@0.78.0`, Gemini (for specific AI features)
- **Icons:** @phosphor-icons/react, Lucide (default)
- **Email:** Resend (transactional emails)
- **Voice AI:** ElevenLabs (for Marcela AI)
- **Telephony:** Twilio (for voice webhooks, SMS, Media Streams)
- **Research/Data APIs:** RapidAPI (Property Finder), FREDService (economic data), HospitalityBenchmarkService (CoStar/STR/AirDNA adapter), Perplexity SDK, Tavily (for GroundedResearchService)
- **Spreadsheet/Presentation:** xlsx, pptxgenjs (client-side)
- **Microsoft Office Formats:** DOCX (via server-side rendering logic for premium exports)

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
- **USALI Restructure** — All property-level IS and CF statements follow USALI 12th Edition order.
- **Insurance Removal** — Removed insurance expense from entire codebase. NOI = IBFC − Property Taxes.
- **Fee Category Restructure** (Tasks #108–#109), **Funding Interest** (Task #116), **Login Redesign** (Tasks #63, #131), **ICP Split** (Task #71), **LLM Dual-Model** (Task #101), **DocuSign/Slack Removal** (Tasks #133–134), **Resend Email** (Task #68), **Excel Standardization** (Task #112), **Admin Hardening** (March 13), **Norfolk AI Theme** (Task #84), **DB Integrity** (Task #80), **Deterministic Calcs** (Task #64).