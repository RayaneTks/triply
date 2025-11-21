# 🌍 Triply - Plateforme de Planification de Voyage par IA

![Triply Logo](https://img.shields.io/badge/Triply-Travel%20AI-blue)
![Version](https://img.shields.io/badge/version-MVP-green)
![TypeScript](https://img.shields.io/badge/TypeScript-95.1%25-blue)
![License](https://img.shields.io/badge/license-Private-red)

## 📋 Table des Matières
- [À propos du Projet](#à-propos-du-projet)
- [Contexte Pédagogique](#contexte-pédagogique)
- [Stack Technique](#stack-technique)
- [Structure du Projet](#structure-du-projet)
- [Installation et Déploiement](#installation-et-déploiement)
- [Équipe](#équipe)
- [Roadmap du Projet](#roadmap-du-projet)

---

## 🎯 À propos du Projet

### Le Problème
Organiser un voyage est une tâche **complexe et chronophage**. Les voyageurs doivent :
- Naviguer sur 5 à 6 plateformes différentes (vols, hôtels, activités)
- Comparer manuellement les options
- Assembler le tout dans un budget donné
- Gérer le stress de la planification

### La Solution : Triply
**Triply** est une plateforme web et mobile de planification de voyage assistée par intelligence artificielle qui **centralise toutes les étapes** pour générer un itinéraire complet et optimisé en un seul clic.

### 💎 Proposition de Valeur
- **Simplicité maximale** : L'utilisateur fournit destination, période et budget/style (ex: cheap, confort)
- **Gain de temps massif** : L'IA orchestre vols, hébergements et activités
- **Cohérence budgétaire** : Optimisation automatique selon les contraintes financières

---

## 📚 Contexte Pédagogique (TechGame)

### Objectif de l'Exercice
Ce projet est une **simulation à taille réelle** visant à expérimenter :
- Les principes de l'**Agilité** (Scrum/GitHub Flow)
- Les fondamentaux de l'**Entrepreneuriat** (Business Model, Projections Financières)
- La **Gestion de Projet** professionnelle

### Structure des Phases

| Phase | Période | Objectif |
|-------|---------|----------|
| **P1** | Sept/Oct | Idéation |
| **P2** | Nov/Déc | Cadrage |
| **P3** | Janv | Cadrage Technique & Fonctionnel |
| **P4 & P5** | Fév à Mai | Développement MVP en Agile |
| **P6** | Mai/Juin | Sprints Opérationnels |
| **P7** | Juin | Clôture & Bilan |

---

## 🛠️ Stack Technique

### Frontend
- **Framework** : React 18+ avec TypeScript
- **Styling** : Tailwind CSS
- **State Management** : Context API / Redux (TBD)
- **Build Tool** : Vite
- **Component Library** : Custom library (triply-docs-lib)

### Backend
- **Framework** : Laravel (API REST)
- **Base de données** : PostgreSQL
- **Microservices** : Python (consommation APIs externes comme Amadeus)

### DevOps & Outils
- **Hébergement** : Vercel (Frontend) + Always Data (Backend)
- **Versioning** : GitHub avec GitHub Flow
- **Gestion de Projet** : Jira (Scrum)
- **Design** : Figma
- **Documentation** : Storybook

---

## 📁 Structure du Projet

```
triply/
├── triply-docs-lib/          # Librairie de composants React réutilisables
│   ├── src/                   # Code source des composants
│   ├── .storybook/            # Configuration Storybook
│   ├── package.json
│   └── README.md
│
├── triply-intro/              # Application frontend principale
│   ├── src/                   # Code source de l'application
│   ├── public/                # Assets statiques
│   ├── package.json
│   └── vite.config.ts
│
└── README.md                  # Ce fichier
```

---

## 🚀 Installation et Déploiement

### Prérequis
- **Node.js** >= 18.x
- **npm** >= 9.x
- **Git**

### 📦 Installation de la Librairie de Composants (triply-docs-lib)

```bash
# Naviguer vers le dossier de la librairie
cd triply-docs-lib

# Installer les dépendances
npm install

# Lancer Storybook pour la documentation des composants
npm run storybook

# Builder la librairie (si modifications)
npm run build

# Créer un lien npm local pour l'utiliser dans le frontend
npm link
```

### 🌐 Installation du Frontend (triply-intro)

```bash
# Naviguer vers le dossier frontend
cd triply-intro

# Installer les dépendances
npm install

# Lier la librairie de composants locale
npm link triply-docs-lib

# Lancer le serveur de développement
npm run dev
```

### 🔧 Commandes Utiles

#### Pour triply-docs-lib
```bash
npm install          # Installer les dépendances
npm run storybook    # Lancer Storybook (documentation)
npm run build        # Builder la librairie
npm link             # Créer un lien npm local
```

#### Pour triply-intro
```bash
npm install                # Installer les dépendances
npm link triply-docs-lib   # Lier la librairie de composants
npm run dev                # Lancer en mode développement
npm run build              # Builder pour la production
npm run preview            # Prévisualiser le build de production
```

### 🌍 Déploiement sur Vercel

1. **Connecter le repository GitHub à Vercel**
2. **Configurer le projet** :
   - Framework Preset : `Vite`
   - Root Directory : `triply-intro`
   - Build Command : `npm run build`
   - Output Directory : `dist`
3. **Variables d'environnement** (si nécessaire) :
   - Ajouter les clés API dans Vercel Dashboard
4. **Déployer** : Chaque push sur `main` déclenche un déploiement automatique

**URL de Production** : [https://triply-two.vercel.app](https://triply-two.vercel.app)

---

## 👥 Équipe

| Nom | Rôle | GitHub |
|-----|------|--------|
| **Rayane** | Chef de Projet / Développeur Back-end | [@RayaneTks](https://github.com/RayaneTks) |
| **Duncan** | Product Owner / Designer | - |
| **Amir** | Scrum Master | - |
| **Florent** | Développeur Full-stack | [@DacFlorent](https://github.com/DacFlorent) |
| **Elias** | Développeur Full-stack | - |
| **Abdou** | Développeur Back-end / Design / Gestion de Projet | - |

---

## 🗺️ Roadmap du Projet

### ✅ Phase Actuelle : P3 - Cadrage Technique & Fonctionnel

**Complété :**
- ✅ Setup du monorepo GitHub
- ✅ Configuration Vercel
- ✅ Création de la librairie de composants (triply-docs-lib)
- ✅ Setup Storybook pour la documentation
- ✅ Configuration Tailwind CSS
- ✅ Structure de base du frontend (triply-intro)

**En cours :**
- 🔄 Développement des composants UI de base
- 🔄 Intégration des premières pages
- 🔄 Setup du backend Laravel
- 🔄 Configuration PostgreSQL

**À venir (P4-P5) :**
- 📅 Intégration API Amadeus (vols, hôtels)
- 📅 Développement de l'algorithme d'optimisation IA
- 📅 Système d'authentification utilisateur
- 📅 Dashboard utilisateur
- 📅 Tests unitaires et d'intégration

---

## 📄 License

Ce projet est privé et destiné à un usage pédagogique dans le cadre du programme TechGame.

---

## 🔗 Liens Utiles

- **Production** : [https://triply-two.vercel.app](https://triply-two.vercel.app)
- **Jira Board** : [Lien vers Jira]
- **Figma Design** : [Lien vers Figma]
- **Documentation API** : [À venir]

---

## 📞 Contact

Pour toute question ou suggestion, contactez l'équipe via :
- **GitHub Issues** : [Créer une issue](https://github.com/RayaneTks/triply/issues)
- **Email de l'équipe** : [À définir]

---

**Fait avec ❤️ par l'équipe Triply**
