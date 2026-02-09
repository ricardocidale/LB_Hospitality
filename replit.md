# Hospitality Business Group - Business Simulation Portal

## Overview

This project is a business simulation portal for Hospitality Business Group, a boutique hotel management company. Its core purpose is to provide comprehensive financial simulation and projection capabilities for hospitality business planning. Key functionalities include financial modeling, portfolio management, dashboard views, and the generation of financial pro formas. The system supports configurable model inputs for hospitality assets across North America and Latin America, modeling both the management company and individual property SPVs to generate monthly and yearly financial statements, income statements, and cash flow projections. The business vision is to empower data-driven decisions for property acquisition, development, and operational management within the hospitality sector, offering a competitive edge through precise financial forecasting and strategic planning.

## User Preferences

Preferred communication style: Simple, everyday language. Detailed user — ask lots of clarifying questions before implementing features. Do not assume; confirm requirements first.
**TOP PRIORITY: Calculations and correct reports are always the highest priority.** Financial accuracy must never be compromised for visual or UI enhancements. The automated proof system (355 tests) must always pass.
Always format money as money (currency format with commas and appropriate precision).
All skills must be stored under `.claude/` directory (e.g., `.claude/skills/`, `.claude/manuals/`, `.claude/tools/`). Never place skills elsewhere.
The company name is "Hospitality Business Group" (or "Hospitality Business" for short). Never use "L+B Hospitality" in code or documentation.
When updating features, always update the corresponding skills (`.claude/skills/`) and manuals (`.claude/manuals/`) documentation.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query (server state), Zustand (local state)
- **UI Components**: shadcn/ui built on Radix UI
- **Styling**: Tailwind CSS v4 with custom design tokens
- **Charts**: Recharts
- **Fonts**: Playfair Display (serif headings) + Inter (UI/data)

### Backend
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints
- **Build Tool**: esbuild

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Validation**: Zod schemas from Drizzle schemas
- **Database**: PostgreSQL

### UI/UX Design Principles
- **Color Palette**: Sage Green, Secondary Green, Warm Off-White, Coral Accent, Black, and dark blue-gray gradient.
- **Theming**: Blend of light-themed assumption pages and dark glass-themed main application pages.
- **Component Standardization**: `GlassButton`, `SaveButton`, `PageHeader`, `FinancialChart`, `FinancialTable`, `ExportMenu`, `StatCard`, `ContentPanel`.
- **Export System**: Reusable `ExportMenu` component providing 6 formats (PDF, Excel, CSV, PowerPoint, Chart PNG, Table PNG).
- **Charts**: Standardized with white backgrounds, gradient lines (green for revenue, blue for GOP, coral for FCFE), data point dots, and light gray dashed grids.
- **Admin Interface**: Single `/admin` route with tab-based navigation for user, login, checker activity, and verification.
- **Role-Based Access Control**: `admin`, `user`, `checker` roles with specific middleware (`requireChecker`, `requireAdmin`).
- **Checker System**: Default checker user `checker@norfolkgroup.io`, accessible manual at `/checker-manual` with a 7-phase workflow.
- **Tool Schemas**: Organized under `.claude/tools/` by category: `financing/`, `property-finder/`, `returns/`, `validation/`, `analysis/`.

### Business Model & Entity Structure
- **Two-Entity Architecture**: Management Company (fees-based) + Property Portfolio (independent SPVs), each with full financial statements. Aggregated views available.
- **Fee Linkage**: Management fees mirror between property expenses and company revenue.
- **Capital Structure**: Equity or debt acquisition, refinancing, SAFE funding for management company.
- **Assumptions Framework**: Property-level and global assumptions.
- **5 Mandatory Business Rules**: Funding gates, no negative cash, debt-free at exit, no over-distribution.

### Financial Engine
- Monthly pro forma projections: revenue, expenses, NOI, debt service, cash flow. GAAP-compliant (ASC 230, 360, 470).
- Key components: `financialEngine.ts`, `loanCalculations.ts`, `equityCalculations.ts`, `cashFlowAggregator.ts`, `yearlyAggregator.ts`, `constants.ts`.
- Standardized values: Depreciation (27.5-year straight-line per IRS Pub 946), Room revenue (30.5 days/month industry standard).
- Configurable fiscal year, projection period, cost escalation rates, staffing tiers.

### Double-Entry Ledger & Statements
- **Domain Layer**: Defines `AccountingPolicy`, `JournalDelta`, `CashFlowBucket`, `RoundingPolicy`, `CHART_OF_ACCOUNTS`.
- **Engine Layer**: `postEvents()` for double-entry validation, `buildTrialBalance()` for snapshots.
- **Statements Layer**: `extractIncomeStatement()`, `extractBalanceSheet()`, `extractCashFlow()` from trial balances, `reconcile()` for cross-statement checks, `applyEvents()` for orchestration.

### Financial Verification & Audit
- Verification engine: `financialAuditor.ts` + `runVerification.ts`. 103 automated checks across various financial aspects.
- Outputs UNQUALIFIED, QUALIFIED, or ADVERSE audit opinions.

### Configuration Management
- **Constants**: `client/src/lib/constants.ts` as single source of truth for `DEFAULT_*` values. Three-tier fallback: property → global → constant.
- **User-Adjustable**: Global Assumptions and Property settings stored in the database.

### Property Finder
- **Functionality**: Search, save, and manage prospective properties from external real estate listings.
- **Features**: Search by location, price, bedrooms, lot size, property type. "Search", "Saved Searches", and "Saved Properties" tabs.
- **Display**: Dark glass table format.
- **Data Storage**: `saved_searches` and `prospective_properties` tables.
- **URL Validation**: Specific `realtor.com` URL format validation.

### AI Research Architecture
- **Skills per Research Type**: Each research type has its own skill folder under `.claude/skills/research/` (e.g., `market-overview/`, `adr-analysis/`, `occupancy-analysis/`, `cap-rate-analysis/`).
- **Orchestration**: `server/aiResearch.ts` loads skills, scans for tool definitions, and manages Claude's tool-use loop.
- **Output**: Research results adhere to a defined schema.
- **Seed Data**: Pre-seeded research data for all 5 properties, auto-seeded on startup.
- **Auto-Refresh on Login**: Research data older than 7 days is automatically regenerated with a 3D animated overlay.

### Automated Financial Proof System
- **Purpose**: Eliminates human Excel verification. Code proves itself correct.
- **Test Files**: `tests/proof/scenarios.test.ts` (5 golden scenarios), `tests/proof/hardcoded-detection.test.ts` (magic number scanner), `tests/proof/reconciliation-report.test.ts` (artifact generator).
- **Verify Runner**: `tests/proof/verify-runner.ts` — 4-phase orchestrator (scenarios → hardcoded detection → reconciliation → artifact summary).
- **Artifacts**: `test-artifacts/` — JSON + Markdown reconciliation reports for each scenario.
- **Test Count**: 355 total tests (315 existing + 40 proof tests).
- **Commands**: `npm test` (all tests), `npx tsx tests/proof/verify-runner.ts` (full verification).
- **Skill Docs**: `.claude/skills/finance/automated-proof-system.md`.

### Database Environments
- **Separate Databases**: Development and Production PostgreSQL databases with distinct data.
- **Syncing Production Data**: Manual process involving identifying differences, writing SQL UPDATE statements, and executing them in the Production Database shell.

## External Dependencies

- **Database**: PostgreSQL
- **ORM Tooling**: Drizzle Kit
- **UI Libraries**: Radix UI, Recharts, Lucide React
- **Utilities**: date-fns
- **3D Graphics**: three, @react-three/fiber, @react-three/drei, @react-three/postprocessing
- **Animation**: framer-motion
- **Third-Party APIs**: RapidAPI "Realty in US" (for property finding).