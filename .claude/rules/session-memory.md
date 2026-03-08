# Session Memory

**Read this file + `replit.md` at session start. Update at session end.**
**Older sessions archived in `.claude/archive/session-memory-archive.md`.**

## Format Rule
Keep each session entry to ≤5 lines. Detail lives in skill files. Archive sessions older than the last two on every session end.

---

## Session: March 8, 2026 — Context Unburden (Rounds 2–3)
- Round 2: `architecture.md` 172→20, `financial-engine.md` 214→43, `database-seeding.md` 209→27, merged no-hardcoded files → 48 lines, `claude.md` 522→127, `session-memory.md` 619→40, MEMORY.md populated
- Round 3: Slimmed 10 remaining large rules files; moved 4 reference docs to skills/; total rules auto-loaded context ~4,203 → ~850 lines (-80%)
- Moved: `api-routes.md`→`skills/architecture/`, `constants-and-config.md`→`skills/finance/`, `release-audit-checklist.md`→`skills/proof-system/`, `verification-system.md`→`skills/proof-system/`

## Session: March 8, 2026 — Admin Research Configuration Tab
- New Admin "Research" tab (13th tab) — per-event control over AI research (property/company/global)
- Config stored in `global_assumptions.researchConfig` (JSONB); new `ResearchEventConfig` / `ResearchConfig` types in schema
- New files: `server/routes/admin/research.ts`, `server/migrations/research-config-001.ts`, `client/src/components/admin/ResearchTab.tsx`
- Updated: `research-precision.md` (tool count 7→9, added admin config docs), `recalculate-on-save.md`, `admin/SKILL.md` (12→13 tabs)

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
