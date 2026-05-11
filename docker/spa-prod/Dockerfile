# Next.js production image — build standalone, runtime minimal (~150-300 MB au lieu de ~2 GB).
# Repose sur `output: "standalone"` dans next.config.ts qui produit .next/standalone/.

# ============================================================
# Stage 1 — deps : installation des dépendances de build
# ============================================================
FROM node:22-alpine AS deps

WORKDIR /app/frontend/triplydev

COPY frontend/triplydev/package.json frontend/triplydev/package-lock.json* ./

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --no-audit --no-fund

# ============================================================
# Stage 2 — build : compile Next.js en mode standalone
# ============================================================
FROM node:22-alpine AS build

WORKDIR /app/frontend/triplydev

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/frontend/triplydev/node_modules ./node_modules
COPY frontend/triplydev/ ./

RUN npm run build

# ============================================================
# Stage 3 — production : runtime minimal, non-root
# ============================================================
FROM node:22-alpine AS production

WORKDIR /app/frontend/triplydev

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Standalone output : server.js + node_modules minimal + public/ + .next/static
COPY --from=build --chown=nextjs:nodejs /app/frontend/triplydev/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/frontend/triplydev/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/frontend/triplydev/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
