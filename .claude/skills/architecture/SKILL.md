---
name: architecture
description: Project architecture, tech stack, and two-entity financial model. Use when building new features, understanding system structure, or making architectural decisions.
---

# Architecture & Tech Stack

## Project Summary
Business simulation portal for Hospitality Business Group. Models a boutique hospitality management company alongside individual property SPVs with monthly and yearly financial projections. GAAP-compliant (ASC 230, ASC 360, ASC 470), applies IRS depreciation rules, and includes an internal audit and verification engine.

## Tech Stack
- **Frontend**: React 18, TypeScript, Wouter routing, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts
- **Backend**: Node.js, Express 5, TypeScript (ESM), Drizzle ORM, PostgreSQL
- **Build**: Vite (client), esbuild (server)
- **3D/Animation**: Three.js (@react-three/fiber, drei, postprocessing), framer-motion
- **Fonts**: Playfair Display (headings) + Inter (UI/data)

## Two-Entity Financial Model

### 1. Management Company
- Maintains its own Income Statement, Cash Flow Statement, Balance Sheet, and FCF/IRR
- Generates revenue through management and service fees charged to properties
- Fee revenue must match property fee expenses (intercompany linkage)

### 2. Property Portfolio
- Each property is modeled as an independent SPV
- Full financial statements and returns per property
- Aggregated and consolidated portfolio views available
- Consolidation includes intercompany elimination

### Five Mandatory Business Rules
Enforced across all scenarios. See `.claude/manuals/user-manual/skills/02-business-rules.md` for details.

## File Organization

```
client/src/
├── components/
│   ├── ui/                    # Reusable component library
│   ├── Dashboard3DBackground.tsx
│   ├── Login3DScene.tsx
│   └── ResearchRefreshOverlay.tsx
├── lib/
│   ├── exports/               # Excel, PPTX, PDF, PNG export utilities
│   ├── financialEngine.ts     # Primary calculation engine
│   ├── loanCalculations.ts
│   ├── equityCalculations.ts
│   ├── cashFlowAggregator.ts
│   ├── cashFlowSections.ts
│   ├── yearlyAggregator.ts
│   ├── constants.ts           # All named constants and defaults
│   ├── financialAuditor.ts
│   └── runVerification.ts
├── pages/
└── hooks/

server/
├── routes.ts
├── storage.ts
└── aiResearch.ts

calc/
├── shared/pmt.ts
└── refinance/

analytics/
└── returns/irr.ts
```
