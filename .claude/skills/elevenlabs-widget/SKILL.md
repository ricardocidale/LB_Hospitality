# ElevenLabs Conversational AI Widget

## Purpose
Marcela's web chat uses the ElevenLabs Conversational AI widget (`@elevenlabs/convai-widget-core`). It supports voice + text input with automatic language detection. The widget is a web component (`<elevenlabs-convai>`) rendered as a floating button.

## File Map
| File | Purpose |
|------|---------|
| `client/src/components/ElevenLabsWidget.tsx` | Widget component — fetches signed URL, renders `<elevenlabs-convai>` |
| `client/src/elevenlabs-convai.d.ts` | TypeScript JSX type declaration for the web component |
| `client/src/components/Layout.tsx` | `MarcelaWidgetGated` — gates widget on `showAiAssistant` + tour state |
| `server/routes/admin/marcela.ts` | `GET /api/marcela/signed-url` — generates signed conversation URL |
| `server/integrations/elevenlabs.ts` | `getElevenLabsApiKey()` — fetches API key via Replit Connector |

## Authentication Flow
1. Client calls `GET /api/marcela/signed-url` (requires auth)
2. Server reads `marcelaAgentId` from `global_assumptions`
3. Server calls ElevenLabs API: `GET /v1/convai/conversation/get-signed-url?agent_id=<ID>`
4. Server returns `{ signedUrl: "wss://..." }` to client
5. Client renders `<elevenlabs-convai url={signedUrl} />`

## Admin Configuration
- **DB field:** `marcelaAgentId` in `global_assumptions` table (text, default empty)
- **Admin UI:** Admin > Marcela tab > "ElevenLabs Conversational AI" card
- **Input:** Agent ID text field with link to ElevenLabs dashboard

## Gating Logic (`MarcelaWidgetGated` in Layout.tsx)
Widget shows when ALL conditions are true:
1. `showAiAssistant` is true (admin toggle)
2. `marcelaAgentId` is non-empty
3. Tour is not active (`!tourActive`)
4. Tour prompt is not visible (`!promptVisible`)

## Voice Configuration (on ElevenLabs dashboard, not in code)
| Language | Voice | Voice ID |
|----------|-------|----------|
| English | Jessica | `cgSgspJ2msm6clMCkdW9` |
| Portuguese | Sarah | `EXAVITQu4vr4xnSDxMaL` |
| Spanish | Configurable | Set on ElevenLabs dashboard |

Language detection is handled by the ElevenLabs agent configuration.

## Package
- `@elevenlabs/convai-widget-core` — web component, framework-agnostic

## How to Change the Agent
1. Go to Admin > Marcela tab
2. Update the Agent ID field
3. Click Save
4. The widget will use the new agent on next page load

## Relationship to Legacy Chat
The old custom chat (`client/src/components/ai-chat/`) with `useChat`/`useVoice` hooks is still in the codebase but no longer mounted in Layout. The ElevenLabs widget replaced it.
