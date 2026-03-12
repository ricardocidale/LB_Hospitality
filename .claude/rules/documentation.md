# Documentation & Source of Truth

## Rule

All project knowledge lives exclusively inside `.claude/`. If there is ever a conflict between `.claude/` and any other file, `.claude/` wins.

## Hierarchy

| Priority | Location | Role |
|----------|----------|------|
| 1 | `.claude/claude.md` | Master doc — always loaded |
| 2 | `.claude/rules/*.md` | Binding rules |
| 3 | `.claude/skills/**` | Reference — load on demand |
| 4 | `.claude/session-memory.md` | Session persistence |
| 5 | `replit.md` | Platform bridge (≤150 lines) |

## Contracts

**`replit.md`**: Must reference `.claude/claude.md` and stay under 150 lines. Duplication of content from `.claude/` is permitted when that content helps Replit's platform operate effectively (e.g. database setup, UI framework, tech stack, key commands). The authoritative version always lives in `.claude/` — `replit.md` mirrors what the platform needs to function well.

**`.replit`**: Platform config only. Must contain pointer comment to `.claude/claude.md`. Never contains rules or architectural decisions.

## Allowed Duplication in replit.md

Content may appear in both `.claude/` and `replit.md` when:
- It helps Replit provide better database tooling (schema, connection info, migration commands)
- It helps Replit understand the UI framework and dev workflow
- It describes the tech stack, project structure, or key run commands
- Removing it from `replit.md` would degrade the Replit platform experience

In all cases, `.claude/` is the authoritative source. If the two diverge, update `replit.md` to match `.claude/`.

## After ANY Codebase Edit

1. Update `.claude/session-memory.md` — log what was done, key decisions, new/changed files
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

## Prohibited

- Root-level `/CLAUDE.md` or `/instructions.md` (shadows `.claude/`)
- Architectural decisions or rules that exist *only* in `replit.md` and not in `.claude/`
- `replit.md` growing beyond 150 lines

## Scope

Applies to: new features, refactors, schema/API changes, test count changes, architecture decisions, bug fixes. Does NOT apply to: typo fixes, comment-only changes, whitespace changes.

## Enforcement

`tests/proof/rule-compliance.test.ts` checks: `.claude/claude.md` exists, `replit.md` ≤150 lines with reference, no root-level shadow files, no rule files outside `.claude/rules/`.
