---
name: rebecca-chatbot
description: Gemini-powered portfolio analytics chatbot (Rebecca). Covers context caching, feature gate, system prompt, rate limiting, and Gemini content format. Load when working on the chat endpoint, Rebecca UI, or chatbot configuration.
---

# Rebecca Chatbot

## Purpose

Documents the AI chatbot ("Rebecca") that answers questions about the portfolio's properties and financial metrics. Uses Gemini 2.5 Flash with injected portfolio context.

## Key Files

| File | Purpose |
|------|---------|
| `server/routes/chat.ts` | Chat endpoint — context building, Gemini call, response |
| `server/ai/clients.ts` | Gemini client singleton (`getGeminiClient()`) |
| `server/ai/buildPropertyContext.ts` | Builds property summary text for context injection |
| `server/middleware/rate-limit.ts` | `aiRateLimit()` middleware |

## Architecture

```
Client POST /api/chat { message, history }
  ↓
requireAuth → aiRateLimit(20) → Zod validation
  ↓
Feature gate: global.rebeccaEnabled === true?
  ↓
Build context:
  ├── buildPropertyContext(properties) → property summaries
  ├── Company name, inflation, projection years
  ├── Management fees (base + incentive)
  └── SAFE funding details (tranches, valuation cap, discount rate, interest)
  ↓
Assemble Gemini contents:
  [system prompt + context, acknowledgement, ...chat history, user message]
  ↓
gemini.models.generateContent({ model: "gemini-2.5-flash", contents, config })
  ↓
Return { response: text }
```

## Feature Gate

Rebecca is disabled by default. Enabled via `global_assumptions.rebeccaEnabled` (boolean). When disabled, returns `403 "Chat assistant is not enabled"`.

## Context Caching

Property context is cached in-memory with a **5-minute TTL**:

```typescript
let cachedPropertyContext: { text: string; timestamp: number; count: number } | null;
const CONTEXT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

Cache invalidates when:
- TTL expires (5 minutes)
- Property count changes (`cachedPropertyContext.count !== properties.length`)

## System Prompt

Configurable via `global_assumptions.rebeccaSystemPrompt`. Falls back to `DEFAULT_SYSTEM_PROMPT` which instructs Rebecca to:
- Be a property investment analyst for boutique hotel management
- Use only provided portfolio data (no hallucination)
- Format dollar amounts with commas
- Use bullet points and tables for comparisons

## Context Injection

The full context block includes:
1. **Portfolio data**: All property summaries from `buildPropertyContext()`
2. **Company info**: Name, property count, projection years, inflation rate
3. **Fees**: Base and incentive management fee percentages
4. **Funding**: Source label, tranche amounts/dates, valuation cap, discount rate, interest rate/frequency

## Constraints

| Constraint | Value |
|-----------|-------|
| Max message length | 2,000 characters |
| Max history length | 20 messages |
| Rate limit | 20 requests per window |
| Max output tokens | 1,024 |
| Model | `gemini-2.5-flash` |

## Input Validation

Request body validated with Zod:

```typescript
chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(2000),
  })).max(20).optional().default([]),
});
```

## Gemini Content Format

Messages are formatted as Gemini multi-turn contents:
1. System prompt + context as initial `user` message
2. Acknowledgement as `model` response
3. Chat history mapped: `"user"` → `"user"`, `"assistant"` → `"model"`
4. Current user message as final `user` turn

## Admin Configuration

Via Admin → AI Agents tab:
- `rebeccaEnabled`: Toggle chatbot on/off
- `rebeccaSystemPrompt`: Custom system prompt

## Related Skills

- `.claude/skills/marcela-ai/SKILL.md` — Voice AI assistant (different from Rebecca text chat)
- `.claude/skills/admin/SKILL.md` — Admin AI Agents configuration
