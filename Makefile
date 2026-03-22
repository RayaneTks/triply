.PHONY: help \
	init install migrate up run reload down rebuild restart status logs logs-back shell routes swagger test clean composer-install composer-install-dev env-sync db-ensure \
	pgadmin-reset \
	vendor-init composer-init \
	verify test-auth test-feature test-unit \
	clear \
	local-setup local-install local-env local-key local-cache-clear local-swagger local-routes local-serve local-test local-test-auth local-test-feature local-test-unit local-tinker local-fresh \
	docker-up docker-down docker-start docker-stop docker-restart docker-rebuild docker-logs docker-logs-back docker-shell-back \
	docker-setup docker-migrate docker-fresh docker-seed docker-key docker-test docker-test-auth docker-test-feature docker-test-unit docker-swagger docker-routes docker-clean \
	bootstrap

BACKEND_DIR := backend
COMPOSE := docker compose
DOCKER_SERVICES := db backend pgadmin

# -----------------------------------------
# Help
# -----------------------------------------

help:
	@echo Usage: make target
	@echo.
	@echo Docker workflow:
	@echo   make init              - full setup (build + db/bootstrap + env + migrate + swagger)
	@echo   make install           - alias of make init
	@echo   make migrate           - run safe DB migrations in backend container
	@echo   make up                - daily startup
	@echo   make reload            - backend sync after changes
	@echo   make down              - stop containers
	@echo   make clean             - remove containers and volumes
	@echo.
	@echo Tools:
	@echo   make status            - docker service status
	@echo   make logs              - all logs
	@echo   make logs-back         - backend logs
	@echo   make pgadmin-reset     - reset pgadmin container data and reload preconfigured server
	@echo   make shell             - backend shell
	@echo   make routes            - list API routes
	@echo   make swagger           - regenerate swagger
	@echo   make verify            - full backend checks (composer dev deps + tests)
	@echo   make test              - backend tests (all)
	@echo   make test-auth         - auth tests only
	@echo   make test-feature      - feature tests only
	@echo   make test-unit         - unit tests only

# -----------------------------------------
# Recommended workflow (Docker-first)
# -----------------------------------------

init:
	$(COMPOSE) -f compose.dev.yaml down --remove-orphans
	$(COMPOSE) -f compose.dev.yaml up -d --build --remove-orphans
	$(MAKE) vendor-init
	$(MAKE) composer-init
	$(COMPOSE) -f compose.dev.yaml exec -T tri-php-fpm php artisan key:generate --force
	$(COMPOSE) -f compose.dev.yaml exec -T tri-php-fpm php artisan optimize:clear
	$(COMPOSE) -f compose.dev.yaml exec -T tri-php-fpm sh -lc "php artisan migrate --force --graceful || php artisan migrate --force"
	-$(COMPOSE) -f compose.dev.yaml exec -T tri-php-fpm php artisan l5-swagger:generate

vendor-init:
	$(COMPOSE) -f compose.dev.yaml run --rm --no-deps --user 0:0 tri-workspace sh -lc "mkdir -p /var/www/vendor && chown -R $${UID:-1000}:$${GID:-1000} /var/www/vendor && chmod -R 775 /var/www/vendor"

composer-init:
	$(COMPOSE) -f compose.dev.yaml run --rm --no-deps tri-workspace sh -lc "if [ ! -f /var/www/vendor/autoload.php ]; then echo '[composer-init] vendor missing, running composer install'; composer install --no-interaction --prefer-dist; else echo '[composer-init] vendor already present, skipping composer install'; fi"

install: init

migrate:
	$(COMPOSE) exec -T backend sh -lc "php artisan migrate --force --graceful || php artisan migrate --force"
	$(MAKE) verify

up:
	$(COMPOSE) up -d --remove-orphans $(DOCKER_SERVICES)

run: up

reload:
	$(MAKE) env-sync
	$(COMPOSE) exec -T backend php artisan optimize:clear
	$(COMPOSE) exec -T backend sh -lc "php artisan migrate --force --graceful || php artisan migrate --force"
	-$(COMPOSE) exec -T backend php artisan l5-swagger:generate
	$(MAKE) verify

down:
	$(COMPOSE) down --remove-orphans

rebuild:
	$(COMPOSE) down --remove-orphans
	$(COMPOSE) up -d --build $(DOCKER_SERVICES)

restart:
	$(COMPOSE) restart $(DOCKER_SERVICES)

status:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs -f

logs-back:
	$(COMPOSE) logs -f backend

shell:
	$(COMPOSE) exec backend bash

routes:
	$(COMPOSE) exec -T backend php artisan route:list --path=api

swagger:
	$(COMPOSE) exec -T backend php artisan l5-swagger:generate

verify:
	$(COMPOSE) exec -T backend sh -lc "COMPOSER_MEMORY_LIMIT=-1 composer install --no-interaction --prefer-dist --optimize-autoloader"
	$(MAKE) test

test:
	$(COMPOSE) exec -T backend php artisan test

test-auth:
	$(COMPOSE) exec -T backend php artisan test tests/Feature/AuthEndpointsTest.php

test-feature:
	$(COMPOSE) exec -T backend php artisan test tests/Feature

test-unit:
	$(COMPOSE) exec -T backend php artisan test tests/Unit

composer-install:
	$(COMPOSE) exec -T backend sh -lc "COMPOSER_MEMORY_LIMIT=-1 composer install --no-dev --no-interaction --prefer-dist --no-scripts --optimize-autoloader"

composer-install-dev:
	$(COMPOSE) exec -T backend sh -lc "COMPOSER_MEMORY_LIMIT=-1 composer install --no-interaction --prefer-dist --optimize-autoloader"

env-sync:
	$(COMPOSE) up -d db backend
	$(COMPOSE) exec -T backend sh /app/scripts/ensure-env.sh

db-ensure:
	$(COMPOSE) up -d db
	$(COMPOSE) exec -T db sh -lc 'set -eu; ADMIN_USER=""; for u in backend postgres; do if psql -U "$$u" -d postgres -tAc "select 1" >/dev/null 2>&1; then ADMIN_USER="$$u"; break; fi; done; if [ -z "$$ADMIN_USER" ]; then echo "No PostgreSQL admin user found (backend/postgres)."; exit 1; fi; if ! psql -U "$$ADMIN_USER" -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='\''backend'\''" | grep -q 1; then psql -U "$$ADMIN_USER" -d postgres -c "CREATE ROLE backend WITH LOGIN PASSWORD '\''backend'\''"; fi; if ! psql -U "$$ADMIN_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='\''TriplyDB'\''" | grep -q 1; then psql -U "$$ADMIN_USER" -d postgres -c "CREATE DATABASE \"TriplyDB\" OWNER backend"; fi; psql -U "$$ADMIN_USER" -d postgres -c "ALTER DATABASE \"TriplyDB\" OWNER TO backend"; psql -U "$$ADMIN_USER" -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE \"TriplyDB\" TO backend";'

pgadmin-reset:
	$(COMPOSE) rm -sfv pgadmin
	$(COMPOSE) up -d db pgadmin

clean:
	$(COMPOSE) down -v --remove-orphans

clear: clean

# -----------------------------------------
# Local (without Docker)
# -----------------------------------------

local-install:
	composer install --working-dir $(BACKEND_DIR)

local-env:
	@if [ ! -f $(BACKEND_DIR)/.env ]; then cp $(BACKEND_DIR)/.env.example $(BACKEND_DIR)/.env; fi

local-key:
	php $(BACKEND_DIR)/artisan key:generate

local-cache-clear:
	php $(BACKEND_DIR)/artisan optimize:clear

local-swagger:
	php $(BACKEND_DIR)/artisan l5-swagger:generate

local-routes:
	php $(BACKEND_DIR)/artisan route:list --path=api

local-serve:
	php $(BACKEND_DIR)/artisan serve

local-test:
	php $(BACKEND_DIR)/artisan test

local-test-auth:
	php $(BACKEND_DIR)/artisan test tests/Feature/AuthEndpointsTest.php

local-test-feature:
	php $(BACKEND_DIR)/artisan test tests/Feature

local-test-unit:
	php $(BACKEND_DIR)/artisan test tests/Unit

local-tinker:
	php $(BACKEND_DIR)/artisan tinker

local-fresh:
	php $(BACKEND_DIR)/artisan migrate:fresh --seed

local-setup: local-env local-install local-key local-cache-clear local-swagger

bootstrap: local-setup

# -----------------------------------------
# Legacy docker-* aliases
# -----------------------------------------

docker-up: up
docker-down: down
docker-start: up

docker-stop:
	$(COMPOSE) stop

docker-restart: restart
docker-rebuild: rebuild
docker-logs: logs
docker-logs-back: logs-back
docker-shell-back: shell
docker-test: test
docker-test-auth: test-auth
docker-test-feature: test-feature
docker-test-unit: test-unit
docker-swagger: swagger
docker-routes: routes
docker-clean: clean

docker-setup:
	$(COMPOSE) exec -T backend php artisan key:generate --force
	$(COMPOSE) exec -T backend php artisan migrate --force

docker-migrate:
	$(COMPOSE) exec -T backend php artisan migrate --force

docker-fresh:
	$(COMPOSE) exec -T backend php artisan migrate:fresh --seed --force

docker-seed:
	$(COMPOSE) exec -T backend php artisan db:seed --force

docker-key:
	$(COMPOSE) exec -T backend php artisan key:generate --force
