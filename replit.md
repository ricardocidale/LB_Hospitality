# L+B Hospitality Group - Investor Portal

## Overview

This is a financial modeling and portfolio management application for L+B Hospitality Group, a boutique hotel management company. The application provides an investor portal with dashboard views, property portfolio management, financial pro forma generation, and configurable model inputs for hospitality assets across North America and Latin America.

The system models both the management company (L+B Hospitality Co.) and individual property SPVs, generating monthly and yearly financial statements including income statements and cash flow projections.

## User Preferences

Preferred communication style: Simple, everyday language.
Always format money as money (currency format with commas and appropriate precision).

## Design System

### Color Palette
- **Primary Sage Green**: #9FBCA4
- **Secondary Green**: #257D41
- **Warm Off-White**: #FFF9F5
- **Coral Accent**: #F4795B (special elements only)
- **Sidebar/Navigation Gradient**: from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e]

### Page Styling Rules

#### Assumption Pages (Light Theme)
- **Applies to**: Company Assumptions, Property Assumptions (PropertyEdit), Global Assumptions (Settings)
- **Card backgrounds**: bg-white/80 backdrop-blur-xl with sage green accents
- **Text colors**: text-gray-900 (headings), text-gray-700 (labels), text-gray-600 (descriptions)
- **Input backgrounds**: bg-white border-[#9FBCA4]/30 text-gray-900
- **Subtle glow orbs**: bg-[#9FBCA4]/10 blur-2xl and bg-[#9FBCA4]/5 blur-xl
- **Card borders**: border-[#9FBCA4]/20 with shadow-[0_8px_32px_rgba(159,188,164,0.15)]

#### Main App Pages (Dark Glass Theme)
- **Applies to**: Dashboard, Company, Portfolio, Property Detail
- **Card backgrounds**: Dark blue-gray gradient from-[#2d4a5e]/80 via-[#3d5a6a]/70 to-[#3a5a5e]/80
- **Text colors**: text-[#FFF9F5] (headings), text-[#FFF9F5]/80 (labels), text-[#FFF9F5]/60 (descriptions)
- **Input backgrounds**: bg-white/10 border-white/20 text-white
- **Card borders**: border-white/10 with subtle white/20 highlights

#### Financial Statement Tables (Light Theme)
- **All pages**: Financial tables use light backgrounds for readability
- **Table backgrounds**: bg-white, bg-gray-50, bg-gray-100
- **Text colors**: text-gray-900, text-gray-700, text-gray-600
- **Borders**: border-gray-200

#### Navigation & Tabs
- **Sidebar**: Dark glass gradient from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e]
- **Active menu items**: bg-white/12 backdrop-blur-xl with pure white text (text-white)
- **Tabs**: Match sidebar gradient with white text for active state

#### Buttons
- **Save/Primary buttons**: Use GlassButton component with variant="primary"
- **Assumptions buttons**: Text "Assumptions" with Settings2 icon
- **Consistent fluid glass effect**: All Save buttons have the same sage green glow effect across all pages

### PageHeader Component Standard
All pages must use the standardized PageHeader component with consistent height, fonts, and styling:

```
<PageHeader
  title="Page Title"
  subtitle="Page description"
  variant="dark"  // or "light" for assumption pages
  backLink="/back-route"  // optional
  actions={<GlassButton>Action</GlassButton>}  // optional
/>
```

**PageHeader properties**:
- Fixed minimum height: min-h-[88px] for consistent sizing
- Title: text-3xl font-serif font-bold
- Subtitle: text-sm mt-1
- Variant "dark": Dark glass gradient (from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e]) for main app pages
- Variant "light": White/80 backdrop-blur-xl with sage green accents for assumption pages
- Actions slot for Save Changes buttons or other action buttons

**Page variant assignments**:
- **Dark variant**: All pages use dark variant for consistent header styling (Dashboard, Company, Portfolio, Property Detail, User Management, Company Assumptions, Property Assumptions, Global Assumptions)

### GlassButton Primary Variant Standard
All primary action buttons (Save, Submit, Confirm) must use:
```
<GlassButton variant="primary" onClick={handler} disabled={isPending}>
  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
  Save Changes
</GlassButton>
```

**Primary variant styling (fluid glass effect)**:
- Dark glass background: bg-white/12 backdrop-blur-xl
- Top shine highlight: white/40 gradient line
- Border: border-white/25
- Shadow: 0_0_20px sage glow (rgba(159,188,164,0.3))
- Text: white font-medium
- Always include icon (Save, Loader2 for pending state)
- Rounded corners: rounded-xl

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

### Management Company Operations Start Date
- Added configurable Operations Start Date field in Company Assumptions (default: June 2026)
- Determines when the management company begins incurring costs (salaries, overhead)
- Located in new "Company Setup" section at the top of Company Assumptions page

### Investment Analysis with GAAP-Compliant Free Cash Flow
- Added Tax Rate field to each property (default 25%) in Property Assumptions
- Added Company Tax Rate field (default 30%) in Company Assumptions
- **GAAP-Compliant Free Cash Flow Calculation (Indirect Method)**:
  1. **Net Income** = NOI - Interest Expense - Depreciation - Income Tax
  2. **Operating Cash Flow** = Net Income + Depreciation (add back non-cash expense)
  3. **Working Capital Changes** = Changes in receivables, payables (currently minimal for stabilized properties)
  4. **Cash from Operations** = Operating Cash Flow ± Working Capital Changes
  5. **Free Cash Flow (FCF)** = Cash from Operations - Maintenance CapEx (FF&E reserves included in NOI)
  6. **Free Cash Flow to Equity (FCFE)** = FCF - Principal Payments
- **Legacy Real Estate Investment Analysis Fields** (for compatibility):
  - Before-Tax Cash Flow (BTCF): NOI - Debt Service
  - After-Tax Cash Flow (ATCF): BTCF - Tax Liability
- Depreciation: 27.5-year straight-line on building value (purchasePrice + buildingImprovements)
- Debt Service: Proper amortization with interest/principal separation
- Outstanding loan balance tracked at each year for accurate exit value calculations
- Property-Level IRR table includes Tax Rate column

### Financial Model Updates
- Catering level rates flow from Global Assumptions through to financial engine calculations
- Event revenue and costs now use global catering level rates instead of hardcoded values
- SAFE funding inflows added to management company cash flow projections

### Configurable Fiscal Year
- Added fiscalYearStartMonth field in Global Assumptions (Macro section)
- Fiscal year can start in any month (default: January)
- All financial statements, charts, and exports use fiscal year labels
- Fiscal year is labeled by the year it starts (e.g., FY starting April 2026 = FY 2026)

## Future Enhancements

### Planned Features
1. **User Authentication**: Login system with user profiles for investors and partners
2. **Saved Scenarios**: Ability to save and compare different financial model scenarios
3. **Role-Based Access**: Different views for LPs (Limited Partners) vs GPs (General Partners)

### Financial Model Enhancements
The current financial statements follow **GAAP-compliant Free Cash Flow methodology** (indirect method). For further enhancements, consider:

1. **Land Value Separation**: Add a land value field to each property to exclude land from the depreciation base (GAAP requires land not be depreciated)
2. **Working Capital Modeling**: Currently set to zero for stabilized properties. Could be enhanced to model seasonal A/R and A/P fluctuations for more dynamic operations.
3. **Balance Sheet Timing**: Align cash calculations with initial equity deployment timing for properties acquired at different dates

**Note on Maintenance CapEx**: For hospitality properties, FF&E (Furniture, Fixtures & Equipment) reserves are typically included in operating expenses within NOI (at 4% of revenue). This follows the Uniform System of Accounts for the Lodging Industry (USALI). Since maintenance capex is already reflected in NOI, no additional deduction is made in the FCF calculation.

Current calculations follow both GAAP and real estate investment analysis conventions.

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