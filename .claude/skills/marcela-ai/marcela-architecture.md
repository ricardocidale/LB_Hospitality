---
name: marcela-architecture
description: Complete AI Agent (Marcela) architecture across web, phone, and SMS channels. Reference for maintenance and extensions.
status: UPDATED (March 6, 2026)
---

# AI Agent (Marcela) — Multi-Channel Conversational Assistant

## Overview
The AI agent (configurable name, default "Marcela") is the AI assistant for Hospitality Business Group, operating across three channels: web (text + voice), phone (Twilio Voice), and SMS (Twilio SMS). All settings are managed from Admin > AI Agent tab.

## Naming
- **UI**: Dynamic name from `global_assumptions.aiAgentName` (default "Marcela")
- **DB**: Columns retain `marcela_*` prefix for migration safety
- **Constants**: `DEFAULT_AI_AGENT_NAME` in `shared/constants.ts`

## Channel Matrix

| Channel | Entry Point | Auth | LLM | Voice | DB Channel |
|---------|-------------|------|-----|-------|------------|
| Web (ElevenLabs) | `<elevenlabs-convai url={signedUrl}>` widget | Signed URL | ElevenLabs-managed | ElevenLabs ConvAI | via widget |
| Phone | `POST /api/twilio/voice/incoming` → WebSocket `/api/twilio/voice/stream` | Caller ID lookup | GPT-4.1 streaming | STT+TTS via Twilio Media Stream | `"phone"` |
| SMS | `POST /api/twilio/sms/incoming` | Phone lookup | GPT-4.1 (non-streaming) | No | `"sms"` |

## File Map

### Server
| File | Purpose |
|------|---------|
| `server/routes/admin/marcela.ts` | Admin settings API, signed URL, ConvAI proxy endpoints (prompt, tools, KB upload) |
| `server/routes/twilio.ts` | Phone+SMS webhooks, WebSocket Media Stream handler, audio conversion |
| `server/routes/marcela-tools.ts` | 6 server tool endpoints for ElevenLabs agent |
| `server/integrations/elevenlabs.ts` | ElevenLabs API key, STT, streaming TTS, ConvAI API helpers |
| `server/integrations/twilio.ts` | Twilio client, phone number, status check, sendSMS helper |
| `server/marcela-agent-config.ts` | Agent configuration builder (tools, settings) |
| `server/marcela-knowledge-base.ts` | Knowledge base builder, ElevenLabs KB push |
| `server/knowledge-base.ts` | Core RAG engine (in-memory embeddings, cosine similarity) |

### Client
| File | Purpose |
|------|---------|
| `client/src/components/ElevenLabsWidget.tsx` | ElevenLabs Conversational AI web component, 12 client tools |
| `client/src/components/Layout.tsx` | `MarcelaWidgetGated` — gates widget on settings + tour state |
| `client/src/components/admin/marcela/MarcelaTab.tsx` | Admin 7-tab dashboard |
| `client/src/components/admin/marcela/PromptEditor.tsx` | System prompt, first message, language editor |
| `client/src/components/admin/marcela/ToolsStatus.tsx` | 18-tool status dashboard |
| `client/src/components/admin/marcela/KnowledgeBase.tsx` | RAG reindex + ElevenLabs KB push + file upload |
| `client/src/components/admin/marcela/VoiceSettings.tsx` | Voice ID, TTS/STT model settings |
| `client/src/components/admin/marcela/LLMSettings.tsx` | LLM model + token limits |
| `client/src/components/admin/marcela/TelephonySettings.tsx` | Twilio phone/SMS config |
| `client/src/components/admin/marcela/hooks.ts` | React Query hooks for all admin operations |
| `client/src/components/admin/marcela/types.ts` | Shared TypeScript interfaces |

## System Prompts

### ElevenLabs Agent Prompt
Managed via Admin > AI Agent > Prompt tab. Saved directly to ElevenLabs via `PATCH /api/admin/convai/agent/prompt`. Covers:
- Agent persona (warm, confident, sharp strategist)
- Hospitality expertise domains
- Full platform knowledge
- User role descriptions (Admin, Partner, Checker, Investor)
- **CRITICAL: No LLM Calculations rule** — Agent must NEVER compute financial values

### Channel Additions (Phone/SMS)
- `VOICE_SYSTEM_PROMPT_ADDITION` — concise spoken responses, no markdown, natural numbers
- `PHONE_SYSTEM_PROMPT_ADDITION` — very brief (1-3 sentences), phone-friendly transitions
- `SMS_SYSTEM_PROMPT_ADDITION` — under 300 chars, plain text, direct and actionable
- `ADMIN_SYSTEM_PROMPT_ADDITION` — admin capabilities: user mgmt, verification, branding, database

### Context Injection
`buildContextPrompt(userId)` fetches live data from DB:
- Portfolio assumptions (company name, projection years, inflation, management fees)
- All properties (name, rooms, ADR, location, purchase price)
- Team members (name, email, role, title)
- Latest AI research reports (market data, cap rates, ADR analysis)

## Database Schema

### `global_assumptions` table (AI Agent columns)
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `aiAgentName` | text | `Marcela` | Configurable assistant name |
| `marcelaAgentId` | text | - | ElevenLabs Conversational AI Agent ID |
| `marcelaVoiceId` | text | `cgSgspJ2msm6clMCkdW9` | ElevenLabs voice ID (Jessica) |
| `marcelaTtsModel` | text | `eleven_flash_v2_5` | TTS model |
| `marcelaSttModel` | text | `scribe_v1` | STT model |
| `marcelaOutputFormat` | text | `pcm_16000` | Audio output format |
| `marcelaStability` | real | `0.5` | Voice stability |
| `marcelaSimilarityBoost` | real | `0.8` | Voice similarity |
| `marcelaSpeakerBoost` | boolean | `false` | Speaker boost toggle |
| `marcelaChunkSchedule` | text | `120,160,250,290` | TTS chunk schedule (CSV) |
| `marcelaLlmModel` | text | `gpt-4.1` | LLM model name |
| `marcelaMaxTokens` | integer | `2048` | Max tokens (text) |
| `marcelaMaxTokensVoice` | integer | `1024` | Max tokens (voice) |
| `marcelaTwilioEnabled` | boolean | `false` | Phone calls enabled |
| `marcelaSmsEnabled` | boolean | `false` | SMS enabled |
| `marcelaPhoneGreeting` | text | `Hello, this is Marcela...` | Phone greeting |

## Authentication

### Web Channel
Widget uses signed URL from `GET /api/marcela/signed-url` (requires session cookie auth).

### Twilio Channels
Twilio webhooks are public (added to `PUBLIC_API_PATHS` in `server/index.ts`):
- `/api/twilio/voice/incoming`
- `/api/twilio/voice/status`
- `/api/twilio/sms/incoming`

Caller identity resolved by matching `req.body.From` against `users.phoneNumber`.

## Admin Configuration (7-Tab Dashboard)
All AI Agent settings are managed via Admin > AI Agent tab (`MarcelaTab.tsx`):
1. **General** — Agent name, Agent ID, enable/disable toggles
2. **Prompt** — System prompt, first message, language (saves directly to ElevenLabs)
3. **Voice & Audio** — Voice ID, TTS/STT models, stability, similarity, speaker boost, chunk schedule
4. **LLM** — Model selection, max tokens (text/voice)
5. **Tools** — 18-tool status display (12 client + 6 server), sync button
6. **Knowledge Base** — RAG reindex, ElevenLabs KB push, file upload
7. **Telephony & SMS** — Enable/disable toggles, phone greeting, webhook URLs, connection status

Settings persist to `global_assumptions` table and are read by all channels at request time.

## Integration Credentials
- **OpenAI**: `AI_INTEGRATIONS_OPENAI_API_KEY` + `AI_INTEGRATIONS_OPENAI_BASE_URL` (Replit AI integration)
- **ElevenLabs**: Via Replit connector (`REPLIT_CONNECTORS_HOSTNAME`)
- **Twilio**: Via Replit connector (account SID, API key, API key secret, phone number)
