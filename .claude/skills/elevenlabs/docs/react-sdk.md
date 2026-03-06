# ElevenLabs React SDK (@elevenlabs/react)

## Installation

```bash
npm install @elevenlabs/react
```

## useConversation Hook

The primary hook for building conversational agents in React.

```tsx
import { useConversation } from "@elevenlabs/react";

function AgentUI() {
  const conversation = useConversation({
    onConnect: () => console.log("Connected"),
    onDisconnect: () => console.log("Disconnected"),
    onMessage: (msg) => console.log("Message:", msg),
    onError: (err) => console.error("Error:", err),
    onStatusChange: (status) => console.log("Status:", status),
    onModeChange: (mode) => console.log("Mode:", mode),
  });

  const startSession = async () => {
    const conversationId = await conversation.startSession({
      agentId: "your-agent-id",
      connectionType: "webrtc",
    });
    console.log("Started:", conversationId);
  };

  return (
    <div>
      <button onClick={startSession}>Start</button>
      <button onClick={() => conversation.endSession()}>End</button>
      <p>Status: {conversation.status}</p>
      <p>Speaking: {conversation.isSpeaking ? "Yes" : "No"}</p>
    </div>
  );
}
```

## Configuration Options

| Property | Type | Description |
|----------|------|-------------|
| `clientTools` | object | Client-side tool handlers |
| `overrides` | object | Override agent settings at runtime |
| `textOnly` | boolean | Text-only mode (no microphone) |
| `onConnect` | function | Connection established |
| `onDisconnect` | function | Connection ended |
| `onMessage` | function | New message received |
| `onError` | function | Error encountered |
| `onStatusChange` | function | Status: `connected` / `connecting` / `disconnected` |
| `onModeChange` | function | Agent mode: `speaking` / `listening` |
| `onCanSendFeedbackChange` | function | Feedback availability changed |
| `onUnhandledClientToolCall` | function | Unregistered client tool invoked |
| `onDebug` | function | Debug events (tentative responses, internals) |
| `onAudio` | function | Raw audio data received |
| `onInterruption` | function | User interrupted agent |
| `onVadScore` | function | Voice activity detection scores |
| `onMCPToolCall` | function | MCP tool invoked |
| `onAgentToolRequest` | function | Agent begins tool execution |
| `onAgentToolResponse` | function | Agent receives tool response |
| `onConversationMetadata` | function | Conversation initiation metadata |
| `onAudioAlignment` | function | Character-level timing for TTS sync |

## Starting Sessions

### Public Agent
```tsx
await conversation.startSession({
  agentId: "your-agent-id",
  connectionType: "webrtc",
});
```

### Private Agent (Signed URL — WebSocket)
```tsx
const response = await fetch("/api/signed-url");
const signedUrl = await response.text();

await conversation.startSession({
  signedUrl,
  connectionType: "websocket",
});
```

### Private Agent (Conversation Token — WebRTC)
```tsx
const response = await fetch("/api/conversation-token");
const { token } = await response.json();

await conversation.startSession({
  conversationToken: token,
  connectionType: "webrtc",
});
```

### With User ID
```tsx
await conversation.startSession({
  agentId: "your-agent-id",
  userId: "user-123",
  connectionType: "webrtc",
});
```

## Methods

| Method | Description |
|--------|-------------|
| `startSession(options)` | Start conversation, returns `conversationId` |
| `endSession()` | End the current session |
| `sendTextMessage(text)` | Send text message to agent |
| `sendContextualUpdate(data)` | Send context without triggering response |
| `setVolume({ volume })` | Set playback volume (0.0–1.0) |

## Client Tools

```tsx
const conversation = useConversation({
  clientTools: {
    navigateToPage: async ({ page }: { page: string }) => {
      router.push(page);
      return `Navigated to ${page}`;
    },
    getCurrentTime: async () => {
      return new Date().toISOString();
    },
  },
});
```

Tools must be registered identically in the ElevenLabs dashboard (name + parameters). Enable "Wait for response" in dashboard for tools that return data.

## Conversation Overrides

Override agent settings dynamically:
```tsx
const conversation = useConversation({
  overrides: {
    agent: {
      prompt: { prompt: "Custom system prompt", llm: "gemini-2.5-flash" },
      firstMessage: "Welcome!",
      language: "es",
    },
    tts: {
      voiceId: "custom-voice-id",
      speed: 1.0,
      stability: 0.5,
      similarityBoost: 0.8,
    },
    conversation: {
      textOnly: true,
    },
  },
});
```

## Text-Only Mode

No microphone, chat-only:
```tsx
const conversation = useConversation({ textOnly: true });

await conversation.startSession({ agentId: "agent-id" });
await conversation.sendTextMessage("Hello!");
```

## Data Residency

```tsx
const conversation = useConversation({
  serverLocation: "eu-residency",
});
```

## iOS Headphone Preference

```tsx
const conversation = useConversation({
  preferHeadphonesForIosDevices: true,
});
```

## Connection Delay

```tsx
const conversation = useConversation({
  connectionDelay: {
    android: 3000,
    ios: 0,
    default: 0,
  },
});
```

## Wake Lock

Prevent device sleep during conversation (enabled by default):
```tsx
const conversation = useConversation({
  useWakeLock: false, // disable
});
```

## Microphone Permission

Request microphone before starting:
```tsx
try {
  await navigator.mediaDevices.getUserMedia({ audio: true });
} catch (err) {
  // Handle denied permission — show UI message
}
```
