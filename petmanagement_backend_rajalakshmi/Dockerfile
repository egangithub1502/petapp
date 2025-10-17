# Use a specific version of Node.js for reproducibility
FROM node:18-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Stage 1: Dependencies
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# Stage 2: Builder (if needed for any build steps)
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy source code
COPY --chown=nextjs:nodejs . .

# If there are any build steps, add them here
# For this app, no build is needed as it's pure Node.js

# Stage 3: Production image
FROM base AS production
WORKDIR /app

# Copy the application code and dependencies
COPY --from=builder --chown=nextjs:nodejs /app ./

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs && \
    chown -R nextjs:nodejs /app/logs

# Switch to non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 5000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
