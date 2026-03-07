---
name: ElevenLabs UI Components
description: Complete reference for all ElevenLabs UI components installed in the project. Use when building or modifying the Marcela AI agent interface, voice widget, or audio playback features.
---

# ElevenLabs UI Components

All components sourced from https://ui.elevenlabs.io/ via `curl -s https://ui.elevenlabs.io/r/<name>.json`.
Installed to: `client/src/features/ai-agent/components/` (re-export barrels remain at `client/src/components/ui/` for backward compat)
Hooks installed to: `client/src/hooks/`

**Full API docs + examples**: `.claude/skills/marcela-ai/elevenlabs-components-docs/` — one `.md` file per component with props table, installation steps, and usage examples fetched directly from the [ElevenLabs UI GitHub repo](https://github.com/elevenlabs/ui). See `elevenlabs-components-docs/README.md` for the component index.

## Installed Components

### 1. `orb.tsx` — Animated 3D Voice Orb
**Path**: `client/src/features/ai-agent/components/orb.tsx`
**Dependencies**: `@react-three/fiber`, `@react-three/drei`, `three` (all installed)

```tsx
import { Orb, AgentState } from "@/features/ai-agent/components/orb"

<div className="w-32 h-32">
  <Orb
    colors={["#9fbca4", "#4a7c5c"]}   // [primary, secondary] hex colors
    agentState="listening"              // null | "thinking" | "listening" | "talking"
    seed={42}                           // deterministic randomness for consistent shape
  />
</div>
```

**AgentState visual behavior**: `null` = ambient pulse, `"thinking"` = slow glow, `"listening"` = fast pulse, `"talking"` = speech wave.

---

### 2. `bar-visualizer.tsx` — Multi-Bar Audio Visualizer
**Path**: `client/src/features/ai-agent/components/bar-visualizer.tsx`

```tsx
import { BarVisualizer } from "@/features/ai-agent/components/bar-visualizer"

<BarVisualizer
  state="speaking"   // "connecting"|"initializing"|"listening"|"speaking"|"thinking"
  barCount={15}
  demo={true}         // fake animated data (no mic required)
  centerAlign={false} // false = bottom-aligned, true = center-aligned
  className="h-20 rounded-xl"
/>
```

**Also exports hooks**: `useAudioVolume`, `useMultibandVolume`, `useBarAnimator`

---

### 3. `audio-player.tsx` — Feature-Rich Audio Player
**Path**: `client/src/features/ai-agent/components/audio-player.tsx`
**Dependencies**: `@radix-ui/react-slider`, `@radix-ui/react-dropdown-menu`

```tsx
import {
  AudioPlayerProvider, AudioPlayerButton, AudioPlayerProgress,
  AudioPlayerTime, AudioPlayerDuration, AudioPlayerSpeed,
} from "@/features/ai-agent/components/audio-player"

const item = { id: "conv-123", src: "https://..." }

<AudioPlayerProvider>
  <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
    <AudioPlayerButton item={item} size="sm" variant="ghost" className="h-8 w-8" />
    <AudioPlayerProgress className="flex-1" />
    <AudioPlayerTime className="text-xs" />
    <AudioPlayerDuration className="text-xs" />
    <AudioPlayerSpeed />
  </div>
</AudioPlayerProvider>
```

**Also exports**: `useAudioPlayer()`, `useAudioPlayerTime()` hooks.
**Current use**: `ConversationHistory.tsx` — plays ElevenLabs conversation recordings.

---

### 4. `conversation.tsx` — Auto-Scrolling Chat Container
**Path**: `client/src/features/ai-agent/components/conversation.tsx`
**Dependencies**: `use-stick-to-bottom`

```tsx
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/features/ai-agent/components/conversation"

<Conversation className="h-96">
  <ConversationContent>
    {messages.length === 0
      ? <ConversationEmptyState title="No messages" icon={<Bot />} />
      : messages.map(m => <MessageBubble key={m.id} {...m} />)}
    <ConversationScrollButton />
  </ConversationContent>
</Conversation>
```

**Current use**: `ConversationHistory.tsx` transcript view wraps message bubbles.

---

### 5. `conversation-bar.tsx` — Full Voice + Text Conversation Interface
**Path**: `client/src/features/ai-agent/components/conversation-bar.tsx`
**Dependencies**: `@elevenlabs/react` (v0.14.1), `live-waveform.tsx`

```tsx
import { ConversationBar } from "@/features/ai-agent/components/conversation-bar"

<ConversationBar
  agentId="your-elevenlabs-agent-id"
  onConnect={() => setIsConnected(true)}
  onDisconnect={() => setIsConnected(false)}
  onMessage={(msg) => console.log(msg.source, msg.message)}
  onError={(err) => console.error(err)}
  className="max-w-lg mx-auto"
/>
```

**Features**: WebRTC via `useConversation()`, phone/hang-up, mute toggle, keyboard textarea (Enter-to-send), live waveform.
**Note**: Takes `agentId` only — does NOT support signed URLs (use `elevenlabs-convai` web component for signed URL support).

---

### 6. `live-waveform.tsx` — Real-Time Microphone Waveform
**Path**: `client/src/features/ai-agent/components/live-waveform.tsx`

```tsx
import { LiveWaveform } from "@/features/ai-agent/components/live-waveform"

<LiveWaveform
  active={isRecording}
  processing={isConnecting}
  barWidth={3} barGap={1} barRadius={4}
  fadeEdges={true} fadeWidth={24}
  sensitivity={1.8}
  height={32}
  mode="static"   // "static" | "scrolling"
  className="w-full"
/>
```

---

### 7. `waveform.tsx` — Multi-Mode Waveform Suite
**Path**: `client/src/features/ai-agent/components/waveform.tsx`

Exports 7 components:

```tsx
import {
  Waveform, ScrollingWaveform, AudioScrubber,
  MicrophoneWaveform, StaticWaveform, LiveMicrophoneWaveform, RecordingWaveform,
} from "@/features/ai-agent/components/waveform"

// Static data display
<Waveform data={amplitudeArray} barWidth={4} barGap={2} height={64}
  active={isPlaying} onBarClick={(index) => seekTo(index)} />

// Continuously scrolling auto-generated bars
<ScrollingWaveform speed={50} barCount={60} height={80} fadeEdges={true} />

// Playback seek UI
<AudioScrubber data={waveformData} currentTime={time} duration={total}
  onSeek={handleSeek} showHandle={true} />

// Real-time mic input
<MicrophoneWaveform active={isListening} sensitivity={1.5}
  onError={(e) => console.error(e)} />

// Deterministic random data (for previews)
<StaticWaveform bars={40} seed={42} />

// Recording + playback scrubbing
<LiveMicrophoneWaveform active={isRecording} enableAudioPlayback={true} />

// Recording with completion callback
<RecordingWaveform recording={isRecording}
  onRecordingComplete={(data) => console.log(data)} />
```

---

### 8. `matrix.tsx` — LED Pixel Grid Visualizer
**Path**: `client/src/features/ai-agent/components/matrix.tsx`

```tsx
import { Matrix } from "@/features/ai-agent/components/matrix"

<Matrix
  rows={5} cols={10}
  mode="vu"   // "default" | "vu"
  levels={[0.3, 0.6, 0.9, 0.7, 0.4, 0.8, 0.5, 0.3, 0.7, 0.5]}
  size={8} gap={1}
  palette={{ on: "#4a7c5c", off: "#e8f0ea" }}
  className="rounded-xl overflow-hidden shadow-lg"
/>
```

---

### 9. `message.tsx` — Chat Bubble Components
**Path**: `client/src/features/ai-agent/components/message.tsx`

```tsx
import { Message, MessageContent, MessageAvatar } from "@/features/ai-agent/components/message"

// from="user" → right-aligned, from="assistant" → left-aligned
<Message from="assistant" className="py-1.5">
  <MessageContent variant="contained" className="text-xs">
    {text}
  </MessageContent>
</Message>

// With avatar (src required for MessageAvatar)
<Message from="user">
  <MessageContent variant="flat">{text}</MessageContent>
  <MessageAvatar src="/avatar.png" name="John" />
</Message>
```

**Variants**: `"contained"` (colored bubble), `"flat"` (plain text for assistant).
**Current use**: `ConversationHistory.tsx` transcript bubbles.

---

### 10. `mic-selector.tsx` — Microphone Device Selector
**Path**: `client/src/features/ai-agent/components/mic-selector.tsx`

```tsx
import { MicSelector, useAudioDevices } from "@/features/ai-agent/components/mic-selector"

<MicSelector
  value={selectedDeviceId}
  onValueChange={(id) => setSelectedDeviceId(id)}
  muted={isMuted}
  onMutedChange={setIsMuted}
/>
```

**Features**: Dropdown of available audio input devices, live waveform preview, mute toggle, permission handling.
**Hook**: `useAudioDevices()` → `{ devices, loading, error, hasPermission, loadDevices }` — enumerate audio inputs, request permission.

---

### 11. `response.tsx` — Streaming Markdown Renderer
**Path**: `client/src/features/ai-agent/components/response.tsx`
**Dependencies**: `streamdown` (installed v2.4.0)

```tsx
import { Response } from "@/features/ai-agent/components/response"

// Streams markdown text as it arrives (e.g. from SSE/WebSocket)
<Response className="prose prose-sm max-w-none">
  {streamingText}
</Response>
```

Memo-optimized: only re-renders when `children` changes. Wraps `Streamdown` from the `streamdown` package.

---

### 12. `scrub-bar.tsx` — Composable Audio Scrub Bar
**Path**: `client/src/features/ai-agent/components/scrub-bar.tsx`

```tsx
import {
  ScrubBarContainer, ScrubBarTrack, ScrubBarProgress,
  ScrubBarThumb, ScrubBarTimeLabel,
} from "@/features/ai-agent/components/scrub-bar"

<ScrubBarContainer
  duration={totalDuration}
  value={currentTime}
  onScrub={handleSeek}
  onScrubStart={() => setPaused(true)}
  onScrubEnd={() => setPaused(false)}
  className="gap-2"
>
  <ScrubBarTimeLabel time={currentTime} className="text-xs" />
  <ScrubBarTrack>
    <ScrubBarProgress />
    <ScrubBarThumb />
  </ScrubBarTrack>
  <ScrubBarTimeLabel time={totalDuration} className="text-xs" />
</ScrubBarContainer>
```

---

### 13. `shimmering-text.tsx` — Shimmer Text Animation
**Path**: `client/src/features/ai-agent/components/shimmering-text.tsx`
**Dependencies**: `motion/react` (Framer Motion)

```tsx
import { ShimmeringText } from "@/features/ai-agent/components/shimmering-text"

<ShimmeringText
  text="Listening..."
  duration={2}          // animation duration in seconds
  repeat={true}         // loop indefinitely
  repeatDelay={0.5}
  startOnView={true}    // animate when enters viewport
  spread={2}            // shimmer spread multiplier
  shimmerColor="#4a7c5c"
  className="text-sm font-medium"
/>
```

**Use case**: Agent "thinking" / "listening" state labels. Perfectly paired with Orb.

---

### 14. `speech-input.tsx` — Voice Input with ElevenLabs Scribe STT
**Path**: `client/src/features/ai-agent/components/speech-input.tsx`
**Hook**: `client/src/hooks/use-scribe.ts`
**Dependencies**: `@elevenlabs/react`, ElevenLabs Scribe streaming STT

```tsx
import { SpeechInput } from "@/features/ai-agent/components/speech-input"

<SpeechInput
  modelId="scribe_v1"
  onValueChange={(value) => setTranscript(value)}
  placeholder="Speak or type..."
  commitStrategy="silence"   // "silence" | "manual"
  vadSilenceThresholdSecs={1.5}
/>
```

Full composable API also exports: `SpeechInputRoot`, `SpeechInputArea`, `SpeechInputButton`, `SpeechInputContext`.

---

### 15. `transcript-viewer.tsx` — Karaoke-Style Transcript Viewer
**Path**: `client/src/features/ai-agent/components/transcript-viewer.tsx`
**Hook**: `client/src/hooks/use-transcript-viewer.ts`
**Dependencies**: `@elevenlabs/elevenlabs-js`, `scrub-bar.tsx`

```tsx
import { TranscriptViewer } from "@/features/ai-agent/components/transcript-viewer"

// Takes ElevenLabs character alignment data + playback control
<TranscriptViewer
  alignment={characterAlignmentData}
  currentTime={playbackTime}
  duration={totalDuration}
  onSeek={handleSeek}
/>
```

**Use case**: Karaoke-style word highlighting synced to audio playback. The hook `useTranscriptViewer` manages segment state and scrubbing.

---

### 16. `voice-button.tsx` — Voice Recording Button
**Path**: `client/src/features/ai-agent/components/voice-button.tsx`

```tsx
import { VoiceButton, VoiceButtonState } from "@/features/ai-agent/components/voice-button"

<VoiceButton
  state={buttonState}   // "idle"|"recording"|"processing"|"success"|"error"
  onPress={handlePress}
  label="Hold to speak"
  trailing="⌥Space"
  variant="outline"
/>
```

**States**: idle = mic icon, recording = live waveform + stop, processing = spinner, success = checkmark, error = X.

---

### 17. `voice-picker.tsx` — Voice Selection Combobox
**Path**: `client/src/features/ai-agent/components/voice-picker.tsx`
**Dependencies**: `@elevenlabs/elevenlabs-js`, `audio-player.tsx`, `orb.tsx`

```tsx
import { VoicePicker } from "@/features/ai-agent/components/voice-picker"
import type { ElevenLabs } from "@elevenlabs/elevenlabs-js"

// voices: ElevenLabs.Voice[] from the SDK
<VoicePicker
  voices={voiceList}
  value={selectedVoiceId}
  onValueChange={(id) => setVoiceId(id)}
  placeholder="Select a voice..."
/>
```

**Features**: Searchable combobox with voice name, Orb preview, play/pause audio preview button.

---

## Hooks

### `use-scribe.ts` — ElevenLabs Scribe STT
**Path**: `client/src/hooks/use-scribe.ts`

Used internally by `speech-input.tsx`. Provides real-time speech-to-text via ElevenLabs Scribe streaming API (WebSocket-based).

### `use-transcript-viewer.ts` — Transcript Viewer State
**Path**: `client/src/hooks/use-transcript-viewer.ts`

Used internally by `transcript-viewer.tsx`. Manages character alignment segments and playback position synchronization.

---

## Widget Display Options for Marcela

The ElevenLabs `elevenlabs-convai` web component offers multiple visual styles.
Admin selects the widget variant in **Voice Settings → Widget Settings**.

### Native Widget Variants (`variant` attribute)
| Variant | Description |
|---------|-------------|
| `tiny` | Icon-only floating button |
| `compact` | Icon + label button (default) |
| `full` | Expanded chat panel |

### Custom Component Variants (replace native widget)
| Variant | Component | File | Notes |
|---------|-----------|------|-------|
| `orb` | `Orb` | `orb.tsx` | 3D animated sphere — agent state visual |
| `bars` | `BarVisualizer` | `bar-visualizer.tsx` | Frequency bars during call |
| `matrix` | `Matrix` | `matrix.tsx` | LED pixel grid |
| `conversation-bar` | `ConversationBar` | `conversation-bar.tsx` | Full voice+text bar — WebRTC via `@elevenlabs/react` |

**For `orb`/`bars`/`matrix`**: Custom visual is shown + a hidden `elevenlabs-convai` web component with `variant="tiny"` handles the actual WebRTC session.
**For `conversation-bar`**: Fully replaces the native widget using `@elevenlabs/react`'s `useConversation()` hook. Requires `agentId` (not signed URLs).

---

## Installing More Components

```bash
# Fetch any component (avoids interactive CLI prompts)
curl -s https://ui.elevenlabs.io/r/<name>.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for f in data.get('files', []):
    path = 'client/src/features/ai-agent/components/' + f['path'].split('/')[-1]
    with open(path, 'w') as fp:
        fp.write(f['content'])
    print('wrote', path)
"

# For hooks (path contains 'use-' or 'hook'):
# Change path to client/src/hooks/ and fix any @/registry/elevenlabs-ui/hooks/ imports
# to @/hooks/ in the component that uses the hook.
```

**Known registry names**: `orb`, `bar-visualizer`, `audio-player`, `conversation`, `conversation-bar`, `live-waveform`, `waveform`, `matrix`, `message`, `mic-selector`, `response`, `scrub-bar`, `shimmering-text`, `speech-input`, `transcript-viewer`, `voice-button`, `voice-picker`, `call-status`, `agent-card`
