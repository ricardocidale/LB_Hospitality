# ElevenLabs Conversational AI (ElevenAgents)

## Overview

ElevenAgents enables building multimodal AI agents that handle natural voice and text dialogue. Agents are configured via API or dashboard, then deployed via widget, React SDK, phone (Twilio), or WhatsApp.

## Agent Lifecycle

### Create Agent
```typescript
const agent = await client.conversationalAi.agents.create({
  name: "Support Agent",
  conversationConfig: {
    agent: {
      prompt: {
        prompt: "You are a helpful support agent...",
        llm: "gpt-4o",
      },
      firstMessage: "Hello! How can I help you today?",
      language: "en",
    },
    tts: {
      voiceId: "cgSgspJ2msm6clMCkdW9",
      modelId: "eleven_flash_v2_5",
    },
  },
  platformSettings: {
    auth: { enableAuth: false },
  },
});
```

### Get Agent Configuration
```typescript
const agent = await client.conversationalAi.agents.get("agent_id");
console.log(agent.name);
console.log(agent.conversation_config);
```

### Update Agent
```typescript
await client.conversationalAi.agents.update("agent_id", {
  conversationConfig: {
    agent: {
      prompt: { prompt: "Updated system prompt..." },
    },
    tts: {
      voiceId: "new_voice_id",
    },
  },
});
```

### Delete Agent
```typescript
await client.conversationalAi.agents.delete("agent_id");
```

### List Agents
```typescript
const agents = await client.conversationalAi.agents.list({
  pageSize: 20,
});

for (const agent of agents.agents) {
  console.log(`${agent.name} (${agent.agent_id})`);
}
```

## Agent Configuration Structure

```typescript
{
  name: "Agent Name",
  conversationConfig: {
    agent: {
      prompt: {
        prompt: "System prompt text...",
        llm: "gpt-4o",                    // LLM model
        temperature: 0.7,
        maxTokens: 1024,
        knowledgeBase: [                   // Attached documents
          { type: "text", name: "doc", id: "doc_id" }
        ],
        tools: [                           // Attached tools
          { type: "client", name: "myTool", id: "tool_id" }
        ],
      },
      firstMessage: "Hello!",
      language: "en",
    },
    tts: {
      voiceId: "voice_id",
      modelId: "eleven_flash_v2_5",
      stability: 0.5,
      similarityBoost: 0.75,
      speed: 1.0,
    },
    stt: {
      provider: "elevenlabs",
      model: "scribe_v1",
    },
    turn: {
      mode: "turn_based",                 // or "interruption"
      turnTimeout: 15,                    // seconds
    },
    conversation: {
      maxDuration: 600,                   // max seconds
      clientEvents: ["transcript", "audio"],
    },
  },
  platformSettings: {
    auth: {
      enableAuth: true,                   // require signed URL
      allowedOrigins: ["https://example.com"],
    },
    widget: {
      variant: "compact",                 // or "expanded"
      avatar: { type: "orb" },
      color: { primary: "#000000" },
    },
    privacy: {
      retainAudio: true,
      retainTranscript: true,
    },
    evaluation: {
      criteria: [
        { id: "helpfulness", description: "Was the agent helpful?" }
      ],
    },
  },
}
```

## Deployment Options

| Method | Package | Best For |
|--------|---------|----------|
| React SDK | `@elevenlabs/react` | React/Next.js apps (full control) |
| Client SDK | `@elevenlabs/client` | Vanilla JS/TS apps |
| Widget (npm) | `@elevenlabs/convai-widget-core` | React apps (drop-in) |
| Widget (CDN) | `@elevenlabs/convai-widget-embed` | Simple HTML pages |
| Phone | Twilio / SIP | Voice calls |
| WhatsApp | Meta Business API | WhatsApp messaging/calls |

See dedicated docs for each: `react-sdk.md`, `client-sdk.md`, `widget.md`, `twilio.md`, `whatsapp.md`

## Conversations

### List Conversations
```typescript
const convos = await client.conversationalAi.conversations.list({
  agentId: "agent_id",
  pageSize: 20,
});
```

### Get Conversation Details
```typescript
const convo = await client.conversationalAi.conversations.get("conversation_id");
console.log(convo.transcript);
console.log(convo.metadata);
```

### Get Conversation Audio
```typescript
const audio = await client.conversationalAi.conversations.audio.get("conversation_id");
```

### Get Conversation Messages
```typescript
const messages = await client.conversationalAi.conversations.messages.list("conversation_id");
```

### Submit Feedback
```typescript
await client.conversationalAi.conversations.feedback.post("conversation_id", {
  rating: 5,
  feedback: "Great interaction!",
});
```

### Delete Conversation
```typescript
await client.conversationalAi.conversations.delete("conversation_id");
```

## Signed URLs & Conversation Tokens

### Signed URL (WebSocket connections)
```typescript
const { signedUrl } = await client.conversationalAi.conversations.getSignedUrl({
  agentId: "agent_id",
});
// Expires in 15 minutes
```

### Conversation Token (WebRTC connections)
```bash
GET https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=AGENT_ID
Headers: xi-api-key: YOUR_API_KEY
```

## Agent Versioning

Enable versioning to track changes:
```typescript
await client.conversationalAi.agents.create({
  enableVersioning: true,
  conversationConfig: { ... },
});
```

### List Versions
```typescript
// Retrieve specific version
const agent = await client.conversationalAi.agents.get("agent_id", {
  versionId: "version_id",
});
```

## Agent Summaries
```typescript
const summaries = await client.conversationalAi.agents.summaries.list();
```

## Analytics
```typescript
const liveCount = await client.conversationalAi.analytics.liveCount.get();
console.log(`Active conversations: ${liveCount.count}`);
```

## Workspace Settings
```typescript
const settings = await client.conversationalAi.settings.get();
await client.conversationalAi.settings.update({ ... });
```

## Secrets
```typescript
await client.conversationalAi.secrets.create({
  name: "MY_API_KEY",
  value: "secret-value",
});

const secrets = await client.conversationalAi.secrets.list();
```
