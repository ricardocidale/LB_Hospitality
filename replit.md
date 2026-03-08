# Hospitality Business Group - Business Simulation Portal

> **Source of truth:** `.claude/claude.md` — all detailed documentation lives there. This file is a slim pointer. If conflicts arise, `.claude/claude.md` wins.

## Overview
Business simulation portal for boutique hotel investment. Financial modeling, property management, investment analysis, and AI-powered assistant (Marcela). GAAP-compliant with independent audit/verification engine.

See `.claude/claude.md` for codebase stats, test counts, and line counts (kept current by doc harmony checks).

## Quick Commands
See `.claude/claude.md` § Quick Commands for the full list. The most common:
```bash
npm run dev            # Start dev server (port 5000)
npm run health         # tsc + tests + verify + doc harmony
npm run test:summary   # All tests, 1-line output
npm run verify:summary # GAAP verification
npm run stats          # Live codebase metrics
```

## Tech Stack
React 18, TypeScript, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts, Three.js, framer-motion, Express 5, Drizzle ORM, PostgreSQL, Zod, jsPDF, xlsx, pptxgenjs

## Key References
| Topic | Location |
|-------|----------|
| Full project instructions | `.claude/claude.md` |
| Architecture & tech stack | `.claude/claude.md` § Tech Stack |
| Financial engine rules | `.claude/rules/financial-engine.md` |
| Admin page (10 tabs + AI Agent 9 sub-tabs) | `.claude/skills/admin/SKILL.md` |
| AI assistant (Marcela) | `.claude/skills/marcela-ai/SKILL.md` |
| ElevenLabs architecture | `.claude/skills/codebase-architecture/SKILL.md` |
| Twilio telephony | `.claude/skills/twilio-telephony/` |
| Design system & themes | `.claude/skills/design-system/SKILL.md` |
| Chart library (9 components) | `.claude/skills/charts/SKILL.md` |
| Testing & proof system | `.claude/claude.md` § Testing & Proof System |
| Codebase architecture | `.claude/skills/codebase-architecture/SKILL.md` |
| Admin components & hooks | `.claude/skills/admin-components/SKILL.md` |
| Context loading protocol | `.claude/skills/context-loading/SKILL.md` |
| All invariants & rules | `.claude/claude.md` § Key Rules, `.claude/rules/` |

## Invariants (summary — see `.claude/claude.md` for full list)
- UNQUALIFIED audit opinion required at all times
- All tests must pass before delivering changes
- No LLM-computed financial values — engine only
- Ricardo Cidale is sole Admin
- Button labels: always "Save", never "Update"

## Inflation System
Three-tier cascade: `property.inflationRate → companyInflationRate → global.inflationRate`. The `DEFAULT_INFLATION_RATE` constant in `shared/constants.ts` is the single source of truth (0.03). Per-property and per-company rates are nullable; null means use the next level up in the cascade.

## Admin Sidebar Structure
- Management Company (formerly Branding): company identity, contact, location, financial info
- Asset Definition: asset logo, label, description
- Research: AI model picker, staleness intervals, curated source registry, per-type research config

## Research Skills
Property sub-skills: local-economics, insurance-costs, marketing-costs. Company: outsourcing/make-vs-buy analysis. Global: FX, capital markets, ESG. Source registry in `shared/constants.ts` (`RESEARCH_SOURCES`).

## Scripts Directory
All utility scripts live in `script/` (single canonical directory).
