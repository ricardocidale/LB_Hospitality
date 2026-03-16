---
name: integrations-infrastructure
description: Every external service the HBG Portal connects to, how it connects, and its boundaries. Covers AI providers, voice AI, financial services, geospatial, document intelligence, communication, image generation, observability, storage, and authentication. Use this skill when working on integrations, external API calls, or service configuration.
---

# Integrations Infrastructure

External services: AI (Anthropic, OpenAI, Gemini via lazy-singleton factory), Voice (ElevenLabs Convai), Geospatial (Google Maps + MapLibre), Document Intelligence (Google Document AI), Communication (Twilio SMS, Resend email), Image Generation (Replicate), Observability (Sentry, PostHog), Storage (Replit Object Storage, PostgreSQL), Auth (Google OAuth 2.0, session-based). Integration resilience: graceful degradation, error boundaries, rate limiting.

**Canonical reference:** `.claude/skills/integrations/SKILL.md`

See also: `.claude/skills/marcela-ai/SKILL.md` (AI agent), `.claude/skills/architecture/SKILL.md` (server routes)
