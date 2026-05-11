# Workspace dev : container "boîte à outils PHP" pour composer install initial,
# tinker manuel, scripts ad-hoc. Plus léger que l'ancien (NVM + Node 24.14.0 supprimés
# car jamais utilisés en pratique — make commands utilisent toujours tri-php-fpm).
FROM php:8.4-cli

ARG UID=1000
ARG GID=1000

ENV COMPOSER_HOME=/tmp/composer-cache \
    COMPOSER_ALLOW_SUPERUSER=1

# Active le caching apt (idem php-fpm)
RUN rm -f /etc/apt/apt.conf.d/docker-clean && \
    echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
        curl \
        unzip \
        sudo \
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
    pecl install redis xdebug && \
    docker-php-ext-enable redis xdebug

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

# xdebug optionnel via ARG
ARG XDEBUG_ENABLED=true
ARG XDEBUG_MODE=develop,coverage,debug,profile
ARG XDEBUG_HOST=host.docker.internal
ARG XDEBUG_IDE_KEY=DOCKER
ARG XDEBUG_LOG=/dev/stdout
ARG XDEBUG_LOG_LEVEL=0

RUN if [ "${XDEBUG_ENABLED}" = "true" ]; then \
        { \
            echo "xdebug.mode=${XDEBUG_MODE}"; \
            echo "xdebug.idekey=${XDEBUG_IDE_KEY}"; \
            echo "xdebug.log=${XDEBUG_LOG}"; \
            echo "xdebug.log_level=${XDEBUG_LOG_LEVEL}"; \
            echo "xdebug.client_host=${XDEBUG_HOST}"; \
            echo "xdebug.start_with_request=yes"; \
        } >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini ; \
    fi

# Utilisateur www aligné UID/GID hôte
RUN if getent group ${GID}; then \
        useradd -m -u ${UID} -g ${GID} -s /bin/bash www; \
    else \
        groupadd -g ${GID} www && \
        useradd -m -u ${UID} -g www -s /bin/bash www; \
    fi && \
    usermod -aG sudo www && \
    echo 'www ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

WORKDIR /var/www

ENTRYPOINT []
CMD ["bash"]
