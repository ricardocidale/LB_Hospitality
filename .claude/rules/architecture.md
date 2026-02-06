# System Architecture

## Overview

The L+B Hospitality Business Simulation Portal is a full-stack TypeScript application structured as a monorepo with shared types between client and server.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT (React)                      │
│                                                          │
│  Pages ──► Financial Engine ──► Charts & Tables           │
│    │              │                                       │
│    │         constants.ts ◄── Single source of truth      │
│    │              │                                       │
│    └──► TanStack Query ──► API Layer ──► Express Server   │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                    SERVER (Express 5)                     │
│                                                          │
│  routes.ts ──► storage.ts ──► Drizzle ORM ──► PostgreSQL  │
│      │                                                    │
│      ├──► auth.ts (sessions, bcrypt)                      │
│      ├──► calculationChecker.ts (independent verification)│
│      └──► AI providers (OpenAI, Anthropic, Gemini)        │
└─────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Framework Stack
- **React 18** with TypeScript for type safety
- **Wouter** for lightweight client-side routing
- **TanStack React Query** for server state management (caching, refetching)
- **Zustand** for local UI state where needed

### UI Component Library
- **shadcn/ui** built on **Radix UI** primitives for accessible, composable components
- **Tailwind CSS v4** with custom design tokens and `class-variance-authority`
- **Recharts** for all financial charts and data visualization
- **Lucide React** for iconography

### Font System
- **Playfair Display** (serif) for headings and display text
- **Inter** for UI labels, data tables, and body text

### Key Frontend Files
| File | Purpose |
|------|---------|
| `client/src/pages/Dashboard.tsx` | Portfolio overview with charts and KPIs |
| `client/src/pages/PropertyDetail.tsx` | Individual property financial analysis |
| `client/src/pages/Company.tsx` | Management company P&L and projections |
| `client/src/pages/CompanyAssumptions.tsx` | Global model configuration UI |
| `client/src/pages/PropertyEdit.tsx` | Property-level assumption editing |
| `client/src/pages/Admin.tsx` | User management, verification, login logs |
| `client/src/lib/financialEngine.ts` | Core financial calculation engine |
| `client/src/lib/constants.ts` | All named constants and defaults |
| `client/src/lib/loanCalculations.ts` | Loan amortization and refinance logic |
| `client/src/lib/runVerification.ts` | Client-side verification orchestration |
| `client/src/lib/financialAuditor.ts` | GAAP audit engine |

## Backend Architecture

### Server Stack
- **Node.js** runtime with **Express 5**
- **TypeScript** with ESM modules
- **esbuild** for server bundling

### API Pattern
RESTful endpoints organized by domain:
- `/api/auth/*` - Authentication
- `/api/admin/*` - Admin operations (user management, seeding, verification)
- `/api/global-assumptions` - Model configuration
- `/api/properties/*` - Property CRUD
- `/api/scenarios/*` - Scenario save/load
- `/api/research/*` - AI market research

### Data Layer
- **Drizzle ORM** with PostgreSQL dialect
- Schema defined in `shared/schema.ts` (single source of truth)
- **Zod** schemas auto-generated from Drizzle for request validation
- Storage interface pattern (`IStorage` in `server/storage.ts`) abstracts DB access

### Authentication
- Session-based auth with bcrypt password hashing
- Sessions stored in PostgreSQL `sessions` table (id, userId, expiresAt)
- Cookie-based session management
- Two database roles: `admin` (full access) and `user` (standard access)
- Checker access: `requireChecker` middleware grants verification endpoint access to `admin` role OR email `"checker"` (checker user has role `"user"` in the database)
- Rate limiting on login attempts (by IP address)
- IP tracking for login history (`login_logs` table)
- Admin and checker users auto-created/updated on every server start via `seedAdminUser()` in `server/auth.ts`

## Data Flow

### Financial Projection Pipeline
```
User Input (UI)
    │
    ▼
Global Assumptions (DB) + Property Data (DB)
    │
    ▼
financialEngine.ts → generatePropertyProForma()
    │
    ▼
MonthlyFinancials[] (120+ months of projections)
    │
    ├──► Dashboard charts (aggregated portfolio view)
    ├──► Property detail tables (individual analysis)
    ├──► Company P&L (management company roll-up)
    ├──► Balance sheet (consolidated view)
    └──► Cash flow statement (GAAP indirect method)
```

### Verification Pipeline
```
Global Assumptions + Properties
    │
    ├──► Client-side: financialAuditor.ts (GAAP compliance checks)
    │                  formulaChecker.ts (formula integrity)
    │                  gaapComplianceChecker.ts (ASC standard compliance)
    │
    └──► Server-side: calculationChecker.ts (independent recalculation)
                       │
                       └──► AI verification (methodology review via LLM)
```

## Deployment

- Hosted on Replit with automatic HTTPS
- PostgreSQL database (Neon-backed)
- Object storage for file uploads (logos, photos)
- Environment secrets managed through Replit Secrets
