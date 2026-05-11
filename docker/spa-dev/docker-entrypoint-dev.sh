#!/bin/sh
# Bind-mount + named volume node_modules : si le volume est vide ou obsolète après
# ajout de dépendances Next.js, on relance npm ci avant de démarrer le dev server.
set -eu
cd /app/frontend

if [ ! -x "node_modules/.bin/next" ]; then
  echo "[tri-app] node_modules incomplet ou obsolète - npm ci..."
  npm ci --no-audit --no-fund
  chown -R nodejs:nodejs /app/frontend/node_modules
fi

mkdir -p /app/frontend/.next
chown -R nodejs:nodejs /app/frontend/node_modules /app/frontend/.next

exec su-exec nodejs "$@"
