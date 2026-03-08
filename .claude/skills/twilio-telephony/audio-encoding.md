# Audio Encoding — Mulaw/PCM Conversion

## Overview
Twilio Media Streams use mulaw (u-law / G.711) audio at 8kHz. ElevenLabs uses PCM at 16kHz+. All audio conversion functions live in `server/integrations/elevenlabs-audio.ts`.

## Conversion Chain
```
Inbound:
  Twilio mulaw 8kHz → mulawBufferToWav() → WAV 8kHz 16-bit → ElevenLabs STT

Outbound:
  ElevenLabs TTS → PCM 16kHz → downsample(16k→8k) → pcm16ToMulaw() → Twilio mulaw 8kHz
```

## Mulaw (u-law) Format Reference
- ITU-T G.711 standard for telephony
- 8-bit companded audio, 8kHz sample rate
- Each byte encodes one sample (sign + exponent + mantissa)
- Dynamic range: ~78 dB
- Non-linear encoding: more precision for quiet sounds, less for loud

## mulaw2linear — Decode (mulaw → PCM 16-bit)
```typescript
function mulaw2linear(mulawByte: number): number {
  mulawByte = ~mulawByte & 0xFF;
  const sign = mulawByte & 0x80;
  const exponent = (mulawByte >> 4) & 0x07;
  let mantissa = mulawByte & 0x0F;
  let sample = (mantissa << (exponent + 3)) + (1 << (exponent + 3)) - 132;
  if (sign !== 0) sample = -sample;
  return sample;
}
```

**Algorithm**:
1. Complement and mask to 8 bits
2. Extract sign (bit 7), exponent (bits 4-6), mantissa (bits 0-3)
3. Reconstruct linear sample using shift + bias (-132)
4. Apply sign

## linear2mulaw — Encode (PCM 16-bit → mulaw)
```typescript
function linear2mulaw(sample: number): number {
  const BIAS = 132;
  const CLIP = 32635;
  const sign = (sample >> 8) & 0x80;
  if (sign !== 0) sample = -sample;
  if (sample > CLIP) sample = CLIP;
  sample += BIAS;
  let exponent = 7;
  const expMask = 0x4000;
  for (let i = 0; i < 8; i++) {
    if ((sample & expMask) !== 0) break;
    exponent--;
    sample <<= 1;
  }
  const mantissa = (sample >> 10) & 0x0F;
  return ~(sign | (exponent << 4) | mantissa) & 0xFF;
}
```

**Algorithm**:
1. Extract sign, take absolute value
2. Clip to max 32635 (prevent overflow)
3. Add bias (132) for zero-crossing accuracy
4. Find exponent by counting leading zeros
5. Extract 4-bit mantissa
6. Pack sign + exponent + mantissa, complement

## mulawBufferToWav — Convert mulaw buffer to WAV file
Converts raw mulaw bytes to a standard WAV file (PCM 16-bit, 8kHz):
1. Decode each mulaw byte to 16-bit PCM using `mulaw2linear()`
2. Build WAV header (44 bytes): RIFF chunk, fmt sub-chunk (PCM format, 1 channel, 8000 Hz, 16-bit), data sub-chunk
3. Concatenate header + PCM data

## pcm16ToMulaw — Convert PCM buffer to mulaw
Converts 16-bit PCM buffer to mulaw buffer:
1. Read each 16-bit sample (little-endian)
2. Encode using `linear2mulaw()`
3. Write to output buffer

## downsample — Change sample rate
```typescript
function downsample(audioBase64: string, fromRate: number, toRate: number): Buffer
```
Converts PCM audio from one sample rate to another using linear interpolation:
- Input: Base64-encoded PCM 16-bit audio
- Calculates ratio: `fromRate / toRate` (e.g., 16000/8000 = 2)
- Interpolates between samples for smooth downsampling
- Returns Buffer of 16-bit PCM at target rate

## escapeXml — XML-safe text
Escapes `&`, `<`, `>`, `"`, `'` for safe embedding in TwiML responses.

## Typical Flow in Voice Stream Handler

```typescript
// 1. Receive mulaw from Twilio
const fullAudio = Buffer.concat(audioBuffer);

// 2. Convert to WAV for STT
const wavBuffer = mulawBufferToWav(fullAudio);
const transcript = await transcribeAudio(wavBuffer, "audio.wav", sttModel);

// 3. Get LLM response + stream to TTS
const ttsStream = await createElevenLabsStreamingTTS(voiceId, (audioBase64) => {
  // 4. TTS callback: convert PCM → mulaw
  const pcmRate = parseInt(outputFormat.replace("pcm_", "")) || 16000;
  const downsampled = downsample(audioBase64, pcmRate, 8000);
  const mulawData = Buffer.alloc(downsampled.length / 2);
  for (let i = 0; i < mulawData.length; i++) {
    const sample = downsampled.readInt16LE(i * 2);
    mulawData[i] = linear2mulaw(sample);
  }

  // 5. Send mulaw back to Twilio
  ws.send(JSON.stringify({
    event: "media",
    streamSid,
    media: { payload: mulawData.toString("base64") },
  }));
}, { outputFormat, modelId, stability, similarityBoost, speakerBoost, chunkSchedule });

// Stream LLM tokens into TTS
for await (const chunk of llmStream) {
  ttsStream.send(chunk.choices[0]?.delta?.content || "");
}
ttsStream.flush();
ttsStream.close();
```

## Performance Notes
- Mulaw encoding/decoding is CPU-bound but very fast (simple bit manipulation)
- Downsampling from 16kHz to 8kHz halves the data size
- TTS chunk schedule `[120, 160, 250, 290]` controls when audio chunks are sent (character counts) for smooth streaming
- 500ms delays after flush/close allow final audio to reach Twilio before WebSocket cleanup
