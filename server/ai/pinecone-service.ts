/**
 * PineconeService — Persistent vector store for knowledge base and research history.
 *
 * Index: "lb-hospitality"
 * Namespaces:
 *   knowledge-base    — Indexed docs from attached_assets + methodology files.
 *                       Persists across restarts so we don't re-embed on every boot.
 *   research-history  — Every completed research result, indexed for retrieval.
 *                       Enables "what did we learn about similar properties?" context.
 *
 * Embedding model: text-embedding-3-small (1536 dims, cosine)
 */

import { Pinecone } from "@pinecone-database/pinecone";
import { logger } from "../logger";
import { getOpenAIClient } from "./clients";

const INDEX_NAME  = "lb-hospitality";
const EMBED_MODEL = "text-embedding-3-small";
const EMBED_DIMS  = 1536;
const EMBED_BATCH = 20;

export type PineconeNamespace = "knowledge-base" | "research-history";

export interface PineconeChunk {
  id: string;
  text: string;
  metadata: Record<string, string | number | boolean>;
}

export interface QueryMatch {
  id: string;
  score: number;
  metadata: Record<string, string | number | boolean>;
}

// ── Singleton client ──────────────────────────────────────────────────────────

let _pc: Pinecone | null = null;
let _indexReady = false;

function getPC(): Pinecone {
  if (_pc) return _pc;
  const key = process.env.PINECONE_API_KEY;
  if (!key) throw new Error("PINECONE_API_KEY not configured");
  _pc = new Pinecone({ apiKey: key });
  return _pc;
}

export function isPineconeAvailable(): boolean {
  return !!process.env.PINECONE_API_KEY;
}

// ── Index lifecycle ───────────────────────────────────────────────────────────

// Mutex — prevents concurrent index creation during startup
let _ensureIndexPromise: Promise<void> | null = null;

async function ensureIndex(): Promise<void> {
  if (_indexReady) return;
  if (_ensureIndexPromise) return _ensureIndexPromise;

  _ensureIndexPromise = (async () => {
    if (_indexReady) return; // re-check after acquiring

    const pc = getPC();
    const list = await pc.listIndexes();
    const names = list.indexes?.map(i => i.name) ?? [];

    if (!names.includes(INDEX_NAME)) {
      logger.info(`Creating Pinecone index "${INDEX_NAME}"`, "pinecone");
      await pc.createIndex({
        name: INDEX_NAME,
        dimension: EMBED_DIMS,
        metric: "cosine",
        spec: { serverless: { cloud: "aws", region: "us-east-1" } },
      });
      // Wait for index to initialise
      await new Promise(r => setTimeout(r, 8_000));
      logger.info(`Pinecone index "${INDEX_NAME}" ready`, "pinecone");
    }

    _indexReady = true;
  })().finally(() => { _ensureIndexPromise = null; });

  return _ensureIndexPromise;
}

// ── Embedding helpers ─────────────────────────────────────────────────────────

async function embed(text: string): Promise<number[]> {
  const res = await getOpenAIClient().embeddings.create({
    model: EMBED_MODEL,
    input: text.slice(0, 8_000),
  });
  return res.data[0].embedding;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const batch = texts.slice(i, i + EMBED_BATCH).map(t => t.slice(0, 8_000));
    const res = await getOpenAIClient().embeddings.create({ model: EMBED_MODEL, input: batch });
    out.push(...res.data.map((d: { embedding: number[] }) => d.embedding));
  }
  return out;
}

// ── Core operations ───────────────────────────────────────────────────────────

/**
 * Upsert text chunks — embeds each and uploads to the given namespace.
 * Metadata must fit within Pinecone's 40KB per-vector limit.
 * Store `content` in metadata so retrieval needs no secondary lookup.
 */
export async function upsertChunks(
  namespace: PineconeNamespace,
  chunks: PineconeChunk[],
): Promise<void> {
  if (!isPineconeAvailable() || chunks.length === 0) return;
  await ensureIndex();

  const embeddings = await embedBatch(chunks.map(c => c.text));
  const index = getPC().index(INDEX_NAME).namespace(namespace);

  for (let i = 0; i < chunks.length; i += 100) {
    const records = chunks.slice(i, i + 100).map((c, j) => ({
      id:       c.id,
      values:   embeddings[i + j],
      metadata: c.metadata,
    }));
    await index.upsert({ records } as any);
  }
}

/**
 * Query by natural-language text — returns top-K matches with scores and metadata.
 */
export async function queryChunks(
  namespace: PineconeNamespace,
  query: string,
  topK = 8,
): Promise<QueryMatch[]> {
  if (!isPineconeAvailable()) return [];
  await ensureIndex();

  const vector = await embed(query);
  const index  = getPC().index(INDEX_NAME).namespace(namespace);
  const res    = await index.query({ vector, topK, includeMetadata: true });

  return (res.matches ?? []).map(m => ({
    id:       m.id,
    score:    m.score ?? 0,
    metadata: (m.metadata ?? {}) as Record<string, string | number | boolean>,
  }));
}

/**
 * Returns the vector count for a namespace — used to skip re-indexing.
 */
export async function vectorCount(namespace: PineconeNamespace): Promise<number> {
  if (!isPineconeAvailable()) return 0;
  try {
    await ensureIndex();
    const stats = await getPC().index(INDEX_NAME).describeIndexStats();
    return stats.namespaces?.[namespace]?.recordCount ?? 0;
  } catch {
    return 0;
  }
}

// ── Research history ──────────────────────────────────────────────────────────

/**
 * Index a completed research result so future research on similar properties
 * can retrieve it as prior-knowledge context.
 */
export async function indexResearchResult(params: {
  propertyId?: number;
  location: string;
  propertyType: string;
  type: "property" | "company" | "global";
  /** A compact textual summary of key findings — what gets embedded. */
  summary: string;
  keyMetrics?: Record<string, number>;
  completedAt: string;
}): Promise<void> {
  if (!isPineconeAvailable()) return;

  const id   = `research:${params.type}:${params.location.toLowerCase().replace(/\s+/g, "-")}:${Date.now()}`;
  const text = `${params.location} ${params.propertyType} ${params.type} research\n\n${params.summary}`;

  const metricFields: Record<string, number> = {};
  for (const [k, v] of Object.entries(params.keyMetrics ?? {})) {
    metricFields[`metric_${k}`] = v;
  }

  await upsertChunks("research-history", [{
    id,
    text,
    metadata: {
      propertyId:   params.propertyId ?? 0,
      location:     params.location,
      propertyType: params.propertyType,
      type:         params.type,
      completedAt:  params.completedAt,
      summary:      params.summary.slice(0, 2_000),
      ...metricFields,
    },
  }]);

  logger.info(`Indexed research result for ${params.location} (${params.type})`, "pinecone");
}

/**
 * Retrieve the most similar past research results by location + property type.
 * Used to prime analyst prompts with prior knowledge.
 */
export async function retrieveSimilarResearch(
  location: string,
  propertyType: string,
  type: "property" | "company" | "global",
  topK = 3,
): Promise<QueryMatch[]> {
  const query = `${location} ${propertyType} ${type} hospitality research market analysis ADR occupancy cap rate`;
  return queryChunks("research-history", query, topK);
}
