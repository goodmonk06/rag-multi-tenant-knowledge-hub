import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';

const createKBSchema = z.object({
  tenantId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function knowledgeBaseRoutes(fastify: FastifyInstance) {
  // List knowledge bases (optionally filtered by tenantId)
  fastify.get('/', async (request, reply) => {
    const { tenantId } = request.query as { tenantId?: string };

    const where = tenantId ? { tenantId } : {};

    const knowledgeBases = await prisma.knowledgeBase.findMany({
      where,
      include: {
        tenant: true,
        documents: true,
        _count: {
          select: {
            documents: true,
            chunks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { knowledgeBases };
  });

  // Get knowledge base by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const kb = await prisma.knowledgeBase.findUnique({
      where: { id },
      include: {
        tenant: true,
        documents: {
          include: {
            _count: {
              select: {
                chunks: true,
              },
            },
          },
        },
        _count: {
          select: {
            documents: true,
            chunks: true,
            queryLogs: true,
          },
        },
      },
    });

    if (!kb) {
      return reply.code(404).send({ error: 'Knowledge base not found' });
    }

    return { knowledgeBase: kb };
  });

  // Create a new knowledge base
  fastify.post('/', async (request, reply) => {
    const result = createKBSchema.safeParse(request.body);

    if (!result.success) {
      return reply.code(400).send({ error: 'Invalid request', details: result.error });
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: result.data.tenantId },
    });

    if (!tenant) {
      return reply.code(404).send({ error: 'Tenant not found' });
    }

    const kb = await prisma.knowledgeBase.create({
      data: {
        tenantId: result.data.tenantId,
        name: result.data.name,
        description: result.data.description,
      },
      include: {
        tenant: true,
      },
    });

    return reply.code(201).send({ knowledgeBase: kb });
  });

  // Delete a knowledge base
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await prisma.knowledgeBase.delete({
        where: { id },
      });

      return { success: true };
    } catch (error) {
      return reply.code(404).send({ error: 'Knowledge base not found' });
    }
  });
}
