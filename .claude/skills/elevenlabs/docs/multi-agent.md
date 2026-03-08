# Multi-Agent Architecture

Guide to building multi-agent systems with ElevenLabs — agent transfers, orchestration patterns, and collaborative workflows.

## Overview

Multi-agent systems let you decompose complex conversational workflows into specialized agents that hand off conversations based on user needs. This improves accuracy, reduces prompt complexity, and enables domain-specific optimization.

## Agent Transfer Mechanism

### How It Works

1. Agent A has a `transfer_to_agent` system tool configured with transfer rules
2. Each rule specifies: target agent ID, condition (natural language), and optional settings
3. The LLM evaluates the conversation against conditions and decides when to transfer
4. Transfer happens seamlessly — the user continues the same session

### Transfer Configuration

Each transfer rule has:

| Field | Required | Description |
|-------|----------|-------------|
| `agent_id` | Yes | Target agent to transfer to |
| `condition` | Yes | Natural language description of when to transfer |
| `delay_ms` | No | Milliseconds to wait before transfer (default: 0) |
| `transfer_message` | No | Message played during transfer (silent if omitted) |
| `enable_transferred_agent_first_message` | No | Whether target agent plays its greeting (default: false) |

### API Implementation

```typescript
import { ElevenLabsClient } from "elevenlabs";

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

const orchestrator = await client.conversationalAi.agents.create({
  name: "Orchestrator",
  conversation_config: {
    agent: {
      prompt: {
        prompt: `# Role
You are the front-desk routing agent. Classify user intent and transfer to the right specialist.

# Transfer Rules
- Billing questions → Billing Agent
- Technical issues → Support Agent
- Sales inquiries → Sales Agent

# Guardrails
- Do not attempt to resolve issues yourself
- Ask one clarifying question if intent is unclear
- Transfer promptly once intent is classified`,
        first_message: "Hello! I'm here to connect you with the right team. How can I help?",
        tools: [
          {
            type: "system",
            name: "transfer_to_agent",
            description: "Transfer to a specialist agent based on user needs",
            params: {
              transfers: [
                {
                  agent_id: "agent_billing_xxx",
                  condition: "User asks about billing, invoices, payments, refunds, or pricing",
                  delay_ms: 500,
                  transfer_message: "Let me connect you with our billing specialist.",
                  enable_transferred_agent_first_message: true
                },
                {
                  agent_id: "agent_support_xxx",
                  condition: "User has technical issues, bugs, errors, or needs troubleshooting",
                  delay_ms: 500,
                  transfer_message: "I'll transfer you to our technical support team.",
                  enable_transferred_agent_first_message: true
                },
                {
                  agent_id: "agent_sales_xxx",
                  condition: "User wants to learn about products, pricing plans, or make a purchase",
                  delay_ms: 500,
                  transfer_message: "Let me connect you with our sales team.",
                  enable_transferred_agent_first_message: true
                }
              ]
            }
          },
          {
            type: "system",
            name: "end_call",
            description: ""
          }
        ]
      }
    }
  }
});
```

## Architecture Patterns

### Pattern 1: Star Topology (Orchestrator + Specialists)

Best for: Customer service, help desks, general-purpose portals

```
         ┌─────────────┐
         │ Orchestrator │
         │  (Router)    │
         └──────┬───────┘
        ┌───────┼───────┐
        ▼       ▼       ▼
   ┌────────┐ ┌─────┐ ┌──────┐
   │Billing │ │Sales│ │Support│
   └────────┘ └─────┘ └──────┘
```

- Orchestrator is lightweight — focuses on intent classification
- Each specialist has its own prompt, voice, tools, and knowledge base
- Specialists can transfer back to orchestrator if user changes topic

### Pattern 2: Chain Topology (Sequential Handoff)

Best for: Multi-step workflows (onboarding, qualification → booking → confirmation)

```
   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │  Qualifier   │ ──→ │   Booking    │ ──→ │ Confirmation │
   │  (Step 1)    │     │  (Step 2)    │     │  (Step 3)    │
   └──────────────┘     └──────────────┘     └──────────────┘
```

- Each agent handles one phase of the workflow
- Transfer happens when the current phase is complete
- Context passes forward through the conversation history

### Pattern 3: Hub and Spoke with Sub-specialists

Best for: Deep domain expertise (technical support with hardware/software/networking tiers)

```
         ┌─────────────┐
         │ Orchestrator │
         └──────┬───────┘
        ┌───────┼───────┐
        ▼       ▼       ▼
   ┌────────┐ ┌─────┐ ┌──────────┐
   │ Sales  │ │ HR  │ │ Support  │
   └────────┘ └─────┘ └────┬─────┘
                      ┌─────┼─────┐
                      ▼     ▼     ▼
                  ┌──────┐┌────┐┌───────┐
                  │ HW   ││ SW ││Network│
                  └──────┘└────┘└───────┘
```

- Support agent is itself a mini-orchestrator
- Nested transfers: Orchestrator → Support → Hardware Support
- Each level adds domain-specific knowledge

### Pattern 4: Peer-to-Peer with Mutual Transfer

Best for: Conversational agents where topics shift naturally

```
   ┌──────────┐ ←──→ ┌──────────┐
   │ Agent A  │      │ Agent B  │
   │ (Topic 1)│      │ (Topic 2)│
   └──────────┘      └──────────┘
        ↕                  ↕
   ┌──────────┐      ┌──────────┐
   │ Agent C  │ ←──→ │ Agent D  │
   │ (Topic 3)│      │ (Topic 4)│
   └──────────┘      └──────────┘
```

- Any agent can transfer to any other
- Good for natural conversations that span multiple domains
- Requires careful condition design to avoid transfer loops

## Transfer Best Practices

### 1. Use Clear, Non-Overlapping Conditions

**Bad** — ambiguous overlap:
```
Transfer A condition: "User needs help"
Transfer B condition: "User has a problem"
```

**Good** — distinct boundaries:
```
Transfer A condition: "User asks about billing, invoices, payments, or refunds"
Transfer B condition: "User reports technical errors, bugs, or system issues"
```

### 2. Include Transfer Context in Specialist Prompts

The specialist agent receives the full conversation history. Acknowledge this in the prompt:

```
# Context
You are receiving a transferred conversation. The user has already spoken with our
routing agent. Review the conversation history to understand their needs — do not
ask them to repeat information they've already provided.
```

### 3. Design Graceful Fallbacks

If no transfer condition matches, the orchestrator should:
1. Ask a clarifying question
2. Attempt to help if possible
3. Offer human escalation as last resort

```
# Fallback Behavior
If the user's request doesn't match any specialist:
1. Ask one clarifying question to better understand their need
2. If still unclear, offer to transfer to general support
3. If the user requests a human, use transfer_to_number
```

### 4. Avoid Transfer Loops

Prevent agents from bouncing users between each other:
- Don't add mutual transfer rules unless necessary
- Add a "do not transfer back to the agent that just transferred to you" rule
- Set a maximum transfer depth in orchestrator logic

### 5. Choose the Right LLM for Transfer Agents

Use `gpt-4o` or `gpt-4o-mini` for agents that make transfer decisions — they have the best tool-calling reliability.

## Agent Transfer with Human Escalation

Combine agent transfer with `transfer_to_number` for human fallback:

```typescript
tools: [
  {
    type: "system",
    name: "transfer_to_agent",
    params: {
      transfers: [
        { agent_id: "agent_billing", condition: "Billing questions" },
        { agent_id: "agent_support", condition: "Technical issues" }
      ]
    }
  },
  {
    type: "system",
    name: "transfer_to_number",
    description: "Transfer to human when AI cannot resolve the issue",
    params: {
      phone_numbers: [
        {
          phone_number: "+15551234567",
          condition: "User explicitly requests a human agent, or the issue cannot be resolved by AI"
        }
      ]
    }
  },
  {
    type: "system",
    name: "end_call",
    description: ""
  }
]
```

## Agent Workflows

For the visual workflow builder (node types, subagents, conditions, branching), see `agent-workflows.md`.

## Testing Multi-Agent Systems

1. **Test each agent individually** — verify it handles its domain correctly
2. **Test transfer triggers** — ensure conditions fire at the right time
3. **Test the full flow** — walk through complete user journeys
4. **Test edge cases** — ambiguous intents, multiple topics, transfer loops
5. **Monitor in production** — review conversation logs for transfer accuracy

## Dynamic Variables Across Transfers

System dynamic variables change after transfers:
- `system__agent_id` — stays as the **initial** agent ID
- `system__current_agent_id` — updates to the **currently active** agent ID

Use `system__current_agent_id` in prompts that need to know which agent is currently speaking.

Custom dynamic variables persist across transfers within the same conversation session.
