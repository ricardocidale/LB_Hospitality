---
name: twilio-integration
description: Twilio Voice and SMS integration patterns for conversational AI. Covers webhook setup, Media Streams, audio encoding, and admin configuration.
---

# Twilio Voice & SMS Integration

## Prerequisites
- Twilio connected via Replit integration (connector provides: account_sid, api_key, api_key_secret, phone_number)
- ElevenLabs connected via Replit integration (for STT and TTS)
- OpenAI connected via Replit AI integration (for LLM)

## Webhook Endpoints

### Voice Incoming — `POST /api/twilio/voice/incoming`
Returns TwiML that:
1. Greets the caller with `<Say>` (configurable greeting from DB)
2. Connects to a WebSocket Media Stream via `<Connect><Stream>`

```xml
<Response>
  <Say voice="Polly.Joanna">{greeting}</Say>
  <Connect>
    <Stream url="wss://{host}/api/twilio/voice/stream">
      <Parameter name="callerNumber" value="{From}" />
    </Stream>
  </Connect>
</Response>
```

**Toggle check**: Returns disabled message if `marcelaTwilioEnabled === false`.

### Voice Stream — WebSocket `/api/twilio/voice/stream`
Bidirectional audio stream using Twilio Media Streams API.

**Registration** (server/routes/twilio.ts):
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
  // ... connection handler
}
```

### SMS Incoming — `POST /api/twilio/sms/incoming`
Receives inbound SMS, processes through LLM, replies via TwiML `<Message>`.

**Toggle check**: Returns disabled message if `marcelaSmsEnabled === false`.

**Flow**:
1. Parse `From` and `Body` from POST body
2. Look up user by phone number
3. Create conversation with `channel: "sms"`
4. Send through LLM (non-streaming, uses SMS-optimized prompt)
5. Truncate reply to 1500 chars (SMS limit)
6. Return `<Response><Message>{reply}</Message></Response>`

### Voice Status — `POST /api/twilio/voice/status`
Simple 200 OK for Twilio status callbacks.

## Public API Paths
Twilio webhooks must bypass auth. Add to `PUBLIC_API_PATHS` in `server/index.ts`:
```typescript
"/api/twilio/voice/incoming",
"/api/twilio/voice/status",
"/api/twilio/sms/incoming",
```

## Audio Encoding Reference

### Mulaw (u-law) — Twilio native format
- 8-bit companded audio, 8kHz sample rate
- ITU-T G.711 standard
- Each byte encodes one sample (sign + exponent + mantissa)
- Dynamic range: ~78 dB

### Conversion Chain
```
Twilio → mulaw 8kHz → mulawBufferToWav() → WAV 8kHz 16-bit
  → ElevenLabs STT → text
  → GPT-4.1 → response text
  → ElevenLabs TTS → PCM 16kHz
  → downsample(16k→8k) → pcm16ToMulaw() → mulaw 8kHz
  → Twilio Media Stream
```

### mulaw2linear (decode)
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

### linear2mulaw (encode)
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

## Twilio Admin Configuration

### Schema Fields (global_assumptions)
| Column | Type | Default |
|--------|------|---------|
| `marcelaTwilioEnabled` | boolean | `false` |
| `marcelaSmsEnabled` | boolean | `false` |
| `marcelaPhoneGreeting` | text | "Hello, this is Marcela..." |

### Admin Endpoints
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/admin/twilio-status` | GET | Admin | Returns `{ connected, phoneNumber, error }` |
| `/api/admin/send-notification` | POST | Admin | Send SMS: `{ to, message }` |

### Admin UI (MarcelaTab.tsx — Telephony & SMS section)
- Connection status indicator (green/red dot + text)
- Twilio phone number display
- Enable/disable phone calls toggle
- Enable/disable SMS toggle
- Phone greeting textarea
- Webhook URLs display (auto-computed from `window.location.origin`)
- Test SMS form (phone number + message + send button)

## sendSMS Helper (server/integrations/twilio.ts)
```typescript
async function sendSMS(to: string, body: string): Promise<{ success, sid?, error? }>
```
- Auto-splits messages longer than 1600 chars at word boundaries
- Uses Twilio client from Replit connector credentials
- Returns message SID on success

## Caller Identification
Phone number matched against `users.phoneNumber` column:
```typescript
const user = callerNumber ? await storage.getUserByPhoneNumber(callerNumber) : undefined;
```
- If matched: conversation gets user context, role-based prompts
- If unmatched: treated as anonymous, still processes through LLM

## Conversation Persistence
All channels save to the same `conversations` + `messages` tables:
- Web: `channel = "web"` (default)
- Phone: `channel = "phone"`, title = `"Phone: {first 40 chars}"`
- SMS: `channel = "sms"`, title = `"SMS: {first 40 chars}"`

## Twilio Console Setup
Configure these in Twilio console:
1. **Voice webhook**: `https://{your-domain}/api/twilio/voice/incoming` (POST)
2. **SMS webhook**: `https://{your-domain}/api/twilio/sms/incoming` (POST)
3. **Status callback**: `https://{your-domain}/api/twilio/voice/status` (POST)

The Admin > Marcela tab displays these URLs for easy copy.
