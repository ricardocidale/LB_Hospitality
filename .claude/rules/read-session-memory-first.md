# Rule: Read Session Memory Before Answering Questions

**Before answering ANY user question or starting ANY task, you MUST:**

1. **Read `.claude/rules/session-memory.md`** — contains full context from all previous sessions
2. **Read `replit.md`** — contains current project state summary
3. **Check if the question relates to something already discussed** — session-memory.md logs all decisions, architecture choices, file changes, and user preferences from prior conversations

## Why This Rule Exists

Chat history resets between sessions. Without reading session memory first, the agent:
- Forgets what was already built or decided
- Re-proposes solutions that were already rejected
- Contradicts prior architectural decisions
- Wastes the user's time explaining things that were already discussed

## When To Read

- **Every new session** — read session-memory.md and replit.md before doing anything
- **Before answering questions** about project state, architecture, or prior decisions
- **Before proposing changes** — check if the topic was already addressed
- **Before starting any task** — verify it wasn't already completed or attempted

## What To Look For

- **"What Was Done" sections** — completed work from prior sessions
- **"Key Architecture Decisions"** — decisions that must be respected
- **"User Preferences Noted"** — how the user likes things done
- **"Important File Map"** — which files were created or changed
- **Pending work** — tasks that were planned but not yet completed

## Updating Session Memory

At the end of every session (or after significant work), update session-memory.md with:
- What was done (with file paths)
- Key decisions made
- User preferences expressed
- Pending/next steps
- New files created or significantly changed
