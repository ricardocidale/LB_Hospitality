# Session Memory

**Read this file + `replit.md` at session start. Update at session end.**
**Older sessions archived in `.claude/rules/session-memory-archive.md`.**

---

## Session: March 7, 2026 — ElevenLabs Voice UI Correctness Fixes (7 issues)

### What Was Done
All 7 correctness/quality fixes applied to the ElevenLabs voice UI blocks and VoiceLab page:

| # | Fix | File |
|---|-----|------|
| 1 | `ConversationBar` guard: early-return + `onError` when neither `signedUrl` nor `agentId` set; phone button disabled | `components/conversation-bar.tsx` |
| 2 | `VoiceChatOrb` dead code: removed unused `data: signedUrl` from `useAdminSignedUrl()` (session always refetches via `refetchSignedUrl`) | `VoiceChatOrb.tsx` |
| 3 | `VoiceChatFull` race condition: `sendUserMessage` was called immediately after `startConversation` before the session was ready. Fix: `pendingFirstMessageRef` set before `startConversation`, consumed in `onConnect` callback | `VoiceChatFull.tsx` |
| 4 | `VoiceLab` tab-switch guard: added `onSessionChange(active: boolean)` prop to Orb/Full/Bar; `VoiceLab` tracks via `hasActiveSessionRef`; `window.confirm` shown before switching away from active session | `VoiceLab.tsx` + Orb/Full/Bar |
| 5 | `Speaker` stale comment: removed `// NOTE: globalAudioState intentionally removed…` | `Speaker.tsx` |
| 6 | `VoiceChatOrb` console.logs: removed `console.log("Connected")` and `console.log("Disconnected")`; replaced `onConnect` no-op with `setErrorMessage(null)` | `VoiceChatOrb.tsx` |
| 7 | `VoiceLab` description strip flicker: description `<p>` wrapped in its own `<AnimatePresence>` with `key={activeTab}` — fades instead of snapping | `VoiceLab.tsx` |

### Key Technical Decisions
- Race fix (Fix 3): pending message stored in ref BEFORE `startConversation` is awaited, so `onConnect` always fires with the right message regardless of async timing
- Session guard (Fix 4): `hasActiveSessionRef` (not state) avoids unnecessary re-renders; confirm only fires when actually switching away from an active session
- `onSessionChange` prop is optional on all three components — zero breaking changes

### Files Modified
- `client/src/features/ai-agent/components/conversation-bar.tsx` — Fix 1
- `client/src/features/ai-agent/VoiceChatOrb.tsx` — Fixes 2, 4, 6
- `client/src/features/ai-agent/VoiceChatFull.tsx` — Fixes 3, 4
- `client/src/features/ai-agent/VoiceChatBar.tsx` — Fix 4
- `client/src/features/ai-agent/Speaker.tsx` — Fix 5
- `client/src/pages/VoiceLab.tsx` — Fixes 4, 7

---

## Session: March 7, 2026 — ElevenLabs UI Blocks + Housekeeping

### What Was Done
- **MCP setup**: `npx shadcn@latest mcp init --client claude` — created `.mcp.json` with shadcn MCP server
- **All shadcn components installed**: `npx shadcn@latest add --all` (combobox missing from registry, installed by name instead). Overwrote `tabs.tsx` — restored from git to preserve `CurrentThemeTab`. 37 files updated.
- **ElevenLabs UI blocks installed** (all adapted from Next.js → Vite/Express):
  - `voice-chat-02` → `features/ai-agent/VoiceChatOrb.tsx` — orb-centered, WebRTC, signed URL
  - `voice-chat-01` → `features/ai-agent/VoiceChatFull.tsx` — full chat + voice toggle, text+WebRTC
  - `voice-chat-03` → `features/ai-agent/VoiceChatBar.tsx` — floating ConversationBar, uses `agentId` directly (ConversationBar doesn't support signed URLs)
  - `speaker-01` → `features/ai-agent/Speaker.tsx` — 1350-line audio player with orb, waveform, playlist, ambience mode
  - `realtime-transcriber-01` → `features/ai-agent/RealtimeTranscriber.tsx` + `RealtimeTranscriberLanguageSelector.tsx`
- **New hooks**: `client/src/hooks/use-debounce.ts`, `client/src/hooks/use-previous.ts`
- **New endpoint**: `POST /api/marcela/scribe-token` in `server/routes/admin/marcela.ts` — replaces Next.js server action `getScribeToken()`
- **Root barrel**: `features/ai-agent/index.ts` — exports all 7 top-level components + types + components barrel
- **Stale import fixes**: `VoiceSettings.tsx` and `MarcelaTab.tsx` updated from `@/components/ui/orb|bar-visualizer|matrix` → `@/features/ai-agent/components/`
- **Skills saved**: `.claude/skills/ui/react-hook-form.md` (RHF + Field component patterns), `.claude/skills/marcela-ai/elevenlabs-components-docs/README.md` (index of 17 EL docs)
- **TS errors fixed in RealtimeTranscriber**: `<style jsx>` → `<style>`, `<Badge asChild>` → plain `<a>` with Tailwind badge classes
- TypeScript: 0 errors throughout

### Additional Fixes (same session, later)
- **`ConversationHistory.tsx`**: `conversation`, `message`, `audio-player` imports → `@/features/ai-agent/components/`
- **`admin/marcela/index.ts`**: expanded to export all 8 sub-tab components (was only `MarcelaTab`)
- **`VoiceChatOrb` + `VoiceChatFull`**: added `dynamicVariables` (`user_name`, `user_role`, `current_page`) to each `startSession` call via `useAuth()`
- **`/api/marcela/scribe-token`**: already had full error handling — no change needed
- All shadcn components installed (`npx shadcn@latest add` by name — `--all` fails on missing `combobox`). `tabs.tsx` overwrite restored from git to preserve `CurrentThemeTab`.

### Next.js → Vite Adaptation Pattern
- Remove `"use client"` directive
- Replace `next/link` `<Link>` with `<a target="_blank" rel="noopener noreferrer">`
- Replace server actions (`"use server"`) with Express endpoints + `fetch("/api/...", { credentials: "include" })`
- Replace registry hook imports (`@/registry/elevenlabs-ui/hooks/`) with `@/hooks/`
- Replace `<style jsx>` with `<style>`
- Replace `<Badge asChild>` with inline `<a>` + Tailwind badge classes

### Key Decisions
- `VoiceChatBar` uses `agentId` (not signed URL) — `ConversationBar` component limitation, requires public agent
- `exampleTracks` defined locally in `Speaker.tsx` (not exported from audio-player)
- Linter auto-appends `.js` to audio-player import in Speaker.tsx — leave as-is
- `ConversationBar` `agentId` prop reads `marcelaAgentId` from `useMarcelaSettings()`

### Feature Module Structure (updated)
```
client/src/features/ai-agent/
├── index.ts                          # ROOT BARREL (new) — all exports
├── components/                       # 17 ElevenLabs UI components
├── hooks/
├── ElevenLabsWidget.tsx
├── VoiceChatOrb.tsx                  # voice-chat-02
├── VoiceChatFull.tsx                 # voice-chat-01
├── VoiceChatBar.tsx                  # voice-chat-03
├── Speaker.tsx                       # speaker-01
├── RealtimeTranscriber.tsx           # realtime-transcriber-01
├── RealtimeTranscriberLanguageSelector.tsx
├── query-keys.ts
└── types.ts
```

### Wiring + Improvements (same session, later)
- **`/voice` route** — new `VoiceLab` page (`client/src/pages/VoiceLab.tsx`) with 5-tab layout: Voice Orb, Full Chat, Floating Bar, Real-time Transcriber, Speaker. Lazy route in `App.tsx` as `ProtectedRoute`. Framer Motion `AnimatePresence` tab transitions.
- **Sidebar nav** — "AI Voice Lab" link in Layout.tsx Tools group, gated on `marcelaEnabled || showAiAssistant`.
- **`conversation-bar.tsx`** — removed `"use client"` Next.js directive; added `signedUrl`, `dynamicVariables`, `agentLabel` props; `startConversation` uses signed URL when provided, falls back to `agentId`; "Customer Support" hardcoded label → `agentLabel ?? "AI Agent"`.
- **`VoiceChatBar.tsx`** — switched from bare `agentId` to signed URL pattern: fetches fresh URL on connect via `refetchSignedUrl()`, passes `dynamicVariables` (`user_name`, `user_role`, `current_page`) — now consistent with VoiceChatFull/Orb.
- **`RealtimeTranscriber.tsx`** — fixed `position: fixed` on `BackgroundAura` → `absolute`; `BottomControls` `fixed bottom-8` → `absolute bottom-6`; root container gets `overflow:hidden`, `rounded-xl`, `border`, `min-h-[480px]` — renders correctly inside a card/tab instead of covering the full viewport.
- **Barrel fix**: `features/ai-agent/index.ts` — `RealtimeTranscriber` → `RealtimeTranscriber01` (matches actual default export name).
- TypeScript: 0 errors throughout. Commits: `d0020e8`, `f106448`.

### 5 Additional Fixes (same session, later — commit `3d3c82f`)
- **VoiceChatBar signed URL timing (bug)**: `onConnect` fires after session starts so URL was fetched too late. Fix: use `data: signedUrl` from `useAdminSignedUrl()` directly (auto-fetched on mount); call `refetchSignedUrl()` on disconnect to pre-cache for next session.
- **VoiceChatBar error visibility (bug)**: errors were only `console.error`'d. Fix: `errorMessage` state shown in chat empty-state title/description.
- **Speaker globalAudioState (anti-pattern)**: module-level mutable object leaked state across remounts. Fix: `audioStateRef = useRef<AudioState>()` in `SpeakerControls`, threaded through `SpeakerOrbsSection` → `SpeakerOrb` as `stateRef` prop. Added `AudioState` type. Dep arrays updated.
- **VoiceLab UX**: mic-required indicator (small `<Mic>` icon) on voice tabs (Orb, Bar, Transcriber); Transcriber wrapper gets `min-h-[480px]`.
- **VoiceChatOrb stale guard (bug)**: `disabled={isTransitioning || !signedUrl}` blocked reconnects after first session (stale cache). Fix: `disabled={isTransitioning}` — `startConversation` always refetches fresh URL anyway.

---

## Session: March 7, 2026 — AI Agent Feature Module Reorganization (Phases 1–6)

### What Was Done
- **Phase 1**: Deleted function bodies from `admin/marcela/hooks.ts` → 3-line re-export barrel pointing to `features/ai-agent/hooks/`
- **Phase 2**: Moved `types.ts` to `features/ai-agent/types.ts` (source of truth); `admin/marcela/types.ts` → barrel using relative path (vitest can't resolve `@/` in direct path imports)
- **Phase 3**: Moved 17 ElevenLabs UI components from `components/ui/` to `features/ai-agent/components/`; updated cross-imports to relative `./`; barrel `index.ts` uses explicit `export { Orb }` to avoid `AgentState` name collision between `bar-visualizer` and `orb`; old `components/ui/<name>.tsx` files → 3-line barrels
- **Phase 4**: Moved `ElevenLabsWidget.tsx` to `features/ai-agent/ElevenLabsWidget.tsx`; `components/ElevenLabsWidget.tsx` → default-export barrel
- **Phase 5**: Skills reorganization — merged `voice-widget/` into `marcela-ai/`; created `ai-agent-admin.md` (feature module map, re-export barrel table, AgentState collision docs, widget variants); updated `SKILL.md` entry point
- **Phase 6**: Created `features/ai-agent/query-keys.ts` with typed `AI_AGENT_KEYS` constant; all 5 hook files updated to use `AI_AGENT_KEYS` instead of inline string arrays
- **ElevenLabs docs**: Fetched all 17 MDX component docs from `github.com/elevenlabs/ui` → `.claude/skills/marcela-ai/elevenlabs-components-docs/` with `README.md` index
- **Cleanup**: Deleted `stat-card.original.tsx` and `OverviewTab.original.tsx` stale files
- **Rejected**: `npx shadcn@latest init` — existing `components.json` already correct, no need to overwrite
- TypeScript: 0 errors throughout

### Feature Module Structure (source of truth)
```
client/src/features/ai-agent/
├── components/           # 17 ElevenLabs UI components (source of truth)
│   └── index.ts          # barrel — explicit export { Orb } to avoid AgentState collision
├── hooks/                # 5 hook files + index.ts barrel
├── ElevenLabsWidget.tsx  # source of truth
├── query-keys.ts         # AI_AGENT_KEYS typed constants
└── types.ts              # VoiceSettings, TwilioStatus, TTS/STT/LLM constants
```

### Backward-Compat Barrels (do not add logic)
- `client/src/components/ui/<17 EL components>.tsx` → `export * from "@/features/ai-agent/components/<name>"`
- `client/src/components/ElevenLabsWidget.tsx` → `export { default } from "@/features/ai-agent/ElevenLabsWidget"`
- `client/src/components/admin/marcela/hooks.ts` → `export * from "@/features/ai-agent/hooks"`
- `client/src/components/admin/marcela/types.ts` → `export * from "../../../features/ai-agent/types"` (relative — vitest compat)

### Known Issues (resolved in next session)
- `VoiceSettings.tsx` and `MarcelaTab.tsx` stale imports fixed (orb/bar-visualizer/matrix → features/ai-agent/components)
- Root `index.ts` barrel added to `features/ai-agent/`
- `admin/marcela/index.ts` sub-tab exports still pending

---

## Session: March 6, 2026 — Deterministic Research Tools & Post-LLM Validation (Phases 2-4)

### What Was Done
- **Phase 2**: Created 5 new deterministic research tools in `calc/research/` (occupancy-ramp, adr-projection, cap-rate-valuation, cost-benchmarks, property-metrics). Registered all in `calc/dispatch.ts`. Added 27 tests.
- **Phase 3**: Slimmed TOOL_PROMPTS in `server/aiResearch.ts` from verbose self-prompting to thin context summaries (-77 lines). Extracted `CONFIDENCE_PREAMBLE` constant injected once via `loadSkill()` instead of duplicating in 6+ skill files. Removed boilerplate from 7 research skill files.
- **Phase 4**: Built post-LLM validation layer (`calc/research/validate-research.ts`) with bounds checks + cross-validation using `computePropertyMetrics` and `computeCapRateValuation`. Integrated into `server/routes/research.ts` — validation runs before save, attaches `_validation` summary to research content. 24 new tests.
- **Documentation update**: Updated `research-precision.md`, `research/SKILL.md`, `marcela-ai/SKILL.md`, `finance/SKILL.md`, `context-loading/SKILL.md`, checker manual (research calibration + testing methodology), user manual (Section13Marcela accuracy section).
- **Schema fix**: Added missing `DEFAULT_MAX_STALENESS_HOURS` import in `shared/schema.ts`.
- **Doc harmony**: Updated test counts 2,406→2,409 in `claude.md` and `replit.md`.
- Tests: 2,409 (2,389 passing + 20 E2E skipped), verification UNQUALIFIED, health ALL CLEAR.

### Key Technical Decisions
- Validation is non-blocking (warn/pass, not reject) to preserve potentially useful research values
- Cross-validation reuses existing deterministic tools rather than reimplementing financial logic
- TOOL_PROMPTS kept as thin context summaries; skill files carry detailed instructions
- `CONFIDENCE_PREAMBLE` single injection point eliminates repeated boilerplate

### Files Created
- `calc/research/validate-research.ts`, `calc/research/occupancy-ramp.ts`, `calc/research/adr-projection.ts`, `calc/research/cap-rate-valuation.ts`, `calc/research/cost-benchmarks.ts`
- `tests/calc/validate-research.test.ts`, `tests/calc/research-tools.test.ts`

### Files Modified
- `server/aiResearch.ts` — CONFIDENCE_PREAMBLE, slimmed TOOL_PROMPTS
- `server/routes/research.ts` — validation integration before save
- `calc/research/index.ts` — barrel exports for new tools
- `calc/dispatch.ts` — registered new tools
- 7 research skill files — removed confidence boilerplate
- `shared/schema.ts` — added DEFAULT_MAX_STALENESS_HOURS import

---

## Session: March 6, 2026 — Codebase Hardening & Test Coverage

### What Was Done
- **6-phase hardening plan executed**: Bug fixes, shared fixtures, server tests, export tests, route error helper, RAG tests
- **5 additional improvement items**: Route helper tests, E2E smoke tests, client formatter tests, AI agent tests, golden fixture migration
- **Mutation invalidation audit**: Strengthened from 3 to 31 checks in `tests/proof/recalculation-enforcement.test.ts`
- **Storage layer tests**: 27 static analysis tests for shared ownership, ORDER BY DESC, transaction integrity
- **Scenario operations E2E**: 10 tests for full lifecycle (save → load → update → delete)
- **Doc harmonization**: `replit.md` reduced to slim pointer (~40 lines), `claude.md` updated with accurate stats
- Tests: 1,946 passing + 20 E2E skipped, verification UNQUALIFIED

### Key Files Changed
- `tests/server/storage-layer.test.ts` — 27 storage layer tests
- `tests/e2e/scenario-operations.test.ts` — 10 scenario E2E tests
- `tests/proof/recalculation-enforcement.test.ts` — 31 mutation invalidation checks
- `server/routes/helpers.ts` — `sendError()` and `logAndSendError()` centralized helpers
- `client/src/lib/exports/csvExport.ts` — try/catch, boolean return, filename sanitization
- 13 route files migrated to `logAndSendError()`
- `replit.md` — rewritten as slim pointer to `.claude/claude.md`

---

## Session: March 6, 2026 — Centralized Services Model (Full Feature)

### What Was Done
- **Centralized Services Model**: 6-phase feature adding cost-plus markup vendor cost analysis to the management company P&L
- **Phase 1 — Calc modules**: `calc/services/margin-calculator.ts` (4 pure math functions), `calc/services/cost-of-services.ts` (aggregator), `calc/services/types.ts` (ServiceTemplate, AggregatedServiceCosts), deterministic tool `cost-of-services-aggregator`
- **Phase 2 — Schema & backend**: `serviceTemplates` table in `shared/schema.ts`, CRUD routes (`server/routes/admin/services.ts`), IStorage methods, DB migration via `drizzle-kit push`, seed data (3 templates: Marketing, IT, General Management)
- **Phase 3 — Client API + engine**: React Query hooks (`client/src/lib/api/services.ts`), `serviceTemplates` added to `ALL_FINANCIAL_QUERY_KEYS`, `generateCompanyProForma()` extended with optional `serviceTemplates` parameter
- **Phase 4 — Admin UI + Company P&L**: `ServicesTab.tsx` (entity card pattern, gradient summary, CRUD), `CompanyIncomeTab.tsx` updated with Cost of Services section + Gross Profit row, `Company.tsx` passes templates to engine
- **Phase 5 — Tests**: 63 new tests (margin-calculator: 31, cost-of-services: 17, engine integration: 15), recalculation enforcement proof test updated
- **Phase 6 — Documentation**: `finance/centralized-services.md` skill, updated finance SKILL.md (16→17 sub-skills), admin SKILL.md (11→12 tabs), context-loading task map
- Tests: 1,609/1,609 passing, verification UNQUALIFIED

### Key Technical Decisions
- **Approach A (rate-derived)**: Vendor costs derived from existing fee revenue, not a new expense line — property SPV unchanged
- **Backward compatible**: No templates = totalVendorCost=0, grossProfit=totalRevenue, costOfCentralizedServices=null
- **Cost-plus math**: vendorCost = fee / (1 + markup), grossProfit = fee - vendorCost
- **serviceModel type cast**: Drizzle infers `string`, Company.tsx casts to `'centralized' | 'direct'`
- **Sophisticated design**: Entity card pattern with gradient summary, backdrop-blur, hover-reveal actions (user rejected "teen design")

### Files Created
- `calc/services/margin-calculator.ts`, `calc/services/cost-of-services.ts`, `calc/services/types.ts`
- `client/src/lib/api/services.ts`, `client/src/components/admin/ServicesTab.tsx`
- `.claude/tools/analysis/cost-of-services-aggregator.json`
- `tests/calc/services/margin-calculator.test.ts`, `tests/calc/services/cost-of-services.test.ts`, `tests/engine/centralized-services.test.ts`
- `.claude/skills/finance/centralized-services.md`

### Files Modified
- `client/src/lib/financialEngine.ts` — extended CompanyMonthlyFinancials, new serviceTemplates param
- `client/src/lib/api/properties.ts` — added `serviceTemplates` to ALL_FINANCIAL_QUERY_KEYS
- `client/src/lib/api/index.ts` — barrel export services
- `client/src/components/company/CompanyIncomeTab.tsx` — Cost of Services + Gross Profit display
- `client/src/pages/Company.tsx` — passes templates to engine
- `client/src/pages/Admin.tsx` — Services tab added
- `client/src/components/admin/index.ts` — barrel export ServicesTab
- `calc/dispatch.ts` — registered cost_of_services_aggregator tool
- `tests/proof/recalculation-enforcement.test.ts` — added service mutations
- `.claude/skills/finance/SKILL.md`, `.claude/skills/admin/SKILL.md`, `.claude/skills/context-loading/SKILL.md`

---

## Session: March 6, 2026 — AI Agent Admin Tab (Mini ElevenLabs Dashboard)

### What Was Done
- **Mini ElevenLabs admin dashboard**: Built 7-tab admin section (General, Prompt, Voice, LLM, Tools, KB, Telephony) under Admin > AI Agent
- **AI Agent name variable**: Added `aiAgentName` column to `global_assumptions` (default "Marcela"), `DEFAULT_AI_AGENT_NAME` constant in `shared/constants.ts`. All UI references use dynamic name from DB — no hardcoded "Marcela" in admin UI labels.
- **Admin tab renamed**: "Marcela" tab → "AI Agent" in Admin navigation. Internal code references remain `marcela*` in DB columns to avoid migration risk, but UI labels are all dynamic.
- **PromptEditor component**: Fetches/saves system prompt, first message, and language to ElevenLabs via PATCH endpoint. Supports word/char count, language selector with 10 languages.
- **ToolsStatus component**: Shows all registered client (12) and server (6) tools with registration status. "Sync All Tools" button pushes tool config to ElevenLabs.
- **Enhanced KnowledgeBase**: RAG index status + reindex, ElevenLabs KB push, file upload via multer (accepts TXT, PDF, DOC, DOCX, MD, CSV).
- **Backend endpoints added**: `PATCH /api/admin/convai/agent/prompt`, `GET /api/admin/convai/tools-status`, `POST /api/admin/convai/knowledge-base/upload-file`
- **multer installed**: For multipart file uploads in KB file upload endpoint
- **Fixed TS errors**: `server/routes/admin/services.ts` param type errors, services.ts `string | string[]` issue
- Tests: 1,546/1,546 passing, 0 TypeScript errors

### Key Decisions
- DB columns keep `marcela_*` names to avoid risky migration — only UI labels use the dynamic `aiAgentName`
- `DEFAULT_MARCELA_*` constants aliased to `DEFAULT_AI_AGENT_*` for backward compatibility
- Premium/sophisticated design in all new components — gradient icons, subtle depth, uppercase tracking labels
- Claude Code working concurrently on hospitality DB/calculations — stayed in Marcela/AI Agent lane only

### Files Changed
- `shared/constants.ts` — `DEFAULT_AI_AGENT_NAME`, aliased `DEFAULT_AI_AGENT_*` constants
- `shared/schema.ts` — `aiAgentName` column on `global_assumptions`
- `client/src/pages/Admin.tsx` — tab label "Marcela" → "AI Agent"
- `client/src/components/admin/marcela/MarcelaTab.tsx` — 7-tab layout with dynamic `agentName`
- `client/src/components/admin/marcela/PromptEditor.tsx` — new component
- `client/src/components/admin/marcela/ToolsStatus.tsx` — new component
- `client/src/components/admin/marcela/KnowledgeBase.tsx` — enhanced with file upload
- `client/src/components/admin/marcela/hooks.ts` — 4 new hooks: `useAgentConfig`, `useSaveAgentPrompt`, `useToolsStatus`, `useUploadKBFile`
- `client/src/components/admin/marcela/types.ts` — `aiAgentName` added to `VoiceSettings`
- `client/src/components/admin/marcela/LLMSettings.tsx` — removed hardcoded "Marcela"
- `client/src/components/admin/marcela/VoiceSettings.tsx` — removed hardcoded "Marcela"
- `client/src/components/admin/marcela/TelephonySettings.tsx` — uses dynamic `agentName`
- `server/routes/admin/marcela.ts` — `aiAgentName` in GET/POST allowed fields, new endpoints
- `server/routes/admin/services.ts` — fixed `string | string[]` TS error

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
