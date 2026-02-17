.PHONY: help \
	init install migrate up run reload down rebuild restart status logs logs-back shell routes swagger test clean composer-install composer-install-dev env-sync db-ensure \
	clear \
	local-setup local-install local-env local-key local-cache-clear local-swagger local-routes local-serve local-test local-tinker local-fresh \
	docker-up docker-down docker-start docker-stop docker-restart docker-rebuild docker-logs docker-logs-back docker-shell-back \
	docker-migrate docker-fresh docker-seed docker-key docker-test docker-swagger docker-routes docker-clean \
	bootstrap

BACKEND_DIR := backend
COMPOSE := docker compose

help: ## Afficher toutes les commandes disponibles
	@echo Usage: make ^<commande^>
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
	@echo   make shell             - backend shell
	@echo   make routes            - list API routes
	@echo   make swagger           - regenerate swagger
	@echo   make test              - backend tests

# -----------------------------------------
# Local (sans Docker)
# -----------------------------------------

init:
	$(COMPOSE) down --remove-orphans
	$(COMPOSE) up -d --build db backend pgadmin
	$(MAKE) db-ensure
	$(MAKE) env-sync
	$(COMPOSE) exec -T backend php artisan optimize:clear
	$(COMPOSE) exec -T backend php artisan migrate --force
	-$(COMPOSE) exec -T backend php artisan l5-swagger:generate

install: init

migrate:
	$(COMPOSE) exec -T backend sh -lc "php artisan migrate --force --graceful || php artisan migrate --force"

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

local-env: ## Creer backend/.env depuis .env.example (si absent)
	@if [ ! -f $(BACKEND_DIR)/.env ]; then cp $(BACKEND_DIR)/.env.example $(BACKEND_DIR)/.env; fi

local-key: ## Generer APP_KEY
	php $(BACKEND_DIR)/artisan key:generate

local-cache-clear: ## Vider les caches Laravel
	php $(BACKEND_DIR)/artisan optimize:clear

local-swagger: ## Generer la documentation Swagger
	php $(BACKEND_DIR)/artisan l5-swagger:generate

local-routes: ## Lister les routes API
	php $(BACKEND_DIR)/artisan route:list --path=api

local-serve: ## Lancer le serveur backend en local
	php $(BACKEND_DIR)/artisan serve

local-test: ## Lancer les tests backend
	php $(BACKEND_DIR)/artisan test

local-tinker: ## Ouvrir Tinker
	php $(BACKEND_DIR)/artisan tinker

local-fresh: ## Reset base sqlite locale (migrate:fresh --seed)
	php $(BACKEND_DIR)/artisan migrate:fresh --seed

local-setup: local-env local-install local-key local-cache-clear local-swagger ## Setup local complet (sans DB externe)

bootstrap: local-setup ## Alias de setup local

# -----------------------------------------
# Docker (compose)
# -----------------------------------------

docker-up: ## Build et lancer les conteneurs
	$(COMPOSE) up -d --build

docker-down: ## Arreter et supprimer les conteneurs
	$(COMPOSE) down

docker-start: ## Demarrer les conteneurs existants
	$(COMPOSE) start

docker-stop: ## Stopper les conteneurs
	$(COMPOSE) stop

docker-restart: ## Redemarrer les conteneurs
	$(COMPOSE) restart

docker-rebuild: ## Rebuild complet des conteneurs
	$(COMPOSE) down
	$(COMPOSE) up -d --build

docker-logs: ## Afficher tous les logs docker
	$(COMPOSE) logs -f

docker-logs-back: ## Afficher les logs backend docker
	$(COMPOSE) logs -f backend

docker-shell-back: ## Ouvrir un shell dans le conteneur backend
	$(COMPOSE) exec backend bash

docker-migrate: ## Executer les migrations dans Docker
	$(COMPOSE) exec backend php artisan migrate

docker-fresh: ## Reset base dans Docker (migrate:fresh --seed)
	$(COMPOSE) exec backend php artisan migrate:fresh --seed

docker-seed: ## Lancer les seeders dans Docker
	$(COMPOSE) exec backend php artisan db:seed

docker-key: ## Generer APP_KEY dans Docker
	$(COMPOSE) exec backend php artisan key:generate

docker-test: ## Lancer les tests dans Docker
	$(COMPOSE) exec backend php artisan test

docker-swagger: ## Generer Swagger dans Docker
	$(COMPOSE) exec backend php artisan l5-swagger:generate

docker-routes: ## Lister les routes API dans Docker
	$(COMPOSE) exec backend php artisan route:list --path=api

docker-clean: ## Supprimer conteneurs + volumes (attention: DB perdue)
	$(COMPOSE) down -v
