# Hospitality Business Group - Business Simulation Portal

## Overview
Business simulation portal for a boutique hotel management company. Financial modeling, portfolio management, and GAAP-compliant pro formas for hospitality assets across North America and Latin America.

## User Preferences
- Communication style: Simple, everyday language. Ask clarifying questions before implementing.
- **TOP PRIORITY: Calculations and correct reports always highest priority.** 384-test proof system must always pass.
- Always format money as currency. Company name is "Hospitality Business Group" (never "L+B Hospitality").
- All skills stored under `.claude/`. All UI must reference a theme via the theme engine.
- Always keep `replit.md` in sync with `.claude/claude.md` — they must reflect the same project state.
- New UI features get their own skill file in `.claude/skills/ui/`.

## Current Theme
**Fluid Glass** is the active theme.

## Recent Changes
- **Calculation Transparency Toggles**: Two on/off switches in Settings > Other tab control visibility of formula help icons and expandable accordion rows in financial tables. One toggle for Management Company reports, one for all Property reports. Default: ON. Schema fields: `show_company_calculation_details`, `show_property_calculation_details`. Uses `CalcDetailsProvider` React context in `financial-table-rows.tsx`.
- **Accordion Formula Rows**: Expandable rows in income statements showing step-by-step calculation breakdowns (base revenue × rate × escalation × 12). Used by checker for verification. Components: `ExpandableLineItem`, `ExpandableMetricRow`, `FormulaDetailRow`.
- **Austin Hillside exit cap rate**: Updated to 8.0% based on market research (Austin boutique 5.5%-7.5% going-in, +50-100bps for exit).
- **Casa Medellín exit cap rate**: Set to 9.0%.

## Full Documentation
**All project instructions, skills, rules, manuals, and tools live in `.claude/claude.md`** (the single source of truth). Load it for detailed architecture, pages, integrations, tech stack, and skill routing.

## Key Skills (in `.claude/skills/`)
- `ui/calculation-transparency.md` — Toggle system for showing/hiding formula details
- `ui/accordion-formula-rows.md` — Expandable formula verification rows
- `ui/help-tooltip.md` — The `?` help icon system
- `ui/financial-table-styling.md` — Financial table visual conventions
- `finance/income-statement.md` — Income statement architecture
- `finance/cash-flow-statement.md` — Cash flow statement architecture

## Quick Reference
- `npm run dev` — Start dev server
- `npm test` — Run all 384 tests
- `npm run verify` — Full financial verification
- `npm run db:push` — Push schema changes
- Tech: React 18 + TypeScript + Express 5 + PostgreSQL + Drizzle ORM
