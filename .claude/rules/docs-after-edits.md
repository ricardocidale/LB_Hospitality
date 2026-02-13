# Rule: Update Documentation After Every Codebase Edit

**After ANY codebase changes — code, config, schema, tests, or infrastructure — you MUST:**

1. **Update `.claude/rules/session-memory.md`** — Log what was done, key decisions, and new/changed files
2. **Update `.claude/claude.md`** if the change affects architecture, features, integrations, pages, rules, or skill inventory
3. **Harmonize `replit.md`** to match `.claude/claude.md` — `replit.md` is the slim pointer that must stay in sync
4. **Update relevant skill files** in `.claude/skills/` if the change affects a documented skill's API, behavior, or file locations

## What "Harmonize" Means

`replit.md` is a compact summary that references `.claude/claude.md`. When claude.md changes:
- Ensure `replit.md` key sections (Top Rules, Key Directories, Quick Commands, Admin Page Structure, Calculation Transparency, Branding, AI Image Generation) reflect any new additions or removals
- Keep `replit.md` concise — it should not duplicate full detail from claude.md, just summarize and point to it
- Update counts (skill files, rule files, test counts) if they change

## Scope

This rule applies to:
- New features or components
- Refactors that move, rename, or restructure files
- New or removed skills, rules, or tools
- Schema or API changes
- Test count changes
- Architecture decisions

This rule does NOT require updates for:
- Trivial typo fixes within a single file
- Comment-only changes
- Whitespace or formatting-only changes

## Why

Session memory resets between conversations. `.claude` and `replit.md` are the only persistent project context. Stale docs lead to incorrect assumptions, wasted tokens, and broken implementations in future sessions.
