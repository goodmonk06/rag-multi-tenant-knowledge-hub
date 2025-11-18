import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../types/errors';
import { errorResponse } from '../types/response';

export async function errorHandler(
  error: Error | FastifyError | AppError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log error for debugging
  request.log.error(error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return reply.code(400).send(
      errorResponse('VALIDATION_ERROR', 'Request validation failed', {
        issues: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      })
    );
  }

  // Handle custom app errors
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send(
      errorResponse(
        error.code || 'APP_ERROR',
        error.message,
        'details' in error ? (error as any).details : undefined
      )
    );
  }

  // Handle Fastify errors
  if ('statusCode' in error) {
    const fastifyError = error as FastifyError;
    return reply.code(fastifyError.statusCode || 500).send(
      errorResponse(
        fastifyError.code || 'FASTIFY_ERROR',
        fastifyError.message
      )
    );
  }

  // Handle Prisma errors
  if (error.constructor.name.startsWith('Prisma')) {
    const prismaError = error as any;

    if (prismaError.code === 'P2002') {
      return reply.code(409).send(
        errorResponse('CONFLICT', 'A record with this value already exists')
      );
    }

    if (prismaError.code === 'P2025') {
      return reply.code(404).send(
        errorResponse('NOT_FOUND', 'Record not found')
      );
    }

    // Generic Prisma error
    return reply.code(500).send(
      errorResponse('DATABASE_ERROR', 'A database error occurred')
    );
  }

  // Default internal server error
  return reply.code(500).send(
    errorResponse(
      'INTERNAL_ERROR',
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message
    )
  );
}
