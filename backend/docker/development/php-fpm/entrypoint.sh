#!/bin/sh
set -e

# Check if $UID and $GID are set, else fallback to default (1000:1000)
USER_ID=${UID:-1000}
GROUP_ID=${GID:-1000}

# Fix file ownership and permissions using the passed UID and GID
echo "Fixing file permissions with UID=${USER_ID} and GID=${GROUP_ID}..."
if [ "$(id -u)" = "0" ]; then
  chown -R "${UID:-1000}:${GID:-1000}" /var/www/vendor || true
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