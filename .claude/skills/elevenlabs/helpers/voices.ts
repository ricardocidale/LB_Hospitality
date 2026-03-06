import type { ElevenLabsClient } from "elevenlabs";
import { getClient } from "./client";

export async function listAllVoices(
  showLegacy = false,
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.voices.getAll({ showLegacy });
}

export async function searchVoices(
  options: {
    search?: string;
    pageSize?: number;
    voiceType?: string;
    category?: string;
    sort?: string;
    sortDirection?: string;
  },
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.voices.search({
    search: options.search,
    pageSize: options.pageSize || 20,
    voiceType: options.voiceType,
    category: options.category,
    sort: options.sort,
    sortDirection: options.sortDirection,
  });
}

export async function getVoice(voiceId: string, client?: ElevenLabsClient) {
  const c = client || getClient();
  return c.voices.get(voiceId);
}

export async function deleteVoice(voiceId: string, client?: ElevenLabsClient) {
  const c = client || getClient();
  return c.voices.delete(voiceId);
}

export async function findVoiceByName(
  name: string,
  client?: ElevenLabsClient
) {
  const result = await searchVoices({ search: name }, client);
  return (result as any).voices?.find(
    (v: any) => v.name.toLowerCase() === name.toLowerCase()
  );
}

export async function getDefaultSettings(client?: ElevenLabsClient) {
  const c = client || getClient();
  return c.voices.settings.getDefault();
}

export function formatVoiceList(
  voices: Array<{
    name: string;
    voice_id: string;
    category?: string;
    labels?: Record<string, string>;
  }>
): string {
  const lines = voices.map((v) => {
    const labels = v.labels
      ? Object.entries(v.labels)
          .map(([k, val]) => `${k}=${val}`)
          .join(", ")
      : "";
    return `${v.name} (${v.voice_id}) [${v.category || "unknown"}] ${labels}`;
  });
  return lines.join("\n");
}
