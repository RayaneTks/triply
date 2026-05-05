FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --no-audit --no-fund && \
    npm cache clean --force

FROM deps AS build

COPY . .
RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000

COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --no-audit --no-fund && \
    npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/server.ts ./server.ts

EXPOSE 3000

CMD ["npm", "run", "preview"]
