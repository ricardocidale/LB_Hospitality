# Hospitality Business Group - Business Simulation Portal

**All project documentation lives in `.claude/claude.md`** — the single source of truth for architecture, skills, rules, manuals, tools, testing, integrations, and project state. Load it for any detailed work.

## Key Directories
- `.claude/skills/` — 80+ skill files (finance, UI, testing, exports, proof system, architecture)
- `.claude/skills/context-loading/` — Start here: maps task types to minimum required skills
- `.claude/rules/` — 8 rule files (audit doctrine, constants, DB seeding, API routes, etc.)
- `.claude/manuals/` — Checker manual and user manual
- `.claude/tools/` — Tool schemas for analysis, financing, returns, validation, UI
- `.claude/commands/` — 8 slash commands (verify, seed, scenarios, themes, etc.)

## Quick Commands
```bash
npm run dev            # Start dev server
npm run health         # One-shot: tsc + tests + verify (~4 lines output)
npm run test:summary   # Run all 477 tests, 1-line output on pass
npm run verify:summary # 4-phase verification, compact output
npm test               # Run all 477 tests (full output)
npm run verify         # Full 4-phase financial verification (verbose)
npm run db:push        # Push schema changes
```

## Research Badge Defaults (Database-Backed, Location-Aware)
Research values are now stored in the `research_values` JSONB column on each property, generated location-aware at creation time via `server/researchSeeds.ts` with 25+ regional profiles. Sources:
- **CBRE Trends 2024-2025**, **STR/CoStar**, **HVS**, **Highland Group Boutique Hotel Report 2025**
- Location detection: Pattern matching on location/streetAddress/city/stateProvince/market fields (e.g., "rhinebeck|hudson valley" → ny_metro profile with ADR $280-$450)
- Each entry has `{ display, mid, source }` where source = 'seed' (location defaults), 'ai' (AI research override), or 'none' (hidden)
- Generic fallback: ADR $193, Occupancy 69%, Cap Rate 8.5% (national averages)
- Operating costs aligned to USALI department structure and calculation bases (Room Revenue, Total Revenue, Property Value)
- Management service fees sum to ~4% within HVS-cited 2-4% industry range
- Incentive fee 8-12% of GOP per HVS standard
- When AI research runs, it overrides seeded defaults for that property with source='ai'
- Frontend (PropertyEdit.tsx) reads from property.researchValues, falling back to generic defaults if absent

## Top Rules
- **Calculations and correct reports are always the highest priority.** 477-test proof system must always pass.
- Company name is "Hospitality Business Group". All UI must reference a theme. All skills stored under `.claude/`.
- For anything else, see `.claude/claude.md`.
