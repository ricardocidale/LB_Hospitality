# Hospitality Business Group — Project Instructions

## Project Summary
Business simulation portal for Hospitality Business Group. Models a boutique hospitality management company alongside individual property SPVs with monthly and yearly financial projections. GAAP-compliant (ASC 230, ASC 360, ASC 470) with IRS depreciation rules and an internal audit/verification engine. Branded "powered by Norfolk AI" (discrete, 9px, low opacity).

## User Preferences
- Preferred communication style: Simple, everyday language. Detailed user — ask lots of clarifying questions before implementing features. Do not assume; confirm requirements first.
- **TOP PRIORITY: Calculations and correct reports are always the highest priority.** Financial accuracy must never be compromised for visual or UI enhancements. The automated proof system (445 tests) must always pass.
- Always format money as money (currency format with commas and appropriate precision).
- All skills must be stored under `.claude/` directory (e.g., `.claude/skills/`, `.claude/manuals/`, `.claude/tools/`). Never place skills elsewhere.
- The company name is "Hospitality Business Group" (or "Hospitality Business" for short). Never use "L+B Hospitality" in code or documentation.
- When updating features, always update the corresponding skills (`.claude/skills/`) and manuals (`.claude/manuals/`) documentation.
- **All UI components must reference a theme** via the theme engine (`.claude/skills/ui/theme-engine.md`). The app supports multiple themes including user-created themes.
- New UI features get their own skill file in `.claude/skills/ui/`.
- Create skills when they can help divide tasks and reduce context. Always in `.claude/`.
- `.claude/claude.md` is the master documentation file. `replit.md` is a slim pointer that references this file. Keep all detailed content here.

## Current Theme
**Fluid Glass** is the active theme. All new UI work must follow Fluid Glass styling conventions. See theme engine skill for token structure.

## Context Loading Protocol
With 80+ skill files (~15,000 lines), **never load all skills at once**. Use the context-loading skill (`.claude/skills/context-loading/SKILL.md`) to find the minimum required skill set for any task. Quick rules:
- **Financial calc fix** → load the specific finance skill + `rules/audit-persona.md` + `proof-system/SKILL.md`
- **UI/visual work** → load `component-library/SKILL.md` + `ui/theme-engine.md` + the specific UI skill
- **Testing work** → load `testing/SKILL.md` + the relevant sub-skill only
- **Export work** → load `exports/SKILL.md` or the specific export skill
- **Cross-domain work** → load minimum from each domain (2-4 skills max per domain)

## Skill Router
All detailed documentation lives in focused skills. Load the relevant skill before working.

| Domain | Skill Path | What It Covers |
|--------|-----------|---------------|
| Context Loading | `.claude/skills/context-loading/SKILL.md` | Task-to-skill map, loading tiers, anti-patterns, session checklist |
| Architecture | `.claude/skills/architecture/SKILL.md` | Tech stack, two-entity model, file organization |
| Design System | `.claude/skills/design-system/SKILL.md` | Colors, typography, component catalog, CSS classes |
| Theme Engine | `.claude/skills/ui/theme-engine.md` | Multi-theme system (Fluid Glass active), user-created themes, token structure |
| Component Library | `.claude/skills/component-library/SKILL.md` | PageHeader, GlassButton, ExportMenu, DarkGlassTabs, etc. |
| Proof System | `.claude/skills/proof-system/SKILL.md` | 445 tests, 5 golden scenarios, verification commands |
| Testing (7 skills) | `.claude/skills/testing/` | Per-statement/analysis test coverage at property, consolidated, and management company levels |
| 3D Graphics | `.claude/skills/3d-graphics/SKILL.md` | Three.js scenes, framer-motion wrappers |
| Database | `.claude/skills/database-environments/SKILL.md` | Dev/prod databases, migrations, sync |
| Tool Schemas | `.claude/skills/tool-schemas/SKILL.md` | Tool organization, schema conventions |
| Coding Conventions | `.claude/skills/coding-conventions/SKILL.md` | Style rules, finance code rules, audit doctrine |
| Exports | `.claude/skills/exports/SKILL.md` | PDF, Excel, PPTX, PNG, CSV export system |
| Source Code | `.claude/skills/source-code/SKILL.md` | Full source code map |
| Property Finder | `.claude/skills/property-finder/SKILL.md` | RapidAPI property search integration |
| Finance (16 skills) | `.claude/skills/finance/` | Income statement, cash flow, balance sheet, IRR, DCF, etc. |
| Research (11 skills) | `.claude/skills/research/` | Market, ADR, occupancy, cap rate, catering, auto-refresh, etc. |
| UI: Charts | `.claude/skills/ui/charts.md` | Line/bar chart styling + Waterfall, Heat Map, Radar chart specs |
| UI: Portfolio Pages | `.claude/skills/ui/portfolio-pages.md` | Comparison, Timeline, Map, Executive Summary pages |
| UI: Composite Pages | `.claude/skills/ui/composite-tabbed-pages.md` | Merging pages into unified tabbed views (Analysis, Properties+Map) |
| UI: Interactions | `.claude/skills/ui/interactions.md` | What-If sliders, Variance Analysis, Guided Walkthrough, Inline Editing |
| UI: Navigation | `.claude/skills/ui/navigation.md` | Command Palette, Breadcrumbs, Favorites, Activity Feed, Dark Mode |
| UI: Other (14) | `.claude/skills/ui/` | Glass components, buttons, sliders, tabs, page-header, callout, image picker, etc. |
| Manuals | `.claude/manuals/` | Checker manual (15 sections), user manual (16 sections) |
| Tools | `.claude/tools/` | Analysis, financing, returns, validation, UI tool schemas |
| Rules (8) | `.claude/rules/` | Audit persona+doctrine+plan, constants, DB seeding, API routes, etc. |

## Testing & Proof System (445 Tests, 42 Files)

| Entity Level | Test Domains | Skill |
|-------------|-------------|-------|
| Individual Property | IS, CF, BS, trial balance, reconciliation, ASC 230 identities, pro forma golden | `testing/property-statements.md` |
| Consolidated Portfolio | Portfolio aggregation, intercompany eliminations, portfolio IRR | `testing/consolidated-statements.md` |
| Management Company | Company pro forma, fee linkage, funding instruments, cash balance | `testing/management-company.md` |
| Returns Analysis | IRR, NPV, MOIC, sensitivity, portfolio IRR, refi/exit vectors | `testing/analysis-returns.md` |
| DCF/FCF Analysis | FCF computation, FCFE two-method reconciliation | `testing/analysis-dcf-fcf.md` |
| Financing & Debt | Acquisition sizing, closing costs, refi schedule, funding engine | `testing/financing-refinance-funding.md` |

**Commands**: `npm test` (all 445), `npm run verify` (4-phase, UNQUALIFIED required)

## Recent Changes
- **User Groups & Multi-Tenant Branding**: New `user_groups` table with CRUD API (`/api/admin/user-groups/*`). Users assigned to groups inherit group branding (companyName, logo, theme, asset description). Branding resolution priority: user-level > group-level > system default. Layout sidebar dynamically shows resolved company name. Two seed groups: KIT Group (Rosario, Dov, Lea) and Norfolk Group (Ricardo, Checker, Bhuvan, Reynaldo). Admin UI has "User Groups" tab for management.
- **Testing Skills Suite**: New `.claude/skills/testing/` directory with 7 skill files documenting test coverage for every financial statement and analysis at property, consolidated, and management company levels.
- **Accordion Chevron Standardization**: All expandable/accordion row indicators standardized to `w-4 h-4` across the entire app. Non-accordion icons (Search, Star, Download) remain at their intentional smaller sizes.
- **Unified Analysis Page**: `/analysis` route merges Sensitivity, Financing, Executive Summary, Compare, and Timeline into a single tabbed page. Components use `embedded` prop to skip Layout wrapper. Old standalone routes (`/compare`, `/timeline`) redirect to `/analysis`.
- **Map View in Properties**: Map View is now a tab inside the Properties page (`/portfolio`) instead of a separate sidebar item.
- **Admin 3D Redesign**: Admin dashboard upgraded with floating glass panel 3D background, glassmorphism stat cards with gradient borders, polished AdminCard with hover lift/glow effects.
- **Composite Tabbed Pages Skill**: New skill (`.claude/skills/ui/composite-tabbed-pages.md`) documenting the pattern for merging standalone pages into unified tabbed views.
- **Asset Descriptions**: Admin-managed asset descriptions (asset_descriptions table) with per-user assignment.
- **Sidebar Visibility**: Admin-controlled sidebar navigation. 9 boolean fields in global_assumptions control which optional nav items appear for non-admin users. Layout uses `sb()` helper for filtering.
- **Calculation Transparency Toggles**: Two on/off switches in Settings > Other tab control visibility of formula help icons and expandable accordion rows.
- **Accordion Formula Rows**: Expandable rows in income statements showing step-by-step calculation breakdowns.
- **Funding Instrument Rename**: All UI labels changed from hardcoded "SAFE" to dynamic `fundingSourceLabel` (default "SAFE"). Supports SAFE, Seed, Series A, etc. DB field names unchanged for backward compatibility.
- **Negative Cash Balance Entity Identification**: Verification check now clearly identifies which entity (Management Company vs specific property by name) has negative cash balance issues. Management Company gets its own independent cash balance check.
- **Expanded Test Suite**: 445 tests (up from 384). New suites: NPV-IRR cross-validation, FCFE two-method reconciliation, ASC 230 cash flow identities, portfolio IRR, refinancing/exit vectors, realistic 10-year hotel golden scenario.

## Key Rules
- **Calculations always highest priority** — never compromise financial accuracy for visuals
- **All UI references a theme** — see theme engine skill
- **No raw hex in components** — use CSS variable tokens
- **All buttons use GlassButton**, all pages use PageHeader, all exports use ExportMenu
- **No mock data** in production paths
- **Finance changes must state Active Skill** and pass verification (UNQUALIFIED)
- **Audit persona+doctrine**: `.claude/rules/audit-persona.md` mandatory for finance work

## Pages (client/src/pages/)
| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Portfolio overview with 3D graphics, activity feed |
| Portfolio | `/portfolio` | Property list with favorites |
| PropertyDetail | `/property/:id` | Individual property financials |
| PropertyEdit | `/property/:id/edit` | Edit property assumptions |
| PropertyMarketResearch | `/property/:id/research` | AI-powered property research |
| Company | `/company` | Management company financials + Investment Analysis (IRR) |
| CompanyAssumptions | `/company/assumptions` | Management company assumptions |
| CompanyResearch | `/company/research` | Management company research |
| ComparisonView | `/compare` | Side-by-side property comparison |
| TimelineView | `/timeline` | Chronological portfolio timeline |
| Analysis | `/analysis` | Unified page: Sensitivity + Financing + Executive Summary (tabs) |
| SensitivityAnalysis | (embedded in Analysis) | Sensitivity analysis tables |
| FinancingAnalysis | (embedded in Analysis) | DSCR, debt yield, loan sizing |
| ExecutiveSummary | (embedded in Analysis) | Printable portfolio summary |
| MapView | (tab in Portfolio) | Geographic property card grid |
| Scenarios | `/scenarios` | Scenario management |
| PropertyFinder | `/property-finder` | RapidAPI property search |
| GlobalResearch | `/global/research` | Global market research |
| Settings | `/settings` | Themes, preferences |
| Profile | `/profile` | User profile |
| Admin | `/admin` | Administration (Users, User Groups, Login Logs, Sessions, Verification, Activity, Seed) |
| Methodology | `/methodology` | User manual |
| CheckerManual | `/checker-manual` | Checker manual |

## UI Features (17 enhancements)
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
| Financial Statements | FinancialStatement.tsx, YearlyIncomeStatement.tsx, YearlyCashFlowStatement.tsx, ConsolidatedBalanceSheet.tsx | GAAP-compliant statements |

## Quick Commands
```bash
npm run dev       # Start dev server
npm test          # Run all 445 tests
npm run verify    # Full 4-phase financial verification
npm run db:push   # Push schema changes
```

## Integrations

### Connected (server/integrations/)
| Integration | File | Status |
|-------------|------|--------|
| Google Sheets | googleSheets.ts | Connected, client saved |
| Gmail | gmail.ts | Connected, client saved |
| Google Drive | googleDrive.ts | Connected, client saved |
| Google Docs | googleDocs.ts | Connected, client saved |
| Google Calendar | googleCalendar.ts | Connected, client saved |
| Stripe | stripeClient.ts, stripeWebhook.ts | Connected, client saved |
| Twilio | twilio.ts | Connected, client saved |
| Replit Auth | server/replit_integrations/auth/ | Files added, NOT wired into existing login |
| Google Analytics | client/src/lib/analytics.ts | Files added, needs VITE_GA_MEASUREMENT_ID |

### Not Connected
- **Notion**: User dismissed — can connect later if needed
- **SendGrid**: User dismissed

## Tech Stack
- **Frontend**: React 18, TypeScript, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts
- **Backend**: Node.js, Express 5, TypeScript (ESM), esbuild
- **Data**: Drizzle ORM, PostgreSQL, Zod validation
- **3D/Animation**: Three.js (@react-three/fiber, drei, postprocessing), framer-motion
- **Fonts**: Playfair Display (headings) + Inter (UI/data)

## External Dependencies
- PostgreSQL, Drizzle Kit, Radix UI, Recharts, Lucide React, date-fns
- three, @react-three/fiber, @react-three/drei, @react-three/postprocessing
- framer-motion
- googleapis (Google Sheets, Drive, Docs, Calendar)
- twilio (SMS alerts)
- RapidAPI "Realty in US" (property finding)
