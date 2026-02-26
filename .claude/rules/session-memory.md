# Session Memory

**Read this file + `replit.md` at session start. Update at session end.**
**Older sessions archived in `.claude/rules/session-memory-archive.md`.**

---

## Session: February 26, 2026 — Source-of-Truth Harmonization

### What Was Done
- **Audited `.claude/claude.md` vs `replit.md` vs actual codebase** — found `claude.md` was stale (the rule says it must be the master)
- **Fixed codebase stats**: 298 files/65k lines → 404 files/71,500 lines
- **Fixed test count**: 1,502 reference → 1,529 (consistent everywhere now)
- **Fixed skill count**: 96 → 114 skill files
- **Fixed rule count**: 20 → 21 rules
- **Added Marcela AI section** to `claude.md`: channels table, key files, RAG KB, admin tab, voice UX, critical LLM rule
- **Added MarcelaTab** to Admin Page Structure table
- **Added ElevenLabs** to Connected Services table, expanded Twilio entry
- **Added Marcela/Twilio/Voice** rows to Skill Router table
- **Created 4 missing SKILL.md entry points**: `marcela-ai/SKILL.md`, `twilio-telephony/SKILL.md`, `admin/SKILL.md`, `finance/SKILL.md`
- **Updated context-loading/SKILL.md**: Added "Marcela AI & Voice" task-to-skill map section, fixed file/rule counts
- **Harmonized `replit.md`** to be a slim summary derived from `claude.md`
- Tests: 1,529/1,529 passing, verification UNQUALIFIED, 0 TypeScript errors (unchanged)

### Key Decisions
- `claude.md` is now the single source of truth with the Marcela AI section matching what `replit.md` already had
- SKILL.md files created as entry points per `skill-organization.md` rule — every skill directory gets one
- Context-loading map now routes Marcela/Twilio/voice tasks to the correct skills

### Files Changed
- `.claude/claude.md` — stats, Marcela section, Skill Router, Admin table, integrations
- `.claude/skills/context-loading/SKILL.md` — Marcela task map, counts
- `.claude/skills/marcela-ai/SKILL.md` — new entry point
- `.claude/skills/twilio-telephony/SKILL.md` — new entry point
- `.claude/skills/admin/SKILL.md` — new entry point
- `.claude/skills/finance/SKILL.md` — new entry point
- `.claude/rules/session-memory.md` — this file
- `replit.md` — harmonized

---

## Session: February 25-26, 2026 — Marcela AI Multi-Channel + RAG

### What Was Done
- **RAG knowledge base**: `server/knowledge-base.ts` — in-memory embeddings (OpenAI `text-embedding-3-small`), lazy indexing, cosine similarity retrieval, integrated into all 4 pipelines
- **Twilio Voice**: `server/routes/twilio.ts` — webhook + WebSocket Media Stream (mulaw 8kHz ↔ PCM ↔ ElevenLabs)
- **Twilio SMS**: SMS webhook + TwiML reply, sendSMS helper with 1600-char auto-split
- **Admin MarcelaTab telephony section**: Enable/disable toggles, greeting, webhook URLs, Twilio status, test SMS, knowledge base card
- **Voice UX polish**: WaveformVisualizer, VoiceStateIndicator, barge-in interruption, voice error retry
- **Channel badges**: 🌐📞💬 icons in conversation list
- **Outbound SMS**: `POST /api/admin/send-notification`
- **Schema migrated**: `phoneNumber` on users, `channel` on conversations, Marcela columns on global_assumptions
- **Skills created**: `marcela-ai/marcela-architecture.md`, `marcela-ai/audio-pipeline.md`, `twilio-telephony/twilio-integration.md`, `voice-widget/voice-ux-patterns.md`
- Tests: 1,529/1,529 passing, verification UNQUALIFIED

---

## Session: February 24, 2026 — Admin Refactor + Production Seed Script

### What Was Done
- **Admin.tsx refactored**: 3,235-line monolith → 10 standalone tab components + 87-line shell
  - Shell: `client/src/pages/Admin.tsx` — tab navigation only
  - Components: `client/src/components/admin/` — UsersTab, CompaniesTab, ActivityTab, VerificationTab, UserGroupsTab, LogosTab, BrandingTab, ThemesTab, NavigationTab, DatabaseTab
  - Shared types: `client/src/components/admin/types.ts` (17 interfaces)
  - Barrel export: `client/src/components/admin/index.ts`
  - Each tab owns its data fetching, mutations, dialogs, and state (no prop drilling)
  - BrandingTab accepts `onNavigate` prop for cross-tab navigation to Logos tab
- **Production seed SQL script**: `script/seed-production.sql` (401 lines)
  - 11 persistent tables, OVERRIDING SYSTEM VALUE for identity columns, sequence resets
  - Idempotent with ON CONFLICT DO NOTHING, wrapped in transaction
  - Company name: "Hospitality Business Group" throughout
- **Company name fix**: Confirmed no "L+B Hospitality" references in syncHelpers.ts
- Tests: 1,529/1,529 passing, verification UNQUALIFIED, 0 TypeScript errors
- Updated `replit.md` with new Admin structure and seed script documentation

### Key Decisions
- Conditional rendering (not React.lazy) for tab components — simpler, no Suspense needed
- Dialogs moved into owning tab components (not kept in shell)
- UI polish deferred — extraction-only to minimize regression risk
- Subagents used for parallel extraction (T002/T003/T004/T006 all independent)

### Files Changed
- `client/src/pages/Admin.tsx` — rewritten to 87-line shell
- `client/src/components/admin/` — 10 new tab components + index.ts barrel
- `script/seed-production.sql` — new production seed script

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
