# 🚀 TaskForge Makefile - Développement local Docker: Docker doit être installer et constamment ouvert

# Lance et Build l'environnement complet (back + front + DB)
up:
	docker-compose up -d --build
	docker-compose exec backend php artisan migrate

# Stopper tous les services et supprimer les conteneurs
down:
	docker-compose down

# Rebuilder + relancer (utile après modif Dockerfile ou .env)
rebuild:
	docker-compose down && docker-compose up -d --build

# Lance tous les services
start:
	docker-compose start

# Arrêtre tout les services
stop:
	docker-compose stop

# Redémarre tout les services
restart:
	docker-compose restart

# Migrer la base de données
migrate:
	docker-compose exec backend php artisan migrate

# Supprimer toutes les tables et les reseeder
fresh:
	docker-compose exec backend php artisan migrate:fresh --seed

# Seeder uniquement (Pour données fantomes)
seed:
	docker-compose exec backend php artisan db:seed

# Lancer Tinker
tinker:
	docker-compose exec backend php artisan tinker

# Lancer le terminal dans le conteneur Laravel
back:
	docker-compose exec backend bash

# Lancer le terminal dans le conteneur React
front:
	docker-compose exec frontend bash

# Afficher les logs en temps réel
logs:
	docker-compose logs -f

logs-front:
	docker-compose logs -f frontend

logs-back:
	docker-compose logs -f backend

# Générer la clé Laravel (si manquante)
key:
	docker-compose exec backend php artisan key:generate

# Lancer les tests Laravel
test:
	docker-compose exec backend php artisan test

# Nettoyer les volumes (⚠️ supprime aussi les données DB)
clean:
	docker-compose down -v