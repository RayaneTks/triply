#!/bin/sh
# Dev Next.js : avec bind-mount + volume nommé sur node_modules, le volume est
# souvent vide au premier run — on installe les deps si next est absent.
set -eu
cd /app

if [ ! -x "node_modules/.bin/next" ]; then
  echo "[tri-app] node_modules incomplet ou volume vide — npm ci…"
  npm ci --no-audit --no-fund
  chown -R nodejs:nodejs /app/node_modules
fi

# Volume nommé tri-frontend_next : créé en root par Docker — sans chown, Next (user nodejs) ne peut pas écrire.
mkdir -p /app/.next
chown -R nodejs:nodejs /app/.next

exec su-exec nodejs "$@"
