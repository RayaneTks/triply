# SPA Vite + Express (racine du dépôt) — service Docker tri-app (dev).
FROM node:22-alpine AS base

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

FROM base AS build-deps

COPY package.json package-lock.json* ./

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --no-audit --no-fund && \
    npm cache clean --force

RUN mkdir -p /app/node_modules/.vite && \
    chown -R nodejs:nodejs /app

FROM build-deps AS build

COPY . .
RUN npm run build && chown -R nodejs:nodejs /app

FROM build-deps AS development

ENV NODE_ENV=development \
    NPM_CONFIG_LOGLEVEL=warn

RUN apk add --no-cache su-exec

COPY docker/spa-dev/docker-entrypoint-dev.sh /usr/local/bin/docker-entrypoint-dev.sh
RUN chmod +x /usr/local/bin/docker-entrypoint-dev.sh

COPY . .

RUN mkdir -p /app/node_modules/.vite && \
    chown -R nodejs:nodejs /app

USER root

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint-dev.sh"]
CMD ["npm", "run", "dev"]
