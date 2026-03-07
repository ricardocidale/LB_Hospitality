# Hospitality Business Group - Business Simulation Portal

> **Source of truth:** `.claude/claude.md` — all detailed documentation lives there. This file is a slim pointer. If conflicts arise, `.claude/claude.md` wins.

## Overview
Business simulation portal for boutique hotel investment. Financial modeling, property management, investment analysis, and AI-powered assistant (Marcela). GAAP-compliant with independent audit/verification engine.

**Codebase:** ~568 source files, ~82,900 lines, 2,431 tests across 113 files.

## Quick Commands
```bash
npm run dev            # Start dev server (port 5000)
npm run health         # One-shot: tsc + tests + verify
npm run test:summary   # 2,431 tests, 1-line output
npm run verify:summary # 7-phase verification, compact
npm test               # Full test output
npm run verify         # Full verification (verbose)
npm run db:push        # Push schema changes
npm run lint:summary   # tsc --noEmit, 1-line output
npm run diff:summary   # Compact git status + diff stat
npm run test:file -- <path>  # Run single test file
npm run stats          # Codebase metrics
npm run audit:quick    # Quick code quality scan
npm run exports:check  # Find unused exports
```

## Tech Stack
React 18, TypeScript, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts, Three.js, framer-motion, Express 5, Drizzle ORM, PostgreSQL, Zod, jsPDF, xlsx, pptxgenjs

## Design System (ElevenLabs Standard)
- **UI standard**: ElevenLabs component patterns — shadcn primitives (`Button`, `Card`, `DropdownMenu`, `Separator`) + `cva` for variants
- **Colors**: Always use CSS variables (`text-foreground`, `text-muted-foreground`, `bg-card`, `bg-muted`, `border`) — no hardcoded hex colors in components
- **Buttons**: shadcn `Button` from `@/components/ui/button` — GlassButton is deleted
- **Cards**: shadcn `Card` or `bg-card border shadow-sm` tokens; `SectionCard`/`ContentPanel` are thin wrappers
- **Export menus**: `ExportToolbar` uses shadcn `DropdownMenu` internally
- **Voice/AI components**: Canonical versions in `client/src/features/ai-agent/components/` (17 components: conversation, orb, waveform, message, audio-player, etc.)
- **Theme**: Liquid ice palette defined via CSS variables in `client/src/index.css` — components consume via Tailwind tokens
- **Exceptions**: Chart data colors (Recharts fill/stroke) may use hardcoded hex; financial-table grand total row uses `bg-[#2d4a5e]`

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
| Admin page (10 tabs) | `.claude/skills/admin/SKILL.md`, `.claude/skills/admin/ai-agent-admin.md` |
| Prod migration (sync) | `server/migrations/prod-sync-002.ts` — canonical data enforcement on every boot |
| AI assistant (Marcela) | `.claude/claude.md` § Marcela AI, `.claude/skills/marcela-ai/SKILL.md` |
| Design system & themes | `.claude/skills/design-system/SKILL.md`, `.claude/skills/ui/theme-engine.md` |
| Testing & proof system | `.claude/claude.md` § Testing & Proof System, `.claude/skills/proof-system/SKILL.md` |
| Rules (25 files) | `.claude/rules/` — session-startup, constants, no-hardcoded, recalculate-on-save, etc. |
| Session memory | `.claude/rules/session-memory.md` (read first every session) |
| Context loading | `.claude/skills/context-loading/SKILL.md` (task-to-skill router) |
| Research system | `.claude/skills/research/SKILL.md` |
| Exports | `.claude/skills/exports/SKILL.md` |
| Voice UI blocks (5) | `.claude/skills/marcela-ai/SKILL.md` — VoiceChatOrb/Full/Bar, Speaker, Transcriber at `/voice` |

## Invariants
- UNQUALIFIED audit opinion required at all times
- All tests must pass before delivering changes
- No LLM-computed financial values — engine only
- Button labels: always "Save", never "Update"
- All properties: `userId = NULL` (shared portfolio)
- Ricardo Cidale is sole Admin
- AI agent name configurable via DB (`aiAgentName`), default "Marcela"
- All ElevenLabs config via API — no manual dashboard usage

## Scripts Directory
All utility scripts live in `script/` (single canonical directory). Includes health checks, test runners, verification, seed data, branding tools, and admin utilities.

## Future Improvements (Noted, Not Blocking)
- `shared/schema.ts` (1,172 lines) — candidate for domain split (auth, portfolio, research, branding, operations)
- `client/src/components/ui/sidebar.tsx` (736 lines) — shadcn/ui primitive, do not modify
- Feature-first client folder reorg (`features/admin`, `features/property`, etc.) — not yet implemented
