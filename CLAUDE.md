# L+B Hospitality Group - Business Simulation Portal

## Project Overview

A financial modeling and portfolio management portal for L+B Hospitality Group, a boutique hotel management company. The system generates monthly/yearly pro forma projections, income statements, balance sheets, and cash flow statements for hospitality assets across North America and Latin America. Includes independent financial verification against GAAP standards (ASC 230, 360, 470, 606) and AI-powered market research.

## Tech Stack

- **Frontend**: React 18 + TypeScript, Wouter routing, TanStack Query, shadcn/ui, Tailwind CSS v4, Recharts
- **Backend**: Node.js + Express 5, TypeScript ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Build**: Vite (client), esbuild (server)
- **AI**: Multi-provider support (OpenAI, Anthropic/Claude, Gemini) for market research

## Key Commands

```bash
npm run dev          # Start development server (port 5000)
npx tsx server/seed.ts        # Seed database with dev data
npx tsx server/seed.ts --force # Force re-seed (clears existing data)
npx drizzle-kit push          # Push schema changes to database
```

## Directory Structure

```
shared/schema.ts              # Drizzle ORM schema (single source of truth)
client/src/pages/              # React page components
client/src/lib/                # Financial engine, constants, utilities
client/src/components/         # Shared UI components
server/routes.ts               # Express API routes
server/storage.ts              # Database access layer (IStorage interface)
server/auth.ts                 # Authentication & session management
server/calculationChecker.ts   # Independent server-side financial verification
server/seed.ts                 # Database seeding script
```

## Coding Standards

- All financial constants live in `client/src/lib/constants.ts`
- Fallback pattern: `property-specific value → global value → DEFAULT constant`
- Dynamic config: `const projectionYears = global?.projectionYears ?? PROJECTION_YEARS`
- Action buttons on dark backgrounds: use `GlassButton variant="primary"`
- Schema changes require both `shared/schema.ts` update and SQL migration
- Never expose API keys or secrets in client code

## Common Gotchas

- `PROJECTION_YEARS` and `PROJECTION_MONTHS` are fallback defaults only; always prefer dynamic values from global assumptions
- Depreciation uses 27.5-year straight-line (IRS Publication 946 / ASC 360) - this is immutable
- Room revenue uses 30.5 days/month (365/12 rounded) - industry standard, not configurable
- Balance sheet entries only appear after property acquisition date
- Principal payments are financing activities, NOT income statement expenses (ASC 470)
- The `checker` user has role "user" but gets verification access via email check in `requireChecker` middleware
- Seeding is idempotent - it skips if data already exists

## Environment Variables

- `ADMIN_PASSWORD` - Admin user password (required)
- `CHECKER_PASSWORD` - Checker user password (required)
- `DATABASE_URL` - PostgreSQL connection string (auto-configured)

## Documentation

See `.claude/rules/` for detailed documentation on:
- Architecture, database & seeding, financial engine, verification system
- UI design system, shared constants, API route reference
