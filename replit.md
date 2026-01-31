# L+B Hospitality Group - Business Simulation Portal

## Overview

This project is a business simulation portal for L+B Hospitality Group, a boutique hotel management company. It provides financial modeling and portfolio management capabilities, including dashboard views, property portfolio management, financial pro forma generation, and configurable model inputs for hospitality assets across North America and Latin America. The system models both the management company and individual property SPVs, generating monthly and yearly financial statements, income statements, and cash flow projections. The core purpose is to offer a comprehensive financial simulation and projection tool for hospitality business planning.

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
- **Color Palette**: Primary Sage Green (#9FBCA4), Secondary Green (#257D41), Warm Off-White (#FFF9F5), Coral Accent (#F4795B), Black (#000000, #0a0a0f), and a specific dark blue-gray gradient (#2d4a5e, #3d5a6a, #3a5a5e) for navigation and dark-themed pages.
- **Page Styling**:
    - **Login Page**: Centered glass dialog card on near-black (#0a0a0f) background with subtle sage green blur orbs. Clean, Swiss Modernist design.
    - **Assumption Pages (Light Theme)**: White/80 backdrop-blur-xl cards with sage green accents, gray text, and white input backgrounds.
    - **Main App Pages (Dark Glass Theme)**: Dark blue-gray gradient cards with off-white text and semi-transparent white input backgrounds.
    - **Financial Statement Tables (Light Theme)**: Light backgrounds (white, gray-50, gray-100) with dark gray text.
- **Navigation & Tabs**: Dark glass gradient sidebar with white text for active items.
- **Buttons**: Standardized `SaveButton` component with dark glass effect, bright white text, and a sage green glow.
- **PageHeader Component**: Standardized `PageHeader` with fixed minimum height, `text-3xl` serif title, `text-sm` subtitle, and a dark glass variant across all pages.
- **Charts**: All charts must follow these requirements:
    - **White background** for readability (bg-white with shadow-lg and gray border)
    - **Colorful gradient lines**: Green gradients (#257D41 to #34D399) for revenue/NOI, Blue gradients (#3B82F6 to #60A5FA) for GOP/FCF, Coral gradients (#F4795B to #FB923C) for FCFE/secondary metrics
    - **Data point dots**: Every chart line must have visible dots at each data point (dot={{ fill: 'color', stroke: '#fff', strokeWidth: 2, r: 4 }})
    - **Light gray grid**: Dashed grid lines (#E5E7EB) with no vertical lines
    - **Line width**: strokeWidth of 3 for all chart lines
    - Verified by Design Consistency Checker in Admin > Verification tab
- **Admin Page**: Consolidated admin functionality in single `/admin` route with tabs for Users, Login Activity, and Verification. Replaces separate `/admin/users`, `/admin/login-logs`, `/admin/verification` routes.

### Financial Engine & Logic
- Generates monthly pro forma projections including revenue, operating expenses, management fees, debt service, NOI, and cash flow.
- **GAAP-Compliant Free Cash Flow Calculation (Indirect Method)**: Incorporates Net Income, Operating Cash Flow, and Free Cash Flow to Equity (FCFE).
- **Depreciation**: 27.5-year straight-line on building value, starting from acquisition date.
- **Debt Service**: Proper amortization with interest/principal separation.
- **Acquisition Timing**: All balance sheet entries (assets, liabilities, equity) only appear after property acquisition date. Debt outstanding returns 0 before acquisition.
- **Shared Loan Calculations**: `client/src/lib/loanCalculations.ts` provides consistent debt service, refinance, and outstanding balance calculations across all financial statements.
- **Partner Compensation**: Starts at $15,000/month per partner, escalates annually at inflation + 10%, capped at $30,000/month.
- **SAFE Funding**: Models two tranches with configurable amounts and dates, appearing as inflows in cash flow.
- **Cost Escalation**: Fixed costs escalate at a configurable rate (default 3%), while variable costs escalate at the inflation rate.
- **Catering Levels**: Global assumptions define Full Service and Partial Service catering rates for event revenue and costs.
- **Configurable Fiscal Year**: Financial statements and charts can align with any fiscal year start month.
- **Key Data Models**: Global Assumptions (model-wide parameters), Properties (individual asset details), and Scenarios (saved snapshots of assumptions and properties per user).
- **Scenarios Feature**: Users can save their current configuration (global assumptions + all properties) as named scenarios, then load them later to restore that state. Each user has their own isolated scenarios.

## External Dependencies

- **Database**: PostgreSQL
- **ORM Tooling**: Drizzle Kit (for schema migrations)
- **UI Libraries**: Radix UI (accessible components), Recharts (charts), Lucide React (icons)
- **Utilities**: date-fns (date manipulation)
- **Development Tools**: Vite (frontend dev server), tsx (TypeScript execution for server)