# ElevenLabs UI Component Library

Open-source component library built on shadcn/ui for building agent and audio experiences. Source: [ui.elevenlabs.io](https://ui.elevenlabs.io/) | [GitHub](https://github.com/elevenlabs/ui)

## Overview

ElevenLabs UI provides pre-built React components for conversational agents, audio playback, speech-to-text, waveform visualization, and more. Components are installed as source code (not a package) — you own and can customize them.

## Prerequisites

- Node.js 18+
- Next.js project (or any React project with shadcn/ui)
- shadcn/ui setup (auto-configured on first install if missing)

## Installation

### Install via CLI

```bash
# Using ElevenLabs CLI (recommended)
npx @elevenlabs/cli@latest components add <component-name>

# Using shadcn CLI (alternative)
npx shadcn@latest add "https://ui.elevenlabs.io/r/<component-name>.json"
```

### Example

```bash
npx @elevenlabs/cli@latest components add orb
npx @elevenlabs/cli@latest components add conversation
npx @elevenlabs/cli@latest components add voice-button
```

Components are added to your project's components directory as editable source files.

## Component Reference

### Agent / Conversation Components

#### Orb

3D animated orb with audio reactivity, custom colors, and agent state visualization (Three.js).

```bash
npx @elevenlabs/cli@latest components add orb
```

```tsx
import { Orb } from "@/components/ui/orb";

<Orb
  colors={["#CADCFC", "#A0B9D1"]}
  agentState="listening"    // "idle" | "listening" | "talking"
  height={200}
  width={200}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `colors` | `[string, string]` | `["#CADCFC", "#A0B9D1"]` | Gradient colors |
| `agentState` | `AgentState` | - | Agent state for animation |
| `seed` | `number` | Random | Consistent animation seed |
| `height` | `number` | `200` | Height in px |
| `width` | `number` | `200` | Width in px |

#### Conversation

Scrolling conversation container with auto-scroll and sticky-to-bottom behavior.

```bash
npx @elevenlabs/cli@latest components add conversation
```

```tsx
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton
} from "@/components/ui/conversation";

<Conversation>
  <ConversationContent>
    {messages.length === 0 ? (
      <ConversationEmptyState title="Start a conversation" />
    ) : (
      messages.map(msg => <Message key={msg.id} from={msg.role}>...</Message>)
    )}
  </ConversationContent>
  <ConversationScrollButton />
</Conversation>
```

Built on `use-stick-to-bottom`. Auto-scrolls on new messages. Scroll button appears when user scrolls up.

#### Conversation Bar

Input bar with text input and voice toggle for hybrid chat/voice interfaces.

```bash
npx @elevenlabs/cli@latest components add conversation-bar
```

#### Message

Composable message component with avatar, variants, and automatic user/assistant alignment.

```bash
npx @elevenlabs/cli@latest components add message
```

```tsx
import { Message, MessageContent, MessageAvatar } from "@/components/ui/message";

<Message from="user">
  <MessageContent variant="contained">How do I create an agent?</MessageContent>
</Message>

<Message from="assistant">
  <MessageAvatar src="/assistant-avatar.png" name="Marcela" />
  <MessageContent variant="flat">To create a new agent...</MessageContent>
</Message>
```

| Prop | Type | Description |
|------|------|-------------|
| `from` | `"user" \| "assistant"` | Determines alignment and styling |
| `variant` | `"contained" \| "flat"` | Visual style (default: "contained") |

#### Response

Streaming response display with typing animation effects.

```bash
npx @elevenlabs/cli@latest components add response
```

#### Voice Button

Microphone button for starting/stopping voice input.

```bash
npx @elevenlabs/cli@latest components add voice-button
```

#### Voice Picker

Voice selection UI for choosing from available ElevenLabs voices.

```bash
npx @elevenlabs/cli@latest components add voice-picker
```

#### Mic Selector

Microphone device selector dropdown.

```bash
npx @elevenlabs/cli@latest components add mic-selector
```

### Audio Visualization Components

#### Waveform

Canvas-based audio waveform with recording, playback scrubbing, and mic input.

```bash
npx @elevenlabs/cli@latest components add waveform
```

```tsx
import { Waveform, ScrollingWaveform, AudioScrubber, MicrophoneWaveform } from "@/components/ui/waveform";

// Static waveform
<Waveform data={audioData} barWidth={4} barGap={2} height={128} />

// Scrolling animation
<ScrollingWaveform speed={50} barCount={60} />

// Playback scrubber
<AudioScrubber currentTime={time} duration={duration} onSeek={setTime} />

// Microphone input
<MicrophoneWaveform active={isRecording} />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `number[]` | - | Values 0-1 for each bar |
| `barWidth` | `number` | `4` | Bar width in px |
| `barGap` | `number` | `2` | Gap between bars |
| `barColor` | `string` | foreground | Custom bar color |
| `fadeEdges` | `boolean` | `true` | Fade effect on edges |
| `height` | `string \| number` | `128` | Waveform height |

#### Live Waveform

Real-time audio visualization with smooth scrolling animation.

```bash
npx @elevenlabs/cli@latest components add live-waveform
```

#### Bar Visualizer

Bar-based audio frequency visualization.

```bash
npx @elevenlabs/cli@latest components add bar-visualizer
```

### Audio Playback Components

#### Audio Player

Full-featured audio player with playback controls.

```bash
npx @elevenlabs/cli@latest components add audio-player
```

#### Scrub Bar

Audio playback scrub bar with time display.

```bash
npx @elevenlabs/cli@latest components add scrub-bar
```

### Speech-to-Text Components

#### Speech Input

Compact STT input with real-time transcription via ElevenLabs Scribe.

```bash
npx @elevenlabs/cli@latest components add speech-input
```

```tsx
import { SpeechInput, SpeechInputRecordButton, SpeechInputPreview } from "@/components/ui/speech-input";

<SpeechInput
  getToken={() => fetch("/api/scribe-token").then(r => r.json())}
  onChange={(data) => setTranscript(data.text)}
  modelId="scribe_v2_realtime"
>
  <SpeechInputRecordButton />
  <SpeechInputPreview placeholder="Speak to fill..." />
</SpeechInput>
```

| Prop | Type | Description |
|------|------|-------------|
| `getToken` | `() => Promise<string>` | Fetch Scribe auth token |
| `onChange` | `(data) => void` | Called on transcript change |
| `modelId` | `string` | Model ID (default: `scribe_v2_realtime`) |
| `languageCode` | `string` | ISO language code |
| `commitStrategy` | `"manual" \| "vad"` | How transcripts commit |

#### Transcript Viewer

Word-by-word highlighting synced to audio playback.

```bash
npx @elevenlabs/cli@latest components add transcript-viewer
```

### Visual Effects Components

#### Shimmering Text

Text with animated shimmer/sparkle effect.

```bash
npx @elevenlabs/cli@latest components add shimmering-text
```

#### Matrix

Matrix-style falling character animation display.

```bash
npx @elevenlabs/cli@latest components add matrix
```

## Pre-built Blocks (Complete Examples)

Full-page examples combining multiple components. Install with the same CLI:

```bash
npx @elevenlabs/cli@latest components add voice-chat-01
```

| Block | Description | Components Used |
|-------|-------------|-----------------|
| `voice-chat-01` | Voice chat with text input | Conversation, Message, Voice Button |
| `voice-chat-02` | Minimal voice chat (orb-based) | Orb, Voice Button |
| `voice-chat-03` | Chat + phone button | Conversation, Message, Conversation Bar |
| `transcriber-01` | Audio file transcriber | Waveform, Speech Input |
| `realtime-transcriber-01` | Real-time STT (Scribe v2) | Speech Input, Live Waveform |
| `voice-form-01` | Voice-fill form fields | Speech Input |
| `speaker-01` | Audio player with visualizer | Audio Player, Waveform |
| `music-player-01` | Playlist music player | Audio Player, Scrub Bar |
| `music-player-02` | Simple music player | Audio Player |

## Integration with This Project

### Compatibility Notes

- ElevenLabs UI is designed for **Next.js** projects. This project uses **Vite + React**.
- Components are source code, so they can be adapted to work with Vite/React.
- The `@elevenlabs/cli` may need Next.js; consider manual installation for Vite projects.
- shadcn/ui components are already in this project — ElevenLabs UI components build on them.

### Manual Installation for Vite/React

1. Browse source on [GitHub](https://github.com/elevenlabs/ui/tree/main/packages/ui/src/components)
2. Copy the component source files to `client/src/components/ui/`
3. Install any peer dependencies (`use-stick-to-bottom`, Three.js for Orb, etc.)
4. Adjust imports for Vite path aliases (`@/` → project's alias)

### Relevant Components for Marcela

| Component | Use Case |
|-----------|----------|
| **Orb** | Visual feedback during Marcela voice conversations |
| **Conversation** + **Message** | Chat transcript UI |
| **Voice Button** | Mic toggle for voice input |
| **Waveform** / **Live Waveform** | Audio visualization during conversations |
| **Speech Input** | Voice-to-text for form filling |
| **Conversation Bar** | Hybrid text + voice input bar |

### Current Marcela Widget

The project currently uses `@elevenlabs/convai-widget-core` with `registerWidget()` for the Marcela AI assistant. The ElevenLabs UI components offer a more customizable alternative if deeper integration is needed (custom chat UI, orb visualization, transcript display, etc.).
