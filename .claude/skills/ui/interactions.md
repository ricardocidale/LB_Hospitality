---
name: interactions
description: Interactive analysis components — What-If sliders, Variance Analysis, Guided Walkthrough, Inline Editing. Use when building interactive financial tools.
theme: light-cream / inherit
---

# Interactive Components

## What-If Slider Panel
Adjustable sliders for key assumptions with real-time projection updates.

- **File**: `client/src/components/WhatIfPanel.tsx`
- **Placement**: Collapsible side panel on property/portfolio pages
- **Sliders**: ADR Growth (0-10%), Occupancy (40-100%), Cost Escalation (0-8%), Cap Rate (3-12%), LTV (0-80%), Interest Rate (2-10%)
- **Behavior**: Debounced 150ms recalculation, Reset button, Save as Scenario button
- **Theme**: Light Cream — slider track `muted`, thumb `accent`, values `font-mono tabular-nums`

---

## Variance Analysis
Side-by-side comparison of two scenarios with variance highlighting.

- **File**: `client/src/components/VarianceAnalysis.tsx`
- **Layout**: Scenario A/B selectors, table with Metric | A | B | Variance ($) | Variance (%)
- **Colors**: Favorable (higher revenue / lower costs) = `accent`, Unfavorable = `destructive`, Immaterial (<1%) = `muted-foreground`
- **Metrics**: Revenue, GOP, NOI, FCF, IRR, DSCR, Occupancy, ADR, Debt Service, Cap Rate

---

## Guided Walkthrough
Step-by-step interactive tour explaining the recommended workflow for new users.

- **File**: `client/src/components/GuidedWalkthrough.tsx`
- **Flow**: Dashboard → (1) Define Properties & Assumptions → (2) Management Company Assumptions → (3) Systemwide Assumptions → Save Scenarios → Analysis Tools → User Manual & Help → Quick Search → Notifications
- **Workflow narrative**: Tour explains the proper order — start by defining properties of interest and completing their assumptions, then set up the management company, then review systemwide defaults. Mentions scenarios and other features after the core workflow.
- **Storage**: Zustand store with localStorage persistence (`walkthrough-store`); auto-starts on first visit, restartable from Help menu
- **Tooltip Style**: White rounded card with shadow, step counter, Back/Next/Skip controls
- **Highlight**: Full-screen overlay with spotlight cut-out around target element
- **Missing target**: Auto-skips to next step gracefully (handles conditional nav items like Scenarios and Analysis that may be hidden for some users)

---

## Inline Cell Editing
Click any editable cell in a financial table to modify directly with instant recalculation.

- **File**: Extends `FinancialTable` component with `editable` prop
- **Editable**: Assumption inputs (ADR, occupancy, growth rates, cost rates)
- **Read-Only**: Calculated outputs (revenue, NOI, FCF, totals)
- **States**: Default → Hover (`bg-accent/5` + pencil) → Editing (`ring-2 ring-accent`) → Changed (`bg-amber-50` dot) → Saved (green flash)
- **Integration**: Optimistic updates via TanStack Query, debounced 300ms save
