---
name: marcela-ai-system
description: The AI agent architecture and research pipeline. Covers Marcela's role, voice interaction via ElevenLabs Convai, dual-channel tool system, knowledge base, market research workflow, ICP-driven research, and admin configuration. Use this skill when working on AI features, research, voice interaction, or knowledge base management.
---

# Marcela AI System

This skill documents the AI agent architecture powering the HBG Portal's intelligent assistant and research capabilities.

**Related skills:** `integrations-infrastructure` (AI providers and services), `hbg-business-model` (business domain Marcela must understand), `financial-engine` (calculations Marcela must never approximate), `verification-system` (verification results Marcela narrates), `api-backend-contract` (API endpoints for tools)

---

## Marcela's Role

Marcela is a **hospitality finance specialist AI** that assists users with:
- Portal navigation and contextual guidance
- Data retrieval and portfolio analysis
- Financial research and market intelligence
- Verification result narration

**Critical boundary:** Marcela is **NOT a calculator**. She must never compute financial values herself. For any calculation, she calls deterministic engine tools that produce exact results. See the `financial-engine` skill for why this matters.

---

## Architecture

### Voice-First Interaction
Built on **ElevenLabs Convai** for voice-to-voice interaction:
- Real-time WebSocket streaming for audio
- Speech-to-Text (STT) → LLM processing → Text-to-Speech (TTS) pipeline
- Low-latency conversational experience

### Configurable LLM Backend
| Provider | Model | Use Case |
|----------|-------|----------|
| Google Gemini | 2.0 Flash | Default LLM via ElevenLabs Convai |
| Anthropic Claude | 3.5 Sonnet | Research tasks (primary researcher) |
| OpenAI | GPT-4 | General AI fallback |

The active provider is configurable via the admin panel.

---

## Dual-Channel Tool System

Marcela operates through two channels of tools:

### Client-Side Tools (UI Interaction)
These execute directly in the browser to control the portal UI:

| Tool | Purpose |
|------|---------|
| `navigateToPage` | Navigate to a specific portal page |
| `showPropertyDetails` | Open property detail view |
| `openPropertyEditor` | Open property edit form |
| `showPortfolio` | Navigate to portfolio/map view |
| `showAnalysis` | Navigate to financial analysis |
| `showDashboard` | Navigate to main dashboard |
| `startGuidedTour` | Launch interactive walkthrough |
| `openHelp` | Open help documentation |
| `showScenarios` | Navigate to scenarios page |
| `openPropertyFinder` | Open property acquisition search |
| `showCompanyPage` | Navigate to company financials |
| `getCurrentContext` | Get current page, user name, and role |

### Server-Side Webhook Tools (Data Retrieval)
These call the server API to fetch live data:

| Tool | Endpoint | Purpose |
|------|----------|---------|
| `getProperties` | `/api/marcela-tools/properties` | List all properties with key metrics |
| `getPropertyDetails` | `/api/marcela-tools/property/{id}` | Detailed financials for one property |
| `getPortfolioSummary` | `/api/marcela-tools/portfolio-summary` | Aggregated portfolio metrics |
| `getScenarios` | `/api/marcela-tools/scenarios` | List saved scenarios |
| `getGlobalAssumptions` | `/api/marcela-tools/global-assumptions` | Company-wide financial assumptions |
| `getNavigation` | `/api/marcela-tools/navigation` | Available pages with descriptions |

All server tools are authenticated via `MARCELA_TOOLS_SECRET` header.

---

## Knowledge Base Architecture

### Static Knowledge Base
Markdown reference documents covering 18+ hospitality finance topics, stored in `server/ai/kb/`:

| File | Topic |
|------|-------|
| `01-about.md` | About HBG and the portal |
| `02-portal.md` | Portal features and capabilities |
| `03-navigation.md` | Navigation guide |
| `04-property-finance.md` | Property financing concepts |
| `05-revenue.md` | Revenue streams and modeling |
| `06-expenses.md` | Expense categories (USALI) |
| `07-metrics.md` | Key financial metrics |
| `08-capital.md` | Capital structure and funding |
| `09-business-rules.md` | Business rules and gates |
| `10-statements.md` | Financial statement structure |
| `11-depreciation.md` | Depreciation methods |
| `12-accounting.md` | Accounting standards |
| `13-research.md` | Research capabilities |
| `14-howto.md` | How-to guides |
| `15-about-marcela.md` | Marcela's persona and capabilities |
| `16-roles.md` | User roles and permissions |
| `17-sensitivity.md` | Sensitivity analysis |
| `18-tour.md` | Guided tour content |

### Dynamic Live-Data Documents
Generated on-demand from current database state:

| Document | Content |
|----------|---------|
| `live-assumptions` | Current global assumptions (fees, staffing, SAFE funding, partner comp) |
| `live-portfolio` | All properties with financial assumptions (room count, ADR, occupancy, cost rates) |
| `live-roles` | User roles and permissions context |

### Knowledge Base Sync
Static KB files + dynamic documents are compiled and synced to ElevenLabs for RAG (Retrieval-Augmented Generation). The admin panel includes a "Rebuild Knowledge Base" trigger.

---

## Market Research Pipeline

### Agentic Workflow
The research system uses Anthropic Claude 3.5 Sonnet as the primary researcher with **tool-augmented research**:

```
User requests research
  → System loads research skill (property or company type)
  → Builds user prompt with property/market context
  → Claude calls tools iteratively (up to 10 iterations):
      - Web search for live market data
      - Computation tools for consistency with portal math
  → Streams results via SSE to client
  → Parses JSON from LLM response
```

### Research Computation Tools
These ensure research outputs are consistent with the portal's deterministic engine:
- `compute_adr_projection` — ADR growth modeling
- `compute_occupancy_ramp` — Occupancy ramp schedule
- `compute_cap_rate_valuation` — Property valuation
- `compute_cost_benchmarks` — USALI-aligned expense rates

### Research Modules
| Module | Output |
|--------|--------|
| Competitive Landscape | 4–6 comparable properties with room counts, ADRs, and positioning |
| Operating Cost Benchmarks | USALI-aligned expense rates for the property's market |
| Local Economics | CPI and SOFR/Prime rates from FRED/BLS data |

---

## Value Extraction & Apply Research

Research results flow through a structured pipeline:

```
Raw LLM response
  → research-value-extractor.ts parses structured values
  → Structured financial assumptions extracted
  → "Apply Research" dialog presented to user
  → User can accept, modify, or reject each value
  → Accepted values update property/global assumptions
```

Research values appear as **yellow pills** next to input fields — suggestions the user can accept or ignore. Research never auto-applies without user consent.

---

## ICP-Driven Company Research

The Ideal Customer Profile (ICP) system (see `hbg-business-model` skill) drives company-level research:

1. ICP physical parameters, amenity priorities, and financial targets are formatted into system prompts
2. LLM research searches for properties matching the ICP criteria
3. Results include property recommendations with financial analysis
4. Location definitions guide geographic search scope

---

## Research Freshness

- **30-day compulsory refresh cycle** with persistent tracking
- Research status indicators in the sidebar: green dot (fresh) / red dot (stale)
- Users can manually trigger re-research at any time
- Research results are stored in the database with timestamps

---

## Rebecca: Text-Based AI Assistant

Rebecca is a secondary, text-based AI assistant complementary to Marcela's voice-first approach:
- Chat interface for text-based interaction
- Uses the same knowledge base and tool system
- Suitable for users who prefer typing over voice

---

## Admin Configuration

The admin panel provides controls for:

| Setting | Description |
|---------|-------------|
| LLM provider selection | Choose Gemini, Claude, or OpenAI for different tasks |
| Knowledge base rebuild | Trigger recompilation and sync to ElevenLabs |
| Convai agent configuration | Update Marcela's ElevenLabs agent settings |
| Voice settings | Voice selection, speaking rate, audio parameters |
| Research model selection | Choose which LLM handles research generation |
| Tool enablement | Enable/disable specific client and server tools |

---

## Key Files

| File | Purpose |
|------|---------|
| `server/ai/clients.ts` | Singleton AI SDK clients (Anthropic, OpenAI, Gemini) |
| `server/ai/marcela-agent-config.ts` | Client + server tool definitions, agent configuration |
| `server/ai/marcela-knowledge-base.ts` | KB source management, live data document generation |
| `server/ai/aiResearch.ts` | Agentic research with tool use (streaming + non-streaming) |
| `server/ai/research-prompt-builders.ts` | Research prompt construction |
| `server/ai/research-tool-prompts.ts` | Tool call handlers for research computation |
| `server/ai/research-resources.ts` | Skill and tool definition loading |
| `server/ai/research-value-extractor.ts` | Structured value extraction from research output |
| `server/ai/kb/` | Static knowledge base markdown files (18+ documents) |
| `server/integrations/elevenlabs.ts` | ElevenLabs Convai integration |
| `server/integrations/elevenlabs-audio.ts` | Audio streaming and signed URL generation |
| `server/routes/marcela-tools.ts` | Server-side tool API endpoints |
| `server/routes/research.ts` | Research generation routes (SSE streaming) |
| `server/routes/ai.ts` | General AI routes |
| `server/routes/admin/marcela.ts` | Admin Marcela configuration routes |
| `server/routes/icp-research.ts` | ICP-driven company research routes |
| `server/routes/chat.ts` | Rebecca chat routes |
