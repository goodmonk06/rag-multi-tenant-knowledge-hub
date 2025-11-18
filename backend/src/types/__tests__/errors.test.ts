import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InternalServerError,
} from '../errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an error with status code and message', () => {
      const error = new AppError(400, 'Bad request');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad request');
      expect(error.name).toBe('AppError');
    });

    it('should include error code when provided', () => {
      const error = new AppError(500, 'Server error', 'ERR_SERVER');

      expect(error.code).toBe('ERR_SERVER');
    });

    it('should capture stack trace', () => {
      const error = new AppError(500, 'Test error');

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });
  });

  describe('NotFoundError', () => {
    it('should create a 404 error', () => {
      const error = new NotFoundError('User');

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.name).toBe('NotFoundError');
    });
  });

  describe('ValidationError', () => {
    it('should create a 400 error', () => {
      const error = new ValidationError('Invalid input');

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('ValidationError');
    });

    it('should include validation details', () => {
      const details = { field: 'email', issue: 'Invalid format' };
      const error = new ValidationError('Validation failed', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create a 401 error with default message', () => {
      const error = new UnauthorizedError();

      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Unauthorized');
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should accept custom message', () => {
      const error = new UnauthorizedError('Invalid token');

      expect(error.message).toBe('Invalid token');
    });
  });

  describe('ForbiddenError', () => {
    it('should create a 403 error with default message', () => {
      const error = new ForbiddenError();

      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Forbidden');
      expect(error.code).toBe('FORBIDDEN');
    });

    it('should accept custom message', () => {
      const error = new ForbiddenError('Access denied');

      expect(error.message).toBe('Access denied');
    });
  });

  describe('ConflictError', () => {
    it('should create a 409 error', () => {
      const error = new ConflictError('Resource already exists');

      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Resource already exists');
      expect(error.code).toBe('CONFLICT');
      expect(error.name).toBe('ConflictError');
    });
  });

  describe('InternalServerError', () => {
    it('should create a 500 error with default message', () => {
      const error = new InternalServerError();

      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Internal server error');
      expect(error.code).toBe('INTERNAL_ERROR');
    });

    it('should accept custom message', () => {
      const error = new InternalServerError('Database connection failed');

      expect(error.message).toBe('Database connection failed');
    });
  });
});
