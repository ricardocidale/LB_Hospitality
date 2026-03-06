# Speech Input & Transcript Viewer Components

Real-time speech-to-text input using ElevenLabs Scribe v2. Voice-fill form fields, search bars, or text areas with live transcription.

## Install

```bash
npx @elevenlabs/cli@latest components add speech-input
npx @elevenlabs/cli@latest components add transcript-viewer
```

### Peer Dependencies
- `@elevenlabs/react` (for Scribe WebSocket)

## Speech Input

### Subcomponents

| Component | Purpose |
|-----------|---------|
| `SpeechInput` | Root — manages Scribe connection |
| `SpeechInputRecordButton` | Mic toggle (start/stop recording) |
| `SpeechInputPreview` | Live transcription display |

### Props

#### SpeechInput (Root)
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `getToken` | `() => Promise<string>` | — | Fetch Scribe auth token |
| `onChange` | `(data: TranscriptData) => void` | — | Called on transcript update |
| `modelId` | `string` | `"scribe_v2_realtime"` | Scribe model |
| `languageCode` | `string` | `"en"` | ISO language code |
| `commitStrategy` | `"manual" \| "vad"` | `"vad"` | When to finalize segments |
| `onError` | `(error: Error) => void` | — | Error handler |

#### SpeechInputPreview
| Prop | Type | Description |
|------|------|-------------|
| `placeholder` | `string` | Text shown before recording |

### TranscriptData Shape
```typescript
interface TranscriptData {
  text: string;
  isFinal: boolean;
  confidence: number;
}
```

### Usage

#### Voice-Fill a Form Field
```tsx
import {
  SpeechInput,
  SpeechInputRecordButton,
  SpeechInputPreview
} from "@/components/ui/elevenlabs/speech-input";

function VoiceField({ label, value, onChange }) {
  const getToken = async () => {
    const res = await fetch("/api/scribe/token");
    const data = await res.json();
    return data.token;
  };

  return (
    <div>
      <label>{label}</label>
      <SpeechInput
        getToken={getToken}
        onChange={(data) => onChange(data.text)}
        modelId="scribe_v2_realtime"
        languageCode="en"
      >
        <div className="flex items-center gap-2">
          <SpeechInputPreview placeholder="Speak to fill..." />
          <SpeechInputRecordButton />
        </div>
      </SpeechInput>
    </div>
  );
}
```

#### Search Bar with Voice
```tsx
function VoiceSearch() {
  const [query, setQuery] = useState("");

  return (
    <SpeechInput
      getToken={getScribeToken}
      onChange={(data) => setQuery(data.text)}
      languageCode="en"
    >
      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search properties..."
          className="w-full pr-10"
        />
        <SpeechInputRecordButton className="absolute right-2 top-1/2 -translate-y-1/2" />
      </div>
    </SpeechInput>
  );
}
```

### Server Token Endpoint
```typescript
app.get("/api/scribe/token", requireAuth, async (req, res) => {
  const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
  const token = await client.speechToText.getToken();
  res.json({ token });
});
```

## Transcript Viewer

Word-by-word (character-level) highlighting synchronized to audio playback. Composable subcomponents for full control.

### Subcomponents

| Component | Purpose |
|-----------|---------|
| `TranscriptViewerContainer` | Root — manages audio and alignment state |
| `TranscriptViewerAudio` | Internal audio element |
| `TranscriptViewerPlayPauseButton` | Play/pause toggle |
| `TranscriptViewerScrubBar` | Playback scrub bar |
| `TranscriptViewerWords` | Word-by-word display with active highlighting |

### TranscriptViewerContainer Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `audioSrc` | `string` | — | Source URL of the audio file |
| `audioType` | `string` | `"audio/mpeg"` | MIME type of the audio file |
| `alignment` | `CharacterAlignmentResponseModel` | — | Character-level timing data |

### Alignment Data Shape
```typescript
interface CharacterAlignmentResponseModel {
  characters: string[];
  characterStartTimesSeconds: number[];
  characterEndTimesSeconds: number[];
}
```

### Usage
```tsx
import {
  TranscriptViewerContainer,
  TranscriptViewerAudio,
  TranscriptViewerPlayPauseButton,
  TranscriptViewerScrubBar,
  TranscriptViewerWords,
} from "@/components/ui/elevenlabs/transcript-viewer";

<TranscriptViewerContainer audioSrc="/audio/conversation.mp3" alignment={alignmentData}>
  <TranscriptViewerAudio />
  <div className="flex items-center gap-2">
    <TranscriptViewerPlayPauseButton />
    <TranscriptViewerScrubBar />
  </div>
  <TranscriptViewerWords />
</TranscriptViewerContainer>
```

## Marcela Use Cases

| Feature | Implementation |
|---------|---------------|
| Voice search for properties | SpeechInput in property finder search bar |
| Voice notes on properties | SpeechInput in property detail notes |
| Conversation transcript sync | TranscriptViewer with `onAudioAlignment` data |
| Voice-fill assumption forms | SpeechInput in company assumptions fields |

## Languages Supported

Scribe v2 supports 99 languages. Key for this project:
- `en` — English
- `pt` — Portuguese
- `es` — Spanish

## Vite Adaptation

1. `npm install @elevenlabs/react` (if not already installed)
2. Copy source to `client/src/components/ui/elevenlabs/speech-input.tsx`
3. Copy source to `client/src/components/ui/elevenlabs/transcript-viewer.tsx`
4. Fix `@/` imports
5. Create `/api/scribe/token` endpoint on server
