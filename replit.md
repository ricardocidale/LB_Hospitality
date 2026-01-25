# L+B Hospitality Group - Investor Portal

## Overview

This is a financial modeling and portfolio management application for L+B Hospitality Group, a boutique hotel management company. The application provides an investor portal with dashboard views, property portfolio management, financial pro forma generation, and configurable model inputs for hospitality assets across North America and Latin America.

The system models both the management company (L+B Hospitality Co.) and individual property SPVs, generating monthly and yearly financial statements including income statements and cash flow projections.

## User Preferences

Preferred communication style: Simple, everyday language.
Always format money as money (currency format with commas and appropriate precision).

### Partner Compensation Model
- Starting: $15,000/month per partner ($180,000/year)
- Annual escalation: inflation rate + 10%
- Maximum cap: $30,000/month per partner

## Recent Changes (January 2026)

### SAFE Funding for Management Company
- Added SAFE funding fields: two tranches with configurable amounts and dates
- Tranche 1: $225,000 (April 2026), Tranche 2: $225,000 (April 2027)
- SAFE valuation cap and discount rate fields included
- SAFE funding appears as inflows in the cash flow statement (not as revenue)

### Fixed Cost Escalation
- Added separate fixed cost escalation rate (defaults to 3%)
- Fixed costs (salaries, lease, services, insurance) escalate at fixedCostEscalationRate
- Variable costs (travel, IT, marketing, misc ops) escalate at inflation rate

### Company Assumptions Page Reorganization
- Reorganized into clear sections: SAFE Funding, Revenue, Compensation, Fixed Overhead, Variable Costs
- IT licensing default reduced to $3,000 (appropriate for B&B properties vs hotels)
- Marketing rate at 5% of management fee revenue

### Catering Levels in Global Assumptions
- Added Full Service and Partial Service catering level rates to Global Assumptions
- Event revenue rate: Full Service 50%, Partial Service 25% (as % of rooms revenue)
- Event cost ratio: Full Service 92%, Partial Service 80% (as % of event revenue)
- Property Assumptions page displays applicable catering rates based on selected level
- Event revenue stream removed from property-level settings (now controlled by catering level)

### Terminology
- "Model Assumptions" renamed to "Global Assumptions" 
- "Property Variables" renamed to "Property Assumptions"
- Help tooltips added throughout for key financial concepts

### Investment Analysis with Proper Real Estate Accounting
- Added Tax Rate field to each property (default 25%) in Property Assumptions
- Added Company Tax Rate field (default 30%) in Company Assumptions
- Free Cash Flow follows proper real estate investment methodology:
  - Depreciation: 27.5-year straight-line on building value (purchasePrice + buildingImprovements)
  - Debt Service: Proper amortization with interest/principal separation
  - Taxable Income: NOI - Interest Expense - Depreciation
  - Tax Liability: Applied only to positive taxable income
  - Before-Tax Cash Flow (BTCF): NOI - Debt Service
  - After-Tax Cash Flow (ATCF): BTCF - Tax Liability
- Expanded Investment Analysis display shows full FCF breakdown:
  - NOI, Debt Service, BTCF, Depreciation, Interest, Taxable Income, Tax, ATCF
  - Property-level ATCF with tax rates displayed
- Outstanding loan balance tracked at each year for accurate exit value calculations
- Property-Level IRR table includes Tax Rate column

### Financial Model Updates
- Catering level rates flow from Global Assumptions through to financial engine calculations
- Event revenue and costs now use global catering level rates instead of hardcoded values
- SAFE funding inflows added to management company cash flow projections

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state, Zustand for local state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom design tokens, class-variance-authority for component variants
- **Charts**: Recharts for financial data visualization
- **Fonts**: Playfair Display (serif headings) + Inter (UI/data)

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints under `/api/*`
- **Build Tool**: esbuild for server bundling, Vite for client

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Validation**: Zod schemas generated from Drizzle schemas via drizzle-zod
- **Database**: PostgreSQL (connection via `DATABASE_URL` environment variable)

### Key Data Models
1. **Global Assumptions**: Model-wide financial parameters (inflation, management fees, debt terms, staffing costs)
2. **Properties**: Individual hotel/B&B assets with detailed operating metrics, cost rates, and acquisition details

### Financial Engine
Located in `client/src/lib/financialEngine.ts`, generates monthly pro forma projections including:
- Revenue (rooms, F&B, events, other)
- Operating expenses by department
- Management fees (base + incentive)
- Debt service calculations
- NOI and cash flow

### Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # UI components including financial statements
│   ├── pages/           # Route pages (Dashboard, Portfolio, Settings, etc.)
│   ├── lib/             # Utilities, API hooks, financial engine
│   └── hooks/           # Custom React hooks
├── server/              # Express backend
│   ├── routes.ts        # API endpoint definitions
│   ├── storage.ts       # Database access layer
│   └── db.ts            # Drizzle database connection
├── shared/              # Shared types and schemas
│   └── schema.ts        # Drizzle table definitions
└── migrations/          # Drizzle migration files
```

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection string via `DATABASE_URL` environment variable
- **Drizzle Kit**: Schema migrations via `npm run db:push`

### UI Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, tabs, etc.)
- **Recharts**: Data visualization for financial charts
- **Lucide React**: Icon library
- **date-fns**: Date formatting and manipulation

### Development Tools
- **Vite**: Frontend dev server with HMR
- **tsx**: TypeScript execution for server
- **Replit plugins**: Dev banner, cartographer, runtime error overlay (development only)