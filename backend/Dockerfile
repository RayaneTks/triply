FROM php:8.3-apache AS base

ARG WWW_USER=1000
ARG WWW_GROUP=1000

WORKDIR /app

# OS dependencies + PHP extensions for Laravel.
RUN apt-get update && apt-get install -y --no-install-recommends \
    unzip zip \
    libpng-dev libfreetype6-dev \
    libjpeg62-turbo-dev \
    libonig-dev libxml2-dev \
    libzip-dev zlib1g-dev \
    libicu-dev \
    libpq-dev \
  && docker-php-ext-configure gd --with-freetype --with-jpeg \
  && docker-php-ext-install -j$(nproc) \
      pdo pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd zip intl \
  && a2enmod rewrite headers \
  && rm -rf /var/lib/apt/lists/*

# Runtime tuning for faster requests.
RUN { \
    echo 'opcache.enable=1'; \
    echo 'opcache.enable_cli=1'; \
    echo 'opcache.memory_consumption=192'; \
    echo 'opcache.interned_strings_buffer=16'; \
    echo 'opcache.max_accelerated_files=20000'; \
    echo 'opcache.validate_timestamps=1'; \
    echo 'opcache.revalidate_freq=2'; \
    echo 'realpath_cache_size=4096K'; \
    echo 'realpath_cache_ttl=600'; \
} > /usr/local/etc/php/conf.d/99-triply-performance.ini

# Composer from official image.
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Apache vhost.
COPY vhost.conf /etc/apache2/sites-available/000-default.conf

RUN groupadd -g ${WWW_GROUP} webapp \
 && useradd -m -u ${WWW_USER} -g ${WWW_GROUP} -s /bin/bash webapp


# 1) DEV target.
FROM base AS dev

# Optional dev tools.
RUN apt-get update && apt-get install -y --no-install-recommends \
    procps \
  && rm -rf /var/lib/apt/lists/*

# In dev we usually mount source code as a volume.
USER webapp
EXPOSE 80
CMD ["apache2-foreground"]


# 2) Vendor builder (prod dependencies only).
FROM base AS vendor

# Keep this step isolated for Docker layer caching.
COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --no-scripts \
    --optimize-autoloader


# 3) PROD target.
FROM base AS prod

COPY . .

# Copy pre-built vendor from the vendor stage.
COPY --from=vendor /app/vendor /app/vendor

# Prepare writable Laravel directories and permissions.
RUN mkdir -p storage bootstrap/cache \
 && chown -R webapp:webapp /app \
 && chmod -R 775 storage bootstrap/cache \
 && php artisan package:discover --ansi || true \
 && php artisan optimize || true

USER webapp
EXPOSE 80
CMD ["apache2-foreground"]
