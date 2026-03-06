# Agent Workflows (Visual Builder)

Guide to the ElevenLabs visual workflow builder for designing complex conversation flows within a single agent.

## Overview

Agent Workflows provide a visual interface for designing branching conversation graphs. Instead of linear prompts, you create a node-based flow where each node can modify agent behavior, execute tools, branch on conditions, or transfer conversations.

## When to Use Workflows

| Scenario | Use Workflows | Use Multi-Agent Transfer |
|----------|--------------|------------------------|
| Multi-step process within one domain | ✅ | |
| Different specialist domains | | ✅ |
| Complex branching logic | ✅ | |
| Reusable standalone agents | | ✅ |
| Need different voices per step | ✅ | ✅ |
| Need different LLMs per step | ✅ | ✅ |
| Sequential qualification flow | ✅ | |

## Node Types

### 1. Subagent Nodes

Modify agent behavior at specific points in the conversation. Changes are applied **on top of** the base agent configuration.

**What you can modify:**
- System prompt (override or append)
- Voice and voice settings
- LLM model
- Available tools
- First message
- Language

**Use cases:**
- Change tone/personality for different conversation phases
- Swap to a different voice for a different "character"
- Enable specific tools only when needed
- Switch to a more powerful LLM for complex reasoning steps

### 2. Tool Nodes

Execute server or client tools inline within the workflow.

**Use cases:**
- Fetch data before branching
- Validate information mid-flow
- Update external systems at specific workflow points

### 3. Condition Nodes

Branch the conversation based on:
- Dynamic variable values
- Tool call results
- Conversation state
- Custom logic

**Use cases:**
- Route based on customer tier (premium vs standard)
- Branch based on tool results (item in stock vs out of stock)
- Different flows for new vs returning customers

### 4. Transfer Nodes

Hand off to another agent or phone number at specific workflow points.

**Use cases:**
- Escalation after failed troubleshooting
- Transfer to specialist after qualification
- Connect to human agent for complex issues

## Example Workflow: Customer Onboarding

```
[Start]
   │
   ▼
[Welcome Subagent]
  Prompt: "Welcome new customers warmly. Ask for their name and company."
  Voice: Warm, friendly voice
   │
   ▼
[Collect Info Tool]
  Tool: lookupAccount(email)
   │
   ▼
[Condition: Account Exists?]
  ├── Yes → [Returning Customer Subagent]
  │          Prompt: "Welcome back! Reference their history."
  │          │
  │          ▼
  │         [Upsell Subagent]
  │          Prompt: "Suggest relevant upgrades based on usage."
  │
  └── No → [New Customer Subagent]
             Prompt: "Guide through setup step by step."
             │
             ▼
            [Create Account Tool]
             Tool: createAccount(name, email, company)
             │
             ▼
            [Confirmation Subagent]
             Prompt: "Confirm account created. Explain next steps."
```

## Combining Workflows with Multi-Agent Transfer

You can use both within the same system:

1. **Orchestrator agent** with workflow for initial qualification
2. **Transfer nodes** that route to specialist agents
3. **Specialist agents** with their own internal workflows

```
[Orchestrator Workflow]
   │
   ├── Qualify → [Condition: Intent]
   │                ├── Billing → [Transfer to Billing Agent]
   │                │              └── [Billing Agent Workflow]
   │                │                   ├── Simple query → [Self-resolve]
   │                │                   └── Complex → [Transfer to Human]
   │                │
   │                └── Support → [Transfer to Support Agent]
   │                               └── [Support Agent Workflow]
   │                                    ├── Known issue → [Solution steps]
   │                                    └── Unknown → [Create ticket]
```

## API Configuration

Workflows are primarily configured via the ElevenLabs dashboard visual builder. For programmatic workflow management:

### Create Agent with Workflow-like Behavior via API

While the visual workflow builder is dashboard-only, you can achieve similar behavior via API using:

1. **Subagent-like behavior**: Use conversation overrides to change prompt/voice mid-conversation
2. **Condition-like behavior**: Use server tools that return data, then instruct the agent to branch based on results
3. **Transfer-like behavior**: Use `transfer_to_agent` system tool

```typescript
const agent = await client.conversationalAi.agents.create({
  name: "Workflow Agent",
  conversation_config: {
    agent: {
      prompt: {
        prompt: `# Role
You guide customers through a multi-step process.

# Workflow Phases

## Phase 1: Greeting
- Welcome the customer
- Ask for their name and what they need

## Phase 2: Qualification
- Based on their response, classify their need
- Use the classifyIntent tool to determine the right path

## Phase 3: Resolution
- If billing: use billing tools to look up and resolve
- If support: use support tools to troubleshoot
- If sales: use product catalog tools to recommend

## Phase 4: Confirmation
- Summarize what was done
- Ask if anything else is needed
- End the conversation politely`,
        tools: [
          { type: "system", name: "end_call" },
          { type: "system", name: "transfer_to_agent", params: { transfers: [...] } }
        ]
      }
    }
  }
});
```

## Best Practices

1. **Start simple** — begin with a linear flow, add branches as needed
2. **Test each node** — verify behavior at each step before connecting
3. **Limit depth** — deep nesting (>5 levels) makes flows hard to debug
4. **Use subagents for personality shifts** — not for every small change
5. **Document your workflow** — add comments to condition nodes explaining the logic
6. **Monitor drop-off** — track where users abandon the workflow
