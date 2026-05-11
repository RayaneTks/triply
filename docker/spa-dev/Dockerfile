# Next.js (App Router) dev image — service Docker tri-app.
# Stratégie : image légère qui ne contient QUE les binaires Node + node_modules.
# Le code source vient via bind-mount Compose (cf. compose.dev.yaml), pas via COPY.
# Conséquences :
#   - pas de COPY frontend/ ./ (qui invaliderait le cache à chaque save)
#   - pas de chown -R /app (qui scannait node_modules entier, ~5 minutes)
#   - npm ci tourne avec cache mount → ré-exécutions rapides
FROM node:22-alpine

WORKDIR /app/frontend

ENV NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_LOGLEVEL=warn \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN apk add --no-cache su-exec && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

COPY frontend/package.json frontend/package-lock.json* ./

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --no-audit --no-fund && \
    chown -R nodejs:nodejs /app/frontend

COPY docker/spa-dev/docker-entrypoint-dev.sh /usr/local/bin/docker-entrypoint-dev.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint-dev.sh && \
    chmod +x /usr/local/bin/docker-entrypoint-dev.sh

EXPOSE 3000

ENTRYPOINT ["sh", "/usr/local/bin/docker-entrypoint-dev.sh"]
CMD ["npm", "run", "dev"]
