import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { generateEmbedding } from '../services/embeddings';
import { config } from '../config';

const querySchema = z.object({
  query: z.string().min(1),
  topK: z.number().int().positive().optional(),
  includeMetadata: z.boolean().optional().default(true),
});

interface QueryResult {
  id: string;
  content: string;
  similarity: number;
  metadata?: any;
  documentId: string;
}

export async function queryRoutes(fastify: FastifyInstance) {
  // Query knowledge base
  fastify.post('/:id/query', async (request, reply) => {
    const { id: kbId } = request.params as { id: string };
    const result = querySchema.safeParse(request.body);

    if (!result.success) {
      return reply.code(400).send({ error: 'Invalid request', details: result.error });
    }

    // Verify KB exists
    const kb = await prisma.knowledgeBase.findUnique({ where: { id: kbId } });
    if (!kb) {
      return reply.code(404).send({ error: 'Knowledge base not found' });
    }

    const { query, topK = config.defaultTopK, includeMetadata } = result.data;

    try {
      // Generate embedding for query
      const queryEmbedding = await generateEmbedding(query);

      // Perform vector similarity search using pgvector
      const results: QueryResult[] = await prisma.$queryRaw`
        SELECT
          id,
          content,
          "documentId",
          "metadataJson" as metadata,
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
        FROM chunks
        WHERE "kbId" = ${kbId}
        ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
        LIMIT ${topK}
      `;

      // Format results
      const formattedResults = results.map((r) => ({
        id: r.id,
        content: r.content,
        similarity: r.similarity,
        documentId: r.documentId,
        ...(includeMetadata && { metadata: r.metadata }),
      }));

      // Log the query
      await prisma.queryLog.create({
        data: {
          kbId,
          queryText: query,
          resultsJson: {
            topK,
            resultCount: results.length,
            results: formattedResults,
          },
        },
      });

      return {
        query,
        results: formattedResults,
        resultCount: results.length,
      };
    } catch (error) {
      console.error('Error querying knowledge base:', error);
      return reply.code(500).send({ error: 'Failed to query knowledge base' });
    }
  });

  // Get query logs for a knowledge base
  fastify.get('/:id/queries', async (request, reply) => {
    const { id: kbId } = request.params as { id: string };
    const { limit = 50 } = request.query as { limit?: number };

    const logs = await prisma.queryLog.findMany({
      where: { kbId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return { logs };
  });
}
