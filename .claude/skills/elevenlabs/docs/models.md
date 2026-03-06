# ElevenLabs Models Reference

## List Models via API

```typescript
const models = await client.models.list();
for (const model of models) {
  console.log(`${model.name} (${model.model_id})`);
  console.log(`  TTS: ${model.can_do_text_to_speech}`);
  console.log(`  Languages: ${model.languages?.length}`);
}
```

## TTS Models

| Model | ID | Latency | Languages | Price | Notes |
|-------|-----|---------|-----------|-------|-------|
| Flash v2.5 | `eleven_flash_v2_5` | ~75ms | 32 | 50% cheaper | Best for real-time |
| Multilingual v2 | `eleven_multilingual_v2` | ~200ms | 29 | Standard | Highest quality |
| Turbo v2.5 | `eleven_turbo_v2_5` | ~100ms | 32 | Standard | Balance |
| English v1 | `eleven_monolingual_v1` | ~100ms | 1 | Standard | Legacy |
| English v2 | `eleven_english_v2` | ~100ms | 1 | Standard | Legacy |

### For Conversational AI Agents

Agents typically use **Flash v2.5** for lowest latency. The model is configured in the agent's TTS settings.

## STT Models

| Model | ID | Description |
|-------|-----|-------------|
| Scribe v1 | `scribe_v1` | Standard transcription |
| Scribe v2 | `scribe_v2` | Improved accuracy, diarization, audio events |

## LLM Models (Conversational AI)

Agents can use various LLMs. Configure in agent settings:

| Provider | Models |
|----------|--------|
| OpenAI | `gpt-4.1`, `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo` |
| Anthropic | `claude-sonnet-4-20250514`, `claude-3.5-sonnet` |
| Google | `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-pro` |
| Groq | `llama-3.3-70b`, `llama-3.1-8b` |
| Custom | Any OpenAI-compatible endpoint |

## Supported Languages (Multilingual v2)

English, Chinese, Spanish, Hindi, Portuguese, French, German, Japanese, Arabic, Korean, Indonesian, Italian, Dutch, Turkish, Polish, Swedish, Filipino, Malay, Romanian, Ukrainian, Greek, Czech, Danish, Finnish, Bulgarian, Croatian, Slovak, Tamil

## Supported Languages (Flash v2.5 / Turbo v2.5)

All of the above plus: Norwegian, Hungarian, Vietnamese, Hebrew, Thai, Lithuanian, Latvian
