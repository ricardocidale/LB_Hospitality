# Architect Must Read All Rules and Skills

## Rule

Every time the architect agent is invoked — for planning, evaluation, debugging, or code review — ALL rule files in `.claude/rules/` MUST be included in `relevant_files`. This is mandatory and non-negotiable. No exceptions.

## Mandatory `relevant_files` — Every Architect Call

The following files must ALWAYS be passed to the architect in the `relevant_files` array:

### All Rules (always include every file in `.claude/rules/`)
- `.claude/rules/no-hardcoded-assumptions.md`
- `.claude/rules/no-hardcoded-admin-config.md`
- `.claude/rules/recalculate-on-save.md`
- `.claude/rules/audit-checks-rules.md`
- `.claude/rules/architect-reads-rules-and-skills.md`
- `.claude/rules/graphics-rich-design.md`
- `.claude/rules/api-routes.md`
- `.claude/rules/financial-engine.md`
- `.claude/rules/architecture.md`
- `.claude/rules/audit-persona.md`
- `.claude/rules/constants-and-config.md`
- `.claude/rules/database-seeding.md`
- `.claude/rules/release-audit-checklist.md`
- `.claude/rules/verification-system.md`

### Always include
- `replit.md` — project-level preferences and architecture

### When rules are added or removed
If new rule files are added to `.claude/rules/`, they must be included in future architect calls. Before calling the architect, run `ls .claude/rules/` to get the current list.

## Additionally Include (based on task context)

- **Relevant skill files** from `.claude/skills/` based on the task context (use `.claude/skills/context-loading/` to identify which skills apply)
- **Source files** being modified or reviewed

## Why

The architect cannot give accurate guidance if it doesn't know the project's rules. Without reading the rules:
- It might recommend hardcoding values that must come from the database
- It might approve partial query invalidation that violates the recalculate-on-save rule
- It might miss branding resolution order violations
- It might approve non-graphics-rich implementations
- It might overlook financial engine constraints
- Its reviews would be incomplete and potentially harmful

## Enforcement

If the agent calls the architect without including all rule files, the review is considered invalid and must be redone with the complete rule set.
