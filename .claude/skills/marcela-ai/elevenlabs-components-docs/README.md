# ElevenLabs UI — Component Documentation

Fetched from: https://github.com/elevenlabs/ui (`apps/www/content/docs/components/`)
Source registry: `apps/www/registry/elevenlabs-ui/ui/`

Each file is the raw MDX doc including installation steps, usage examples, and full API reference.
Import paths in the docs use `@/components/ui/` — our project maps these to `@/features/ai-agent/components/`.

## Component Index

| File | Component | Category | Key Dependencies |
|------|-----------|----------|-----------------|
| `audio-player.md` | `AudioPlayerProvider` + sub-components | Playback | `@radix-ui/react-slider`, `@radix-ui/react-dropdown-menu` |
| `bar-visualizer.md` | `BarVisualizer` | Visualization | Web Audio API |
| `conversation-bar.md` | `ConversationBar` | Conversation | `@elevenlabs/react`, `live-waveform` |
| `conversation.md` | `Conversation` + `ConversationContent` | Conversation | `use-stick-to-bottom` |
| `live-waveform.md` | `LiveWaveform` | Visualization | Web Audio API |
| `matrix.md` | `Matrix` | Visualization | None |
| `message.md` | `Message` + `MessageContent` + `MessageAvatar` | Conversation | None |
| `mic-selector.md` | `MicSelector` + `useAudioDevices` | Input | Web Audio API |
| `orb.md` | `Orb` | Visualization | `@react-three/fiber`, `@react-three/drei`, `three` |
| `response.md` | `Response` | Output | `streamdown` |
| `scrub-bar.md` | `ScrubBarContainer` + sub-components | Playback | `@radix-ui/react-slider` |
| `shimmering-text.md` | `ShimmeringText` | Animation | `motion/react` |
| `speech-input.md` | `SpeechInput` + `use-scribe` hook | Input | `@elevenlabs/react` |
| `transcript-viewer.md` | `TranscriptViewer` + `use-transcript-viewer` hook | Playback | `@elevenlabs/elevenlabs-js`, `scrub-bar` |
| `voice-button.md` | `VoiceButton` | Input | `live-waveform` |
| `voice-picker.md` | `VoicePicker` | Selection | `@elevenlabs/elevenlabs-js`, `audio-player`, `orb` |
| `waveform.md` | `Waveform` + 6 variants | Visualization | Web Audio API |

## Component Categories

### Conversation
Components for building chat/voice conversation interfaces.
- `conversation.tsx` — Auto-scrolling container with empty state
- `conversation-bar.tsx` — Full voice + text bar (WebRTC via `@elevenlabs/react`)
- `message.tsx` — Chat bubble with user/assistant alignment

### Visualization
Real-time audio visualizers and animated effects.
- `orb.tsx` — 3D animated sphere with agent state (Three.js)
- `bar-visualizer.tsx` — Multi-bar frequency visualizer
- `live-waveform.tsx` — Real-time microphone waveform (static or scrolling)
- `waveform.tsx` — Full suite: Waveform, ScrollingWaveform, AudioScrubber, MicrophoneWaveform, StaticWaveform, LiveMicrophoneWaveform, RecordingWaveform
- `matrix.tsx` — LED pixel grid visualizer
- `shimmering-text.tsx` — Shimmer text animation (status labels)

### Input
Voice and audio input components.
- `speech-input.tsx` — Voice input with ElevenLabs Scribe STT
- `voice-button.tsx` — Hold-to-speak button with state machine
- `mic-selector.tsx` — Microphone device dropdown with live preview

### Playback
Audio playback and scrubbing controls.
- `audio-player.tsx` — Full-featured audio player (progress, speed, time)
- `scrub-bar.tsx` — Composable seek bar primitives
- `transcript-viewer.tsx` — Karaoke-style word-highlight synced to audio

### Output
Text rendering components.
- `response.tsx` — Streaming markdown renderer (`streamdown`)

### Selection
Pickers and selectors.
- `voice-picker.tsx` — Searchable voice combobox with Orb preview + audio sample

## How to Fetch Updates

To refresh a doc from the upstream repo:
```bash
curl -s https://raw.githubusercontent.com/elevenlabs/ui/main/apps/www/content/docs/components/<name>.mdx \
  > .claude/skills/marcela-ai/elevenlabs-components-docs/<name>.md
```

To fetch component source from the registry:
```bash
curl -s https://raw.githubusercontent.com/elevenlabs/ui/main/apps/www/registry/elevenlabs-ui/ui/<name>.tsx
```

To install a new component into the project:
```bash
curl -s https://ui.elevenlabs.io/r/<name>.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for f in data.get('files', []):
    path = 'client/src/features/ai-agent/components/' + f['path'].split('/')[-1]
    with open(path, 'w') as fp: fp.write(f['content'])
    print('wrote', path)
"
```
