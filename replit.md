# Hospitality Business Group - Business Simulation Portal

> **Master documentation:** `.claude/claude.md` — always the authority. This file is a slim summary. If conflicts, `.claude/claude.md` wins.

## Overview
Business simulation portal for the hospitality industry. Financial modeling, property management, investment analysis, and AI-powered assistant (Marcela). GAAP-compliant (ASC 230, ASC 360, ASC 470) with IRS depreciation rules and independent audit/verification engine.

**Codebase:** 404 source files, ~71,500 lines, 1,529 tests across 72 files.

## User Preferences
- **Calculations first.** 1,529-test proof system must always pass.
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
GAAP-compliant calculation engine with 12 computation tools, typed dispatch, zero `any` types. See `.claude/skills/finance/SKILL.md`.

### Admin Page (10 tabs)
Refactored into standalone tab components: Users, Companies, Activity, Verification, User Groups, Logos, Branding, Themes, Navigation, Marcela, Database. See `.claude/skills/admin/SKILL.md`.

### Server Route Architecture
11 route modules: `auth`, `properties`, `admin`, `global-assumptions`, `branding`, `scenarios`, `research`, `property-finder`, `calculations`, `uploads`, `twilio`. Twilio also exports `registerTwilioWebSocket()`.

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
npm run test:summary   # 1,529 tests, 1-line output
npm run verify:summary # 4-phase verification, compact
npm run stats          # Codebase metrics
npm run audit:quick    # Quick code quality scan
```

## Documentation Structure
```
.claude/
├── claude.md              # Master doc (always loaded)
├── rules/ (21 files)      # Enforceable constraints
├── skills/ (114 files)    # Implementation knowledge
├── tools/ (43 files)      # Tool schemas
├── manuals/               # Checker + user manuals
├── commands/              # Slash commands
└── scripts/               # SQL utilities
```
