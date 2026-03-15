# Session Memory

**Read this file + `replit.md` at session start. Update at session end.**
**Older sessions archived in `.claude/archive/session-memory-archive.md`.**

## Format Rule
Keep each session entry to ≤5 lines. Detail lives in skill files. Archive sessions older than the last two on every session end.

---

## Session: March 15, 2026 — Documentation Update (Task #135)
- Updated `claude.md` with current project state: ~795 source files, ~144K lines, 3,022 tests across 135 test files
- Skill router updated: UI (43), Finance (21), Research (21), Testing (8), 170 total skill files across 69 directories
- Recent Changes section replaced with March 15 entries covering ~60 merged tasks since March 12
- 6 new migrations added to migration list, Key Rules updated with Resend, ICP split, LLM dual-model, Norfolk AI

## Sessions: March 13–15, 2026 — Major Feature & Polish Sprint (~60 tasks merged)
- Fee category restructure (#108–#109), funding interest accrual (#116), login redesign + Google Sign-In (#63, #131)
- ICP split into Profile + Research Center (#71), LLM dual-model architecture (#101), DocuSign/Slack removal (#133, #134)
- Resend email replacement (#68), Excel 4-sheet standardization (#112), PDF export fixes (#117, #119)
- Management Company rename (#120), company defaults (#118, #123, #124), sidebar cleanup (#130, #132)
- Admin hardening phases 1–2C (March 13), UI polish: card widths, save buttons, tabs, tooltips (#45–#49, #107)
- Norfolk AI theme (#84), DB integrity hardening (#80), deterministic calc optimization (#64)
- 3,022 tests (135 files). 0 TS errors. UNQUALIFIED.

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
