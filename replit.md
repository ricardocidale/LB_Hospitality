# Hospitality Business Group - Business Simulation Portal

## Overview
Business simulation portal for a boutique hotel management company. Financial modeling, portfolio management, and GAAP-compliant pro formas for hospitality assets across North America and Latin America. Branded "powered by Norfolk AI" (discrete, 9px, low opacity).

## Documentation Hub
**All project documentation lives in `.claude/claude.md`** — the single source of truth for architecture, skills, rules, manuals, tools, testing, integrations, and project state. Load it for any detailed work.

Key directories inside `.claude/`:
- `skills/` — 50+ skill files across testing, finance, UI, exports, proof system, architecture
- `rules/` — 8 rule files (audit doctrine, constants, DB seeding, API routes, etc.)
- `manuals/` — Checker manual (15 sections) and user manual (16 sections)
- `tools/` — Tool schemas for analysis, financing, returns, validation, UI
- `commands/` — 8 slash commands (verify, seed, scenarios, themes, etc.)

## User Preferences
- Communication style: Simple, everyday language. Ask clarifying questions before implementing.
- **TOP PRIORITY: Calculations and correct reports always highest priority.** 445-test proof system must always pass.
- Always format money as currency. Company name is "Hospitality Business Group" (never "L+B Hospitality").
- All skills stored under `.claude/`. All UI must reference a theme via the theme engine.
- New UI features get their own skill file in `.claude/skills/ui/`.
- When updating features, always update the corresponding skills and manuals documentation.

## Current Theme
**Fluid Glass** is the active theme. All new UI work must follow Fluid Glass styling conventions.

## Quick Reference
- `npm run dev` — Start dev server
- `npm test` — Run all 445 tests
- `npm run verify` — Full financial verification (UNQUALIFIED = pass)
- `npm run db:push` — Push schema changes
- Tech: React 18 + TypeScript + Express 5 + PostgreSQL + Drizzle ORM
- 3D: Three.js (@react-three/fiber, drei, postprocessing), framer-motion
- Fonts: Playfair Display (headings) + Inter (UI/data)
