Every external service the HBG Portal connects to, how it connects, and its boundaries. Covers AI providers, voice AI, financial services, geospatial, document intelligence, communication, image generation, observability, storage, and authentication. Use this skill when working on integrations, external API calls, or service configuration.

## AI Providers

All AI clients use a **lazy-singleton factory** pattern in `server/ai/clients.ts` — created once on first use, reused thereafter.

| Provider | Use Cases | Env Vars | File |
|----------|-----------|----------|------|
| **Anthropic** (Claude 3.5 Sonnet) | Premium exports, financial research, transaction categorization | `ANTHROPIC_API_KEY` or `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | `server/ai/clients.ts` -> `getAnthropicClient()` |
| **OpenAI** | General AI client | `AI_INTEGRATIONS_OPENAI_API_KEY` | `server/ai/clients.ts` -> `getOpenAIClient()` |
| **Google Gemini** | General AI, Marcela default LLM | `AI_INTEGRATIONS_GEMINI_API_KEY` | `server/ai/clients.ts` -> `getGeminiClient()` |

LLM provider selection is configurable via the admin panel.

## Voice AI: ElevenLabs + Convai

| Aspect | Detail |
|--------|--------|
| **Use cases** | Real-time voice interaction with Marcela AI assistant |
| **Architecture** | WebSocket streaming for real-time audio STT + TTS pipeline |
| **Env vars** | `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID` |
| **Files** | `server/integrations/elevenlabs.ts`, `server/integrations/elevenlabs-audio.ts` |

## Geospatial: Google Maps Platform

| Aspect | Detail |
|--------|--------|
| **Use cases** | Geocoding, Places autocomplete, Nearby POI for competitive landscape |
| **Additional** | MapLibre for 3D globe flyover visualization |
| **Env vars** | `GOOGLE_MAPS_API_KEY` |
| **Files** | `server/integrations/geospatial.ts`, `server/routes/geospatial.ts` |

## Document Intelligence: Google Cloud Document AI

| Aspect | Detail |
|--------|--------|
| **Use cases** | OCR extraction from PDFs/images for financial data |
| **Files** | `server/integrations/document-ai.ts`, `server/routes/documents.ts` |

## Communication

| Service | Use Cases | Files |
|---------|-----------|-------|
| **Twilio** (SMS + Voice) | SMS notifications, phone voice via WebSocket | `server/integrations/twilio.ts`, `server/routes/twilio.ts` |
| **Resend** (Email) | Transactional email — welcome, password reset, report sharing | `server/integrations/resend.ts` |

## Image Generation: Replicate

| Aspect | Detail |
|--------|--------|
| **Use cases** | Architectural renders — exterior, interior design concepts |
| **Config** | Model configs in `server/config/replicate-models.json` |
| **Files** | `server/integrations/replicate.ts`, `server/image/pipeline.ts` |

## Observability

| Service | Use Cases | File |
|---------|-----------|------|
| **Sentry** | Error tracking, performance monitoring | `client/src/lib/sentry.ts` |
| **PostHog** | Product analytics, event tracking | `client/src/lib/analytics.ts` |

## Storage

| Service | Use Cases | Files |
|---------|-----------|-------|
| **Replit Object Storage** | Uploaded documents, property photos, generated assets | `server/replit_integrations/object_storage/` |
| **PostgreSQL** (Drizzle ORM) | Primary data persistence | `server/db.ts` |

## Authentication

| Method | Detail |
|--------|--------|
| **Google OAuth 2.0** | User login via Google account. `server/routes/google-auth.ts` |
| **Session-Based Auth** | Database-stored sessions, HTTP-only cookie, 7-day expiry. `server/auth.ts` |
| **Replit Auth OIDC** | Installed; OIDC integration not yet wired |

## Integration Resilience Patterns

- **Graceful Degradation** — Clear error surfacing, no silent fallbacks. Research generation retries with exponential backoff.
- **Error Boundaries** — Each integration file wraps API calls in try/catch. Errors logged via `server/logger.ts`.
- **Rate Limiting** — AI research: per-user 1-minute window. Login: 5 attempts per IP, 15-minute lockout.

## Integration File Map

| Integration | Server File | Route File | Env Var |
|------------|-------------|------------|---------|
| Anthropic | `server/ai/clients.ts` | `server/routes/research.ts` | `ANTHROPIC_API_KEY` |
| OpenAI | `server/ai/clients.ts` | `server/routes/ai.ts` | `AI_INTEGRATIONS_OPENAI_API_KEY` |
| Gemini | `server/ai/clients.ts` | `server/routes/ai.ts` | `AI_INTEGRATIONS_GEMINI_API_KEY` |
| ElevenLabs | `server/integrations/elevenlabs.ts` | `server/routes/admin/marcela.ts` | `ELEVENLABS_API_KEY` |
| Google Maps | `server/integrations/geospatial.ts` | `server/routes/geospatial.ts` | `GOOGLE_MAPS_API_KEY` |
| Document AI | `server/integrations/document-ai.ts` | `server/routes/documents.ts` | Google Cloud credentials |
| Twilio | `server/integrations/twilio.ts` | `server/routes/twilio.ts` | Replit Connector |
| Resend | `server/integrations/resend.ts` | — | `RESEND_API_KEY` |
| Replicate | `server/integrations/replicate.ts` | — | `REPLICATE_API_TOKEN` |
| Sentry | `client/src/lib/sentry.ts` | — | `SENTRY_DSN` |
| PostHog | `client/src/lib/analytics.ts` | — | `POSTHOG_KEY` |
| Stripe | — | — | Replit Connector (installed) |
