# ElevenLabs Twilio Integration

## Overview

Connect Twilio phone numbers to ElevenLabs agents for inbound and outbound voice calls.

## Setup Steps

### 1. Get Twilio Credentials
- Account SID and Auth Token from [Twilio Console](https://console.twilio.com)
- A Twilio phone number

### 2. Register in ElevenLabs
```typescript
const phoneNumber = await client.conversationalAi.phoneNumbers.create({
  provider: "twilio",
  phoneNumber: "+1234567890",
  label: "Support Line",
  agentId: "agent_id",
});
```

### 3. Configure Twilio Webhook

Set your Twilio number's webhook URL to receive incoming calls:

**Option A: Direct TwiML endpoint**
```
POST https://api.elevenlabs.io/v1/convai/twilio/inbound_call
```

**Option B: Your server proxy**
```typescript
app.post("/api/twilio/inbound", async (req, res) => {
  const twiml = await client.conversationalAi.twilio.getInboundCallTwiml({
    agentId: "agent_id",
  });
  res.type("text/xml").send(twiml);
});
```

## Outbound Calls

### Get TwiML for Outbound Call
```typescript
const twiml = await client.conversationalAi.twilio.getOutboundCallTwiml({
  agentId: "agent_id",
});
```

### Make Outbound Call via Twilio SDK
```typescript
import twilio from "twilio";

const twilioClient = twilio(accountSid, authToken);

const call = await twilioClient.calls.create({
  to: "+1234567890",
  from: "+0987654321",
  twiml: outboundTwiml,
});
```

## Audio Format

For Twilio, use μ-law 8kHz format:
```typescript
const audio = await client.textToSpeech.convert("VOICE_ID", {
  text: "Hello",
  outputFormat: "ulaw_8000",
});
```

## Dynamic Variables

Automatically set for phone calls:
- `{{system__caller_id}}` — Caller's phone number
- `{{system__called_number}}` — Called number

## Personalization via Webhook

Use a conversation initiation webhook to look up caller info:

```typescript
app.post("/api/elevenlabs/init", async (req, res) => {
  const callerId = req.body.dynamic_variables?.system__caller_id;
  const customer = await lookupCustomer(callerId);

  res.json({
    dynamic_variables: {
      customer_name: customer.name,
      account_status: customer.status,
    },
  });
});
```

Configure the webhook URL in agent settings → Advanced → Conversation Initiation Webhook.

## Error Handling

Common issues:
- **Twilio 401**: Check Account SID and Auth Token
- **No audio**: Verify μ-law 8kHz format for Twilio
- **Call drops immediately**: Check Twilio webhook URL configuration
- **Agent doesn't respond**: Verify agent ID and API key
