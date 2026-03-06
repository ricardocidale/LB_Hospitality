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

Available regions:
- `"us"` (default) — United States
- `"global"` — Global (same as US)
- `"eu-residency"` — European Union
- `"in-residency"` — India

Configure via SDK options or agent settings.
