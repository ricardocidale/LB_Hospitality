# ElevenLabs Conversational AI — Complete SDK Reference

## Purpose
Marcela's web channel uses the ElevenLabs Conversational AI platform. This skill covers the full SDK surface: widget web component, React `useConversation` hook, authentication, personalization, tools, knowledge base, voice configuration, conversation flow, and prompting best practices.

## Integration Method
We use `@elevenlabs/convai-widget-core` (web component) with signed URL authentication. The ElevenLabs API key is managed via Replit Connector (`server/integrations/elevenlabs.ts`).

## File Map
| File | Purpose |
|------|---------|
| `client/src/components/ElevenLabsWidget.tsx` | Widget component — fetches signed URL, renders `<elevenlabs-convai>` |
| `client/src/elevenlabs-convai.d.ts` | TypeScript JSX type declarations for all widget attributes |
| `client/src/components/Layout.tsx` | `MarcelaWidgetGated` — gates widget on settings + tour state |
| `server/routes/admin/marcela.ts` | `GET /api/marcela/signed-url` — generates signed conversation URL |
| `server/integrations/elevenlabs.ts` | API key, STT, streaming TTS, Conversational AI helpers |

## Authentication Flow (Signed URL)
1. Client calls `GET /api/marcela/signed-url` (requires auth)
2. Server reads `marcelaAgentId` from `global_assumptions`
3. Server calls ElevenLabs: `GET /v1/convai/conversation/get-signed-url?agent_id=<ID>`
4. Server returns `{ signedUrl: "wss://..." }` to client
5. Client renders `<elevenlabs-convai url={signedUrl} />`

Signed URLs are temporary — each one is single-use and expires.

## Widget Web Component Attributes

### Core
| Attribute | Type | Description |
|-----------|------|-------------|
| `agent-id` | string | Public agent ID (no auth required) |
| `url` | string | Signed URL (for private/authenticated agents) |
| `server-location` | `"us"` \| `"eu-residency"` \| `"in-residency"` \| `"global"` | Server region |
| `variant` | `"expanded"` | Widget display mode |
| `dismissible` | `"true"` \| `"false"` | Allow user to minimize |

### Visual
| Attribute | Type | Description |
|-----------|------|-------------|
| `avatar-image-url` | URL string | Custom avatar image |
| `avatar-orb-color-1` | hex color | Orb gradient color 1 |
| `avatar-orb-color-2` | hex color | Orb gradient color 2 |

### Text Labels
| Attribute | Default | Description |
|-----------|---------|-------------|
| `action-text` | "Need assistance?" | CTA button text |
| `start-call-text` | "Begin conversation" | Start call button |
| `end-call-text` | "End call" | End call button |
| `expand-text` | "Open chat" | Expand widget text |
| `listening-text` | "Listening..." | Listening state label |
| `speaking-text` | "Assistant speaking" | Speaking state label |

### Markdown Rendering
| Attribute | Description |
|-----------|-------------|
| `markdown-link-allowed-hosts` | Domains where links are clickable (`"*"` for all) |
| `markdown-link-include-www` | Also allow www variants (default: `"true"`) |
| `markdown-link-allow-http` | Allow http:// links (default: `"true"`) |
| `syntax-highlight-theme` | Code block theme: `"dark"`, `"light"`, `"auto"` |

### Runtime Overrides (via attributes)
| Attribute | Description |
|-----------|-------------|
| `override-language` | Override agent language (e.g., `"es"`) |
| `override-prompt` | Override system prompt |
| `override-first-message` | Override first message |
| `override-voice-id` | Override voice ID |
| `dynamic-variables` | JSON string of key-value pairs for `{{ var }}` templates |

### Client Tools (via DOM event)
```js
widget.addEventListener('elevenlabs-convai:call', (event) => {
  event.detail.config.clientTools = {
    redirectToExternalURL: ({ url }) => {
      window.open(url, '_blank', 'noopener,noreferrer');
    },
  };
});
```

## React SDK — `useConversation` Hook

### Installation
Package: `@elevenlabs/react`

### Hook Options
```ts
const conversation = useConversation({
  clientTools: { /* tool handlers */ },
  overrides: {
    agent: { prompt: { prompt: '...' }, firstMessage: '...', language: 'en' },
    tts: { voiceId: '...' },
    conversation: { textOnly: true },
  },
  textOnly: false,
  serverLocation: 'us',
  micMuted: false,
  volume: 0.8,
});
```

### Callbacks
| Callback | Description |
|----------|-------------|
| `onConnect` | WebSocket connection established |
| `onDisconnect` | WebSocket connection ended |
| `onMessage` | New message (transcription, LLM reply, debug) |
| `onError` | Error encountered |
| `onAudio` | Audio data received |
| `onModeChange` | Mode change (speaking/listening) |
| `onStatusChange` | Connection status change |
| `onCanSendFeedbackChange` | Feedback availability change |
| `onDebug` | Debug information available |
| `onUnhandledClientToolCall` | Unhandled client tool call |
| `onVadScore` | Voice activity detection score |
| `onAudioAlignment` | Character-level timing for agent speech |

### Methods
| Method | Description |
|--------|-------------|
| `startSession({ signedUrl, agentId, connectionType, userId })` | Start conversation (returns `conversationId`) |
| `endSession()` | End conversation |
| `sendUserMessage(text)` | Send text message (triggers agent response) |
| `sendContextualUpdate(text)` | Send context without triggering response |
| `sendFeedback(positive: boolean)` | Submit conversation feedback |
| `sendUserActivity()` | Notify agent of user activity (prevents interruption) |
| `setVolume({ volume: 0-1 })` | Set output volume |
| `changeInputDevice({ sampleRate, format, inputDeviceId })` | Switch audio input |

### State Properties
| Property | Type | Description |
|----------|------|-------------|
| `status` | `"connected"` \| `"disconnected"` | Connection status |
| `isSpeaking` | boolean | Agent is currently speaking |
| `canSendFeedback` | boolean | Feedback can be submitted |

### Connection Types
| Type | Auth Method | Description |
|------|------------|-------------|
| `websocket` | Signed URL | Traditional WebSocket (our current approach) |
| `webrtc` | Conversation Token | WebRTC for lower latency |

## Conversational AI REST API

### Endpoints Used
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/v1/convai/conversation/get-signed-url?agent_id=<ID>` | Generate signed URL |
| `GET` | `/v1/convai/agents/<agent_id>` | Get agent configuration |
| `PATCH` | `/v1/convai/agents/<agent_id>` | Update agent configuration |
| `GET` | `/v1/convai/conversations?agent_id=<ID>` | List conversation history |
| `GET` | `/v1/convai/conversations/<conversation_id>` | Get conversation details |
| `DELETE` | `/v1/convai/conversations/<conversation_id>` | Delete conversation |

### Headers
All requests: `xi-api-key: <API_KEY>`

## Agent Tools (configured on ElevenLabs dashboard)

### Client Tools
Executed in the browser. Agent calls them, client handles them. Can return values if tool is set to "blocking".
```ts
clientTools: {
  navigateToPage: ({ page }) => { router.push(page); return 'Navigated'; },
  showPropertyDetails: ({ propertyId }) => { openModal(propertyId); },
}
```

### Server Tools
HTTP webhooks called by ElevenLabs servers. Configure URL, method, headers, body/query params in dashboard. Agent generates parameters dynamically from conversation context.

### System Tools
Built-in platform tools:
- **Language Detection** — auto-switch to user's language
- **End Call** — programmatic call termination
- **Transfer Call** — transfer to human agent (telephony)

## Knowledge Base
- Upload docs (text, URL, file) via dashboard or API
- Max 20MB / 300K characters (non-enterprise)
- Best practice: break large docs into focused pieces
- Review conversation transcripts to identify knowledge gaps

## Voice & Language Configuration

### Our Voices
| Language | Voice | ID | Model |
|----------|-------|----|-------|
| English | Jessica | `cgSgspJ2msm6clMCkdW9` | Flash v2 |
| Portuguese | Sarah | `EXAVITQu4vr4xnSDxMaL` | Multilingual v2.5 |
| Spanish | Configurable | Set on dashboard | Multilingual v2.5 |

### Voice Customization
- **Speed control**: 0.7x–1.2x
- **Expressive mode**: Emotional delivery (Eleven v3 Conversational)
- **Pronunciation dictionary**: IPA/CMU notation for specific words
- **Multi-voice**: Different voices for multi-character scenarios
- **Language-specific voices**: Per-language voice assignment

### Language Detection
Add the language detection system tool to auto-switch languages. Widget prompts user for language selection before conversation starts. Language is fixed for the call duration.

## Conversation Flow Settings (Dashboard)

### Turn Timeout
How long agent waits in silence before prompting. Range: 1–30 seconds.
- Casual: 5–10s
- Technical/complex: 10–30s

### Soft Timeout
Filler audio when LLM is slow (e.g., "Hmm...", "Let me think..."). Default: disabled. Recommended: 3.0s.

### Interruptions
Whether users can interrupt agent mid-speech.

### Turn Eagerness
How quickly agent responds to user input.

## Prompting Best Practices (for Agent System Prompt)

1. **Separate instructions into clean sections** with markdown headings (`# Guardrails`, `# Personality`)
2. **Be concise** — remove filler words, keep instructions action-based
3. **Emphasize critical instructions** — add "This step is important" and repeat key rules
4. **Text normalization** — digits/symbols auto-converted to words for TTS. Two strategies:
   - `system_prompt` (default): LLM writes out numbers as words
   - `auto` (legacy): Server-side regex normalization, adds ~100ms latency

## Personalization

### Dynamic Variables
Define with `{{ var_name }}` in prompts/messages. Pass at runtime:
```json
{ "dynamic_variables": { "user_name": "Ricardo", "role": "admin" } }
```

### Overrides
Replace system prompt, first message, language, or voice per conversation. Must enable in agent Security tab.

### Conversation Initiation Client Data
```json
{
  "type": "conversation_initiation_client_data",
  "conversation_config_override": {
    "agent": { "prompt": { "prompt": "..." }, "first_message": "...", "language": "en" },
    "tts": { "voice_id": "..." }
  },
  "dynamic_variables": { "user_name": "Ricardo" },
  "user_id": "your_custom_user_id"
}
```

## Modality Configuration (Dashboard Widget Tab)
- **Voice only** (default): Speech input only
- **Voice + text**: Switch between voice and text during conversation
- **Chat Mode**: Text-only, no audio, no microphone permissions, 25x higher concurrency

## Gating Logic (Layout.tsx)
Widget shows when ALL conditions are true:
1. `showAiAssistant` is true (admin toggle)
2. `marcelaAgentId` is non-empty
3. Tour is not active (`!tourActive`)
4. Tour prompt is not visible (`!promptVisible`)

## DB Configuration
| Field | Column | Type | Purpose |
|-------|--------|------|---------|
| `marcelaAgentId` | `marcela_agent_id` | text | ElevenLabs Conversational AI Agent ID |
| `showAiAssistant` | `show_ai_assistant` | boolean | Master toggle for widget visibility |
| `marcelaEnabled` | `marcela_enabled` | boolean | Marcela system enabled |

## Admin Panel
All ElevenLabs agent configuration is done via the Admin > AI Agent tab, not the ElevenLabs dashboard. The admin panel provides:
- **Prompt Editor** — Edit system prompt, first message, language directly via API
- **Tools Status** — View all 18 tools (12 client + 6 server) with registration status
- **Knowledge Base** — Upload files, push RAG content to ElevenLabs KB
- **Voice Settings** — Voice ID, TTS/STT models, stability, similarity

See `.claude/skills/admin/ai-agent-admin.md` for full admin tab architecture.

## Package
- `@elevenlabs/convai-widget-core` — web component (currently used)
- `@elevenlabs/react` — React hooks (available for upgrade)
- `elevenlabs` — Node.js SDK (server-side, currently used for STT/TTS)
