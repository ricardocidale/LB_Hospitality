---
name: marcela-ai
description: AI Agent (configurable name, default "Marcela") multi-channel conversational assistant. Covers architecture, system prompts, audio pipeline, RAG knowledge base, ElevenLabs Conversational AI integration, and admin configuration.
status: UPDATED (March 6, 2026)
---

# AI Agent (Marcela) — Entry Point

## Purpose
Documents the complete AI assistant system operating across web (ElevenLabs Conversational AI widget), phone (Twilio Voice), and SMS (Twilio SMS). The assistant name is configurable via `aiAgentName` in `global_assumptions` (default: "Marcela"). All UI references use the dynamic name; internal DB columns retain `marcela_*` naming.

## Naming Convention
- **UI/user-facing**: Uses `agentName` from `global_assumptions.aiAgentName` (e.g., "Marcela", "Concierge")
- **DB columns**: `marcela_*` (kept for migration safety)
- **Server files**: `marcela-*` (kept for import stability)
- **Constants**: `DEFAULT_AI_AGENT_NAME` in `shared/constants.ts` (aliased from `DEFAULT_MARCELA_AGENT_ID` etc.)

## Channel Matrix
| Channel | Technology | Key Files |
|---------|-----------|-----------|
| Web | ElevenLabs Conversational AI widget (`@elevenlabs/convai-widget-core`) | `client/src/components/ElevenLabsWidget.tsx`, `server/routes/admin/marcela.ts` |
| Phone | Twilio Voice + WebSocket Media Stream | `server/routes/twilio.ts` |
| SMS | Twilio SMS webhook | `server/routes/twilio.ts` |

## Sub-Skills
| File | What It Covers |
|------|---------------|
| `marcela-architecture.md` | Channel matrix, file map, system prompts, context injection, DB schema, admin config, integration credentials |
| `audio-pipeline.md` | Phone voice pipeline (Twilio Media Streams), audio conversion, ElevenLabs STT/TTS |
| `ai-agent-admin.md` | Feature module structure (hooks/, types.ts, components/, ElevenLabsWidget), re-export barrels, widget variants, AgentState collision |
| `elevenlabs-ui-components.md` | All 17 ElevenLabs UI components — props, imports, usage examples |
| `voice-ux-patterns.md` | Voice state machine, WaveformVisualizer, VoiceStateIndicator, barge-in, error retry, channel badges |
| `.claude/skills/elevenlabs-widget/SKILL.md` | Web widget: signed URL flow, admin config, gating logic, voice IDs |

## Key Files

### Server
| File | Purpose |
|------|---------|
| `server/routes/admin/marcela.ts` | Admin settings API, signed URL endpoint, ConvAI proxy endpoints |
| `server/routes/twilio.ts` | Phone+SMS webhooks, WebSocket Media Stream |
| `server/routes/marcela-tools.ts` | Server tools for ElevenLabs agent (6 endpoints, deterministic financials via `computePropertyMetrics()`) |
| `server/integrations/elevenlabs.ts` | ElevenLabs API key, STT, streaming TTS, ConvAI helpers |
| `server/marcela-agent-config.ts` | Agent configuration builder (tools, KB, settings) |
| `server/marcela-knowledge-base.ts` | RAG knowledge base (in-memory embeddings, ElevenLabs KB push) |
| `server/knowledge-base.ts` | Core RAG engine (embeddings, cosine similarity) |

### Client
| File | Purpose |
|------|---------|
| `client/src/features/ai-agent/ElevenLabsWidget.tsx` | Web chat widget — source of truth (barrel at `components/ElevenLabsWidget.tsx`) |
| `client/src/features/ai-agent/types.ts` | VoiceSettings, TwilioStatus, TTS_MODELS, LLM_MODELS — source of truth |
| `client/src/features/ai-agent/hooks/` | All React Query hooks — source of truth (barrel at `admin/marcela/hooks.ts`) |
| `client/src/features/ai-agent/components/` | All 17 ElevenLabs UI components — source of truth (barrels at `components/ui/`) |
| `client/src/components/Layout.tsx` | `MarcelaWidgetGated` gating component |
| `client/src/components/admin/marcela/MarcelaTab.tsx` | Admin 7-tab dashboard (General, Prompt, Voice, LLM, Tools, KB, Telephony) |
| `client/src/components/admin/marcela/PromptEditor.tsx` | System prompt, first message, language editor |
| `client/src/components/admin/marcela/ToolsStatus.tsx` | 18-tool status display (12 client + 6 server) |
| `client/src/components/admin/marcela/KnowledgeBase.tsx` | RAG index, ElevenLabs KB push, file upload |
| `client/src/components/admin/marcela/VoiceSettings.tsx` | ElevenLabs TTS/STT model settings |
| `client/src/components/admin/marcela/LLMSettings.tsx` | LLM model + token limits |
| `client/src/components/admin/marcela/TelephonySettings.tsx` | Twilio phone/SMS config |

### Shared
| File | Purpose |
|------|---------|
| `shared/constants.ts` | `DEFAULT_AI_AGENT_NAME`, `DEFAULT_MARCELA_*` constants |
| `shared/schema.ts` | `global_assumptions` table with `aiAgentName` + all `marcela_*` columns |

## Admin Tab — 7-Tab Dashboard
| Tab | Component | Purpose |
|-----|-----------|---------|
| General | `MarcelaTab.tsx` (inline) | Agent name, Agent ID, enable/disable toggles, status indicators |
| Prompt | `PromptEditor.tsx` | Edit system prompt, first message, language; saves directly to ElevenLabs |
| Voice | `VoiceSettings.tsx` | Voice ID, TTS/STT models, stability, similarity, speaker boost, chunk schedule |
| LLM | `LLMSettings.tsx` | Model selection, max tokens (text/voice) |
| Tools | `ToolsStatus.tsx` | All 18 tools with registration status, sync button |
| Knowledge Base | `KnowledgeBase.tsx` | RAG reindex, ElevenLabs KB push, file upload |
| Telephony | `TelephonySettings.tsx` | Twilio enable/disable, phone greeting, webhook URLs, connection status |

## Server Tool Endpoints (`server/routes/marcela-tools.ts`)

Rewritten to use `computePropertyMetrics()` from `calc/research/property-metrics.ts` for deterministic financial snapshots. The `computeSnapshot()` helper calls `computePropertyMetrics()` per property, ensuring the agent gets exact numbers (not LLM estimates).

| Endpoint | Purpose |
|----------|---------|
| `GET /api/marcela-tools/properties` | List all properties with deterministic financial snapshots (RevPAR, revenue, GOP, NOI, margins, valuation, debt metrics) |
| `GET /api/marcela-tools/property/:id` | Single property detail with full financials |
| `GET /api/marcela-tools/portfolio-summary` | Aggregated portfolio metrics |
| `GET /api/marcela-tools/scenarios` | Saved scenarios |
| `GET /api/marcela-tools/global-assumptions` | Current model assumptions |
| `GET /api/marcela-tools/navigation` | Sidebar navigation configuration |

All endpoints use correct schema field names and return structured JSON consumable by the ElevenLabs agent's server tools.

## Context Loading Guide

The Marcela/ElevenLabs feature spans ~17,100 lines of source + ~4,200 lines of docs. Load only what each task needs.

### Always Load First (~450 lines total)
1. **This file** — feature overview + file map
2. `client/src/features/ai-agent/types.ts` (109 lines) — all shared types, constants
3. `client/src/features/ai-agent/index.ts` (9 lines) — barrel exports
4. `shared/constants.ts` — grep for `DEFAULT_MARCELA` to find defaults

### Large Files — Load Only When Needed
| File | Lines | Load only when... |
|------|------:|-------------------|
| `client/src/features/ai-agent/components/waveform.tsx` | 1,658 | Modifying waveform visualization |
| `client/src/features/ai-agent/Speaker.tsx` | 1,381 | Modifying TTS playback/streaming |
| `client/src/features/ai-agent/RealtimeTranscriber.tsx` | 785 | Modifying STT/live transcription |
| `server/ai/knowledge-base.ts` | 726 | Modifying KB sync with ElevenLabs API |
| `client/src/features/ai-agent/components/matrix.tsx` | 612 | Modifying matrix visual effect |
| `server/ai/marcela-knowledge-base.ts` | 465 | Modifying what data goes into KB |
| `server/routes/twilio.ts` | 349 | Modifying phone/SMS webhooks or WebSocket stream |
| `server/integrations/elevenlabs.ts` | 305 | Changing voice config or system prompts |
| `server/ai/marcela-agent-config.ts` | 242 | Adding/changing agent tools or prompts |

### Task → File Routing
| Task | Files to load |
|------|--------------|
| Change voice/audio settings | `server/integrations/elevenlabs.ts`, `shared/schema.ts` (marcela columns), `types.ts` |
| Add/change agent tools | `server/ai/marcela-agent-config.ts` only |
| Change system prompt | `server/integrations/elevenlabs.ts` only |
| Fix waveform/orb/visual | The specific component file only |
| KB sync issue | `server/ai/knowledge-base.ts` + `marcela-knowledge-base.ts` |
| Telephony/Twilio (voice) | `server/routes/twilio.ts` + `server/integrations/twilio.ts` + `server/integrations/elevenlabs-audio.ts` |
| Telephony/Twilio (SMS) | `server/routes/twilio.ts` (SMS webhook section) |
| Admin UI settings | `.claude/skills/marcela-ai/ai-agent-admin.md` + the specific admin tab component |
| Audio codec issue | `server/integrations/elevenlabs-audio.ts` (133 lines) only |
| STT/speech input | `RealtimeTranscriber.tsx` + `components/speech-input.tsx` |
| Widget variants | `VoiceChatOrb.tsx`, `VoiceChatFull.tsx`, or `VoiceChatBar.tsx` (one at a time) |
| Voice settings (PATCH API) | `.claude/skills/elevenlabs-widget/SKILL.md` § PATCH Agent Voice |
| Twilio admin/setup | `.claude/skills/twilio-telephony/admin-config.md` + `twilio-console-setup.md` |

### Key Facts (no file load needed)
- `AgentState` name collision in `features/ai-agent/components/index.ts` — use explicit `export { Orb }` not `export *`
- `VoiceChatBar` uses signed URL (not bare `agentId`) — fetched on mount via `useAdminSignedUrl()`
- Admin DB columns keep `marcela_*` names; only UI labels use dynamic `aiAgentName`
- All 35 `marcela_*` schema columns map 1:1 to `VoiceSettings` interface in `types.ts`
- `buildVoiceConfigFromDB(ga)` in `elevenlabs.ts` hydrates server-side `VoiceConfig` from DB row
- PATCH voice settings use flattened payload (see `elevenlabs-widget/SKILL.md` § PATCH Agent Voice)

### What NOT to Load
- `.claude/tools/marcela/` JSON schemas — only needed for adding new tools
- `.claude/skills/elevenlabs/docs/` folder — raw API reference, rarely needed (our skills cover it)
- `node_modules/@elevenlabs/` — never needed, use skill docs instead
- The full `elevenlabs-ui-components.md` (455 lines) — use targeted grep instead

## Related Tools
- `.claude/tools/marcela/elevenlabs-widget-config.json` — Widget attributes, auth flow, gating, modality modes
- `.claude/tools/marcela/elevenlabs-sdk-reference.json` — React useConversation hook, callbacks, methods, state
- `.claude/tools/marcela/elevenlabs-convai-api.json` — Conversational AI REST API endpoints (including admin proxy routes)
- `.claude/tools/marcela/elevenlabs-agent-tools.json` — Client/Server/MCP/System tool schemas
- `.claude/tools/marcela/voice-config.json` — Voice settings defaults and DB mapping
- `.claude/tools/marcela/voice-config-validator.json` — Voice config validation

## Related Rules
- `rules/documentation.md` — Source-of-truth hierarchy
- `rules/api-routes.md` — API route conventions
- `rules/context-reduction.md` — Skills, helpers, and tools required for every feature
- `rules/no-hardcoded-admin-config.md` — No hardcoded admin configuration values
