# .claude Is the Sole Source of Truth

## Rule

All project knowledge lives exclusively inside `.claude/`. If there is ever a conflict between `.claude/` and any other file, `.claude/` wins.

## Hierarchy

| Priority | Location | Role |
|----------|----------|------|
| 1 | `.claude/claude.md` | Master doc — always loaded |
| 2 | `.claude/rules/*.md` | Binding rules |
| 3 | `.claude/skills/**` | Reference — load on demand |
| 4 | `.claude/rules/session-memory.md` | Session persistence |
| 5 | `replit.md` | Platform bridge (≤150 lines) |

## Contracts

**`replit.md`**: Must reference `.claude/claude.md` and stay under 150 lines. Duplication of content from `.claude/` is permitted when that content helps Replit's platform operate effectively (e.g. database setup, UI framework, tech stack, key commands). The authoritative version always lives in `.claude/` — `replit.md` mirrors what the platform needs to function well.

**`.replit`**: Platform config only. Must contain pointer comment to `.claude/claude.md`. Never contains rules or architectural decisions.

## Allowed Duplication

Content may appear in both `.claude/` and `replit.md` when:
- It helps Replit provide better database tooling (schema, connection info, migration commands)
- It helps Replit understand the UI framework and dev workflow
- It describes the tech stack, project structure, or key run commands
- Removing it from `replit.md` would degrade the Replit platform experience

In all cases, `.claude/` is the authoritative source. If the two diverge, update `replit.md` to match `.claude/`.

## Prohibited

- Root-level `/CLAUDE.md` or `/instructions.md` (shadows `.claude/`)
- Architectural decisions or rules that exist *only* in `replit.md` and not in `.claude/`
- `replit.md` growing beyond 150 lines

## After Any Edit

1. Edit `.claude/` first
2. Harmonize `replit.md` to match
3. Run `npm run health` — Doc Harmony must pass

## Enforcement

`tests/proof/rule-compliance.test.ts` checks: `.claude/claude.md` exists, `replit.md` ≤150 lines with reference, no root-level shadow files, no rule files outside `.claude/rules/`.
