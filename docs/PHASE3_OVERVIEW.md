# Phase 3 Overview

## Purpose Statement

The **RAG Multi-Tenant Knowledge Hub** is a production-grade, horizontally scalable platform for building Retrieval-Augmented Generation (RAG) systems across multiple isolated tenants. It solves the fundamental problem of making unstructured knowledge searchable and accessible to AI applications through semantic vector search, while maintaining strict tenant isolation, supporting multiple embedding providers, and offering a complete API-first architecture for integration into larger AI ecosystems.

This repository serves as the central knowledge management backbone for AI-driven applications, enabling them to ground their responses in domain-specific, up-to-date information without requiring the knowledge to be baked into the language model itself.

## Existing Features (Post Phase 2)

### Core Functionality
- ✅ **Multi-tenant architecture** with complete data isolation via tenant-scoped knowledge bases
- ✅ **Document ingestion pipeline** supporting text and URL sources (file upload stub ready)
- ✅ **Automatic text chunking** with configurable size and overlap strategies
- ✅ **Vector embedding generation** using OpenAI text-embedding-3-small (1536 dimensions)
- ✅ **Semantic vector search** powered by pgvector with cosine similarity ranking
- ✅ **Query logging** for analytics and debugging

### Technical Infrastructure
- ✅ **Full-stack TypeScript** implementation (Fastify backend, Next.js 15 frontend)
- ✅ **Type-safe ORM** with Prisma and PostgreSQL + pgvector
- ✅ **Centralized error handling** with custom error classes and unified API responses
- ✅ **Comprehensive testing** (31 unit tests with Vitest, 100% pass rate)
- ✅ **Docker support** (multi-stage Dockerfiles, full-stack docker-compose)
- ✅ **Code quality tooling** (ESLint, Prettier, TypeScript strict mode)
- ✅ **Rich seed data** with demo tenants, knowledge bases, and embedded documents

### Developer Experience
- ✅ **Standardized npm scripts** (dev, build, test, lint, db:*, docker:*)
- ✅ **One-command setup** for new developers
- ✅ **Interactive web dashboard** for tenant/KB/document management
- ✅ **Query playground** with adjustable top-k and metadata display
- ✅ **Comprehensive README** (600+ lines covering setup, API, integration, troubleshooting)

## Current Limitations

### Domain Model Constraints
- ❌ **No user/member management** - Tenants exist but no way to assign users to tenants or manage permissions
- ❌ **Single embedding provider** - Hardcoded to OpenAI, no support for Cohere, HuggingFace, or custom models
- ❌ **No organizational structures** - Missing collections, folders, tags for organizing KBs and documents
- ❌ **No version history** - Documents can't be updated with version tracking
- ❌ **Limited metadata** - No support for custom document properties, tags, or rich metadata schemas

### Integration & Extensibility
- ❌ **No plugin system** - Cannot swap embedding providers, vector stores, or notification channels
- ❌ **No event system** - No domain events for triggering webhooks, notifications, or downstream processing
- ❌ **No webhook support** - Cannot notify external systems when documents are ingested or queries happen
- ❌ **No API authentication** - API is currently open (tenant API keys exist but not enforced)
- ❌ **No rate limiting** - No throttling or quota enforcement per tenant

### Analytics & Observability
- ❌ **Basic logging only** - No structured logging with context, no metrics/tracing
- ❌ **No usage analytics** - Cannot track API usage per tenant for billing or capacity planning
- ❌ **No performance metrics** - No insight into query latency, embedding generation time, etc.
- ❌ **Limited query logs** - Logs exist but no aggregation, search, or export capabilities

### Advanced RAG Features
- ❌ **No chunk reranking** - Results are purely based on vector similarity, no cross-encoder refinement
- ❌ **No hybrid search** - Only vector search, no keyword/BM25 combination
- ❌ **No query expansion** - No semantic query rewriting or multi-query strategies
- ❌ **No result filtering** - Cannot filter results by date, document type, custom metadata
- ❌ **No batch operations** - Ingestion and queries are one-at-a-time only

### Data Management
- ❌ **No export/import** - Cannot backup or migrate knowledge bases
- ❌ **No bulk document deletion** - Must delete documents one by one
- ❌ **No document updates** - Cannot update existing documents, only delete and re-ingest
- ❌ **No deduplication** - Same content can be ingested multiple times

## Phase 3 Plan

### 1. Domain Model Expansion (Entities & Relationships)

**New Entities:**
- **User** - Individual users who can be assigned to one or more tenants
  - Fields: id, email, name, passwordHash, role, createdAt, updatedAt
  - Relations: many-to-many with Tenant through TenantMember
- **TenantMember** - Join table for User ↔ Tenant with role-based permissions
  - Fields: userId, tenantId, role (OWNER, ADMIN, MEMBER, VIEWER), invitedAt, joinedAt
- **Collection** - Logical grouping of knowledge bases for organization
  - Fields: id, tenantId, name, description, metadata, createdAt, updatedAt
  - Relations: many-to-many with KnowledgeBase
- **DocumentVersion** - Version history for documents
  - Fields: id, documentId, version, content, metadata, createdAt, createdBy
- **APIUsageLog** - Track API calls per tenant for analytics and billing
  - Fields: id, tenantId, endpoint, method, statusCode, responseTime, timestamp
- **WebhookConfig** - Configure webhooks for domain events
  - Fields: id, tenantId, url, events (array), secret, enabled, createdAt
- **SavedQuery** - User-saved queries and filters
  - Fields: id, kbId, userId, name, queryText, filters, createdAt

**Enhanced Existing Entities:**
- **Tenant**: Add `plan` (FREE, PRO, ENTERPRISE), `quotas`, `metadata`
- **KnowledgeBase**: Add `tags`, `visibility` (PRIVATE, SHARED, PUBLIC), `settings`
- **Document**: Add `status` (PENDING, PROCESSING, READY, FAILED), `updatedAt`, `updatedBy`
- **Chunk**: Add `position`, `score` (quality score), `language`

### 2. Multiple Vertical Slices Implementation

**Slice 1: User & Access Management**
- Register user → Create user account
- Invite user to tenant → Send invitation
- Accept invitation → Join tenant with role
- List tenant members → View all users in a tenant
- Update member role → Change permissions
- Remove member → Revoke access
- UI: `/tenants/:id/members` page

**Slice 2: Collections & Organization**
- Create collection → Group related KBs
- Add KBs to collection → Organize knowledge
- Query collection → Search across multiple KBs simultaneously
- Share collection → Generate shareable links
- Collection analytics → View usage stats
- UI: `/collections` and `/collections/:id` pages

**Slice 3: Analytics & Usage Tracking**
- Track API usage → Log all requests with metadata
- Generate usage reports → Daily/weekly/monthly aggregations
- View query analytics → Most common queries, avg response time
- Export usage data → CSV/JSON download
- Quota management → Enforce limits, send alerts
- UI: `/tenants/:id/analytics` dashboard

**Slice 4: Webhook & Event Management**
- Configure webhooks → Set up event subscriptions
- Test webhook → Send test payloads
- View webhook logs → See delivery status
- Retry failed webhooks → Manual retry
- Disable/enable webhooks → Control event flow
- UI: `/tenants/:id/webhooks` page

### 3. Extensibility & Plugin System

**Provider Interfaces (in `lib/providers/`):**

```typescript
// Embedding provider abstraction
interface IEmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
  getDimensions(): number;
  getModelName(): string;
}

// Implementations: OpenAIProvider, CohereProvider, HuggingFaceProvider

// Vector store abstraction
interface IVectorStore {
  upsertVectors(vectors: VectorRecord[]): Promise<void>;
  searchSimilar(vector: number[], topK: number, filters?: Filters): Promise<SearchResult[]>;
  deleteVectors(ids: string[]): Promise<void>;
}

// Implementations: PgVectorStore, QdrantStore, PineconeStore

// Notification provider abstraction
interface INotificationProvider {
  sendNotification(notification: Notification): Promise<void>;
}

// Implementations: EmailProvider, SlackProvider, WebhookProvider
```

**Event System (in `lib/events/`):**

```typescript
// Domain events
type DomainEvent =
  | DocumentIngestedEvent
  | QueryExecutedEvent
  | TenantCreatedEvent
  | UserInvitedEvent
  | WebhookTriggeredEvent;

// Event bus with handlers
class EventBus {
  on(eventType: string, handler: EventHandler): void;
  emit(event: DomainEvent): Promise<void>;
}
```

**Configuration System:**
- Provider selection via environment variables
- Runtime provider swapping for multi-model support
- Fallback chains (primary + backup providers)

### 4. Advanced RAG Features

**Hybrid Search:**
- Combine vector similarity with keyword matching (PostgreSQL full-text search)
- Configurable weighting between semantic and lexical search
- Query expansion with synonyms and related terms

**Result Reranking:**
- Cross-encoder model for relevance refinement
- Configurable reranking strategies
- Support for custom reranking functions

**Metadata Filtering:**
- Filter search results by document type, date range, tags, custom fields
- Complex filter queries (AND/OR/NOT logic)
- Filter templates for common use cases

**Batch Operations:**
- Bulk document ingestion API
- Parallel embedding generation with rate limiting
- Batch query API for processing multiple queries efficiently

### 5. Enhanced DX & CLI Tools

**CLI Tool (in `backend/src/cli/`):**

```bash
# Knowledge base management
npm run cli kb:create --tenant-id=xxx --name="My KB"
npm run cli kb:list --tenant-id=xxx
npm run cli kb:export --kb-id=xxx --output=./export.json

# Document operations
npm run cli doc:ingest --kb-id=xxx --file=./docs/*.md
npm run cli doc:reindex --kb-id=xxx

# User management
npm run cli user:create --email=user@example.com --role=admin
npm run cli user:invite --email=user@example.com --tenant-id=xxx

# Maintenance
npm run cli maintenance:cleanup-orphaned-chunks
npm run cli maintenance:recompute-embeddings --provider=cohere

# Analytics
npm run cli analytics:report --tenant-id=xxx --period=30d
```

### 6. Logging, Metrics & Observability

**Structured Logging:**
- Contextual logs with request IDs, tenant IDs, user IDs
- Log levels: DEBUG, INFO, WARN, ERROR
- JSON-formatted logs for machine parsing
- Log aggregation compatible (Datadog, Splunk, etc.)

**Metrics Collection:**
- Request rate, latency, error rate per endpoint
- Embedding generation time and cost
- Vector search performance (query time, result count)
- Database query performance
- Webhook delivery success rate

**Distributed Tracing:**
- OpenTelemetry integration stubs
- Trace ingestion → embedding → storage → query pipelines
- Cross-service correlation IDs

### 7. Enhanced Testing Strategy

**Test Categories:**
- Unit tests (existing 31 + 50 more)
- Integration tests (20+ tests for vertical slices)
- E2E tests (5+ full user journeys)
- Performance tests (load testing, stress testing)
- Contract tests (API schema validation)

**Test Utilities:**
- Test data factories for all entities
- Database test fixtures with realistic data
- Mock providers (embedding, storage, notifications)
- Test helpers for common operations

### 8. Rich Seed Data & Demo Scenarios

**Personas:**
- **Startup founder** - Using RAG for customer support docs
- **Enterprise admin** - Managing multiple departments' knowledge bases
- **Data scientist** - Experimenting with different embedding models
- **Developer** - Integrating RAG into a chatbot

**Scenarios:**
- **Customer Support** - FAQ ingestion, support ticket context retrieval
- **Documentation** - Product docs, API references, tutorials
- **Research** - Academic papers, research notes, citations
- **Legal** - Contract analysis, policy documents, case law

**Demo Data:**
- 5 tenants with different use cases
- 15 knowledge bases across various domains
- 100+ documents with realistic content
- 500+ embedded chunks
- 50 sample queries with expected results
- User accounts with different roles

### 9. Documentation Expansion

**New Documentation Files:**
- `docs/DOMAIN_NOTES.md` - Deep dive into domain concepts
- `docs/ARCHITECTURE.md` - System architecture and design decisions
- `docs/INTEGRATION_RECIPES.md` - How to integrate with other systems
- `docs/API_REFERENCE.md` - Complete API documentation
- `docs/EMBEDDING_PROVIDERS.md` - Guide to configuring different providers
- `docs/DEPLOYMENT.md` - Production deployment guide
- `docs/PERFORMANCE.md` - Performance tuning and optimization
- `docs/CONTRIBUTING.md` - Contribution guidelines
- `CHANGELOG.md` - Version history and breaking changes

**Enhanced README:**
- Expanded "Domain & Concepts" section with entity relationship diagram
- Detailed "Architecture" section with component diagram
- Multiple "Example Flows" for each vertical slice
- "Extension & Integration" guide with code examples
- Expanded "Future Extensions" roadmap

## Success Metrics for Phase 3

- **Codebase size**: 4,000 lines → 15,000+ lines
- **Tests**: 31 tests → 100+ tests (unit + integration + e2e)
- **API endpoints**: 12 → 40+
- **Database entities**: 5 → 12+
- **Documentation**: 600 lines README → 600 lines README + 2,000 lines in docs/
- **Seed data**: 2 tenants → 5 tenants, 3 KBs → 15 KBs, 5 docs → 100+ docs
- **Vertical slices**: 1 → 4 fully implemented
- **Extension points**: 0 → 6+ provider interfaces

## Implementation Timeline

**Phase 3A** (Current): Domain expansion, new entities, migrations
**Phase 3B**: Multiple vertical slices (user management, collections, analytics)
**Phase 3C**: Plugin system and provider abstractions
**Phase 3D**: Event system and webhook infrastructure
**Phase 3E**: CLI tools and enhanced DX
**Phase 3F**: Advanced RAG features (hybrid search, reranking, filtering)
**Phase 3G**: Enhanced testing (integration, e2e, performance)
**Phase 3H**: Rich seed data and demo scenarios
**Phase 3I**: Documentation expansion
**Phase 3J**: Code quality pass and final polish

## Next Steps

Execute Phase 3 in order, starting with domain expansion and working through each component systematically. Prioritize features that maximize reusability and demonstrate the platform's flexibility as a building block in larger AI ecosystems.
