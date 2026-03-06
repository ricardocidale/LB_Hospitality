# ElevenLabs Agent Tools

## Overview

Tools allow ElevenLabs agents to perform actions beyond text responses. Four types:

| Type | Execution | Use Case |
|------|-----------|----------|
| **Client Tools** | Browser/app | UI manipulation, navigation, DOM interactions |
| **Server Tools** | Your server | Database queries, API calls, business logic |
| **MCP Tools** | MCP servers | Model Context Protocol integrations |
| **System Tools** | ElevenLabs | Built-in platform actions |

## Client Tools (Used in HBG Portal)

Client tools execute on the user's browser. The agent triggers them via conversation, and results are returned to the agent.

### Dashboard Setup

1. Navigate to agent dashboard → Tools → Add Tool
2. Set Tool Type: **Client**
3. Configure name, description, and parameters

### Registration in Code

**React SDK approach:**
```tsx
const conversation = useConversation({ agentId: "your-agent-id" });

await conversation.startSession({
  clientTools: {
    navigateToPage: async ({ page }) => {
      router.push(page);
      return `Navigated to ${page}`;
    },
    showPropertyDetails: async ({ propertyId }) => {
      router.push(`/property/${propertyId}`);
      return `Showing property ${propertyId}`;
    },
  },
});
```

**Web Component approach** (used in this project):
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
      startGuidedTour: () => {
        setTourActive(true);
        return "Guided tour started";
      },
    };
  };

  el.addEventListener("elevenlabs-convai:call", handleCall);
  return () => el.removeEventListener("elevenlabs-convai:call", handleCall);
}, []);
```

### HBG Portal Client Tools

Currently registered in `ElevenLabsWidget.tsx`:

| Tool | Description |
|------|-------------|
| `navigateToPage` | Navigate to any page by path |
| `showPropertyDetails` | Navigate to property detail page |
| `openPropertyEditor` | Navigate to property editor |
| `showPortfolio` | Navigate to portfolio page |
| `showAnalysis` | Navigate to analysis page |
| `showDashboard` | Navigate to dashboard |
| `startGuidedTour` | Start the guided walkthrough tour |
| `openHelp` | Navigate to help page |
| `showScenarios` | Navigate to scenarios page |
| `openPropertyFinder` | Navigate to property finder |
| `showCompanyPage` | Navigate to company page |
| `getCurrentContext` | Return current page, user name, and role |

## Server Tools

Server tools execute on your infrastructure via HTTP webhook.

### Setup
1. Agent dashboard → Tools → Add Tool → Server type
2. Configure endpoint URL, method, headers
3. Define input/output parameters

### Execution Flow
1. Agent decides to use tool based on conversation
2. ElevenLabs sends HTTP request to your endpoint
3. Your server processes and returns result
4. Agent uses result in conversation

## Wait for Response

When a client tool should return data back to the agent (e.g., `getCurrentContext`), enable **Wait for response** in the tool configuration in the dashboard. The agent pauses until the tool returns, then uses the result in conversation context.

The return value can be a string or an object — objects are JSON-serialized automatically. Return values can also be mapped to dynamic variables, similar to server tools.

## Best Practices

1. **Name tools intuitively** — avoid abbreviations/acronyms. Use detailed descriptions so the agent clearly understands when to use each tool.
2. **Name parameters descriptively** — specify expected formats (e.g., "YYYY-MM-DD" for dates).
3. **System prompt guidance** — include instructions about how/when to call tools in the agent's system prompt for better accuracy.
4. **Tool names are case-sensitive** — must match exactly between dashboard config and code registration.
5. **Error handling** — include error handling for undefined/unexpected parameters in tool implementations.

## Troubleshooting

- **Tools not triggered** — verify names match exactly (case-sensitive) between dashboard and code. Check conversation transcript in agent dashboard.
- **Console errors** — check browser console for errors. Ensure error handling for undefined parameters.

## Tool Call Sounds

Add ambient audio during tool execution to enhance UX. Configure in dashboard → Tools → Tool Configuration → Tool Call Sounds.
