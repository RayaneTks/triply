#!/bin/sh
# Synchronise backend/.env avec les valeurs DB_* attendues par tri-postgres.
# - Ne réécrit PAS APP_KEY (généré par php artisan key:generate dans make init).
# - Ne force PAS APP_DEBUG / APP_URL : laisse ce que le dev a mis.
# - Garde uniquement la cohérence DB pour éviter qu'un drift de mot de passe
#   empêche Laravel de se connecter au volume Postgres existant.
set -eu

cd /app
ENV_FILE=.env
TEMPLATE_FILE=.env.example

if [ ! -f "$ENV_FILE" ]; then
  if [ -f "$TEMPLATE_FILE" ]; then
    cp "$TEMPLATE_FILE" "$ENV_FILE"
    echo "[ensure-env] created backend/.env from .env.example"
  else
    echo "[ensure-env] no $TEMPLATE_FILE, creating empty $ENV_FILE"
    : > "$ENV_FILE"
  fi
fi

upsert() {
  key="$1"
  value="$2"

  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

DB_DATABASE_VALUE="${DB_DATABASE:-TriplyDB}"
DB_USERNAME_VALUE="${DB_USERNAME:-laravel}"
DB_PASSWORD_VALUE="${DB_PASSWORD:-api_password}"

upsert DB_CONNECTION pgsql
upsert DB_HOST tri-postgres
upsert DB_PORT 5432
upsert DB_DATABASE "$DB_DATABASE_VALUE"
upsert DB_USERNAME "$DB_USERNAME_VALUE"
upsert DB_PASSWORD "$DB_PASSWORD_VALUE"
