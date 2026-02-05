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
- **Buttons on Dark Backgrounds**: ALL action buttons on dark backgrounds (PageHeaders, dark glass cards) MUST use `GlassButton variant="primary"` from `@/components/ui/glass-button`. This includes Save, Research navigation, Update Research, Google Maps links, and any other action buttons. Uses dark glass gradient (#2d4a5e → #3d5a6a → #3a5a5e), white text, top shine line, and sage green glow on hover. Never use raw `<button>` with ad-hoc `bg-white/10` classes for action buttons on dark backgrounds.
- **SaveButton**: Convenience wrapper around `GlassButton variant="primary"` with save icon and loading state. Located at `@/components/ui/save-button`.
- **Export Buttons**: Use `GlassButton variant="export"` or `Button variant="outline"` for all export buttons (PDF, CSV, Chart). Style: neutral gray background (#f5f5f5), dark gray text, gray border. Must be aligned with tabs on financial pages, not in the title block.
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
- **Configurable Expense Rates**: Event expense rate (default 65%), Other expense rate (default 60%), and Utilities variable/fixed split (default 60/40) are all configurable in Global Assumptions.
- **Exit & Sale Assumptions**: Exit cap rate (default 8.5%) and sales commission rate (default 5%) are configurable at global level, with property-level overrides for exit cap rate and tax rate.
- **Configurable Fiscal Year**: Financial statements and charts can align with any fiscal year start month.
- **Key Data Models**: Global Assumptions (model-wide parameters), Properties (individual asset details), and Scenarios (saved snapshots of assumptions and properties per user).
- **Scenarios Feature**: Users can save their current configuration (global assumptions + all properties) as named scenarios, then load them later to restore that state. Each user has their own isolated scenarios.
- **Room Revenue Calculation**: Uses 30.5 days per month (365/12 = 30.4167, rounded to 30.5) as the industry-standard average month length.

### Financial Verification & Audit System
- **Location**: `client/src/lib/financialAuditor.ts` and `client/src/lib/runVerification.ts`
- **Purpose**: PwC-level independent verification of all financial calculations against GAAP standards
- **Audit Sections**: Timing Rules, Depreciation, Loan Amortization, Income Statement, Balance Sheet, Cash Flow Statement, Management Fees
- **GAAP References**: ASC 230 (Cash Flow), ASC 360 (Property Assets), ASC 470 (Debt), ASC 606 (Revenue Recognition), FASB Conceptual Framework
- **Key Validations**:
  - Depreciation: (Building Value / 27.5 / 12) monthly, starting at acquisition
  - Loan PMT: Standard amortization formula with interest/principal split
  - Balance Sheet: Assets = Liabilities + Equity for every period
  - Cash Flow: Operating CF = Net Income + Depreciation (indirect method)
  - Principal payments are financing activities, NOT income statement expenses (ASC 470)
- **Known-Value Test Cases**: Validates calculations with hand-calculated expected values (e.g., 10 rooms × $100 × 70% × 30.5 = $21,350)
- **Audit Opinions**: UNQUALIFIED (no issues), QUALIFIED (minor issues), ADVERSE (critical issues)

### Shared Constants Pattern
- **Location**: `client/src/lib/constants.ts` is the single source of truth for all DEFAULT_* constants
- **Re-exports**: `client/src/lib/loanCalculations.ts` re-exports constants for backwards compatibility
- **Constants**: DEFAULT_LTV (0.75), DEFAULT_INTEREST_RATE (0.09), DEFAULT_TERM_YEARS (25), DEPRECIATION_YEARS (27.5), DEFAULT_EXIT_CAP_RATE (0.085), DEFAULT_TAX_RATE (0.25), DEFAULT_COMMISSION_RATE (0.05), DEFAULT_REFI_LTV (0.65), DEFAULT_REFI_CLOSING_COST_RATE (0.03)
- **Fallback Pattern**: property-specific value → global value → DEFAULT constant
- **Consumers**: financialEngine.ts, financialAuditor.ts, runVerification.ts, Dashboard.tsx, PropertyEdit.tsx, PropertyDetail.tsx
- **Immutable Constants**: DEPRECIATION_YEARS (27.5) is IRS-mandated per Publication 946 / ASC 360; DAYS_PER_MONTH (30.5) is industry standard (365/12 rounded)
- **Configurable Variables**: All user-adjustable values are stored in the database (globalAssumptions and properties tables) and editable through assumption pages:
  - **Global Assumptions Page**: Boutique hotel definition (room range, ADR range, F&B/events/wellness flags, description), inflation rate, fixed cost escalation, management fees, SAFE funding, partner compensation, staff salary, overhead costs, exit/sale assumptions, catering boosts, expense rates, debt assumptions
  - **Property Edit Page**: Cost rates (rooms, F&B, admin, etc.), revenue shares (events, F&B, other), catering percentages, exit cap rate, tax rate, financing terms

## External Dependencies

- **Database**: PostgreSQL
- **ORM Tooling**: Drizzle Kit (for schema migrations)
- **UI Libraries**: Radix UI (accessible components), Recharts (charts), Lucide React (icons)
- **Utilities**: date-fns (date manipulation)
- **Development Tools**: Vite (frontend dev server), tsx (TypeScript execution for server)