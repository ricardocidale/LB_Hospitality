#!/usr/bin/env npx ts-node
/**
 * List all ElevenLabs conversational AI agents.
 * Usage: ELEVENLABS_API_KEY=xxx npx ts-node .claude/skills/elevenlabs/scripts/list-agents.ts
 */
import { ElevenLabsClient } from "elevenlabs";

async function main() {
  const client = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });

  const result = await client.conversationalAi.agents.list({ pageSize: 100 });
  const agents = (result as any).agents || [];

  console.log(`Found ${agents.length} agent(s):\n`);

  for (const agent of agents) {
    console.log(`  Name: ${agent.name}`);
    console.log(`  ID:   ${agent.agent_id}`);
    console.log(`  Tags: ${agent.tags?.join(", ") || "(none)"}`);
    console.log("");
  }
}

main().catch(console.error);
