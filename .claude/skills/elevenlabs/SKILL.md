# ElevenLabs Integration — Master Skill

This skill covers all ElevenLabs products used in the HBG portal: Conversational AI (Marcela), Text-to-Speech, Speech-to-Text, and the REST API.

## Quick Reference

| Resource | File |
|----------|------|
| Conversational AI (agents, widget, React SDK) | `conversational-ai.md` |
| Knowledge Base & RAG | `knowledge-base.md` |
| Client & Server Tools | `tools.md` |
| Authentication (signed URLs, allowlists) | `authentication.md` |
| REST API & TTS/STT | `api-reference.md` |
| Widget embed & customization | `widget.md` |
| Project-specific config (Marcela) | `marcela-config.md` |

## Architecture in This Project

```
Client (React)
  └── ElevenLabsWidget.tsx
        ├── Uses @elevenlabs/convai-widget-core (npm)
        ├── registerWidget() → defines <elevenlabs-convai> custom element
        ├── Renders <elevenlabs-convai agent-id="..."> with dynamic-variables
        └── Registers client tools via "elevenlabs-convai:call" event

Server (Express)
  └── server/marcela.ts
        ├── ElevenLabs connector (Replit integration) for API key
        ├── Agent configuration via REST API
        ├── Signed URL generation endpoint: GET /api/marcela/signed-url
        └── Knowledge base management
```

## Key IDs & Config (from DB `global_assumptions`)

| Setting | DB Column | Value |
|---------|-----------|-------|
| Agent ID | `marcela_agent_id` | `agent_6401kk0capntfansmn84f58yfrd9` |
| English Voice | `marcela_voice_id` | `cgSgspJ2msm6clMCkdW9` (Jessica) |
| Portuguese Voice | — | `EXAVITQu4vr4xnSDxMaL` (Sarah) |
| TTS Model | `marcela_tts_model` | `eleven_flash_v2_5` |
| STT Model | `marcela_stt_model` | `scribe_v1` |
| LLM Model | `marcela_llm_model` | `gpt-4.1` |

## Replit Integration

The ElevenLabs connector is installed at account level (`connection:conn_elevenlabs_01KG8V5TQDT93Q4HHB3B59RSAD`). When the connector is properly authorized:
- `getUncachableElevenLabsClient()` returns an authenticated ElevenLabs client
- The client handles API key management automatically
- Never cache the client — tokens expire

When the connector returns UNAUTHORIZED, the widget falls back to public `agent-id` mode (no signed URL).

## Invariants

- **All ElevenLabs config via API only** — never use the ElevenLabs dashboard manually
- **DB column names stay `marcela_*`** — only UI labels are dynamic (use `aiAgentName` from DB)
- **Agent name is configurable** via `aiAgentName` in `global_assumptions` (default: "Marcela")
