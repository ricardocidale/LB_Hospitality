Check Marcela AI channel health and conversation stats:

1. Run `npx tsx script/marcela-check.ts` for channel health (9 checks)
2. Login as admin via POST /api/auth/admin-login using $ADMIN_PASSWORD
3. GET /api/conversations → list all conversations with channel badges
4. GET /api/admin/twilio-status → Twilio connection status + phone number
5. Summarize: channel health, conversation counts by channel, Twilio status

Channel health checks:
- Voice Webhook: POST /api/twilio/voice/incoming returns TwiML
- SMS Webhook: POST /api/twilio/sms/incoming returns TwiML
- Voice Status: POST /api/twilio/voice/status returns 200
- Conversations API: requires auth (401 without session)
- Admin Twilio Status: requires admin auth
- Schema columns: marcela* columns exist in shared/schema.ts
- Twilio routes: webhook paths defined in server/routes/twilio.ts
- Public auth paths: Twilio endpoints in PUBLIC_API_PATHS
- Audio hooks: client/replit_integrations/audio/ has all files

Marcela settings (in global_assumptions):
- Voice: marcelaVoiceId, marcelaTtsModel, marcelaSttModel, marcelaOutputFormat
- Voice tuning: marcelaStability (0-1), marcelaSimilarityBoost (0-1), marcelaSpeakerBoost
- LLM: marcelaLlmModel, marcelaMaxTokens, marcelaMaxTokensVoice
- Telephony: marcelaTwilioEnabled, marcelaSmsEnabled, marcelaPhoneGreeting
- Chunk schedule: marcelaChunkSchedule (CSV of integers)

Key files:
- Server voice: server/replit_integrations/chat/routes.ts
- Server phone/SMS: server/routes/twilio.ts
- ElevenLabs: server/integrations/elevenlabs.ts
- Twilio: server/integrations/twilio.ts
- Client widget: client/src/components/AIChatWidget.tsx
- Admin config: client/src/components/admin/MarcelaTab.tsx
- Audio hooks: client/replit_integrations/audio/

Defaults:
- Voice ID: cgSgspJ2msm6clMCkdW9 (Jessica)
- TTS model: eleven_flash_v2_5
- STT model: scribe_v1
- Output format: pcm_16000
- LLM model: gpt-4.1
- Max tokens text: 2048, voice: 1024
