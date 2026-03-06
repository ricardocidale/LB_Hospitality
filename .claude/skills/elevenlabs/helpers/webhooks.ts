import crypto from "crypto";

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

export function createWebhookMiddleware(secret: string) {
  return (req: any, res: any, next: any) => {
    const signature = req.headers["x-elevenlabs-signature"];
    if (!signature) {
      return res.status(401).json({ error: "Missing webhook signature" });
    }

    const rawBody =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    if (!verifyWebhookSignature(rawBody, signature, secret)) {
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    next();
  };
}

export interface ConversationInitPayload {
  agent_id: string;
  dynamic_variables?: Record<string, string>;
}

export interface ConversationEndPayload {
  conversation_id: string;
  agent_id: string;
  transcript?: Array<{ role: string; message: string }>;
  duration?: number;
  status: string;
}

export interface ServerToolPayload {
  tool_name: string;
  parameters: Record<string, unknown>;
  conversation_id: string;
  agent_id: string;
}

export function createConversationInitHandler(
  lookupFn: (
    payload: ConversationInitPayload
  ) => Promise<Record<string, string>>
) {
  return async (req: any, res: any) => {
    try {
      const dynamicVariables = await lookupFn(req.body);
      res.json({ dynamic_variables: dynamicVariables });
    } catch (error: any) {
      console.error("Conversation init webhook error:", error.message);
      res.json({ dynamic_variables: {} });
    }
  };
}

export function createServerToolHandler(
  handlers: Record<
    string,
    (params: Record<string, unknown>) => Promise<Record<string, unknown>>
  >
) {
  return async (req: any, res: any) => {
    const { tool_name, parameters } = req.body as ServerToolPayload;
    const handler = handlers[tool_name];

    if (!handler) {
      return res
        .status(404)
        .json({ error: `Unknown tool: ${tool_name}` });
    }

    try {
      const result = await handler(parameters);
      res.json(result);
    } catch (error: any) {
      console.error(`Tool ${tool_name} error:`, error.message);
      res.status(500).json({ error: error.message });
    }
  };
}
