---
name: twilio-telephony
description: Twilio Voice and SMS integration for Marcela AI. Covers webhooks, Media Streams, audio encoding, caller ID, admin configuration.
---

# Twilio Telephony — Entry Point

## Purpose
Documents the Twilio Voice (phone calls) and SMS integration for the Marcela AI assistant.

## Sub-Skills
| File | What It Covers |
|------|---------------|
| `twilio-integration.md` | Webhook endpoints, WebSocket Media Stream protocol, audio encoding (mulaw↔PCM), caller ID, conversation persistence, admin config, sendSMS helper |

## Key Files
- `server/routes/twilio.ts` — Voice webhook, WebSocket stream handler, SMS webhook, audio conversion
- `server/integrations/twilio.ts` — Twilio client, phone number retrieval, sendSMS
- `server/routes/admin.ts` — `/api/admin/twilio-status`, `/api/admin/send-notification`
- `client/src/components/admin/MarcelaTab.tsx` — Telephony & SMS config section

## Related Rules
- `rules/api-routes.md` — API route conventions
- `rules/documentation.md` — Source-of-truth hierarchy

## Related Skills
- `marcela-ai/` — Overall Marcela architecture and audio pipeline
- `voice-widget/` — Web voice UX patterns
