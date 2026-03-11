# Hospitality Business Group — Project Instructions

## Project Summary

Business simulation portal for **Hospitality Business Group**. Models a boutique hospitality management company alongside individual property SPVs with monthly and yearly financial projections. GAAP-compliant (ASC 230, ASC 360, ASC 470). ~709 source files, ~114,167 lines, 2,927 tests across 125 files. Hosted on Replit.

---

## User Preferences

- Simple, everyday language. Ask clarifying questions before implementing — do not assume.
- **TOP PRIORITY: Financial accuracy always beats UI enhancements.** The 2,800-test proof system must always pass.
- Always format money as currency (commas, appropriate precision).
- All skills stored under `.claude/` only (never elsewhere).
- Company name is "Hospitality Business Group" (or "Hospitality Business" for short).
- Update skills and manuals after every feature change.
- All UI components must reference a theme via the theme engine.
- New UI features get their own skill file in `.claude/skills/ui/`.
- **Button Label Consistency:** Always "Save" — never "Update". See `rules/ui-patterns.md`.
- **100% Session Memory:** Save decisions to `rules/session-memory.md` at session end.
- **Every financial line item** should have a ? tooltip (HelpTooltip or InfoTooltip).
- **Every page must be graphics-rich** — charts, animations, visual elements required.
- **Context reduction is mandatory.** Every refactor must produce skills, helpers, scripts. See `rules/context-reduction.md`.
- **Premium design, always.** $50K+ bespoke financial platform feel. See `rules/premium-design.md`.
- **Always update claude.md after every task.** Mandatory — no exceptions.

---

## Current Theme

**Tuscan Olive Grove** (olive-sage) is default. 5 presets available. See `.claude/skills/ui/theme-engine.md`.

---

## Context Loading Protocol

With 172+ skill files, **never load all skills at once**. Use `.claude/skills/context-loading/SKILL.md` to find the minimum required set. Quick rules:
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
| Proof System | `.claude/skills/proof-system/SKILL.md` | 2,927 tests, 500 golden tests, verification commands |
| Testing (7 skills) | `.claude/skills/testing/` | Per-statement/analysis test coverage |
| 3D Graphics | `.claude/skills/3d-graphics/SKILL.md` | Three.js scenes, framer-motion wrappers |
| Database | `.claude/skills/database-environments/SKILL.md` | Dev/prod databases, migrations, sync |
| Multi-Tenancy | `.claude/skills/multi-tenancy/SKILL.md` | Users, groups, logos, themes, branding resolution |
| Exports | `.claude/skills/exports/SKILL.md` | PDF, Excel, PPTX, PNG, CSV export system |
| Source Code | `.claude/skills/source-code/SKILL.md` | Full source code map |
| Codebase Arch | `.claude/skills/codebase-architecture/SKILL.md` | Client folder structure, UI component catalog (80+), ElevenLabs architecture |
| Admin Components | `.claude/skills/admin-components/SKILL.md` | Admin panel hooks, styles, tooltip patterns |
| Admin (19 tabs) | `.claude/skills/admin/SKILL.md` | 19-tab shell pattern, extraction guide, API routes |
| Marcela AI | `.claude/skills/marcela-ai/SKILL.md` | Multi-channel assistant, audio pipeline, ElevenLabs |
| Twilio | `.claude/skills/twilio-telephony/SKILL.md` | Voice webhooks, SMS, Media Streams |
| Finance (17 skills) | `.claude/skills/finance/` | Income statement, cash flow, balance sheet, IRR, DCF, etc. |
| Research (17 skills) | `.claude/skills/research/` | Market, ADR, occupancy, cap rate, auto-refresh, etc. |
| Chart Library | `.claude/skills/charts/SKILL.md` | 9 reusable chart components |
| Mobile Responsive | `.claude/skills/mobile-responsive/SKILL.md` | Breakpoints, tablet layouts, responsive helpers |
| UI (28 skills) | `.claude/skills/ui/` | Graphics, animation, entity cards, interactions, navigation, Magic UI effects |
| API Routes | `.claude/skills/architecture/api-routes.md` | All REST endpoints (load when writing API code) |
| Constants Ref | `.claude/skills/finance/constants-and-config.md` | All named constants and protected fields |
| Verification | `.claude/skills/proof-system/verification-system.md` | GAAP verification pipeline detail |
| Release Checklist | `.claude/skills/proof-system/release-audit-checklist.md` | Pre-release audit (load for releases) |
| Property Chatbot | `server/routes/chat.ts` | Gemini-powered property analysis chat (`/api/chat`) |
| Rules (20) | `.claude/rules/` | All behavioral constraints |

---

## Testing & Proof System (2,927 Tests, 125 Files)

| Level | Domains | Skill |
|-------|---------|-------|
| Individual Property | IS, CF, BS, trial balance, reconciliation, ASC 230 | `testing/property-statements.md` |
| Consolidated Portfolio | Aggregation, eliminations, portfolio IRR | `testing/consolidated-statements.md` |
| Management Company | Company pro forma, fee linkage, funding | `testing/management-company.md` |
| Returns Analysis | IRR, NPV, MOIC, sensitivity | `testing/analysis-returns.md` |
| Golden Scenarios | 500 hand-calculated reference tests (incl. Clearwater Inn mgmt co + 1 property, WACC) | `testing/golden-scenarios.md` |

**Commands**: `npm test` (all 2,927) · `npm run verify` (7-phase GAAP) · `npm run health` (tsc+tests+verify)

---

## Recent Changes (March 11, 2026)

- **AI Agents restructured** — **Rebecca** (Gemini text chat, renamed from PropertyChatbot) + **Marcela** (ElevenLabs voice). Sidebar "AI Assistants" group. Admin has separate config tabs for each under "AI Agents" group.
- **Admin Diagrams tab** — Mermaid workflow charts at 3 levels (system overview, domain flows, detailed sub-flows). Under Admin → System → Diagrams.
- **Deterministic tool enforcement** — Extracted magic numbers to named constants in `shared/constants.ts`. Chat route uses `executeComputationTool` via shared `buildPropertyContext.ts`.
- **Golden scenario** — "Clearwater Inn" (15 rooms, $175 ADR, 1 property + management co). 60 assertions covering IS/CF/BS, fee zero-sum, consolidated elimination. `tests/golden/mgmt-company-plus-one-property-golden.test.ts`.
- **Seeding hardened** — `seedAdminUser()` no longer resets existing passwords (requires `FORCE_RESEED_PASSWORDS=true`). Reset-all-passwords requires typed confirmation phrase.
- **Theme admin assignment** — `PATCH /api/admin/users/:id/theme` endpoint for per-user theme override.
- **WACC-based DCF** — Property and portfolio valuation uses WACC `(E/V × Re) + (D/V × Rd × (1−T))` instead of IRR as discount rate. Intermediate approach: user-provided cost of equity (default 18%), no CAPM. New deterministic tools: `compute_wacc`, `compute_portfolio_wacc` (33 total tools). `costOfEquity` column on `global_assumptions`. Research badges for cost of equity on Company Assumptions.
- **DB indexes** — Already existed on `properties.user_id` and `global_assumptions.user_id` (confirmed).

---

## Key Rules

- **Calculations always highest priority** — never compromise financial accuracy for visuals
- **No raw hex in components** — use CSS variable tokens
- **All buttons GlassButton**, all pages PageHeader, all exports ExportMenu
- **No mock data** in production paths
- **Finance changes must state Active Skill** and pass verification (UNQUALIFIED)
- **ANOI terminology**: After-fee NOI = "Adjusted NOI (ANOI)". Internal field stays `noi`.
- **Marcela must NEVER compute financial values** — all data from the calculation engine

---

## User Roles

| Role | Access |
|------|--------|
| `admin` | Full — all pages + Admin Settings |
| `partner` | Management-level — no Admin panel |
| `checker` | Partner + verification tools |
| `investor` | Limited — Dashboard, Properties, Profile, Help |

---

## Quick Commands

```bash
npm run dev            # Start dev server (port 5000)
npm run health         # tsc + tests + verify (~4 lines)
npm run test:summary   # All 2,927 tests, 1-line output
npm run verify:summary # 7-phase verification, compact output
npm run db:push        # Push schema changes
npm run diff:summary   # Compact git status + diff stat
npm run test:file -- <path>  # Single test file
npm run stats          # Codebase metrics
```
