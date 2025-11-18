import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { config } from './config';
import { tenantRoutes } from './routes/tenants';
import { knowledgeBaseRoutes } from './routes/knowledge-bases';
import { ingestionRoutes } from './routes/ingestion';
import { queryRoutes } from './routes/query';
import { errorHandler } from './middleware/error-handler';

const server = Fastify({
  logger: true,
});

// Register error handler
server.setErrorHandler(errorHandler);

async function start() {
  try {
    // Register plugins
    await server.register(cors, {
      origin: true, // Allow all origins in development
    });

    await server.register(multipart, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    });

    // Health check
    server.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Register routes
    await server.register(tenantRoutes, { prefix: '/api/tenants' });
    await server.register(knowledgeBaseRoutes, { prefix: '/api/kb' });
    await server.register(ingestionRoutes, { prefix: '/api/kb' });
    await server.register(queryRoutes, { prefix: '/api/kb' });

    // Start server
    await server.listen({
      port: config.port,
      host: config.host,
    });

    console.log(`🚀 Server running at http://${config.host}:${config.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
