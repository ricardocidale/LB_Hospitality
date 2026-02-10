# Hospitality Business Group - Business Simulation Portal

## Overview

This project is a business simulation portal for Hospitality Business Group, a boutique hotel management company. Its core purpose is to provide comprehensive financial simulation and projection capabilities for hospitality business planning. Key functionalities include financial modeling, portfolio management, dashboard views, and the generation of financial pro formas. The system supports configurable model inputs for hospitality assets across North America and Latin America, modeling both the management company and individual property SPVs to generate monthly and yearly financial statements, income statements, and cash flow projections. The business vision is to empower data-driven decisions for property acquisition, development, and operational management within the hospitality sector, offering a competitive edge through precise financial forecasting and strategic planning.

## User Preferences

Preferred communication style: Simple, everyday language. Detailed user — ask lots of clarifying questions before implementing features. Do not assume; confirm requirements first.
**TOP PRIORITY: Calculations and correct reports are always the highest priority.** Financial accuracy must never be compromised for visual or UI enhancements. The automated proof system (384 tests) must always pass.
Always format money as money (currency format with commas and appropriate precision).
All skills must be stored under `.claude/` directory (e.g., `.claude/skills/`, `.claude/manuals/`, `.claude/tools/`). Never place skills elsewhere.
The company name is "Hospitality Business Group" (or "Hospitality Business" for short). Never use "L+B Hospitality" in code or documentation.
When updating features, always update the corresponding skills (`.claude/skills/`) and manuals (`.claude/manuals/`) documentation.
**All UI components must reference a theme** via the theme engine (`.claude/skills/ui/theme-engine.md`). The app supports multiple themes including user-created themes.

## Current Theme

**Fluid Glass** is the active theme.

## Detailed Documentation

**`.claude/claude.md` is now a slim router** pointing to focused skills. Load the relevant skill before working on any domain. Key skill directories:

- `.claude/skills/architecture/` — Tech stack, two-entity model, file organization
- `.claude/skills/design-system/` — Colors, typography, component catalog
- `.claude/skills/ui/` — 30+ UI component skills (each theme-aware), theme engine
- `.claude/skills/finance/` — 17 finance calculation skills (IRR, DCF, income statement, cash flow, balance sheet, etc.)
- `.claude/skills/research/` — 8 AI research skills with co-located tools
- `.claude/skills/proof-system/` — 384-test automated proof system
- `.claude/skills/exports/` — PDF, Excel, PPTX, PNG, CSV export system
- `.claude/skills/coding-conventions/` — Style rules, finance code rules
- `.claude/skills/database-environments/` — Dev/prod databases, migrations
- `.claude/skills/tool-schemas/` — Tool organization and conventions
- `.claude/skills/component-library/` — PageHeader, GlassButton, ExportMenu, DarkGlassTabs
- `.claude/skills/3d-graphics/` — Three.js scenes, framer-motion wrappers
- `.claude/skills/source-code/` — Full source code map
- `.claude/skills/property-finder/` — RapidAPI property search integration
- `.claude/skills/features/` — Property image picker, etc.
- `.claude/manuals/` — Checker manual (15 sections), user manual (16 sections)
- `.claude/tools/` — Analysis, financing, returns, validation, UI, property-finder tool schemas
- `.claude/rules/` — Agent persona, audit doctrine, constants, DB seeding, API routes, financial engine, release checklist

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
| Financial Statements | FinancialStatement.tsx + 3 statement components | GAAP-compliant statements |

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

## Quick Reference

### Tech Stack
- **Frontend**: React 18, TypeScript, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts
- **Backend**: Node.js, Express 5, TypeScript (ESM), esbuild
- **Data**: Drizzle ORM, PostgreSQL, Zod validation
- **3D/Animation**: Three.js (@react-three/fiber, drei, postprocessing), framer-motion
- **Fonts**: Playfair Display (headings) + Inter (UI/data)

### Key Commands
- `npm run dev` — Start development server
- `npm test` — Run all 384 tests
- `npm run verify` — Full financial verification (4-phase)
- `npm run db:push` — Push schema changes

### External Dependencies
- PostgreSQL, Drizzle Kit, Radix UI, Recharts, Lucide React, date-fns
- three, @react-three/fiber, @react-three/drei, @react-three/postprocessing
- framer-motion
- googleapis (Google Sheets, Drive, Docs, Calendar)
- twilio (SMS alerts)
- RapidAPI "Realty in US" (property finding)
