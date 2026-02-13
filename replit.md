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
npm run test:summary   # Run all 1330 tests, 1-line output on pass
npm run verify:summary # 4-phase verification, compact output
npm test               # Run all 1330 tests (full output)
npm run verify         # Full 4-phase financial verification (verbose)
npm run db:push        # Push schema changes
npm run lint:summary   # tsc --noEmit, 1-line output
npm run diff:summary   # Compact git diff stat
npm run test:file -- <path>  # Single test file, summary output
npm run stats          # Codebase metrics (~12 lines)
npm run audit:quick    # Quick code quality scan
npm run exports:check  # Find unused exports
```

## Top Rules
- **Calculations and correct reports are always the highest priority.** 1330-test proof system must always pass.
- Company name is "Hospitality Business Group". All UI must reference a theme. All skills stored under `.claude/`.
- For anything else, see `.claude/claude.md`.
