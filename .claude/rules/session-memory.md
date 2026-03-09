# Session Memory

**Read this file + `replit.md` at session start. Update at session end.**
**Older sessions archived in `.claude/archive/session-memory-archive.md`.**

## Format Rule
Keep each session entry to ≤5 lines. Detail lives in skill files. Archive sessions older than the last two on every session end.

---

## Session: March 9, 2026 — Comprehensive Audit V3 (Deterministic Accuracy)
- 6-phase audit: v2 regression, hand-calculated IRR golden, pipeline trace, BS identity fix, company/consolidated, full suite
- Fixed Critical bug: `server/calculation-checker/property-checks.ts` debtOutstanding missing current month principal
- Added A=L+E (ASC 210) check to both client auditor and server checker — closed deferred finding 3-1
- New: `tests/golden/irr-golden-hand-calculated.test.ts` (15 tests), `tests/golden/pipeline-trace.test.ts` (20 tests)
- Tests 2,448→2,503, all passing, UNQUALIFIED. Full report: `.claude/skills/proof-system/comprehensive-audit-v3-2026-03-09.md`

## Session: March 9, 2026 — Magic UI Special Effects + ElevenLabs Orb Integration
- Added 9 Magic UI components; `NumberTicker` preferred over `AnimatedCounter`
- New skill: `.claude/skills/ui/magic-ui.md`

## Session: March 8, 2026 — Context Unburden + Admin Research + Codebase Architecture
- Slimmed rules from ~4,203→~850 lines (-80%); moved 4 reference docs to skills/
- New Admin "Research" tab (13th); config in `global_assumptions.researchConfig` (JSONB)
- Documented 80+ UI components, ElevenLabs architecture (35 files)

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
