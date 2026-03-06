---
name: marcela-ai
description: Marcela AI multi-channel conversational assistant. Covers architecture, system prompts, audio pipeline, RAG knowledge base, and admin configuration.
---

# Marcela AI — Entry Point

## Purpose
Documents the complete Marcela AI assistant system operating across web (ElevenLabs Conversational AI widget), phone (Twilio Voice), and SMS (Twilio SMS).

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
| `.claude/skills/elevenlabs-widget/SKILL.md` | Web widget: signed URL flow, admin config, gating logic, voice IDs |

## Key Files
- `client/src/components/ElevenLabsWidget.tsx` — Web chat widget (ElevenLabs Conversational AI)
- `client/src/components/Layout.tsx` — `MarcelaWidgetGated` gating component
- `server/routes/admin/marcela.ts` — Admin settings API + signed URL endpoint
- `server/routes/twilio.ts` — Phone+SMS webhooks, WebSocket Media Stream
- `server/integrations/elevenlabs.ts` — ElevenLabs API key, STT, streaming TTS
- `server/integrations/twilio.ts` — Twilio client, sendSMS helper
- `server/knowledge-base.ts` — RAG knowledge base (in-memory embeddings)
- `client/src/components/admin/marcela/MarcelaTab.tsx` — Admin configuration (all channels)

## Admin Tab Components
| Component | Purpose |
|-----------|---------|
| `MarcelaTab.tsx` | Status toggles + Agent ID config |
| `VoiceSettings.tsx` | ElevenLabs TTS/STT model settings |
| `LLMSettings.tsx` | LLM model + token limits |
| `TelephonySettings.tsx` | Twilio phone/SMS config |
| `KnowledgeBase.tsx` | RAG knowledge base status + reindex |

## Related Tools
- `.claude/tools/marcela/elevenlabs-widget-config.json` — Widget config reference
- `.claude/tools/marcela/voice-config.json` — Voice settings defaults and DB mapping
- `.claude/tools/marcela/voice-config-validator.json` — Voice config validation

## Related Rules
- `rules/documentation.md` — Source-of-truth hierarchy
- `rules/api-routes.md` — API route conventions
