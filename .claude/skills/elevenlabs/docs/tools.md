# ElevenLabs Agent Tools

## Overview

Tools extend agent capabilities beyond text responses. Four types:

| Type | Execution | Use Case |
|------|-----------|----------|
| **Client Tools** | Browser/app | UI manipulation, navigation, DOM interactions |
| **Server Tools** | Your server (HTTP) | Database queries, API calls, business logic |
| **MCP Tools** | MCP servers | Model Context Protocol integrations |
| **System Tools** | ElevenLabs | Built-in platform actions |

## Client Tools

Execute on the user's browser. The agent invokes them during conversation.

### Dashboard Setup
1. Agent dashboard → Tools → Add Tool → **Client** type
2. Set name, description, and parameters
3. Enable "Wait for response" if the tool returns data the agent should use

### React SDK Registration
```tsx
const conversation = useConversation({
  clientTools: {
    navigateToPage: async ({ page }: { page: string }) => {
      router.push(page);
      return `Navigated to ${page}`;
    },
    getCurrentTime: async () => {
      return new Date().toISOString();
    },
    showModal: async ({ title, content }: { title: string; content: string }) => {
      setModalData({ title, content });
      setShowModal(true);
      return "Modal displayed";
    },
  },
});
```

### Widget Web Component Registration
```tsx
useEffect(() => {
  const el = widgetRef.current;
  const handleCall = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (!detail?.config) return;

    detail.config.clientTools = {
      navigateToPage: ({ page }: { page: string }) => {
        setLocation(page);
        return `Navigated to ${page}`;
      },
    };
  };

  el?.addEventListener("elevenlabs-convai:call", handleCall);
  return () => el?.removeEventListener("elevenlabs-convai:call", handleCall);
}, []);
```

### Vanilla JS Registration
```typescript
const conversation = await Conversation.startSession({
  agentId: "agent-id",
  clientTools: {
    myTool: async (params) => {
      // Do something client-side
      return "result";
    },
  },
});
```

## Server Tools

Execute on your server via HTTP webhook when the agent invokes them.

### Dashboard Setup
1. Agent dashboard → Tools → Add Tool → **Server** type
2. Configure endpoint URL, HTTP method, headers
3. Define input/output parameters and descriptions

### Server Implementation
```typescript
app.post("/api/tools/lookup-order", async (req, res) => {
  const { order_id } = req.body;

  try {
    const order = await db.orders.findById(order_id);
    res.json({
      status: order.status,
      items: order.items.map(i => i.name).join(", "),
      delivery_date: order.estimatedDelivery,
    });
  } catch (error) {
    res.status(500).json({ error: "Order not found" });
  }
});
```

### Execution Flow
1. Agent decides to use tool based on conversation context
2. ElevenLabs sends HTTP request to your endpoint
3. Your server processes request and returns JSON
4. Agent receives response and continues conversation

## MCP Tools

Connect Model Context Protocol servers for extended capabilities.

### Setup
```typescript
const mcpServer = await client.conversationalAi.mcpServers.create({
  name: "My MCP Server",
  url: "https://my-mcp-server.com",
});
```

### List MCP Tools
```typescript
const tools = await client.conversationalAi.mcpServers.tools.list("mcp_server_id");
```

### Approval Policies
```typescript
const policy = await client.conversationalAi.mcpServers.approvalPolicy.get("mcp_server_id");
```

## System Tools

Built-in tools provided by ElevenLabs:
- **End conversation** — programmatically end the conversation
- **Transfer call** — transfer to another number (phone agents)
- **Send SMS** — send text message (phone agents)

## Tool Management API

### Create Tool
```typescript
const tool = await client.conversationalAi.tools.create({
  name: "lookupOrder",
  description: "Look up order status by order ID",
  type: "server",
  config: {
    url: "https://your-server.com/api/tools/lookup-order",
    method: "POST",
    headers: { "Authorization": "Bearer {{MY_SECRET}}" },
  },
  parameters: {
    type: "object",
    properties: {
      order_id: { type: "string", description: "The order ID to look up" },
    },
    required: ["order_id"],
  },
});
```

### List Tools
```typescript
const tools = await client.conversationalAi.tools.list({ agentId: "agent_id" });
```

### Update Tool
```typescript
await client.conversationalAi.tools.update("tool_id", {
  description: "Updated description",
});
```

### Delete Tool
```typescript
await client.conversationalAi.tools.delete("tool_id");
```

## Tool Call Sounds

Add ambient audio during tool execution for better UX:
- Configure in dashboard → Tools → Tool Configuration → Tool Call Sounds
- Plays while waiting for tool response

## Best Practices

1. **Descriptive names** — avoid abbreviations, be explicit about what the tool does
2. **Detailed descriptions** — help the LLM understand when to use each tool
3. **Parameter descriptions** — specify expected formats (e.g., "YYYY-MM-DD" for dates)
4. **System prompt** — include guidance about when/how to use tools
5. **Case-sensitive** — tool names must match exactly between dashboard and code
6. **Error handling** — handle undefined/unexpected parameters gracefully
7. **Wait for response** — enable for tools that return data the agent needs
8. **Idempotency** — server tools should be safe to call multiple times
