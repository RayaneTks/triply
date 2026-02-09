.PHONY: help \
	local-setup local-install local-env local-key local-cache-clear local-swagger local-routes local-serve local-test local-tinker local-fresh \
	docker-up docker-down docker-start docker-stop docker-restart docker-rebuild docker-logs docker-logs-back docker-shell-back \
	docker-migrate docker-fresh docker-seed docker-key docker-test docker-swagger docker-routes docker-clean \
	bootstrap

BACKEND_DIR := backend
COMPOSE := docker compose

help: ## Afficher toutes les commandes disponibles
	@echo Usage: make ^<commande^>
	@echo.
	@findstr /R "^[a-zA-Z0-9_.-][a-zA-Z0-9_.-]*:.*## " Makefile

# -----------------------------------------
# Local (sans Docker)
# -----------------------------------------

local-install: ## Installer les dependances backend (composer)
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
