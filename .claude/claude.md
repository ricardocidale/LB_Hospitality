# Hospitality Business Group — Project Instructions

## Project Summary

Business simulation portal for **Hospitality Business Group**. Models a boutique hospitality management company alongside individual property SPVs with monthly and yearly financial projections. GAAP-compliant (ASC 230, ASC 360, ASC 470) with IRS depreciation rules and an independent audit/verification engine. Built and hosted entirely on Replit.

**Codebase:** 298 source files, ~65,000 lines of code, 1,529 tests across 72 files.

---

## User Preferences

- Preferred communication style: Simple, everyday language. Detailed user — ask lots of clarifying questions before implementing features. Do not assume; confirm requirements first.
- **TOP PRIORITY: Calculations and correct reports are always the highest priority.** Financial accuracy must never be compromised for visual or UI enhancements. The automated proof system (1,502 tests) must always pass.
- Always format money as money (currency format with commas and appropriate precision).
- All skills must be stored under `.claude/` directory (e.g., `.claude/skills/`, `.claude/manuals/`, `.claude/tools/`). Never place skills elsewhere.
- The company name is "Hospitality Business Group" (or "Hospitality Business" for short).
- When updating features, always update the corresponding skills (`.claude/skills/`) and manuals (`.claude/manuals/`) documentation.
- **All UI components must reference a theme** via the theme engine (`.claude/skills/ui/theme-engine.md`). The app supports multiple themes including user-created themes.
- New UI features get their own skill file in `.claude/skills/ui/`.
- Create skills when they can help divide tasks and reduce context. Always in `.claude/`.
- `.claude/claude.md` is the master documentation file. `replit.md` is a slim pointer that references this file. Keep all detailed content here.
- **Button Label Consistency:** Always use "Save" for all save/update actions — never "Update". See `.claude/rules/ui-patterns.md`.
- **100% Session Memory:** All decisions, changes, and context must be saved to `.claude/rules/session-memory.md` at the end of every session to persist across chat resets.
- **Reusable UI Tools:** Whenever building a new feature, extract reusable components and document them in `.claude/skills/ui/reusable-components.md`.
- **Every financial line item** should have a ? tooltip explanation (HelpTooltip or InfoTooltip as appropriate).
- **Every page must be graphics-rich** — use charts, animations, and visual elements on every page.

---

## Current Theme

**Fluid Glass** is the active theme. All new UI work must follow Fluid Glass styling conventions. See `.claude/skills/ui/theme-engine.md` for token structure.

---

## Context Loading Protocol

With 96 skill files (~17,000 lines), **never load all skills at once**. Use the context-loading skill (`.claude/skills/context-loading/SKILL.md`) to find the minimum required skill set for any task. Quick rules:
- **Financial calc fix** → load the specific finance skill + `rules/audit-persona.md` + `proof-system/SKILL.md`
- **UI/visual work** → load `component-library/SKILL.md` + `ui/theme-engine.md` + the specific UI skill
- **Testing work** → load `testing/SKILL.md` + the relevant sub-skill only
- **Export work** → load `exports/SKILL.md` or the specific export skill
- **Cross-domain work** → load minimum from each domain (2–4 skills max per domain)

---

## Skill Router

All detailed documentation lives in focused skills. Load the relevant skill before working.

| Domain | Skill Path | What It Covers |
|--------|-----------|---------------|
| Context Loading | `.claude/skills/context-loading/SKILL.md` | Task-to-skill map, loading tiers, anti-patterns, session checklist |
| Architecture | `.claude/skills/architecture/SKILL.md` | Tech stack, two-entity model, file organization |
| Design System | `.claude/skills/design-system/SKILL.md` | Colors, typography, component catalog, CSS classes |
| Theme Engine | `.claude/skills/ui/theme-engine.md` | Multi-theme system (Fluid Glass active), user-created themes, token structure |
| Component Library | `.claude/skills/component-library/SKILL.md` | PageHeader, GlassButton, ExportMenu, CurrentThemeTab, etc. |
| Reusable UI | `.claude/skills/ui/reusable-components.md` | AIImagePicker, AnimatedLogo, StatusBadge, ImagePreviewCard, EntityCard |
| Proof System | `.claude/skills/proof-system/SKILL.md` | 1,502 tests, 5 golden scenarios, verification commands |
| Testing (7 skills) | `.claude/skills/testing/` | Per-statement/analysis test coverage at property, consolidated, and management company levels |
| 3D Graphics | `.claude/skills/3d-graphics/SKILL.md` | Three.js scenes, framer-motion wrappers |
| Database | `.claude/skills/database-environments/SKILL.md` | Dev/prod databases, migrations, sync |
| Multi-Tenancy | `.claude/skills/multi-tenancy/SKILL.md` | Users, user groups, logos, themes, branding resolution |
| Tool Schemas | `.claude/skills/tool-schemas/SKILL.md` | Tool organization, schema conventions |
| Coding Conventions | `.claude/skills/coding-conventions/SKILL.md` | Style rules, finance code rules, audit doctrine |
| Exports | `.claude/skills/exports/SKILL.md` | PDF, Excel, PPTX, PNG, CSV export system |
| Source Code | `.claude/skills/source-code/SKILL.md` | Full source code map |
| Property Finder | `.claude/skills/property-finder/SKILL.md` | RapidAPI property search integration |
| Finance (16 skills) | `.claude/skills/finance/` | Income statement, cash flow, balance sheet, IRR, DCF, etc. |
| Research (17 skills) | `.claude/skills/research/` | Market, ADR, occupancy, cap rate, catering, auto-refresh, research questions CRUD, etc. |
| UI: Charts | `.claude/skills/ui/charts.md` | Line/bar chart styling + Waterfall, Heat Map, Radar chart specs |
| UI: Portfolio Pages | `.claude/skills/ui/portfolio-pages.md` | Comparison, Timeline, Map, Executive Summary pages |
| UI: Composite Pages | `.claude/skills/ui/composite-tabbed-pages.md` | Merging pages into unified tabbed views (Analysis, Properties+Map) |
| UI: Interactions | `.claude/skills/ui/interactions.md` | What-If sliders, Variance Analysis, Guided Walkthrough, Inline Editing |
| UI: Navigation | `.claude/skills/ui/navigation.md` | Command Palette, Breadcrumbs, Favorites, Activity Feed, Dark Mode |
| UI: Image & Media | `.claude/skills/ui/property-image-picker.md`, `ui/reusable-components.md` | AIImagePicker, PropertyImagePicker, AnimatedLogo |
| UI: Graphics | `.claude/skills/ui/graphics-component-catalog.md`, `ui/page-enhancement-checklist.md`, `ui/animation-patterns.md` | Reusable graphics components, page visual minimums, animation patterns |
| Mobile Responsive | `.claude/skills/mobile-responsive/SKILL.md` | Breakpoints, tablet layouts, device testing, responsive helpers |
| UI: Other (14) | `.claude/skills/ui/` | Glass components, buttons, sliders, tabs, page-header, callout, etc. |
| Manuals | `.claude/manuals/` | Checker manual (21 sections), user manual (16 sections) |
| Tools | `.claude/tools/` | Analysis, financing, returns, validation, UI tool schemas |
| Rules (18) | `.claude/rules/` | Session-startup, documentation, ui-patterns, audit persona, constants, DB seeding, API routes, graphics-rich design, architecture, financial engine, verification, skill organization, session memory, etc. |

---

## Testing & Proof System (1,529 Tests, 72 Files)

| Entity Level | Test Domains | Skill |
|-------------|-------------|-------|
| Individual Property | IS, CF, BS, trial balance, reconciliation, ASC 230 identities, pro forma golden | `testing/property-statements.md` |
| Consolidated Portfolio | Portfolio aggregation, intercompany eliminations, portfolio IRR | `testing/consolidated-statements.md` |
| Management Company | Company pro forma, fee linkage, funding instruments, cash balance | `testing/management-company.md` |
| Returns Analysis | IRR, NPV, MOIC, sensitivity, portfolio IRR, refi/exit vectors | `testing/analysis-returns.md` |
| DCF/FCF Analysis | FCF computation, FCFE two-method reconciliation | `testing/analysis-dcf-fcf.md` |
| Financing & Debt | Acquisition sizing, closing costs, refi schedule, funding engine | `testing/financing-refinance-funding.md` |
| Engine Unit Tests | Cash flow aggregator, yearly aggregator, equity calculations, loan calculations, GAAP compliance, edge cases | `tests/engine/` |
| Validation | Assumption consistency, funding gates, export verification | `tests/calc/validation/` |

**Commands**: `npm test` (all 1,529), `npm run verify` (4-phase, UNQUALIFIED required)

---

## AI Image Generation

- **Primary model:** Nano Banana (`gemini-2.5-flash-image`) via Replit's Gemini AI Integration
- **Fallback model:** OpenAI `gpt-image-1` via Replit's OpenAI AI Integration
- **Generic component:** `AIImagePicker` (`client/src/components/ui/ai-image-picker.tsx`) — three modes: upload, AI generate, URL input. Configurable aspect ratio, dark/light variants.
- **Property-specific wrapper:** `PropertyImagePicker` (`client/src/features/property-images/PropertyImagePicker.tsx`) — wraps AIImagePicker with auto-prompt from property name + location.
- **AnimatedLogo:** `client/src/components/ui/animated-logo.tsx` — SVG wrapper for raster images with animation support (pulse, glow, spin, bounce).
- **Server endpoint:** `POST /api/generate-property-image` — generates image, uploads to Replit Object Storage, returns `objectPath`.
- **Server client:** `server/replit_integrations/image/client.ts` — uses `generateContent` with `gemini-2.5-flash-image` model, falls back to OpenAI.

---

## Consolidated Formula Accordion Architecture

Dashboard consolidated financial statements use a **3-level accordion** pattern for calculation transparency:

- **Level 1:** `ExpandableLineItem` / `ExpandableMetricRow` — consolidated total with chevron
- **Level 2:** `FormulaDetailRow` — consolidated formula (e.g., "Σ(Room Revenue) ÷ Σ(Sold Rooms) = Weighted ADR")
- **Level 3:** `PropertyBreakdownRow` — per-property contributions

### Shared Components
- `FormulaDetailRow` and `PropertyBreakdownRow` exported from `client/src/components/financial-table-rows.tsx`
- 7 reusable helper functions in `client/src/lib/consolidatedFormulaHelpers.tsx`:
  - `consolidatedLineItemBreakdown()`, `consolidatedWeightedADR()`, `consolidatedWeightedOccupancy()`, `consolidatedRevPAR()` (income statement)
  - `consolidatedCashFlowBreakdown()`, `consolidatedDSCR()`, `consolidatedCashOnCash()` (cash flow)
- All helpers accept precomputed consolidated arrays — **zero re-aggregation** in render paths
- Visibility controlled by `CalcDetailsProvider` context (Calculation Transparency toggles)

See `.claude/skills/finance/consolidated-formula-helpers.md` for full API reference.

---

## Research Badge Defaults (Database-Backed, Location-Aware)

Research values are stored in the `research_values` JSONB column on each property, generated location-aware at creation time via `server/researchSeeds.ts` with 25+ regional profiles. Sources: CBRE Trends 2024-2025, STR/CoStar, HVS, Highland Group Boutique Hotel Report 2025. Location detection uses pattern matching on location/streetAddress/city/stateProvince/market fields. Each entry has `{ display, mid, source }` where source = `'seed'` (location defaults), `'ai'` (AI research override), or `'none'` (hidden). Generic fallback: ADR $193, Occupancy 69%, Cap Rate 8.5% (national averages). When AI research runs, it overrides seeded defaults with `source='ai'`. Frontend (`PropertyEdit.tsx`) reads from `property.researchValues`, falling back to generic defaults if absent.

---

## Admin Page Structure

The Admin Settings page (`/admin`) has these tabs:

| Tab | Value | Purpose |
|-----|-------|---------|
| Users | `users` | Create, edit, delete users; manage roles and passwords |
| Companies | `companies` | Manage SPV companies for individual properties |
| Activity | `activity` | View user activity logs and audit trail |
| Verification | `verification` | Run and view financial verification results |
| Logos | `logos` | Upload, AI-generate, or URL-import logo images (via AIImagePicker) |
| User Groups | `user-groups` | Manage multi-tenant groups with branding assignments |
| Branding | `branding` | View branding configuration summary |
| Themes | `themes` | Manage design themes (colors, typography) |
| Navigation | `sidebar` | Configure sidebar navigation visibility |
| Database | `database` | Database management and diagnostics |

Logo Management is a tab within Admin (not a separate sidebar link). The Branding tab shows a read-only logo summary with a "Manage Logos" button linking to the Logos tab.

---

## Key Rules

- **Calculations always highest priority** — never compromise financial accuracy for visuals
- **All UI references a theme** — see theme engine skill
- **No raw hex in components** — use CSS variable tokens
- **All buttons use GlassButton**, all pages use PageHeader, all exports use ExportMenu
- **No mock data** in production paths
- **Finance changes must state Active Skill** and pass verification (UNQUALIFIED)
- **Audit persona + doctrine**: `.claude/rules/audit-persona.md` mandatory for finance work
- **Button labels**: Always "Save" for save/update actions (never "Update") — `.claude/rules/ui-patterns.md`
- **Session memory**: Update `.claude/rules/session-memory.md` at the end of every session
- **Read session memory first**: Always read `session-memory.md` and `replit.md` before starting work — `.claude/rules/session-startup.md`
- **Docs after edits**: Update `.claude` docs and harmonize `replit.md` after any codebase changes — `.claude/rules/documentation.md`
- **Every page must be graphics-rich**: Charts, animations, visual elements required

---

## User Roles

Four roles with hierarchical access:

| Role | Access Level |
|------|-------------|
| `admin` | Full access — all pages + Admin Settings panel |
| `partner` | Management-level — Dashboard, Properties, Company, Settings, Reports (no Admin) |
| `checker` | Financial verification — same as Partner, plus verification tools and checker manual |
| `investor` | Limited — Dashboard, Properties, Profile, Help only |

Default role for new users: `partner`.

---

## Pages (client/src/pages/)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Portfolio overview with 3D graphics, KPIs, activity feed |
| Portfolio | `/portfolio` | Property list with favorites + Map View tab |
| PropertyDetail | `/property/:id` | Individual property financial analysis |
| PropertyEdit | `/property/:id/edit` | Edit property assumptions |
| PropertyMarketResearch | `/property/:id/research` | AI-powered property research |
| Company | `/company` | Management company financials + Investment Analysis (IRR) |
| CompanyAssumptions | `/company/assumptions` | Management company assumptions |
| CompanyResearch | `/company/research` | Management company research |
| Analysis | `/analysis` | Unified page: Sensitivity + Financing + Executive Summary (tabs) |
| SensitivityAnalysis | (embedded in Analysis) | Sensitivity analysis tables |
| FinancingAnalysis | (embedded in Analysis) | DSCR, debt yield, loan sizing |
| ExecutiveSummary | (embedded in Analysis) | Printable portfolio summary |
| MapView | (tab in Portfolio) | Geographic property card grid |
| ComparisonView | `/compare` | Side-by-side property comparison |
| TimelineView | `/timeline` | Chronological portfolio timeline |
| Scenarios | `/scenarios` | Scenario management |
| PropertyFinder | `/property-finder` | RapidAPI property search |
| GlobalResearch | `/global/research` | Global market research |
| Settings | `/settings` | Themes, preferences, calculation transparency |
| Profile | `/profile` | User profile, theme selection |
| Admin | `/admin` | Admin Settings (10 tabs — see Admin Page Structure above) |
| Methodology | `/methodology` | User manual |
| CheckerManual | `/checker-manual` | Checker manual (21 sections) |
| Help | `/help` | Help and documentation |
| Login | `/login` | Authentication page |

---

## Calculation Transparency

Two toggles in **Systemwide Assumptions > Other tab** control formula help visibility:
- `showCompanyCalculationDetails` — Management Company reports
- `showPropertyCalculationDetails` — Property reports

When ON (default), every financial line item shows a ? icon explaining its formula and meaning. When OFF, clean investor-ready view.

---

## UI Features (17+ enhancements)

| Feature | Component | Location |
|---------|-----------|----------|
| Command Palette | CommandPalette.tsx | Ctrl+K global search |
| Breadcrumbs | Breadcrumbs.tsx | Route-aware contextual breadcrumbs |
| Notification Center | NotificationCenter.tsx | Bell icon dropdown + Zustand store |
| Favorites | Favorites.tsx | Star toggle + sidebar widget |
| Activity Feed | ActivityFeed.tsx | Dashboard recent actions widget |
| Heat Map | charts/HeatMap.tsx | Color-coded portfolio metric grid |
| Waterfall Chart | charts/WaterfallChart.tsx | Stacked bar cumulative flows |
| Radar Chart | charts/RadarChart.tsx | Spider chart with normalization |
| Comparison View | ComparisonView.tsx | Side-by-side property comparison page |
| Timeline View | TimelineView.tsx | Chronological portfolio timeline page |
| Map View | MapView.tsx | Geographic property card grid (tab in Portfolio) |
| Executive Summary | ExecutiveSummary.tsx | Printable portfolio overview (tab in Analysis) |
| Composite Tabbed Pages | Analysis.tsx, Portfolio.tsx | Unified pages merging standalone components via embedded mode |
| What-If Panel | WhatIfPanel.tsx | Slider-based assumption adjustments |
| Variance Analysis | VarianceAnalysis.tsx | Property variance comparison |
| Guided Walkthrough | GuidedWalkthrough.tsx | Step-by-step spotlight tour |
| Inline Editing | inline-editing skill | In-place value editing |
| AIImagePicker | ai-image-picker.tsx | Three-mode image input (upload, AI generate, URL) |
| AnimatedLogo | animated-logo.tsx | SVG-wrapped logo with animation support |
| Financial Statements | FinancialStatement.tsx, YearlyIncomeStatement.tsx, etc. | GAAP-compliant statements |

---

## Quick Commands

```bash
npm run dev            # Start dev server (port 5000)
npm run health         # One-shot: tsc + tests + verify (~4 lines output)
npm run test:summary   # Run all 1,502 tests, 1-line output on pass
npm run verify:summary # 4-phase verification, compact output
npm test               # Run all 1,502 tests (full output)
npm run verify         # Full 4-phase financial verification (verbose)
npm run db:push        # Push schema changes
npm run lint:summary   # tsc --noEmit with 1-line output
npm run diff:summary   # Compact git status + diff stat
npm run test:file -- <path>  # Run single test file with summary output
npm run stats          # Codebase metrics: files, lines, tests, TS errors (~12 lines)
npm run audit:quick    # Quick code quality scan
npm run exports:check  # Find unused public exports from calc/ and lib/
```

---

## Integrations (Replit-Managed)

All integrations are managed through Replit's platform, handling API keys and secret rotation automatically.

### AI Integrations (no external API keys needed)
| Integration | Model | Purpose |
|-------------|-------|---------|
| Google Gemini | `gemini-2.5-flash-image` | Primary AI image generation (Nano Banana) |
| Google Gemini | `gemini-2.5-flash` | Market research analysis |
| OpenAI | `gpt-image-1` | Fallback AI image generation |
| Anthropic Claude | `claude-sonnet` | Financial methodology review, market research |

### Connected Services
| Integration | Purpose |
|-------------|---------|
| Google Sheets | Spreadsheet connectivity |
| Gmail | Email notifications |
| Google Drive | Document storage |
| Google Docs | Document connectivity |
| Google Calendar | Calendar integration |
| Stripe | Payment processing |
| Twilio | SMS/communication |
| Replit Auth | "Log in with Replit" authentication |
| GitHub | Source control |

### Infrastructure (Replit-Provided)
| Service | Purpose |
|---------|---------|
| PostgreSQL (Neon) | Primary database — auto-configured `DATABASE_URL` |
| Object Storage (GCS) | Image uploads, AI-generated assets, exported documents |
| Secrets Management | Encrypted storage for `ADMIN_PASSWORD`, `CHECKER_PASSWORD`, `REYNALDO_PASSWORD` |
| Deployments | Automatic TLS, health checks, `.replit.app` domain |

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts
- **Backend**: Node.js, Express 5, TypeScript (ESM), esbuild
- **Data**: Drizzle ORM, PostgreSQL (Neon), Zod validation
- **3D/Animation**: Three.js (@react-three/fiber, drei, postprocessing), framer-motion
- **AI**: Google Gemini, OpenAI, Anthropic Claude (via Replit AI Integrations)
- **Exports**: jsPDF, xlsx, pptxgenjs, dom-to-image-more
- **Fonts**: Playfair Display (headings) + Inter (UI/data)
- **Hosting**: Replit Deployments

---

## Branding Architecture

Branding resolution flows: **User → User Group → Default**.

- **Logos** are standalone entities carrying both a visual image and a `companyName`.
- **User Groups** reference a logo, theme, and asset description.
- **Users** inherit branding from their assigned User Group.
- **Theme override**: Users can select a different theme on their Profile page.
- **Company name** comes from the logo (not the group). Picking a logo sets the company name.
- **Two separate "company name" concepts**: `logo.companyName` is branding identity; `globalAssumptions.companyName` is the Management Company entity name in financial modeling.

See `.claude/skills/multi-tenancy/SKILL.md` for full details.
