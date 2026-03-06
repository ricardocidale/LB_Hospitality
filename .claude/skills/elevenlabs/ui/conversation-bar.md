# Conversation Bar Component

Hybrid input bar with text input field and voice toggle button. Enables switching between typing and speaking in agent conversations.

## Install

```bash
npx @elevenlabs/cli@latest components add conversation-bar
```

### Peer Dependencies
None (uses Voice Button internally if voice is enabled).

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSend` | `(text: string) => void` | — | Called when user submits text |
| `onVoiceToggle` | `() => void` | — | Called when mic button is clicked |
| `isVoiceActive` | `boolean` | `false` | Whether voice input is active |
| `placeholder` | `string` | `"Type a message..."` | Input placeholder text |
| `disabled` | `boolean` | `false` | Disable all input |

## Usage

### Basic Text + Voice Input
```tsx
import { ConversationBar } from "@/components/ui/elevenlabs/conversation-bar";

function ChatInput() {
  const conversation = useConversation();
  const [isVoice, setIsVoice] = useState(false);

  const handleSend = (text: string) => {
    conversation.sendUserMessage(text);
  };

  const handleVoiceToggle = () => {
    setIsVoice(!isVoice);
    if (!isVoice) {
      conversation.startSession({ signedUrl });
    } else {
      conversation.endSession();
    }
  };

  return (
    <ConversationBar
      onSend={handleSend}
      onVoiceToggle={handleVoiceToggle}
      isVoiceActive={isVoice}
      placeholder="Ask Marcela anything..."
    />
  );
}
```

### With Conversation Component
```tsx
<div className="flex flex-col h-[600px]">
  <Conversation className="flex-1">
    <ConversationContent>
      {messages.map((msg) => (
        <Message key={msg.id} from={msg.role}>
          <MessageContent>{msg.text}</MessageContent>
        </Message>
      ))}
    </ConversationContent>
    <ConversationScrollButton />
  </Conversation>
  <ConversationBar
    onSend={handleSend}
    onVoiceToggle={handleVoiceToggle}
    isVoiceActive={isVoice}
    placeholder="Ask Marcela anything..."
  />
</div>
```

## Features

- **Text mode**: Standard text input with Enter to send
- **Voice mode**: Mic button toggles voice recording
- **Send button**: Visible when text is entered
- **Keyboard shortcuts**: Enter to send, Shift+Enter for newline
- **Auto-resize**: Input grows with content (up to max height)

## Styling

Supports `className` for glass effects:
```tsx
<ConversationBar
  className="bg-black/20 backdrop-blur-xl border-t border-white/10"
  onSend={handleSend}
  placeholder="Ask Marcela..."
/>
```

## Vite Adaptation

1. Copy source to `client/src/components/ui/elevenlabs/conversation-bar.tsx`
2. No extra deps
3. Fix `@/` imports
