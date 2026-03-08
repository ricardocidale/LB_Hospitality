# Hospitality Business Group - Business Simulation Portal

> **Source of truth:** `.claude/claude.md` — all detailed documentation lives there. This file is a slim pointer. If conflicts arise, `.claude/claude.md` wins.

## Overview
Business simulation portal for boutique hotel investment. Financial modeling, property management, investment analysis, and AI-powered assistant (Marcela). GAAP-compliant with independent audit/verification engine.

**Codebase:** ~669 source files, ~101,569 lines, 2,464 tests across 116 files.

## Quick Commands
```bash
npm run dev            # Start dev server (port 5000)
npm run health         # One-shot: tsc + tests + verify + doc harmony (no redundant re-runs)
npm run test:summary   # 2,464 tests, reports skipped separately
npm run verify:summary # 8-phase verification, single vitest invocation (~5s)
npm test               # Full test output
npm run verify         # Full verification (verbose, 9 phases including artifacts)
npm run db:push        # Push schema changes
npm run lint:summary   # tsc --noEmit, 1-line output
npm run diff:summary   # Compact git status + diff stat
npm run test:file -- <path>  # Run single test file
npm run stats          # Codebase metrics
npm run audit:quick    # Quick code quality scan
npm run exports:check  # Find unused exports
```

## Tech Stack
React 18, TypeScript, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts, Three.js (raw — no R3F except ElevenLabs orb), framer-motion, Express 5, Drizzle ORM, PostgreSQL, Zod, jsPDF, xlsx, pptxgenjs

## Design System (ElevenLabs Standard)
- shadcn primitives + `cva` for variants. 100% CSS variable tokens — zero hardcoded grays/colors.
- Custom duotone brand icons in `client/src/components/icons/brand-icons.tsx` (~35 icons).
- Theme engine: `client/src/lib/theme/` (reusable module). 5 preset themes.

## Key References
| Topic | Location |
|-------|----------|
| Architecture & tech stack | `.claude/claude.md` § Tech Stack |
| Financial engine rules | `.claude/rules/financial-engine.md` |
| Admin page (10 tabs + AI Agent 9 sub-tabs) | `.claude/skills/admin/SKILL.md` |
| AI assistant (Marcela) | `.claude/claude.md` § Marcela AI, `.claude/skills/marcela-ai/SKILL.md` |
| ElevenLabs architecture | `.claude/skills/codebase-architecture/SKILL.md` § ElevenLabs / AI Agent Architecture |
| ElevenLabs SDK reference | `.claude/skills/elevenlabs-widget/` |
| Twilio telephony | `.claude/skills/twilio-telephony/` |
| Design system & themes | `client/src/lib/theme/`, `.claude/skills/design-system/SKILL.md` |
| Chart library (9 components) | `client/src/lib/charts/`, `.claude/skills/charts/SKILL.md` |
| UI component catalog (80+) | `.claude/skills/codebase-architecture/SKILL.md` § UI Component Catalog |
| UI block patterns | `.claude/skills/ui-blocks/SKILL.md` |
| Export system | `client/src/components/ExportDialog.tsx`, `.claude/skills/exports/SKILL.md` |
| Testing & proof system | `.claude/claude.md` § Testing & Proof System |
| Codebase architecture | `.claude/skills/codebase-architecture/SKILL.md` |
| Admin components & hooks | `.claude/skills/admin-components/SKILL.md` |

## Reusable Modules (Portable)
| Module | Path | Import | Components |
|--------|------|--------|------------|
| Theme | `lib/theme/` | `@/lib/theme` | applyThemeColors, presets, color-utils |
| Charts | `lib/charts/` | `@/lib/charts` | BarChartCard, LineChartDotsColors, LineChartMulti, DonutChart, DonutChartInteractive, RadarChartDots, RadialChart, RadialGauge, RadialStacked |

## Invariants
- UNQUALIFIED audit opinion required at all times
- All tests must pass before delivering changes
- No LLM-computed financial values — engine only
- Button labels: always "Save", never "Update"
- USALI waterfall: GOP → AGOP → NOI → ANOI
- Button hover: `hover:scale-[1.03] active:scale-[0.97]`
- All properties: `userId = NULL` (shared portfolio)
- Ricardo Cidale is sole Admin
- AI agent name configurable via DB (`aiAgentName`), default "Marcela"
- `?` tooltip explainers on all financial line items — internal transparency feature (see admin-components skill)
- Occupancy ramp: `Math.max(1, rampMonths)` safeguard against division-by-zero

## Session Patterns
- `generatePropertyProForma` always returns 10 years (120 months) — slice to `projectionYears * 12`
- `stripAutoFields` on all `.set()` calls
- GAAP test rule names must match `gaapComplianceChecker` output
- Norfolk AI logos: `norfolk-ai-blue.png` (login), `norfolk-ai-wireframe.png` (thin), `norfolk-ai-yellow.png` (alt), `norfolk-ai-white.png` (white icon)

## Scripts Directory
All utility scripts live in `script/` (single canonical directory).

## Future Improvements (Noted, Not Blocking)
- `shared/schema.ts` (1,172 lines) — candidate for domain split
- Feature-first client folder reorg — not yet implemented
