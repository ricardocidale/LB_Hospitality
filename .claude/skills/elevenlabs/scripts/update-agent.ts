#!/usr/bin/env npx ts-node
/**
 * Update agent settings.
 * Usage: ELEVENLABS_API_KEY=xxx npx ts-node .claude/skills/elevenlabs/scripts/update-agent.ts <agent_id> <field> <value>
 *
 * Supported fields:
 *   prompt       - System prompt text
 *   first-message - First message text
 *   voice        - Voice ID
 *   llm          - LLM model name
 *   language     - Language code (e.g., "en", "pt")
 *   tts-model    - TTS model ID
 */
import { ElevenLabsClient } from "elevenlabs";

async function main() {
  const [agentId, field, ...valueParts] = process.argv.slice(2);
  const value = valueParts.join(" ");

  if (!agentId || !field || !value) {
    console.error(
      "Usage: update-agent.ts <agent_id> <field> <value>\n" +
        "Fields: prompt, first-message, voice, llm, language, tts-model"
    );
    process.exit(1);
  }

  const client = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });

  let updatePayload: any = {};

  switch (field) {
    case "prompt":
      updatePayload = {
        conversationConfig: { agent: { prompt: { prompt: value } } },
      };
      break;
    case "first-message":
      updatePayload = {
        conversationConfig: { agent: { firstMessage: value } },
      };
      break;
    case "voice":
      updatePayload = {
        conversationConfig: { tts: { voiceId: value } },
      };
      break;
    case "llm":
      updatePayload = {
        conversationConfig: { agent: { prompt: { llm: value } } },
      };
      break;
    case "language":
      updatePayload = {
        conversationConfig: { agent: { language: value } },
      };
      break;
    case "tts-model":
      updatePayload = {
        conversationConfig: { tts: { modelId: value } },
      };
      break;
    default:
      console.error(`Unknown field: ${field}`);
      process.exit(1);
  }

  await client.conversationalAi.agents.update(agentId, updatePayload);
  console.log(`Updated agent ${agentId}: ${field} = ${value}`);
}

main().catch(console.error);
