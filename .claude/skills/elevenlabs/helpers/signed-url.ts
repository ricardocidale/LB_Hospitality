import type { ElevenLabsClient } from "elevenlabs";
import { getClient } from "./client";

export async function generateSignedUrl(
  agentId: string,
  client?: ElevenLabsClient
): Promise<string> {
  const c = client || getClient();
  const response = await c.conversationalAi.conversations.getSignedUrl({
    agentId,
  });
  return response.signedUrl;
}

export async function generateSignedUrlRaw(
  agentId: string,
  apiKey?: string
): Promise<string> {
  const key = apiKey || process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY required");

  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
    { headers: { "xi-api-key": key } }
  );

  if (!response.ok) {
    throw new Error(`Failed to get signed URL: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.signed_url;
}

export async function generateConversationToken(
  agentId: string,
  apiKey?: string
): Promise<string> {
  const key = apiKey || process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY required");

  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
    { headers: { "xi-api-key": key } }
  );

  if (!response.ok) {
    throw new Error(`Failed to get conversation token: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.token;
}

export function createSignedUrlEndpoint(agentId: string, client?: ElevenLabsClient) {
  return async (_req: any, res: any) => {
    try {
      const signedUrl = await generateSignedUrl(agentId, client);
      res.json({ signed_url: signedUrl });
    } catch (error: any) {
      console.error("Failed to generate signed URL:", error.message);
      res.status(500).json({ error: "Failed to generate signed URL" });
    }
  };
}
