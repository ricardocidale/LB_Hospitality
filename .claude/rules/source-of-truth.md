# Rule: `.claude` Is the Single Source of Truth

## Hierarchy

1. **`.claude/claude.md`** — Master documentation. All architecture, features, rules, skills, and project state live here.
2. **`.claude/rules/`** — Binding rules. All rules are enforced from files in this directory.
3. **`.claude/skills/`** — Detailed implementation knowledge. Load via context-loading skill.
4. **`.claude/rules/session-memory.md`** — Session persistence. Updated at end of every session.
5. **`replit.md`** — Slim pointer. A compact summary that references `.claude/claude.md`. It is NEVER the authority — it is always derived from `.claude`.

## What "Harmonize" Means

`replit.md` must always reflect the current state of `.claude/claude.md`. When `.claude` changes:
- Update `replit.md` key sections (Top Rules, Key Directories, Quick Commands, counts) to match
- Keep `replit.md` concise — it summarizes and points to `.claude/claude.md`, never duplicates full detail
- If there is ever a conflict between `replit.md` and `.claude`, **`.claude` wins**

## End-of-Bug-Fix Checklist

**After EVERY bug fix, feature addition, or code change, you MUST complete ALL of these before marking the task done:**

1. **Run tests** — `npm run test:summary` must show all tests passing
2. **Run verification** — `npm run verify:summary` must show UNQUALIFIED
3. **Update `.claude/rules/session-memory.md`** — Log the bug, root cause, fix, and affected files
4. **Update `.claude/claude.md`** if architecture, features, or test counts changed
5. **Harmonize `replit.md`** — Ensure it matches `.claude/claude.md` (counts, rules, commands)
6. **Update relevant `.claude/skills/`** if the change affects documented skill behavior
7. **Update `.claude/rules/mandatory-financial-tests.md`** if a financial bug was fixed (add regression test entry)

## Enforcement

- The architect review step MUST verify documentation harmony as part of its evaluation
- CI/health-check workflows validate test counts match documented counts
- Any discrepancy between `replit.md` and `.claude/claude.md` is a documentation bug that must be fixed immediately

## Why

Session memory resets between conversations. `.claude` is the ONLY persistent project context that survives across sessions. `replit.md` is loaded automatically by the agent at session start, so it must accurately reflect `.claude`. Stale or conflicting docs lead to incorrect assumptions, wasted tokens, and broken implementations.
