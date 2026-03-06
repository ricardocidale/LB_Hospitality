# Documentation & Source of Truth

## Hierarchy

1. **`.claude/claude.md`** — Master documentation (architecture, features, rules, skills, project state)
2. **`.claude/rules/`** — Binding rules enforced from this directory
3. **`.claude/skills/`** — Implementation knowledge, loaded via context-loading skill
4. **`.claude/rules/session-memory.md`** — Session persistence, updated every session
5. **`replit.md`** — Slim pointer summarizing `.claude/claude.md`. Never the authority — always derived from `.claude`. If conflict, `.claude` wins.

## After ANY Codebase Edit

1. Update `session-memory.md` — log what was done, key decisions, new/changed files
2. Update `.claude/claude.md` if architecture, features, or inventory changed
3. Harmonize `replit.md` to match (counts, rules, commands, structure)
4. Update relevant `.claude/skills/` if behavior or file locations changed

## After Bug Fixes (additionally)

5. Run `npm run test:summary` — all tests must pass
6. Run `npm run verify:summary` — must show UNQUALIFIED
7. Update `mandatory-financial-tests.md` if a financial bug was fixed
8. Verify documentation harmony — counts must match actual project state

## Automated Enforcement

The **Doc Harmony** check runs as part of `npm run health`. It compares actual codebase metrics against documented values in `.claude/claude.md` and `replit.md`:

- **Test count**: Every mention of `N tests` in both files must match `vitest run` output
- **Rules count**: Every mention of `Rules (N)` must match `ls .claude/rules/*.md | wc -l`

If any documented value is stale, Health Check reports `FAIL — Doc Harmony` with the specific mismatch. Implementation: `script/health.ts` → `checkDocHarmony()`.

## What "Harmonize" Means

`replit.md` summarizes and points to `.claude/claude.md`. When `.claude` changes, update `replit.md` key sections to match. Keep it concise — never duplicate full detail.

## Scope

Applies to: new features, refactors, schema/API changes, test count changes, architecture decisions, bug fixes. Does NOT apply to: typo fixes, comment-only changes, whitespace changes.
