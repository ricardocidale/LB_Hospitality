# Response Component

Streaming markdown renderer with smooth character-by-character animations for AI responses. Built on Streamdown for real-time text streaming effects.

## Install

```bash
npx @elevenlabs/cli@latest components add response
```

### Peer Dependencies
- `streamdown` (markdown streaming renderer)

## Usage

### Basic Streaming Response
```tsx
import { Response } from "@/components/ui/elevenlabs/response";

function AIResponse({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  return (
    <Response
      text={text}
      isStreaming={isStreaming}
    />
  );
}
```

### In Conversation
```tsx
<Message from="assistant">
  <MessageContent variant="flat">
    <Response
      text={assistantMessage}
      isStreaming={isGenerating}
    />
  </MessageContent>
</Message>
```

## Features

- Character-by-character reveal animation
- Full markdown rendering (headings, lists, code, links, etc.)
- Smooth cursor animation during streaming
- Instant display when not streaming (for historical messages)
- Syntax highlighting for code blocks

## Marcela Use Cases

- Streaming text responses in custom chat UI
- Real-time agent reply visualization
- Rich markdown content display (tables, lists, code)

## Vite Adaptation

1. `npm install streamdown`
2. Copy source to `client/src/components/ui/elevenlabs/response.tsx`
3. Fix `@/` imports
