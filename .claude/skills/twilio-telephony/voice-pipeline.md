# Voice Pipeline — Twilio Media Streams

## Overview
Inbound phone calls use Twilio's Media Streams API to send/receive real-time audio over WebSocket. Our server handles the full audio pipeline: receive mulaw → convert to WAV → transcribe (ElevenLabs STT) → generate response (OpenAI LLM) → synthesize speech (ElevenLabs TTS) → convert back to mulaw → send to Twilio.

## Webhook: `POST /api/twilio/voice/incoming`

Returns TwiML that greets the caller and connects to a WebSocket stream.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">{greeting}</Say>
  <Connect>
    <Stream url="wss://{host}/api/twilio/voice/stream">
      <Parameter name="callerNumber" value="{From}" />
    </Stream>
  </Connect>
</Response>
```

**Toggle check**: Returns disabled message + `<Hangup/>` if `marcelaTwilioEnabled === false`.

**Greeting source**: `global_assumptions.marcelaPhoneGreeting` or default fallback.

**TwiML voice**: `Polly.Joanna` (Amazon Polly via Twilio, for initial greeting only — all subsequent speech uses ElevenLabs TTS).

## WebSocket: `/api/twilio/voice/stream`

### Registration
```typescript
export function registerTwilioWebSocket(httpServer: Server) {
  const wss = new WebSocketServer({ noServer: true });
  httpServer.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url || "", `http://${request.headers.host}`);
    if (url.pathname === "/api/twilio/voice/stream") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });
}
```

### Media Stream Protocol

Twilio sends JSON messages with these events:

| Event | Payload | Purpose |
|-------|---------|---------|
| `start` | `{ streamSid, customParameters: { callerNumber } }` | Stream initialized |
| `media` | `{ payload: "<base64 mulaw>" }` | Audio chunk (mulaw 8kHz) |
| `stop` | — | Stream ended |

### Audio Processing Flow

1. **Receive mulaw chunks**: Buffer incoming `media` events into `audioBuffer[]`
2. **Silence detection**: After `SILENCE_TIMEOUT_MS` (2000ms) of no new audio, process the buffer
3. **Minimum length check**: Skip if `fullAudio.length < 1600` bytes (~200ms of audio)
4. **Convert to WAV**: `mulawBufferToWav(fullAudio)` → standard WAV format
5. **Transcribe**: `transcribeAudio(wavBuffer, "audio.wav", sttModel)` → text
6. **Caller lookup**: `storage.getUserByPhoneNumber(callerNumber)` for role-based context
7. **Build context**: Portfolio data + RAG chunks + conversation history
8. **LLM streaming**: OpenAI chat completion (streamed)
9. **TTS streaming**: `createElevenLabsStreamingTTS()` — LLM tokens stream into TTS as they arrive
10. **Audio conversion**: PCM 16kHz → downsample to 8kHz → `linear2mulaw()` → base64
11. **Send back**: WebSocket `media` event with mulaw payload to Twilio

### Sending Audio Back to Twilio
```typescript
ws.send(JSON.stringify({
  event: "media",
  streamSid,
  media: {
    payload: mulawData.toString("base64"),
  },
}));
```

### Voice Config
Voice configuration is loaded from DB via `buildVoiceConfigFromDB(ga)`:
```typescript
const voiceConfig: VoiceConfig = {
  voiceId: MARCELA_VOICE_ID,  // cgSgspJ2msm6clMCkdW9
  ttsModel: 'eleven_flash_v2_5',
  sttModel: 'scribe_v1',
  outputFormat: 'pcm_16000',
  stability: 0.5,
  similarityBoost: 0.8,
  speakerBoost: false,
  chunkSchedule: [120, 160, 250, 290],
};
```

### LLM Configuration
- **Model**: `ga.marcelaLlmModel` or `"gpt-4.1"` default
- **Max tokens**: `ga.marcelaMaxTokensVoice` or `1024` default
- **System prompt**: Built via `buildSystemPrompt("phone", isAdmin)` — includes phone-specific instructions (concise responses, no markdown, conversational tone)
- **Context**: Portfolio data + RAG chunks + full conversation history

### Conversation Persistence
- Created on first user utterance: `chatStorage.createConversation("Phone: {first 40 chars}", "phone")`
- All messages saved to same `conversations` + `messages` tables as web chat
- `conversationId` persists across the entire call session

### State Management
| Variable | Purpose |
|----------|---------|
| `streamSid` | Twilio stream identifier for sending audio back |
| `callerNumber` | Caller's phone number (from custom parameter) |
| `audioBuffer` | Accumulates incoming mulaw chunks |
| `silenceTimer` | Fires after 2s silence to trigger processing |
| `conversationId` | Created on first utterance, reused for entire call |
| `isProcessing` | Prevents concurrent processing (ignores media during LLM/TTS) |

## Status Callback: `POST /api/twilio/voice/status`
Simple 200 OK response for Twilio call status updates. No processing.
