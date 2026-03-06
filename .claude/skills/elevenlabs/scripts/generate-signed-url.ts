#!/usr/bin/env npx ts-node
/**
 * Generate a signed URL for a private agent.
 * Usage: ELEVENLABS_API_KEY=xxx npx ts-node .claude/skills/elevenlabs/scripts/generate-signed-url.ts <agent_id>
 */
async function main() {
  const agentId = process.argv[2];
  if (!agentId) {
    console.error("Usage: generate-signed-url.ts <agent_id>");
    process.exit(1);
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("ELEVENLABS_API_KEY environment variable required");
    process.exit(1);
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
    { headers: { "xi-api-key": apiKey } }
  );

  if (!response.ok) {
    console.error(`Error: ${response.status} ${response.statusText}`);
    const body = await response.text();
    console.error(body);
    process.exit(1);
  }

  const data = await response.json();
  console.log("Signed URL (expires in 15 minutes):");
  console.log(data.signed_url);
}

main().catch(console.error);
