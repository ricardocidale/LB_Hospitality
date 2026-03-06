# Voice Picker Component

Searchable voice selector dropdown with audio preview, orb visualization, and ElevenLabs voice integration.

## Install

```bash
npx @elevenlabs/cli@latest components add voice-picker
```

### Peer Dependencies
- Orb component (for voice preview orb)

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `voices` | `ElevenLabs.Voice[]` | — | Array of voice objects from ElevenLabs API |
| `value` | `string` | — | Currently selected voice ID |
| `onValueChange` | `(value: string) => void` | — | Called when selection changes |
| `open` | `boolean` | — | Controls dropdown open state |
| `onOpenChange` | `(open: boolean) => void` | — | Called when open state changes |
| `placeholder` | `string` | `"Select a voice..."` | Placeholder text |

## Voice Object Shape

```typescript
interface Voice {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  preview_url: string;
  description?: string;
}
```

## Usage

### Basic Voice Selector
```tsx
import { VoicePicker } from "@/components/ui/elevenlabs/voice-picker";

function VoiceSelector({ voices }: { voices: ElevenLabs.Voice[] }) {
  const [selectedVoice, setSelectedVoice] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <VoicePicker
      voices={voices}
      value={selectedVoice}
      onValueChange={setSelectedVoice}
      open={open}
      onOpenChange={setOpen}
      placeholder="Choose a voice for Marcela..."
    />
  );
}
```

### With API Data
```tsx
function AdminVoiceSelector() {
  const [voices, setVoices] = useState<ElevenLabs.Voice[]>([]);

  useEffect(() => {
    fetch("/api/admin/marcela/voices")
      .then(r => r.json())
      .then(setVoices);
  }, []);

  return (
    <VoicePicker
      voices={voices}
      value={currentVoiceId}
      onValueChange={(id) => updateMarcelaVoice(id)}
    />
  );
}
```

## Features

- Searchable voice list with text filter
- Audio preview playback for each voice
- Orb animation during voice preview
- Voice metadata display (name, category, labels)
- Keyboard navigation

## Marcela Use Cases

- Admin AI Agent tab: voice selection for Marcela
- Per-language voice assignment
- Voice A/B testing

## Vite Adaptation

1. Copy source to `client/src/components/ui/elevenlabs/voice-picker.tsx`
2. Requires Orb component to be installed first
3. Fix `@/` imports
