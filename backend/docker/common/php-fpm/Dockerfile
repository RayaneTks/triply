# Backend php-fpm — multi-stage avec cache mounts pour rebuilds rapides.
# - apt-get : cache mount sur /var/cache/apt + /var/lib/apt → réutilisé entre rebuilds.
# - pecl + docker-php-ext : compilation des extensions, factorisée dans une layer "base".
# - composer : cache mount sur /tmp/composer-cache → réutilisé entre rebuilds.
# - COPY composer.* en premier, COPY . en dernier → cache invalidation fine.

# ============================================================
# Stage 1 — base : PHP + extensions communes (partagé prod & dev)
# ============================================================
# Image pinnée sur Debian bookworm (12) : les packages runtime apt
# (libicu72, libzip4, libpq5…) sont versionnés selon Debian. Sans pin,
# l'image `php:8.4-fpm` peut basculer sur trixie (libicu76, libzip5…)
# et casser le build avec un `apt-get install` qui ne trouve plus les
# anciens noms. Pour passer à trixie : mettre à jour ICI + libicu/libzip
# numbers ci-dessous (production stage), build + smoke-test.
FROM php:8.4-fpm-bookworm AS base

ENV COMPOSER_HOME=/tmp/composer-cache \
    COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_MEMORY_LIMIT=-1 \
    COMPOSER_PROCESS_TIMEOUT=600 \
    PHP_OPCACHE_VALIDATE_TIMESTAMPS=0

# Désactive le nettoyage apt automatique (sinon le cache mount ne survit pas)
RUN rm -f /etc/apt/apt.conf.d/docker-clean && \
    echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
        curl \
        unzip \
        libpq-dev \
        libonig-dev \
        libssl-dev \
        libxml2-dev \
        libcurl4-openssl-dev \
        libicu-dev \
        libzip-dev && \
    docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        pdo_pgsql \
        pgsql \
        opcache \
        intl \
        zip \
        bcmath \
        soap && \
    pecl install redis && \
    docker-php-ext-enable redis

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

WORKDIR /var/www

# ============================================================
# Stage 2 — builder : composer install pour la prod
# ============================================================
FROM base AS builder

# composer.json/lock d'abord → layer de dépendances stable
COPY composer.json composer.lock ./

# `composer install` avec retry x3 + backoff exponentiel.
# - COMPOSER_MAX_PARALLEL_HTTP=1 : sérialise les downloads (les VPS avec
#   connexion fragile corrompent parfois des zips en téléchargement parallèle,
#   ex. `tmp-*.zip` de 0 octet → "corrupted zip archive, try again").
# - Retry transparent : on supprime vendor/ entre tentatives pour repartir
#   d'un état propre (sinon composer croit que des libs sont déjà installées).
# - Si les 3 tentatives échouent, on sort 1 → build échoue franchement.
RUN --mount=type=cache,target=/tmp/composer-cache \
    set -eu; \
    for attempt in 1 2 3; do \
        echo "=== composer install attempt $attempt/3 ==="; \
        if COMPOSER_MAX_PARALLEL_HTTP=1 composer install \
                --no-dev --no-scripts --no-autoloader \
                --optimize-autoloader --no-interaction \
                --no-progress --prefer-dist; then \
            exit 0; \
        fi; \
        echo "composer install attempt $attempt failed"; \
        rm -rf vendor; \
        if [ "$attempt" -lt 3 ]; then \
            sleep_for=$((attempt * 10)); \
            echo "retrying in ${sleep_for}s..."; \
            sleep "$sleep_for"; \
        fi; \
    done; \
    echo "composer install failed after 3 attempts"; \
    exit 1

# Code après → ne casse pas le cache des dépendances
COPY . /var/www

RUN --mount=type=cache,target=/tmp/composer-cache \
    composer dump-autoload --optimize --no-dev

# ============================================================
# Stage 3 — production : runtime minimal
# ============================================================
# Même pin que le stage `base` (cf. commentaire ligne ~10).
FROM php:8.4-fpm-bookworm AS production

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    rm -f /etc/apt/apt.conf.d/docker-clean && \
    echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache && \
    apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
        libicu72 \
        libzip4 \
        libfcgi-bin \
        procps

# Healthcheck PHP-FPM
RUN curl -fsSL -o /usr/local/bin/php-fpm-healthcheck \
        https://raw.githubusercontent.com/renatomefi/php-fpm-healthcheck/master/php-fpm-healthcheck && \
    chmod +x /usr/local/bin/php-fpm-healthcheck

COPY ./docker/production/php-fpm/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

COPY ./storage /var/www/storage-init

# Récupère extensions PHP compilées depuis base (pas de recompilation)
COPY --from=base /usr/local/lib/php/extensions/ /usr/local/lib/php/extensions/
COPY --from=base /usr/local/etc/php/conf.d/ /usr/local/etc/php/conf.d/
COPY --from=base /usr/local/bin/docker-php-ext-* /usr/local/bin/

RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" && \
    printf "[www]\npm.status_path = /status\nping.path = /ping\n" \
        > /usr/local/etc/php-fpm.d/zz-status.conf

COPY --from=builder /var/www /var/www

WORKDIR /var/www

RUN chown -R www-data:www-data /var/www

USER www-data

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

EXPOSE 9000
CMD ["php-fpm"]

# ============================================================
# Stage 4 — development : base + xdebug + user www
# ============================================================
FROM base AS development

ARG XDEBUG_ENABLED=true
ARG XDEBUG_MODE=develop,coverage,debug,profile
ARG XDEBUG_HOST=host.docker.internal
ARG XDEBUG_IDE_KEY=DOCKER
ARG XDEBUG_LOG=/dev/stdout
ARG XDEBUG_LOG_LEVEL=0
ARG UID=1000
ARG GID=1000

RUN if [ "${XDEBUG_ENABLED}" = "true" ]; then \
        pecl install xdebug && \
        docker-php-ext-enable xdebug && \
        { \
            echo "xdebug.mode=${XDEBUG_MODE}"; \
            echo "xdebug.idekey=${XDEBUG_IDE_KEY}"; \
            echo "xdebug.log=${XDEBUG_LOG}"; \
            echo "xdebug.log_level=${XDEBUG_LOG_LEVEL}"; \
            echo "xdebug.client_host=${XDEBUG_HOST}"; \
            echo "xdebug.start_with_request=yes"; \
        } >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini ; \
    fi

# Crée un user www avec UID/GID hôte pour cohérence des permissions sur le bind-mount.
RUN if getent group ${GID}; then \
        group_name=$(getent group ${GID} | cut -d: -f1); \
        useradd -m -u ${UID} -g ${GID} -s /bin/bash www; \
    else \
        groupadd -g ${GID} www && \
        useradd -m -u ${UID} -g www -s /bin/bash www; \
        group_name=www; \
    fi && \
    sed -i "s/user = www-data/user = www/g" /usr/local/etc/php-fpm.d/www.conf && \
    sed -i "s/group = www-data/group = $group_name/g" /usr/local/etc/php-fpm.d/www.conf

COPY ./docker/development/php-fpm/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

WORKDIR /var/www

# Pas de COPY du code : il vient via bind-mount /var/www en compose.dev.yaml.
# Pas de USER : l'entrypoint root fait des chown puis exec en www.

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

EXPOSE 9000
CMD ["php-fpm"]
