# Voice Button Component

Microphone toggle button for starting/stopping voice input. Visual state changes between idle, recording, and processing.

## Install

```bash
npx @elevenlabs/cli@latest components add voice-button
```

### Peer Dependencies
None.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isActive` | `boolean` | `false` | Whether recording is active |
| `onClick` | `() => void` | — | Toggle handler |
| `disabled` | `boolean` | `false` | Disable interaction |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Button size |
| `variant` | `"default" \| "outline" \| "ghost"` | `"default"` | Visual variant |

## Usage

### Basic Toggle
```tsx
import { VoiceButton } from "@/components/ui/elevenlabs/voice-button";

function MicToggle() {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <VoiceButton
      isActive={isRecording}
      onClick={() => setIsRecording(!isRecording)}
    />
  );
}
```

### With useConversation
```tsx
import { useConversation } from "@elevenlabs/react";

function MarcelaMicButton() {
  const conversation = useConversation();
  const isConnected = conversation.status === "connected";

  const toggle = async () => {
    if (isConnected) {
      await conversation.endSession();
    } else {
      await conversation.startSession({ signedUrl });
    }
  };

  return (
    <VoiceButton
      isActive={isConnected}
      onClick={toggle}
      size="lg"
    />
  );
}
```

## Visual States

| State | Appearance |
|-------|-----------|
| Idle | Mic icon, default colors |
| Active/Recording | Pulsing animation, accent color |
| Disabled | Muted colors, no interaction |

## Styling

```tsx
<VoiceButton
  isActive={isRecording}
  onClick={toggle}
  className="bg-accent/20 hover:bg-accent/30 text-accent"
/>
```

## Accessibility

- `aria-label="Toggle microphone"` (built-in)
- `aria-pressed={isActive}` for toggle state
- Focus ring on keyboard navigation
- Screen reader announces recording state

## Vite Adaptation

1. Copy source to `client/src/components/ui/elevenlabs/voice-button.tsx`
2. No extra deps
3. Fix `@/` imports
