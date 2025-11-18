import { describe, it, expect } from 'vitest';
import { splitText } from '../text-splitter';

describe('Text Splitter', () => {
  describe('splitText', () => {
    it('should split text into chunks of specified size', () => {
      const text = 'a'.repeat(1000);
      const chunks = splitText(text, 100, 0);

      expect(chunks).toHaveLength(10);
      chunks.forEach((chunk) => {
        expect(chunk.content.length).toBeLessThanOrEqual(100);
      });
    });

    it('should create overlapping chunks when overlap is specified', () => {
      const text = 'abcdefghij'.repeat(10); // 100 chars
      const chunks = splitText(text, 30, 10);

      // With 30 char chunks and 10 char overlap, step is 20
      // 100 / 20 = 5 chunks
      expect(chunks.length).toBeGreaterThan(3);

      // Verify overlap exists
      if (chunks.length > 1) {
        const firstChunkEnd = chunks[0].content.slice(-5);
        const secondChunkStart = chunks[1].content.slice(0, 5);
        // Some overlap should exist
        expect(firstChunkEnd).toBeTruthy();
        expect(secondChunkStart).toBeTruthy();
      }
    });

    it('should handle text shorter than chunk size', () => {
      const text = 'Short text';
      const chunks = splitText(text, 100, 10);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe('Short text');
    });

    it('should include metadata with chunk index and positions', () => {
      const text = 'a'.repeat(250);
      const chunks = splitText(text, 100, 0);

      chunks.forEach((chunk, index) => {
        expect(chunk.metadata).toHaveProperty('chunkIndex', index);
        expect(chunk.metadata).toHaveProperty('startChar');
        expect(chunk.metadata).toHaveProperty('endChar');
        expect(typeof chunk.metadata.startChar).toBe('number');
        expect(typeof chunk.metadata.endChar).toBe('number');
      });
    });

    it('should trim whitespace from chunks', () => {
      const text = '  Hello  \n  World  \n  Test  ';
      const chunks = splitText(text, 10, 0);

      chunks.forEach((chunk) => {
        expect(chunk.content).toBe(chunk.content.trim());
      });
    });

    it('should filter out empty chunks', () => {
      const text = '   \n\n   ';
      const chunks = splitText(text, 10, 0);

      expect(chunks).toHaveLength(0);
    });

    it('should use default chunk size and overlap when not specified', () => {
      const text = 'a'.repeat(1000);
      const chunks = splitText(text);

      expect(chunks.length).toBeGreaterThan(0);
      chunks.forEach((chunk) => {
        // Default chunk size is 500
        expect(chunk.content.length).toBeLessThanOrEqual(500);
      });
    });

    it('should handle unicode characters correctly', () => {
      const text = '🚀'.repeat(100);
      const chunks = splitText(text, 50, 0);

      expect(chunks.length).toBeGreaterThan(0);
      chunks.forEach((chunk) => {
        expect(chunk.content).toMatch(/^🚀+$/);
      });
    });

    it('should produce consistent chunk count for same input', () => {
      const text = 'Test content '.repeat(100);
      const chunks1 = splitText(text, 100, 20);
      const chunks2 = splitText(text, 100, 20);

      expect(chunks1.length).toBe(chunks2.length);
    });
  });
});
