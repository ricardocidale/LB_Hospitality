# Architect Must Read All Rules and Skills

## Rule

Every time the architect agent is invoked — for planning, evaluation, debugging, or code review — it must first read all rule files in `.claude/rules/` and all relevant skill files in `.claude/skills/`. This ensures the architect's analysis and recommendations are grounded in the project's actual constraints, not generic assumptions.

## What to Include

When calling the architect, always include in `relevant_files`:

1. **All rule files** in `.claude/rules/`:
   - `no-hardcoded-assumptions.md`
   - `no-hardcoded-admin-config.md`
   - `recalculate-on-save.md`
   - `audit-checks-rules.md`
   - `architect-reads-rules-and-skills.md`
   - Any other rule files added later

2. **Relevant skill files** from `.claude/skills/` based on the task context (use `.claude/skills/context-loading/` to identify which skills apply)

3. **`replit.md`** for project-level preferences and architecture

## Why

The architect cannot give accurate guidance if it doesn't know the project's rules. Without reading the rules:
- It might recommend hardcoding values that must come from the database
- It might approve partial query invalidation that violates the recalculate-on-save rule
- It might miss branding resolution order violations
- Its reviews would be incomplete

## How to Comply

Before every `architect()` call, list all `.claude/rules/*.md` files in the `relevant_files` array. For large tasks, also include the skill files identified by the context-loading skill.
