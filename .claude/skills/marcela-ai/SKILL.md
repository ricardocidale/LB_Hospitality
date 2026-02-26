---
name: marcela-ai
description: Marcela AI multi-channel conversational assistant. Covers architecture, system prompts, audio pipeline, RAG knowledge base, and admin configuration.
---

# Marcela AI — Entry Point

## Purpose
Documents the complete Marcela AI assistant system operating across web (text + voice), phone (Twilio Voice), and SMS (Twilio SMS).

## Sub-Skills
| File | What It Covers |
|------|---------------|
| `marcela-architecture.md` | Channel matrix, file map, system prompts, context injection, DB schema, admin config, integration credentials |
| `audio-pipeline.md` | Web voice pipeline, phone voice pipeline (Twilio Media Streams), audio conversion functions, ElevenLabs STT/TTS, default voice config |

## Key Files
- `server/replit_integrations/chat/routes.ts` — Web text+voice endpoints, system prompts
- `server/routes/twilio.ts` — Phone+SMS webhooks, WebSocket Media Stream
- `server/integrations/elevenlabs.ts` — ElevenLabs STT + streaming TTS
- `server/integrations/twilio.ts` — Twilio client, sendSMS helper
- `server/knowledge-base.ts` — RAG knowledge base (in-memory embeddings)
- `client/src/components/AIChatWidget.tsx` — Chat widget with voice
- `client/src/components/admin/MarcelaTab.tsx` — Admin configuration

## Related Rules
- `rules/documentation.md` — Source-of-truth hierarchy
- `rules/api-routes.md` — API route conventions

## Related Skills
- `twilio-telephony/` — Detailed Twilio voice/SMS integration
- `voice-widget/` — Voice UX patterns (state machine, waveform, barge-in)
