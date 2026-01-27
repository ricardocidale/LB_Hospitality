# L+B Hospitality Group - Investor Portal

## Overview

This project is an investor portal for L+B Hospitality Group, a boutique hotel management company. It provides financial modeling and portfolio management capabilities, including dashboard views, property portfolio management, financial pro forma generation, and configurable model inputs for hospitality assets across North America and Latin America. The system models both the management company and individual property SPVs, generating monthly and yearly financial statements, income statements, and cash flow projections. The core purpose is to offer a comprehensive financial overview and projection tool for hospitality investments.

## User Preferences

Preferred communication style: Simple, everyday language.
Always format money as money (currency format with commas and appropriate precision).

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query for server state, Zustand for local state
- **UI Components**: shadcn/ui built on Radix UI
- **Styling**: Tailwind CSS v4 with custom design tokens, class-variance-authority
- **Charts**: Recharts
- **Fonts**: Playfair Display (serif headings) + Inter (UI/data)

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints
- **Build Tool**: esbuild for server bundling, Vite for client

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts`
- **Validation**: Zod schemas generated from Drizzle schemas
- **Database**: PostgreSQL

### UI/UX Decisions
- **Color Palette**: Primary Sage Green (#9FBCA4), Secondary Green (#257D41), Warm Off-White (#FFF9F5), Coral Accent (#F4795B), and a specific dark blue-gray gradient for navigation and dark-themed pages.
- **Page Styling**:
    - **Assumption Pages (Light Theme)**: White/80 backdrop-blur-xl cards with sage green accents, gray text, and white input backgrounds.
    - **Main App Pages (Dark Glass Theme)**: Dark blue-gray gradient cards with off-white text and semi-transparent white input backgrounds.
    - **Financial Statement Tables (Light Theme)**: Light backgrounds (white, gray-50, gray-100) with dark gray text.
- **Navigation & Tabs**: Dark glass gradient sidebar with white text for active items.
- **Buttons**: Standardized `SaveButton` component with dark glass effect, bright white text, and a sage green glow.
- **PageHeader Component**: Standardized `PageHeader` with fixed minimum height, `text-3xl` serif title, `text-sm` subtitle, and a dark glass variant across all pages.

### Financial Engine & Logic
- Generates monthly pro forma projections including revenue, operating expenses, management fees, debt service, NOI, and cash flow.
- **GAAP-Compliant Free Cash Flow Calculation (Indirect Method)**: Incorporates Net Income, Operating Cash Flow, and Free Cash Flow to Equity (FCFE).
- **Depreciation**: 27.5-year straight-line on building value.
- **Debt Service**: Proper amortization with interest/principal separation.
- **Partner Compensation**: Starts at $15,000/month per partner, escalates annually at inflation + 10%, capped at $30,000/month.
- **SAFE Funding**: Models two tranches with configurable amounts and dates, appearing as inflows in cash flow.
- **Cost Escalation**: Fixed costs escalate at a configurable rate (default 3%), while variable costs escalate at the inflation rate.
- **Catering Levels**: Global assumptions define Full Service and Partial Service catering rates for event revenue and costs.
- **Configurable Fiscal Year**: Financial statements and charts can align with any fiscal year start month.
- **Key Data Models**: Global Assumptions (model-wide parameters) and Properties (individual asset details).

## External Dependencies

- **Database**: PostgreSQL
- **ORM Tooling**: Drizzle Kit (for schema migrations)
- **UI Libraries**: Radix UI (accessible components), Recharts (charts), Lucide React (icons)
- **Utilities**: date-fns (date manipulation)
- **Development Tools**: Vite (frontend dev server), tsx (TypeScript execution for server)