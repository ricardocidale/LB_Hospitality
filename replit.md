# Hospitality Business Group - Business Simulation Portal

> **Source of truth:** `.claude/claude.md` — all detailed documentation lives there. This file is a slim pointer. If conflicts arise, `.claude/claude.md` wins.

## Overview
Business simulation portal for boutique hotel investment. Financial modeling, property management, investment analysis, and AI-powered assistant (Marcela). GAAP-compliant with independent audit/verification engine.

**Codebase:** ~545 source files, ~79,500 lines, 2,306 tests across 101 files.

## Quick Commands
```bash
npm run dev            # Start dev server (port 5000)
npm run health         # One-shot: tsc + tests + verify
npm run test:summary   # 2,268 tests, 1-line output
npm run verify:summary # 7-phase verification, compact
npm run stats          # Codebase metrics
npm run audit:quick    # Quick code quality scan
npm run exports:check  # Find unused exports
```

## Tech Stack
React 18, TypeScript, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts, Three.js, framer-motion, Express 5, Drizzle ORM, PostgreSQL, Zod, jsPDF, xlsx, pptxgenjs

## Documentation (all in .claude/)
```
.claude/
├── claude.md              # Master doc (source of truth)
├── rules/ (25 files)      # Enforceable constraints
├── skills/ (126 files)    # Implementation knowledge
├── tools/ (61 files)      # Tool schemas
├── manuals/               # Checker + user manuals
├── commands/              # Slash commands
└── scripts/               # SQL utilities
```

## Key References
| Topic | Location |
|-------|----------|
| Architecture & tech stack | `.claude/claude.md` § Tech Stack, `.claude/skills/architecture/SKILL.md` |
| User preferences | `.claude/claude.md` § User Preferences |
| Financial engine | `.claude/rules/financial-engine.md`, `.claude/skills/finance/SKILL.md` |
| Admin page (11 tabs) | `.claude/skills/admin/SKILL.md`, `.claude/skills/admin/ai-agent-admin.md` |
| AI assistant (Marcela) | `.claude/claude.md` § Marcela AI, `.claude/skills/marcela-ai/SKILL.md` |
| Design system & themes | `.claude/skills/design-system/SKILL.md`, `.claude/skills/ui/theme-engine.md` |
| Testing & proof system | `.claude/claude.md` § Testing & Proof System, `.claude/skills/proof-system/SKILL.md` |
| Rules (25 files) | `.claude/rules/` — session-startup, constants, no-hardcoded, recalculate-on-save, etc. |
| Session memory | `.claude/rules/session-memory.md` (read first every session) |
| Context loading | `.claude/skills/context-loading/SKILL.md` (task-to-skill router) |
| Research system | `.claude/skills/research/SKILL.md` |
| Exports | `.claude/skills/exports/SKILL.md` |

## Invariants
- UNQUALIFIED audit opinion required at all times
- All tests must pass before delivering changes
- No LLM-computed financial values — engine only
- Button labels: always "Save", never "Update"
- All properties: `userId = NULL` (shared portfolio)
- Ricardo Cidale is sole Admin
- AI agent name configurable via DB (`aiAgentName`), default "Marcela"
- All ElevenLabs config via API — no manual dashboard usage

## Future Improvements (Noted, Not Blocking)
- `shared/schema.ts` (1,172 lines) — candidate for domain split (auth, portfolio, research, branding, operations)
- `client/src/components/ui/sidebar.tsx` (736 lines) — shadcn/ui primitive, do not modify
