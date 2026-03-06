#!/usr/bin/env npx ts-node
/**
 * Dump full agent configuration as JSON.
 * Usage: ELEVENLABS_API_KEY=xxx npx ts-node .claude/skills/elevenlabs/scripts/get-agent-config.ts <agent_id>
 */
import { ElevenLabsClient } from "elevenlabs";

async function main() {
  const agentId = process.argv[2];
  if (!agentId) {
    console.error("Usage: get-agent-config.ts <agent_id>");
    process.exit(1);
  }

  const client = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });

  const agent = await client.conversationalAi.agents.get(agentId);
  console.log(JSON.stringify(agent, null, 2));
}

main().catch(console.error);
