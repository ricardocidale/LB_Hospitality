---
name: ai-agent-admin
description: Admin > AI Agent tab architecture. 7-tab dashboard for managing the AI assistant (ElevenLabs Conversational AI, Twilio telephony, RAG knowledge base).
status: CREATED (March 6, 2026)
---

# AI Agent Admin Tab

## Purpose
Documents the Admin > AI Agent tab — a comprehensive dashboard for managing the AI assistant (configurable name, default "Marcela") across all channels. The tab provides a "mini ElevenLabs" experience where all ElevenLabs configuration happens via API, not the ElevenLabs dashboard.

## Design Principle
All ElevenLabs configuration is done via API calls from this admin tab. The ElevenLabs dashboard is never used directly. This gives the admin full control from within the portal.

## Architecture

### Tab Navigation
7 horizontal tabs within the AI Agent admin section:

```
General | Prompt | Voice & Audio | LLM | Tools | Knowledge Base | Telephony
```

### Component Map
| Tab | Component | File | Draft/Save Pattern |
|-----|-----------|------|-------------------|
| General | Inline in MarcelaTab | `MarcelaTab.tsx` | Uses parent draft state |
| Prompt | `PromptEditor` | `PromptEditor.tsx` | Independent — saves directly to ElevenLabs |
| Voice | `VoiceSettings` | `VoiceSettings.tsx` | Uses parent draft state |
| LLM | `LLMSettings` | `LLMSettings.tsx` | Uses parent draft state |
| Tools | `ToolsStatus` | `ToolsStatus.tsx` | Read-only + sync action |
| KB | `KnowledgeBase` | `KnowledgeBase.tsx` | Independent actions (reindex, push, upload) |
| Telephony | `TelephonySettings` | `TelephonySettings.tsx` | Uses parent draft state |

### Prop Interface
All sub-components receive:
```typescript
interface SubComponentProps {
  draft: GlobalAssumptions;
  setDraft: (fn: (prev: Draft) => Draft) => void;
  agentName: string;  // Dynamic name from draft.aiAgentName
}
```

PromptEditor, ToolsStatus, and KnowledgeBase only need `agentName`:
```typescript
interface IndependentProps {
  agentName: string;
}
```

## API Endpoints

### Admin Proxy Routes (`server/routes/admin/marcela.ts`)
| Method | Route | Purpose | Body |
|--------|-------|---------|------|
| `GET` | `/api/marcela/signed-url` | Generate signed URL for widget | - |
| `GET` | `/api/admin/convai/agent` | Get full agent config from ElevenLabs | - |
| `PATCH` | `/api/admin/convai/agent/prompt` | Save prompt, first message, language | `{ prompt, first_message, language }` |
| `GET` | `/api/admin/convai/tools-status` | Get all configured tools from agent | - |
| `POST` | `/api/admin/convai/knowledge-base/upload-file` | Upload file to ElevenLabs KB | `multipart/form-data: file` |
| `POST` | `/api/admin/marcela/reindex` | Rebuild RAG index from app data | - |
| `POST` | `/api/admin/marcela/push-to-elevenlabs` | Push RAG KB text to ElevenLabs | - |
| `POST` | `/api/admin/marcela/configure-tools` | Sync all tools to ElevenLabs agent | - |

### Standard Admin Settings
Settings are saved via the global assumptions endpoint:
| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/global-assumptions` | Save all draft settings (voice, LLM, telephony, agent name) |

## React Query Hooks (`hooks.ts`)

### Data Fetching
| Hook | Query Key | Endpoint |
|------|-----------|----------|
| `useConvaiAgent` | `["convai-agent"]` | `GET /api/admin/convai/agent` |
| `useConvaiToolsStatus` | `["convai-tools-status"]` | `GET /api/admin/convai/tools-status` |

### Mutations
| Hook | Endpoint | Invalidates |
|------|----------|------------|
| `useSaveAgentPrompt` | `PATCH /api/admin/convai/agent/prompt` | `["convai-agent"]` |
| `useReindexKnowledgeBase` | `POST /api/admin/marcela/reindex` | - |
| `usePushKnowledgeBase` | `POST /api/admin/marcela/push-to-elevenlabs` | - |
| `useConfigureTools` | `POST /api/admin/marcela/configure-tools` | `["convai-tools-status"]` |
| `useUploadKBFile` | `POST /api/admin/convai/knowledge-base/upload-file` | `["convai-agent"]` |

### File Upload Pattern
`useUploadKBFile` uses raw `fetch` with `FormData` instead of `apiRequest` because `apiRequest` sets `Content-Type: application/json`. The browser must set `multipart/form-data` boundary automatically.

```typescript
const formData = new FormData();
formData.append("file", file);
const res = await fetch("/api/admin/convai/knowledge-base/upload-file", {
  method: "POST",
  credentials: "include",
  body: formData,
});
```

## Agent Name Configuration
- DB field: `global_assumptions.aiAgentName` (default: "Marcela")
- Constant: `DEFAULT_AI_AGENT_NAME` in `shared/constants.ts`
- All UI labels use `agentName` prop: `{agentName} System Prompt`, `{agentName} Tools`, etc.
- Internal DB columns keep `marcela_*` naming for migration safety

## Tools (18 total)

### Client Tools (12) — Registered in `ElevenLabsWidget.tsx`
Navigation tools (navigateToPage, showPropertyDetails, openPropertyEditor, showPortfolio, showAnalysis, showDashboard, showScenarios, openPropertyFinder, showCompanyPage, openHelp), startGuidedTour, getCurrentContext

### Server Tools (6) — Webhook endpoints in `server/routes/marcela-tools.ts`
getProperties, getPropertyDetails, getPortfolioSummary, getScenarios, getGlobalAssumptions, getNavigation

## Knowledge Base Pipeline
1. **Reindex** → Rebuilds in-memory RAG embeddings from properties, assumptions, research
2. **Push to ElevenLabs** → Serializes RAG content as text, uploads to ElevenLabs KB via API
3. **Upload File** → Sends additional documents (PDF, TXT, etc.) to ElevenLabs KB via multipart upload

## Key Design Decisions
- **No ElevenLabs dashboard usage**: All config via API proxy routes
- **Draft/save pattern**: Voice, LLM, Telephony share parent draft state; Prompt and KB operate independently
- **File upload via multer**: Server-side middleware handles multipart form data
- **Agent ID in DB**: `marcelaAgentId` stored in `global_assumptions`, not env var
