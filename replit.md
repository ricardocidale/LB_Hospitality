# Hospitality Business Group - Business Simulation Portal

## Overview
Business simulation portal for a boutique hotel management company. Financial modeling, portfolio management, and GAAP-compliant pro formas for hospitality assets across North America and Latin America.

## User Preferences
- Communication style: Simple, everyday language. Ask clarifying questions before implementing.
- **TOP PRIORITY: Calculations and correct reports always highest priority.** 384-test proof system must always pass.
- Always format money as currency. Company name is "Hospitality Business Group" (never "L+B Hospitality").
- All skills stored under `.claude/`. All UI must reference a theme via the theme engine.

## Current Theme
**Fluid Glass** is the active theme.

## Full Documentation
**All project instructions, skills, rules, manuals, and tools live in `.claude/claude.md`** (the single source of truth). Load it for detailed architecture, pages, integrations, tech stack, and skill routing.

## Quick Reference
- `npm run dev` — Start dev server
- `npm test` — Run all 384 tests
- `npm run verify` — Full financial verification
- `npm run db:push` — Push schema changes
- Tech: React 18 + TypeScript + Express 5 + PostgreSQL + Drizzle ORM
