#!/bin/sh
# Bind-mount + volume node_modules : volume souvent root ou vide — npm ci + chown avant de lancer Vite en nodejs.
set -eu
cd /app

# Le volume tri-spa-node_modules peut être obsolète (paquets ajoutés après le 1er démarrage).
if [ ! -x "node_modules/.bin/vite" ] || [ ! -x "node_modules/.bin/tsx" ] || [ ! -d "node_modules/http-proxy-middleware" ]; then
  echo "[tri-app] node_modules incomplet ou obsolète — npm ci…"
  npm ci --no-audit --no-fund
  chown -R nodejs:nodejs /app/node_modules
fi

mkdir -p /app/node_modules/.vite
chown -R nodejs:nodejs /app/node_modules

exec su-exec nodejs "$@"
