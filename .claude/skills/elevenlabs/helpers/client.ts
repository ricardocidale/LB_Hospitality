import { ElevenLabsClient } from "elevenlabs";

let cachedClient: ElevenLabsClient | null = null;

export function createClient(apiKey?: string): ElevenLabsClient {
  const key = apiKey || process.env.ELEVENLABS_API_KEY;
  if (!key) {
    throw new Error(
      "ELEVENLABS_API_KEY not provided. Set it as an environment variable or pass it directly."
    );
  }
  return new ElevenLabsClient({ apiKey: key });
}

export function getClient(apiKey?: string): ElevenLabsClient {
  if (!cachedClient) {
    cachedClient = createClient(apiKey);
  }
  return cachedClient;
}

export function resetClient(): void {
  cachedClient = null;
}

export async function testConnection(client?: ElevenLabsClient): Promise<boolean> {
  try {
    const c = client || getClient();
    const models = await c.models.list();
    return Array.isArray(models) && models.length > 0;
  } catch {
    return false;
  }
}

export async function getApiKeyInfo(client?: ElevenLabsClient) {
  const c = client || getClient();
  const user = await c.user.get();
  const subscription = await c.user.subscription.get();
  return { user, subscription };
}
