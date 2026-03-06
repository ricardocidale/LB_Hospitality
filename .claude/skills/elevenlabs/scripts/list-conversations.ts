#!/usr/bin/env npx ts-node
/**
 * List recent conversations for an agent.
 * Usage: ELEVENLABS_API_KEY=xxx npx ts-node .claude/skills/elevenlabs/scripts/list-conversations.ts <agent_id> [limit]
 */
import { ElevenLabsClient } from "elevenlabs";

async function main() {
  const agentId = process.argv[2];
  const limit = parseInt(process.argv[3] || "20", 10);

  if (!agentId) {
    console.error("Usage: list-conversations.ts <agent_id> [limit]");
    process.exit(1);
  }

  const client = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });

  const result = await client.conversationalAi.conversations.list({
    agentId,
    pageSize: limit,
  });

  const conversations = (result as any).conversations || [];
  console.log(`Found ${conversations.length} conversation(s) for agent ${agentId}:\n`);

  for (const convo of conversations) {
    const start = convo.start_time
      ? new Date(convo.start_time).toLocaleString()
      : "unknown";
    const duration = convo.end_time && convo.start_time
      ? Math.round(
          (new Date(convo.end_time).getTime() -
            new Date(convo.start_time).getTime()) /
            1000
        )
      : "ongoing";

    console.log(`  ID:       ${convo.conversation_id}`);
    console.log(`  Status:   ${convo.status}`);
    console.log(`  Started:  ${start}`);
    console.log(`  Duration: ${duration}${typeof duration === "number" ? "s" : ""}`);
    console.log("");
  }
}

main().catch(console.error);
