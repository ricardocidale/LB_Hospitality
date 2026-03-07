---
name: ai-agent-admin
description: AI Agent feature module structure after Phase 1-5 reorganization. Source-of-truth paths for hooks, types, components, and ElevenLabsWidget.
---

# AI Agent — Feature Module Structure

The AI Agent code is organized as a self-contained feature module:

```
client/src/features/ai-agent/
├── ElevenLabsWidget.tsx          ← Main widget (lazy-loads heavy components)
├── types.ts                      ← VoiceSettings, TwilioStatus, TTS_MODELS, LLM_MODELS, etc.
├── hooks/
│   ├── index.ts                  ← Barrel re-exporting all hooks
│   ├── use-agent-settings.ts     ← useMarcelaSettings, useSaveMarcelaSettings, useTwilioStatus, useSendTestSms
│   ├── use-convai-api.ts         ← useAgentConfig, useSaveAgentPrompt, useSaveAgentLlm, useSaveAgentVoice, useSaveWidgetSettings
│   ├── use-knowledge-base.ts     ← useKnowledgeBaseStatus, useReindexKnowledgeBase, useUploadKnowledgeBase, useUploadKBFile, useRemoveKBDocument
│   ├── use-conversations.ts      ← useConversations, useConversation(id)
│   └── use-signed-url.ts         ← useAdminSignedUrl (staleTime 10 min)
└── components/
    ├── index.ts                  ← Barrel (note: import Orb directly from ./orb — AgentState collision)
    ├── audio-player.tsx
    ├── bar-visualizer.tsx        ← exports AgentState (different from orb's AgentState)
    ├── conversation.tsx
    ├── conversation-bar.tsx      ← WebRTC via @elevenlabs/react useConversation()
    ├── live-waveform.tsx
    ├── matrix.tsx
    ├── message.tsx
    ├── mic-selector.tsx
    ├── orb.tsx                   ← exports AgentState (null|"thinking"|"listening"|"talking")
    ├── response.tsx
    ├── scrub-bar.tsx
    ├── shimmering-text.tsx
    ├── speech-input.tsx
    ├── transcript-viewer.tsx
    ├── voice-button.tsx
    ├── voice-picker.tsx
    └── waveform.tsx
```

## Re-export Barrels (backward compat — do not add logic)

These files delegate to the feature module. Existing imports continue to work unchanged:

| Original path | Now delegates to |
|---------------|-----------------|
| `client/src/components/ElevenLabsWidget.tsx` | `features/ai-agent/ElevenLabsWidget.tsx` |
| `client/src/components/admin/marcela/hooks.ts` | `features/ai-agent/hooks/` |
| `client/src/components/admin/marcela/types.ts` | `features/ai-agent/types.ts` (relative path for vitest) |
| `client/src/components/ui/orb.tsx` | `features/ai-agent/components/orb.tsx` |
| `client/src/components/ui/bar-visualizer.tsx` | `features/ai-agent/components/bar-visualizer.tsx` |
| `client/src/components/ui/<any elevenlabs>.tsx` | `features/ai-agent/components/<name>.tsx` |

## Admin Sub-Components (unchanged location)

The Marcela admin tab components remain in `client/src/components/admin/marcela/`:

| File | Purpose |
|------|---------|
| `MarcelaTab.tsx` | 7-tab shell (General, Prompt, Voice, LLM, Tools, KB, Telephony) |
| `PromptEditor.tsx` | System prompt, first message, language |
| `VoiceSettings.tsx` | TTS/STT model settings, widget variant picker (6 options) |
| `LLMSettings.tsx` | LLM model + token limits |
| `ToolsStatus.tsx` | 18-tool status display + sync button |
| `KnowledgeBase.tsx` | RAG reindex, ElevenLabs KB push, file upload |
| `TelephonySettings.tsx` | Twilio phone/SMS config |
| `ConversationHistory.tsx` | Transcript viewer with Message/Conversation components |
| `hooks.ts` | Re-export barrel → `features/ai-agent/hooks/` |
| `types.ts` | Re-export barrel → `features/ai-agent/types.ts` |

## Key Import Patterns

```tsx
// Hooks — import from either path (barrel handles delegation)
import { useMarcelaSettings, useSaveMarcelaSettings } from "@/features/ai-agent/hooks";
import { useAgentConfig, useSaveAgentPrompt } from "@/features/ai-agent/hooks";

// Types — same
import type { VoiceSettings, TTS_MODELS } from "@/features/ai-agent/types";

// Components — use @/components/ui/ for normal use (barrel handles it)
import { Orb } from "@/components/ui/orb";
import { BarVisualizer } from "@/components/ui/bar-visualizer";

// OR import directly from feature module
import { Orb } from "@/features/ai-agent/components/orb";

// Widget
import ElevenLabsWidget from "@/components/ElevenLabsWidget"; // barrel → feature module
```

## AgentState Collision

Both `bar-visualizer.tsx` and `orb.tsx` export `AgentState` with different union types:
- `orb.tsx`: `null | "thinking" | "listening" | "talking"`
- `bar-visualizer.tsx`: `"connecting" | "initializing" | "listening" | "speaking" | "thinking"`

The barrel `components/index.ts` exports `Orb` explicitly and omits `orb`'s `AgentState` to avoid conflict. Import `AgentState` directly from the specific component file you need.

## Widget Variants

Six variants selectable in Admin > AI Agent > Voice > Widget Settings:

| Variant value | Visual | Notes |
|---------------|--------|-------|
| `tiny` | Icon-only floating button | Native ElevenLabs web component |
| `compact` | Icon + label (default) | Native ElevenLabs web component |
| `full` | Expanded chat panel | Native ElevenLabs web component |
| `orb` | 3D animated sphere | Custom `Orb` + hidden `elevenlabs-convai tiny` |
| `bars` | Frequency bar visualizer | Custom `BarVisualizer` + hidden `elevenlabs-convai tiny` |
| `matrix` | LED pixel grid | Custom `Matrix` + hidden `elevenlabs-convai tiny` |
| `conversation-bar` | Full voice+text bar | Custom `ConversationBar` (WebRTC, agentId only) |
