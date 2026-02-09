# Hospitality Business Group — Project Instructions

## Project Summary
Business simulation portal for Hospitality Business Group. Models a boutique hospitality management company alongside individual property SPVs with monthly and yearly financial projections. The system is GAAP-compliant (ASC 230, ASC 360, ASC 470), applies IRS depreciation rules, and includes an internal audit and verification engine designed to support PwC-level review rigor. Five mandatory business rules are enforced across all scenarios.

## Tech Stack
Frontend: React 18, TypeScript, Wouter routing, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts  
Backend: Node.js, Express 5, TypeScript (ESM), Drizzle ORM, PostgreSQL  
Build: Vite (client), esbuild (server)

## Key Architecture Decisions

### Two-Entity Financial Model
1. Management Company  
   Maintains its own Income Statement, Cash Flow Statement, Balance Sheet, and FCF/IRR. Generates revenue through management and service fees charged to properties.
2. Property Portfolio  
   Each property is modeled as an independent SPV with its own full financial statements and returns. The system also produces aggregated and consolidated portfolio views.

### Reusable Component Library
Every page must use the shared component library. Inline or ad-hoc styling is not permitted.

| Component | File | Purpose |
|---------|------|---------|
| PageHeader | client/src/components/ui/page-header.tsx | Page titles with actions slot |
| GlassButton | client/src/components/ui/glass-button.tsx | All buttons (primary, ghost, icon, export, settings) |
| ExportMenu | client/src/components/ui/export-toolbar.tsx | Unified export dropdown |
| DarkGlassTabs | client/src/components/ui/tabs.tsx | Tab navigation with rightContent slot |
| FinancialChart | client/src/components/ui/financial-chart.tsx | Standardized Recharts wrapper |
| FinancialTable | client/src/components/ui/financial-table.tsx | Sticky-column financial tables |
| StatCard | client/src/components/ui/stat-card.tsx | KPI cards |
| ContentPanel | client/src/components/ui/content-panel.tsx | Section wrappers |
| SaveButton | client/src/components/ui/save-button.tsx | Save actions with loading state |

### Export System (Reusable Pattern)
The export system is a core reusable pattern across all data-driven pages. Full documentation lives in `.claude/skills/exports/SKILL.md`.

Component: ExportMenu — a single “Export” dropdown supporting PDF, Excel, CSV, PPTX, chart PNG, and table PNG.

To add exports to any page:
1. Import ExportMenu and action helpers from `@/components/ui/export-toolbar`
2. Import export utilities from `@/lib/exports`
3. Create handlers that return `{ years: string[], rows: SlideTableRow[] }`
4. Wire handlers using `pdfAction`, `excelAction`, `csvAction`, `pptxAction`, `chartAction`, `pngAction`
5. Place ExportMenu in `DarkGlassTabs.rightContent` or `PageHeader.actions`

Export utilities live in `client/src/lib/exports/` and include Excel, PPTX, PDF chart, PNG, and barrel exports.

### Design System
Authoritative reference: `.claude/skills/design-system/SKILL.md`

Color palette:  
Sage Green `#9FBCA4`, Secondary Green `#257D41`, Off-White `#FFF9F5`, Coral `#F4795B`, Dark Navy `#1A2A3A`

Page themes:  
Dark glass for dashboards and entity views; light for assumptions, research, and discovery pages.

Typography:  
Playfair Display for headings, Inter for UI and data text.

### Financial Engine
Core financial logic resides in:
- `client/src/lib/financialEngine.ts`
- `client/src/lib/loanCalculations.ts`
- `client/src/lib/constants.ts`

The engine produces monthly pro formas with yearly aggregation. Depreciation defaults to 27.5-year straight-line with configurable land value percentage and fiscal year start.

### Verification and Audit
The verification system enforces GAAP consistency and internal invariants:
- `client/src/lib/financialAuditor.ts`
- `client/src/lib/runVerification.ts`

Coverage includes timing, depreciation, loans, income statement, balance sheet, cash flow, and management fees. Outputs UNQUALIFIED, QUALIFIED, or ADVERSE opinions.

## AI Research
Research Skills are defined in `.claude/skills/` and orchestrated via `server/aiResearch.ts`. Claude tool schemas live in `.claude/tools/`. Outputs include structured market, ADR, occupancy, and cap rate analyses.

## File Organization

```
client/src/
├── components/ui/
├── lib/
│ ├── exports/
│ ├── financialEngine.ts
│ ├── loanCalculations.ts
│ ├── constants.ts
│ ├── financialAuditor.ts
│ └── runVerification.ts
├── pages/
└── hooks/

.claude/
├── claude.md
├── rules/
├── skills/
│ ├── exports/
│ └── *.md
└── tools/

server/
├── routes.ts
├── storage.ts
└── aiResearch.ts
```


## Conventions
All monetary values must be formatted with currency precision and thousands separators. All interactive and display elements require `data-testid`. No mock or placeholder data is permitted in production paths. All buttons must use GlassButton. All pages must use PageHeader. All export functionality must use ExportMenu. Legacy import paths are preserved via re-export barrels.

Agent persona: `.claude/rules/agent-persona.md` is mandatory behavior for all finance and statement work.

Audit doctrine: `.claude/rules/audit-doctrine.md` defines what an “audit” must cover (math, variables, workflows, reports, code risks, and GAAP). For any request using the word “audit,” follow that doctrine and its output format.

Audits must explicitly check for hardcoded values in calculation paths and monthly→yearly rollup correctness.


## Authoritative Finance Skill Specification

Finance authority tool: `.claude/tools/financing/financial_standards_authority.json` (tool name: `get_financial_standards_authority`). For any finance/stats/consolidation/refi work, consult this tool output before implementing classification-sensitive logic.

The file `/skills/finance/FINANCE_SKILL_SPECS.md` is the single source of truth for:
- Financing
- Refinancing
- Funding and tranches
- Application of events to Income Statement, Cash Flow Statement, and Balance Sheet
- FCF and IRR calculations

When working on any finance-related code:
- Claude Code must comply with the Skill boundaries and GAAP constraints defined in that file
- Claude must explicitly state the Active Skill before making changes
- Claude must not modify accounting logic outside the allowed scope of the Active Skill
- Violations must be reported and explained, not silently corrected
- Finance changes must pass the verification engine with an UNQUALIFIED result, or clearly explain why verification cannot yet be run

Before implementing finance changes, Claude must state the Active Skill being used
(e.g., Finance.RefinanceCalculator) and the allowed write scope for that task.

Finance changes must run verification:
- `client/src/lib/runVerification.ts` (or equivalent) must pass with UNQUALIFIED.
If verification cannot be run, Claude must state why and provide a minimal reproduction plan.
