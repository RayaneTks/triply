# Next.js (App Router) production image — service Docker tri-app.
FROM node:22-alpine AS deps

WORKDIR /app/frontend/triplydev

COPY frontend/triplydev/package.json frontend/triplydev/package-lock.json* ./

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --no-audit --no-fund && \
    npm cache clean --force

FROM deps AS build

ENV NEXT_TELEMETRY_DISABLED=1

COPY frontend/triplydev/ ./
RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app/frontend/triplydev
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

COPY frontend/triplydev/package.json frontend/triplydev/package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --omit=dev --no-audit --no-fund && \
    npm cache clean --force

COPY --from=build /app/frontend/triplydev/.next ./.next
COPY --from=build /app/frontend/triplydev/public ./public
COPY --from=build /app/frontend/triplydev/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["npm", "run", "start"]
