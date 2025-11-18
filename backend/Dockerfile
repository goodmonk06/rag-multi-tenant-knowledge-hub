# Multi-stage build for backend
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Build the app
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
COPY prisma ./prisma/
RUN npx prisma generate
RUN npm run build

# Production image
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 fastify

# Copy necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Set ownership
RUN chown -R fastify:nodejs /app

USER fastify

EXPOSE 3001

CMD ["node", "dist/index.js"]
