# Marcela — HBG Portal AI Assistant Configuration

## Overview

Marcela is the AI assistant for the Hospitality Business Group portal. She provides voice and text interaction via:
- **Web widget** — floating button on all portal pages
- **Phone** — Twilio integration (planned)
- **SMS** — Twilio SMS integration (planned)
- **WhatsApp** — WhatsApp Business integration (planned)

## Agent Details

| Setting | Value |
|---------|-------|
| Agent ID | `agent_6401kk0capntfansmn84f58yfrd9` |
| Agent Name | Configurable via `aiAgentName` DB column (default: "Marcela") |
| English Voice | Jessica (`cgSgspJ2msm6clMCkdW9`) |
| Portuguese Voice | Sarah (`EXAVITQu4vr4xnSDxMaL`) |
| TTS Model | `eleven_flash_v2_5` |
| STT Model | `scribe_v1` |
| LLM Model | `gpt-4.1` |
| Max Tokens | 2048 (text), 1024 (voice) |

## DB Configuration (global_assumptions table)

All Marcela config is stored in the `global_assumptions` table (row id=9). DB columns use `marcela_*` prefix — only UI labels use the dynamic `aiAgentName`.

| DB Column | Type | Description |
|-----------|------|-------------|
| `show_ai_assistant` | boolean | Show/hide widget globally |
| `ai_agent_name` | text | Display name (default "Marcela") |
| `marcela_agent_id` | text | ElevenLabs agent ID |
| `marcela_voice_id` | text | Primary voice ID |
| `marcela_tts_model` | text | TTS model ID |
| `marcela_stt_model` | text | STT model ID |
| `marcela_output_format` | text | Audio format (e.g., `pcm_16000`) |
| `marcela_stability` | real | Voice stability (0–1) |
| `marcela_similarity_boost` | real | Voice similarity boost (0–1) |
| `marcela_speaker_boost` | boolean | Speaker boost toggle |
| `marcela_chunk_schedule` | text | Audio chunk schedule (e.g., `120,160,250,290`) |
| `marcela_llm_model` | text | LLM model for agent |
| `marcela_max_tokens` | integer | Max tokens for text responses |
| `marcela_max_tokens_voice` | integer | Max tokens for voice responses |
| `marcela_enabled` | boolean | Master enable flag |
| `marcela_twilio_enabled` | boolean | Twilio phone integration flag |
| `marcela_sms_enabled` | boolean | SMS integration flag |
| `marcela_phone_greeting` | text | Phone greeting message |

## Widget Gating Logic

In `Layout.tsx`, `MarcelaWidgetGated` controls when the widget appears:

```tsx
const enabled = showAiAssistant && !tourActive && !promptVisible;
```

- `showAiAssistant` — from `global_assumptions.show_ai_assistant` (DB)
- `tourActive` — guided walkthrough is running
- `promptVisible` — tour prompt dialog is showing

## Server-Side Configuration

`server/marcela.ts` handles:
1. Agent configuration via ElevenLabs API on server start
2. Signed URL generation endpoint: `GET /api/marcela/signed-url`
3. Knowledge base management

When the Replit ElevenLabs connector is unauthorized, config is skipped and the widget falls back to public `agent-id` mode.

## Admin Tab

The "AI Agent" tab in Admin (11 tabs total) provides UI for all Marcela settings. See `.claude/skills/admin/ai-agent-admin.md`.

## Invariants

- **All ElevenLabs config via API** — never use the ElevenLabs dashboard manually
- **DB columns stay `marcela_*`** — only UI labels are dynamic
- **`userId = NULL`** on the `global_assumptions` row (shared config)
- **Ricardo Cidale is sole Admin** — only he can configure Marcela
