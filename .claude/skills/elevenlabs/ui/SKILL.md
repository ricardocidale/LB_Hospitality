# ElevenLabs UI Components — Implementation Skill

Open-source React component library for agent UIs, audio visualization, and speech interfaces. Source: [ui.elevenlabs.io](https://ui.elevenlabs.io/) | [GitHub](https://github.com/elevenlabs/ui)

## When to Use This Skill

- Building custom chat/voice UIs for Marcela (beyond the default widget)
- Adding audio visualization (waveforms, orbs) to conversation interfaces
- Implementing speech-to-text input fields
- Creating hybrid text + voice conversation bars
- Building audio players or transcript viewers

## Directory Structure

```
.claude/skills/elevenlabs/ui/
├── SKILL.md                     ← You are here
├── orb.md                       3D animated orb (Three.js, audio-reactive)
├── conversation.md              Scrolling chat container
├── message.md                   User/assistant message component
├── conversation-bar.md          Hybrid text + voice input bar
├── voice-button.md              Microphone toggle button
├── voice-picker.md              Searchable voice selector dropdown
├── mic-selector.md              Microphone device selector
├── waveform.md                  Waveform, scrubber, mic, live, bar visualizer
├── speech-input.md              Real-time STT input (Scribe v2) + TranscriptViewer
├── audio-player.md              Full audio playback + scrub bar
├── response.md                  Streaming markdown renderer (Streamdown)
├── effects.md                   ShimmeringText + Matrix visual effects
└── blocks.md                    Pre-built full-page examples (9 blocks)
```

## Installation in This Project (Vite/React)

ElevenLabs UI targets Next.js but ships as source code. For this Vite + React project:

### Option A: Manual Source Copy (Recommended)
1. Browse [GitHub source](https://github.com/elevenlabs/ui/tree/main/packages/ui/src/components)
2. Copy component files to `client/src/components/ui/elevenlabs/`
3. Install peer deps per component
4. Adjust imports (`@/` → project alias)

### Option B: CLI with Adaptation
```bash
npx @elevenlabs/cli@latest components add <name>
```
Then move output files and fix imports for Vite.

## Peer Dependencies by Component

| Component | Extra Packages |
|-----------|----------------|
| Orb | `three`, `@react-three/fiber`, `@react-three/drei` (already installed) |
| Conversation | `use-stick-to-bottom` |
| Waveform | None (Canvas API) |
| Speech Input | `@elevenlabs/react` |
| Audio Player | None |
| Voice Button | None |
| Voice Picker | Orb component |
| Mic Selector | LiveWaveform component |
| Message | None |
| Response | `streamdown` |
| Bar Visualizer | None (Canvas API) |
| Live Waveform | None (Canvas API) |
| Shimmering Text | `framer-motion` (already installed) |
| Matrix | None |

## Component Categories

### Agent / Conversation (8 components)
| Component | Purpose | File |
|-----------|---------|------|
| **Orb** | 3D animated agent state indicator (audio-reactive) | `orb.md` |
| **Conversation** | Scrolling message container with auto-scroll | `conversation.md` |
| **Message** | Styled chat bubble (user/assistant) | `message.md` |
| **Conversation Bar** | Text input + voice toggle | `conversation-bar.md` |
| **Voice Button** | Mic on/off button | `voice-button.md` |
| **Voice Picker** | Searchable voice selector with audio preview | `voice-picker.md` |
| **Mic Selector** | Microphone device selector with preview | `mic-selector.md` |
| **Response** | Streaming markdown renderer (Streamdown) | `response.md` |

### Audio Visualization (3 components)
| Component | Purpose | File |
|-----------|---------|------|
| **Waveform** | Static/scrolling/scrubber/mic waveform | `waveform.md` |
| **Live Waveform** | Real-time scrolling visualization | `waveform.md` |
| **Bar Visualizer** | Frequency bar display | `waveform.md` |

### Speech / Audio (3 components)
| Component | Purpose | File |
|-----------|---------|------|
| **Speech Input** | Real-time STT with Scribe v2 | `speech-input.md` |
| **Audio Player** | Playback with controls | `audio-player.md` |
| **Transcript Viewer** | Word-by-word sync to audio | `speech-input.md` |

### Visual Effects (2 components)
| Component | Purpose | File |
|-----------|---------|------|
| **Shimmering Text** | Animated gradient shimmer text (framer-motion) | `effects.md` |
| **Matrix** | Retro dot-matrix display with animations | `effects.md` |

## Marcela Integration Map

| Current Widget Feature | UI Component Upgrade |
|------------------------|---------------------|
| Widget orb animation | → **Orb** (custom colors, size, audio-reactive) |
| Widget chat transcript | → **Conversation** + **Message** + **Response** (full control) |
| Widget mic button | → **Voice Button** (styled to theme) |
| Widget voice selector | → **Voice Picker** (searchable, audio preview) |
| No mic device selection | → **Mic Selector** (device management) |
| No visualization | → **Waveform** / **Live Waveform** (audio feedback) |
| No text input | → **Conversation Bar** (hybrid mode) |
| No form fill by voice | → **Speech Input** (Scribe v2 real-time) |
| No streaming text | → **Response** (character-by-character markdown) |
| No shimmer effects | → **Shimmering Text** (hero text, loading states) |

## Design System Integration

All ElevenLabs UI components use CSS custom properties and Tailwind. They inherit from our theme engine:
- Dark Glass theme: Set `--foreground`, `--background`, `--accent` CSS vars
- Glass overlays: Components support `className` prop for glass effects
- Colors: Orb `colors` prop maps to our accent palette

## Quick Reference: Agent State Values

Used by Orb and other state-aware components:
```typescript
type AgentState = "idle" | "listening" | "talking";
```

Map from `useConversation` hook:
```typescript
const agentState = conversation.isSpeaking ? "talking" : conversation.status === "connected" ? "listening" : "idle";
```
