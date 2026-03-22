The AI agent architecture and research pipeline. Covers Marcela's role, voice interaction via ElevenLabs Convai, dual-channel tool system, knowledge base, market research workflow, ICP-driven research, and admin configuration. Use this skill when working on AI features, research, voice interaction, or knowledge base management.

## Overview

AI assistant operating across web (ElevenLabs Conversational AI widget), phone (Twilio Voice), and SMS (Twilio SMS). The assistant name is configurable via `aiAgentName` in `global_assumptions` (default: "Marcela"). All UI references use the dynamic name; internal DB columns retain `marcela_*` naming.

**Critical boundary:** Marcela never computes financial values — all calculations come from the deterministic engine via `computePropertyMetrics()`.

## Naming Convention

- **UI/user-facing**: Uses `agentName` from `global_assumptions.aiAgentName`
- **DB columns**: `marcela_*` (kept for migration safety)
- **Server files**: `marcela-*` (kept for import stability)
- **Constants**: `DEFAULT_AI_AGENT_NAME` in `shared/constants.ts`

## Channel Matrix

| Channel | Technology | Key Files |
|---------|-----------|-----------|
| Web | ElevenLabs Conversational AI widget | `client/src/features/ai-agent/ElevenLabsWidget.tsx`, `server/routes/admin/marcela.ts` |
| Phone | Twilio Voice + WebSocket Media Stream | `server/routes/twilio.ts` |
| SMS | Twilio SMS webhook | `server/routes/twilio.ts` |

## Server Tool Endpoints (`server/routes/marcela-tools.ts`)

Uses `computePropertyMetrics()` from `calc/research/property-metrics.ts` for deterministic financial snapshots.

| Endpoint | Purpose |
|----------|---------|
| `GET /api/marcela-tools/properties` | List all properties with financial snapshots |
| `GET /api/marcela-tools/property/:id` | Single property detail with full financials |
| `GET /api/marcela-tools/portfolio-summary` | Aggregated portfolio metrics |
| `GET /api/marcela-tools/scenarios` | Saved scenarios |
| `GET /api/marcela-tools/global-assumptions` | Current model assumptions |
| `GET /api/marcela-tools/navigation` | Sidebar navigation configuration |

## Admin Tab — 7-Tab Dashboard

| Tab | Component | Purpose |
|-----|-----------|---------|
| General | `MarcelaTab.tsx` (inline) | Agent name, Agent ID, enable/disable toggles |
| Prompt | `PromptEditor.tsx` | System prompt, first message, language |
| Voice | `VoiceSettings.tsx` | Voice ID, TTS/STT models, stability, similarity |
| LLM | `LLMSettings.tsx` | Model selection, max tokens |
| Tools | `ToolsStatus.tsx` | All 18 tools with registration status |
| Knowledge Base | `KnowledgeBase.tsx` | RAG reindex, ElevenLabs KB push, file upload |
| Telephony | `TelephonySettings.tsx` | Twilio enable/disable, phone greeting, webhooks |

## Key Files

### Server
| File | Purpose |
|------|---------|
| `server/routes/admin/marcela.ts` | Admin settings API, signed URL endpoint |
| `server/routes/twilio.ts` | Phone+SMS webhooks, WebSocket Media Stream |
| `server/routes/marcela-tools.ts` | Server tools (6 endpoints, deterministic financials) |
| `server/integrations/elevenlabs.ts` | ElevenLabs API key, STT, streaming TTS |
| `server/ai/marcela-agent-config.ts` | Agent configuration builder |
| `server/ai/marcela-knowledge-base.ts` | RAG knowledge base |

### Client
| File | Purpose |
|------|---------|
| `client/src/features/ai-agent/ElevenLabsWidget.tsx` | Web chat widget (source of truth) |
| `client/src/features/ai-agent/types.ts` | VoiceSettings, TwilioStatus, models |
| `client/src/features/ai-agent/hooks/` | All React Query hooks |
| `client/src/components/admin/marcela/MarcelaTab.tsx` | Admin 7-tab dashboard |

### Shared
| File | Purpose |
|------|---------|
| `shared/constants.ts` | `DEFAULT_AI_AGENT_NAME`, `DEFAULT_MARCELA_*` constants |
| `shared/schema/config.ts` | `global_assumptions` table with `aiAgentName` + all `marcela_*` columns |

## Key Facts

- `AgentState` name collision in `features/ai-agent/components/index.ts` — use explicit `export { Orb }` not `export *`
- `VoiceChatBar` uses signed URL (not bare `agentId`) — fetched on mount via `useAdminSignedUrl()`
- Admin DB columns keep `marcela_*` names; only UI labels use dynamic `aiAgentName`
- All 35 `marcela_*` schema columns map 1:1 to `VoiceSettings` interface in `types.ts`

## Task -> File Routing

| Task | Files to load |
|------|--------------|
| Change voice/audio settings | `server/integrations/elevenlabs.ts`, `shared/schema/config.ts`, `types.ts` |
| Add/change agent tools | `server/ai/marcela-agent-config.ts` |
| Fix waveform/orb/visual | The specific component file only |
| KB sync issue | `server/ai/knowledge-base.ts` + `marcela-knowledge-base.ts` |
| Telephony/Twilio | `server/routes/twilio.ts` + `server/integrations/twilio.ts` |
| Admin UI settings | The specific admin tab component |
