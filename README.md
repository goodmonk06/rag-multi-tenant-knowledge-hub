# RAG Multi-Tenant Knowledge Hub

A production-ready, multi-tenant RAG (Retrieval-Augmented Generation) knowledge base system with document ingestion, vector search, and a modern web dashboard. Built with TypeScript, Fastify, Next.js, and PostgreSQL with pgvector.

## Overview

This project provides a complete, scalable solution for building RAG-powered applications. It supports multiple tenants, each with isolated knowledge bases, and offers semantic search using vector embeddings. Perfect for documentation systems, customer support, or as a backend for AI-powered applications.

**Key Capabilities:**
- Multi-tenant architecture with complete data isolation
- Document ingestion from text, URLs, and files (file support planned)
- Automatic text chunking and embedding generation
- Semantic vector search with configurable similarity ranking
- Interactive query playground in web UI
- RESTful API for easy integration
- Full test coverage with Vitest
- Docker support for local development and production deployment

## Features

- **Multi-Tenant Architecture**: Isolate knowledge bases by tenant with API key authentication
- **Document Ingestion**: Ingest content from text, URLs, and file uploads
- **Vector Search**: Semantic search powered by pgvector and OpenAI embeddings (text-embedding-3-small)
- **Modern Stack**: Fastify backend, Next.js 15 frontend, Prisma ORM, PostgreSQL with pgvector
- **Query Playground**: Interactive UI for testing queries and viewing similarity scores
- **API-First Design**: RESTful API for integration with external applications
- **Comprehensive Testing**: Unit and integration tests with Vitest
- **Production Ready**: Docker support, error handling, logging, and monitoring hooks

## Tech Stack

### Backend
- [Fastify](https://www.fastify.io/) - Fast and low overhead web framework
- [Prisma](https://www.prisma.io/) - Type-safe ORM with PostgreSQL
- [pgvector](https://github.com/pgvector/pgvector) - Vector similarity search in PostgreSQL
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings) - text-embedding-3-small (1536 dimensions)
- [Zod](https://zod.dev/) - Schema validation
- [Vitest](https://vitest.dev/) - Unit testing framework
- TypeScript for type safety

### Frontend
- [Next.js 15](https://nextjs.org/) - React framework with App Router
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- TypeScript

### Database & Infrastructure
- PostgreSQL 16 with pgvector extension
- Docker & Docker Compose for containerization
- ESLint & Prettier for code quality

## Domain Model

```
Tenant (1 → N)
  ├─ id, name, apiKey, timestamps
  └─ KnowledgeBase[] (1 → N)
       ├─ id, name, description, timestamps
       ├─ Document[] (1 → N)
       │    ├─ id, sourceType (text|url|file), sourceMetaJson
       │    └─ Chunk[] (1 → N)
       │         └─ id, content, embedding (vector[1536]), metadataJson
       ├─ Chunk[] (all chunks across documents)
       └─ QueryLog[] (search history)
```

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm 9+
- **Docker & Docker Compose** (recommended for easiest setup)
- **OpenAI API key** ([Get one here](https://platform.openai.com/api-keys))

### Quick Start (Recommended)

The fastest way to get started is using our one-command setup:

```bash
# 1. Clone the repository
git clone <repository-url>
cd rag-multi-tenant-knowledge-hub

# 2. Copy environment files
cp backend/.env.example backend/.env
# Edit backend/.env and add your OPENAI_API_KEY

# 3. Run setup (installs deps, starts DB, runs migrations)
npm run setup

# 4. Seed the database with demo data
npm run db:seed

# 5. Start development servers
npm run dev
```

Visit:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health**: http://localhost:3001/health

### Manual Setup

If you prefer to set up each component individually:

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Configure Environment Variables

**Backend** (`backend/.env`):
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

**Frontend** (`frontend/.env.local`):
```bash
cp frontend/.env.example frontend/.env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

#### 3. Start PostgreSQL

**Option A: Docker (Recommended)**
```bash
npm run docker:up
```

**Option B: Local PostgreSQL**
- Install PostgreSQL 16 with pgvector extension
- Create database `rag_knowledge_hub`
- Update `DATABASE_URL` in `backend/.env`

#### 4. Initialize Database

```bash
cd backend
npx prisma generate
npx prisma db push
cd ..
```

#### 5. Seed Demo Data (Optional)

```bash
npm run db:seed
```

This creates:
- 2 demo tenants: "Acme Corporation" and "TechStart Inc"
- 3 knowledge bases with sample RAG documentation
- ~20 embedded document chunks

#### 6. Start Development Servers

```bash
# Start both backend and frontend
npm run dev

# Or start individually:
npm run dev:backend   # Runs on :3001
npm run dev:frontend  # Runs on :3000
```

## Usage

### Web Dashboard

1. **Create a Tenant** (http://localhost:3000/tenants)
   - Click "Create Tenant" and enter a name
   - Note the generated API key for programmatic access

2. **Create a Knowledge Base** (http://localhost:3000/kb)
   - Select the tenant
   - Enter name and description

3. **Ingest Documents** (http://localhost:3000/kb/[id])
   - Go to "Ingest" tab
   - Add text directly or paste a URL
   - Documents are automatically chunked and embedded

4. **Query the Knowledge Base** (http://localhost:3000/kb/[id])
   - Go to "Query" tab
   - Enter your question
   - Adjust top-k results slider
   - View results with similarity scores

### Example: End-to-End Vertical Slice

After running `npm run db:seed`, try this flow:

1. Visit http://localhost:3000/tenants
2. Find "Acme Corporation" tenant
3. Click "View KBs" → Open "RAG Documentation"
4. Go to "Query" tab
5. Search: "What is RAG?"
6. See semantic results from embedded documentation

**Expected Result**: 3-5 relevant chunks about RAG concepts, each with >80% similarity score.

## API Documentation

### Base URL
```
http://localhost:3001/api
```

All responses follow this format:
```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "timestamp": "2025-01-15T10:00:00Z" }
}

// Error
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }  // Optional
  },
  "meta": { "timestamp": "2025-01-15T10:00:00Z" }
}
```

### Endpoints

#### Tenants
```http
GET    /api/tenants              # List all tenants
POST   /api/tenants              # Create tenant
GET    /api/tenants/:id          # Get tenant by ID
DELETE /api/tenants/:id          # Delete tenant
```

#### Knowledge Bases
```http
GET    /api/kb?tenantId=xxx      # List KBs (optionally filtered)
POST   /api/kb                   # Create KB
GET    /api/kb/:id               # Get KB details
DELETE /api/kb/:id               # Delete KB
```

#### Ingestion
```http
POST   /api/kb/:id/ingest/text   # Ingest text
POST   /api/kb/:id/ingest/url    # Ingest from URL
POST   /api/kb/:id/ingest/file   # File upload (TODO)
```

#### Query
```http
POST   /api/kb/:id/query         # Semantic search
GET    /api/kb/:id/queries       # Get query logs
```

### Example API Usage

```bash
# Create a tenant
curl -X POST http://localhost:3001/api/tenants \
  -H "Content-Type: application/json" \
  -d '{"name": "My Company"}'

# Create a knowledge base
curl -X POST http://localhost:3001/api/kb \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "clx123...",
    "name": "Product Docs",
    "description": "Internal documentation"
  }'

# Ingest text
curl -X POST http://localhost:3001/api/kb/clx456.../ingest/text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Your long document content here...",
    "metadata": {"source": "manual"}
  }'

# Query
curl -X POST http://localhost:3001/api/kb/clx456.../query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I reset my password?",
    "topK": 3,
    "includeMetadata": true
  }'
```

## Integration with External Apps

### Using as a RAG Backend for AI Applications

This knowledge hub is designed to serve as a RAG backend for other applications (e.g., chatbots, AI assistants, `ai-exec-os-core`).

**Integration Pattern:**

```typescript
// 1. Set up tenant and KB (one-time)
const tenant = await createTenant({ name: 'My AI App' });
const kb = await createKB({
  tenantId: tenant.id,
  name: 'App Knowledge Base'
});

// 2. Ingest your documentation
await ingestDocuments(kb.id, yourDocuments);

// 3. Query for context in your app
async function getRAGContext(userQuery: string) {
  const response = await fetch(
    `http://localhost:3001/api/kb/${kb.id}/query`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: userQuery, topK: 3 })
    }
  );

  const { data } = await response.json();
  return data.results.map(r => r.content).join('\n\n');
}

// 4. Use context with your LLM
const context = await getRAGContext("How do I configure X?");
const prompt = `Context:\n${context}\n\nQuestion: ${userQuery}`;
const answer = await llm.complete(prompt);
```

## Development

### Project Structure

```
rag-multi-tenant-knowledge-hub/
├── backend/                    # Fastify API server
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Error handling, etc.
│   │   ├── types/             # TypeScript types
│   │   ├── scripts/           # Utility scripts (seed, etc.)
│   │   └── test/              # Test setup
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── vitest.config.ts       # Test configuration
│   └── Dockerfile
├── frontend/                   # Next.js web app
│   ├── src/
│   │   ├── app/               # Next.js app router pages
│   │   └── lib/               # API client, utilities
│   ├── tailwind.config.ts
│   └── Dockerfile
├── docker-compose.yml          # Production compose
├── docker-compose.dev.yml      # Dev-only DB
└── package.json               # Workspace root
```

### Available Scripts

**Root Level:**
```bash
npm run dev              # Start backend + frontend concurrently
npm run build            # Build both backend and frontend
npm run test             # Run backend tests
npm run test:watch       # Run tests in watch mode
npm run lint             # Lint all code
npm run lint:fix         # Auto-fix linting issues
npm run format           # Format code with Prettier
npm run typecheck        # TypeScript type checking

# Database
npm run db:push          # Push schema to database
npm run db:seed          # Seed demo data
npm run db:studio        # Open Prisma Studio

# Docker
npm run docker:up        # Start all services (postgres + backend + frontend)
npm run docker:down      # Stop all services
npm run docker:build     # Build Docker images
npm run docker:logs      # View logs

# Setup
npm run setup            # One-command setup (install + db init)
```

**Backend Workspace:**
```bash
cd backend
npm run dev              # Start dev server with hot reload
npm run build            # Compile TypeScript
npm run start            # Run production build
npm test                 # Run tests
npm run test:coverage    # Run tests with coverage
npm run lint             # Lint backend code
npm run db:seed          # Seed database
```

**Frontend Workspace:**
```bash
cd frontend
npm run dev              # Start Next.js dev server
npm run build            # Build for production
npm start                # Run production build
npm run lint             # Lint frontend code
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
cd backend && npm run test:coverage

# Test specific file
cd backend && npx vitest run src/services/__tests__/text-splitter.test.ts
```

Current test coverage:
- Text splitter service (10 tests)
- Embeddings service (6 tests)
- Error classes (7 tests)
- Response helpers (8 tests)

### Code Quality

```bash
# Lint all code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run typecheck
```

## Docker Deployment

### Development (Database Only)

```bash
# Start just PostgreSQL for local development
docker-compose -f docker-compose.dev.yml up -d

# Run backend and frontend locally
npm run dev
```

### Production (Full Stack)

```bash
# Create .env file with OPENAI_API_KEY
echo "OPENAI_API_KEY=sk-your-key" > .env

# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services:
- **postgres**: PostgreSQL with pgvector (port 5432)
- **backend**: Fastify API server (port 3001)
- **frontend**: Next.js web app (port 3000)

## Configuration

### Environment Variables

**Backend** (`backend/.env`):
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for embeddings
- `PORT`: Server port (default: 3001)
- `HOST`: Server host (default: 0.0.0.0)
- `DEFAULT_TOP_K`: Default number of results (default: 5)
- `CHUNK_SIZE`: Text chunk size in characters (default: 500)
- `CHUNK_OVERLAP`: Overlap between chunks (default: 50)

**Frontend** (`frontend/.env.local`):
- `NEXT_PUBLIC_API_URL`: Backend API base URL

### Chunking Strategy

Documents are split into chunks for better retrieval precision:
- **Default chunk size**: 500 characters
- **Overlap**: 50 characters (preserves context across boundaries)
- **Strategy**: Fixed-size with overlap

Adjust `CHUNK_SIZE` and `CHUNK_OVERLAP` based on your use case:
- **FAQ/short answers**: 200-300 chars, 25-50 overlap
- **Documentation**: 500-800 chars, 50-100 overlap
- **Long-form content**: 1000+ chars, 100-200 overlap

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View PostgreSQL logs
docker logs rag-postgres

# Restart PostgreSQL
npm run docker:down && npm run docker:up
```

### Embedding Generation Errors

- **Check OpenAI API key**: Ensure `OPENAI_API_KEY` is set in `backend/.env`
- **Rate limits**: OpenAI has rate limits. Consider batching or adding delays
- **Network issues**: Check your internet connection

### Frontend Can't Connect to Backend

- Ensure backend is running on port 3001
- Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
- Verify CORS settings in `backend/src/index.ts`

### Seed Script Fails

```bash
# Ensure database is running
npm run docker:up

# Reset database and try again
cd backend
npx prisma migrate reset
cd ..
npm run db:seed
```

## Future Extensions

- [ ] **File upload support**: PDF, DOCX, TXT parsing with dedicated libraries
- [ ] **Batch ingestion API**: Process multiple documents in one request
- [ ] **Advanced chunking**: Semantic chunking, recursive splitting
- [ ] **Reranking**: Cross-encoder model for improved relevance
- [ ] **Custom embeddings**: Support for Sentence Transformers, Cohere, etc.
- [ ] **Metadata filtering**: Filter search by document type, date, etc.
- [ ] **Analytics dashboard**: Usage metrics, popular queries, performance stats
- [ ] **Webhooks**: Notify external systems on ingestion/query events
- [ ] **API authentication**: API key validation middleware
- [ ] **Rate limiting**: Per-tenant request throttling
- [ ] **Export functionality**: Download knowledge base data
- [ ] **Multi-language support**: i18n for frontend
- [ ] **Streaming responses**: Real-time query results

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for new functionality
4. Ensure all tests pass (`npm test`)
5. Lint and format code (`npm run lint:fix && npm run format`)
6. Commit with clear messages
7. Push to your fork and submit a PR

## License

MIT License - See LICENSE file for details

## Acknowledgments

- [OpenAI](https://openai.com/) for embeddings API
- [pgvector](https://github.com/pgvector/pgvector) for PostgreSQL vector support
- [Fastify](https://www.fastify.io/), [Next.js](https://nextjs.org/), and [Prisma](https://www.prisma.io/) communities

---

**Built with ❤️ using TypeScript, Fastify, Next.js, and PostgreSQL**
