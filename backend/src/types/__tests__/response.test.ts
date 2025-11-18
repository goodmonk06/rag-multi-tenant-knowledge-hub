import { describe, it, expect, beforeEach, vi } from 'vitest';
import { successResponse, errorResponse } from '../response';

describe('Response Helpers', () => {
  beforeEach(() => {
    // Mock Date to have consistent timestamps in tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('successResponse', () => {
    it('should create a success response with data', () => {
      const data = { id: '123', name: 'Test' };
      const response = successResponse(data);

      expect(response).toEqual({
        success: true,
        data: { id: '123', name: 'Test' },
        meta: {
          timestamp: '2025-01-15T10:00:00.000Z',
        },
      });
    });

    it('should include custom meta fields', () => {
      const data = { result: 'ok' };
      const response = successResponse(data, { requestId: 'abc-123' });

      expect(response.meta).toEqual({
        timestamp: '2025-01-15T10:00:00.000Z',
        requestId: 'abc-123',
      });
    });

    it('should handle null data', () => {
      const response = successResponse(null);

      expect(response.success).toBe(true);
      expect(response.data).toBeNull();
    });

    it('should handle array data', () => {
      const data = [1, 2, 3];
      const response = successResponse(data);

      expect(response.data).toEqual([1, 2, 3]);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('errorResponse', () => {
    it('should create an error response with code and message', () => {
      const response = errorResponse('NOT_FOUND', 'Resource not found');

      expect(response).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
        meta: {
          timestamp: '2025-01-15T10:00:00.000Z',
        },
      });
    });

    it('should include error details when provided', () => {
      const details = { field: 'email', reason: 'Invalid format' };
      const response = errorResponse('VALIDATION_ERROR', 'Validation failed', details);

      expect(response.error.details).toEqual(details);
    });

    it('should work without details', () => {
      const response = errorResponse('INTERNAL_ERROR', 'Something went wrong');

      expect(response.error).toEqual({
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong',
      });
      expect(response.error.details).toBeUndefined();
    });

    it('should always set success to false', () => {
      const response = errorResponse('ERROR', 'Test');

      expect(response.success).toBe(false);
    });

    it('should include timestamp in meta', () => {
      const response = errorResponse('ERROR', 'Test');

      expect(response.meta?.timestamp).toBe('2025-01-15T10:00:00.000Z');
    });
  });
});
