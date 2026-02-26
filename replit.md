# Hospitality Business Group - Business Simulation Portal

## Overview
The Hospitality Business Group project is a sophisticated business simulation portal designed for the hospitality industry. Its core purpose is to provide a comprehensive platform for financial modeling, property management, and investment analysis within the hospitality sector. The system enables users to simulate and analyze the financial performance of individual properties and entire portfolios, manage branding, and administer user access. Key capabilities include detailed financial calculations, AI-powered image generation, voice interaction with an AI assistant, and robust data seeding for production environments. The project aims to deliver a premium, graphics-rich user experience with transparent calculation methodologies, catering to investors, partners, and administrators in the hospitality domain.

## User Preferences
- **Calculations first.** 1,529-test proof system must always pass.
- **Graphics-rich pages.** Charts, animations, visual elements everywhere.
- **No hardcoded values.** Financial assumptions and admin config from DB or named constants.
- **Full recalculation on save.** No partial query invalidation.
- **Context reduction mandatory.** Every refactor/feature must produce skills, helpers, scripts, and tools to reduce future context needs.
- **Premium design always.** Every page must look $50K+ bespoke — animated numbers, micro-interactions, depth, staggered reveals, skeleton loading. Never generic AI-template design.
- **Rule compliance on audits.** Check all `.claude/rules/` every audit.
- **Session memory.** Update `session-memory.md` every session. Read it first.
- **Docs after edits.** `.claude` docs and `replit.md` harmonized after code changes.
- **"Save" not "Update"** on all buttons.
- **Role-based access.** Investors cannot access Management Company pages, Systemwide Assumptions, Property Finder, Analysis, or Scenarios. Enforced via `hasManagementAccess` (sidebar) + `ManagementRoute` (route guard). Ricardo Cidale is sole Admin; all others are Partners (not investors in current seed).
- Company: "Hospitality Business Group". All UI references a theme. Skills under `.claude/`.

## System Architecture

### Branding Architecture
The system employs a hierarchical branding structure: User → User Group → Default. Design themes are standalone entities, each with an `isDefault` flag. User Groups define company branding attributes like `companyName`, `logoId`, `themeId`, and `assetDescriptionId`. Users inherit branding from their assigned User Group, with administration handled at the group level.

### Voice Conversation (Marcela AI)
Integrated into `AIChatWidget.tsx`, enabling voice interaction.
- **LLM:** GPT-4.1, with voice-specific system prompt adjustments for concise and natural speech.
- **Admin Voice:** Admin conversations include specific system prompt adjustments for capabilities like user management, verification, activity logs, branding, and database access.
- **Audio Pipeline:** Browser MediaRecorder (WebM/Opus) → server ffmpeg conversion → STT → LLM streaming → TTS WebSocket → SSE audio chunks → client AudioWorklet playback.
- **Server Endpoint:** `POST /api/conversations/:id/voice` accepts base64 audio and returns an SSE stream.
- **Client Hooks:** `useVoiceRecorder` for recording and `useAudioPlayback` for PCM16 playback.

### AI Image Generation
- **Reusable Component:** `client/src/components/ui/ai-image-picker.tsx` supports upload, AI generation, and URL input.
- **Property-specific Wrapper:** `client/src/features/property-images/PropertyImagePicker.tsx`.
- **AnimatedLogo:** `client/src/components/ui/animated-logo.tsx` for scalable and animated SVG logos.
- **Server Endpoint:** `POST /api/generate-property-image` generates and uploads images, returning an `objectPath`.

### Modular UI/UX Design
The UI emphasizes modularity and refactoring of monolithic pages into smaller, maintainable components.
- **Admin Pages:** Refactored into 10 standalone tab components within a light shell, each managing its own data fetching and state. Includes sections for Users, Companies, Activity, Verification, User Groups, Customize (Branding, Themes, Logos, Navigation), and Database.
- **Property Pages:** Refactored into organized components and shells for `PropertyEdit`, `PropertyDetail`, `PropertyFinder`, `Portfolio`, and `PropertyMarketResearch`. Each section or component handles specific data and functionalities.
- **Management Company Pages:** Restructured into shells and components for `Company`, `CompanyAssumptions`, and `CompanyResearch`, providing detailed financial statements, assumption management, and research capabilities.
- **Dashboard:** Refactored into a shell and 7 components for a comprehensive overview, income statements, cash flow, balance sheets, and investment analysis, with consolidated financial reporting.
- **Settings Page:** Refactored into a shell and 4 tab components for managing portfolio, macro assumptions, AI model settings, and industry research.
- **Methodology Page:** Refactored for better organization with a shell and components for table of contents and collapsible sections, including GAAP rules and audit opinions.

### Financial Audit Module Architecture
The audit system in `client/src/lib/audits/` is split into 9 focused modules:
- `types.ts` — shared `AuditFinding`, `AuditSection`, `AuditReport` interfaces
- `helpers.ts` — tolerance constants, comparison helpers, finding builders
- `auditTiming.ts` — acquisition/disposition timing validation
- `auditDepreciation.ts` — depreciation schedule and method checks
- `auditAmortization.ts` — loan amortization balance verification
- `auditIncomeStatement.ts` — revenue, expense, NOI validation
- `auditManagementFees.ts` — base/incentive fee calculation checks
- `auditBalanceSheet.ts` — A=L+E identity, accumulated depreciation
- `auditCashFlow.ts` — cash flow reconciliation and DSCR checks
- `index.ts` — barrel export

The orchestrator at `client/src/lib/financialAuditor.ts` (~177 lines) imports all modules and runs the full audit pipeline.

### Computation Dispatch (calc/dispatch.ts)
Dynamic dispatch for 12 financial computation tools using typed wrappers (`withRounding`, `wrap`) that safely bridge generic `ToolInput` to specific typed handler signatures. Zero `any` types in finance code.

### Server Route Architecture
Server routes have been refactored from a monolithic structure into 10 distinct route modules, each exporting a `register(app, storage)` function. Modules include `auth`, `properties`, `admin`, `global-assumptions`, `branding`, `scenarios`, `research`, `property-finder`, `calculations`, and `uploads`. Shared middleware are defined in `helpers.ts`.

### Calculation Transparency
- **Formula Accordions:** Toggles in Systemwide Assumptions > Other tab (`showCompanyCalculationDetails`, `showPropertyCalculationDetails`) control the visibility of detailed formulas for Management Company and Property reports.
- **Consolidated Statements:** Utilize a 3-level accordion for consolidated totals, weighted formulas, and per-property breakdowns.
- **Seed Script:** A comprehensive `script/seed-production.sql` ensures idempotent seeding of 11 persistent tables with `ON CONFLICT DO NOTHING`.

## External Dependencies
- **Speech-to-Text (STT):** ElevenLabs Scribe v1 via `server/integrations/elevenlabs.ts`.
- **Text-to-Speech (TTS):** ElevenLabs WebSocket streaming (Jessica voice, `eleven_flash_v2_5` model).
- **Large Language Model (LLM):** GPT-4.1.
- **AI Image Generation:** Nano Banana (`gemini-2.5-flash-image`) via Gemini AI Integrations (primary); OpenAI `gpt-image-1` (fallback).
- **Database:** PostgreSQL (implied by `npm run db:push` and `script/seed-production.sql`).
- **Object Storage:** Used for storing generated property images.
- **FFmpeg:** Utilized on the server for audio conversion in the voice pipeline.