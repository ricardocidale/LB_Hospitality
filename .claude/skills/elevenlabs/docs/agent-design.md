# Agent Design Best Practices

Comprehensive guide to designing, building, and optimizing ElevenLabs Conversational AI agents for production use.

## Agent Architecture Principles

### 1. Keep Agents Specialized

Each agent should have a narrow, clearly defined scope. Broad agents with too many responsibilities are harder to test, slower to respond, and more error-prone.

**Good**: "Billing Support Agent" that handles invoicing, payments, refunds
**Bad**: "Everything Agent" that handles billing, technical support, sales, and HR

Benefits of specialization:
- Fewer edge cases to handle
- Clearer success criteria
- Faster response times
- Easier to test, debug, and improve
- Smaller prompts = less ambiguity

### 2. Use the Orchestrator + Specialist Pattern

For complex applications, design a **routing agent** that classifies intent and transfers to specialized agents:

```
Orchestrator Agent (Intent Classification)
│
├──→ Specialist A (e.g., Sales)
│     └──→ Sub-specialist A1 (e.g., Enterprise Sales)
│
├──→ Specialist B (e.g., Support)
│     ├──→ Sub-specialist B1 (e.g., Hardware Support)
│     └──→ Sub-specialist B2 (e.g., Software Support)
│
├──→ Specialist C (e.g., Billing)
│
└──→ Human Escalation (via transfer_to_number)
```

The orchestrator's prompt should be lean — focused on intent classification and routing, not domain expertise.

### 3. Design for Failure

Every agent should handle:
- **Tool failures** — retry once, then apologize and offer alternatives
- **Out-of-scope requests** — acknowledge limitation, offer transfer or escalation
- **Silence / no response** — configurable timeout behavior
- **Adversarial input** — guardrails section in prompt + platform guardrails

## Agent Configuration

### Core Settings

| Setting | Purpose | Recommendation |
|---------|---------|----------------|
| LLM Model | Intelligence vs speed | `gpt-4o` for complex; `gpt-4o-mini` for simple/fast |
| Voice | Audio output | Match language/region; test multiple voices |
| Language | Supported languages | Enable auto-detection for multilingual |
| First Message | Conversation opener | Personalize with dynamic variables |
| Max Duration | Call time limit | Set reasonable limits per use case |

### Recommended Models by Use Case

| Use Case | LLM | Why |
|----------|-----|-----|
| Multi-agent transfers | `gpt-4o` or `gpt-4o-mini` | Better tool calling reliability |
| Simple FAQ | `gpt-4o-mini` or `gemini-2.0-flash` | Fast, cost-effective |
| Complex reasoning | `gpt-4o` | Better accuracy |
| Financial/Legal | `gpt-4o` | Precision matters |
| High-volume chat | `gpt-4o-mini` | 25x higher concurrency in text-only mode |

### Voice Configuration

- **Speed**: Start at 1.0, adjust 0.7–1.2 based on use case
- **Stability**: Higher = more consistent; lower = more expressive
- **Similarity Boost**: Higher = closer to original voice
- **Language-specific voices**: Configure different voices per language
- **Expressive mode**: Available with Eleven v3 Conversational model
- **Text normalization**: Use `elevenlabs` normalizer for cleaner transcripts, `system_prompt` for lower latency

### Conversation Flow Settings

- **Turn-taking**: Configure interruption handling
- **Timeouts**: Set appropriate silence timeouts
- **Text-only mode**: Enable for chat interfaces (25x higher concurrency)
- **Skip turn tool**: Allow agent to pause when user needs time

## Tool Integration Patterns

### Tool Selection Guide

| Need | Tool Type | Runs On |
|------|-----------|---------|
| Navigate UI, update display | Client tool | Browser |
| Fetch data, write DB, call APIs | Server tool | Your server |
| Connect external services | MCP tool | MCP server |
| End call, transfer, detect language | System tool | Platform |

### Tool Description Best Practices

1. **Name tools clearly**: `getOrderStatus`, `processRefund`, `lookupAccount`
2. **Write detailed descriptions**: Explain purpose AND when to trigger
3. **Document parameters**: Include format examples (`"email": "user@example.com"`)
4. **Handle errors in prompt**: Tell agent what to do when tools fail

### Dynamic Variable Assignments

Server tools can update dynamic variables by specifying JSON dot-notation paths:
- `response.status` → extracts `status` field from response
- `response.users.0.email` → extracts first user's email

Use `secret__` prefix for sensitive variables (auth tokens, private IDs) — these are never sent to LLM providers.

## Guardrails

### System Prompt Guardrails

Use the `# Guardrails` heading — models pay extra attention to it:

```
# Guardrails

- Never share customer data across conversations
- Never process refunds over $500 without supervisor approval
- Acknowledge when you don't know an answer instead of guessing
- If a customer becomes abusive, politely end the conversation
```

### Platform Guardrails

| Guardrail | Effect | Latency |
|-----------|--------|---------|
| Focus Guardrail | Keeps agent on-topic throughout conversation | Minimal |
| Manipulation Detection | Blocks prompt injection attempts | None (concurrent) |
| Content Filtering | Prevents inappropriate content | None (concurrent) |
| Custom Guardrails | Your business-specific rules | None (concurrent) |

### Custom Guardrail Configuration

```typescript
platform_settings: {
  guardrails: {
    version: "1",
    prompt_injection: { isEnabled: true },
    custom: {
      guardrails: [{
        name: "No financial advice",
        prompt: "Block any content providing specific investment recommendations or tax guidance",
        model: "gemini-2.5-flash-lite"
      }]
    }
  }
}
```

Exit strategies for custom guardrails:
- **Terminate** — end conversation immediately
- **Transfer to agent** — hand off to another AI agent
- **Transfer to person** — connect to human support

## Evaluation and Monitoring

### Key Metrics to Track

- **Conversation completion rate** — did the agent achieve its goal?
- **Tool call success rate** — are tools being called correctly?
- **Average conversation duration** — is the agent efficient?
- **Transfer rate** — how often does escalation occur?
- **Guardrail trigger rate** — is the agent staying in scope?

### Conversation Review

Use the conversations API to review transcripts:
```typescript
const conversations = await client.conversationalAi.conversations.list({
  agent_id: "agent_xxx",
  page_size: 20
});
```

Review conversations regularly to:
1. Identify common failure patterns
2. Improve prompt instructions
3. Add missing tool capabilities
4. Update knowledge base content

## Deployment Checklist

- [ ] System prompt is structured with clear sections
- [ ] First message is personalized (uses dynamic variables)
- [ ] All tools have detailed descriptions and parameter docs
- [ ] Error handling instructions included in prompt
- [ ] Guardrails section defines critical rules
- [ ] Platform guardrails enabled (focus, manipulation, content)
- [ ] Authentication configured (signed URLs for private agents)
- [ ] Knowledge base documents attached and indexed
- [ ] Voice and language settings configured
- [ ] Conversation flow timeouts set appropriately
- [ ] Agent transfer rules defined (if multi-agent)
- [ ] Human escalation path defined
- [ ] Tested across expected user scenarios
