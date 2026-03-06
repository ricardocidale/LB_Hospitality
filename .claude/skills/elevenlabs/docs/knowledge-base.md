# ElevenLabs Knowledge Base & RAG

## Overview

Knowledge bases equip agents with domain-specific information beyond pre-trained data. Documents are indexed for RAG (Retrieval-Augmented Generation) and used during conversations.

## Document Types

| Type | Method | Use Case |
|------|--------|----------|
| Text | `createFromText` | Inline content, generated data |
| URL | `createFromUrl` | Web pages, documentation |
| File | `createFromFile` | PDFs, docs, spreadsheets |

## Managing Documents

### Create from Text
```typescript
const doc = await client.conversationalAi.knowledgeBase.documents.createFromText({
  text: "Product catalog and pricing information...",
  name: "Product Catalog",
});
```

### Create from URL
```typescript
const doc = await client.conversationalAi.knowledgeBase.documents.createFromUrl({
  url: "https://example.com/docs",
  name: "API Documentation",
});
```

### Create from File
```typescript
import fs from "fs";

const doc = await client.conversationalAi.knowledgeBase.documents.createFromFile({
  file: fs.createReadStream("report.pdf"),
  name: "Annual Report",
});
```

### List Documents
```typescript
const docs = await client.conversationalAi.knowledgeBase.documents.list({
  search: "product",
  pageSize: 20,
});

for (const doc of docs.documents) {
  console.log(`${doc.name} (${doc.id}) — ${doc.type}`);
}
```

### Get Document Details
```typescript
const doc = await client.conversationalAi.knowledgeBase.documents.get("document_id");
```

### Delete Document
```typescript
await client.conversationalAi.knowledgeBase.documents.delete("document_id");
```

## Attaching Documents to Agents

After creating documents, attach them to an agent:
```typescript
await client.conversationalAi.agents.update("agent_id", {
  conversationConfig: {
    agent: {
      prompt: {
        knowledgeBase: [
          { type: "text", name: "Product Catalog", id: textDoc.id },
          { type: "url", name: "API Docs", id: urlDoc.id },
          { type: "file", name: "Report", id: fileDoc.id },
        ],
      },
    },
  },
});
```

## Agent Knowledge Base Size

```typescript
const size = await client.conversationalAi.agents.knowledgeBase.size("agent_id");
console.log(`${size.num_pages} pages in knowledge base`);
```

## RAG (Retrieval-Augmented Generation)

### How RAG Works

1. **Query processing** — user question is analyzed and reformulated
2. **Embedding generation** — query converted to vector embedding
3. **Retrieval** — finds most semantically similar chunks from knowledge base
4. **Response generation** — agent uses conversation context + retrieved information

### RAG Configuration

Enable in agent settings:
- **Embedding model** — model for vectorization
- **Maximum document chunks** — max retrieved content per query
- **Maximum vector distance** — relevance threshold

### Performance

- RAG adds ~500ms latency per response
- More chunks = higher LLM token cost
- Balance chunk count and distance for optimal quality vs cost
- Small, focused documents outperform large monolithic ones

## RAG Index Management

### Overview
```typescript
const overview = await client.conversationalAi.ragIndexOverview();
console.log(`Total RAG size: ${overview.total_size_bytes} bytes`);
```

### Document-Level Indexes
```typescript
const indexes = await client.conversationalAi.getDocumentRagIndexes("document_id");
```

## Document Summaries

```typescript
const summaries = await client.conversationalAi.knowledgeBase.documents.summaries.list();
```

## Document Chunks

Access individual chunks of a document:
```typescript
const chunks = await client.conversationalAi.knowledgeBase.documents.chunk.list("document_id");
```

## Best Practices

1. **Content quality** — provide clear, well-structured information
2. **Size management** — break large documents into smaller, focused pieces
3. **Regular updates** — keep knowledge base current
4. **Descriptive naming** — use clear names for easier management
5. **Test retrieval** — verify the agent retrieves relevant chunks for common queries
6. **Avoid duplication** — don't add the same information in multiple documents
7. **System prompt guidance** — instruct the agent when/how to use knowledge base content
