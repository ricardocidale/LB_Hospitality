/**
 * Test: Upload a KB text document to the ElevenLabs agent, confirm it's
 * visible in the agent's knowledge_base config, then clean up.
 */
import { describe, it, expect, beforeAll } from "vitest";
import {
  getElevenLabsApiKey,
  getConvaiAgent,
  updateConvaiAgent,
  createKBDocumentFromText,
  createKBDocumentFromFile,
  getKBDocument,
  deleteKBDocument,
} from "../../server/integrations/elevenlabs.js";

let apiKey: string;
let agentId: string;

beforeAll(async () => {
  apiKey = await getElevenLabsApiKey();
  const res = await fetch("https://api.elevenlabs.io/v1/convai/agents", {
    headers: { "xi-api-key": apiKey },
  });
  const data = (await res.json()) as any;
  agentId = data.agents?.[0]?.agent_id || "";
  console.log(`Agent: ${data.agents?.[0]?.name} (${agentId})`);
});

describe("ElevenLabs KB — Full attach & verify lifecycle", () => {
  const TEST_DOC_NAME = "E2E-KB-Attach-Test";
  const TEST_CONTENT = [
    "Hospitality Business Group — E2E Knowledge Base Test Document",
    "",
    "This document was uploaded by the automated E2E test suite.",
    "It contains a unique marker: CANARY_PHRASE_7X92M",
    "",
    "Property: Golden Lodge Test Hotel",
    "Rooms: 20",
    "ADR: $200/night",
    "Occupancy Target: 75%",
    "Annual Revenue Estimate: $1,095,000",
    "",
    "This content should be retrievable by the agent during conversations.",
  ].join("\n");

  let createdDocId: string | null = null;
  let originalKb: any[] = [];
  let kbLocation: "top" | "prompt" = "prompt";

  it("1. Snapshot the agent's current KB before modification", async () => {
    const agent = await getConvaiAgent(agentId);
    // KB can be at agent.conversation_config.agent.knowledge_base (top-level)
    // or agent.conversation_config.agent.prompt.knowledge_base
    const topLevel = (agent.conversation_config?.agent as any)?.knowledge_base;
    const promptLevel = (agent.conversation_config?.agent?.prompt as any)?.knowledge_base;

    if (Array.isArray(topLevel) && topLevel.length > 0) {
      originalKb = topLevel;
      kbLocation = "top";
    } else if (Array.isArray(promptLevel)) {
      originalKb = promptLevel;
      kbLocation = "prompt";
    } else {
      originalKb = [];
      kbLocation = topLevel !== undefined ? "top" : "prompt";
    }

    console.log(`  KB location: ${kbLocation}`);
    console.log(`  Current KB docs: ${originalKb.length}`);
    originalKb.forEach((doc: any) => {
      console.log(`    - ${doc.name || doc.id} (type: ${doc.type || "unknown"})`);
    });
  });

  it("2. Create KB document from text via API", async () => {
    const doc = await createKBDocumentFromText(TEST_DOC_NAME, TEST_CONTENT);
    expect(doc.id).toBeTruthy();
    expect(doc.name).toBe(TEST_DOC_NAME);
    createdDocId = doc.id;
    console.log(`  Created doc: ${doc.id}`);
  });

  it("3. Verify document exists at ElevenLabs (GET by ID)", async () => {
    expect(createdDocId).toBeTruthy();
    const doc = await getKBDocument(createdDocId!);
    expect(doc.id).toBe(createdDocId);
    expect(doc.name).toBe(TEST_DOC_NAME);
    console.log(`  Confirmed doc exists: ${doc.id} (name: ${doc.name})`);
  });

  it("4. Attach document to agent's knowledge_base", async () => {
    expect(createdDocId).toBeTruthy();

    const newKb = [...originalKb, { type: "text", id: createdDocId, name: TEST_DOC_NAME }];

    const patch = kbLocation === "top"
      ? { conversation_config: { agent: { knowledge_base: newKb } } }
      : { conversation_config: { agent: { prompt: { knowledge_base: newKb } } } };

    const updated = await updateConvaiAgent(agentId, patch);
    expect(updated).toBeDefined();
    console.log(`  Patched agent with ${newKb.length} KB docs`);
  });

  it("5. Read back agent config and confirm doc is in knowledge_base", async () => {
    const agent = await getConvaiAgent(agentId);
    const topLevel = (agent.conversation_config?.agent as any)?.knowledge_base;
    const promptLevel = (agent.conversation_config?.agent?.prompt as any)?.knowledge_base;
    const currentKb: any[] = (kbLocation === "top" ? topLevel : promptLevel) || [];

    console.log(`  Agent KB docs after attach: ${currentKb.length}`);
    currentKb.forEach((doc: any) => {
      console.log(`    - ${doc.name || doc.id} (type: ${doc.type || "unknown"})`);
    });

    const found = currentKb.find((doc: any) => doc.id === createdDocId);
    expect(found).toBeDefined();
    expect(found.name).toBe(TEST_DOC_NAME);
    console.log(`  CONFIRMED: "${TEST_DOC_NAME}" is visible in agent KB`);
  });

  it("6. Also upload a .txt file and attach it", async () => {
    const fileContent = Buffer.from(
      "E2E File Upload Test\n\nThis file was uploaded as a .txt buffer.\nMarker: FILE_UPLOAD_CHECK_Q3K8\n"
    );
    const fileDoc = await createKBDocumentFromFile("E2E-File-Upload-Test", fileContent, "e2e-test.txt");
    expect(fileDoc.id).toBeTruthy();
    console.log(`  Uploaded file doc: ${fileDoc.id} (${fileDoc.name})`);

    // Attach to agent
    const agent = await getConvaiAgent(agentId);
    const topLevel = (agent.conversation_config?.agent as any)?.knowledge_base;
    const promptLevel = (agent.conversation_config?.agent?.prompt as any)?.knowledge_base;
    const currentKb: any[] = (kbLocation === "top" ? topLevel : promptLevel) || [];
    const newKb = [...currentKb, { type: "file", id: fileDoc.id, name: fileDoc.name }];

    const patch = kbLocation === "top"
      ? { conversation_config: { agent: { knowledge_base: newKb } } }
      : { conversation_config: { agent: { prompt: { knowledge_base: newKb } } } };
    await updateConvaiAgent(agentId, patch);

    // Verify
    const afterAgent = await getConvaiAgent(agentId);
    const afterKb: any[] = (kbLocation === "top"
      ? (afterAgent.conversation_config?.agent as any)?.knowledge_base
      : (afterAgent.conversation_config?.agent?.prompt as any)?.knowledge_base) || [];

    const fileFound = afterKb.find((doc: any) => doc.id === fileDoc.id);
    expect(fileFound).toBeDefined();
    console.log(`  CONFIRMED: file doc "${fileDoc.name}" visible in agent KB`);

    // Detach file doc from agent first (remove it from KB), then delete
    const detachedKb = afterKb.filter((doc: any) => doc.id !== fileDoc.id);
    const detachPatch = kbLocation === "top"
      ? { conversation_config: { agent: { knowledge_base: detachedKb } } }
      : { conversation_config: { agent: { prompt: { knowledge_base: detachedKb } } } };
    await updateConvaiAgent(agentId, detachPatch);
    console.log(`  Detached file doc from agent`);

    // Now safe to delete
    await deleteKBDocument(fileDoc.id);
    console.log(`  Deleted file doc: ${fileDoc.id}`);
  });

  it("7. Restore original KB and delete test document", async () => {
    // Restore original KB (without test docs)
    const patch = kbLocation === "top"
      ? { conversation_config: { agent: { knowledge_base: originalKb } } }
      : { conversation_config: { agent: { prompt: { knowledge_base: originalKb } } } };
    await updateConvaiAgent(agentId, patch);
    console.log(`  Restored agent KB to ${originalKb.length} docs`);

    // Delete the text test doc
    if (createdDocId) {
      await deleteKBDocument(createdDocId);
      console.log(`  Deleted text doc: ${createdDocId}`);
    }

    // Verify restoration
    const agent = await getConvaiAgent(agentId);
    const afterKb: any[] = (kbLocation === "top"
      ? (agent.conversation_config?.agent as any)?.knowledge_base
      : (agent.conversation_config?.agent?.prompt as any)?.knowledge_base) || [];
    expect(afterKb.length).toBe(originalKb.length);
    console.log(`  Verified: agent KB back to ${afterKb.length} docs`);
  });
});
