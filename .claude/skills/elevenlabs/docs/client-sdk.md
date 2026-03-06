# ElevenLabs Client SDK (@elevenlabs/client)

The vanilla JavaScript/TypeScript SDK for browser-based agent conversations. Use this in non-React apps, or as the foundation for custom framework integrations.

For React apps, prefer `@elevenlabs/react` which wraps this with hooks.

## Installation

```bash
npm install @elevenlabs/client
```

## Basic Usage

```typescript
import { Conversation } from "@elevenlabs/client";

const conversation = await Conversation.startSession({
  agentId: "your-agent-id",
  connectionType: "webrtc",
  onConnect: () => console.log("Connected"),
  onDisconnect: () => console.log("Disconnected"),
  onMessage: (message) => console.log("Message:", message),
  onError: (error) => console.error("Error:", error),
  onStatusChange: (status) => console.log("Status:", status),
  onModeChange: (mode) => console.log("Mode:", mode),
});

// Later...
await conversation.endSession();
```

## Connection Types

### WebRTC (Recommended)
Lower latency, better audio quality:
```typescript
const conversation = await Conversation.startSession({
  agentId: "your-agent-id",
  connectionType: "webrtc",
});
```

### WebSocket
Standard WebSocket connection:
```typescript
const conversation = await Conversation.startSession({
  agentId: "your-agent-id",
  connectionType: "websocket",
});
```

## Authentication

### Public Agent
```typescript
await Conversation.startSession({
  agentId: "your-agent-id",
  connectionType: "webrtc",
});
```

### Private Agent — Signed URL
```typescript
const response = await fetch("/api/signed-url");
const signedUrl = await response.text();

await Conversation.startSession({
  signedUrl,
  connectionType: "websocket",
});
```

### Private Agent — Conversation Token
```typescript
const response = await fetch("/api/conversation-token");
const { token } = await response.json();

await Conversation.startSession({
  conversationToken: token,
  connectionType: "webrtc",
});
```

## Session Options

| Option | Type | Description |
|--------|------|-------------|
| `agentId` | string | Agent ID (public agents) |
| `signedUrl` | string | Signed URL (private, WebSocket) |
| `conversationToken` | string | Conversation token (private, WebRTC) |
| `connectionType` | `"webrtc"` \| `"websocket"` | Connection type |
| `clientTools` | object | Client-side tool handlers |
| `overrides` | object | Runtime overrides for agent settings |
| `dynamicVariables` | object | Dynamic variables for agent prompts |
| `userId` | string | Custom user identifier |
| `textOnly` | boolean | Chat-only mode (no audio) |
| `onConnect` | function | Connection established |
| `onDisconnect` | function | Connection ended |
| `onMessage` | function | Message received |
| `onError` | function | Error occurred |
| `onStatusChange` | function | Status changed |
| `onModeChange` | function | Mode changed |

## Methods

```typescript
// Send text message
conversation.sendTextMessage("Hello there");

// Send contextual update (no response triggered)
conversation.sendContextualUpdate({ currentPage: "/dashboard" });

// Adjust volume
conversation.setVolume({ volume: 0.8 });

// End session
await conversation.endSession();
```

## Client Tools

```typescript
const conversation = await Conversation.startSession({
  agentId: "your-agent-id",
  clientTools: {
    showNotification: async ({ title, message }) => {
      // Display notification in your app
      return "Notification shown";
    },
    fetchData: async ({ query }) => {
      const data = await myApi.search(query);
      return JSON.stringify(data);
    },
  },
});
```

## Overrides

```typescript
await Conversation.startSession({
  agentId: "your-agent-id",
  overrides: {
    agent: {
      prompt: { prompt: "Custom instructions" },
      firstMessage: "Hello!",
      language: "fr",
    },
    tts: {
      voiceId: "alternative-voice-id",
    },
  },
});
```

## Dynamic Variables

```typescript
await Conversation.startSession({
  agentId: "your-agent-id",
  dynamicVariables: {
    user_name: "Ricardo",
    account_type: "premium",
    current_page: "dashboard",
  },
});
```
