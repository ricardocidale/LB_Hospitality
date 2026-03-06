# Conversation Component

Scrolling conversation container with auto-scroll and sticky-to-bottom behavior. Handles message overflow, scroll-to-latest, and scroll position restoration.

## Install

```bash
npx @elevenlabs/cli@latest components add conversation
```

### Peer Dependencies
- `use-stick-to-bottom`

## Subcomponents

| Component | Purpose |
|-----------|---------|
| `Conversation` | Root container |
| `ConversationContent` | Scrollable message area |
| `ConversationEmptyState` | Placeholder when no messages |
| `ConversationScrollButton` | "Jump to latest" button |

## Props

### Conversation (Root)
Standard `div` props plus internal scroll management.

### ConversationEmptyState
| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Empty state heading |
| `description` | `string` | Empty state subtext |
| `icon` | `ReactNode` | Custom icon |

### ConversationScrollButton
Auto-shows when user scrolls up, hides when at bottom. No required props.

## Usage

### Basic Chat Container
```tsx
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton
} from "@/components/ui/elevenlabs/conversation";
import { Message, MessageContent } from "@/components/ui/elevenlabs/message";

function ChatView({ messages }: { messages: ChatMessage[] }) {
  return (
    <Conversation className="h-[600px]">
      <ConversationContent>
        {messages.length === 0 ? (
          <ConversationEmptyState
            title="Talk to Marcela"
            description="Ask about your portfolio, properties, or financial projections"
          />
        ) : (
          messages.map((msg) => (
            <Message key={msg.id} from={msg.role}>
              <MessageContent>{msg.text}</MessageContent>
            </Message>
          ))
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
```

### With useConversation Hook
```tsx
import { useConversation } from "@elevenlabs/react";

function LiveChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const conversation = useConversation({
    onMessage: (msg) => {
      if (msg.source === "user" || msg.source === "ai") {
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(),
          role: msg.source === "user" ? "user" : "assistant",
          text: msg.message,
        }]);
      }
    },
  });

  return (
    <Conversation className="h-full">
      <ConversationContent>
        {messages.map((msg) => (
          <Message key={msg.id} from={msg.role}>
            <MessageContent variant={msg.role === "user" ? "contained" : "flat"}>
              {msg.text}
            </MessageContent>
          </Message>
        ))}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
```

## Behavior

- **Auto-scroll**: New messages auto-scroll container to bottom
- **Stick-to-bottom**: Once scrolled to bottom, stays pinned as messages arrive
- **Scroll button**: Appears when user scrolls up, click returns to bottom
- **Overflow**: Content scrolls vertically, container clips horizontally
- **Performance**: Virtualizes if message count is very high (via `use-stick-to-bottom`)

## Styling

- Set explicit height on `<Conversation>` — it needs a bounded container
- Supports `className` for custom styling (glass effects, rounded corners, etc.)
- Dark Glass theme: `className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl"`

## Vite Adaptation

1. `npm install use-stick-to-bottom`
2. Copy source to `client/src/components/ui/elevenlabs/conversation.tsx`
3. Fix `@/` imports
