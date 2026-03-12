# Session Memory

**Read this file + `replit.md` at session start. Update at session end.**
**Older sessions archived in `.claude/archive/session-memory-archive.md`.**

## Format Rule
Keep each session entry to ≤5 lines. Detail lives in skill files. Archive sessions older than the last two on every session end.

---

## Session: March 12, 2026 — Infrastructure Contracts Optimization (12 Workstreams)
- WS1-2: Sealed storage facade — ServiceStorage + NotificationStorage bound to IStorage, `patchGlobalAssumptions` added to FinancialStorage
- WS3-4: Domain boundaries — 6-domain separation rule + proof test (no route imports db, calc purity, financial isolation from AI SDKs)
- WS6: Constants hardening — `DEFAULT_AI_AGENT_VOICE_ID`, `DEFAULT_STAFF_TIER1/2_MAX_PROPERTIES` extracted to `shared/constants.ts`
- WS7-8: Tool protection — 36-tool registry rule + proof test, `compute_make_vs_buy.json` schema created
- WS9-11: 0 TS errors, duplicate hooks eliminated (7 admin tabs → canonical `@/lib/api`), duplicate plaid dep removed, `GlobalResponse` expanded
- Tests 2,927→2,940 (127 files, 500 golden). 0 TS errors.

## Session: March 11, 2026 (cont.) — WACC + Plan Completion
- WACC-based DCF: `compute_wacc` + `compute_portfolio_wacc` tools (33→36 total), `costOfEquity` column, research badges
- 12 golden WACC tests. All 9 prior workstreams COMPLETE. Tests 2,912→2,927 (125 files, 500 golden).

## Session: March 11, 2026 — Architectural Hardening Initiative (9 Workstreams)
- WS1-6: Magic numbers, golden scenarios, Rebecca chatbot, Admin Diagrams, theme endpoint, password guards
- Tests 2,842→2,912 (131 files). Health ALL CLEAR. UNQUALIFIED.

---

## Persistent Decisions & Preferences

- **projectionYears ≥ 2** for revenue growth direction verification
- **Underfunding = info severity** (not material) — business condition, not calculation error
- **DB sync = SQL only**, never code endpoints
- **Seeding errors are ultra-serious** — cascade into calculation failures
- **"Save" not "Update"** on all buttons
- **Nano Banana** (`gemini-2.5-flash-image`) primary image gen, OpenAI fallback
- **Every page graphics-rich** — charts, animations, visual elements
- **Every financial line** gets ? tooltip
- **Reusable UI tools** created for all new features
- **Logos vector-based/SVG** with AnimatedLogo wrapper
- **3-level accordion** for consolidated statements (total → formula → per-property)
- **Zero re-aggregation** in render paths — helpers accept precomputed arrays
- **`parseLocalDate()`** for all client-side date string parsing
- **ElevenLabs UI** = voice/agent components only (Orb, Waveform, ConversationBar); general UI stays shadcn
- **`captureChartAsImage`** exported from `@/lib/exports/pngExport`; `downloadCSV(content, filename)` takes 2 args
- **`ExportMenu` variant**: `"glass" | "light" | undefined` only
- **`admin/marcela/` DB columns** keep `marcela_*` names; only UI labels use dynamic `aiAgentName`
- **`AgentState` name collision** in `features/ai-agent/components/index.ts` — use explicit `export { Orb }` not `export *`
- **`VoiceChatBar`** uses signed URL (not bare `agentId`) — fetched on mount via `useAdminSignedUrl()`
- **Next.js → Vite**: remove `"use client"`, replace server actions with Express endpoints, `<style jsx>` → `<style>`
- **Company unprofitable with 1 small property** — correct behavior, not a bug (partner comp $45K > fee rev ~$19K)
- **Golden scenario design**: 0% growth/inflation for traceability, hand-values at file top, test both values + identities
