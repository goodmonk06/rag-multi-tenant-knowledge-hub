import { PrismaClient } from '@prisma/client';
import { generateEmbeddings } from '../services/embeddings';
import { splitText } from '../services/text-splitter';

const prisma = new PrismaClient();

const sampleDocuments = [
  {
    title: 'Getting Started with RAG',
    content: `Retrieval-Augmented Generation (RAG) is a technique that combines the power of large language models with external knowledge bases. By retrieving relevant information from a knowledge base before generating a response, RAG systems can provide more accurate, factual, and up-to-date answers. This approach is particularly useful for domain-specific applications where the model needs access to specialized information that wasn't part of its training data.`,
  },
  {
    title: 'Vector Embeddings Explained',
    content: `Vector embeddings are numerical representations of text that capture semantic meaning. In a RAG system, documents are converted into high-dimensional vectors (typically 384 to 1536 dimensions) using models like OpenAI's text-embedding-3-small or sentence transformers. These vectors allow for efficient similarity search using cosine distance or other metrics. When a user submits a query, it's also converted to a vector, and the system finds the most similar document vectors to retrieve relevant context.`,
  },
  {
    title: 'Multi-Tenancy Best Practices',
    content: `Implementing multi-tenancy in a SaaS application requires careful consideration of data isolation, security, and performance. Each tenant should have their data completely isolated from other tenants, either through separate databases, schemas, or row-level security. API keys should be used to authenticate requests and ensure tenants can only access their own resources. Proper indexing on tenant identifiers is crucial for query performance as the system scales.`,
  },
  {
    title: 'Chunking Strategies for RAG',
    content: `Effective chunking is critical for RAG performance. Chunks should be large enough to contain meaningful context but small enough for precise retrieval. Common strategies include: fixed-size chunking (e.g., 500 tokens with 50 token overlap), semantic chunking (splitting on paragraph or sentence boundaries), and recursive chunking (hierarchical splitting). The optimal chunk size depends on your use case - shorter chunks for FAQ-style questions, longer chunks for detailed explanations.`,
  },
  {
    title: 'Optimizing Vector Search Performance',
    content: `Vector search performance can be improved through several techniques. First, use approximate nearest neighbor (ANN) algorithms like HNSW or IVF instead of brute-force search. Second, consider using quantization to reduce vector size and memory usage. Third, implement result reranking with a cross-encoder model to improve relevance. Finally, cache frequently accessed vectors and use batch processing for ingestion to minimize database roundtrips.`,
  },
];

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Clean existing data
    console.log('Cleaning existing data...');
    await prisma.queryLog.deleteMany();
    await prisma.chunk.deleteMany();
    await prisma.document.deleteMany();
    await prisma.knowledgeBase.deleteMany();
    await prisma.tenant.deleteMany();

    // Create demo tenants
    console.log('Creating tenants...');
    const tenant1 = await prisma.tenant.create({
      data: {
        name: 'Acme Corporation',
      },
    });

    const tenant2 = await prisma.tenant.create({
      data: {
        name: 'TechStart Inc',
      },
    });

    console.log(`✓ Created tenants: ${tenant1.name}, ${tenant2.name}`);

    // Create knowledge bases
    console.log('Creating knowledge bases...');
    const kb1 = await prisma.knowledgeBase.create({
      data: {
        tenantId: tenant1.id,
        name: 'RAG Documentation',
        description: 'Comprehensive guide to RAG systems and best practices',
      },
    });

    const kb2 = await prisma.knowledgeBase.create({
      data: {
        tenantId: tenant1.id,
        name: 'Product Knowledge Base',
        description: 'Internal product documentation and FAQs',
      },
    });

    const kb3 = await prisma.knowledgeBase.create({
      data: {
        tenantId: tenant2.id,
        name: 'Customer Support',
        description: 'Help articles and troubleshooting guides',
      },
    });

    console.log(`✓ Created knowledge bases: ${kb1.name}, ${kb2.name}, ${kb3.name}`);

    // Ingest documents into KB1
    console.log('Ingesting documents into RAG Documentation...');
    for (const doc of sampleDocuments) {
      const document = await prisma.document.create({
        data: {
          kbId: kb1.id,
          sourceType: 'text',
          sourceMetaJson: {
            title: doc.title,
            type: 'documentation',
          },
        },
      });

      // Split into chunks
      const chunks = splitText(doc.content);
      console.log(
        `  Splitting "${doc.title}" into ${chunks.length} chunks...`
      );

      // Generate embeddings
      const embeddings = await generateEmbeddings(chunks.map((c) => c.content));

      // Store chunks with embeddings using raw SQL for vector type
      for (let i = 0; i < chunks.length; i++) {
        await prisma.$executeRaw`
          INSERT INTO chunks (id, "documentId", "kbId", content, embedding, "metadataJson", "createdAt")
          VALUES (
            gen_random_uuid()::text,
            ${document.id},
            ${kb1.id},
            ${chunks[i].content},
            ${JSON.stringify(embeddings[i])}::vector,
            ${JSON.stringify({ ...chunks[i].metadata, title: doc.title })}::jsonb,
            NOW()
          )
        `;
      }

      console.log(`  ✓ Ingested "${doc.title}" with ${chunks.length} chunks`);
    }

    // Add a sample document to KB2
    console.log('Adding sample to Product Knowledge Base...');
    const productDoc = await prisma.document.create({
      data: {
        kbId: kb2.id,
        sourceType: 'text',
        sourceMetaJson: {
          title: 'API Rate Limits',
          category: 'api',
        },
      },
    });

    const productContent = `Our API has the following rate limits: Free tier allows 100 requests per hour, Pro tier allows 1000 requests per hour, and Enterprise tier allows unlimited requests. Rate limits are applied per API key and reset every hour. If you exceed your rate limit, you'll receive a 429 Too Many Requests response.`;
    const productChunks = splitText(productContent);
    const productEmbeddings = await generateEmbeddings(productChunks.map((c) => c.content));

    for (let i = 0; i < productChunks.length; i++) {
      await prisma.$executeRaw`
        INSERT INTO chunks (id, "documentId", "kbId", content, embedding, "metadataJson", "createdAt")
        VALUES (
          gen_random_uuid()::text,
          ${productDoc.id},
          ${kb2.id},
          ${productChunks[i].content},
          ${JSON.stringify(productEmbeddings[i])}::vector,
          ${JSON.stringify(productChunks[i].metadata)}::jsonb,
          NOW()
        )
      `;
    }

    // Get counts
    const stats = {
      tenants: await prisma.tenant.count(),
      knowledgeBases: await prisma.knowledgeBase.count(),
      documents: await prisma.document.count(),
      chunks: await prisma.chunk.count(),
    };

    console.log('\n✅ Seed completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Database Statistics:`);
    console.log(`   Tenants:         ${stats.tenants}`);
    console.log(`   Knowledge Bases: ${stats.knowledgeBases}`);
    console.log(`   Documents:       ${stats.documents}`);
    console.log(`   Chunks:          ${stats.chunks}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔑 Demo Credentials:');
    console.log(`   Tenant 1: ${tenant1.name} (ID: ${tenant1.id})`);
    console.log(`   API Key:  ${tenant1.apiKey}`);
    console.log(`   Tenant 2: ${tenant2.name} (ID: ${tenant2.id})`);
    console.log(`   API Key:  ${tenant2.apiKey}`);
    console.log('\n🌐 Next Steps:');
    console.log('   1. Start the backend: npm run dev:backend');
    console.log('   2. Start the frontend: npm run dev:frontend');
    console.log('   3. Visit: http://localhost:3000');
    console.log('   4. Try querying "What is RAG?" in the RAG Documentation KB\n');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
