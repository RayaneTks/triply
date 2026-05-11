# Design System — Triply

## 1. Style visuel

- **Style principal** : Dark mode moderne, orienté data et voyage (mélange Stripe / flight radar).
- **Inspiration** : Stripe Dashboard (structure claire), Amadeus / Skyscanner (univers travel), applications de cartes 3D.
- **Principes** :
  - Clarté de lecture même avec beaucoup d’informations (prix, dates, lieux).
  - Hiérarchie visuelle forte : ce qui est cliquable / important doit être évident.
  - Atmosphère nocturne / “cockpit” pour coller à la carte 3D et à l’idée de pilotage du voyage.
- **Effets** :
  - Surfaces sombres légèrement évasées, radius 12–16px, ombres douces.
  - Pas de gradients flashy ; utiliser surtout la couleur primaire comme accent (CTA, badges, sliders).

---

## 2. Palette de couleurs — Mode sombre (par défaut)

### Tokens sémantiques

| Token            | Valeur   | Usage principal                                       |
|------------------|----------|------------------------------------------------------|
| `primary`        | #0096C7  | CTA principaux, boutons d’action, sélection active  |
| `primary-soft`   | #38BDF8  | Accent secondaire, survols                          |
| `success`        | #22C55E  | États positifs (validation d’itinéraire, OK)       |
| `warning`        | #FACC15  | Avertissements légers (saisons, météo, budget)     |
| `error`          | #F97373  | Erreurs, champs invalides                          |
| `info`           | #38BDF8  | Messages informatifs                                |

### Surfaces

| Token              | Valeur   | Usage                                      |
|--------------------|----------|-------------------------------------------|
| `surface-ground`   | #020617  | Fond global derrière la carte             |
| `surface-panel`    | #020617  | Panneaux principaux (formulaire, chat)    |
| `surface-card`     | #020617  | Cartes (résultats, éléments d’itinéraire) |
| `surface-elevated` | #0F172A  | Modales, overlays, menus                  |
| `surface-input`    | #020617  | Champs de formulaire et zones de recherche|

### Texte

| Token             | Valeur   | Ratio recommandé vs `surface-panel` |
|-------------------|----------|--------------------------------------|
| `text-primary`    | #E5E7EB  | >= 10:1                              |
| `text-secondary`  | #9CA3AF  | >= 4.5:1                             |
| `text-placeholder`| #6B7280  | >= 3:1                               |
| `text-muted`      | #4B5563  | Métadonnées, labels secondaires      |
| `text-on-primary` | #FFFFFF  | Texte sur boutons primaires          |

### Bordures & séparateurs

| Token          | Valeur   | Usage                           |
|----------------|----------|---------------------------------|
| `border-subtle`| #1F2933  | Inputs, cartes, séparateurs fins|
| `border-strong`| #334155  | Contours de panneaux            |

---

## 3. Typographie

- **Famille principale** : Chillax (déjà intégrée), utilisée pour les titres.
- **Famille secondaire** : Système (Inter / system-ui) pour le corps de texte si besoin.

### Échelle typographique

| Rôle       | Taille | Line-height | Weight | Usage                                |
|-----------|--------|-------------|--------|--------------------------------------|
| `display` | 32px   | 1.1         | 700    | Gros titres marketing (landing)      |
| `h1`      | 26px   | 1.2         | 700    | Titre de panneau (ex: “Configurez…”) |
| `h2`      | 20px   | 1.3         | 600    | Sous-titres dans un panneau          |
| `h3`      | 16px   | 1.4         | 600    | Légendes fortes (section de formulaire) |
| `body`    | 14px   | 1.6         | 400    | Corps de texte, descriptifs          |
| `label`   | 13px   | 1.5         | 500    | Labels de champs, badges             |
| `caption` | 12px   | 1.5         | 400    | Métadonnées (devise, note, etc.)    |

---

## 4. Espacement (grille 4/8px)

Tous les `gap`, `margin`, `padding` doivent utiliser ces valeurs.

| Token      | Valeur |
|-----------|--------|
| `space-1` | 4px    |
| `space-2` | 8px    |
| `space-3` | 12px   |
| `space-4` | 16px   |
| `space-5` | 24px   |
| `space-6` | 32px   |
| `space-7` | 40px   |

Application générale :

- `16px` pour le padding interne minimal des panneaux (`p-4`).
- `24px–32px` pour les sections principales (top/bottom des groupes).
- `8px–12px` entre les labels et leurs inputs.

---

## 5. Rayons, ombres et z-index

### Border-radius

| Token       | Valeur | Usage                        |
|-------------|--------|-----------------------------|
| `radius-sm` | 6px    | Badges, petits contrôles    |
| `radius-md` | 10px   | Inputs, petites cartes      |
| `radius-lg` | 14px   | Panneaux, modales, sidebar  |
| `radius-xl` | 20px   | Drawer assistant             |

### Ombres

| Token        | Valeur                                              | Usage                       |
|--------------|-----------------------------------------------------|-----------------------------|
| `shadow-sm`  | 0 1px 2px 0 rgba(0,0,0,0.35)                        | Inputs, petits boutons      |
| `shadow-md`  | 0 6px 18px rgba(0,0,0,0.55)                         | Cartes résultats            |
| `shadow-lg`  | 0 16px 40px rgba(0,0,0,0.7)                         | Assistant, modales          |

### Z-index

| Token       | Valeur | Usage               |
|-------------|--------|--------------------|
| `z-base`    | 0      | Contenu par défaut |
| `z-sidebar` | 20     | Sidebar gauche     |
| `z-map`     | 10     | Carte plein écran  |
| `z-overlay` | 40     | Overlays, menus    |
| `z-assistant` | 90   | Panneau assistant  |

---

## 6. Layout & breakpoints

### Breakpoints

| Nom | Valeur | Usage                              |
|-----|--------|------------------------------------|
| `sm`| 640px  | Petits laptops / tablette paysage  |
| `md`| 768px  | Tablette / petit desktop           |
| `lg`| 1024px | Desktop standard                   |
| `xl`| 1440px | Large desktop                      |

### Principes de layout pour Triply

- **Vue principale** : carte en plein écran, avec panneaux flottants :
  - **Panneau gauche** : configuration de voyage (wizard) en largeur fixe (max `400–440px`).
  - **Panneau assistant** : drawer flottant en bas à droite (max `600–640px` de large, `80vh` max de haut).
- **Mobile (< 768px)** :
  - Carte en arrière-plan pleine hauteur.
  - Panneau de configuration en plein écran (layer au-dessus de la carte) avec scroll interne.
  - Assistant en plein écran sliding-up (type “sheet”).

---

## 7. Formulaires Triply — règles spécifiques

- Groupes principaux dans ce sens logique :
  1. Mode de recherche (vols / hôtels activés).
  2. Origine & destination.
  3. Dates & durée.
  4. Voyageurs & budget.
  5. Préférences.
- Chaque groupe possède :
  - Un petit **titre de section** (`h3` 14–16px, semi-bold).
  - Un espacement vertical de `24px` avec le suivant.
- Tous les champs :
  - Hauteur minimum **44px**.
  - Label clair (pas de placeholder seul).
  - Texte 14px, placeholder en `text-secondary`.

---

## 8. Assistant Triply — règles de rendu

- Messages de l’assistant :
  - Contenu structuré en **Markdown** (titres `###`, listes à puces, sections).
  - Cartes implicites : chaque grande section (Transport, Hébergement, Activités, Budget, Conseils) commence par un `###` pour créer un bloc visuel.
- Fenêtre d’assistant :
  - Largeur max : `640px` sur desktop, `100%` sur mobile.
  - Hauteur max : `80vh` avec scroll interne.
  - Zones :
    - Header : titre + sous-titre explicatif.
    - Corps : liste de messages, marges internes `16px`.
    - Footer : input + CTA “Envoyer” pleine hauteur (44px mini).

---

## 9. Comportements d’interaction

- Tous les boutons et icônes cliquables :
  - Doivent avoir un état **hover** (`bg-white/10` ou `primary-soft/15`) et un état **pressed** (`scale-95` max).
  - Zone de clic >= `44x44px`.
- Les transitions d’ouverture/fermeture des panneaux (assistant, config) :
  - Durée : `200–250ms`.
  - Animation : translation verticale + légère échelle (`scale(0.97)` -> `1`) + fade-in.
  - Respecter `prefers-reduced-motion`.

---

Ce design system sert de référence pour toute évolution UI/UX de Triply. Toute modification de composants (`Sidebar`, `TripConfigurationForm`, `Assistant`, cartes de résultats, etc.) doit respecter ces tokens et principes.***
