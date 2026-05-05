# Conseil & analyse Triply (non exhaustive, regard novice)

> **Avertissement** : ce document est une **prise de notes structurée**, pas un audit professionnel certifié. Il est volontairement **non exhaustif**, peut contenir des **approximations** et ne remplace pas une revue sécurité, juridique ou une due diligence produit. Date de rédaction : mars 2026.

## Contexte rappelé

Triply vise à centraliser hôtels, vols, activités, etc., pour simplifier l’organisation de voyage. Le dépôt combine une **SPA Vite + React à la racine** (proxifiée vers Laravel), un backend Laravel (`backend/`), une app Next.js optionnelle (`frontend/triplydev/`), et Docker + Makefile à la racine.

## Environnement (repères)

Les fichiers attendus sont en pratique :

| Zone | Fichier typique |
|------|-----------------|
| Docker / base | `.env` racine (proxy SPA → Laravel, ex. `LARAVEL_API_URL`) |
| Laravel | `backend/.env` (DB, clés intégrations, copilote côté serveur) |
| Next | `frontend/triplydev/.env.local` surtout pour l’URL publique de l’API si besoin |

Les secrets sensibles (Amadeus, fournisseurs, clés de modèle) doivent rester **côté serveur Laravel** (ou variables non exposées au navigateur), pas en `NEXT_PUBLIC_*` ni en dur dans le dépôt.

## Constats principaux (avis personnel)

### Produit / UX

- Beaucoup de logique semble concentrée sur la **page d’accueil** (fichier très volumineux), ce qui peut rendre l’usage **confus** : difficile de savoir par où commencer (vol, activités, tout planifier).
- Plusieurs **modes ou intentions** possibles pour l’utilisateur ; sans **entrées claires** (écran d’accueil type « hub »), l’expérience peut paraître **chargée** ou **fastidieuse**.

### Technique (frontend)

- Fichiers très longs sur la home et le wizard de création de voyage : risque de **dette de maintenance** et de **régressions** à chaque changement.
- Présence de composants ou types qui **ne ressemblent pas au métier voyage** (ex. graphiques type burndown/velocity, org chart) : possible **héritage** d’un autre contexte — à vérifier avant refonte (imports réels vs fichiers orphelins).

### UI / design

- Variables CSS limitées ; beaucoup de styles **inline** ou couleurs **au cas par cas** : **cohérence visuelle** plus difficile sur la durée.
- Plusieurs bibliothèques d’**icônes** en parallèle : peut alourdir le bundle et la cohérence.
- Beaucoup de **polices** préchargées : à garder en tête pour les **performances** (premier chargement).

### Backend & doc

- Carte des routes utile (`backend/docs/BACKEND_WORKING_MAP.md`). Vérifier que les URLs documentées (ex. health) correspondent à ce que tu utilises réellement.
- Tests backend présents mais **surface API** plus large : la couverture n’est probablement pas **complète** (avis novice).

### Infra

- Le `Makefile` référence `compose.dev.yaml` ; le README mentionne parfois d’autres noms de fichiers compose : risque de **confusion au clone** — une passe doc unifiée aiderait.

## Idées de suite (non priorisées officiellement)

1. Découper la page d’accueil en **écrans ou sections** plus petites (hooks, contextes, routes dédiées).
2. Clarifier un **premier choix utilisateur** (déjà un vol / activités seules / tout organiser) avant d’enfoncer le détail.
3. Harmoniser **tokens** (couleurs, espacements) et réduire les styles inline.
4. Passer en revue les **dépendances** et imports non utilisés après un inventaire.
5. Ajouter des **tests** (au moins un parcours critique) avant une grosse refonte UI.

## Limites de ce document

- Pas d’audit sécurité approfondi.
- Pas de mesures de performance réelles (Lighthouse, bundle analyzer) : seulement des **hypothèses**.
- Pas de revue ligne par ligne du code.

---

*Fichier conservé à la racine du dépôt pour mémoire d’équipe. À faire évoluer ou remplacer par une analyse plus formelle si besoin.*
