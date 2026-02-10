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
**All UI components must reference a theme** via the theme engine (`.claude/skills/ui/theme-engine.md`). The app supports multiple themes including user-created themes.

## Detailed Documentation

**`.claude/claude.md` is now a slim router** pointing to focused skills. Load the relevant skill before working on any domain. Key skill directories:

- `.claude/skills/architecture/` — Tech stack, two-entity model, file organization
- `.claude/skills/design-system/` — Colors, typography, component catalog
- `.claude/skills/ui/` — 20+ UI component skills (each theme-aware), theme engine
- `.claude/skills/finance/` — 17 finance calculation skills
- `.claude/skills/research/` — 8 AI research skills with co-located tools
- `.claude/skills/proof-system/` — 384-test automated proof system
- `.claude/skills/exports/` — PDF, Excel, PPTX, PNG, CSV export system
- `.claude/skills/coding-conventions/` — Style rules, finance code rules
- `.claude/skills/database-environments/` — Dev/prod databases, migrations
- `.claude/skills/tool-schemas/` — Tool organization and conventions
- `.claude/manuals/` — Checker manual (15 sections), user manual (16 sections)
- `.claude/tools/` — Analysis, financing, returns, validation, UI tool schemas

## Integrations

### Connected (server/integrations/)
| Integration | File | Status |
|-------------|------|--------|
| Google Sheets | googleSheets.ts | Connected, client saved |
| Gmail | gmail.ts | Connected, client saved |
| Google Drive | googleDrive.ts | Connected, client saved |
| Google Docs | googleDocs.ts | Connected, client saved |
| Google Calendar | googleCalendar.ts | Connected, client saved |
| Stripe | stripeClient.ts, stripeWebhook.ts | Connected, client saved |
| Twilio | twilio.ts | Connected, client saved |
| Replit Auth | server/replit_integrations/auth/ | Files added, NOT wired into existing login |
| Google Analytics | client/src/lib/analytics.ts | Files added, needs VITE_GA_MEASUREMENT_ID |

### Not Connected
- **Notion**: User dismissed — can connect later if needed
- **SendGrid**: User dismissed

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
- googleapis (Google Sheets, Drive, Docs, Calendar)
- twilio (SMS alerts)
- RapidAPI "Realty in US" (property finding)
