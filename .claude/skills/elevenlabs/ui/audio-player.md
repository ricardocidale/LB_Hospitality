# Audio Player Component

Full-featured audio player with playback controls, progress bar, and volume. For playing back recorded conversations, TTS output, or any audio content.

## Install

```bash
npx @elevenlabs/cli@latest components add audio-player
npx @elevenlabs/cli@latest components add scrub-bar
```

### Peer Dependencies
None.

## Props

### AudioPlayer
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | — | Audio file URL |
| `title` | `string` | — | Track title |
| `subtitle` | `string` | — | Artist/description |
| `autoPlay` | `boolean` | `false` | Auto-start playback |
| `onEnded` | `() => void` | — | Called when playback ends |
| `className` | `string` | — | Custom styling |

### ScrubBar
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentTime` | `number` | — | Current time (seconds) |
| `duration` | `number` | — | Total duration (seconds) |
| `onSeek` | `(time: number) => void` | — | Seek callback |
| `showTime` | `boolean` | `true` | Show time labels |

## Usage

### Basic Player
```tsx
import { AudioPlayer } from "@/components/ui/elevenlabs/audio-player";

<AudioPlayer
  src="/api/conversations/conv_123/audio"
  title="Conversation with Ricardo"
  subtitle="March 6, 2026 • 4:32"
/>
```

### Conversation Playback
```tsx
function ConversationPlayback({ conversationId }: { conversationId: string }) {
  return (
    <AudioPlayer
      src={`/api/marcela/conversations/${conversationId}/audio`}
      title="Marcela Conversation"
      subtitle={new Date().toLocaleDateString()}
      className="bg-black/20 backdrop-blur-xl rounded-xl"
    />
  );
}
```

### Custom Scrub Bar
```tsx
import { ScrubBar } from "@/components/ui/elevenlabs/scrub-bar";

<ScrubBar
  currentTime={42}
  duration={180}
  onSeek={(t) => audioRef.current.currentTime = t}
  showTime={true}
/>
```

## Features

- Play/pause toggle
- Progress scrub bar with time display
- Volume control
- Duration display (mm:ss)
- Responsive layout
- Keyboard: Space for play/pause, arrows for seek

## Marcela Use Cases

| Feature | Implementation |
|---------|---------------|
| Replay past conversations | AudioPlayer with conversation audio URL |
| Play TTS previews | AudioPlayer with streaming TTS blob URL |
| Voice sample playback | AudioPlayer in voice selection UI |

## Vite Adaptation

1. Copy source to `client/src/components/ui/elevenlabs/audio-player.tsx`
2. Copy source to `client/src/components/ui/elevenlabs/scrub-bar.tsx`
3. No extra deps
4. Fix `@/` imports
