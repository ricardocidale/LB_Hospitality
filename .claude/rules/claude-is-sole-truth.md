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
| 5 | `replit.md` | Slim pointer only (≤150 lines) |

## Contracts

**`replit.md`**: Must reference `.claude/claude.md`, stay under 150 lines, contain no unique information not in `.claude/`.

**`.replit`**: Platform config only. Must contain pointer comment to `.claude/claude.md`. Never contains rules or architectural decisions.

## Prohibited

- Root-level `/CLAUDE.md` or `/instructions.md` (shadows `.claude/`)
- Rules or architecture in `replit.md`
- `replit.md` growing beyond 150 lines

## After Any Edit

1. Edit `.claude/` first
2. Harmonize `replit.md` to match
3. Run `npm run health` — Doc Harmony must pass

## Enforcement

`tests/proof/rule-compliance.test.ts` checks: `.claude/claude.md` exists, `replit.md` ≤150 lines with reference, no root-level shadow files, no rule files outside `.claude/rules/`.
