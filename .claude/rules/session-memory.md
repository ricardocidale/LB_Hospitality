# Session Memory

**Read this file + `replit.md` at session start. Update at session end.**
**Older sessions archived in `.claude/rules/session-memory-archive.md`.**

---

## Session: February 16, 2026 — Token Optimization

### What Was Done
- Archived Feb 13-14 sessions to `session-memory-archive.md`
- Consolidated 25 rule files → 18 by merging related rules:
  - `auto-load-rules` + `read-session-memory-first` + `architect-reads-rules-and-skills` → `session-startup.md`
  - `source-of-truth` + `docs-after-edits` → `documentation.md`
  - `button-label-consistency` + `entity-card-patterns` → `ui-patterns.md`
  - `sync-fill-only` + `database-sync-sql-only` → merged into `database-seeding.md`
  - `audit-checks-rules` → merged into `release-audit-checklist.md`
- Compressed session memory from ~594 lines to ~120 lines

---

## Session: February 16, 2026 — Mobile Responsive Skills

### What Was Done
- Created `.claude/skills/mobile-responsive/` (4 files): SKILL.md, tablet-layouts.md, device-testing-checklist.md, responsive-helpers.md
- Updated context-loading and skill-organization with mobile-responsive references
- Skill count: 92 → 96

### Key Patterns Documented
- Breakpoints: sm:640, md:768 (useIsMobile), lg:1024, xl:1280
- Recharts: explicit `height={220}` (never percentage on ResponsiveContainer)
- Grids: `grid-cols-2 lg:grid-cols-4`, text: `text-lg sm:text-2xl`, padding: `p-3 sm:p-6`

---

## Session: February 16, 2026 — Test Coverage & Cleanup

### What Was Done
- Added 101 tests across 9 modules (1401 → 1502, all passing)
- Fixed projectionYears bug: must be ≥2 for revenue growth direction checks
- Fixed 2 TypeScript errors in routes.ts (research-questions params)
- New rule: `database-sync-sql-only.md` (now merged into database-seeding)
- Removed duplicate `/api/seed-production` endpoint (~100 lines dead code)
- Changed underfunding from material to info severity (business condition, not calc error)

---

## Session: February 15, 2026 — Timezone Bug & Research Questions

### What Was Done
- **Timezone bug fix**: `new Date("2027-07-01")` in Western timezones shifts to previous day. Fix: `parseLocalDate()` appends `T00:00:00`. Applied to financialEngine, financialAuditor, equityCalculations, loanCalculations.
- **Research Questions CRUD**: `researchQuestions` table, 4 API endpoints, React Query hooks, Settings > Industry Research tab UI, merged into AI prompts
- 17 auditor regression tests added. Tests: 1401 passing, UNQUALIFIED.
- `parseLocalDate()` defined locally per file (not centralized — architect noted as future cleanup)

---

## Persistent Decisions & Preferences

- **projectionYears ≥ 2** for revenue growth direction verification
- **Underfunding = info severity** (not material) — business condition, not calculation error
- **DB sync = SQL only**, never code endpoints
- **Seeding errors are ultra-serious** — cascade into calculation failures
- **"Save" not "Update"** on all buttons
- **Nano Banana** (`gemini-2.5-flash-image`) primary image gen, OpenAI fallback
- **100% session memory** — all decisions saved across resets
- **Every page graphics-rich** — charts, animations, visual elements
- **Every financial line** gets ? tooltip
- **Reusable UI tools** created for all new features
- **Logos vector-based/SVG** with AnimatedLogo wrapper
- **3-level accordion** for consolidated statements (total → formula → per-property)
- **Zero re-aggregation** in render paths — helpers accept precomputed arrays
- **`parseLocalDate()`** for all client-side date string parsing
