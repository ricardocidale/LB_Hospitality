# ElevenLabs WhatsApp Integration

## Overview

Connect a WhatsApp Business account to an ElevenLabs Agent for automated message conversations and voice calls.

## Setup

1. Go to [WhatsApp page](https://elevenlabs.io/app/agents/whatsapp) → **Import account**
2. Complete authorization flow (select account, grant permissions)
3. Assign an agent to the account
4. Configure in [WhatsApp Manager](https://business.facebook.com/latest/whatsapp_manager/):
   - Profile picture: Phone numbers → select → Profile tab
   - Voice calls: Phone numbers → select → Call settings tab
   - Outbound calls: Overview → Add payment method

## Message Conversations

### Inbound
User sends message → agent responds automatically. Conversation ends via:
- **End conversation** system tool (if enabled)
- **Max conversation duration** timeout

### Outbound
1. Create message template in [WhatsApp Manager](https://business.facebook.com/latest/whatsapp_manager/message_templates)
2. Call the API:

```typescript
await client.conversationalAi.whatsapp.outboundMessage({
  phoneNumberId: "phone_number_id",
  to: "+1234567890",
  templateName: "greeting_template",
  templateLanguage: "en",
});
```

### Supported Message Types
- **Text** — standard messages
- **Audio** — transcribed via STT before passing to agent
- **Images** — processed by agent
- **Documents** — processed by agent

## Voice Calls

### Inbound
Call the WhatsApp business number → agent responds. Text messages during call are incorporated.

### Outbound
Requires user permission. Schedule via API:

```typescript
await client.conversationalAi.whatsapp.outboundCall({
  phoneNumberId: "phone_number_id",
  to: "+1234567890",
  agentId: "agent_id",
});
```

ElevenLabs auto-sends permission request template if needed.

## Account Management

```typescript
const accounts = await client.conversationalAi.whatsappAccounts.list();
const account = await client.conversationalAi.whatsappAccounts.get("account_id");
```

## Dynamic Variables

Set automatically:
- `{{system__caller_id}}` — WhatsApp user ID
- `{{system__called_number}}` — WhatsApp phone number ID

## Pricing

Meta charges for:
- Outbound calls
- Messages outside [Customer Service Window](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages#customer-service-windows)

Payment method required on WhatsApp business account for outbound calls.
