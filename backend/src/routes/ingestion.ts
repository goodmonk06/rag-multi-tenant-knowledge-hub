import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { splitText } from '../services/text-splitter';
import { generateEmbeddings } from '../services/embeddings';
import { fetchUrlContent } from '../services/url-fetcher';

const ingestTextSchema = z.object({
  text: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

const ingestUrlSchema = z.object({
  url: z.string().url(),
  metadata: z.record(z.any()).optional(),
});

export async function ingestionRoutes(fastify: FastifyInstance) {
  // Ingest text
  fastify.post('/:id/ingest/text', async (request, reply) => {
    const { id: kbId } = request.params as { id: string };
    const result = ingestTextSchema.safeParse(request.body);

    if (!result.success) {
      return reply.code(400).send({ error: 'Invalid request', details: result.error });
    }

    // Verify KB exists
    const kb = await prisma.knowledgeBase.findUnique({ where: { id: kbId } });
    if (!kb) {
      return reply.code(404).send({ error: 'Knowledge base not found' });
    }

    try {
      // Create document
      const document = await prisma.document.create({
        data: {
          kbId,
          sourceType: 'text',
          sourceMetaJson: result.data.metadata || {},
        },
      });

      // Split text into chunks
      const textChunks = splitText(result.data.text);

      // Generate embeddings for all chunks
      const embeddings = await generateEmbeddings(
        textChunks.map((chunk) => chunk.content)
      );

      // Store chunks with embeddings
      const chunks = await Promise.all(
        textChunks.map((chunk, index) =>
          prisma.$executeRaw`
            INSERT INTO chunks (id, "documentId", "kbId", content, embedding, "metadataJson", "createdAt")
            VALUES (
              gen_random_uuid()::text,
              ${document.id},
              ${kbId},
              ${chunk.content},
              ${JSON.stringify(embeddings[index])}::vector,
              ${JSON.stringify(chunk.metadata)}::jsonb,
              NOW()
            )
          `
        )
      );

      return reply.code(201).send({
        document: {
          id: document.id,
          chunksCreated: textChunks.length,
        },
      });
    } catch (error) {
      console.error('Error ingesting text:', error);
      return reply.code(500).send({ error: 'Failed to ingest text' });
    }
  });

  // Ingest URL
  fastify.post('/:id/ingest/url', async (request, reply) => {
    const { id: kbId } = request.params as { id: string };
    const result = ingestUrlSchema.safeParse(request.body);

    if (!result.success) {
      return reply.code(400).send({ error: 'Invalid request', details: result.error });
    }

    // Verify KB exists
    const kb = await prisma.knowledgeBase.findUnique({ where: { id: kbId } });
    if (!kb) {
      return reply.code(404).send({ error: 'Knowledge base not found' });
    }

    try {
      // Fetch URL content
      const content = await fetchUrlContent(result.data.url);

      // Create document
      const document = await prisma.document.create({
        data: {
          kbId,
          sourceType: 'url',
          sourceMetaJson: {
            url: result.data.url,
            ...result.data.metadata,
          },
        },
      });

      // Split text into chunks
      const textChunks = splitText(content);

      // Generate embeddings for all chunks
      const embeddings = await generateEmbeddings(
        textChunks.map((chunk) => chunk.content)
      );

      // Store chunks with embeddings
      await Promise.all(
        textChunks.map((chunk, index) =>
          prisma.$executeRaw`
            INSERT INTO chunks (id, "documentId", "kbId", content, embedding, "metadataJson", "createdAt")
            VALUES (
              gen_random_uuid()::text,
              ${document.id},
              ${kbId},
              ${chunk.content},
              ${JSON.stringify(embeddings[index])}::vector,
              ${JSON.stringify({ ...chunk.metadata, url: result.data.url })}::jsonb,
              NOW()
            )
          `
        )
      );

      return reply.code(201).send({
        document: {
          id: document.id,
          url: result.data.url,
          chunksCreated: textChunks.length,
        },
      });
    } catch (error) {
      console.error('Error ingesting URL:', error);
      return reply.code(500).send({ error: 'Failed to ingest URL' });
    }
  });

  // TODO: Ingest file (stub for future implementation)
  fastify.post('/:id/ingest/file', async (request, reply) => {
    const { id: kbId } = request.params as { id: string };

    // Verify KB exists
    const kb = await prisma.knowledgeBase.findUnique({ where: { id: kbId } });
    if (!kb) {
      return reply.code(404).send({ error: 'Knowledge base not found' });
    }

    // TODO: Implement file upload and processing
    // 1. Accept multipart file upload using @fastify/multipart
    // 2. Parse file based on type (PDF, DOCX, TXT, etc.) using appropriate library
    // 3. Extract text content
    // 4. Follow same chunking and embedding process as text/URL ingestion

    return reply.code(501).send({
      error: 'File upload not yet implemented',
      message: 'TODO: Add file parsing libraries (pdf-parse, mammoth, etc.) and implement file processing',
    });
  });
}
