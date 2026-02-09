# Hospitality Business Group - Business Simulation Portal

## Overview

This project is a business simulation portal designed for Hospitality Business Group, a boutique hotel management company. Its primary purpose is to provide comprehensive financial simulation and projection capabilities for hospitality business planning. Key functionalities include financial modeling, portfolio management, dashboard views, property portfolio management, and the generation of financial pro formas. The system allows for configurable model inputs for hospitality assets across North America and Latin America, modeling both the management company and individual property SPVs to generate monthly and yearly financial statements, income statements, and cash flow projections.

## User Preferences

Preferred communication style: Simple, everyday language.
Always format money as money (currency format with commas and appropriate precision).
All skills must be stored under `.claude/` directory (e.g., `.claude/skills/`, `.claude/manuals/`, `.claude/tools/`). Never place skills elsewhere.
The company name is "Hospitality Business Group" (or "Hospitality Business" for short). Never use "L+B Hospitality" in code or documentation.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query for server state, Zustand for local state
- **UI Components**: shadcn/ui built on Radix UI
- **Styling**: Tailwind CSS v4 with custom design tokens and class-variance-authority
- **Charts**: Recharts
- **Fonts**: Playfair Display (serif headings) + Inter (UI/data)

### Backend
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints
- **Build Tool**: esbuild for server bundling, Vite for client

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Validation**: Zod schemas generated from Drizzle schemas
- **Database**: PostgreSQL

### UI/UX Design Principles
- **Color Palette**: Sage Green, Secondary Green, Warm Off-White, Coral Accent, Black, and a dark blue-gray gradient for navigation.
- **Theming**: A blend of light-themed assumption pages and dark glass-themed main application pages.
- **Component Standardization**: `GlassButton` for actions on dark backgrounds, `SaveButton` for saving, `PageHeader` for consistent page titles. Reusable library: `FinancialChart` (preset series), `FinancialTable` (sticky columns, section grouping), `ExportMenu` (unified dropdown for PDF/Excel/CSV/PPTX/PNG exports, glass/light variants), `StatCard` (glass/light/sage KPI cards), `ContentPanel` (light/dark section wrappers).
- **Export System**: Reusable `ExportMenu` dropdown component providing 6 formats (PDF, Excel, CSV, PowerPoint, Chart PNG, Table PNG). Used on every data page. Component in `client/src/components/ui/export-toolbar.tsx`. Format implementations in `client/src/lib/exports/` (excelExport.ts, pptxExport.ts, pdfChartDrawer.ts, pngExport.ts). Full methodology and integration guide at `.claude/skills/exports/SKILL.md` with sub-skills for each format. Project instructions at `.claude/claude.md`.
- **Design System Skill**: Full documentation at `.claude/skills/design-system/SKILL.md` covering color palette, typography, theme modes, component catalog with usage examples.
- **Charts**: Standardized with white backgrounds, colorful gradient lines (green for revenue, blue for GOP, coral for FCFE), data point dots, and light gray dashed grids.
- **Admin Interface**: Consolidated into a single `/admin` route with tab-based navigation for users, login activity, checker activity, and verification.
- **Role-Based Access Control**: Three roles defined in `shared/schema.ts` (`VALID_USER_ROLES`): `admin`, `user`, `checker`. Admin has superset permissions (all checker rights + admin capabilities). `requireChecker` middleware allows both admin and checker roles. `requireAdmin` middleware allows admin only. Last-admin protection prevents demoting/deleting the last admin user.
- **Checker System**: Default checker user `checker@norfolkgroup.io` (name: Checker, title: Checker, company: Norfolk AI, role: checker). Password from `CHECKER_PASSWORD` env secret. Server auto-seeds/resets checker user on startup. Checker Manual accessible at `/checker-manual` for admin and checker roles.
- **Checker Manual**: Comprehensive verification manual with 7-phase workflow (Input, Calculation, Financial Statement Reconciliation, IRR/DCF/FCF, Scenario & Stress Testing, Reports & Exports, Documentation & Sign-Off). Includes USALI benchmark tables, inflation verification paths, and audit opinion framework. Skills docs in `.claude/manuals/checker-manual/`, validation check schemas in `.claude/manuals/checker-manual/tools/`.
- **Tool Schemas**: Organized under `.claude/tools/` by category: `financing/` (DSCR, debt yield, sensitivity, loan comparison), `returns/` (DCF/NPV, IRR vector, equity multiple, exit valuation), `validation/` (financial identities, funding gates, debt reconciliation, assumption consistency, export verification), `analysis/` (consolidation, scenario comparison, break-even). Research tools are co-located with their skills under `.claude/skills/research/*/tools/`.

### Business Model & Entity Structure
- **Two-Entity Architecture**: Management Company (fees-based revenue) + Property Portfolio (independent SPVs). Each entity has its own Income Statement, Cash Flow, Balance Sheet, and IRR. Aggregated/consolidated views available.
- **Fee Linkage**: Management fees mirror between property expenses and company revenue. Details: `.claude/skills/finance/fee-linkage.md`.
- **Capital Structure**: Equity or debt acquisition, refinancing, SAFE funding for management company.
- **Assumptions Framework**: Property-level (revenue, costs, financing) and global (fees, inflation, staffing, exit).
- **5 Mandatory Business Rules**: Funding gates, no negative cash, debt-free at exit, no over-distribution. Full details: `.claude/manuals/user-manual/skills/02-business-rules.md`.

### Financial Engine
- Monthly pro forma projections: revenue, expenses, NOI, debt service, cash flow. GAAP-compliant (ASC 230, 360, 470).
- Core files: `financialEngine.ts`, `loanCalculations.ts`, `equityCalculations.ts`, `cashFlowAggregator.ts`, `yearlyAggregator.ts`, `constants.ts`.
- Depreciation: 27.5-year straight-line (IRS Pub 946). Room revenue: 30.5 days/month industry standard.
- Configurable fiscal year, projection period, cost escalation rates, staffing tiers.
- Full calculation details: `.claude/rules/financial-engine.md`, `.claude/rules/constants-and-config.md`, `.claude/skills/finance/`.

### Financial Verification & Audit
- Verification engine: `financialAuditor.ts` + `runVerification.ts`. 103 automated checks covering timing, depreciation, loans, IS, BS, CF, fees.
- Outputs: UNQUALIFIED, QUALIFIED, or ADVERSE audit opinions.
- Details: `.claude/rules/verification-system.md`, `.claude/rules/audit-doctrine.md`.

### Configuration Management
- **Constants**: `client/src/lib/constants.ts` — single source of truth for all `DEFAULT_*` values. Three-tier fallback: property → global → constant.
- **User-Adjustable**: Global Assumptions (fees, inflation, staffing, SAFE funding) and Property settings (cost rates, revenue shares, financing terms) stored in database.
- Details: `.claude/rules/constants-and-config.md`.

### Property Finder
- **Functionality**: Allows users to search, save, and manage prospective properties.
- **Features**: Search by location, price, bedrooms, lot size, property type. Includes tabs for "Search", "Saved Searches", and "Saved Properties".
- **Display**: Properties are displayed in a dark glass table format.
- **Data Storage**: Saved searches are stored in `saved_searches` table, and favorited properties in `prospective_properties` table.

### AI Research Architecture
- **Skills per Research Type**: Each research type has its own skill folder under `.claude/skills/research/` with a `SKILL.md` and co-located `tools/` subfolder:
  - `market-overview/` — Local hospitality market analysis (tool: `analyze_market`)
  - `adr-analysis/` — Average daily rate benchmarking (tool: `analyze_adr`)
  - `occupancy-analysis/` — Occupancy patterns and seasonality (tool: `analyze_occupancy`)
  - `event-demand/` — Corporate, wellness, wedding event demand (tool: `analyze_event_demand`)
  - `catering-analysis/` — F&B catering boost percentage (tool: `analyze_catering`)
  - `cap-rate-analysis/` — Investment cap rate benchmarks (tool: `analyze_cap_rates`)
  - `competitive-set/` — Comparable property identification (tool: `analyze_competitive_set`)
  - `land-value/` — Land vs. building allocation for depreciation (tool: `analyze_land_value`)
  - `company-research/` — Management company fee structures and GAAP standards (no tool)
  - `global-research/` — Industry-wide trends and benchmarks (no tool)
- **Orchestration**: `server/aiResearch.ts` loads all property research skills as a combined system prompt, scans skill `tools/` folders for tool definitions, and manages Claude's tool-use loop.
- **Output**: Research results adhere to a defined schema including `marketOverview`, `adrAnalysis`, `occupancyAnalysis`, `capRateAnalysis`, etc.
- **Seed Data**: Pre-seeded research data is available for all 5 properties for immediate display. Auto-seed on startup via `seedMissingMarketResearch()` in `server/seed.ts`.

### Database Environments
- **Separate Databases**: Development and Production use separate PostgreSQL databases with different data.
- **Syncing Production Data**: After reseeding or changing seed data in development, the production database must be manually updated. The `execute_sql_tool` only supports READ-ONLY queries against production. To sync:
  1. Query both dev and production databases to identify differences.
  2. Write SQL UPDATE statements targeting the production property/global_assumptions IDs (production IDs may differ from development IDs).
  3. Provide the SQL statements to the user to run in the Production Database shell (accessible via the Databases panel in Replit).
- **Column naming**: Database columns use snake_case (e.g., `cost_rate_fb`, `catering_boost_percent`), while the Drizzle ORM schema uses camelCase (e.g., `costRateFb`, `cateringBoostPercent`).
- **Production property IDs**: Currently 6-10. Development property IDs: Currently 32-36. Always verify current IDs before writing UPDATE statements.

## External Dependencies

- **Database**: PostgreSQL
- **ORM Tooling**: Drizzle Kit
- **UI Libraries**: Radix UI, Recharts, Lucide React
- **Utilities**: date-fns
- **Development Tools**: Vite, tsx
- **Third-Party APIs**: RapidAPI "Realty in US" (for property finding).