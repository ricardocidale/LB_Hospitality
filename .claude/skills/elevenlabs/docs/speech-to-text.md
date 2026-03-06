# ElevenLabs Speech-to-Text (STT)

## Models

| Model | ID | Description |
|-------|-----|-------------|
| Scribe v1 | `scribe_v1` | Standard transcription |
| Scribe v2 | `scribe_v2` | Improved accuracy, more features |

## Basic Usage

### Node.js SDK
```typescript
import { ElevenLabsClient } from "elevenlabs";
import fs from "fs";

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

const result = await client.speechToText.convert({
  file: fs.createReadStream("audio.mp3"),
  modelId: "scribe_v2",
});

console.log(result.text);
```

### With Options
```typescript
const result = await client.speechToText.convert({
  file: fs.createReadStream("meeting.mp3"),
  modelId: "scribe_v2",
  languageCode: "en",
  diarize: true,
  numSpeakers: 4,
  tagAudioEvents: true,
  timestampsGranularity: "word",
});
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | File | Audio/video file to transcribe |
| `modelId` | string | `scribe_v1` or `scribe_v2` |
| `languageCode` | string | ISO 639-1/639-3 code (optional, auto-detected) |
| `diarize` | boolean | Enable speaker diarization |
| `numSpeakers` | number | Max speakers (up to 32) |
| `tagAudioEvents` | boolean | Tag events like `(laughter)`, `(music)` |
| `timestampsGranularity` | string | `"word"` or `"character"` |
| `diarizationThreshold` | number | Higher = fewer false speaker splits |

## Response Format

```typescript
interface TranscriptionResult {
  text: string;
  words?: Array<{
    text: string;
    start: number;
    end: number;
    type: "word" | "spacing" | "audio_event";
    speaker_id?: string;
  }>;
  language_code: string;
  language_probability: number;
}
```

## Multi-Channel Audio

When `useMultiChannel` is true and audio has multiple channels:
```typescript
const result = await client.speechToText.convert({
  file: audioFile,
  modelId: "scribe_v2",
  useMultiChannel: true,
});
// Returns `transcripts` object with separate transcripts per channel
```

## REST API

```bash
curl -X POST "https://api.elevenlabs.io/v1/speech-to-text" \
  -H "xi-api-key: YOUR_API_KEY" \
  -F "file=@audio.mp3" \
  -F "model_id=scribe_v2" \
  -F "diarize=true" \
  -F "language_code=en"
```

## Webhook Mode

For async processing of large files:
```typescript
const result = await client.speechToText.convert({
  file: largeAudioFile,
  modelId: "scribe_v2",
  webhook: true,
  webhookMetadata: "my-custom-id-123",
});
```

Results are sent to configured webhooks when processing completes.

## Supported Formats

Audio: MP3, WAV, M4A, FLAC, OGG, WEBM, AAC
Video: MP4, MOV, AVI, MKV, WEBM
