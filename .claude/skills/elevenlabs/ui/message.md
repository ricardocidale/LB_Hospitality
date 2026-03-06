# Message Component

Composable chat message with avatar, role-based alignment, and visual variants. Designed for agent conversation transcripts.

## Install

```bash
npx @elevenlabs/cli@latest components add message
```

### Peer Dependencies
None.

## Subcomponents

| Component | Purpose |
|-----------|---------|
| `Message` | Root — sets role context (user/assistant) |
| `MessageContent` | Text bubble with variant styling |
| `MessageAvatar` | Optional avatar image |
| `MessageActions` | Action buttons (copy, feedback) |

## Props

### Message
| Prop | Type | Description |
|------|------|-------------|
| `from` | `"user" \| "assistant"` | Role — determines alignment and styling |

### MessageContent
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"contained" \| "flat"` | `"contained"` | Visual style |
| `children` | `ReactNode` | — | Message text |

- `contained`: Bubble with background (used for user messages)
- `flat`: No background, just text (used for assistant messages)

### MessageAvatar
| Prop | Type | Description |
|------|------|-------------|
| `src` | `string` | Avatar image URL |
| `name` | `string` | Alt text / fallback initials |

## Usage

### Basic Messages
```tsx
import { Message, MessageContent, MessageAvatar } from "@/components/ui/elevenlabs/message";

<Message from="user">
  <MessageContent variant="contained">
    What's the occupancy rate for Pousada Estrela?
  </MessageContent>
</Message>

<Message from="assistant">
  <MessageAvatar src="/marcela-avatar.png" name="Marcela" />
  <MessageContent variant="flat">
    The current occupancy rate for Pousada Estrela is 72.3%, which is above the market average of 65%.
  </MessageContent>
</Message>
```

### With Actions
```tsx
<Message from="assistant">
  <MessageContent variant="flat">
    Based on your portfolio analysis...
  </MessageContent>
  <MessageActions>
    <button onClick={() => navigator.clipboard.writeText(text)}>Copy</button>
    <button onClick={() => sendFeedback(true)}>👍</button>
  </MessageActions>
</Message>
```

## Alignment Behavior

| `from` | Alignment | Bubble Style |
|--------|-----------|-------------|
| `"user"` | Right-aligned | Accent color background |
| `"assistant"` | Left-aligned | Subtle/transparent background |

## Styling with Theme Engine

```tsx
<Message from="user">
  <MessageContent
    variant="contained"
    className="bg-accent/20 text-accent-foreground"
  >
    User message with theme colors
  </MessageContent>
</Message>

<Message from="assistant">
  <MessageAvatar src="/marcela-avatar.png" name="Marcela" />
  <MessageContent variant="flat" className="text-foreground/90">
    Assistant response
  </MessageContent>
</Message>
```

## Vite Adaptation

1. Copy source to `client/src/components/ui/elevenlabs/message.tsx`
2. No extra deps required
3. Fix `@/` imports
