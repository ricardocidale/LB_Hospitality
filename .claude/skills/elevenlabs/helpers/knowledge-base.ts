import type { ElevenLabsClient } from "elevenlabs";
import { getClient } from "./client";

export async function listDocuments(
  options?: { search?: string; pageSize?: number; cursor?: string },
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.conversationalAi.knowledgeBase.documents.list({
    search: options?.search,
    pageSize: options?.pageSize || 20,
    cursor: options?.cursor,
  });
}

export async function getDocument(documentId: string, client?: ElevenLabsClient) {
  const c = client || getClient();
  return c.conversationalAi.knowledgeBase.documents.get(documentId);
}

export async function createDocumentFromText(
  name: string,
  text: string,
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.conversationalAi.knowledgeBase.documents.createFromText({
    name,
    text,
  });
}

export async function createDocumentFromUrl(
  name: string,
  url: string,
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.conversationalAi.knowledgeBase.documents.createFromUrl({
    name,
    url,
  });
}

export async function createDocumentFromFile(
  name: string,
  filePath: string,
  client?: ElevenLabsClient
) {
  const fs = await import("fs");
  const c = client || getClient();
  return c.conversationalAi.knowledgeBase.documents.createFromFile({
    name,
    file: fs.createReadStream(filePath) as any,
  });
}

export async function deleteDocument(documentId: string, client?: ElevenLabsClient) {
  const c = client || getClient();
  return c.conversationalAi.knowledgeBase.documents.delete(documentId);
}

export async function attachDocumentsToAgent(
  agentId: string,
  documents: Array<{ type: "text" | "url" | "file"; name: string; id: string }>,
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.conversationalAi.agents.update(agentId, {
    conversationConfig: {
      agent: {
        prompt: {
          knowledgeBase: documents,
        },
      },
    },
  });
}

export async function syncTextDocument(
  agentId: string,
  name: string,
  text: string,
  existingDocId?: string,
  client?: ElevenLabsClient
) {
  const c = client || getClient();

  if (existingDocId) {
    try {
      await deleteDocument(existingDocId, c);
    } catch {
      // Document may not exist
    }
  }

  const doc = await createDocumentFromText(name, text, c);

  const agent = await c.conversationalAi.agents.get(agentId);
  const existingKB =
    (agent as any).conversation_config?.agent?.prompt?.knowledge_base || [];

  const updatedKB = existingKB.filter((d: any) => d.name !== name);
  updatedKB.push({ type: "text", name, id: doc.id });

  await attachDocumentsToAgent(agentId, updatedKB, c);

  return doc;
}

export async function getRagOverview(client?: ElevenLabsClient) {
  const c = client || getClient();
  return c.conversationalAi.ragIndexOverview();
}

export async function getDocumentRagIndexes(
  documentId: string,
  client?: ElevenLabsClient
) {
  const c = client || getClient();
  return c.conversationalAi.getDocumentRagIndexes(documentId);
}
