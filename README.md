# RAG Multi-Tenant Knowledge Hub

A production-ready, multi-tenant RAG (Retrieval-Augmented Generation) knowledge base system with document ingestion, vector search, and a modern web dashboard.

## Features

- **Multi-Tenant Architecture**: Isolate knowledge bases by tenant with API key authentication
- **Document Ingestion**: Ingest content from text, URLs, and files (file support coming soon)
- **Vector Search**: Semantic search powered by pgvector and OpenAI embeddings
- **Modern Stack**: Fastify backend, Next.js frontend, Prisma ORM, PostgreSQL with pgvector
- **Query Playground**: Interactive UI for testing queries and viewing results
- **API-First Design**: RESTful API for easy integration with other applications

## Architecture

### Tech Stack

**Backend:**
- [Fastify](https://www.fastify.io/) - Fast and low overhead web framework
- [Prisma](https://www.prisma.io/) - Type-safe ORM with PostgreSQL
- [pgvector](https://github.com/pgvector/pgvector) - Vector similarity search in PostgreSQL
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings) - text-embedding-3-small model
- TypeScript for type safety

**Frontend:**
- [Next.js 15](https://nextjs.org/) - React framework with App Router
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- TypeScript

**Database:**
- PostgreSQL with pgvector extension
- Docker Compose for local development

### Schema

```prisma
Tenant
  - id, name, apiKey, createdAt, updatedAt
  - knowledgeBases: KnowledgeBase[]

KnowledgeBase
  - id, tenantId, name, description, createdAt, updatedAt
  - documents: Document[]
  - chunks: Chunk[]
  - queryLogs: QueryLog[]

Document
  - id, kbId, sourceType (file|url|text), sourceMetaJson, createdAt
  - chunks: Chunk[]

Chunk
  - id, documentId, kbId, content, embedding (vector[1536]), metadataJson, createdAt

QueryLog
  - id, kbId, queryText, resultsJson, createdAt
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose (for local PostgreSQL)
- OpenAI API key

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd rag-multi-tenant-knowledge-hub
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**

   **Backend (`backend/.env`):**
   ```bash
   cp backend/.env.example backend/.env
   ```

   Edit `backend/.env`:
   ```env
   DATABASE_URL="postgresql://rag_user:rag_password@localhost:5432/rag_knowledge_hub?schema=public"
   PORT=3001
   HOST=0.0.0.0
   OPENAI_API_KEY=sk-your-openai-api-key-here
   DEFAULT_TOP_K=5
   CHUNK_SIZE=500
   CHUNK_OVERLAP=50
   ```

   **Frontend (`frontend/.env.local`):**
   ```bash
   cp frontend/.env.example frontend/.env.local
   ```

   Edit `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

4. **Start PostgreSQL with Docker:**
   ```bash
   npm run docker:up
   ```

5. **Run Prisma migrations:**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   cd ..
   ```

6. **Start the development servers:**
   ```bash
   # In one terminal, start backend:
   npm run dev:backend

   # In another terminal, start frontend:
   npm run dev:frontend

   # Or run both concurrently:
   npm run dev
   ```

7. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Health Check: http://localhost:3001/health

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Tenants

#### List all tenants
```http
GET /api/tenants
```

Response:
```json
{
  "tenants": [
    {
      "id": "clx1234...",
      "name": "ACME Corp",
      "apiKey": "clx5678...",
      "createdAt": "2025-01-15T10:00:00Z",
      "knowledgeBases": [...]
    }
  ]
}
```

#### Create a tenant
```http
POST /api/tenants
Content-Type: application/json

{
  "name": "ACME Corp"
}
```

#### Get tenant by ID
```http
GET /api/tenants/:id
```

#### Delete tenant
```http
DELETE /api/tenants/:id
```

### Knowledge Bases

#### List knowledge bases
```http
GET /api/kb?tenantId=clx1234...
```

#### Create knowledge base
```http
POST /api/kb
Content-Type: application/json

{
  "tenantId": "clx1234...",
  "name": "Product Documentation",
  "description": "All product docs and guides"
}
```

#### Get knowledge base by ID
```http
GET /api/kb/:id
```

#### Delete knowledge base
```http
DELETE /api/kb/:id
```

### Ingestion

#### Ingest text
```http
POST /api/kb/:id/ingest/text
Content-Type: application/json

{
  "text": "Your long text content here...",
  "metadata": {
    "source": "manual_entry",
    "author": "John Doe"
  }
}
```

Response:
```json
{
  "document": {
    "id": "clx9012...",
    "chunksCreated": 5
  }
}
```

#### Ingest URL
```http
POST /api/kb/:id/ingest/url
Content-Type: application/json

{
  "url": "https://example.com/article",
  "metadata": {
    "category": "blog"
  }
}
```

#### Ingest file (TODO - Not yet implemented)
```http
POST /api/kb/:id/ingest/file
Content-Type: multipart/form-data
```

**Note:** File upload is currently a stub. To implement:
1. Add file parsing libraries (pdf-parse, mammoth, etc.)
2. Process uploaded files using @fastify/multipart
3. Extract text and follow the same chunking/embedding flow

### Query

#### Query knowledge base
```http
POST /api/kb/:id/query
Content-Type: application/json

{
  "query": "How do I reset my password?",
  "topK": 5,
  "includeMetadata": true
}
```

Response:
```json
{
  "query": "How do I reset my password?",
  "results": [
    {
      "id": "clx3456...",
      "content": "To reset your password, go to settings...",
      "similarity": 0.89,
      "documentId": "clx7890...",
      "metadata": {
        "chunkIndex": 0,
        "url": "https://example.com/help"
      }
    }
  ],
  "resultCount": 5
}
```

#### Get query logs
```http
GET /api/kb/:id/queries?limit=50
```

## Integration Guide

### Using RAG Hub as a Backend for Other Apps

The RAG Knowledge Hub is designed to be used as a backend service for AI applications like chatbots, documentation assistants, or tools like `ai-exec-os-core`.

#### Example Integration Flow:

1. **Create a tenant for your app:**
   ```javascript
   const response = await fetch('http://localhost:3001/api/tenants', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ name: 'My AI App' })
   });
   const { tenant } = await response.json();
   const tenantId = tenant.id;
   ```

2. **Create a knowledge base:**
   ```javascript
   const kbResponse = await fetch('http://localhost:3001/api/kb', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       tenantId,
       name: 'User Documentation',
       description: 'Help docs and FAQs'
     })
   });
   const { knowledgeBase } = await kbResponse.json();
   const kbId = knowledgeBase.id;
   ```

3. **Ingest your documents:**
   ```javascript
   // Ingest from URL
   await fetch(`http://localhost:3001/api/kb/${kbId}/ingest/url`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       url: 'https://docs.example.com/getting-started'
     })
   });

   // Or ingest text directly
   await fetch(`http://localhost:3001/api/kb/${kbId}/ingest/text`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       text: 'Your documentation content...'
     })
   });
   ```

4. **Query in your application:**
   ```javascript
   async function getRelevantContext(userQuery) {
     const response = await fetch(`http://localhost:3001/api/kb/${kbId}/query`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         query: userQuery,
         topK: 3
       })
     });

     const { results } = await response.json();

     // Use results as context for your LLM
     const context = results.map(r => r.content).join('\n\n');
     return context;
   }
   ```

5. **Use with LLM (e.g., in ai-exec-os-core):**
   ```javascript
   const userQuery = "How do I configure the database?";
   const context = await getRelevantContext(userQuery);

   const llmPrompt = `
   Use the following context to answer the question:

   ${context}

   Question: ${userQuery}
   `;

   // Send to your LLM (OpenAI, Anthropic, etc.)
   const answer = await llm.complete(llmPrompt);
   ```

### Environment-Specific Configuration

**Production Deployment:**
- Set `DATABASE_URL` to your production PostgreSQL instance
- Use environment variables for sensitive data
- Enable CORS only for your frontend domain
- Consider implementing API key authentication for tenant access
- Set up proper logging and monitoring

**Docker Deployment:**
```bash
docker-compose up -d
```

## Development

### Project Structure

```
rag-multi-tenant-knowledge-hub/
├── backend/
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic (embeddings, text splitting)
│   │   ├── config.ts       # Configuration
│   │   ├── db.ts           # Prisma client
│   │   └── index.ts        # Server entry point
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js app routes
│   │   │   ├── tenants/   # Tenant management page
│   │   │   ├── kb/        # Knowledge base pages
│   │   │   └── layout.tsx # Root layout
│   │   └── lib/
│   │       └── api.ts     # API client
│   └── package.json
├── docker-compose.yml      # Local PostgreSQL
└── package.json           # Workspace root
```

### Running Tests

```bash
# Backend tests (to be implemented)
cd backend
npm test

# Frontend tests (to be implemented)
cd frontend
npm test
```

### Database Management

**View database in Prisma Studio:**
```bash
npm run prisma:studio
```

**Create a new migration:**
```bash
cd backend
npx prisma migrate dev --name your_migration_name
```

**Reset database:**
```bash
cd backend
npx prisma migrate reset
```

## How It Works

### Text Chunking

Documents are split into chunks of approximately 500 characters (configurable) with 50 characters of overlap to preserve context across chunk boundaries.

### Embeddings

Each chunk is converted to a 1536-dimensional vector using OpenAI's `text-embedding-3-small` model. These embeddings capture the semantic meaning of the text.

### Vector Search

When you query the knowledge base:
1. Your query is converted to an embedding vector
2. pgvector performs cosine similarity search to find the most similar chunks
3. Results are ranked by similarity score
4. Top-k most relevant chunks are returned

### Multi-Tenancy

Each tenant has isolated knowledge bases. Use the tenant ID when creating knowledge bases to ensure proper data isolation.

## Roadmap

- [ ] File upload support (PDF, DOCX, TXT, etc.)
- [ ] Authentication middleware with API key validation
- [ ] Rate limiting
- [ ] Chunk reranking with cross-encoder models
- [ ] Support for custom embedding models
- [ ] Batch ingestion API
- [ ] Webhook notifications for ingestion completion
- [ ] Analytics dashboard
- [ ] Export knowledge base data

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

## Acknowledgments

- OpenAI for embeddings API
- pgvector for PostgreSQL vector support
- Fastify and Next.js communities
