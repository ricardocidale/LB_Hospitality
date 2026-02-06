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
- **Component Standardization**: `GlassButton` for actions on dark backgrounds, `SaveButton` for saving, `PageHeader` for consistent page titles.
- **Charts**: Standardized with white backgrounds, colorful gradient lines (green for revenue, blue for GOP, coral for FCFE), data point dots, and light gray dashed grids.
- **Admin Interface**: Consolidated into a single `/admin` route with tab-based navigation for users, login activity, and verification.

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
- **Skills**: Markdown files (`.claude/skills/`) provide system instructions to guide Claude's analysis (e.g., `property-market-research.md`, `company-research.md`).
- **Tools**: JSON files (`.claude/tools/`) define Claude tool-use function schemas for property research (e.g., `analyze-market.json`, `analyze-adr.json`).
- **Orchestration**: `server/aiResearch.ts` loads skills/tools, manages Claude's tool-use loop, and returns contextual guidance.
- **Output**: Research results adhere to a defined schema including `marketOverview`, `adrAnalysis`, `occupancyAnalysis`, `capRateAnalysis`, etc.
- **Seed Data**: Pre-seeded research data is available for all 5 properties for immediate display.

## External Dependencies

- **Database**: PostgreSQL
- **ORM Tooling**: Drizzle Kit
- **UI Libraries**: Radix UI, Recharts, Lucide React
- **Utilities**: date-fns
- **Development Tools**: Vite, tsx
- **Third-Party APIs**: RapidAPI "Realty in US" (for property finding).