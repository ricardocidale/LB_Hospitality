# Rule: Automatically Load All Rules at Session Start

## Mandate

**This is the FIRST rule that must execute. Before ANY other action — coding, planning, answering questions, reviewing, auditing, or calling the architect — the agent MUST:**

1. Run `ls .claude/rules/` to get the current list of all rule files
2. Read **every** file in `.claude/rules/` (batch reads for efficiency)
3. Read `.claude/rules/session-memory.md` for full context from previous sessions
4. Read `replit.md` for current project state

**No exceptions. No shortcuts. No "I'll read them later." This happens FIRST.**

## Why This Rule Exists

- Chat history resets between sessions — rules are the only persistent instructions
- Skipping rule loading causes: wrong architectural decisions, hardcoded values, broken patterns, missed constraints, contradicted prior decisions, wasted user time
- The user has explicitly required 100% rule compliance and called out violations

## Trigger Conditions

This rule activates on:
- **New session start** (first message after chat reset)
- **First message in any conversation** where rules haven't been loaded yet
- **After any checkpoint rollback** that may have changed rule files

## Verification

The agent must be able to answer: "How many rule files exist and what are they?" If it cannot, rules were not loaded.

## Enforcement

- If the agent takes any action before loading rules, that action is invalid
- If the architect is called without all rules in `relevant_files`, that review is invalid
- The user may ask "did you read the rules?" at any time — the agent must be able to confirm

## Load Order

1. `auto-load-rules.md` (this file — triggers the process)
2. `read-session-memory-first.md` (establishes session context)
3. `session-memory.md` (full history from all prior sessions)
4. All remaining rule files in `.claude/rules/` (batch read)
5. `replit.md` (project state summary)
