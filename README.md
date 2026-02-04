# Triply - Gestion d'événements & invitations

## Prérequis
- Python 3.12+
- PostgreSQL (ou SQLite pour le dev rapide)
- Node.js (optionnel si vous voulez compiler Tailwind localement)

## Installation (Windows-friendly)
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Configuration
Créer un fichier `.env` à la racine :
```env
SECRET_KEY=change-me
DEBUG=True
DATABASE_URL=postgres://user:password@localhost:5432/triply
```

> Astuce : si vous n'avez pas PostgreSQL sous la main, laissez `DATABASE_URL` vide pour utiliser SQLite.

## Migrations & données de démo
```bash
python manage.py migrate
python manage.py loaddata fixtures/demo_templates.json
python manage.py createsuperuser
```

## Lancer le serveur
```bash
python manage.py runserver
```

## Tailwind (optionnel)
Ce projet utilise le CDN Tailwind par défaut. Pour une compilation locale, vous pouvez configurer Tailwind avec votre workflow préféré.

## Pages principales
- `/` : Dashboard
- `/events` : liste événements
- `/templates` : templates d'invitation
- `/templates/<id>/edit` : éditeur Canva (Fabric.js)
- `/scanner/<event_id>` : scan QR
- `/invite/<token>` : page invité

## Tests
```bash
python manage.py test
```
