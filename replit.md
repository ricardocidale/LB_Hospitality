# L+B Hospitality Group - Business Simulation Portal

## Overview

This project is a business simulation portal designed for L+B Hospitality Group, a boutique hotel management company. Its primary purpose is to provide comprehensive financial simulation and projection capabilities for hospitality business planning. Key functionalities include financial modeling, portfolio management, dashboard views, property portfolio management, and the generation of financial pro formas. The system allows for configurable model inputs for hospitality assets across North America and Latin America, modeling both the management company and individual property SPVs to generate monthly and yearly financial statements, income statements, and cash flow projections.

## User Preferences

Preferred communication style: Simple, everyday language.
Always format money as money (currency format with commas and appropriate precision).

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
- **Design System Skill**: Full documentation at `~/.agents/skills/design-system/SKILL.md` covering color palette, typography, theme modes, component catalog with usage examples.
- **Charts**: Standardized with white backgrounds, colorful gradient lines (green for revenue, blue for GOP, coral for FCFE), data point dots, and light gray dashed grids.
- **Admin Interface**: Consolidated into a single `/admin` route with tab-based navigation for users, login activity, checker activity, and verification.
- **Role-Based Access Control**: Three roles defined in `shared/schema.ts` (`VALID_USER_ROLES`): `admin`, `user`, `checker`. Admin has superset permissions (all checker rights + admin capabilities). `requireChecker` middleware allows both admin and checker roles. `requireAdmin` middleware allows admin only. Last-admin protection prevents demoting/deleting the last admin user.
- **Checker System**: Default checker user `checker@norfolkgroup.io` (name: Checker, title: Checker, company: Norfolk AI, role: checker). Password from `CHECKER_PASSWORD` env secret. Server auto-seeds/resets checker user on startup. Checker Manual accessible at `/checker-manual` for admin and checker roles.
- **Checker Manual**: Comprehensive verification manual with 7-phase workflow (Input, Calculation, Financial Statement Reconciliation, IRR/DCF/FCF, Scenario & Stress Testing, Reports & Exports, Documentation & Sign-Off). Includes USALI benchmark tables, inflation verification paths, and audit opinion framework. Skills docs in `.claude/checker-manual/`, tool schemas in `.claude/tools/financing/`.

### Business Model & Entity Structure
- **Two-Entity Architecture**: The platform models two financially linked but independently operated entities:
    1. **Hospitality Management Company** — A standalone business with its own Income Statement, Cash Flow, Balance Sheet, and FCF-based IRR. Provides centralized services (operations, marketing, administration) to all properties. Revenue comes from management/service fees charged to properties.
    2. **Property Portfolio** — Each property is modeled as its own independent SPV with its own P&L, Cash Flow, Balance Sheet, FCF, and IRR. The system also produces aggregated financials for all properties combined and combined FCF/IRR for the full portfolio.
- **Fee Linkage**: Management fees appear as revenue for the Management Company and as expenses for each property.
- **Capital Structure**:
    - Properties can be acquired using 100% equity (cash purchase) or debt financing + equity.
    - Early properties may be purchased fully in cash and later refinanced after a defined period (e.g., 3 years).
    - Equity investors are repaid through: Free Cash Flow distributions, Refinancing proceeds, and Exit proceeds.
    - Management Company receives capital from private equity via SAFE funding in scheduled or conditional tranches.
- **Assumptions Framework**: Two tiers:
    - **Property-level**: Revenue drivers, operating costs, financing structure, acquisition date, refinance timing, exit cap rate.
    - **App-wide (global)**: Management fee structures, inflation/escalation rates, shared cost growth, tax/macro parameters.
- **Dynamic Behavior**: Users can add/remove properties, modify any assumptions, and instantly recalculate all financial statements and returns.

### Mandatory Business Rules (Constraints)
1. **Management Company Funding Gate**: Operations of the Management Company cannot begin before funding is received. If assumptions indicate operations before funding, the system must block the scenario and flag it as invalid.
2. **Property Activation Gate**: A property cannot begin operating before it is purchased and funding is in place (either equity or financing). If the operating start date precedes acquisition or funding, the system must block the scenario.
3. **No Negative Cash Rule**: Cash balances for each property, the Management Company, and the aggregated portfolio must never be negative. If any projected cash balance goes below zero, the system must flag a funding shortfall and require increased funding, earlier funding, or assumption adjustments. FCF distributions and refinancing paybacks must not cause negative cash balances.
4. **Debt-Free at Exit**: At exit (end of projection period), all properties must be debt-free. Outstanding loan balances are repaid from gross sale proceeds before calculating net proceeds to equity.
5. **No Over-Distribution Rule**: FCF distributions and refinancing proceeds returned to investors must not exceed available cash. The system must not distribute cash to the point that any property ends up with a negative cash balance.

### System Goal
To simulate a scalable hospitality platform where individual assets can be analyzed independently, the management company operates as a profit center, capital flows realistically over time, and returns can be evaluated at asset level, company level, and portfolio level — while enforcing real-world financial constraints.

### Financial Engine
- Generates monthly pro forma projections covering revenue, operating expenses, management fees, debt service, NOI, and cash flow.
- **GAAP-Compliant Calculations**: Uses an indirect method for Free Cash Flow (ASC 230), adheres to ASC 360 for depreciation, and ASC 470 for debt.
- **Key Financial Logic**:
    - **Depreciation**: 27.5-year straight-line based on depreciable basis (purchase price × (1 - landValuePercent) + building improvements).
    - **Land Value Allocation**: Configurable per property (default 25%) to differentiate depreciable vs. non-depreciable assets.
    - **Debt Service**: Proper amortization with interest/principal separation.
    - **Acquisition Timing**: Balance sheet entries activate post-acquisition.
    - **Loan Calculations**: Centralized in `client/src/lib/loanCalculations.ts`.
    - **Partner Compensation**: Starts at $15,000/month per partner, escalates with inflation + 10%, capped at $30,000/month.
    - **Cost Escalation**: Fixed costs escalate at a configurable rate (default 3%), variable costs at inflation.
    - **Configurable Fiscal Year**: Financial statements align with any fiscal year start month.
- **Data Models**: Global Assumptions (model-wide parameters), Properties (individual asset details), and Scenarios (user-saved snapshots).
- **Room Revenue Calculation**: Uses an industry-standard 30.5 days per month.

### Financial Verification & Audit
- **System**: Located in `client/src/lib/financialAuditor.ts` and `client/src/lib/runVerification.ts`.
- **Purpose**: Verifies financial calculations against GAAP standards (PwC-level audit simulation).
- **Scope**: Covers Timing Rules, Depreciation, Loan Amortization, Income Statement, Balance Sheet, Cash Flow Statement, and Management Fees.
- **Output**: Provides audit opinions (UNQUALIFIED, QUALIFIED, ADVERSE).

### Configuration Management
- **Constants**: `client/src/lib/constants.ts` serves as the single source of truth for all `DEFAULT_*` constants, with fallbacks for property-specific or global values.
- **User-Adjustable Variables**: Stored in the database (`globalAssumptions` and `properties` tables) and editable via assumption pages.
    - **Global Assumptions**: Includes property type label, general property description, inflation rate, management fees, SAFE funding, partner compensation, staffing tiers, and exit/sale assumptions.
    - **Property Edit**: Allows configuration of cost rates, revenue shares, catering percentages, exit cap rate, and financing terms.
- **Dynamic Projection Period**: `projectionYears` is configurable (default 10).
- **Dynamic Staffing Tiers**: Three configurable tiers (`staffTier1MaxProperties/Fte`, `staffTier2MaxProperties/Fte`, `staffTier3Fte`).

### Property Finder
- **Functionality**: Allows users to search, save, and manage prospective properties.
- **Features**: Search by location, price, bedrooms, lot size, property type. Includes tabs for "Search", "Saved Searches", and "Saved Properties".
- **Display**: Properties are displayed in a dark glass table format.
- **Data Storage**: Saved searches are stored in `saved_searches` table, and favorited properties in `prospective_properties` table.

### AI Research Architecture
- **Skills**: Markdown files (`.claude/skills/`) provide system instructions to guide Claude's analysis (e.g., `research/property-market-research.md`, `research/company-research.md`).
- **Tools**: JSON files (`.claude/tools/`) define Claude tool-use function schemas for property research (e.g., `analyze-market.json`, `analyze-adr.json`).
- **Orchestration**: `server/aiResearch.ts` loads skills/tools, manages Claude's tool-use loop, and returns contextual guidance.
- **Output**: Research results adhere to a defined schema including `marketOverview`, `adrAnalysis`, `occupancyAnalysis`, `capRateAnalysis`, etc.
- **Seed Data**: Pre-seeded research data is available for all 5 properties for immediate display.

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