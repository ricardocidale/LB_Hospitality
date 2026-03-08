# ElevenLabs Conversational AI — Complete SDK & Platform Reference

## Purpose
Marcela's web channel uses the ElevenLabs Conversational AI platform (ElevenAgents). This skill covers the full SDK surface: widget web component, React `useConversation` hook, authentication, personalization, tools, knowledge base, voice configuration, conversation flow, prompting best practices, and the complete PATCH API for agent configuration.

## Platform Architecture

ElevenAgents coordinates 4 core components:
1. **ASR** — Fine-tuned Speech to Text model for speech recognition (default: `scribe_realtime`)
2. **LLM** — Your choice of language model (our agent: `gemini-2.0-flash-lite`)
3. **TTS** — Low-latency Text to Speech across 5k+ voices and 70+ languages (our voice: Jessica `cgSgspJ2msm6clMCkdW9`)
4. **Turn-taking** — Proprietary model that handles conversation timing

Agents are managed via the [ElevenAgents dashboard](https://elevenlabs.io/app/agents), the [API](/docs/api-reference), or the [CLI](https://www.npmjs.com/package/@elevenlabs/cli) (`npm install -g @elevenlabs/cli`).

## Integration Method
We use `@elevenlabs/convai-widget-core` (web component) with signed URL authentication. The ElevenLabs API key is managed via Replit Connector (`server/integrations/elevenlabs.ts`).

## File Map
| File | Purpose |
|------|---------|
| `client/src/components/ElevenLabsWidget.tsx` | Widget component — fetches signed URL, renders `<elevenlabs-convai>` |
| `client/src/elevenlabs-convai.d.ts` | TypeScript JSX type declarations for all widget attributes |
| `client/src/components/Layout.tsx` | `MarcelaWidgetGated` — gates widget on settings + tour state |
| `client/src/features/ai-agent/types.ts` | VoiceSettings interface, constants (OUTPUT_FORMATS, LLM_MODELS, WIDGET_VARIANTS, WIDGET_PLACEMENTS) |
| `client/src/features/ai-agent/hooks/use-convai-api.ts` | `useSaveAgentVoice` hook — PATCH voice + conversation flow settings |
| `client/src/components/admin/marcela/VoiceSettings.tsx` | Admin UI for voice configuration |
| `server/routes/admin/marcela.ts` | GET/POST voice-settings, PATCH convai/agent/voice, signed-url |
| `server/integrations/elevenlabs.ts` | API key, STT, streaming TTS, Conversational AI helpers |
| `shared/schema.ts` | DB columns for all voice/agent settings |
| `shared/constants.ts` | Default values for voice settings |

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

### PATCH Agent Voice — Flattened Payload

Our admin PATCH endpoint (`/api/admin/convai/agent/voice`) accepts a flat payload. The server groups fields into the correct `conversation_config` sections before forwarding to ElevenLabs.

**Client sends flat payload:**
```json
{
  "voice_id": "cgSgspJ2msm6clMCkdW9",
  "stability": 0.5,
  "similarity_boost": 0.75,
  "speed": 1.0,
  "use_speaker_boost": true,
  "agent_output_audio_format": "pcm_16000",
  "optimize_streaming_latency": 3,
  "text_normalisation_type": "system_prompt",
  "asr_provider": "scribe_realtime",
  "user_input_audio_format": "pcm_16000",
  "background_voice_detection": false,
  "turn_eagerness": "normal",
  "spelling_patience": "auto",
  "speculative_turn": false,
  "turn_timeout": 10,
  "silence_end_call_timeout": 600,
  "max_duration_seconds": 1800,
  "cascade_timeout_seconds": 500
}
```

**Server maps to ElevenLabs `conversation_config` sections:**

| Flat field | → ElevenLabs section | → ElevenLabs field |
|------------|---------------------|-------------------|
| `voice_id` | `tts` | `voice_id` |
| `stability` | `tts` | `stability` |
| `similarity_boost` | `tts` | `similarity_boost` |
| `speed` | `tts` | `speed` |
| `agent_output_audio_format` | `tts` | `agent_output_audio_format` |
| `optimize_streaming_latency` | `tts` | `optimize_streaming_latency` |
| `text_normalisation_type` | `tts` | `text_normalisation_type` |
| `asr_provider` | `asr` | `provider` |
| `user_input_audio_format` | `asr` | `user_input_audio_format` |
| `background_voice_detection` | `vad` | `background_voice_detection` |
| `turn_eagerness` | `turn` | `turn_eagerness` |
| `spelling_patience` | `turn` | `spelling_patience` |
| `speculative_turn` | `turn` | `speculative_turn` |
| `turn_timeout` | `turn` | `turn_timeout` |
| `silence_end_call_timeout` | `turn` | `silence_end_call_timeout` |
| `max_duration_seconds` | `conversation` | `max_duration_seconds` |
| `cascade_timeout_seconds` | `agent.prompt` | `cascade_timeout_seconds` |

#### Field Reference

**TTS Fields**
| Field | Type | Range | Default | Description |
|-------|------|-------|---------|-------------|
| `voice_id` | string | — | `cgSgspJ2msm6clMCkdW9` | ElevenLabs voice ID |
| `stability` | float | 0–1 | 0.5 | Lower = more expressive, higher = more consistent |
| `similarity_boost` | float | 0–1 | 0.75 | Voice clarity/similarity to original |
| `speed` | float | 0.5–2.0 | 1.0 | Speech speed multiplier |
| `use_speaker_boost` | boolean | — | true | Enhance voice clarity (DB only, not in PATCH) |
| `agent_output_audio_format` | string | see below | `pcm_16000` | Audio output format |
| `optimize_streaming_latency` | int | 0–4 | 3 | Higher = lower latency, may reduce quality |
| `text_normalisation_type` | string | `system_prompt`, `auto` | `system_prompt` | How numbers/symbols are normalized for TTS |

Output formats: `pcm_16000`, `pcm_22050`, `pcm_24000`, `pcm_44100`, `ulaw_8000`, `mp3_44100_64`, `mp3_44100_96`, `mp3_44100_128`, `mp3_44100_192`

Text normalization:
- `system_prompt` (recommended): LLM writes out numbers as words in responses. Zero extra latency.
- `auto` (legacy): Server-side regex normalization. Adds ~100ms latency.

**ASR Fields**
| Field | Type | Options | Default | Description |
|-------|------|---------|---------|-------------|
| `asr_provider` | string | `scribe_realtime`, `custom` | `scribe_realtime` | ASR provider |
| `user_input_audio_format` | string | `pcm_16000`, `pcm_22050`, `pcm_44100`, `ulaw_8000` | `pcm_16000` | Input audio format |

**Turn Fields**
| Field | Type | Options/Range | Default | Description |
|-------|------|---------------|---------|-------------|
| `turn_timeout` | int | 1–30 seconds | 10 | Silence before agent prompts |
| `turn_eagerness` | string | `low`, `normal`, `high` | `normal` | How quickly agent responds |
| `spelling_patience` | string | `auto`, `low`, `normal`, `high` | `auto` | Wait time for spelling/dictation |
| `speculative_turn` | boolean | — | false | Pre-generate response during user speech |
| `silence_end_call_timeout` | int | 10–3600 seconds | 600 | End call after N seconds of silence |

**VAD Fields**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `background_voice_detection` | boolean | false | Detect and filter background voices |

**Conversation Fields**
| Field | Type | Range | Default | Description |
|-------|------|-------|---------|-------------|
| `max_duration_seconds` | int | 60–7200 | 1800 | Maximum conversation duration |

**Prompt Fields**
| Field | Type | Range | Default | Description |
|-------|------|-------|---------|-------------|
| `cascade_timeout_seconds` | int | — | 500 | Timeout between pipeline stages (ms value, seconds key name) |

## Voice Settings — DB Schema

All voice settings are stored in `global_assumptions` table with `marcela` prefix. Schema columns in `shared/schema.ts`:

| DB Column | Drizzle Field | Type | Default | PATCH Flat Key |
|-----------|---------------|------|---------|----------------|
| `marcela_voice_id` | `marcelaVoiceId` | text | `cgSgspJ2msm6clMCkdW9` | `voice_id` |
| `marcela_voice_stability` | `marcelaStability` | real | 0.5 | `stability` |
| `marcela_voice_similarity` | `marcelaSimilarityBoost` | real | 0.75 | `similarity_boost` |
| `marcela_speaker_boost` | `marcelaSpeakerBoost` | boolean | true | `use_speaker_boost` |
| `marcela_output_format` | `marcelaOutputFormat` | text | `pcm_16000` | `agent_output_audio_format` |
| `marcela_speed` | `marcelaSpeed` | real | 1.0 | `speed` |
| `marcela_streaming_latency` | `marcelaStreamingLatency` | integer | 3 | `optimize_streaming_latency` |
| `marcela_text_normalisation` | `marcelaTextNormalisation` | text | `system_prompt` | `text_normalisation_type` |
| `marcela_asr_provider` | `marcelaAsrProvider` | text | `scribe_realtime` | `asr_provider` |
| `marcela_input_audio_format` | `marcelaInputAudioFormat` | text | `pcm_16000` | `user_input_audio_format` |
| `marcela_background_voice_detection` | `marcelaBackgroundVoiceDetection` | boolean | false | `background_voice_detection` |
| `marcela_turn_eagerness` | `marcelaTurnEagerness` | text | `normal` | `turn_eagerness` |
| `marcela_spelling_patience` | `marcelaSpellingPatience` | text | `auto` | `spelling_patience` |
| `marcela_speculative_turn` | `marcelaSpeculativeTurn` | boolean | false | `speculative_turn` |
| `marcela_silence_end_call_timeout` | `marcelaSilenceEndCallTimeout` | integer | 600 | `silence_end_call_timeout` |
| `marcela_max_duration` | `marcelaMaxDuration` | integer | 1800 | `max_duration_seconds` |
| `marcela_cascade_timeout` | `marcelaCascadeTimeout` | integer | 500 | `cascade_timeout_seconds` |

## VoiceSettings Admin UI

The VoiceSettings panel shows a focused subset of settings in the Admin > AI Agent > Voice Settings tab. **Philosophy**: only configure what's practical in-app; rare/granular settings stay on the ElevenLabs dashboard.

**Displayed in UI:**
- Voice ID, Stability, Similarity Boost, Speed, Speaker Boost, Output Format
- Turn Timeout, Silence End Call Timeout, Max Duration

**Stored in DB but NOT in UI** (managed via ElevenLabs dashboard):
- Streaming Latency, Text Normalisation, ASR Provider, Input Audio Format
- Background Voice Detection, Turn Eagerness, Spelling Patience, Speculative Turn, Cascade Timeout

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
- Our KB doc: `PvLHvew1A6513q25hSSG` (27,673 chars)
- Best practice: break large docs into focused pieces
- Review conversation transcripts to identify knowledge gaps
- **Dashboard limitation**: "No documents found" may show even when docs exist via API — this is a known ElevenLabs UI issue, not a bug

## Voice & Language Configuration

### Our Voices
| Language | Voice | ID | Model |
|----------|-------|----|-------|
| English | Jessica | `cgSgspJ2msm6clMCkdW9` | Flash v2 |
| Portuguese | Sarah | `EXAVITQu4vr4xnSDxMaL` | Multilingual v2.5 |
| Spanish | Configurable | Set on dashboard | Multilingual v2.5 |

### Voice Customization
- **Speed control**: 0.5x–2.0x (ConvAI range; standalone TTS is 0.7x–1.2x)
- **Expressive mode**: Emotional delivery (Eleven v3 Conversational)
- **Pronunciation dictionary**: IPA/CMU notation for specific words
- **Multi-voice**: Different voices for multi-character scenarios
- **Language-specific voices**: Per-language voice assignment

### Language Detection
Add the language detection system tool to auto-switch languages. Widget prompts user for language selection before conversation starts. Language is fixed for the call duration.

## Conversation Flow Settings

### Turn Timeout
How long agent waits in silence before prompting. Range: 1–30 seconds.
- Casual: 5–10s
- Technical/complex: 10–30s

### Soft Timeout
Filler audio when LLM is slow (e.g., "Hmm...", "Let me think..."). Default: disabled. Recommended: 3.0s.

### Interruptions
Whether users can interrupt agent mid-speech.

### Turn Eagerness
How quickly agent responds to user input. Options: `low`, `normal`, `high`.

### Spelling Patience
How long agent waits during spelling/dictation. Options: `auto`, `low`, `normal`, `high`.

### Speculative Turn
Pre-generate response during user speech for faster replies. Boolean, default false.

## Evaluation & Analysis (Dashboard)

### Evaluation Criteria
Define criteria in the Analysis tab. Every transcript is evaluated by LLM: `success`, `failure`, or `unknown` with rationale.

Example criterion:
```plaintext
Name: solved_user_inquiry
Prompt: The assistant was able to answer all queries or redirect to a relevant support channel.
```

### Data Collection
Extract structured data from each conversation. Configure per-item:
- **Data type**: string, number, boolean
- **Identifier**: unique key (e.g., `user_question`)
- **Description**: LLM instructions for extraction

### Post-Call Webhooks
- Event type: `post_call_transcription` — fires when call finishes and analysis is complete
- Configure webhooks in Developers page, then assign to agent

## Monitoring & Operations

### Conversation History
View transcripts, evaluation results, and collected data in the Call History tab.

### Experiments (A/B Testing)
Test agent configuration changes with live traffic. Requires multiple agent variants.

### Privacy & Data Retention
Configure retention policies for conversations and audio in agent privacy settings.

### Cost Optimization
Monitor LLM costs per conversation. Use smaller models (e.g., `gemini-2.0-flash-lite`) and shorter prompts to reduce costs.

### CLI Operations
```bash
npm install -g @elevenlabs/cli
elevenlabs auth login
elevenlabs agents init
elevenlabs agents add "My Assistant" --template assistant
elevenlabs agents push --agent "My Assistant"
elevenlabs agents widget "My Assistant"
```

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

## Telephony Integration

### Twilio (Native Integration)
See `.claude/skills/twilio-telephony/` for full telephony skill.

### SIP Trunking
Connect to existing telephony infrastructure via SIP trunk. Configured in ElevenLabs dashboard.

### Batch Outbound Calls
Trigger multiple calls programmatically via API.

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
- **Voice Settings** — Voice ID, TTS settings, conversation flow settings (focused UI)

See `.claude/skills/admin/ai-agent-admin.md` for full admin tab architecture.

## LLM Models (for Agent)

Models configured in `client/src/features/ai-agent/types.ts` → `LLM_MODELS`:

| Provider | Models |
|----------|--------|
| ElevenLabs (hosted) | `glm-45-air-fp8`, `qwen3-30b-a3b`, `qwen3-4b`, `gpt-oss-120b`, `gpt-oss-20b`, `watt-tool-70b`, `watt-tool-8b` |
| Google | `gemini-3-pro-preview`, `gemini-3-flash-preview`, `gemini-3.1-flash-lite-preview`, `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-2.0-flash`, `gemini-2.0-flash-lite`, `gemini-1.5-pro`, `gemini-1.5-flash` |
| OpenAI | `gpt-5`, `gpt-5.1`, `gpt-5.2`, `gpt-5-mini`, `gpt-5-nano`, `gpt-4.1`, `gpt-4.1-mini`, `gpt-4.1-nano`, `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo` |
| Anthropic | `claude-sonnet-4-6`, `claude-sonnet-4-5`, `claude-sonnet-4`, `claude-haiku-4-5`, `claude-3-7-sonnet`, `claude-3-5-sonnet`, `claude-3-haiku` |
| xAI | `grok-beta` |
| Custom | `custom-llm` (bring your own endpoint) |

Our agent uses: `gemini-2.0-flash-lite` (low cost, fast responses).

## Packages
- `@elevenlabs/convai-widget-core` — web component (currently used)
- `@elevenlabs/react` — React hooks (available for upgrade)
- `elevenlabs` — Node.js SDK (server-side, currently used for STT/TTS)

## Dual-Save Pattern
All PATCH routes save to **both** ElevenLabs API and local DB simultaneously. This ensures the ElevenLabs dashboard and our admin panel always stay in sync. The `useSaveAgentVoice` hook sends:
1. `POST /api/admin/voice-settings` — save to DB
2. `PATCH /api/admin/convai/agent/voice` — push to ElevenLabs API
