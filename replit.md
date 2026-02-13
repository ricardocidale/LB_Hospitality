# Hospitality Business Group - Business Simulation Portal

**All project documentation lives in `.claude/claude.md`** — the single source of truth for architecture, skills, rules, manuals, tools, testing, integrations, and project state. Load it for any detailed work.

## MANDATORY: Rules Loading

**Before ANY work — coding, planning, reviewing, auditing, or architect calls — you MUST:**

1. Run `ls .claude/rules/` to get the current list of all rule files
2. Read every rule file in `.claude/rules/` before making changes
3. When calling the architect, include ALL `.claude/rules/*.md` files in `relevant_files` plus `replit.md`
4. When running tests or audits, verify compliance with all rules
5. When creating new skills or functions, check rules for constraints

**This is non-negotiable. Skipping rule loading invalidates any review or implementation.**

## Key Directories
- `.claude/skills/` — 80+ skill files (finance, UI, testing, exports, proof system, architecture)
- `.claude/skills/context-loading/` — Start here: maps task types to minimum required skills
- `.claude/rules/` — 15 rule files (audit doctrine, constants, DB seeding, API routes, graphics, hardcoding, skill organization, etc.)
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

## Branding Architecture
- **Branding flows: User → User Group → Default.** No per-user branding overrides.
- Design themes are standalone entities (not user-owned). Each has `isDefault` flag.
- User Groups define company branding: `companyName`, `logoId`, `themeId`, `assetDescriptionId`.
- Users inherit branding from their assigned User Group. Admin manages branding at the group level.

## Top Rules
- **Calculations and correct reports are always the highest priority.** 1330-test proof system must always pass.
- **Every page must be graphics-rich.** Use charts, animations, and visual elements on every page.
- **Never hardcode financial assumptions or admin config.** All values from database or named constants.
- **Every save must trigger full financial recalculation.** No partial query invalidation.
- **All tests and audits must verify rule compliance.** Check all `.claude/rules/` on every audit.
- Company name is "Hospitality Business Group". All UI must reference a theme. All skills stored under `.claude/`.
- For anything else, see `.claude/claude.md`.
