/**
 * Knowledge Base sync workflow.
 * Demonstrates how to keep an agent's knowledge base in sync
 * with your application data.
 */
import { ElevenLabsClient } from "elevenlabs";

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

/**
 * Sync a JSON data source to the knowledge base as a formatted text document.
 */
async function syncDataToKnowledgeBase(
  agentId: string,
  docName: string,
  data: Record<string, unknown>
) {
  const text = formatDataAsText(data);

  const existingDocs =
    await client.conversationalAi.knowledgeBase.documents.list({
      search: docName,
      pageSize: 100,
    });

  const existing = (existingDocs as any).documents?.find(
    (d: any) => d.name === docName
  );

  if (existing) {
    await client.conversationalAi.knowledgeBase.documents.delete(existing.id);
  }

  const doc =
    await client.conversationalAi.knowledgeBase.documents.createFromText({
      name: docName,
      text,
    });

  const agent = await client.conversationalAi.agents.get(agentId);
  const currentKB =
    (agent as any).conversation_config?.agent?.prompt?.knowledge_base || [];
  const updatedKB = currentKB.filter((d: any) => d.name !== docName);
  updatedKB.push({ type: "text", name: docName, id: (doc as any).id });

  await client.conversationalAi.agents.update(agentId, {
    conversationConfig: {
      agent: { prompt: { knowledgeBase: updatedKB } },
    },
  });

  return doc;
}

/**
 * Sync multiple URLs to the knowledge base.
 */
async function syncUrlsToKnowledgeBase(
  agentId: string,
  urls: Array<{ name: string; url: string }>
) {
  const docs = [];

  for (const { name, url } of urls) {
    const existingDocs =
      await client.conversationalAi.knowledgeBase.documents.list({
        search: name,
        pageSize: 10,
      });

    const existing = (existingDocs as any).documents?.find(
      (d: any) => d.name === name
    );

    if (existing) {
      await client.conversationalAi.knowledgeBase.documents.delete(
        existing.id
      );
    }

    const doc =
      await client.conversationalAi.knowledgeBase.documents.createFromUrl({
        name,
        url,
      });

    docs.push({ type: "url" as const, name, id: (doc as any).id });
  }

  const agent = await client.conversationalAi.agents.get(agentId);
  const currentKB =
    (agent as any).conversation_config?.agent?.prompt?.knowledge_base || [];
  const existingNames = new Set(docs.map((d) => d.name));
  const keptKB = currentKB.filter((d: any) => !existingNames.has(d.name));
  const updatedKB = [...keptKB, ...docs];

  await client.conversationalAi.agents.update(agentId, {
    conversationConfig: {
      agent: { prompt: { knowledgeBase: updatedKB } },
    },
  });

  return docs;
}

/**
 * Format structured data as readable text for the knowledge base.
 */
function formatDataAsText(data: Record<string, unknown>): string {
  const lines: string[] = [];

  function flatten(obj: any, prefix = "") {
    for (const [key, value] of Object.entries(obj)) {
      const label = prefix ? `${prefix} > ${key}` : key;
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        flatten(value, label);
      } else if (Array.isArray(value)) {
        lines.push(`${label}:`);
        value.forEach((item, i) => {
          if (typeof item === "object") {
            lines.push(`  Item ${i + 1}:`);
            flatten(item, `    `);
          } else {
            lines.push(`  - ${item}`);
          }
        });
      } else {
        lines.push(`${label}: ${value}`);
      }
    }
  }

  flatten(data);
  return lines.join("\n");
}

/**
 * Schedule periodic sync (e.g., every hour).
 */
function schedulePeriodicSync(
  agentId: string,
  docName: string,
  dataFetcher: () => Promise<Record<string, unknown>>,
  intervalMs: number = 3600000
) {
  const sync = async () => {
    try {
      const data = await dataFetcher();
      await syncDataToKnowledgeBase(agentId, docName, data);
      console.log(`[${new Date().toISOString()}] KB sync complete: ${docName}`);
    } catch (error: any) {
      console.error(`KB sync failed: ${error.message}`);
    }
  };

  sync();
  return setInterval(sync, intervalMs);
}

export {
  syncDataToKnowledgeBase,
  syncUrlsToKnowledgeBase,
  formatDataAsText,
  schedulePeriodicSync,
};
