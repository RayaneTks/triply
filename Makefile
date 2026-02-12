.RECIPEPREFIX := >

.PHONY: help \
	init up run reload down rebuild restart status logs logs-back shell routes swagger test clean composer-install \
	local-setup local-install local-env local-key local-cache-clear local-swagger local-routes local-serve local-test local-tinker local-fresh \
	docker-up docker-down docker-start docker-stop docker-restart docker-rebuild docker-logs docker-logs-back docker-shell-back \
	docker-setup docker-migrate docker-fresh docker-seed docker-key docker-test docker-swagger docker-routes docker-clean \
	bootstrap

BACKEND_DIR := backend
COMPOSE := docker compose

help: ## Afficher toutes les commandes disponibles
> @echo Usage: make ^<commande^>
> @echo.
ifeq ($(OS),Windows_NT)
> @awk "BEGIN {FS=\":.*## \"}; /^[a-zA-Z0-9_.-]+:.*## / {printf \"%-20s %s\n\", $$1, $$2}" Makefile 2>NUL || findstr /R "^[a-zA-Z0-9_.-][a-zA-Z0-9_.-]*:.*## " Makefile
else
> @awk 'BEGIN {FS=":.*## "}; /^[a-zA-Z0-9_.-]+:.*## / {printf "%-20s %s\n", $$1, $$2}' Makefile
endif

# -----------------------------------------
# Workflow recommande (Docker-first)
# -----------------------------------------

init: ## Premier setup complet (build + deps + key + cache clear + migrate + swagger)
> $(COMPOSE) up -d --build db backend
> $(COMPOSE) exec -T backend composer install --no-interaction --prefer-dist --optimize-autoloader
> $(COMPOSE) exec -T backend php artisan key:generate --force
> $(COMPOSE) exec -T backend php artisan optimize:clear
> $(COMPOSE) exec -T backend php artisan migrate --force
> $(COMPOSE) exec -T backend php artisan l5-swagger:generate

up: ## Demarrage quotidien rapide (sans rebuild)
> $(COMPOSE) up -d db backend

run: up ## Alias de up

reload: ## Sync backend apres changements (cache clear + migrate graceful + swagger)
> $(COMPOSE) exec -T backend php artisan optimize:clear
> $(COMPOSE) exec -T backend sh -lc "php artisan migrate --force --graceful || php artisan migrate --force"
> $(COMPOSE) exec -T backend php artisan l5-swagger:generate

down: ## Arreter les conteneurs
> $(COMPOSE) down

rebuild: ## Rebuild complet quand Dockerfile/deps systeme changent
> $(COMPOSE) down
> $(COMPOSE) up -d --build db backend

composer-install: ## Installer/mettre a jour les dependances PHP backend
> $(COMPOSE) exec -T backend composer install --no-interaction --prefer-dist --optimize-autoloader

restart: ## Redemarrer les conteneurs backend + db
> $(COMPOSE) restart db backend

status: ## Etat des services Docker
> $(COMPOSE) ps

logs: ## Logs complets Docker
> $(COMPOSE) logs -f

logs-back: ## Logs backend uniquement
> $(COMPOSE) logs -f backend

shell: ## Shell dans le conteneur backend
> $(COMPOSE) exec backend bash

routes: ## Lister les routes API
> $(COMPOSE) exec -T backend php artisan route:list --path=api

swagger: ## Regenerer Swagger
> $(COMPOSE) exec -T backend php artisan l5-swagger:generate

test: ## Lancer les tests backend
> $(COMPOSE) exec -T backend php artisan test

clean: ## Stop + suppression des volumes (destructif)
> $(COMPOSE) down -v

# -----------------------------------------
# Local (sans Docker)
# -----------------------------------------

local-install: ## Installer les dependances backend (composer)
> composer install --working-dir $(BACKEND_DIR)

local-env: ## Creer backend/.env depuis .env.example (si absent)
> @if [ ! -f $(BACKEND_DIR)/.env ]; then cp $(BACKEND_DIR)/.env.example $(BACKEND_DIR)/.env; fi

local-key: ## Generer APP_KEY
> php $(BACKEND_DIR)/artisan key:generate

local-cache-clear: ## Vider les caches Laravel
> php $(BACKEND_DIR)/artisan optimize:clear

local-swagger: ## Generer la documentation Swagger
> php $(BACKEND_DIR)/artisan l5-swagger:generate

local-routes: ## Lister les routes API
> php $(BACKEND_DIR)/artisan route:list --path=api

local-serve: ## Lancer le serveur backend en local
> php $(BACKEND_DIR)/artisan serve

local-test: ## Lancer les tests backend
> php $(BACKEND_DIR)/artisan test

local-tinker: ## Ouvrir Tinker
> php $(BACKEND_DIR)/artisan tinker

local-fresh: ## Reset base sqlite locale (migrate:fresh --seed)
> php $(BACKEND_DIR)/artisan migrate:fresh --seed

local-setup: local-env local-install local-key local-cache-clear local-swagger ## Setup local complet (sans DB externe)

bootstrap: local-setup ## Alias de setup local

# -----------------------------------------
# Compatibilite anciennes commandes docker-*
# -----------------------------------------

docker-up: init ## Compat

docker-down: down ## Compat

docker-start: up ## Compat

docker-stop: ## Compat
> $(COMPOSE) stop

docker-restart: restart ## Compat

docker-rebuild: rebuild ## Compat

docker-logs: logs ## Compat

docker-logs-back: logs-back ## Compat

docker-shell-back: shell ## Compat

docker-setup: ## Compat
> $(COMPOSE) exec -T backend php artisan key:generate --force
> $(COMPOSE) exec -T backend php artisan migrate --force

docker-migrate: ## Compat
> $(COMPOSE) exec -T backend php artisan migrate --force

docker-fresh: ## Compat
> $(COMPOSE) exec -T backend php artisan migrate:fresh --seed --force

docker-seed: ## Compat
> $(COMPOSE) exec -T backend php artisan db:seed --force

docker-key: ## Compat
> $(COMPOSE) exec -T backend php artisan key:generate --force

docker-test: test ## Compat

docker-swagger: swagger ## Compat

docker-routes: routes ## Compat

docker-clean: clean ## Compat
