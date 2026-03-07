---
name: voice-ux-patterns
description: Voice widget UX patterns for conversational AI. State machine, waveform, barge-in, error handling.
---

# Voice Widget UX Patterns

## Voice State Machine

```
idle → recording → processing → thinking → speaking → idle
                                                    ↓
                                              (barge-in)
                                                    ↓
                                              recording
```

### States
| State | Visual | Trigger |
|-------|--------|---------|
| `idle` | Nothing shown | Default, after speaking ends |
| `recording` | Red pulse dot + "Listening..." + waveform bars | User taps mic |
| `processing` | Amber spinner + "Processing audio..." | Recording stops, audio uploading |
| `thinking` | Bouncing dots + "Thinking..." | Transcript received, LLM streaming starts |
| `speaking` | Pulsing volume icon + "Marcela is speaking..." | Audio playback begins |

### State Derivation (from AIChatWidget.tsx)
```tsx
useEffect(() => {
  if (isRecording) setVoiceState("recording");
  else if (isProcessingVoice && !streamingContent) setVoiceState("processing");
  else if (isStreaming && !isPlayingAudio && streamingContent) setVoiceState("thinking");
  else if (isPlayingAudio) setVoiceState("speaking");
  else setVoiceState("idle");
}, [isRecording, isProcessingVoice, isStreaming, isPlayingAudio, streamingContent]);
```

## VoiceStateIndicator Component

Renders below the chat message area, above the input bar:
```tsx
function VoiceStateIndicator({ voiceState }: { voiceState: VoiceState }) {
  if (voiceState === "idle") return null;
  const configs = {
    recording: { label: "Listening...", color: "text-red-500", icon: <pulse dot> },
    processing: { label: "Processing audio...", color: "text-amber-500", icon: <spinner> },
    thinking: { label: "Thinking...", color: "text-primary", icon: <bouncing dots> },
    speaking: { label: "Marcela is speaking...", color: "text-primary", icon: <Volume2 pulse> },
  };
  // Render: icon + label in a flex row
}
```

## WaveformVisualizer Component

CSS-animated frequency bars during recording:
```tsx
function WaveformVisualizer({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;
  return (
    <div className="flex items-center gap-0.5 h-4 px-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="w-0.5 bg-red-400 rounded-full animate-pulse"
          style={{
            height: `${Math.random() * 12 + 4}px`,
            animationDelay: `${i * 80}ms`,
            animationDuration: `${300 + Math.random() * 400}ms`,
          }}
        />
      ))}
    </div>
  );
}
```

## Barge-In (Interruption)

When Marcela is speaking (`isPlayingAudio === true`), user can tap the mic button to:
1. Stop audio playback (`playback.clear()`)
2. Start new recording (`startRecording()`)
3. State transitions: `speaking → recording`

```tsx
const handleVoiceToggle = async () => {
  if (isRecording) {
    // Stop recording → process
    const blob = await stopRecording();
    processVoiceMessage(blob);
  } else if (isPlayingAudio) {
    // Barge-in: interrupt Marcela
    playback.clear();
    await startRecording();
  } else {
    // Start fresh recording
    await playback.init();
    await startRecording();
  }
};
```

## Error Handling & Retry

Voice errors display an amber warning bar with retry button:
```tsx
{voiceError && (
  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
    <span>{voiceError}</span>
    {lastFailedVoiceBlob && (
      <Button variant="ghost" size="sm" onClick={retryVoice}>
        <RotateCcw className="w-3 h-3" /> Retry
      </Button>
    )}
  </div>
)}
```

### Error Flow
1. Voice processing fails → store blob in `lastFailedVoiceBlob`, show error message
2. User taps Retry → resubmit same blob to voice endpoint
3. On success → clear error state

## Channel Badges

Conversations show channel icons in the sidebar:
```tsx
function ChannelIcon({ channel }: { channel?: string }) {
  switch (channel) {
    case "phone": return <Phone className="w-3.5 h-3.5 text-blue-500" />;
    case "sms": return <MessageCircle className="w-3.5 h-3.5 text-green-500" />;
    default: return <Globe className="w-3.5 h-3.5 text-muted-foreground" />;
  }
}
```

## Voice Button States

The mic button changes appearance based on state:
| State | Variant | Icon | Disabled |
|-------|---------|------|----------|
| Idle | `outline` | Mic | No |
| Recording | `destructive` + `animate-pulse` | MicOff | No |
| Processing | `outline` | Loader2 spin | Yes |
| Speaking | `secondary` | Mic (for barge-in) | No |
| Streaming (text only) | `outline` | Mic | Yes |

## Audio Hooks

### useVoiceRecorder
```typescript
const { state, startRecording, stopRecording } = useVoiceRecorder();
// state: "idle" | "recording" | "stopped"
// startRecording(): Promise<void> — requests mic, starts MediaRecorder (WebM/Opus)
// stopRecording(): Promise<Blob> — stops recorder, returns audio blob
```

### useAudioPlayback
```typescript
const { state, init, pushAudio, pushSequencedAudio, signalComplete, clear } = useAudioPlayback();
// state: "idle" | "playing" | "ended"
// init(): create AudioContext + register worklet
// pushAudio(base64): decode PCM16 → Float32, post to worklet
// pushSequencedAudio(seq, base64): same but with SequenceBuffer reordering
// clear(): stop playback, reset buffer
// signalComplete(): tell worklet no more audio coming
```

## Implementation Checklist (New Voice Widgets)

1. Import `useVoiceRecorder` and `useAudioPlayback` hooks
2. Define `VoiceState` type and derive from hook states
3. Add `VoiceStateIndicator` and `WaveformVisualizer` components
4. Wire `handleVoiceToggle` with barge-in support
5. Track `voiceError` and `lastFailedVoiceBlob` for retry
6. Call `playback.init()` before first recording
7. Send audio to voice endpoint as base64, handle SSE response
8. Parse SSE events: `user_transcript`, `text`, `audio`, `done`
9. Feed audio chunks to `pushAudio()` or `pushSequencedAudio()`
10. Add `data-testid` attributes to all interactive elements
