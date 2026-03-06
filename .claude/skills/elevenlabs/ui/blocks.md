# Pre-Built Blocks (Full-Page Examples)

Complete page templates combining multiple ElevenLabs UI components. Install with the CLI and adapt for this project.

## Install

```bash
npx @elevenlabs/cli@latest components add <block-name>
```

## Available Blocks

### Voice Chat Blocks

#### voice-chat-01 — Full Voice Chat with Text
Complete voice chat with message history, text input, and voice toggle.

```bash
npx @elevenlabs/cli@latest components add voice-chat-01
```

**Components used**: Conversation, Message, Voice Button, Conversation Bar
**Best for**: Full Marcela chat experience with text fallback

#### voice-chat-02 — Minimal Voice Chat (Orb)
Orb-centered voice interface with minimal UI. Push-to-talk style.

```bash
npx @elevenlabs/cli@latest components add voice-chat-02
```

**Components used**: Orb, Voice Button
**Best for**: Ambient voice interface, floating Marcela orb

#### voice-chat-03 — Chat + Phone Button
Chat interface with option to escalate to phone call.

```bash
npx @elevenlabs/cli@latest components add voice-chat-03
```

**Components used**: Conversation, Message, Conversation Bar
**Best for**: Support scenarios with call escalation

### Transcription Blocks

#### transcriber-01 — Audio File Transcriber
Upload audio file and get transcription with waveform.

```bash
npx @elevenlabs/cli@latest components add transcriber-01
```

**Components used**: Waveform, Speech Input
**Best for**: Processing recorded conversations

#### realtime-transcriber-01 — Real-Time STT
Live microphone transcription with Scribe v2.

```bash
npx @elevenlabs/cli@latest components add realtime-transcriber-01
```

**Components used**: Speech Input, Live Waveform
**Best for**: Live note-taking, real-time subtitles

### Form Block

#### voice-form-01 — Voice-Fill Form
Form fields that can be filled by speaking instead of typing.

```bash
npx @elevenlabs/cli@latest components add voice-form-01
```

**Components used**: Speech Input
**Best for**: Property data entry, assumption forms

### Audio Player Blocks

#### speaker-01 — Audio Player with Visualizer
Audio player with waveform visualization.

```bash
npx @elevenlabs/cli@latest components add speaker-01
```

**Components used**: Audio Player, Waveform
**Best for**: Conversation playback with visual feedback

#### music-player-01 — Playlist Music Player
Full playlist player with track list and controls.

```bash
npx @elevenlabs/cli@latest components add music-player-01
```

**Components used**: Audio Player, Scrub Bar

#### music-player-02 — Simple Music Player
Minimal single-track player.

```bash
npx @elevenlabs/cli@latest components add music-player-02
```

**Components used**: Audio Player

## Marcela Block Recommendations

| Scenario | Block | Adaptation |
|----------|-------|-----------|
| Replace default widget with custom chat | `voice-chat-01` | Add signed URL auth, Marcela styling |
| Floating orb on all pages | `voice-chat-02` | Position fixed, theme colors, agent state |
| Admin conversation review | `speaker-01` | Load conversation audio from API |
| Voice-fill property assumptions | `voice-form-01` | Bind to assumption form fields |
| Live meeting notes | `realtime-transcriber-01` | Connect to Scribe v2 token endpoint |

## Adaptation Pattern

1. Install block with CLI
2. Move files to `client/src/components/` or `client/src/pages/`
3. Replace hardcoded agent IDs with signed URL flow
4. Apply Dark Glass / Light Cream theme
5. Wire to `useConversation` hook or widget
6. Add `data-testid` attributes per project convention
