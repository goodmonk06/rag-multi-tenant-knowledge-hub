import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';

const createTenantSchema = z.object({
  name: z.string().min(1),
});

export async function tenantRoutes(fastify: FastifyInstance) {
  // List all tenants
  fastify.get('/', async (request, reply) => {
    const tenants = await prisma.tenant.findMany({
      include: {
        knowledgeBases: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { tenants };
  });

  // Get tenant by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        knowledgeBases: true,
      },
    });

    if (!tenant) {
      return reply.code(404).send({ error: 'Tenant not found' });
    }

    return { tenant };
  });

  // Create a new tenant
  fastify.post('/', async (request, reply) => {
    const result = createTenantSchema.safeParse(request.body);

    if (!result.success) {
      return reply.code(400).send({ error: 'Invalid request', details: result.error });
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: result.data.name,
      },
    });

    return reply.code(201).send({ tenant });
  });

  // Delete a tenant
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await prisma.tenant.delete({
        where: { id },
      });

      return { success: true };
    } catch (error) {
      return reply.code(404).send({ error: 'Tenant not found' });
    }
  });
}
