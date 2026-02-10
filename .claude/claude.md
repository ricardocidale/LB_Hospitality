# Hospitality Business Group — Project Instructions

## Project Summary
Business simulation portal for Hospitality Business Group. Models a boutique hospitality management company alongside individual property SPVs with monthly and yearly financial projections. GAAP-compliant (ASC 230, ASC 360, ASC 470) with IRS depreciation rules and an internal audit/verification engine. Branded "powered by Norfolk AI" (discrete, 9px, low opacity).

## User Preferences
- Preferred communication style: Simple, everyday language. Detailed user — ask lots of clarifying questions before implementing features. Do not assume; confirm requirements first.
- **TOP PRIORITY: Calculations and correct reports are always the highest priority.** Financial accuracy must never be compromised for visual or UI enhancements. The automated proof system (384 tests) must always pass.
- Always format money as money (currency format with commas and appropriate precision).
- All skills must be stored under `.claude/` directory (e.g., `.claude/skills/`, `.claude/manuals/`, `.claude/tools/`). Never place skills elsewhere.
- The company name is "Hospitality Business Group" (or "Hospitality Business" for short). Never use "L+B Hospitality" in code or documentation.
- When updating features, always update the corresponding skills (`.claude/skills/`) and manuals (`.claude/manuals/`) documentation.
- **All UI components must reference a theme** via the theme engine (`.claude/skills/ui/theme-engine.md`). The app supports multiple themes including user-created themes.
- New UI features get their own skill file in `.claude/skills/ui/`.
- Create skills when they can help divide tasks and reduce context. Always in `.claude/`.
- Always keep `replit.md` in sync with `.claude/claude.md` — they must reflect the same project state.

## Current Theme
**Fluid Glass** is the active theme. All new UI work must follow Fluid Glass styling conventions. See theme engine skill for token structure.

## Skill Router
All detailed documentation lives in focused skills. Load the relevant skill before working.

| Domain | Skill Path | What It Covers |
|--------|-----------|---------------|
| Architecture | `.claude/skills/architecture/SKILL.md` | Tech stack, two-entity model, file organization |
| Design System | `.claude/skills/design-system/SKILL.md` | Colors, typography, component catalog, CSS classes |
| Theme Engine | `.claude/skills/ui/theme-engine.md` | Multi-theme system (Fluid Glass active), user-created themes, token structure |
| Component Library | `.claude/skills/component-library/SKILL.md` | PageHeader, GlassButton, ExportMenu, DarkGlassTabs, etc. |
| Proof System | `.claude/skills/proof-system/SKILL.md` | 384 tests, 5 golden scenarios, verification commands |
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
| UI: Interactions | `.claude/skills/ui/interactions.md` | What-If sliders, Variance Analysis, Guided Walkthrough, Inline Editing |
| UI: Navigation | `.claude/skills/ui/navigation.md` | Command Palette, Breadcrumbs, Favorites, Activity Feed, Dark Mode |
| UI: Other (14) | `.claude/skills/ui/` | Glass components, buttons, sliders, tabs, page-header, callout, image picker, etc. |
| Manuals | `.claude/manuals/` | Checker manual (15 sections), user manual (16 sections) |
| Tools | `.claude/tools/` | Analysis, financing, returns, validation, UI tool schemas |
| Rules (8) | `.claude/rules/` | Audit persona+doctrine+plan, constants, DB seeding, API routes, etc. |

## Recent Changes
- **Asset Descriptions**: Admin-managed asset descriptions (asset_descriptions table) with per-user assignment. Seeded: "Boutique Hotel", "Exotic Experience Hotel". Extended `/api/my-branding` returns logo, theme, and asset description with default fallbacks.
- **International Address Fields**: Optional property address fields (streetAddress, city, stateProvince, zipPostalCode, country) for international locations. "Map" button on PropertyDetail opens Google Maps (disabled when no address).
- **Sidebar Visibility**: Admin-controlled sidebar navigation. 9 boolean fields in global_assumptions control which optional nav items appear for non-admin users: Property Finder, Sensitivity, Financing, Compare, Timeline, Map View, Executive Summary, Scenarios, User Manual. Core items always visible: Dashboard, Properties, Management Co., Settings, Profile, Administration. Layout uses `sb()` helper for filtering. Admin UI card and renderSidebar view in Admin.tsx.
- **Logo Portfolio & User Branding**: Admin-managed logo portfolio (logos table) with per-user assignment. Layout fetches `/api/my-branding` with fallback chain: assigned logo > company logo > default. Schema: `logos` table, `users.assignedLogoId`/`users.assignedThemeId`. Default logos seeded: HBG (default) + Norfolk AI.
- **Calculation Transparency Toggles**: Two on/off switches in Settings > Other tab control visibility of formula help icons and expandable accordion rows. Default: ON. Schema: `show_company_calculation_details`, `show_property_calculation_details`. Uses `CalcDetailsProvider` React context.
- **Accordion Formula Rows**: Expandable rows in income statements showing step-by-step calculation breakdowns. Components: `ExpandableLineItem`, `ExpandableMetricRow`, `FormulaDetailRow`.
- **Exit Cap Rates**: Austin Hillside 8.0% (market: 5.5-7.5% going-in, +50-100bps for exit). Casa Medellín 9.0%.

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
| MapView | `/map` | Geographic property card grid |
| ExecutiveSummary | `/executive-summary` | Printable portfolio summary |
| SensitivityAnalysis | `/sensitivity` | Sensitivity analysis tables |
| FinancingAnalysis | `/financing` | DSCR, debt yield, loan sizing |
| Scenarios | `/scenarios` | Scenario management |
| PropertyFinder | `/property-finder` | RapidAPI property search |
| GlobalResearch | `/global/research` | Global market research |
| Settings | `/settings` | Themes, preferences |
| Profile | `/profile` | User profile |
| Admin | `/admin` | Administration |
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
| Map View | MapView.tsx | Geographic property card grid page |
| Executive Summary | ExecutiveSummary.tsx | Printable portfolio overview page |
| What-If Panel | WhatIfPanel.tsx | Slider-based assumption adjustments |
| Variance Analysis | VarianceAnalysis.tsx | Property variance comparison |
| Guided Walkthrough | GuidedWalkthrough.tsx | Step-by-step spotlight tour |
| Inline Editing | inline-editing skill | In-place value editing |
| Financial Statements | FinancialStatement.tsx, YearlyIncomeStatement.tsx, YearlyCashFlowStatement.tsx, ConsolidatedBalanceSheet.tsx | GAAP-compliant statements |

## Quick Commands
```bash
npm run dev       # Start dev server
npm test          # Run all 384 tests
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
