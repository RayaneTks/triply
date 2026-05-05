#!/bin/sh
# Bind mount + volume node_modules : volume souvent root ou vide (clone neuf, multi-OS).
# On (re)installe les dependances si absentes/incompletes, puis on bascule en utilisateur nodejs.
set -eu
cd /app

if [ ! -x "node_modules/.bin/next" ] || [ ! -d "node_modules/react" ]; then
  echo "[tri-app] node_modules incomplet - npm ci..."
  npm ci --no-audit --no-fund
  chown -R nodejs:nodejs /app/node_modules
fi

mkdir -p /app/.next
chown -R nodejs:nodejs /app/node_modules /app/.next

exec su-exec nodejs "$@"
