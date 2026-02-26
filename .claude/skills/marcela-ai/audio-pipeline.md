---
name: audio-pipeline
description: Complete audio pipeline documentation for all Marcela voice channels. Covers encoding, conversion, streaming, and playback.
---

# Marcela Audio Pipeline

## Web Voice Pipeline

```
Browser Mic → MediaRecorder (WebM/Opus, 100ms chunks)
  → stopRecording() → Blob
  → base64 encode → POST /api/conversations/:id/voice
  → server ffmpeg convert to WAV (via ensureCompatibleFormat)
  → ElevenLabs STT (Scribe v1) → transcript text
  → GPT-4.1 streaming → delta text chunks
  → ElevenLabs TTS WebSocket (streaming, PCM 16kHz)
  → SSE events: { type: "audio", data: base64_pcm }
  → client decodePCM16ToFloat32()
  → AudioWorklet (24kHz context) → speakers
```

### Key Components
- **useVoiceRecorder**: `startRecording()` / `stopRecording()` → WebM Blob
- **useAudioPlayback**: `init()` / `pushAudio(base64)` / `pushSequencedAudio(seq, base64)` / `clear()`
- **SequenceBuffer**: Reorders out-of-order chunks before playback
- **AudioWorklet** (`audio-playback-worklet.js`): Ring buffer processor for gapless streaming

### SSE Event Types (voice endpoint)
```json
{ "type": "user_transcript", "data": "transcribed text" }
{ "type": "text", "data": "LLM delta text" }
{ "type": "audio", "data": "base64 PCM16 audio" }
{ "done": true }
```

## Phone Voice Pipeline (Twilio Media Streams)

```
Caller speaks → Twilio captures mulaw 8kHz
  → WebSocket /api/twilio/voice/stream
  → event: "media" → base64 mulaw chunks → audioBuffer[]
  → 2-second silence timeout triggers processing
  → Buffer.concat(audioBuffer) → mulawBufferToWav()
    → mulaw2linear() per sample → 16-bit PCM
    → WAV header (RIFF, 8kHz, 16-bit mono)
  → ElevenLabs STT → transcript
  → GPT-4.1 streaming → delta text
  → ElevenLabs TTS WebSocket (PCM 16kHz) → base64 PCM chunks
  → downsample(16kHz → 8kHz) → pcm16ToMulaw()
  → WebSocket send: { event: "media", streamSid, media: { payload: base64_mulaw } }
  → Twilio plays to caller
```

### Audio Conversion Functions (server/routes/twilio.ts)

| Function | Input | Output | Purpose |
|----------|-------|--------|---------|
| `mulaw2linear(byte)` | u-law byte (0-255) | signed int16 | Decode u-law to linear PCM |
| `linear2mulaw(sample)` | signed int16 | u-law byte | Encode linear PCM to u-law |
| `mulawBufferToWav(buf)` | Buffer of u-law bytes | Buffer (WAV) | Full u-law → WAV with 44-byte header |
| `pcm16ToMulaw(base64)` | base64 PCM16 | Buffer of u-law | Batch PCM16 → u-law |
| `downsample(base64, from, to)` | base64 PCM16 | Buffer PCM16 | Nearest-neighbor rate conversion |

### Twilio WebSocket Protocol
```json
// Incoming events from Twilio
{ "event": "start", "start": { "streamSid": "...", "customParameters": { "callerNumber": "+1..." } } }
{ "event": "media", "media": { "payload": "base64_mulaw_audio" } }
{ "event": "stop" }

// Outgoing events to Twilio
{ "event": "media", "streamSid": "...", "media": { "payload": "base64_mulaw_audio" } }
```

### Silence Detection
- `SILENCE_TIMEOUT_MS = 2000` (2 seconds)
- Each incoming media chunk resets the silence timer
- When silence detected → process accumulated audio buffer
- Minimum audio threshold: `fullAudio.length < 1600` bytes = skip (too short)
- `isProcessing` flag prevents concurrent processing

## ElevenLabs Integration (server/integrations/elevenlabs.ts)

### STT (Speech-to-Text)
```typescript
transcribeAudio(audioBuffer: Buffer, filename: string, sttModel?: string): Promise<string>
```
- Endpoint: `POST https://api.elevenlabs.io/v1/speech-to-text`
- Default model: `scribe_v1`
- Accepts WAV or WebM input

### TTS (Text-to-Speech) — Streaming WebSocket
```typescript
createElevenLabsStreamingTTS(
  voiceId: string,
  onAudioChunk: (audioBase64: string) => void,
  options?: { modelId, outputFormat, stability, similarityBoost, speakerBoost, chunkSchedule }
): Promise<{ send, flush, close }>
```
- WebSocket URL: `wss://api.elevenlabs.io/v1/text-to-speech/{voiceId}/stream-input`
- Auth: `xi-api-key` header
- Initial message: voice settings + chunk schedule
- Send text incrementally via `.send(text)`
- Flush remaining with `.flush()` (sends `{ text: " ", flush: true }`)
- Close with `.close()` (sends `{ text: "" }`)

### Voice Config Builder
```typescript
buildVoiceConfigFromDB(ga: Record<string, unknown>): VoiceConfig
```
Reads `marcela*` columns from global_assumptions and returns typed config with defaults.

## Default Voice Configuration
```typescript
{
  voiceId: 'cgSgspJ2msm6clMCkdW9',  // Jessica
  ttsModel: 'eleven_flash_v2_5',
  sttModel: 'scribe_v1',
  outputFormat: 'pcm_16000',
  stability: 0.5,
  similarityBoost: 0.8,
  speakerBoost: false,
  chunkSchedule: [120, 160, 250, 290],
}
```
