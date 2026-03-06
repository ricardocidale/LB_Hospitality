# ElevenLabs Agent Authentication

## Overview

Two methods to secure conversational agents:

1. **Signed URLs** — temporary authenticated URLs for client-side connections (recommended)
2. **Allowlists** — restrict access to specific domains/hostnames

## Signed URLs (Recommended)

### How It Works

1. Your server requests a signed URL from ElevenLabs using your API key
2. ElevenLabs generates a temporary token and returns a signed WebSocket URL
3. Client uses the signed URL to establish connection
4. Signed URL expires after **15 minutes** (session continues if already started)

### Server-Side Generation

```typescript
// Node.js / TypeScript
import { ElevenLabsClient } from "elevenlabs";

async function getSignedUrl(agentId: string): Promise<string> {
  const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
  const response = await client.conversationalAi.conversations.getSignedUrl({
    agent_id: agentId,
  });
  return response.signed_url;
}
```

**Direct API call:**
```bash
curl -X GET \
  "https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=YOUR_AGENT_ID" \
  -H "xi-api-key: YOUR_API_KEY"
```

Response:
```json
{
  "signed_url": "wss://api.elevenlabs.io/v1/convai/conversation?agent_id=...&conversation_signature=..."
}
```

### Client-Side Usage

**React SDK:**
```tsx
const conversation = useConversation();

useEffect(() => {
  const start = async () => {
    const { signed_url } = await fetch("/api/signed-url").then(r => r.json());
    await conversation.startSession({ signedUrl: signed_url });
  };
  start();
}, []);
```

**Widget (web component):**
```html
<elevenlabs-convai url="wss://api.elevenlabs.io/v1/convai/conversation?agent_id=...&conversation_signature=..." />
```

### HBG Portal Implementation

The server endpoint `GET /api/marcela/signed-url` generates signed URLs using the Replit ElevenLabs connector. When the connector is unauthorized, the widget falls back to public `agent-id` mode.

## Allowlists

Restrict which domains can connect to your agent. Configure in the ElevenLabs dashboard under agent security settings.

## Public vs Private Agents

- **Public agents** — accessible with just `agent-id`, no API key needed
- **Private agents** — require signed URL or API key authentication

⚠️ Never expose your `xi-api-key` in client-side code. Always generate signed URLs server-side.
