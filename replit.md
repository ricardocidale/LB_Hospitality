# L+B Hospitality Group - Investor Portal

## Overview

This is a financial modeling and portfolio management application for L+B Hospitality Group, a boutique hotel management company. The application provides an investor portal with dashboard views, property portfolio management, financial pro forma generation, and configurable model inputs for hospitality assets across North America and Latin America.

The system models both the management company (L+B Hospitality Co.) and individual property SPVs, generating monthly and yearly financial statements including income statements and cash flow projections.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 2026)

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

### Financial Model Updates
- Catering level rates flow from Global Assumptions through to financial engine calculations
- Event revenue and costs now use global catering level rates instead of hardcoded values

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