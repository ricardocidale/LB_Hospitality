# ElevenLabs Integration Library

Comprehensive library of documentation, helper functions, scripts, and examples for all ElevenLabs products.

## Directory Structure

```
.claude/skills/elevenlabs/
├── SKILL.md                              ← You are here
├── marcela-config.md                     Project-specific Marcela config
│
├── docs/                                 Reference documentation
│   ├── overview.md                       Platform overview, packages, repos
│   ├── models.md                         TTS, STT, and LLM models reference
│   ├── text-to-speech.md                 TTS: convert, stream, timestamps, formats
│   ├── speech-to-text.md                 STT: Scribe models, diarization, events
│   ├── voices.md                         Voice management: list, clone, settings
│   ├── conversational-ai.md             Agent lifecycle: create, update, deploy
│   ├── react-sdk.md                      @elevenlabs/react — useConversation hook
│   ├── client-sdk.md                     @elevenlabs/client — vanilla JS/TS SDK
│   ├── widget.md                         Web component embed & customization
│   ├── authentication.md                 API keys, signed URLs, conversation tokens
│   ├── knowledge-base.md                 RAG, documents, indexing
│   ├── tools.md                          Client, server, MCP, system tools
│   ├── phone-numbers.md                  Phone number management, batch calls
│   ├── twilio.md                         Twilio voice integration
│   ├── whatsapp.md                       WhatsApp messaging & calls
│   ├── webhooks.md                       Webhook types, security, handlers
│   ├── agent-design.md                   ★ Agent design best practices & architecture
│   ├── prompting-guide.md               ★ Prompt engineering for agents
│   ├── prompt-templates.md              ★ Ready-to-use prompt templates (7 use cases)
│   ├── multi-agent.md                   ★ Multi-agent transfers & orchestration patterns
│   ├── guardrails.md                    ★ Safety, manipulation detection, custom rules
│   ├── agent-workflows.md              ★ Visual workflow builder & node types
│   └── ui-components.md               ★ ElevenLabs UI component library (shadcn-based)
│
├── ui/                                  ★ UI component implementation skills (14 files)
│   ├── SKILL.md                         Component library overview & installation
│   ├── orb.md                           3D animated orb (Three.js, audio-reactive)
│   ├── conversation.md                  Scrolling chat container (auto-scroll)
│   ├── message.md                       User/assistant message bubbles
│   ├── conversation-bar.md             Hybrid text + voice input bar
│   ├── voice-button.md                 Microphone toggle button
│   ├── voice-picker.md                 Searchable voice selector dropdown
│   ├── mic-selector.md                 Microphone device selector
│   ├── waveform.md                     Waveform, scrubber, mic, live, bar visualizer
│   ├── speech-input.md                 Real-time STT input (Scribe v2)
│   ├── audio-player.md                 Audio playback + scrub bar
│   ├── response.md                     Streaming markdown renderer (Streamdown)
│   ├── effects.md                      ShimmeringText + Matrix visual effects
│   └── blocks.md                       Pre-built full-page templates (9 blocks)
│
├── helpers/                              Reusable TypeScript utility functions
│   ├── index.ts                          Barrel export
│   ├── types.ts                          Shared TypeScript types & interfaces
│   ├── client.ts                         Client initialization & connection test
│   ├── signed-url.ts                     Signed URL & conversation token generation
│   ├── tts.ts                            Text-to-speech: convert, stream, Twilio format
│   ├── stt.ts                            Speech-to-text: transcribe, diarize, format
│   ├── agent.ts                          Agent CRUD: create, update, delete, list
│   ├── knowledge-base.ts                 KB documents: create, sync, attach to agent
│   ├── conversations.ts                  Conversation listing, stats, transcript format
│   ├── voices.ts                         Voice search, list, find by name
│   ├── phone-numbers.ts                  Phone numbers: register, assign, batch calls
│   ├── webhooks.ts                       Webhook signature verification & handlers
│   └── multi-agent.ts                   ★ Multi-agent system builder & orchestrator helpers
│
├── scripts/                              Standalone admin/utility scripts
│   ├── list-agents.ts                    List all agents
│   ├── list-voices.ts                    List/search available voices
│   ├── list-conversations.ts            List recent conversations for an agent
│   ├── get-agent-config.ts              Dump full agent configuration as JSON
│   ├── update-agent.ts                  Update agent settings (prompt, voice, etc.)
│   ├── generate-signed-url.ts           Generate a signed URL for testing
│   ├── sync-knowledge-base.ts           Sync a text file to agent's knowledge base
│   ├── test-tts.ts                      Generate TTS audio and save to file
│   └── usage-report.ts                  Account usage metrics report
│
└── examples/                             Complete code examples
    ├── react-conversation.tsx            Full React conversation UI component
    ├── widget-embed.tsx                  Widget web component for React apps
    ├── server-routes.ts                  Express API routes (signed URL, TTS, STT, webhooks)
    ├── client-tools-patterns.ts         Common client tool patterns (nav, UI, data, e-commerce)
    ├── knowledge-base-sync.ts           KB sync workflow with periodic updates
    └── multi-agent-system.ts            ★ Complete multi-agent setup (hotel & support examples)
```

★ = New in this update (agent design, prompting, multi-agent)

## Quick Start

### 1. Install Packages

**Server-side (Node.js API):**
```bash
npm install elevenlabs
```

**Client-side (React):**
```bash
npm install @elevenlabs/react
```

**Client-side (Widget in React):**
```bash
npm install @elevenlabs/convai-widget-core
```

### 2. Initialize Client
```typescript
import { ElevenLabsClient } from "elevenlabs";
const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
```

### 3. Use Helpers
```typescript
import { createClient, textToSpeech, listAgents, generateSignedUrl } from "./helpers";
import { createMultiAgentSystem, generateOrchestratorPrompt } from "./helpers";
```

### 4. Run Scripts
```bash
ELEVENLABS_API_KEY=xxx npx ts-node .claude/skills/elevenlabs/scripts/list-agents.ts
ELEVENLABS_API_KEY=xxx npx ts-node .claude/skills/elevenlabs/scripts/list-voices.ts jessica
ELEVENLABS_API_KEY=xxx npx ts-node .claude/skills/elevenlabs/scripts/usage-report.ts 30
```

## Package Selection Guide

| Scenario | Package | Doc |
|----------|---------|-----|
| Node.js server (TTS, STT, agent management) | `elevenlabs` | `docs/overview.md` |
| React app with full agent control | `@elevenlabs/react` | `docs/react-sdk.md` |
| React app with drop-in widget | `@elevenlabs/convai-widget-core` | `docs/widget.md` |
| Vanilla JS/TS browser app | `@elevenlabs/client` | `docs/client-sdk.md` |
| Simple HTML page | `@elevenlabs/convai-widget-embed` (CDN) | `docs/widget.md` |
| React Native mobile app | `@elevenlabs/react-native` | `docs/overview.md` |
| Pre-built UI components (shadcn) | `@elevenlabs/cli` (source install) | `docs/ui-components.md` |

## Agent Design Quick Reference

### Architecture Patterns

| Pattern | When to Use | Doc |
|---------|-------------|-----|
| Single agent | Simple Q&A, FAQ, single domain | `docs/agent-design.md` |
| Orchestrator + specialists | Multi-domain (billing, support, sales) | `docs/multi-agent.md` |
| Chain topology | Sequential workflows (qualify → book → confirm) | `docs/multi-agent.md` |
| Hub + sub-specialists | Deep domain expertise with tiers | `docs/multi-agent.md` |
| Visual workflows | Complex branching within one agent | `docs/agent-workflows.md` |

### Prompt Engineering

| Topic | Doc |
|-------|-----|
| Core principles (sections, conciseness, emphasis) | `docs/prompting-guide.md` |
| Dynamic variables and overrides | `docs/prompting-guide.md` |
| Tool descriptions in prompts | `docs/prompting-guide.md` |
| Voice-specific tips | `docs/prompting-guide.md` |
| Ready-to-use templates (7 use cases) | `docs/prompt-templates.md` |

### Available Templates

| Template | Use Case | Doc |
|----------|----------|-----|
| Customer Support Agent | Order lookup, refunds, account help | `docs/prompt-templates.md` |
| Sales / Booking Agent | Product discovery, reservation | `docs/prompt-templates.md` |
| Orchestrator / Router | Intent classification, routing | `docs/prompt-templates.md` |
| Knowledge Base Q&A | Documentation-backed answers | `docs/prompt-templates.md` |
| Appointment Scheduling | Calendar booking and management | `docs/prompt-templates.md` |
| Multilingual Concierge | Multi-language hospitality service | `docs/prompt-templates.md` |
| Technical Troubleshooting | Step-by-step issue resolution | `docs/prompt-templates.md` |

### Safety & Guardrails

| Feature | Purpose | Doc |
|---------|---------|-----|
| System prompt `# Guardrails` section | Primary behavioral rules | `docs/guardrails.md` |
| Focus Guardrail | Prevent drift in long conversations | `docs/guardrails.md` |
| Manipulation Detection | Block prompt injection | `docs/guardrails.md` |
| Content Filtering | Prevent inappropriate content | `docs/guardrails.md` |
| Custom Guardrails | Business-specific policy enforcement | `docs/guardrails.md` |

## GitHub Repositories

| Repo | Purpose |
|------|---------|
| [elevenlabs-js](https://github.com/elevenlabs/elevenlabs-js) | Node.js server SDK |
| [packages](https://github.com/elevenlabs/packages) | React/client SDKs + widget |
| [elevenlabs-python](https://github.com/elevenlabs/elevenlabs-python) | Python SDK + `reference.md` |
| [ui](https://github.com/elevenlabs/ui) | UI component library |
| [elevenlabs-examples](https://github.com/elevenlabs/elevenlabs-examples) | Demo applications |

## Key Concepts

### Authentication Flow
1. Server stores API key securely (env var)
2. Client requests signed URL or conversation token from server
3. Client connects to agent using signed URL (expires 15 min)
4. See `docs/authentication.md` for full patterns

### Agent Deployment
1. Create agent via API or dashboard
2. Choose deployment method: React SDK, Widget, Phone, WhatsApp
3. Configure authentication (public vs private)
4. Register client tools for app integration
5. Attach knowledge base documents for domain expertise

### Multi-Agent Deployment
1. Create specialist agents first (each with focused prompt + tools)
2. Create orchestrator agent with `transfer_to_agent` system tool
3. Define transfer conditions (natural language) for each specialist
4. Add `transfer_to_number` for human escalation fallback
5. Use `gpt-4o` or `gpt-4o-mini` for reliable tool calling
6. See `docs/multi-agent.md` for architecture patterns

### Tool Architecture
- **Client tools** — run in browser (navigation, UI, context)
- **Server tools** — run on your server via webhook (DB, APIs)
- **MCP tools** — connect MCP servers for extended capabilities
- **System tools** — built-in (end call, transfer agent, detect language, skip turn, transfer to number, DTMF, voicemail)
