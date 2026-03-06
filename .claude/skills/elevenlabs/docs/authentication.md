# ElevenLabs Authentication

## API Key Authentication

All server-side API requests require the `xi-api-key` header:

```typescript
import { ElevenLabsClient } from "elevenlabs";

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});
```

```bash
curl -H "xi-api-key: YOUR_API_KEY" \
  https://api.elevenlabs.io/v1/voices
```

Create API keys at: https://elevenlabs.io/app/settings/api-keys

**Never expose API keys client-side.** Use signed URLs or conversation tokens for browser connections.

## Client-Side Authentication Methods

### 1. Signed URLs (WebSocket connections)

Temporary authenticated URLs for WebSocket-based conversations. Expire after 15 minutes.

**Server-side generation:**
```typescript
async function getSignedUrl(agentId: string): Promise<string> {
  const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
  const response = await client.conversationalAi.conversations.getSignedUrl({
    agentId,
  });
  return response.signedUrl;
}
```

**REST API:**
```bash
GET https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=AGENT_ID
Headers: xi-api-key: YOUR_API_KEY

Response: { "signed_url": "wss://api.elevenlabs.io/v1/convai/conversation?agent_id=...&conversation_signature=..." }
```

**Client-side usage (React SDK):**
```tsx
const response = await fetch("/api/signed-url");
const signedUrl = await response.text();
await conversation.startSession({ signedUrl, connectionType: "websocket" });
```

**Client-side usage (widget):**
```html
<elevenlabs-convai signed-url="wss://..." />
```

### 2. Conversation Tokens (WebRTC connections)

Tokens for WebRTC-based conversations. More secure than signed URLs.

**Server-side generation:**
```typescript
async function getConversationToken(agentId: string): Promise<string> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
    { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY } }
  );
  const { token } = await response.json();
  return token;
}
```

**Client-side usage:**
```tsx
await conversation.startSession({
  conversationToken: token,
  connectionType: "webrtc",
});
```

### 3. Public Agents (No Authentication)

For agents with authentication disabled:
```tsx
await conversation.startSession({
  agentId: "agent_id",
  connectionType: "webrtc",
});
```

## Domain Allowlists

Restrict which domains can embed your agent:
- Configure in ElevenLabs dashboard → Agent Settings → Security → Allowlist
- Only specified hostnames can connect

## Express Server Pattern

```typescript
import express from "express";
import { ElevenLabsClient } from "elevenlabs";

const app = express();
const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

app.get("/api/signed-url", authMiddleware, async (req, res) => {
  try {
    const { signedUrl } = await client.conversationalAi.conversations.getSignedUrl({
      agentId: process.env.AGENT_ID!,
    });
    res.json({ signed_url: signedUrl });
  } catch (error) {
    console.error("Failed to get signed URL:", error);
    res.status(500).json({ error: "Failed to generate signed URL" });
  }
});

app.get("/api/conversation-token", authMiddleware, async (req, res) => {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${process.env.AGENT_ID}`,
      { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! } }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Failed to get conversation token:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});
```

## Replit Integration

When using the Replit ElevenLabs connector:
```typescript
import { getUncachableElevenLabsClient } from "@replit/elevenlabs";

const client = getUncachableElevenLabsClient();
// Client is pre-authenticated — no API key needed
// NEVER cache the client — tokens expire
```

## Security Best Practices

1. **Never expose API keys** in client-side code or public repos
2. **Use signed URLs** for private agents — they expire automatically
3. **Configure allowlists** to restrict agent access to your domains
4. **Rotate API keys** periodically
5. **Use environment variables** for all secrets
6. **Add auth middleware** to your signed URL endpoint
