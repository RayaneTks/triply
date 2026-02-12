.PHONY: help init setup up run reload rebuild down restart logs logs-back shell status test routes swagger migrate fresh key composer-install \
	docker-up docker-up-build docker-down docker-start docker-stop docker-restart docker-rebuild docker-logs docker-logs-back docker-shell-back \
	docker-migrate docker-fresh docker-seed docker-key docker-test docker-swagger docker-routes docker-clean \
	bootstrap-full bootstrap-fast ensure-env \
	local-setup local-install local-env local-key local-cache-clear local-swagger local-routes local-serve local-test local-tinker local-fresh clean

# -----------------------------------------
# Variables
# -----------------------------------------

BACKEND_DIR := backend
COMPOSE := docker compose
BACKEND_SERVICE := backend

# -----------------------------------------
# OS Detection (Windows / macOS / Linux)
# -----------------------------------------

ifeq ($(OS),Windows_NT)
	DETECTED_OS := Windows
else
	DETECTED_OS := $(shell uname)
endif

# -----------------------------------------
# Help
# -----------------------------------------

help: ## Afficher les commandes disponibles
ifeq ($(DETECTED_OS),Windows)
	@echo Usage: make ^<commande^>
	@echo.
	@findstr /R "^[a-zA-Z0-9_.-][a-zA-Z0-9_.-]*:.*## " Makefile
else
	@echo "Usage: make <commande>"
	@echo ""
	@grep -E '^[a-zA-Z0-9_.-]+:.*?## ' Makefile | sed 's/:.*##/:/'
endif

# -----------------------------------------
# Workflow principal (Docker-first)
# -----------------------------------------

init: ensure-env docker-up-build bootstrap-full ## Setup initial lourd (1ere fois)

setup: init ## Alias intuitif de init
up: ensure-env docker-up ## Demarrage rapide quotidien
run: up ## Alias intuitif
reload: bootstrap-fast ## Synchroniser backend (rapide)
rebuild: ensure-env docker-up-build bootstrap-full ## Rebuild complet
restart: docker-restart ## Redemarrer les conteneurs
down: docker-down ## Arreter l'environnement

status: ## Afficher l'etat des conteneurs
	$(COMPOSE) ps

logs: docker-logs ## Suivre tous les logs
logs-back: docker-logs-back ## Logs backend uniquement
shell: docker-shell-back ## Shell backend
test: docker-test ## Tests backend
routes: docker-routes ## Lister routes API
swagger: docker-swagger ## Regenerer Swagger
migrate: docker-migrate ## Executer migrations
fresh: docker-fresh ## Reset DB (destructif)
key: docker-key ## Regenerer APP_KEY

composer-install: ## Installer dependances PHP dans Docker
	$(COMPOSE) up -d
	$(COMPOSE) exec $(BACKEND_SERVICE) sh -lc "composer install --no-interaction --prefer-dist --optimize-autoloader"

# -----------------------------------------
# Pipelines backend
# -----------------------------------------

ensure-env: ## Creer backend/.env si absent
ifeq ($(DETECTED_OS),Windows)
	@if not exist $(BACKEND_DIR)\.env copy $(BACKEND_DIR)\.env.example $(BACKEND_DIR)\.env >nul
else
	@if [ ! -f $(BACKEND_DIR)/.env ]; then \
		cp $(BACKEND_DIR)/.env.example $(BACKEND_DIR)/.env; \
	fi
endif

bootstrap-full: ## Pipeline complet backend
	$(COMPOSE) up -d
	$(COMPOSE) exec $(BACKEND_SERVICE) sh -lc "composer install --no-interaction --prefer-dist --optimize-autoloader"
	$(COMPOSE) exec $(BACKEND_SERVICE) sh -lc "php artisan key:generate --force"
	$(COMPOSE) exec $(BACKEND_SERVICE) sh -lc "php artisan migrate --force --graceful"
	$(COMPOSE) exec $(BACKEND_SERVICE) sh -lc "php artisan optimize:clear"
	$(COMPOSE) exec $(BACKEND_SERVICE) sh -lc "php artisan l5-swagger:generate"

bootstrap-fast: ## Pipeline rapide backend
	$(COMPOSE) up -d
	$(COMPOSE) exec $(BACKEND_SERVICE) sh -lc "php artisan migrate --force --graceful"
	$(COMPOSE) exec $(BACKEND_SERVICE) sh -lc "php artisan optimize:clear"
	$(COMPOSE) exec $(BACKEND_SERVICE) sh -lc "php artisan l5-swagger:generate"

# -----------------------------------------
# Docker primitives
# -----------------------------------------

docker-up:
	$(COMPOSE) up -d

docker-up-build:
	$(COMPOSE) up -d --build

docker-down:
	$(COMPOSE) down

docker-start:
	$(COMPOSE) start

docker-stop:
	$(COMPOSE) stop

docker-restart:
	$(COMPOSE) restart

docker-rebuild:
	$(COMPOSE) down
	$(COMPOSE) up -d --build

docker-logs:
	$(COMPOSE) logs -f

docker-logs-back:
	$(COMPOSE) logs -f $(BACKEND_SERVICE)

docker-shell-back:
	$(COMPOSE) exec $(BACKEND_SERVICE) bash

docker-migrate:
	$(COMPOSE) exec $(BACKEND_SERVICE) php artisan migrate --force --graceful

docker-fresh:
	$(COMPOSE) exec $(BACKEND_SERVICE) php artisan migrate:fresh --seed --force

docker-seed:
	$(COMPOSE) exec $(BACKEND_SERVICE) php artisan db:seed --force

docker-key:
	$(COMPOSE) exec $(BACKEND_SERVICE) php artisan key:generate --force

docker-test:
	$(COMPOSE) exec $(BACKEND_SERVICE) php artisan test

docker-swagger:
	$(COMPOSE) exec $(BACKEND_SERVICE) php artisan l5-swagger:generate

docker-routes:
	$(COMPOSE) exec $(BACKEND_SERVICE) php artisan route:list --path=api

docker-clean:
	$(COMPOSE) down -v

clean: docker-clean

# -----------------------------------------
# Local (sans Docker)
# -----------------------------------------

local-install:
	composer install --working-dir $(BACKEND_DIR)

local-env:
	$(MAKE) ensure-env

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
