# Next.js (frontend/triplydev/) — service Docker tri-app (dev).
# Image dev autonome : `next dev` avec hot-reload, monté en bind mount depuis la racine du dépôt.
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_LOGLEVEL=warn \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN apk add --no-cache su-exec && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

COPY docker/development/docker-entrypoint-dev.sh /usr/local/bin/docker-entrypoint-dev.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint-dev.sh && chmod +x /usr/local/bin/docker-entrypoint-dev.sh

EXPOSE 3000

ENTRYPOINT ["sh", "/usr/local/bin/docker-entrypoint-dev.sh"]
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]
