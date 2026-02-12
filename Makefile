.PHONY: help \
	init up run reload down rebuild restart status logs logs-back shell routes swagger test clean composer-install composer-install-dev env-sync db-ensure \
	clear \
	local-setup local-install local-env local-key local-cache-clear local-swagger local-routes local-serve local-test local-tinker local-fresh \
	docker-up docker-down docker-start docker-stop docker-restart docker-rebuild docker-logs docker-logs-back docker-shell-back \
	docker-setup docker-migrate docker-fresh docker-seed docker-key docker-test docker-swagger docker-routes docker-clean \
	bootstrap

BACKEND_DIR := backend
COMPOSE := docker compose

# -----------------------------------------
# Help
# -----------------------------------------

help:
	@echo Usage: make target
	@echo.
	@echo Docker workflow:
	@echo   make init              - full setup (build + db/bootstrap + env + migrate + swagger)
	@echo   make up                - daily startup
	@echo   make reload            - backend sync after changes
	@echo   make down              - stop containers
	@echo   make clean             - remove containers and volumes
	@echo.
	@echo Tools:
	@echo   make status            - docker service status
	@echo   make logs              - all logs
	@echo   make logs-back         - backend logs
	@echo   make shell             - backend shell
	@echo   make routes            - list API routes
	@echo   make swagger           - regenerate swagger
	@echo   make test              - backend tests

# -----------------------------------------
# Recommended workflow (Docker-first)
# -----------------------------------------

init:
	$(COMPOSE) down --remove-orphans
	$(COMPOSE) up -d --build db backend pgadmin
	$(MAKE) db-ensure
	$(MAKE) env-sync
	$(COMPOSE) exec -T backend php artisan optimize:clear
	$(COMPOSE) exec -T backend php artisan migrate --force
	-$(COMPOSE) exec -T backend php artisan l5-swagger:generate

up:
	$(COMPOSE) up -d --remove-orphans db backend pgadmin

run: up

reload:
	$(MAKE) env-sync
	$(COMPOSE) exec -T backend php artisan optimize:clear
	$(COMPOSE) exec -T backend sh -lc "php artisan migrate --force --graceful || php artisan migrate --force"
	-$(COMPOSE) exec -T backend php artisan l5-swagger:generate

down:
	$(COMPOSE) down --remove-orphans

rebuild:
	$(COMPOSE) down --remove-orphans
	$(COMPOSE) up -d --build db backend pgadmin

restart:
	$(COMPOSE) restart db backend pgadmin

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

test:
	$(COMPOSE) exec -T backend sh -lc "COMPOSER_MEMORY_LIMIT=-1 composer install --no-interaction --prefer-dist --optimize-autoloader"
	$(COMPOSE) exec -T backend php artisan test

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
