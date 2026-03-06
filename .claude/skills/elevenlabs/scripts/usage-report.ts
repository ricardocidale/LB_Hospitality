#!/usr/bin/env npx ts-node
/**
 * Generate a usage report for the current billing period.
 * Usage: ELEVENLABS_API_KEY=xxx npx ts-node .claude/skills/elevenlabs/scripts/usage-report.ts [days]
 */
import { ElevenLabsClient } from "elevenlabs";

async function main() {
  const days = parseInt(process.argv[2] || "30", 10);

  const client = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });

  const endUnix = Math.floor(Date.now() / 1000);
  const startUnix = endUnix - days * 86400;

  const [user, subscription, usage] = await Promise.all([
    client.user.get(),
    client.user.subscription.get(),
    client.usage.getCharactersUsageMetrics({
      startUnix,
      endUnix,
    }),
  ]);

  console.log("=== ElevenLabs Usage Report ===\n");
  console.log(`Account: ${(user as any).email || (user as any).user_id}`);
  console.log(`Tier: ${(subscription as any).tier}`);
  console.log(`Period: Last ${days} days\n`);

  const sub = subscription as any;
  console.log("Character Usage:");
  console.log(`  Used:  ${sub.character_count?.toLocaleString() || "N/A"}`);
  console.log(`  Limit: ${sub.character_limit?.toLocaleString() || "N/A"}`);
  if (sub.character_count && sub.character_limit) {
    const pct = ((sub.character_count / sub.character_limit) * 100).toFixed(1);
    console.log(`  Usage: ${pct}%`);
  }

  console.log(`\nVoice Slots:`);
  console.log(`  Used:  ${sub.voice_count || "N/A"}`);
  console.log(`  Limit: ${sub.voice_limit || "N/A"}`);

  if (usage) {
    console.log(`\nUsage Breakdown:`);
    console.log(JSON.stringify(usage, null, 2));
  }
}

main().catch(console.error);
