# Hospitality Business Group - Business Simulation Portal

## Overview

This project is a business simulation portal for Hospitality Business Group, a boutique hotel management company. Its core purpose is to provide comprehensive financial simulation and projection capabilities for hospitality business planning. Key functionalities include financial modeling, portfolio management, dashboard views, and the generation of financial pro formas. The system supports configurable model inputs for hospitality assets across North America and Latin America, modeling both the management company and individual property SPVs to generate monthly and yearly financial statements, income statements, and cash flow projections. The business vision is to empower data-driven decisions for property acquisition, development, and operational management within the hospitality sector, offering a competitive edge through precise financial forecasting and strategic planning.

## User Preferences

Preferred communication style: Simple, everyday language. Detailed user — ask lots of clarifying questions before implementing features. Do not assume; confirm requirements first.
**TOP PRIORITY: Calculations and correct reports are always the highest priority.** Financial accuracy must never be compromised for visual or UI enhancements. The automated proof system (384 tests) must always pass.
Always format money as money (currency format with commas and appropriate precision).
All skills must be stored under `.claude/` directory (e.g., `.claude/skills/`, `.claude/manuals/`, `.claude/tools/`). Never place skills elsewhere.
The company name is "Hospitality Business Group" (or "Hospitality Business" for short). Never use "L+B Hospitality" in code or documentation.
When updating features, always update the corresponding skills (`.claude/skills/`) and manuals (`.claude/manuals/`) documentation.

## Detailed Documentation

**All detailed project documentation, architecture, file organization, conventions, and technical references are maintained in `.claude/claude.md`.** That file is the single source of truth for:

- System architecture (frontend, backend, data layer)
- UI/UX design principles, component library, and design system
- Business model and entity structure
- Financial engine, double-entry ledger, and statements
- Verification and audit system
- AI research architecture, seed data, and auto-refresh
- Automated financial proof system (384 tests)
- 3D graphics and animation system
- Database environments
- Tool schema categories and file organization
- Coding conventions and finance skill specifications

Always refer to `.claude/claude.md` for the authoritative, up-to-date details on any of the above topics.

## Quick Reference

### Tech Stack
- **Frontend**: React 18, TypeScript, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts
- **Backend**: Node.js, Express 5, TypeScript (ESM), esbuild
- **Data**: Drizzle ORM, PostgreSQL, Zod validation
- **3D/Animation**: Three.js (@react-three/fiber, drei, postprocessing), framer-motion
- **Fonts**: Playfair Display (headings) + Inter (UI/data)

### Key Commands
- `npm run dev` — Start development server
- `npm test` — Run all 384 tests
- `npm run verify` — Full financial verification (4-phase)

### External Dependencies
- PostgreSQL, Drizzle Kit, Radix UI, Recharts, Lucide React, date-fns
- three, @react-three/fiber, @react-three/drei, @react-three/postprocessing
- framer-motion
- RapidAPI "Realty in US" (property finding)
