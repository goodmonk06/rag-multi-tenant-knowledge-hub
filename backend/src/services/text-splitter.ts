import { config } from '../config';

export interface TextChunk {
  content: string;
  metadata: {
    chunkIndex: number;
    startChar: number;
    endChar: number;
  };
}

export function splitText(
  text: string,
  chunkSize: number = config.chunkSize,
  overlap: number = config.chunkOverlap
): TextChunk[] {
  const chunks: TextChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    const content = text.slice(startIndex, endIndex);

    chunks.push({
      content: content.trim(),
      metadata: {
        chunkIndex,
        startChar: startIndex,
        endChar: endIndex,
      },
    });

    chunkIndex++;
    startIndex += chunkSize - overlap;
  }

  return chunks.filter((chunk) => chunk.content.length > 0);
}
