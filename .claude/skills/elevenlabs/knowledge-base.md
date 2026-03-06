# ElevenLabs Knowledge Base & RAG

## Overview

Knowledge bases equip agents with domain-specific information beyond pre-trained data. Documents are uploaded via API or dashboard and used during conversations.

## Use Cases

- Product catalogs with specs and pricing
- HR/corporate policies
- Technical documentation and API references
- Customer FAQs
- Financial data and property details (HBG use case)

## Managing Documents via API

### Create from text
```typescript
const doc = await elevenlabs.conversational_ai.knowledge_base.documents.create_from_text({
  text: "Property details and financial projections...",
  name: "Portfolio Properties",
});
```

### Create from URL
```typescript
const doc = await elevenlabs.conversational_ai.knowledge_base.documents.create_from_url({
  url: "https://example.com/documentation",
  name: "External Documentation",
});
```

### Create from file
```typescript
const doc = await elevenlabs.conversational_ai.knowledge_base.documents.create_from_file({
  file: fileBuffer,
  name: "Financial Report",
});
```

### Attach documents to agent
```typescript
await elevenlabs.conversational_ai.agents.update(agentId, {
  conversation_config: {
    agent: {
      prompt: {
        knowledge_base: [
          { type: "text", name: doc.name, id: doc.id },
          { type: "url", name: urlDoc.name, id: urlDoc.id },
          { type: "file", name: fileDoc.name, id: fileDoc.id },
        ],
      },
    },
  },
});
```

## RAG (Retrieval-Augmented Generation)

RAG enables agents to access large knowledge bases efficiently by retrieving only relevant chunks per query, rather than loading entire documents into the context window.

### How RAG Works

1. **Query processing** — user question is analyzed and reformulated
2. **Embedding generation** — query converted to vector embedding
3. **Retrieval** — finds most semantically similar content from knowledge base
4. **Response generation** — agent uses conversation context + retrieved information

### Benefits
- Access larger knowledge bases than fit in a prompt
- More accurate, knowledge-grounded responses
- Reduced hallucinations
- Scale knowledge without multiple specialized agents

### RAG Configuration

Enable in agent settings → Knowledge Base → toggle "Use RAG".

Advanced settings (in Advanced tab):
- **Embedding model** — model for converting text to vectors
- **Maximum document chunks** — max retrieved content per query
- **Maximum vector distance** — max distance between query and retrieved chunks

### Performance Notes
- RAG adds ~500ms latency per response
- More chunks = higher LLM cost
- Larger vector distance = more context but potentially less relevant
- Balance chunk count and distance for optimal results

## Best Practices

1. **Content quality** — provide clear, well-structured information relevant to agent's purpose
2. **Size management** — break large documents into smaller, focused pieces
3. **Regular updates** — review and update knowledge base regularly
4. **Naming** — use descriptive document names for easier management
