# ========================================
# Optimized Multi-Stage Dockerfile
# Node.js TypeScript Application
# ========================================

# Node LTS (22) : meilleure compatibilité libs / sécurité que les tags « latest » ou majeures impaires.
FROM node:22-alpine AS base

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

# ========================================
# Dependencies Stage
# ========================================
FROM base AS deps

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --omit=dev && \
    npm cache clean --force

# Set proper ownership
RUN chown -R nodejs:nodejs /app

# ========================================
# Build Dependencies Stage
# ========================================
FROM base AS build-deps

# Copy package files
COPY package*.json ./

# Install all dependencies with build optimizations
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --no-audit --no-fund && \
    npm cache clean --force

# Create necessary directories and set permissions
RUN mkdir -p /app/node_modules/.vite && \
    chown -R nodejs:nodejs /app

# ========================================
# Build Stage
# ========================================
FROM build-deps AS build

# Copy only necessary files for building (respects .dockerignore)
COPY --chown=nodejs:nodejs . .

# Build the application
RUN npm run build

# Set proper ownership
RUN chown -R nodejs:nodejs /app

# ========================================
# Development Stage
# ========================================
FROM build-deps AS development

# Set environment
ENV NODE_ENV=development \
    NPM_CONFIG_LOGLEVEL=warn

# Copy source files
COPY . .

# Ensure all directories have proper permissions
RUN mkdir -p /app/node_modules/.vite && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev"]