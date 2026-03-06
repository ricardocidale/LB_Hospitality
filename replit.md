# Hospitality Business Group - Business Simulation Portal

> **Master documentation:** `.claude/claude.md` — always the authority. This file is a slim summary. If conflicts, `.claude/claude.md` wins.

## Overview
Business simulation portal for the hospitality industry. Financial modeling, property management, investment analysis, and AI-powered assistant. GAAP-compliant with independent audit/verification engine.

**Codebase:** ~530 source files, ~79,000 lines, 2,248 tests across 99 files.

## Quick Commands
```bash
npm run dev            # Start dev server (port 5000)
npm run health         # One-shot: tsc + tests + verify
npm run test:summary   # 2,248 tests, 1-line output
npm run verify:summary # 6-phase verification, compact
npm run stats          # Codebase metrics
```

## Tech Stack
React 18, TypeScript, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts, Three.js, framer-motion, Express 5, Drizzle ORM, PostgreSQL, Zod, jsPDF, xlsx, pptxgenjs

## Documentation Structure
```
.claude/
├── claude.md              # Master doc (always loaded, source of truth)
├── rules/ (25 files)      # Enforceable constraints
├── skills/ (126 files)    # Implementation knowledge
├── tools/ (62 files)      # Tool schemas
├── manuals/               # Checker + user manuals
├── commands/              # Slash commands
└── scripts/               # SQL utilities
```

## Key References (all in .claude/)
- **Architecture:** `.claude/claude.md` and `.claude/skills/architecture/SKILL.md`
- **Financial Engine:** `.claude/rules/financial-engine.md` and `.claude/skills/finance/SKILL.md`
- **User Preferences:** `.claude/claude.md` § User Preferences
- **Admin Page:** `.claude/skills/admin/SKILL.md`
- **AI Assistant:** `.claude/skills/marcela-ai/SKILL.md`
- **Design System:** `.claude/skills/design-system/SKILL.md`
- **Rules:** `.claude/rules/` (25 files — session-startup, constants, no-hardcoded, recalculate-on-save, etc.)
- **Session Memory:** `.claude/rules/session-memory.md` (read first every session)
- **Context Loading:** `.claude/skills/context-loading/SKILL.md` (task-to-skill router)
