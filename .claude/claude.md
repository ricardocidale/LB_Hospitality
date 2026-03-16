# Hospitality Business Group — Project Instructions

## Project Summary

Business simulation portal for **Hospitality Business Group**. Models a boutique hospitality management company alongside individual property SPVs with monthly and yearly financial projections. GAAP-compliant (ASC 230, ASC 360, ASC 470). 790 source files, ~144K lines, 3,151 tests across 144 test files. Hosted on Replit.

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

With 186 skill files, **never load all skills at once**. Use `.claude/skills/context-loading/SKILL.md` to find the minimum required set. Quick rules:
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
| Proof System | `.claude/skills/proof-system/SKILL.md` | 3,151 tests, 583 golden tests, verification commands |
| Testing (8 skills) | `.claude/skills/testing/` | Per-statement/analysis test coverage |
| 3D Graphics | `.claude/skills/3d-graphics/SKILL.md` | Three.js scenes, framer-motion wrappers |
| Database | `.claude/skills/database-environments/SKILL.md` | Dev/prod databases, migrations, sync |
| Multi-Tenancy | `.claude/skills/multi-tenancy/SKILL.md` | Users, groups, logos, themes, branding resolution |
| Exports | `.claude/skills/exports/SKILL.md` | PDF, Excel, PPTX, PNG, CSV export system |
| Source Code | `.claude/skills/source-code/SKILL.md` | Full source code map |
| Codebase Arch | `.claude/skills/codebase-architecture/SKILL.md` | Client folder structure, UI component catalog (80+), ElevenLabs architecture |
| Admin Components | `.claude/skills/admin-components/SKILL.md` | Admin panel hooks, styles, tooltip patterns |
| Admin (15 sections) | `.claude/skills/admin/SKILL.md` | 15-section shell pattern, extraction guide, API routes |
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
| Rules (19) | `.claude/rules/` | All behavioral constraints |
| Business Model | `.claude/skills/business-model/SKILL.md` | Dual-entity model, revenue streams, USALI waterfall, management fees, SAFE funding, ICP, property lifecycle |
| Product Vision | `.claude/skills/product-vision/SKILL.md` | Product identity, design tenets, workflow principles, navigation, user roles, white-labeling |
| Integrations | `.claude/skills/integrations/SKILL.md` | AI providers, voice AI, geospatial, document intelligence, communication, observability |
| Settings Architecture | `.claude/skills/settings/SKILL.md` | Three configuration surfaces (Mgmt Co, General Settings, Admin), property edit overrides, overlap prevention, decision tree for placing new settings |
| Design Export | `.claude/skills/design-export/SKILL.md` | Replicate the HBG design system in another project (components, themes, icons, charts) |
| Card Widths | `.claude/skills/ui/consistent-card-widths.md` | Page layout width categories, grid patterns, PageHeader alignment |
| Save Buttons | `.claude/skills/ui/save-button-placement.md` | SaveButton component, three placement patterns, dirty-tracking |
| Business Domain Pointers (13) | `.agents/skills/` | Slim pointers to `.claude/skills/` — business model, financial engine, verification, design philosophy, integrations, Marcela AI, API contract, product vision, export system, design export, card widths, save buttons, settings architecture |

---

## Testing & Proof System (3,151 Tests, 144 Files)

| Level | Domains | Skill |
|-------|---------|-------|
| Individual Property | IS, CF, BS, trial balance, reconciliation, ASC 230 | `testing/property-statements.md` |
| Consolidated Portfolio | Aggregation, eliminations, portfolio IRR | `testing/consolidated-statements.md` |
| Management Company | Company pro forma, fee linkage, funding | `testing/management-company.md` |
| Returns Analysis | IRR, NPV, MOIC, sensitivity | `testing/analysis-returns.md` |
| Golden Scenarios | 500 hand-calculated reference tests (incl. Clearwater Inn mgmt co + 1 property, WACC) | `testing/golden-scenarios.md` |

**Commands**: `npm test` (all 3,151) · `npm run verify` (7-phase GAAP) · `npm run health` (tsc+tests+verify)

---

## Recent Changes (March 16, 2026)

- **Governance Harmonization** (Task #153) — Created 7 new `.claude/skills/` files (business-model, product-vision, integrations, design-export, settings, ui/consistent-card-widths, ui/save-button-placement). All 13 `.agents/skills/` files converted to slim pointers referencing `.claude/skills/` counterparts. Stats updated: 828 source files, ~144K lines, 191 skill files, 3,151 tests across 144 test files.
- **Settings Architecture Governance** (Task #148) — Finalized `settings-architecture` skill defining where every setting belongs: Management Company owns entity config + revenue model, General Settings owns property defaults (3 tabs: Property Defaults, Macro, Other), Admin owns system-only config, Property Edit owns per-property overrides. Decision tree and overlap prevention rules formalized.
- **Property Creation Defaults from Global Assumptions** (Task #147) — `buildPropertyDefaultsFromGlobal()` reads `global_assumptions` for property defaults; hardcoded constants are last-resort fallbacks only.
- **Settings Consolidation** (Task #146) — ManagementFeesSection is single source for revenue model (service CRUD + incentive + per-property summary). Dead admin tabs removed. General Settings reduced to 3 tabs.
- **Insurance Removal** — Removed insurance expense from entire codebase. NOI formula is now `IBFC − Property Taxes`. All engines, schemas, UI, tests, and AI knowledge updated.
- **Tooltip & Help Text Enrichment** — Added `formula` prop to `LineItem`, `SubtotalRow`, and `MetricRow` components. Enriched tooltips across income statement, cash flow statement, and company assumption sections with investor-facing descriptions and inline formula display.
- **USALI 12th Edition Service Consolidation** (Task #136) — Updated SERVICE_HELP descriptions with USALI 12th Edition Schedule 16 references. Renamed "IT" → "IT & Technology" across all UI surfaces.
- **HBG Business Domain Skills Suite** (Task #137) — Created 8 interconnected SKILL.md files in `.agents/skills/`: hbg-business-model, financial-engine, verification-system, hbg-design-philosophy, integrations-infrastructure, marcela-ai-system, api-backend-contract, hbg-product-vision.
- **Admin Diagrams Enrichment** (Tasks #138–#140) — Enriched Level 1 Two-Entity Model diagram with fee streams and intercompany elimination detail. Added Level 1 Integration & Infrastructure Map. Added Level 2 Management Company Engine diagram. Replaced Level 2 Financial Pipeline with USALI Income Waterfall diagram.
- **Fee Category Restructure** (Tasks #108–#109) — Restructured management fee categories and fee schedule UI.
- **Funding Interest Rate & Accrual** (Task #116) — Interest accrual on funding balances shown on financial statements.
- **Login Page Redesign + Google Sign-In** (Tasks #63, #131) — New premium login page with Google OAuth integration.
- **ICP Split: Profile & Research Center** (Task #71) — Ideal Customer Profile split into separate Profile and Research Center pages.
- **LLM Tab Dual-Model Architecture** (Task #101) — Vendor selection with dual-model config (primary + fallback) in Admin.
- **DocuSign & Slack Integration Removal** (Tasks #133, #134) — Removed DocuSign and Slack integrations from codebase.
- **Resend Email Replacement** (Task #68) — Resend replaces SendGrid for all transactional email.
- **Excel Export Standardization** (Task #112) — All Excel exports use standardized 4-sheet workbook format.
- **Premium PDF Export Fixes** (Tasks #117, #119) — Fixed PDF rendering and layout issues across export types.
- **Management Company Rename** (Task #120) — "Management Company" label used consistently throughout UI.
- **Company Defaults in General Settings** (Tasks #118, #123, #124) — Company-level defaults configurable in Admin General Settings.
- **Sidebar & Navigation Cleanup** (Tasks #130, #132) — Streamlined sidebar navigation and removed unused routes.
- **Admin Hardening Phases 1–2C** (Session March 13) — Zod validation on Marcela endpoints, audit trail logging, rate limiting, centralized AI SDK singletons, shared admin hooks.
- **UI Polish** (Tasks #45–#49, #107) — Consistent card widths, save button placement, left-aligned tabs, tooltip standardization.
- **Norfolk AI Theme** (Task #84) — Norfolk AI theme preset seeded into theme engine.
- **Database Integrity Hardening** (Task #80) — Foreign key indexes, composite indexes, constraint enforcement.
- **Performance: Deterministic Calculations** (Task #64) — Optimized calculation engine for deterministic paths.

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
- **Brand colors**: SAGE=#9FBCA4, DARK_GREEN=#257D41, NAVY=#1A2332, SECTION_BG=#EFF5F0, ALT_ROW=#F8FAF9
- **normalizeCaps() abbreviations**: GOP, NOI, AGOP, ANOI, GAAP, FFE, FF&E, DSCR, IRR, CFO, ADR, REVPAR, LTV, EBITDA, WACC
- **Icon standard**: `IconPlay` for "Run Research", `IconEye` for "Criteria", `IconBanknote` for Reconciliation
- **Resend replaces SendGrid** for all transactional email — `server/services/resend.ts`
- **ICP = Profile + Research Center** — two separate pages, not one monolithic ICP page
- **LLM dual-model config** — primary + fallback model with vendor selection (OpenAI, Anthropic, Gemini) in Admin LLM tab
- **Norfolk AI theme** — additional theme preset alongside Tuscan Olive Grove
- **Settings placement** — Use `settings-architecture` skill decision tree before placing any new setting. Three surfaces only: Mgmt Co (entity config), General Settings (property defaults + macro + other), Admin (system-only)

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

All migrations are idempotent SQL scripts in `server/migrations/`. Each is wired into `server/index.ts` startup sequence before `seedAdminUser()`. Migration files: `prod-sync-001.ts`, `prod-sync-002.ts`, `research-config-001.ts`, `inflation-per-entity-001.ts`, `companies-theme-001.ts`, `icp-config-001.ts`, `marcela-voice-001.ts`, `property-photos-001.ts`, `documents-001.ts`, `funding-interest-001.ts`, `google-id-001.ts`, `composite-indexes-001.ts`, `auto-research-refresh-001.ts`, `notification-logs-001.ts`, `fk-indexes-001.ts`, `drop-plaid-001.ts`.

---

## Quick Commands

```bash
npm run dev            # Start dev server (port 5000)
npm run health         # tsc + tests + verify (~4 lines)
npm run test:summary   # All 3,151 tests, 1-line output
npm run verify:summary # 7-phase verification, compact output
npm run db:push        # Push schema changes
npm run diff:summary   # Compact git status + diff stat
npm run test:file -- <path>  # Single test file
npm run stats          # Codebase metrics
```
