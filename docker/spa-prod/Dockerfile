FROM node:22-alpine AS deps

WORKDIR /app/frontend/triplydev

COPY frontend/triplydev/package.json frontend/triplydev/package-lock.json* ./

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --no-audit --no-fund && \
    npm cache clean --force

FROM deps AS build

COPY . .
RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app/frontend/triplydev
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000

COPY frontend/triplydev/package.json frontend/triplydev/package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --no-audit --no-fund && \
    npm cache clean --force

COPY --from=build /app/frontend/triplydev/dist ./dist
COPY --from=build /app/frontend/triplydev/server.ts ./server.ts

EXPOSE 3000

CMD ["npm", "run", "preview"]
