# .claude Is the Sole Source of Truth

## Rule

All project knowledge — architecture, rules, skills, session history, and behavioral instructions — lives exclusively inside the `.claude/` directory. No other file is authoritative. If there is ever a conflict between `.claude/` and any other file, `.claude/` wins.

## Hierarchy (binding order)

| Priority | File / Directory | Role |
|----------|-----------------|------|
| 1 | `.claude/claude.md` | Master documentation — architecture, features, inventory, rules |
| 2 | `.claude/rules/*.md` | Binding rules — enforceable constraints the agent must follow |
| 3 | `.claude/skills/**` | Implementation knowledge — loaded via context-loading skill |
| 4 | `.claude/rules/session-memory.md` | Session persistence — updated at end of every session |
| 5 | `replit.md` | **Slim pointer only** — max 150 lines, summary of `.claude/claude.md`, never the authority |

## What Belongs in .claude

- Every architectural decision
- Every behavioral rule the agent must follow
- Every skill documenting how a feature or system works
- Session history and persistent preferences
- Tool schemas, commands, manuals

## What Does NOT Belong Outside .claude

| Do NOT put in `replit.md` | Put it here instead |
|--------------------------|---------------------|
| Detailed architecture descriptions | `.claude/claude.md` |
| Rules or behavioral constraints | `.claude/rules/<name>.md` |
| How-to implementation guides | `.claude/skills/<domain>/<name>.md` |
| Session decisions and preferences | `.claude/rules/session-memory.md` |

## replit.md Contract

`replit.md` is a **slim pointer** — it must:
1. Reference `.claude/claude.md` as the master document
2. Stay under 150 lines
3. Never contain unique information not present in `.claude/claude.md`
4. Never contradict `.claude/` — if it does, `.claude/` wins and `replit.md` must be updated

## .replit Contract

`.replit` is a **platform config file only** — build commands, workflows, ports, integrations. It must:
1. Contain a comment pointing to `.claude/claude.md` as the project knowledge source
2. Never contain architectural decisions, behavioral rules, or project knowledge
3. Never be used as an instruction file for agents

## Prohibited Patterns

```
# WRONG — architectural rule in replit.md not in .claude/rules/
Always use parseLocalDate() for date parsing.   ← belongs in .claude/rules/

# WRONG — root-level instruction file shadowing .claude/
/CLAUDE.md          ← must not exist; only .claude/claude.md is authoritative
/instructions.md    ← must not exist

# WRONG — replit.md growing into a full document
replit.md > 150 lines   ← violates slim-pointer contract
```

## Enforcement

Checked automatically in `tests/proof/rule-compliance.test.ts`:
- `.claude/claude.md` exists and contains required sections
- `replit.md` is under 150 lines and contains a reference to `.claude/claude.md`
- No root-level `CLAUDE.md` or `instructions.md` exists to shadow `.claude/`
- `.claude/rules/` is the only directory containing rule files

## After Any Edit

When updating project knowledge:
1. Edit `.claude/claude.md` (or the relevant `.claude/rules/` or `.claude/skills/` file) FIRST
2. Then harmonize `replit.md` to match — never the other way around
3. Verify `npm run health` passes (Doc Harmony check confirms counts are consistent)
