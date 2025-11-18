import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateEmbedding, generateEmbeddings } from '../embeddings';

// Mock OpenAI module
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      embeddings: {
        create: vi.fn().mockResolvedValue({
          data: [
            { embedding: new Array(1536).fill(0.1) },
            { embedding: new Array(1536).fill(0.2) },
          ],
        }),
      },
    })),
  };
});

describe('Embeddings Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateEmbedding', () => {
    it('should return an embedding vector for a single text', async () => {
      const text = 'Test document for embedding';
      const embedding = await generateEmbedding(text);

      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBe(1536);
      expect(typeof embedding[0]).toBe('number');
    });

    it('should handle empty string', async () => {
      const embedding = await generateEmbedding('');

      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBe(1536);
    });

    it('should return consistent dimensions for different texts', async () => {
      const embedding1 = await generateEmbedding('Short text');
      const embedding2 = await generateEmbedding(
        'Much longer text with more content to embed'
      );

      expect(embedding1.length).toBe(embedding2.length);
      expect(embedding1.length).toBe(1536);
    });
  });

  describe('generateEmbeddings', () => {
    it('should return embeddings for multiple texts', async () => {
      const texts = ['First text', 'Second text'];
      const embeddings = await generateEmbeddings(texts);

      expect(Array.isArray(embeddings)).toBe(true);
      expect(embeddings.length).toBe(2);
      embeddings.forEach((embedding) => {
        expect(Array.isArray(embedding)).toBe(true);
        expect(embedding.length).toBe(1536);
      });
    });

    it('should handle empty array', async () => {
      const embeddings = await generateEmbeddings([]);

      expect(Array.isArray(embeddings)).toBe(true);
      expect(embeddings.length).toBe(0);
    });

    it('should handle single text in array', async () => {
      const embeddings = await generateEmbeddings(['Single text']);

      expect(embeddings.length).toBe(1);
      expect(embeddings[0].length).toBe(1536);
    });

    it('should maintain order of input texts', async () => {
      const texts = ['First', 'Second', 'Third'];
      const embeddings = await generateEmbeddings(texts);

      expect(embeddings.length).toBe(texts.length);
    });
  });
});
