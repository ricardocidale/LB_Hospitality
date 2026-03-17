# Cost Monitor CLI — Implementation Plan

## Context

The app uses 12+ external API services (Anthropic, OpenAI, Gemini, ElevenLabs, Twilio, Resend, Replicate, Document AI, Google Maps, FRED, etc.) but has **zero cost tracking**. No token counts logged, no usage database, no billing dashboard. The user wants a CLI they can leave running to monitor costs in real-time.

## Architecture: Two Components

### 1. Cost Logger Middleware (`server/middleware/cost-logger.ts`)
Intercepts AI API responses, extracts token/usage data, appends to a JSONL log file.

### 2. Cost Monitor CLI (`script/cost-monitor.ts`)
Standalone terminal dashboard that tails the JSONL log and shows live cost estimates.

---

## Component 1: Cost Logger Middleware

**File:** `server/middleware/cost-logger.ts`

**What it does:**
- Exports a `logApiCost(entry)` function called from AI route handlers
- Appends one JSON line per API call to `logs/api-costs.jsonl`
- Each entry: `{ timestamp, service, model, operation, inputTokens, outputTokens, estimatedCost, durationMs, userId, route }`

**Entry schema:**
```typescript
interface CostEntry {
  timestamp: string;        // ISO 8601
  service: "anthropic" | "openai" | "gemini" | "elevenlabs" | "replicate" | "resend" | "twilio" | "document-ai" | "google-maps" | "perplexity";
  model?: string;           // e.g. "claude-sonnet-4-20250514", "gemini-2.5-flash"
  operation: string;        // e.g. "chat", "research", "image-gen", "voice", "email", "sms"
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd: number; // computed from pricing table
  durationMs?: number;
  userId?: number;
  route: string;            // e.g. "/api/chat", "/api/research/generate"
}
```

**Pricing table (hardcoded, update periodically):**
```typescript
const PRICING: Record<string, { input: number; output: number }> = {
  // Per million tokens
  "claude-sonnet-4-20250514":    { input: 3.00, output: 15.00 },
  "claude-haiku-4-5-20251001":   { input: 0.80, output: 4.00 },
  "claude-opus-4-6":             { input: 15.00, output: 75.00 },
  "gpt-4o":                      { input: 2.50, output: 10.00 },
  "gpt-4o-mini":                 { input: 0.15, output: 0.60 },
  "gemini-2.5-flash":            { input: 0.15, output: 0.60 },
  "gemini-2.5-pro":              { input: 1.25, output: 10.00 },
  // Per unit
  "elevenlabs-tts":              { input: 0.30, output: 0 },  // per 1K chars
  "replicate-image":             { input: 0.01, output: 0 },  // per image
  "resend-email":                { input: 0.001, output: 0 }, // per email
  "twilio-sms":                  { input: 0.0079, output: 0 }, // per segment
  "document-ai":                 { input: 0.01, output: 0 },  // per page
};
```

**Integration points — add `logApiCost()` calls to these files:**

| File | After what | Extract |
|------|-----------|---------|
| `server/routes/chat.ts` | Gemini/Perplexity response | model, tokens if available |
| `server/routes/research.ts` | `generateResearchWithToolsStream` completes | Anthropic usage (response.usage) |
| `server/routes/ai.ts` | AI completion | model, tokens |
| `server/routes/icp-research.ts` | Anthropic response | model, usage |
| `server/routes/calculations.ts` | OpenAI response | model, usage |
| `server/routes/premium-exports.ts` | Gemini image gen | model, image count |
| `server/routes/twilio.ts` | SMS send | segment count |
| `server/integrations/resend.ts` | Email send | email count |
| `server/integrations/document-ai.ts` | Document parse | page count |
| `server/replit_integrations/image/routes.ts` | Image gen | model, count |

**WARNING:** For Gemini, the SDK response does NOT expose token counts in the public API. Log the call but estimate tokens from input/output string length: `estimatedTokens ≈ string.length / 4`.

**WARNING:** For Anthropic, token counts ARE available in `response.usage.input_tokens` and `response.usage.output_tokens`. Extract these.

**WARNING:** For OpenAI, token counts ARE available in `response.usage.prompt_tokens` and `response.usage.completion_tokens`.

---

## Component 2: Cost Monitor CLI

**File:** `script/cost-monitor.ts`

**What it does:**
- Tails `logs/api-costs.jsonl` using `fs.watch` + seek
- Aggregates costs by service, model, time window
- Renders a live terminal dashboard using ANSI escape codes (no extra dependencies)
- Refreshes every 2 seconds
- Supports command-line flags: `--since 1h`, `--since today`, `--since 2026-03-17`

**Terminal UI layout:**
```
╔══════════════════════════════════════════════════════════════╗
║  API Cost Monitor                          Live • 14:32:05  ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Today's Spend: $12.47          This Hour: $1.23             ║
║  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░ 62% of $20 daily budget             ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  BY SERVICE                     Calls    Tokens     Cost     ║
║  ─────────────────────────────────────────────────────────── ║
║  Anthropic (Claude)               23    145.2K    $8.41      ║
║    claude-sonnet-4                18    120.1K    $6.82      ║
║    claude-haiku-4.5                5     25.1K    $1.59      ║
║  Google Gemini                    45     89.3K    $2.14      ║
║    gemini-2.5-flash              42     81.0K    $1.92      ║
║    gemini-2.5-flash (image)       3      —       $0.22      ║
║  OpenAI                            4     12.0K    $0.48      ║
║  ElevenLabs (Voice)                2      —       $0.60      ║
║  Resend (Email)                    8      —       $0.01      ║
║  Replicate (Image)                 1      —       $0.01      ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  BY ROUTE                       Calls   Avg ms     Cost     ║
║  ─────────────────────────────────────────────────────────── ║
║  /api/research/generate           12    4,200    $5.20      ║
║  /api/chat                        34      890    $3.10      ║
║  /api/icp-research                 4    3,100    $2.40      ║
║  /api/premium-exports/image        3    2,400    $0.22      ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  LAST 5 CALLS                                                ║
║  14:31:52  anthropic  claude-sonnet-4   research   $0.42     ║
║  14:31:48  gemini     2.5-flash         chat       $0.03     ║
║  14:31:30  gemini     2.5-flash         chat       $0.02     ║
║  14:30:15  anthropic  claude-sonnet-4   research   $0.38     ║
║  14:29:44  elevenlabs tts               voice      $0.30     ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  Press q to quit • r to reset • b to set budget             ║
╚══════════════════════════════════════════════════════════════╝
```

**Key features:**
- Color-coded: green (< 50% budget), yellow (50-80%), red (> 80%)
- Animated progress bar for daily budget
- Auto-scroll last 5 calls
- Keyboard: `q` quit, `r` reset counters, `b` set daily budget, `h` toggle hourly/daily/weekly view
- Graceful handling of missing/empty log file (shows "Waiting for API calls...")

**No external dependencies.** Uses only Node.js built-ins: `fs`, `readline`, `path`, `process`.

**Run command:**
```bash
npx tsx script/cost-monitor.ts
npx tsx script/cost-monitor.ts --since today
npx tsx script/cost-monitor.ts --since 1h --budget 20
```

---

## Implementation Order

1. Create `logs/` directory (add to `.gitignore`)
2. Create `server/middleware/cost-logger.ts` — the logging function + pricing table
3. Add `logApiCost()` calls to the 10 route files listed above
4. Create `script/cost-monitor.ts` — the CLI dashboard
5. Add npm script: `"cost-monitor": "tsx script/cost-monitor.ts"`

## Verification

1. Start the server: `npm run dev`
2. In another terminal: `npm run cost-monitor`
3. Make a chat API call via the UI
4. Verify the CLI shows the call with estimated cost
5. Make a research call — verify token counts appear (Anthropic)

## Files Modified

| File | Change |
|------|--------|
| `server/middleware/cost-logger.ts` | **NEW** — logging function + pricing |
| `script/cost-monitor.ts` | **NEW** — CLI dashboard |
| `server/routes/chat.ts` | Add `logApiCost()` after AI response |
| `server/routes/research.ts` | Add `logApiCost()` after stream completes |
| `server/routes/ai.ts` | Add `logApiCost()` after completion |
| `server/routes/icp-research.ts` | Add `logApiCost()` after response |
| `server/routes/calculations.ts` | Add `logApiCost()` after response |
| `server/routes/premium-exports.ts` | Add `logApiCost()` after image gen |
| `server/routes/twilio.ts` | Add `logApiCost()` after SMS |
| `server/integrations/resend.ts` | Add `logApiCost()` after email |
| `server/integrations/document-ai.ts` | Add `logApiCost()` after parse |
| `server/replit_integrations/image/routes.ts` | Add `logApiCost()` after gen |
| `.gitignore` | Add `logs/` |
| `package.json` | Add `cost-monitor` script |
