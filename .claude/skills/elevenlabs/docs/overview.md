# ElevenLabs Platform Overview

## What Is ElevenLabs?

ElevenLabs provides AI-powered audio and voice technology:
- **Text-to-Speech (TTS)** — convert text to natural-sounding speech
- **Speech-to-Text (STT)** — transcribe audio with Scribe models
- **Conversational AI (ElevenAgents)** — build multimodal voice/text agents
- **Voice Cloning** — create custom voices from audio samples
- **Sound Effects** — generate sound effects from text descriptions
- **Audio Isolation** — separate speech from background noise
- **Dubbing** — translate and dub audio/video content

## GitHub Repositories

| Repo | URL | Purpose |
|------|-----|---------|
| Organization | https://github.com/elevenlabs | All public repos |
| JS/Node SDK | https://github.com/elevenlabs/elevenlabs-js | Server-side API (`elevenlabs` npm) |
| Python SDK | https://github.com/elevenlabs/elevenlabs-python | Python SDK + `reference.md` |
| Packages Monorepo | https://github.com/elevenlabs/packages | Browser/React SDKs + widget |
| UI Components | https://github.com/elevenlabs/ui | UI component library |
| Examples | https://github.com/elevenlabs/elevenlabs-examples | Demo apps |

## NPM Packages

### Server-Side (Node.js)

| Package | npm | Purpose |
|---------|-----|---------|
| `elevenlabs` | [@elevenlabs/elevenlabs-js](https://www.npmjs.com/package/elevenlabs) | Full Node.js SDK — TTS, STT, agent management, KB, voices |

```bash
npm install elevenlabs
```

```typescript
import { ElevenLabsClient } from "elevenlabs";
const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
```

### Client-Side (Browser)

| Package | npm | Purpose |
|---------|-----|---------|
| `@elevenlabs/react` | [npm](https://www.npmjs.com/package/@elevenlabs/react) | React hooks — `useConversation` |
| `@elevenlabs/client` | [npm](https://www.npmjs.com/package/@elevenlabs/client) | Vanilla JS/TS — `Conversation.startSession()` |
| `@elevenlabs/convai-widget-core` | [npm](https://www.npmjs.com/package/@elevenlabs/convai-widget-core) | Web component (no bundled React) |
| `@elevenlabs/convai-widget-embed` | [npm](https://www.npmjs.com/package/@elevenlabs/convai-widget-embed) | Pre-bundled widget (includes Preact) |
| `@elevenlabs/react-native` | [npm](https://www.npmjs.com/package/@elevenlabs/react-native) | React Native SDK |

### Package Selection Guide

| Scenario | Use |
|----------|-----|
| React web app (full control) | `@elevenlabs/react` |
| React web app (drop-in widget) | `@elevenlabs/convai-widget-core` |
| Vanilla JS/TS web app | `@elevenlabs/client` |
| Simple HTML page | `@elevenlabs/convai-widget-embed` (CDN) |
| React Native mobile app | `@elevenlabs/react-native` |
| Node.js server | `elevenlabs` |
| UI components (shadcn-based) | `npx @elevenlabs/cli@latest components add <name>` |

### Agents Platform Libraries (Multi-Language)

| Language | Package | Manager |
|----------|---------|---------|
| JavaScript | `@elevenlabs/client` | npm |
| React | `@elevenlabs/react` | npm |
| React Native | `@elevenlabs/react-native` | npm |
| Python | `elevenlabs` | PyPI |
| Swift | [ElevenLabsSwift](https://github.com/elevenlabs/ElevenLabsSwift) | GitHub |
| Kotlin | `io.elevenlabs:elevenlabs-android` | Maven |
| Flutter | `elevenlabs_agents` | Pub |

### Third-Party Libraries

| Library | Package | Manager |
|---------|---------|---------|
| Vercel AI SDK | `ai` | npm |
| .NET | `ElevenLabs-DotNet` | NuGet |
| Unity | `com.rest.elevenlabs` | OpenUPM |

## API Base URL

```
https://api.elevenlabs.io/v1
```

## Authentication

All server-side API requests require the `xi-api-key` header:
```
xi-api-key: YOUR_API_KEY
```

Create API keys at: https://elevenlabs.io/app/settings/api-keys

Never expose API keys client-side. Use signed URLs or conversation tokens for browser connections.

## Rate Limits

API requests are rate-limited per account tier. Handle 429 responses with exponential backoff. The JS SDK has built-in retry with exponential backoff (default: 2 retries).

## Data Residency

Regions: `"us"` (default), `"global"`, `"eu-residency"`, `"in-residency"`. Configure via SDK options or agent settings.

## Models Quick Reference

### TTS Models
| Model | ID | Latency | Languages | Notes |
|-------|-----|---------|-----------|-------|
| Flash v2.5 | `eleven_flash_v2_5` | ~75ms | 32 | 50% cheaper, best for real-time |
| Multilingual v2 | `eleven_multilingual_v2` | ~200ms | 29 | Highest quality |
| Turbo v2.5 | `eleven_turbo_v2_5` | ~100ms | 32 | Balance |

### STT Models
| Model | ID | Notes |
|-------|-----|-------|
| Scribe v1 | `scribe_v1` | Standard |
| Scribe v2 | `scribe_v2` | Improved accuracy, diarization, audio events |

### LLM Models (Conversational AI)
| Provider | Models |
|----------|--------|
| OpenAI | `gpt-4.1`, `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo` |
| Anthropic | `claude-sonnet-4-20250514`, `claude-3.5-sonnet` |
| Google | `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-pro` |
| Groq | `llama-3.3-70b`, `llama-3.1-8b` |

Full model list with languages: see `elevenlabs-widget/SKILL.md` § LLM Models.
