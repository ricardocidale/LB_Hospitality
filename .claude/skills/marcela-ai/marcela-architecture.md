---
name: marcela-architecture
description: Complete Marcela AI assistant architecture across web, phone, and SMS channels. Reference for maintenance and extensions.
status: COMPLETED (February 26, 2026)
---

# Marcela AI — Multi-Channel Conversational Assistant

## Overview
Marcela is the AI assistant for Hospitality Business Group, operating across three channels: web (text + voice), phone (Twilio Voice), and SMS (Twilio SMS). All settings are managed from Admin > Marcela tab.

## Channel Matrix

| Channel | Entry Point | Auth | LLM | Voice | DB Channel |
|---------|-------------|------|-----|-------|------------|
| Web Text | `POST /api/conversations/:id/messages` | Session cookie | GPT-4.1 streaming | No | `"web"` |
| Web Voice | `POST /api/conversations/:id/voice` | Session cookie | GPT-4.1 streaming | STT+TTS via SSE | `"web"` |
| Phone | `POST /api/twilio/voice/incoming` → WebSocket `/api/twilio/voice/stream` | Caller ID lookup | GPT-4.1 streaming | STT+TTS via Twilio Media Stream | `"phone"` |
| SMS | `POST /api/twilio/sms/incoming` | Phone lookup | GPT-4.1 (non-streaming) | No | `"sms"` |

## File Map

### Server
| File | Lines | Purpose |
|------|-------|---------|
| `server/replit_integrations/chat/routes.ts` | ~500 | Web text+voice endpoints, system prompts, context builder |
| `server/replit_integrations/chat/storage.ts` | ~100 | Chat DB operations (conversations + messages tables) |
| `server/routes/twilio.ts` | ~464 | Phone+SMS webhooks, WebSocket Media Stream handler, audio conversion |
| `server/integrations/elevenlabs.ts` | ~157 | ElevenLabs STT, streaming TTS WebSocket, voice config builder |
| `server/integrations/twilio.ts` | ~91 | Twilio client, phone number, status check, sendSMS helper |
| `server/routes/admin.ts` | varies | `/api/admin/twilio-status`, `/api/admin/send-notification` |

### Client
| File | Lines | Purpose |
|------|-------|---------|
| `client/src/components/AIChatWidget.tsx` | ~825 | Chat widget with voice, channel badges, state machine |
| `client/src/components/admin/MarcelaTab.tsx` | ~672 | Admin config: voice, LLM, telephony settings |
| `client/replit_integrations/audio/useVoiceRecorder.ts` | ~52 | MediaRecorder hook (WebM/Opus) |
| `client/replit_integrations/audio/useAudioPlayback.ts` | ~106 | AudioWorklet playback with sequence buffer |
| `client/replit_integrations/audio/audio-utils.ts` | ~36 | PCM16 decode, AudioContext helpers |
| `client/replit_integrations/audio/audio-playback-worklet.js` | ~50 | AudioWorkletProcessor for real-time PCM playback |

## System Prompts

### Base Prompt
Defined in `server/replit_integrations/chat/routes.ts` as `SYSTEM_PROMPT`. Covers:
- Marcela persona (warm, confident, sharp strategist)
- Hospitality expertise domains
- Full platform knowledge (Dashboard, Properties, Management Company, Settings, Scenarios, Admin)
- User role descriptions (Admin, Partner, Checker, Investor)
- **CRITICAL: No LLM Calculations rule** — Marcela must NEVER compute financial values

### Channel Additions
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

## Database Schema (Marcela Fields)

### `conversations` table
- `id`, `title`, `channel` (default `"web"`), `createdAt`

### `messages` table
- `id`, `conversationId`, `role` ("user"|"assistant"), `content`, `createdAt`

### `global_assumptions` table (Marcela columns)
| Column | Type | Default | Description |
|--------|------|---------|-------------|
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

### Web Channels
All `/api/conversations/*` routes require session cookie auth via `requireAuth` middleware.

### Twilio Channels
Twilio webhooks are public (added to `PUBLIC_API_PATHS` in `server/index.ts`):
- `/api/twilio/voice/incoming`
- `/api/twilio/voice/status`
- `/api/twilio/sms/incoming`

Caller identity resolved by matching `req.body.From` against `users.phoneNumber`.

## Admin Configuration
All Marcela settings are managed via Admin > Marcela tab (`MarcelaTab.tsx`), organized into:
1. **Voice Settings** — Voice ID, TTS/STT models, output format, stability, similarity, speaker boost, chunk schedule
2. **LLM Settings** — Model selection, max tokens (text/voice)
3. **Telephony & SMS** — Enable/disable toggles, phone greeting, webhook URLs, connection status, test SMS

Settings persist to `global_assumptions` table and are read by all channels at request time.

## Integration Credentials
- **OpenAI**: `AI_INTEGRATIONS_OPENAI_API_KEY` + `AI_INTEGRATIONS_OPENAI_BASE_URL` (Replit AI integration)
- **ElevenLabs**: Via Replit connector (`REPLIT_CONNECTORS_HOSTNAME`)
- **Twilio**: Via Replit connector (account SID, API key, API key secret, phone number)
