import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set default test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/rag_test?schema=public';
