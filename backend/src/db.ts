import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Enable pgvector extension
export async function initDatabase() {
  try {
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`;
    console.log('✅ Database initialized with pgvector extension');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
}
