# Hospitality Business Group - Business Simulation Portal

> **Master documentation:** `.claude/claude.md` — always the authority. This file is a slim summary. If conflicts, `.claude/claude.md` wins.

## Overview
Business simulation portal for the hospitality industry. Financial modeling, property management, investment analysis, and AI-powered assistant (Marcela). GAAP-compliant (ASC 230, ASC 360, ASC 470) with IRS depreciation rules and independent audit/verification engine.

**Codebase:** ~467 source files, ~73,700 lines, 1,546 tests across 76 files.

## User Preferences
- **Calculations first.** 1,546-test proof system must always pass.
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

### Marcela AI — Multi-Channel Conversational Assistant
Marcela operates across web (text + voice), phone (Twilio Voice), and SMS (Twilio SMS). All settings managed from Admin > Marcela tab. See `.claude/claude.md` § Marcela AI for full details.

- **Web:** GPT-4.1 streaming, ElevenLabs STT/TTS, AudioWorklet playback, voice state machine with barge-in
- **Phone:** Twilio Voice webhook + WebSocket Media Stream, mulaw 8kHz ↔ PCM conversion
- **SMS:** Twilio SMS webhook, 1600-char auto-split, TwiML reply
- **RAG:** In-memory embeddings (OpenAI `text-embedding-3-small`), lazy indexing, cosine similarity retrieval
- **Admin:** Voice/LLM/telephony/knowledge base settings in MarcelaTab

### Branding Architecture
User → User Group → Default hierarchy. See `.claude/claude.md` § Branding Architecture.

### Financial Engine
GAAP-compliant calculation engine with 22 computation tools, typed dispatch, zero `any` types. See `.claude/skills/finance/SKILL.md`.

### Admin Page (11 tabs)
Modular tab components, each split into sub-component directories:
- `activity/` — ActivityLogList, ActivityFeed, CheckerActivity
- `marcela/` — VoiceSettings, LLMSettings, TelephonySettings, KnowledgeBase
- `verification/` — VerificationResults, VerificationHistory, AIReviewPanel, DesignCheckPanel
- Standalone tabs: Users, Companies, User Groups, Logos, Branding, Themes, Navigation, Database
See `.claude/skills/admin/SKILL.md`.

### Server Architecture (Modular)
- **Storage:** `server/storage/` — domain modules: users, properties, financial, admin, activity, research. Composed via `DatabaseStorage` class in index.ts. Thin re-export at `server/storage.ts`.
- **Seeds:** `server/seeds/` — domain modules: users, properties, branding, research. Orchestrated by index.ts. Thin re-export at `server/seed.ts`.
- **Routes:** `server/routes/admin/` — sub-modules: users, tools, marcela. Registered via index.ts. Thin re-export at `server/routes/admin.ts`.
- **Calculation Checker:** `server/calculation-checker/` — sub-modules: property-checks, gaap-checks, portfolio-checks, types. Thin re-export at `server/calculationChecker.ts`.
- 11 route modules: `auth`, `properties`, `admin`, `global-assumptions`, `branding`, `scenarios`, `research`, `property-finder`, `calculations`, `uploads`, `twilio`.

### Client Architecture (Modular)
- **API:** `client/src/lib/api/` — domain modules: properties, admin, research, scenarios, types. Re-exported from `client/src/lib/api.ts`.
- **AI Chat:** `client/src/components/ai-chat/` — types, hooks (useChat, useVoice), ChatMessages, ChatInput, ChatHeader. Re-exported from AIChatWidget.tsx.
- **Excel Export:** `client/src/lib/exports/excel/` — property-sheets, portfolio-sheet, helpers, types. Re-exported from excelExport.ts.
- **Checker Manual:** `client/src/pages/checker-manual/` — types, constants, hooks, TableOfContents, ManualContent. Re-exported from CheckerManual.tsx.

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
npm run test:summary   # 1,546 tests, 1-line output
npm run verify:summary # 6-phase verification, compact
npm run stats          # Codebase metrics
npm run audit:quick    # Quick code quality scan
```

## Documentation Structure
```
.claude/
├── claude.md              # Master doc (always loaded)
├── rules/ (24 files)      # Enforceable constraints
├── skills/ (119 files)    # Implementation knowledge
├── tools/ (47 files)      # Tool schemas
├── manuals/               # Checker + user manuals
├── commands/              # Slash commands
└── scripts/               # SQL utilities
```
