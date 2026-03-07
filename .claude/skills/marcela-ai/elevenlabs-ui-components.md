---
name: ElevenLabs UI Components
description: Complete reference for all ElevenLabs UI components installed in the project. Use when building or modifying the Marcela AI agent interface, voice widget, or audio playback features.
---

# ElevenLabs UI Components

All components sourced from https://ui.elevenlabs.io/ via `npx @elevenlabs/cli@latest components add <name>`.
Installed to: `client/src/components/ui/`

## Installed Components

### 1. `orb.tsx` — Animated 3D Voice Orb
**Path**: `client/src/components/ui/orb.tsx`
**Dependencies**: `@react-three/fiber`, `@react-three/drei`, `three` (all installed)
**Usage**: Animated 3D sphere that visualizes agent state. Best for hero visuals.

```tsx
import { Orb, AgentState } from "@/components/ui/orb"

<div className="w-32 h-32">
  <Orb
    colors={["#9fbca4", "#4a7c5c"]}   // [primary, secondary] hex colors
    agentState="listening"              // null | "thinking" | "listening" | "talking"
    seed={42}                           // deterministic randomness for consistent shape
  />
</div>
```

**AgentState visual behavior**:
- `null` — gentle ambient pulse
- `"thinking"` — slow warm glow animation
- `"listening"` — active microphone pulse (fast)
- `"talking"` — speech output wave (energetic)

**Current uses in project**:
- `MarcelaTab.tsx` — ElevenLabs card header icon (40×40, `agentState="thinking"`)
- `MarcelaTab.tsx` — Test Conversation dialog (112×112, cycling states)

---

### 2. `bar-visualizer.tsx` — Multi-Bar Audio Visualizer
**Path**: `client/src/components/ui/bar-visualizer.tsx`
**Dependencies**: None (uses Web Audio API)
**Usage**: Real-time multi-bar frequency visualizer. Best for active conversation UIs.

```tsx
import { BarVisualizer, AgentState } from "@/components/ui/bar-visualizer"

// Demo mode (no real microphone required)
<BarVisualizer
  state="speaking"                  // "connecting"|"initializing"|"listening"|"speaking"|"thinking"
  barCount={15}
  demo={true}
  minHeight={20}
  maxHeight={100}
  centerAlign={false}               // false = bottom-aligned (default), true = center-aligned
  className="h-20 rounded-xl"
/>

// Live microphone mode
<BarVisualizer
  state={agentState}
  mediaStream={microphoneStream}
  barCount={20}
/>
```

**Also exports hooks**:
- `useAudioVolume(stream, options)` → `number` (0–1 single volume)
- `useMultibandVolume(stream, options)` → `number[]` (per-frequency-band)
- `useBarAnimator(state, columns, interval)` → `number[]` (highlighted bar indices)

---

### 3. `audio-player.tsx` — Feature-Rich Audio Player
**Path**: `client/src/components/ui/audio-player.tsx`
**Dependencies**: `@radix-ui/react-slider`, `@radix-ui/react-dropdown-menu` (both installed)
**Usage**: Full-featured audio player with scrubbing, speed control, and playlist support.

```tsx
import {
  AudioPlayerProvider,
  AudioPlayerButton,
  AudioPlayerProgress,
  AudioPlayerTime,
  AudioPlayerDuration,
  AudioPlayerSpeed,
} from "@/components/ui/audio-player"

const item = { id: "conv-123", src: "https://..." }

<AudioPlayerProvider>
  <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
    <AudioPlayerButton item={item} size="sm" variant="ghost" className="h-8 w-8" />
    <AudioPlayerProgress className="flex-1" />
    <AudioPlayerTime className="text-xs text-muted-foreground" />
    <span className="text-xs text-muted-foreground/40">/</span>
    <AudioPlayerDuration className="text-xs text-muted-foreground" />
    <AudioPlayerSpeed />
  </div>
</AudioPlayerProvider>
```

**Also exports**: `useAudioPlayer()`, `useAudioPlayerTime()` hooks for custom controls.

**Current use**: `ConversationHistory.tsx` — plays ElevenLabs conversation recordings.

---

### 4. `conversation.tsx` — Auto-Scrolling Chat Container
**Path**: `client/src/components/ui/conversation.tsx`
**Dependencies**: `use-stick-to-bottom` (installed)
**Usage**: Container that auto-scrolls to bottom as messages arrive.

```tsx
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ui/conversation"

<Conversation className="h-96">
  <ConversationContent>
    {messages.length === 0 ? (
      <ConversationEmptyState
        title="No messages yet"
        description="Start a conversation"
        icon={<Bot className="w-8 h-8" />}
      />
    ) : (
      messages.map(m => <MessageBubble key={m.id} {...m} />)
    )}
    <ConversationScrollButton />
  </ConversationContent>
</Conversation>
```

---

### 5. `conversation-bar.tsx` — Full Voice + Text Conversation Interface
**Path**: `client/src/components/ui/conversation-bar.tsx`
**Dependencies**: `@elevenlabs/react` (installed v0.14.1), `live-waveform.tsx`
**Usage**: Complete voice conversation widget — phone button, mute, keyboard input, waveform.

```tsx
import { ConversationBar } from "@/components/ui/conversation-bar"

<ConversationBar
  agentId="your-elevenlabs-agent-id"
  onConnect={() => setIsConnected(true)}
  onDisconnect={() => setIsConnected(false)}
  onMessage={(msg) => console.log(msg.source, msg.message)}
  onError={(err) => console.error(err)}
  className="max-w-lg mx-auto"
/>
```

**Features built-in**:
- WebRTC voice connection via `@elevenlabs/react`'s `useConversation()`
- Phone/hang-up button (start/end session)
- Mute/unmute toggle
- Keyboard expand (Textarea with Enter-to-send)
- Live waveform visualization
- Contextual text updates while typing

**Connection states**: `"disconnected"` → `"connecting"` → `"connected"` → `"disconnecting"`

---

### 6. `live-waveform.tsx` — Real-Time Microphone Waveform
**Path**: `client/src/components/ui/live-waveform.tsx`
**Dependencies**: None
**Usage**: Canvas-based waveform that renders microphone input in real time.

```tsx
import { LiveWaveform } from "@/components/ui/live-waveform"

<LiveWaveform
  active={isRecording}
  processing={isConnecting}    // shows loading animation
  barWidth={3}
  barGap={1}
  barRadius={4}
  fadeEdges={true}
  fadeWidth={24}
  sensitivity={1.8}
  smoothingTimeConstant={0.85}
  height={32}
  mode="static"                // "static" | "scrolling"
  className="w-full"
/>
```

---

### 7. `waveform.tsx` — Static Waveform from Data Array
**Path**: `client/src/components/ui/waveform.tsx`
**Dependencies**: None
**Usage**: Renders a static waveform from a pre-computed data array (e.g., for playback seek UI).

```tsx
import { Waveform } from "@/components/ui/waveform"

<Waveform
  data={amplitudeArray}     // number[] of values 0–1
  barWidth={4}
  barGap={2}
  barRadius={2}
  fadeEdges={true}
  height={64}
  active={isPlaying}         // highlights bars before current time
  onBarClick={(index, value) => seekTo(index)}
/>
```

---

## Widget Display Options for Marcela

The ElevenLabs `elevenlabs-convai` web component offers multiple visual styles.
Admin can select the widget variant in **Voice Settings → Widget Settings**.

### Native Widget Variants (`variant` attribute)
| Variant | Description | Best For |
|---------|-------------|----------|
| `tiny` | Icon-only floating button | Minimal footprint |
| `compact` | Icon + label button | Default - balanced |
| `full` | Expanded chat panel | Admin/testing |

### Our Custom Components (alternatives to the native widget)
| Component | File | Use Case |
|-----------|------|----------|
| `Orb` | `orb.tsx` | 3D animated sphere hero — show agent "alive" |
| `BarVisualizer` | `bar-visualizer.tsx` | Real-time frequency bars during call |
| `ConversationBar` | `conversation-bar.tsx` | Full replacement for native widget (voice + text) |
| `LiveWaveform` | `live-waveform.tsx` | Compact waveform strip |

### Adding Widget Style Selector to Admin
The `marcelaWidgetVariant` field in `global_assumptions` currently controls `tiny|compact|full`.
To add our custom components, extend `VoiceSettings.tsx` with a "Widget Style" picker:
- `"orb"` → show `<Orb>` component instead of native widget
- `"bars"` → show `<BarVisualizer>` component
- `"bar-widget"` → show `<ConversationBar>` component
- `"tiny"|"compact"|"full"` → native `elevenlabs-convai` web component

---

## Installing More ElevenLabs UI Components

```bash
# List available components
curl -s https://ui.elevenlabs.io/registry.json | python3 -c "import json,sys; [print(c['name']) for c in json.load(sys.stdin)['items']]"

# Install a component (from workspace root)
npx @elevenlabs/cli@latest components add <name>
# OR fetch manually (avoids interactive prompts):
curl -s https://ui.elevenlabs.io/r/<name>.json | python3 -c "import json,sys; [open(f'client/src/components/ui/{f[\"path\"].split(\"/\")[-1]}','w').write(f['content']) for f in json.load(sys.stdin)['files']]"
```

**Known available components**: `orb`, `bar-visualizer`, `audio-player`, `conversation`, `conversation-bar`, `live-waveform`, `waveform`, `call-status`, `transcript-panel`, `agent-card`
