FROM php:8.3-apache AS base

ARG WWW_USER=1000
ARG WWW_GROUP=1000

WORKDIR /app

# Dépendances OS + extensions PHP Laravel
RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl unzip zip \
    libpng-dev libfreetype6-dev \
    libjpeg62-turbo-dev \
    libonig-dev libxml2-dev \
    libzip-dev zlib1g-dev \
    libicu-dev \
    libpq-dev \
    default-mysql-client \
  && docker-php-ext-configure gd --with-freetype --with-jpeg \
  && docker-php-ext-install -j$(nproc) \
      pdo pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd zip intl \
  && a2enmod rewrite headers \
  && rm -rf /var/lib/apt/lists/*

# Composer depuis l'image officielle
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Configuration Apache (vhost)
COPY vhost.conf /etc/apache2/sites-available/000-default.conf

RUN groupadd -g ${WWW_GROUP} webapp \
 && useradd -m -u ${WWW_USER} -g ${WWW_GROUP} -s /bin/bash webapp


# 1) DEV target : Pour développer
FROM base AS dev

# (Optionnel) outils dev
RUN apt-get update && apt-get install -y --no-install-recommends \
    procps \
  && rm -rf /var/lib/apt/lists/*

# En dev, on va généralement monter le code en volume (docker run / compose),
# donc pas besoin de COPY . .
# Si tu veux une image "standalone" pour dev, décommente :
# COPY . .

USER webapp
EXPOSE 80
CMD ["apache2-foreground"]


# 2) Builder vendors PROD : install des dépendances PHP
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
COPY --from=vendor /var/www/html/vendor /var/www/html/vendor

# Prépare les dossiers Laravel + permissions
RUN mkdir -p storage bootstrap/cache \
 && chown -R webapp:webapp /var/www/html \
 && chmod -R 775 storage bootstrap/cache

# Bonnes pratiques prod (si tu veux activer opcache, ajoute un ini opcache)
# RUN docker-php-ext-install opcache

USER webapp
EXPOSE 80
CMD ["apache2-foreground"]