# ElevenLabs Voice Management

## Voice Types

| Type | Description |
|------|-------------|
| `premade` | ElevenLabs default voices |
| `cloned` | Instant voice clones from audio samples |
| `generated` | AI-generated voices from text description |
| `professional` | Professional voice clones (higher quality) |

## Listing Voices

### Get All Voices
```typescript
const voices = await client.voices.getAll({ showLegacy: false });

for (const voice of voices.voices) {
  console.log(`${voice.name} (${voice.voice_id}) — ${voice.category}`);
}
```

### Search Voices (Paginated)
```typescript
const result = await client.voices.search({
  search: "Jessica",
  pageSize: 10,
  voiceType: "premade",
  category: "premade",
  sort: "name",
  sortDirection: "asc",
});

for (const voice of result.voices) {
  console.log(voice.name, voice.voice_id);
}

if (result.has_more) {
  const next = await client.voices.search({
    nextPageToken: result.next_page_token,
  });
}
```

### Get Single Voice
```typescript
const voice = await client.voices.get("VOICE_ID");
console.log(voice.name, voice.labels, voice.settings);
```

## Popular Premade Voices

| Name | ID | Accent | Use Case |
|------|----|--------|----------|
| Rachel | `21m00Tcm4TlvDq8ikWAM` | American | Narration |
| Adam | `pNInz6obpgDQGcFmaJgB` | American | Narration |
| Jessica | `cgSgspJ2msm6clMCkdW9` | American | Conversational |
| Sarah | `EXAVITQu4vr4xnSDxMaL` | American | Soft, warm |
| Charlie | `IKne3meq5aSn9XLyUdCD` | Australian | Casual |
| George | `JBFqnCBsd6RMkjVDRZzb` | British | Narration |

## Voice Cloning

### Instant Clone
```typescript
const voice = await client.voices.add({
  name: "My Clone",
  files: [fs.createReadStream("sample1.mp3"), fs.createReadStream("sample2.mp3")],
  description: "Custom cloned voice",
  labels: { accent: "american", gender: "female" },
});
```

### Professional Clone
Professional clones require more samples and go through a verification process.

## Voice Settings

### Get Default Settings
```typescript
const settings = await client.voices.settings.getDefault();
```

### Update Voice Settings
```typescript
await client.voices.edit("VOICE_ID", {
  name: "Updated Name",
  settings: {
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.0,
    useSpeakerBoost: true,
  },
});
```

## Deleting Voices
```typescript
await client.voices.delete("VOICE_ID");
```

## Voice Labels

Voices can have custom labels for filtering:
```typescript
const voice = await client.voices.add({
  name: "My Voice",
  files: [audioFile],
  labels: {
    accent: "british",
    gender: "male",
    age: "middle-aged",
    use_case: "narration",
  },
});
```

## REST API

```bash
# List all voices
curl "https://api.elevenlabs.io/v1/voices" \
  -H "xi-api-key: YOUR_API_KEY"

# Get specific voice
curl "https://api.elevenlabs.io/v1/voices/VOICE_ID" \
  -H "xi-api-key: YOUR_API_KEY"

# Search voices
curl "https://api.elevenlabs.io/v1/voices/search?search=Jessica&page_size=10" \
  -H "xi-api-key: YOUR_API_KEY"
```
