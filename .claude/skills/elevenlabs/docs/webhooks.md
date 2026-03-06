# ElevenLabs Webhooks

## Overview

Webhooks notify your server about events in the ElevenLabs platform:
- Conversation events (start, end, tool calls)
- Transcription completion
- Voice cloning status changes

## Webhook Types

### Conversation Initiation Webhook

Called when a new conversation starts. Returns dynamic variables for personalization.

**Configuration:** Agent Settings → Advanced → Conversation Initiation Webhook

```typescript
app.post("/api/elevenlabs/conversation-init", async (req, res) => {
  const { agent_id, dynamic_variables } = req.body;
  const callerId = dynamic_variables?.system__caller_id;

  const userData = await lookupUser(callerId);

  res.json({
    dynamic_variables: {
      user_name: userData.name,
      account_level: userData.tier,
      recent_orders: JSON.stringify(userData.recentOrders),
    },
  });
});
```

### Conversation End Webhook

Called when a conversation ends. Useful for logging, analytics, follow-up actions.

```typescript
app.post("/api/elevenlabs/conversation-end", async (req, res) => {
  const { conversation_id, agent_id, transcript, duration } = req.body;

  await saveConversationLog({
    conversationId: conversation_id,
    agentId: agent_id,
    transcript,
    duration,
    endedAt: new Date(),
  });

  res.json({ status: "ok" });
});
```

### Server Tool Webhooks

When a server tool is invoked, ElevenLabs calls your endpoint:

```typescript
app.post("/api/elevenlabs/tool/lookup-order", async (req, res) => {
  const { order_id } = req.body;
  const order = await db.orders.findById(order_id);

  res.json({
    order_status: order.status,
    estimated_delivery: order.deliveryDate,
    items: order.items.map(i => i.name).join(", "),
  });
});
```

### STT Transcription Webhook

For async transcription jobs:

```typescript
app.post("/api/elevenlabs/transcription-complete", async (req, res) => {
  const { text, language_code, words, metadata } = req.body;
  const customId = metadata; // webhookMetadata from original request

  await saveTranscription(customId, { text, language_code, words });
  res.json({ status: "ok" });
});
```

## Webhook Security

### Validating Webhook Signatures

ElevenLabs includes a signature header for webhook verification:

```typescript
import crypto from "crypto";

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

app.post("/api/elevenlabs/webhook", (req, res) => {
  const signature = req.headers["x-elevenlabs-signature"];
  const rawBody = JSON.stringify(req.body);

  if (!verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  // Process webhook...
});
```

## Webhook Management API

### List Webhooks
```typescript
const webhooks = await client.webhooks.list();
```

### Create Webhook
```typescript
const webhook = await client.webhooks.create({
  url: "https://your-server.com/api/webhook",
  events: ["conversation.started", "conversation.ended"],
  secret: "your-webhook-secret",
});
```

## Best Practices

1. **Respond quickly** — Return 200 within 5 seconds; do async processing
2. **Idempotency** — Handle duplicate deliveries gracefully
3. **Retry handling** — Failed webhooks are retried with exponential backoff
4. **Logging** — Log all webhook payloads for debugging
5. **Timeouts** — Conversation initiation webhooks must respond fast or the conversation start is delayed
