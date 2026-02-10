.PHONY: help init setup up run reload rebuild down restart logs logs-back shell status test routes swagger migrate fresh key composer-install \
	docker-up docker-up-build docker-down docker-start docker-stop docker-restart docker-rebuild docker-logs docker-logs-back docker-shell-back \
	docker-migrate docker-fresh docker-seed docker-key docker-test docker-swagger docker-routes docker-clean \
	bootstrap-full bootstrap-fast ensure-env \
	local-setup local-install local-env local-key local-cache-clear local-swagger local-routes local-serve local-test local-tinker local-fresh

BACKEND_DIR := backend
COMPOSE := docker compose
BACKEND_SERVICE := backend

help: ## Afficher les commandes disponibles
	@echo Usage: make ^<commande^>
	@echo.
	@findstr /R "^[a-zA-Z0-9_.-][a-zA-Z0-9_.-]*:.*## " Makefile

# -----------------------------------------
# Workflow principal (Docker-first)
# -----------------------------------------

init: ensure-env docker-up-build bootstrap-full ## Setup initial lourd (1ere fois): build image + install + key + migrate + swagger

setup: init ## Alias intuitif de init

up: ensure-env docker-up ## Demarrage rapide quotidien (pas de rebuild, pas de composer install)

run: up ## Alias intuitif de up

reload: bootstrap-fast ## Synchroniser backend apres modifs code/config/routes/swagger (rapide)

rebuild: ensure-env docker-up-build bootstrap-full ## Rebuild complet (Dockerfile/deps systeme)

restart: docker-restart ## Redemarrer les conteneurs

down: docker-down ## Arreter l'environnement

status: ## Afficher l'etat des conteneurs du projet
	$(COMPOSE) ps

logs: docker-logs ## Suivre tous les logs Docker

logs-back: docker-logs-back ## Suivre les logs du backend uniquement

shell: docker-shell-back ## Ouvrir un shell dans le conteneur backend

test: docker-test ## Lancer les tests backend dans Docker

routes: docker-routes ## Lister les routes API dans Docker

swagger: docker-swagger ## Regenerer Swagger dans Docker

migrate: docker-migrate ## Executer les migrations dans Docker

fresh: docker-fresh ## Reset DB dans Docker (destructif)

key: docker-key ## Regenerer APP_KEY dans Docker

composer-install: ## Installer/mettre a jour les dependances PHP dans le conteneur
	$(COMPOSE) up -d
	$(COMPOSE) exec $(BACKEND_SERVICE) sh -lc "composer install --no-interaction"

# -----------------------------------------
# Pipelines backend
# -----------------------------------------

ensure-env: ## Creer backend/.env si absent
	@if not exist $(BACKEND_DIR)\.env copy $(BACKEND_DIR)\.env.example $(BACKEND_DIR)\.env >nul

bootstrap-full: ## Pipeline complet backend (utilise par init/rebuild)
	$(COMPOSE) up -d
	$(COMPOSE) exec $(BACKEND_SERVICE) sh -lc "composer install --no-interaction"
	$(COMPOSE) exec $(BACKEND_SERVICE) sh -lc "php artisan key:generate --force"
	$(COMPOSE) exec $(BACKEND_SERVICE) sh -lc "php artisan optimize:clear"
	$(COMPOSE) exec $(BACKEND_SERVICE) sh -lc "php artisan migrate --force --graceful"
	$(COMPOSE) exec $(BACKEND_SERVICE) sh -lc "php artisan l5-swagger:generate"

bootstrap-fast: ## Pipeline rapide backend (utilise par reload)
	$(COMPOSE) up -d
	$(COMPOSE) exec $(BACKEND_SERVICE) sh -lc "php artisan optimize:clear"
	$(COMPOSE) exec $(BACKEND_SERVICE) sh -lc "php artisan migrate --force --graceful"
	$(COMPOSE) exec $(BACKEND_SERVICE) sh -lc "php artisan l5-swagger:generate"

# -----------------------------------------
# Docker primitives (bas niveau)
# -----------------------------------------

docker-up: ## Lancer les conteneurs (rapide, sans rebuild)
	$(COMPOSE) up -d

docker-up-build: ## Build + lancer les conteneurs
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
	$(COMPOSE) logs -f $(BACKEND_SERVICE)

docker-shell-back: ## Ouvrir un shell dans le conteneur backend
	$(COMPOSE) exec $(BACKEND_SERVICE) bash

docker-migrate: ## Executer les migrations dans Docker
	$(COMPOSE) exec $(BACKEND_SERVICE) php artisan migrate --force --graceful

docker-fresh: ## Reset base dans Docker (migrate:fresh --seed)
	$(COMPOSE) exec $(BACKEND_SERVICE) php artisan migrate:fresh --seed --force

docker-seed: ## Lancer les seeders dans Docker
	$(COMPOSE) exec $(BACKEND_SERVICE) php artisan db:seed --force

docker-key: ## Generer APP_KEY dans Docker
	$(COMPOSE) exec $(BACKEND_SERVICE) php artisan key:generate --force

docker-test: ## Lancer les tests dans Docker
	$(COMPOSE) exec $(BACKEND_SERVICE) php artisan test

docker-swagger: ## Generer Swagger dans Docker
	$(COMPOSE) exec $(BACKEND_SERVICE) php artisan l5-swagger:generate

docker-routes: ## Lister les routes API dans Docker
	$(COMPOSE) exec $(BACKEND_SERVICE) php artisan route:list --path=api

docker-clean: ## Supprimer conteneurs + volumes (attention: DB perdue)
	$(COMPOSE) down -v

clean: docker-clean ## Alias de docker-clean

# -----------------------------------------
# Local (urgence / legacy, sans Docker)
# -----------------------------------------

local-install: ## [Urgence] Installer les dependances backend (composer)
	composer install --working-dir $(BACKEND_DIR)

local-env: ## [Urgence] Creer backend/.env depuis .env.example (si absent)
	@if not exist $(BACKEND_DIR)\.env copy $(BACKEND_DIR)\.env.example $(BACKEND_DIR)\.env >nul

local-key: ## [Urgence] Generer APP_KEY
	php $(BACKEND_DIR)/artisan key:generate

local-cache-clear: ## [Urgence] Vider les caches Laravel
	php $(BACKEND_DIR)/artisan optimize:clear

local-swagger: ## [Urgence] Generer la documentation Swagger
	php $(BACKEND_DIR)/artisan l5-swagger:generate

local-routes: ## [Urgence] Lister les routes API
	php $(BACKEND_DIR)/artisan route:list --path=api

local-serve: ## [Urgence] Lancer le serveur backend en local
	php $(BACKEND_DIR)/artisan serve

local-test: ## [Urgence] Lancer les tests backend
	php $(BACKEND_DIR)/artisan test

local-tinker: ## [Urgence] Ouvrir Tinker
	php $(BACKEND_DIR)/artisan tinker

local-fresh: ## [Urgence] Reset base locale (migrate:fresh --seed)
	php $(BACKEND_DIR)/artisan migrate:fresh --seed

local-setup: local-env local-install local-key local-cache-clear local-swagger ## [Urgence] Setup local complet
