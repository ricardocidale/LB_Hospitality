# Session Memory

**Read this file + `replit.md` at session start. Update at session end.**
**Older sessions archived in `.claude/archive/session-memory-archive.md`.**

## Format Rule
Keep each session entry to ≤5 lines. Detail lives in skill files. Archive sessions older than the last two on every session end.

---

## Session: March 11, 2026 — Architectural Hardening Initiative (9 Workstreams)
- WS1: Magic numbers extracted (CAP_RATE_SENSITIVITY_STEP, RESEARCH_TAX_RATE_30_PCT); chat.ts uses executeComputationTool via shared buildPropertyContext.ts
- WS2: Golden "Clearwater Inn" scenario (60 tests): 15 rooms $175 ADR cash purchase, mgmt co + 1 property + consolidated
- WS3: Chatbot renamed Rebecca, new sidebar "AI Assistants" group (Marcela voice + Rebecca text), admin RebeccaTab + config
- WS4: Admin Diagrams tab (Mermaid L1/L2/L3 workflow charts), WS5: /api/admin/users/:id/theme endpoint
- WS6: seedAdminUser password guard (FORCE_RESEED_PASSWORDS), reset-all requires confirmation phrase + password
- Tests 2,842→2,912 (131 files). Health ALL CLEAR. UNQUALIFIED.

## Session: March 10, 2026 — claude.md update + recent features
- Updated source stats, sidebar restructured, chatbot added, hero image captions, DCF dashboard

## Session: March 10, 2026 — Golden Scenario Battery Continued (5 more scenarios, 149 new tests)
- Built 5 new golden test files: exit-cap-sensitivity (24), mixed-portfolio (20), preops-refi-combo (45), underwater-exit (36), zero-occupancy (24)
- Secured ElevenLabs widget: signed URL endpoint (`/api/marcela/signed-url`) replacing bare agentId; `useAdminSignedUrl` hook
- Layout.tsx: widget disabled on admin pages; MarcelaTab imports signed URL hook
- Tests 2,671→2,820 (122 files, 418 golden). Health ALL CLEAR. UNQUALIFIED.

## Session: March 9, 2026 — Golden Scenario Battery (4 scenarios, 168 new tests)
- Built 4 golden test files: full-statement (55), pre-ops gap (23), multi-property (29), company aggregation (61)
- Full statement: Golden Lodge (20 rooms $200 financed) + company + consolidated intercompany elimination
- Edge cases: 6-month pre-ops gap with reserve, 3-property portfolio with delayed ops, staffing tier transitions
- Company aggregation: 2 properties (Alpine Inn cash + Harbor Hotel financed), fee aggregation, BS identity, portfolio sums
- Tests 2,503→2,671 (117 files, 269 golden). All saved to memory: `golden-scenarios.md`. Health ALL CLEAR.

## Session: March 9, 2026 — Comprehensive Audit V3 (Deterministic Accuracy)
- 6-phase audit: v2 regression, hand-calculated IRR golden, pipeline trace, BS identity fix, company/consolidated, full suite
- Fixed Critical bug: `server/calculation-checker/property-checks.ts` debtOutstanding missing current month principal
- Added A=L+E (ASC 210) check to both client auditor and server checker — closed deferred finding 3-1
- New: `tests/golden/irr-golden-hand-calculated.test.ts` (15 tests), `tests/golden/pipeline-trace.test.ts` (20 tests)
- Tests 2,448→2,503, all passing, UNQUALIFIED. Full report: `.claude/skills/proof-system/comprehensive-audit-v3-2026-03-09.md`

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
