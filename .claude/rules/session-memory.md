# Session Memory

**Read this file + `replit.md` at session start. Update at session end.**
**Older sessions archived in `.claude/archive/session-memory-archive.md`.**

## Format Rule
Keep each session entry to ≤5 lines. Detail lives in skill files. Archive sessions older than the last two on every session end.

---

## Session: March 8, 2026 — Context Unburden (Round 2)
- Slimmed `architecture.md` 172→20 lines, `financial-engine.md` 214→43, `database-seeding.md` 209→27
- Merged `no-hardcoded-assumptions.md` + `no-hardcoded-admin-config.md` → `no-hardcoded-values.md` (48 lines)
- Slimmed `claude.md` 522→127 lines (TOC + pointers); `session-memory.md` 619→40 lines
- Populated `MEMORY.md` at `/home/runner/.claude/projects/.../memory/MEMORY.md` with stable project facts
- Total auto-loaded context: ~3,681 → ~1,346 lines (-63% from original baseline)

## Session: March 8, 2026 — Codebase Architecture Skill + ElevenLabs Docs + Rule Enforcement
- Documented 80+ UI components in `codebase-architecture/SKILL.md`; added ChartTooltip as 4th tooltip type
- Documented full ElevenLabs/Marcela architecture (35 files, 7 widget variants, 22 API endpoints, 18 tools)
- Moved `admin-components/` and `codebase-architecture/` skills from `.agents/skills/` → `.claude/skills/`; deleted `.agents/`
- Updated `claude.md` Skill Router (+2), `context-loading/SKILL.md` (+2 sections), `skill-organization.md`, `replit.md`

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
