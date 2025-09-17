# Multi-stage Dockerfile for Node.js Application
# Optimized for production with security and performance in mind

# Build stage
FROM node:18-alpine AS builder

# Set build arguments
ARG BUILD_VERSION=latest
ARG BUILD_DATE
ARG NODE_ENV=production

# Add metadata labels
LABEL maintainer="your-email@company.com"
LABEL org.opencontainers.image.title="Your App Name"
LABEL org.opencontainers.image.description="Your application description"
LABEL org.opencontainers.image.version=${BUILD_VERSION}
LABEL org.opencontainers.image.created=${BUILD_DATE}
LABEL org.opencontainers.image.source="https://github.com/your-org/your-repo"

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install dependencies
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# Remove development dependencies and unnecessary files
RUN npm prune --production && \
    rm -rf src/ tests/ docs/ *.md .git* && \
    rm -rf node_modules/.cache

# Production stage
FROM node:18-alpine AS production

# Install security updates
RUN apk upgrade --no-cache && \
    apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Create necessary directories
RUN mkdir -p /app/logs && \
    chown -R nextjs:nodejs /app/logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV LOG_LEVEL=info

# Expose port
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# Switch to non-root user
USER nextjs

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server.js"]