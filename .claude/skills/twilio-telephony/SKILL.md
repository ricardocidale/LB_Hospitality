# Twilio Telephony & SMS — Complete Integration Reference

## Purpose
Marcela (the AI assistant) is accessible via three channels: web widget, phone calls, and SMS. This skill documents the full Twilio integration: voice webhooks, WebSocket Media Streams, audio encoding pipeline, SMS handling, admin configuration, and the ElevenLabs phone number management API.

## Sub-Skills
| File | What It Covers |
|------|---------------|
| `voice-pipeline.md` | WebSocket Media Stream protocol, audio encoding (mulaw↔PCM), TTS streaming, silence detection |
| `sms-pipeline.md` | Inbound SMS webhook, LLM processing, reply formatting, message splitting |
| `admin-config.md` | Schema columns, admin API endpoints, TelephonySettings UI component, test SMS |
| `twilio-console-setup.md` | Twilio Console webhook configuration, Replit connector credentials |
| `elevenlabs-phone-api.md` | ElevenLabs phone number management, batch calls, dynamic variables, conversation initiation webhooks |
| `audio-encoding.md` | Mulaw/PCM conversion algorithms, WAV construction, sample rate conversion |

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                     Twilio Cloud                          │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐                 │
│  │ Inbound  │  │  Media   │  │ Inbound │                 │
│  │  Voice   │  │  Stream  │  │   SMS   │                 │
│  └────┬─────┘  └────┬─────┘  └────┬────┘                 │
└───────┼──────────────┼────────────┼──────────────────────┘
        │ POST         │ WSS        │ POST
        ▼              ▼            ▼
┌───────────────────────────────────────────────────────────┐
│                    Our Server                              │
│  /api/twilio/        /api/twilio/     /api/twilio/        │
│  voice/incoming      voice/stream     sms/incoming        │
│       │                   │                │              │
│       │ TwiML             │ Audio          │ LLM          │
│       │ <Say>+<Stream>    │ Pipeline       │ Pipeline     │
│       │                   │                │              │
│       │              ┌────┴────┐      ┌────┴────┐        │
│       │              │ mulaw→  │      │ OpenAI  │        │
│       │              │ WAV→STT │      │ Chat    │        │
│       │              │ →LLM→   │      │ →Reply  │        │
│       │              │ TTS→    │      └─────────┘        │
│       │              │ mulaw   │                          │
│       │              └─────────┘                          │
│  ElevenLabs STT/TTS    OpenAI LLM    Chat Storage        │
└───────────────────────────────────────────────────────────┘
```

## Key Files
| File | Purpose |
|------|---------|
| `server/routes/twilio.ts` | Voice webhook, WebSocket stream handler, SMS webhook |
| `server/integrations/twilio.ts` | Twilio client, phone number retrieval, sendSMS |
| `server/integrations/elevenlabs.ts` | STT, streaming TTS, voice config builder |
| `server/integrations/elevenlabs-audio.ts` | Mulaw↔PCM conversion, WAV builder, downsample, escapeXml, buildSystemPrompt |
| `server/routes/admin/marcela.ts` | `/api/admin/twilio-status`, `/api/admin/send-notification`, voice-settings (includes Twilio toggles) |
| `client/src/components/admin/marcela/TelephonySettings.tsx` | Admin UI — connection status, toggles, webhook URLs, test SMS |
| `client/src/features/ai-agent/hooks/use-agent-settings.ts` | `useTwilioStatus()`, `useSendTestSms()` hooks |
| `client/src/features/ai-agent/types.ts` | `TwilioStatus` interface |

## Channel Summary
| Channel | Webhook | Audio | LLM | Conversation |
|---------|---------|-------|-----|-------------|
| Web | Widget (signed URL) | Browser mic → ElevenLabs ConvAI | ElevenLabs-managed | Via ElevenLabs |
| Phone | `/api/twilio/voice/incoming` | Mulaw 8kHz ↔ PCM via WebSocket | OpenAI (streamed) | `channel: "phone"` |
| SMS | `/api/twilio/sms/incoming` | N/A (text only) | OpenAI (non-streaming) | `channel: "sms"` |

## Quick Reference

### Public API Paths (bypass auth)
These paths are added to `PUBLIC_API_PATHS` in `server/index.ts`:
```typescript
"/api/twilio/voice/incoming",
"/api/twilio/voice/status",
"/api/twilio/sms/incoming",
```

### Twilio Connector Credentials (via Replit)
| Setting | Purpose |
|---------|---------|
| `account_sid` | Twilio Account SID |
| `api_key` | API Key (not Auth Token) |
| `api_key_secret` | API Key Secret |
| `phone_number` | Assigned Twilio phone number |

### DB Schema Fields (global_assumptions)
| Column | Drizzle Field | Type | Default | Purpose |
|--------|---------------|------|---------|---------|
| `marcela_twilio_enabled` | `marcelaTwilioEnabled` | boolean | false | Master toggle for voice calls |
| `marcela_sms_enabled` | `marcelaSmsEnabled` | boolean | false | Master toggle for SMS |
| `marcela_phone_greeting` | `marcelaPhoneGreeting` | text | "Hello, this is Marcela..." | TwiML greeting spoken to callers |

## Related Skills
- `elevenlabs-widget/` — ElevenLabs ConvAI SDK, widget, voice settings, PATCH API
- `marcela-ai/` — Overall Marcela architecture
- `admin/` — Admin panel tab structure
