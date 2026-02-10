FROM php:8.3-apache AS base

ARG WWW_USER=1000
ARG WWW_GROUP=1000

WORKDIR /app

# Dependances OS + extensions PHP Laravel
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates git curl unzip zip \
    libpng-dev libfreetype6-dev \
    libjpeg62-turbo-dev \
    libonig-dev \
    libzip-dev zlib1g-dev \
    libicu-dev \
    libpq-dev \
  && docker-php-ext-configure gd --with-freetype --with-jpeg \
  && docker-php-ext-install -j$(nproc) \
      pdo pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd zip intl \
  && a2enmod rewrite headers \
  && rm -rf /var/lib/apt/lists/*

# Composer depuis l'image officielle
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Configuration Apache (vhost)
COPY vhost.conf /etc/apache2/sites-available/000-default.conf
COPY docker/php/conf.d/opcache.ini /usr/local/etc/php/conf.d/99-opcache.ini

RUN groupadd -g ${WWW_GROUP} webapp \
 && useradd -m -u ${WWW_USER} -g ${WWW_GROUP} -s /bin/bash webapp

# 1) DEV target : Pour developper
FROM base AS dev

# En dev, on monte le code en volume via docker-compose
USER root
EXPOSE 80
CMD ["apache2-foreground"]

# 2) Builder vendors PROD : install des dependances PHP
FROM base AS vendor

# Important pour le cache Docker : on copie d'abord composer.* uniquement
COPY composer.json composer.lock ./

# Dependencies PROD uniquement
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader

# 3) PROD target : image finale
FROM base AS prod

# Copie du code applicatif
COPY . .

# Copie du dossier vendor construit dans le stage "vendor"
COPY --from=vendor /app/vendor /app/vendor

# Prepare les dossiers Laravel + permissions
RUN mkdir -p storage bootstrap/cache \
 && chown -R webapp:webapp /app \
 && chmod -R 775 storage bootstrap/cache

USER webapp
EXPOSE 80
CMD ["apache2-foreground"]
