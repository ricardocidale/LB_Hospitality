# Waveform Components

Canvas-based audio visualization with multiple modes: static waveform, scrolling animation, playback scrubber, microphone input, live waveform, and bar visualizer.

## Install

```bash
npx @elevenlabs/cli@latest components add waveform
npx @elevenlabs/cli@latest components add live-waveform
npx @elevenlabs/cli@latest components add bar-visualizer
```

### Peer Dependencies
None (uses Canvas API).

## Components

### Waveform (Static)

Renders a fixed waveform from data array.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `number[]` | — | Values 0–1 for each bar |
| `barWidth` | `number` | `4` | Bar width in px |
| `barGap` | `number` | `2` | Gap between bars in px |
| `barColor` | `string` | foreground | Custom bar color |
| `fadeEdges` | `boolean` | `true` | Fade effect on container edges |
| `height` | `string \| number` | `128` | Container height |

```tsx
import { Waveform } from "@/components/ui/elevenlabs/waveform";

<Waveform
  data={[0.2, 0.5, 0.8, 0.3, 0.6, 0.9, 0.4]}
  barWidth={4}
  barGap={2}
  barColor="#9FBCA4"
  height={64}
/>
```

### ScrollingWaveform

Continuously scrolling animated waveform. No data required — generates random bars.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `speed` | `number` | `50` | Scroll speed (px/s) |
| `barCount` | `number` | `60` | Number of visible bars |
| `barWidth` | `number` | `4` | Bar width |
| `barGap` | `number` | `2` | Gap between bars |
| `barColor` | `string` | foreground | Bar color |

```tsx
import { ScrollingWaveform } from "@/components/ui/elevenlabs/waveform";

<ScrollingWaveform speed={50} barCount={60} barColor="#9FBCA4" />
```

### AudioScrubber

Playback position scrubber synced to audio time.

| Prop | Type | Description |
|------|------|-------------|
| `currentTime` | `number` | Current playback time (seconds) |
| `duration` | `number` | Total duration (seconds) |
| `onSeek` | `(time: number) => void` | Called when user scrubs |

```tsx
import { AudioScrubber } from "@/components/ui/elevenlabs/waveform";

<AudioScrubber
  currentTime={currentTime}
  duration={totalDuration}
  onSeek={(t) => audioRef.current.currentTime = t}
/>
```

### MicrophoneWaveform

Real-time microphone input visualization.

| Prop | Type | Description |
|------|------|-------------|
| `active` | `boolean` | Whether microphone is recording |
| `barColor` | `string` | Bar color |

```tsx
import { MicrophoneWaveform } from "@/components/ui/elevenlabs/waveform";

<MicrophoneWaveform active={isRecording} barColor="#9FBCA4" />
```

### LiveWaveform

Real-time audio visualization with smooth scrolling animation. More fluid than MicrophoneWaveform.

```tsx
import { LiveWaveform } from "@/components/ui/elevenlabs/live-waveform";

<LiveWaveform className="h-16 w-full" />
```

### BarVisualizer

Frequency-domain bar visualization (equalizer style).

```tsx
import { BarVisualizer } from "@/components/ui/elevenlabs/bar-visualizer";

<BarVisualizer
  barCount={32}
  height={64}
  barColor="#9FBCA4"
/>
```

## Marcela Integration Example

Show waveform during active conversation:

```tsx
function MarcelaVisualizer() {
  const conversation = useConversation();

  if (conversation.status !== "connected") return null;

  return (
    <div className="flex flex-col items-center gap-4">
      <Orb
        colors={["#9FBCA4", "#257D41"]}
        agentState={conversation.isSpeaking ? "talking" : "listening"}
        height={150}
        width={150}
      />
      <MicrophoneWaveform
        active={!conversation.isSpeaking}
        barColor="#9FBCA4"
      />
    </div>
  );
}
```

## Performance Notes

- Canvas rendering at 60fps via `requestAnimationFrame`
- GPU-composited layers for smooth scrolling
- Auto-cleanup on unmount (cancels animation frames)
- MicrophoneWaveform uses Web Audio API `AnalyserNode`

## Vite Adaptation

1. Copy source to `client/src/components/ui/elevenlabs/waveform.tsx` (and variants)
2. No extra deps — pure Canvas API
3. Fix `@/` imports
