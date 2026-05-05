#!/bin/sh
# Bind-mount + volume node_modules: volume souvent root ou vide.
set -eu
cd /app

# Le volume tri-spa-node_modules peut etre obsolete (paquets ajoutes apres 1er demarrage).
if [ ! -x "node_modules/.bin/vite" ] || [ ! -x "node_modules/.bin/tsx" ] || [ ! -d "node_modules/http-proxy-middleware" ]; then
  echo "[tri-app] node_modules incomplet ou obsolete - npm ci..."
  npm ci --no-audit --no-fund
  chown -R nodejs:nodejs /app/node_modules
fi

mkdir -p /app/node_modules/.vite
chown -R nodejs:nodejs /app/node_modules

exec su-exec nodejs "$@"
