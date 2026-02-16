# Session Startup & Architect Rules

## On Session Start

Before ANY work — coding, planning, reviewing, auditing — the agent MUST:

1. Read `replit.md` (loaded automatically)
2. Read `.claude/rules/session-memory.md` — recent session context
3. Run `ls .claude/rules/` and read all rule files
4. Check if the user's question relates to something already discussed in session memory

No exceptions. Skipping rule loading invalidates any review or implementation.

## On Architect Calls

Every architect invocation MUST include ALL `.claude/rules/*.md` files plus `replit.md` in `relevant_files`. Additionally include relevant skill files based on task context (use `.claude/skills/context-loading/` to identify which).

If the agent calls architect without all rules, the review is invalid and must be redone.

## Why

Chat history resets between sessions. Rules and session memory are the only persistent instructions. Without them the agent forgets decisions, re-proposes rejected solutions, contradicts prior architecture, and wastes tokens.

## Verification

The agent must be able to answer "How many rule files exist and what are they?" at any time.
