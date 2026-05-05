#!/bin/sh
set -e

# Ne pas utiliser UID/GID ici : en sh en tant que root, UID vaut 0 et masque les vars Compose.
USER_ID=${DOCKER_UID:-1000}
GROUP_ID=${DOCKER_GID:-1000}

# Fix file ownership and permissions using the passed UID and GID
echo "Fixing file permissions with UID=${USER_ID} and GID=${GROUP_ID}..."
if [ "$(id -u)" = "0" ]; then
  chown -R "${USER_ID}:${GROUP_ID}" /var/www/vendor || true
  # Bind mount hôte : logs/cache doivent être accessibles au pool php-fpm (user www = UID/GID ci-dessus).
  mkdir -p /var/www/storage/logs /var/www/bootstrap/cache
  chown -R "${USER_ID}:${GROUP_ID}" /var/www/storage /var/www/bootstrap/cache || true
  chmod -R ug+rwX /var/www/storage /var/www/bootstrap/cache || true
else
  echo "[entrypoint] Non-root user, skip chown on /var/www/vendor"
fi

# Clear configurations to avoid caching issues in development
echo "Clearing configurations..."
if [ -f /var/www/vendor/autoload.php ]; then
  php artisan config:clear || true
  php artisan route:clear || true
  php artisan view:clear || true
else
  echo "[entrypoint] vendor/autoload.php absent, skip artisan (run composer install first)"
fi

# Run the default command (e.g., php-fpm or bash)
exec "$@"