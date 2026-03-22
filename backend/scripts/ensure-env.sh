#!/bin/sh
set -eu

cd /app
ENV_FILE=.env

if [ ! -f "$ENV_FILE" ]; then
  cp .env.docker.example "$ENV_FILE"
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

upsert APP_NAME Triply
upsert APP_ENV local
upsert APP_DEBUG false
upsert APP_URL http://localhost:5173

upsert CACHE_STORE array
upsert SESSION_DRIVER array
upsert QUEUE_CONNECTION sync

upsert APP_KEY base64:C8W1u5eXUoFtljES8Tu38jm84bSgDckZnjE61lzrX/c=

upsert DB_CONNECTION pgsql
upsert DB_HOST tri-postgres
upsert DB_PORT 5432
upsert DB_DATABASE TriplyDB
upsert DB_USERNAME laravel
upsert DB_PASSWORD api_password
upsert DB_ROOT_PASSWORD api_root_password
