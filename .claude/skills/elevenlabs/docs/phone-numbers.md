# ElevenLabs Phone Number Management

## Overview

Phone numbers connect ElevenLabs agents to telephone networks via providers like Twilio, SIP trunks, or WhatsApp.

## Listing Phone Numbers

```typescript
const numbers = await client.conversationalAi.phoneNumbers.list();
for (const num of numbers) {
  console.log(`${num.phone_number} (${num.provider}) → Agent: ${num.agent_id}`);
}
```

## Registering a Phone Number

```typescript
const phoneNumber = await client.conversationalAi.phoneNumbers.create({
  provider: "twilio",
  phoneNumber: "+1234567890",
  label: "Main Support Line",
  agentId: "agent_id",
});
```

## Assigning an Agent

```typescript
await client.conversationalAi.phoneNumbers.update("phone_number_id", {
  agentId: "agent_id",
});
```

## Getting Phone Number Details

```typescript
const details = await client.conversationalAi.phoneNumbers.get("phone_number_id");
console.log(details.phone_number, details.provider, details.agent_id);
```

## Removing a Phone Number

```typescript
await client.conversationalAi.phoneNumbers.delete("phone_number_id");
```

## Providers

| Provider | Description |
|----------|-------------|
| Twilio | Most common, supports voice calls and SMS |
| SIP Trunk | Direct SIP connection for enterprise telephony |
| WhatsApp | WhatsApp Business voice calls |

## Twilio Setup

1. Create a Twilio account and get a phone number
2. Register the number in ElevenLabs
3. Configure Twilio webhook to point to ElevenLabs
4. Assign an agent to the number

See `twilio.md` for detailed Twilio integration instructions.

## Dynamic Variables for Phone

When a call comes in, these dynamic variables are automatically set:
- `{{system__caller_id}}` — Caller's phone number
- `{{system__called_number}}` — The number that was called

Use these in the agent's system prompt or tools for personalization.

## Batch Calling

### Schedule Batch Calls
```typescript
const batch = await client.conversationalAi.batchCalls.create({
  agentId: "agent_id",
  calls: [
    { phoneNumber: "+1234567890", dynamicVariables: { name: "John" } },
    { phoneNumber: "+0987654321", dynamicVariables: { name: "Jane" } },
  ],
});
```

### List Batch Jobs
```typescript
const batches = await client.conversationalAi.batchCalls.list({ agentId: "agent_id" });
```

### Get Batch Status
```typescript
const status = await client.conversationalAi.batchCalls.get("batch_call_id");
```
