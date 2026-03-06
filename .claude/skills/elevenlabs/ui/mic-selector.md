# Mic Selector Component

Microphone device selector dropdown with live waveform preview. Lets users choose which microphone device to use for voice input.

## Install

```bash
npx @elevenlabs/cli@latest components add mic-selector
```

### Peer Dependencies
- LiveWaveform component (for mic preview)

## Usage

### Basic
```tsx
import { MicSelector } from "@/components/ui/elevenlabs/mic-selector";

function MicrophoneSelector() {
  return (
    <MicSelector
      onDeviceChange={(deviceId) => {
        conversation.changeInputDevice({ inputDeviceId: deviceId });
      }}
    />
  );
}
```

### With useConversation
```tsx
function ConversationSettings() {
  const conversation = useConversation();

  return (
    <div className="flex items-center gap-2">
      <MicSelector
        onDeviceChange={(deviceId) => {
          conversation.changeInputDevice({ inputDeviceId: deviceId });
        }}
      />
      <VoiceButton
        isActive={conversation.status === "connected"}
        onClick={toggleConversation}
      />
    </div>
  );
}
```

## Features

- Lists all available audio input devices via `navigator.mediaDevices.enumerateDevices()`
- LiveWaveform preview of selected mic
- Auto-selects default device
- Updates on device connect/disconnect
- Handles permission requests

## Vite Adaptation

1. Copy source to `client/src/components/ui/elevenlabs/mic-selector.tsx`
2. Requires LiveWaveform component
3. Fix `@/` imports
