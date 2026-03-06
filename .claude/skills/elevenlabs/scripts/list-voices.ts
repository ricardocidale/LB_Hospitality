#!/usr/bin/env npx ts-node
/**
 * List all available ElevenLabs voices.
 * Usage: ELEVENLABS_API_KEY=xxx npx ts-node .claude/skills/elevenlabs/scripts/list-voices.ts [search]
 */
import { ElevenLabsClient } from "elevenlabs";

async function main() {
  const client = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });

  const search = process.argv[2];

  if (search) {
    const result = await client.voices.search({
      search,
      pageSize: 50,
    });
    const voices = (result as any).voices || [];
    console.log(`Found ${voices.length} voice(s) matching "${search}":\n`);
    for (const v of voices) {
      const labels = v.labels
        ? Object.entries(v.labels)
            .map(([k, val]) => `${k}=${val}`)
            .join(", ")
        : "";
      console.log(`  ${v.name} (${v.voice_id}) [${v.category}] ${labels}`);
    }
  } else {
    const result = await client.voices.getAll({ showLegacy: false });
    const voices = (result as any).voices || [];
    console.log(`Found ${voices.length} voice(s):\n`);
    for (const v of voices) {
      console.log(`  ${v.name} (${v.voice_id}) [${v.category || "unknown"}]`);
    }
  }
}

main().catch(console.error);
