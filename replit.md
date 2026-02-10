# Hospitality Business Group - Business Simulation Portal

## Overview
Business simulation portal for a boutique hotel management company. Financial modeling, portfolio management, and GAAP-compliant pro formas for hospitality assets across North America and Latin America. Branded "powered by Norfolk AI" (discrete, 9px, low opacity).

## User Preferences
- Communication style: Simple, everyday language. Ask clarifying questions before implementing.
- **TOP PRIORITY: Calculations and correct reports always highest priority.** 384-test proof system must always pass.
- Always format money as currency. Company name is "Hospitality Business Group" (never "L+B Hospitality").
- All skills stored under `.claude/`. All UI must reference a theme via the theme engine.
- Always keep `replit.md` in sync with `.claude/claude.md` — they must reflect the same project state.
- New UI features get their own skill file in `.claude/skills/ui/`.
- Create skills when they can help divide tasks and reduce context. Always in `.claude/`.
- When updating features, always update the corresponding skills and manuals documentation.

## Current Theme
**Fluid Glass** is the active theme. All new UI work must follow Fluid Glass styling conventions.

## Recent Changes
- **Asset Descriptions**: Admin-managed asset descriptions (asset_descriptions table) with per-user assignment. Seeded: "Boutique Hotel", "Exotic Experience Hotel". Extended `/api/my-branding` returns logo, theme, and asset description with default fallbacks.
- **International Address Fields**: Optional property address fields (streetAddress, city, stateProvince, zipPostalCode, country) for international locations. "Map" button on PropertyDetail opens Google Maps (disabled when no address).
- **Sidebar Visibility**: Admin-controlled sidebar navigation. 9 boolean fields in global_assumptions control which optional nav items appear for non-admin users: Property Finder, Sensitivity, Financing, Compare, Timeline, Map View, Executive Summary, Scenarios, User Manual. Core items always visible: Dashboard, Properties, Management Co., Settings, Profile, Administration. Layout uses `sb()` helper for filtering. Admin UI card added, renderSidebar view in progress.
- **Logo Portfolio & User Branding**: Admin-managed logo portfolio (logos table) with per-user assignment. Layout fetches `/api/my-branding` with fallback chain: assigned logo > company logo > default. Schema: `logos` table, `users.assignedLogoId`/`users.assignedThemeId`. Default logos seeded: HBG (default) + Norfolk AI.
- **Calculation Transparency Toggles**: Two on/off switches in Settings > Other tab control visibility of formula help icons and expandable accordion rows. Default: ON. Schema: `show_company_calculation_details`, `show_property_calculation_details`. Uses `CalcDetailsProvider` React context.
- **Accordion Formula Rows**: Expandable rows in income statements showing step-by-step calculation breakdowns. Components: `ExpandableLineItem`, `ExpandableMetricRow`, `FormulaDetailRow`.
- **Exit Cap Rates**: Austin Hillside 8.0% (market: 5.5-7.5% going-in, +50-100bps for exit). Casa Medellín 9.0%.

## Full Documentation
**All project instructions, skills, rules, manuals, and tools live in `.claude/claude.md`** (the single source of truth). Load it for detailed architecture, pages, integrations, tech stack, and skill routing.

## Key Skills (in `.claude/skills/`)
- `ui/calculation-transparency.md` — Toggle system for showing/hiding formula details
- `ui/accordion-formula-rows.md` — Expandable formula verification rows
- `ui/help-tooltip.md` — The `?` help icon system
- `ui/financial-table-styling.md` — Financial table visual conventions
- `ui/theme-engine.md` — Multi-theme system, token structure
- `ui/navigation.md` — Command Palette, Breadcrumbs, Favorites, Activity Feed
- `finance/income-statement.md` — Income statement architecture
- `finance/cash-flow-statement.md` — Cash flow statement architecture
- `proof-system/SKILL.md` — 384 tests, 5 golden scenarios, verification

## Quick Reference
- `npm run dev` — Start dev server
- `npm test` — Run all 384 tests
- `npm run verify` — Full financial verification
- `npm run db:push` — Push schema changes
- Tech: React 18 + TypeScript + Express 5 + PostgreSQL + Drizzle ORM
- 3D: Three.js (@react-three/fiber, drei, postprocessing), framer-motion
- Fonts: Playfair Display (headings) + Inter (UI/data)
