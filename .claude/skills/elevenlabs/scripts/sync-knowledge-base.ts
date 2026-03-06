#!/usr/bin/env npx ts-node
/**
 * Sync a text file to an agent's knowledge base.
 * Creates or replaces a document with the given name.
 * Usage: ELEVENLABS_API_KEY=xxx npx ts-node .claude/skills/elevenlabs/scripts/sync-knowledge-base.ts <agent_id> <doc_name> <file_path>
 */
import { ElevenLabsClient } from "elevenlabs";
import fs from "fs";

async function main() {
  const [agentId, docName, filePath] = process.argv.slice(2);

  if (!agentId || !docName || !filePath) {
    console.error(
      "Usage: sync-knowledge-base.ts <agent_id> <doc_name> <file_path>"
    );
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const client = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });

  console.log(`Agent:    ${agentId}`);
  console.log(`Document: ${docName}`);
  console.log(`File:     ${filePath}`);

  const existingDocs = await client.conversationalAi.knowledgeBase.documents.list({
    search: docName,
    pageSize: 100,
  });

  const existing = (existingDocs as any).documents?.find(
    (d: any) => d.name === docName
  );

  if (existing) {
    console.log(`Deleting existing document: ${existing.id}`);
    await client.conversationalAi.knowledgeBase.documents.delete(existing.id);
  }

  const text = fs.readFileSync(filePath, "utf-8");
  console.log(`Uploading ${text.length} characters...`);

  const doc = await client.conversationalAi.knowledgeBase.documents.createFromText({
    name: docName,
    text,
  });

  console.log(`Created document: ${(doc as any).id}`);

  const agent = await client.conversationalAi.agents.get(agentId);
  const currentKB =
    (agent as any).conversation_config?.agent?.prompt?.knowledge_base || [];

  const updatedKB = currentKB.filter((d: any) => d.name !== docName);
  updatedKB.push({ type: "text", name: docName, id: (doc as any).id });

  await client.conversationalAi.agents.update(agentId, {
    conversationConfig: {
      agent: {
        prompt: { knowledgeBase: updatedKB },
      },
    },
  });

  console.log(`Attached to agent. KB now has ${updatedKB.length} document(s).`);
}

main().catch(console.error);
