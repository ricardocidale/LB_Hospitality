# Hospitality Business Group - Business Simulation Portal

> **Master documentation:** `.claude/claude.md` — always the authority. This file is a slim summary. If conflicts, `.claude/claude.md` wins.

## Overview
Business simulation portal for the hospitality industry. Financial modeling, property management, investment analysis, and AI-powered assistant (Marcela). GAAP-compliant (ASC 230, ASC 360, ASC 470) with IRS depreciation rules and independent audit/verification engine.

**Codebase:** ~530 source files, ~79,000 lines, 1,608 tests across 78 files.

## User Preferences
- **Calculations first.** 1,608-test proof system must always pass.
- **Graphics-rich pages.** Charts, animations, visual elements everywhere.
- **No hardcoded values.** Financial assumptions and admin config from DB or named constants.
- **Full recalculation on save.** No partial query invalidation.
- **Context reduction mandatory.** Every refactor/feature must produce skills, helpers, scripts, and tools.
- **Premium design always.** $50K+ bespoke — animated numbers, micro-interactions, depth, staggered reveals, skeleton loading.
- **Rule compliance on audits.** Check all `.claude/rules/` every audit.
- **Session memory.** Update `session-memory.md` every session. Read it first.
- **Docs after edits.** `.claude` docs and `replit.md` harmonized after code changes.
- **"Save" not "Update"** on all buttons.
- **Role-based access.** Investors restricted. Ricardo Cidale is sole Admin; all others are Partners.
- Company: "Hospitality Business Group". All UI references a theme. Skills under `.claude/`.

## System Architecture

### AI Agent — Multi-Channel Conversational Assistant
The AI agent (configurable name, default "Marcela") operates across web (ElevenLabs Conversational AI widget), phone (Twilio Voice), and SMS (Twilio SMS). The name is configurable via `aiAgentName` in `global_assumptions`. All ElevenLabs configuration done via API from Admin > AI Agent tab (no manual ElevenLabs dashboard usage). See `.claude/claude.md` § Marcela AI for full details.

- **Web:** ElevenLabs Conversational AI widget (`@elevenlabs/convai-widget-core`), supports voice + text, auto language detection. Agent ID configured in Admin > AI Agent tab. Signed URL generated server-side via `/api/marcela/signed-url`. Voices: Jessica (English), Sarah (Portuguese), configurable Spanish voice. Client tools (12 actions: page navigation, tour launch, context) registered via `elevenlabs-convai:call` event. Server tools (6 endpoints under `/api/marcela-tools/`) provide property/portfolio/scenario data to ElevenLabs agent. Dynamic variables pass user name, role, and current page.
- **Phone:** Twilio Voice webhook + WebSocket Media Stream, mulaw 8kHz ↔ PCM conversion
- **SMS:** Twilio SMS webhook, 1600-char auto-split, TwiML reply
- **RAG:** In-memory embeddings (OpenAI `text-embedding-3-small`), lazy indexing, cosine similarity retrieval
- **Admin (7-tab dashboard):** General, Prompt (saves to ElevenLabs API), Voice & Audio, LLM, Tools (18-tool status), Knowledge Base (RAG + file upload), Telephony

### Branding Architecture
User → User Group → Default hierarchy. See `.claude/claude.md` § Branding Architecture.

### Financial Engine (Modular)
GAAP-compliant calculation engine with 22 computation tools, typed dispatch, zero `any` types. Split into modular structure:
- **`client/src/lib/financial/`** — types.ts, property-engine.ts, company-engine.ts, utils.ts, index.ts
- **`client/src/lib/financialEngine.ts`** — thin re-export for backward compatibility
See `.claude/skills/finance/SKILL.md`.

### Admin Page (11 tabs)
Modular tab components, each split into sub-component directories:
- `activity/` — ActivityLogList, ActivityFeed, CheckerActivity
- `marcela/` — MarcelaTab (7-tab dashboard), PromptEditor, ToolsStatus, KnowledgeBase, VoiceSettings, LLMSettings, TelephonySettings, hooks, types
- `verification/` — VerificationResults, VerificationHistory, AIReviewPanel, DesignCheckPanel
- Standalone tabs: Users, Companies, User Groups, Logos, Branding, Themes, Navigation, Database
See `.claude/skills/admin/SKILL.md` and `.claude/skills/admin/ai-agent-admin.md`.

### Server Architecture (Modular)
- **Logger:** `server/logger.ts` — structured logger with timestamps, levels (info/warn/error/debug), and source prefixes. Used across all server modules.
- **Storage:** `server/storage/` — domain modules: users, properties, financial, admin, activity, research. Composed via `DatabaseStorage` class in index.ts. Thin re-export at `server/storage.ts`.
- **Seeds:** `server/seeds/` — domain modules: users, properties, branding, research. Orchestrated by index.ts. Thin re-export at `server/seed.ts`.
- **Routes:** `server/routes/admin/` — sub-modules: users, tools, marcela. Registered via index.ts. Thin re-export at `server/routes/admin.ts`.
- **Calculation Checker:** `server/calculation-checker/` — sub-modules: property-checks, gaap-checks, portfolio-checks, types. Thin re-export at `server/calculationChecker.ts`. Zero `any` types — all fully typed with `CheckerProperty`, `CheckerGlobalAssumptions`, `IndependentMonthlyResult`.
- 12 route modules: `auth`, `properties`, `admin`, `global-assumptions`, `branding`, `scenarios`, `research`, `property-finder`, `calculations`, `uploads`, `twilio`, `marcela-tools`.

### Client Architecture (Modular)
- **API:** `client/src/lib/api/` — domain modules: properties, admin, research, scenarios, types. Re-exported from `client/src/lib/api.ts`.
- **AI Chat:** `client/src/components/ai-chat/` — types, hooks (useChat, useVoice), ChatMessages, ChatInput, ChatHeader. Re-exported from AIChatWidget.tsx.
- **Financial Table Components:** `client/src/components/financial-table/` — context.tsx, common-rows.tsx, expandable-rows.tsx, balance-sheet-rows.tsx, specialized-rows.tsx, table-shell.tsx, index.ts. Re-exported from `financial-table-rows.tsx` for backward compatibility.
- **Company Data:** `client/src/lib/company-data.ts` — data transformation for Company page (income, cash flow, balance sheet aggregation).
- **Company Exports:** `client/src/lib/exports/companyExports.ts` — PDF, CSV, PNG, Excel, PPTX export logic for Company page.
- **Excel Export:** `client/src/lib/exports/excel/` — property-sheets, portfolio-sheet, helpers, types. Re-exported from excelExport.ts.
- **Checker Manual:** `client/src/pages/checker-manual/` — types, constants, hooks, TableOfContents, thin ManualContent orchestrator. 21 lazy-loaded section files in `sections/`. Re-exported from CheckerManual.tsx.
- **User Manual:** `client/src/pages/user-manual/` — constants, UserManualTOC, thin UserManualContent orchestrator. 17 lazy-loaded section files in `sections/`. Re-exported from index.tsx.
- **Help Page:** `client/src/pages/Help.tsx` — tabs: User Manual (default), Checker Manual (checker/admin), Guided Tour. Old Methodology page folded into Help; `/methodology` redirects to `/help`.

## External Dependencies
- **STT:** ElevenLabs Scribe v1
- **TTS:** ElevenLabs WebSocket streaming (Jessica voice, `eleven_flash_v2_5`)
- **LLM:** GPT-4.1
- **Image Gen:** Gemini `gemini-2.5-flash-image` (primary), OpenAI `gpt-image-1` (fallback)
- **Twilio Voice:** Inbound calls via Media Streams WebSocket API
- **Twilio SMS:** Inbound/outbound via Messaging API
- **Database:** PostgreSQL (Neon)
- **Object Storage:** GCS for images and exports
- **FFmpeg:** Server-side audio conversion

## Tech Stack
React 18, TypeScript, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts, Three.js, framer-motion, Express 5, Drizzle ORM, PostgreSQL, Zod, jsPDF, xlsx, pptxgenjs

## Quick Commands
```bash
npm run dev            # Start dev server (port 5000)
npm run health         # One-shot: tsc + tests + verify
npm run test:summary   # 1,608 tests, 1-line output
npm run verify:summary # 6-phase verification, compact
npm run stats          # Codebase metrics
npm run audit:quick    # Quick code quality scan
```

## Documentation Structure
```
.claude/
├── claude.md              # Master doc (always loaded)
├── rules/ (24 files)      # Enforceable constraints
├── skills/ (137 files)    # Implementation knowledge
├── tools/ (52 files)      # Tool schemas
├── manuals/               # Checker + user manuals
├── commands/              # Slash commands
└── scripts/               # SQL utilities
```

## Future Improvements (Noted, Not Blocking)
- **Schema split:** `shared/schema.ts` (1,172 lines) could be split by domain (auth, portfolio, research, branding, operations) once Claude Code finishes research feature work.
- **sidebar.tsx:** shadcn/ui primitive (736 lines) — do not modify.
