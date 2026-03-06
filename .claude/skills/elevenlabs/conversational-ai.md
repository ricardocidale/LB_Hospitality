# ElevenLabs Conversational AI

## Overview

ElevenLabs Conversational AI (ElevenAgents) enables voice-rich, multimodal agents that handle natural dialogue. Agents are configured in the ElevenLabs dashboard or via API, then deployed via widget, React SDK, or phone (Twilio).

## Deployment Options

### 1. Widget (Web Component) — Current Approach

The `<elevenlabs-convai>` custom element renders a floating button that opens a conversation panel.

**NPM package approach** (used in this project):
```tsx
import { registerWidget } from "@elevenlabs/convai-widget-core";

if (!customElements.get("elevenlabs-convai")) {
  registerWidget();
}

// In component JSX:
<elevenlabs-convai
  agent-id="agent_6401kk0capntfansmn84f58yfrd9"
  dynamic-variables={JSON.stringify({ user_name: "Ricardo" })}
/>
```

The widget uses shadow DOM (`shadow: true, mode: "open"`) so it doesn't conflict with the app's React.

**CDN script approach** (alternative, NOT used — conflicts with React):
```html
<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async></script>
<elevenlabs-convai agent-id="YOUR_AGENT_ID"></elevenlabs-convai>
```
⚠️ The CDN script bundles its own React/Preact, causing "Invalid hook call" errors in React apps. Use the npm package instead.

### 2. React SDK — Full Control

```bash
npm install @elevenlabs/react
```

```tsx
import { useConversation } from "@elevenlabs/react";

function AgentUI() {
  const conversation = useConversation({
    agentId: "your-agent-id",
    onConnect: () => console.log("Connected"),
    onDisconnect: () => console.log("Disconnected"),
  });

  return (
    <div>
      <button onClick={() => conversation.startSession()}>Start</button>
      <button onClick={() => conversation.endSession()}>End</button>
      <p>Status: {conversation.status}</p>
      <p>Speaking: {conversation.isSpeaking ? "Yes" : "No"}</p>
    </div>
  );
}
```

**Key methods:**
- `conversation.startSession(options?)` — start voice session
- `conversation.endSession()` — end session
- `conversation.sendTextMessage(text)` — send text input
- `conversation.sendContextualUpdate(data)` — send context without triggering response
- `conversation.setVolume({ volume: 0.8 })` — adjust volume (0–1)

**Options:**
- `clientTools` — object of client-side tool handlers
- `textOnly: true` — chat-only mode (no microphone)
- `serverLocation: "us" | "eu-residency" | "in-residency" | "global"`

### 3. Phone (Twilio) — See marcela-config.md

## Widget Customization Attributes

```html
<elevenlabs-convai
  agent-id="YOUR_AGENT_ID"
  avatar-url="https://example.com/avatar.png"
  color-primary="#FF5733"
  color-secondary="#C70039"
  widget-position="bottom-right"
  initial-message="Hi! How can I help?"
  dynamic-variables='{"user_name":"Ricardo","user_role":"admin"}'
/>
```

## Widget Modality

Configure in dashboard Widget → Interface:
- **Voice only** (default)
- **Voice + text** (toggle during conversation)
- **Chat mode** (text-only, no microphone)

Set programmatically: `textOnly: true` in React SDK options.

## Agent Configuration via API

```typescript
// Update agent settings
const response = await fetch(
  `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
  {
    method: "PATCH",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversation_config: {
        agent: {
          prompt: {
            prompt: "You are Marcela, a hospitality investment assistant...",
          },
        },
        tts: {
          voice_id: "cgSgspJ2msm6clMCkdW9",
          model_id: "eleven_flash_v2_5",
        },
        stt: {
          model_id: "scribe_v1",
        },
      },
    }),
  }
);
```

## Dynamic Variables

Pass per-session context to the agent via `dynamic-variables` attribute or `overrides`:
```json
{
  "user_name": "Ricardo",
  "user_role": "admin",
  "current_page": "/dashboard"
}
```

These are available in the agent's system prompt as `{{user_name}}`, `{{user_role}}`, etc.
