# ElevenLabs Text-to-Speech (TTS)

## Models

| Model | ID | Latency | Languages | Best For |
|-------|-----|---------|-----------|----------|
| Flash v2.5 | `eleven_flash_v2_5` | Ultra-low | 32 | Conversational, real-time |
| Multilingual v2 | `eleven_multilingual_v2` | Standard | 29 | Highest quality, narration |
| Turbo v2.5 | `eleven_turbo_v2_5` | Low | 32 | Balance of quality & speed |
| English v1 | `eleven_monolingual_v1` | Low | 1 (EN) | English-only, legacy |

Flash v2.5 is 50% cheaper per character than standard models.

## Basic Usage

### Node.js SDK
```typescript
import { ElevenLabsClient } from "elevenlabs";

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

const audio = await client.textToSpeech.convert("VOICE_ID", {
  text: "Hello world",
  modelId: "eleven_flash_v2_5",
  outputFormat: "mp3_44100_128",
});
```

### Streaming
```typescript
const stream = await client.textToSpeech.stream("VOICE_ID", {
  text: "This is streamed audio",
  modelId: "eleven_flash_v2_5",
});

for await (const chunk of stream) {
  // process audio chunks
}
```

### With Timestamps
```typescript
const result = await client.textToSpeech.convertWithTimestamps("VOICE_ID", {
  text: "Hello world",
  modelId: "eleven_flash_v2_5",
});
// result includes word-level timing data
```

## Output Formats

| Format | Sample Rate | Bitrate | Tier |
|--------|-------------|---------|------|
| `mp3_22050_32` | 22.05 kHz | 32 kbps | Free |
| `mp3_44100_128` | 44.1 kHz | 128 kbps | Free |
| `mp3_44100_192` | 44.1 kHz | 192 kbps | Creator+ |
| `pcm_16000` | 16 kHz | — | Free |
| `pcm_22050` | 22.05 kHz | — | Free |
| `pcm_24000` | 24 kHz | — | Free |
| `pcm_44100` | 44.1 kHz | — | Pro+ |
| `ulaw_8000` | 8 kHz | — | Free |

**For Twilio:** Use `ulaw_8000` (μ-law format).

## Voice Settings

```typescript
const audio = await client.textToSpeech.convert("VOICE_ID", {
  text: "Hello",
  modelId: "eleven_flash_v2_5",
  voiceSettings: {
    stability: 0.5,        // 0.0–1.0 (lower = more expressive)
    similarityBoost: 0.75, // 0.0–1.0 (higher = closer to original)
    style: 0.0,            // 0.0–1.0 (higher = more stylistic)
    useSpeakerBoost: true, // enhance speaker clarity
  },
});
```

| Setting | Range | Default | Effect |
|---------|-------|---------|--------|
| `stability` | 0.0–1.0 | 0.5 | Lower = more expressive/variable |
| `similarityBoost` | 0.0–1.0 | 0.75 | Higher = closer to reference voice |
| `style` | 0.0–1.0 | 0.0 | Higher = more stylistic (costs latency) |
| `useSpeakerBoost` | bool | true | Enhance speaker clarity |

## Language Codes

Pass `languageCode` to enforce a specific language:
```typescript
const audio = await client.textToSpeech.convert("VOICE_ID", {
  text: "Olá mundo",
  modelId: "eleven_multilingual_v2",
  languageCode: "pt",
});
```

Common codes: `en`, `es`, `fr`, `de`, `it`, `pt`, `pl`, `hi`, `ar`, `ja`, `ko`, `zh`

## REST API

```bash
curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/VOICE_ID" \
  -H "xi-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world",
    "model_id": "eleven_flash_v2_5",
    "output_format": "mp3_44100_128"
  }' \
  --output output.mp3
```

## Response Headers

Track costs via response headers:
```typescript
const response = await client.textToSpeech.withRawResponse.convert("VOICE_ID", options);
const charCount = response.headers.get("x-character-count");
const requestId = response.headers.get("request-id");
```

## SSML Support

ElevenLabs supports a subset of SSML:
```typescript
const audio = await client.textToSpeech.convert("VOICE_ID", {
  text: '<speak><break time="1s"/>Hello <emphasis>world</emphasis></speak>',
  modelId: "eleven_multilingual_v2",
});
```

## Pronunciation Dictionaries

Create custom pronunciations for specific words:
```typescript
const dict = await client.pronunciationDictionaries.addFromFile(file, {
  name: "Custom Terms",
});
```
