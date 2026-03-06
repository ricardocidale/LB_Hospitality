# ElevenLabs Widget Integration

## Overview

The `<elevenlabs-convai>` widget is a multimodal web component for embedding AI agents. It processes both text and audio, renders inside shadow DOM, and supports extensive customization.

## Embedding Methods

### NPM Package — convai-widget-core (Required for React)
```bash
npm install @elevenlabs/convai-widget-core
```

```tsx
import { registerWidget } from "@elevenlabs/convai-widget-core";

if (!customElements.get("elevenlabs-convai")) {
  registerWidget();
}

// In JSX:
<elevenlabs-convai agent-id="YOUR_AGENT_ID" />
```

**Why HMR guard?** Hot Module Replacement in dev mode re-executes modules. `registerWidget()` calls `customElements.define()`, which throws if the element is already registered. The guard prevents this.

### CDN Script — convai-widget-embed (Simple HTML only)
```html
<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async></script>
<elevenlabs-convai agent-id="YOUR_AGENT_ID"></elevenlabs-convai>
```

⚠️ **DO NOT use `convai-widget-embed` in React apps** — it bundles its own Preact, causing "Invalid hook call" errors. Always use `convai-widget-core` in React projects.

## Agent Visibility

### Public Agents
```html
<elevenlabs-convai agent-id="YOUR_AGENT_ID"></elevenlabs-convai>
```

### Private Agents (Signed URL)
```html
<elevenlabs-convai signed-url="wss://api.elevenlabs.io/v1/convai/conversation?agent_id=...&conversation_signature=..."></elevenlabs-convai>
```

Generate signed URLs server-side — see `authentication.md`.

## HTML Attributes

### Core
| Attribute | Description |
|-----------|-------------|
| `agent-id` | Required (unless signed-url). Agent ID |
| `signed-url` | Alternative for private agents |
| `server-location` | `"us"` or default |
| `variant` | `"expanded"` or default (compact orb) |
| `dismissible` | `"true"` to allow minimize |

### Visual
| Attribute | Description |
|-----------|-------------|
| `avatar-image-url` | Custom avatar image URL |
| `avatar-orb-color-1` | Orb gradient color 1 (hex) |
| `avatar-orb-color-2` | Orb gradient color 2 (hex) |

### Text
| Attribute | Description |
|-----------|-------------|
| `action-text` | CTA button text |
| `start-call-text` | Start call button |
| `end-call-text` | End call button |
| `expand-text` | Expand widget text |
| `listening-text` | Listening state text |
| `speaking-text` | Speaking state text |

### Markdown
| Attribute | Description |
|-----------|-------------|
| `markdown-link-allowed-hosts` | Clickable link domains (`"*"` for all) |
| `markdown-link-include-www` | Allow www variants (default: `"true"`) |
| `markdown-link-allow-http` | Allow http:// (default: `"true"`) |
| `syntax-highlight-theme` | Code blocks: `"dark"`, `"light"`, `"auto"` |

### Runtime
| Attribute | Description |
|-----------|-------------|
| `dynamic-variables` | JSON string: `'{"user_name": "John"}'` |
| `override-language` | Override language (ISO code) |
| `override-prompt` | Override system prompt |
| `override-first-message` | Override greeting |
| `override-voice-id` | Override voice |

## CSS Customization

```css
elevenlabs-convai {
  --el-color-primary: #9FBCA4;
  --el-color-secondary: #2d4a5e;
}
```

## Modality Configuration

Configure in dashboard → Widget → Interface:
- **Voice only** (default)
- **Voice + text** (switch during conversation)
- **Chat mode** (text-only, no microphone)

## Client Tools via Widget

```tsx
const el = document.querySelector("elevenlabs-convai");
el?.addEventListener("elevenlabs-convai:call", (event) => {
  const detail = (event as CustomEvent).detail;
  if (!detail?.config) return;
  detail.config.clientTools = {
    myTool: ({ param }) => "result",
  };
});
```

## TypeScript Declarations

```typescript
declare namespace JSX {
  interface IntrinsicElements {
    'elevenlabs-convai': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        'agent-id'?: string;
        'signed-url'?: string;
        'avatar-image-url'?: string;
        'avatar-orb-color-1'?: string;
        'avatar-orb-color-2'?: string;
        'dynamic-variables'?: string;
        'override-language'?: string;
        'override-prompt'?: string;
        'override-first-message'?: string;
        'override-voice-id'?: string;
        variant?: string;
        dismissible?: string;
      },
      HTMLElement
    >;
  }
}
```

## Shadow DOM

The widget renders inside shadow DOM (`shadow: true, mode: "open"`):
- Host page styles don't affect widget
- Widget styles don't leak to host page
- Access internal elements via `el.shadowRoot.querySelector()`
