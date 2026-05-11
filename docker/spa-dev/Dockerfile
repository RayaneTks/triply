# Next.js (App Router) dev image — service Docker tri-app.
FROM node:22-alpine AS base

WORKDIR /app/frontend/triplydev

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

FROM base AS build-deps

COPY frontend/triplydev/package.json frontend/triplydev/package-lock.json* ./

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --no-audit --no-fund && \
    npm cache clean --force

RUN chown -R nodejs:nodejs /app

FROM build-deps AS development

ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_LOGLEVEL=warn \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN apk add --no-cache su-exec

COPY docker/spa-dev/docker-entrypoint-dev.sh /usr/local/bin/docker-entrypoint-dev.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint-dev.sh && chmod +x /usr/local/bin/docker-entrypoint-dev.sh

COPY frontend/triplydev/ ./

RUN mkdir -p /app/frontend/triplydev/.next && \
    chown -R nodejs:nodejs /app

USER root

EXPOSE 3000

ENTRYPOINT ["sh", "/usr/local/bin/docker-entrypoint-dev.sh"]
CMD ["npm", "run", "dev"]
