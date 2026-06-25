#!/bin/sh
# Bind-mount + named volume node_modules : si le volume est vide ou obsolète après
# ajout de dépendances Next.js, on relance npm ci avant de démarrer le dev server.
set -eu
cd /app/frontend

if [ ! -f "node_modules/next/package.json" ]; then
  echo "[tri-app] node_modules incomplet ou obsolète - npm ci..."
  npm ci --no-audit --no-fund
  chown -R nodejs:nodejs /app/frontend/node_modules
fi

mkdir -p /app/frontend/.next
# .next est sur un volume nommé (compose) : chown possible ; node_modules idem.
chown -R nodejs:nodejs /app/frontend/node_modules /app/frontend/.next 2>/dev/null || true

exec su-exec nodejs "$@"
