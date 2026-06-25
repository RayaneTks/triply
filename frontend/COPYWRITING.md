# Triply — Guide de copywriting (FR)

Référence de terminologie et de ton pour toute la copie de l'app (hors landing).
Objectif : une voix **simple, chaleureuse et premium**, sans jargon technique ni
marketing creux. Quand vous écrivez ou modifiez un texte, suivez ce guide.

## Principes de voix

- **Clair avant tout.** Vocabulaire courant, phrases courtes. Si un mot demande
  une explication, c'est le mauvais mot.
- **Tutoiement ? Non.** On vouvoie l'utilisateur (« vous »), de façon directe et
  cordiale.
- **Orienté action.** Les boutons commencent par un verbe (« Créer un voyage »,
  « Adapter mon voyage », « Voir le récap »).
- **Honnête.** Pas de superlatifs vides (« révolutionnaire », « ultime »,
  « incroyable »), pas de promesses floues. On décrit ce que l'app fait vraiment.
- **Encourageant dans le vide et l'erreur.** Un état vide invite à agir ; un
  message d'erreur explique le problème **et** propose une issue.
- **Zéro jargon technique exposé.** Jamais « API », « côté serveur »,
  « brouillon local », « tier », « swap », « wizard », « brief » dans l'UI.

## Glossaire — terminologie retenue

| Concept | Terme retenu | À éviter |
|---|---|---|
| Le projet de l'utilisateur | **un voyage** | trip, séjour, projet (dans l'UI) |
| Le plan complet jour par jour | **l'itinéraire** | le plan, le parcours (ambigu) |
| Une journée du voyage | **un jour** (`Jour 1`) / **la journée** (en prose) | day |
| Un élément de l'itinéraire | **une activité** | une étape, un item, un POI |
| Étapes d'un formulaire (wizard) | **une étape** (`Étape 1 / 3`) | — (sens distinct, OK) |
| L'IA d'assistance | **le copilote** (ou « copilote Triply ») | l'assistant, le concierge, l'IA, Triply IA |
| Le budget | **le budget** (« Budget total ») | enveloppe, enveloppe globale |
| Adapter l'itinéraire après un imprévu | **adapter le voyage** / **replanifier** | replan, recompose |
| Réduire les dépenses du voyage | **alléger le budget**, **trouver des économies** | reshuffle, swap |
| Le résumé partageable | **le récap** (bouton) / **le récapitulatif** (titre) | — |
| Création assistée | **le parcours guidé** | le wizard, le cadrage |
| Création libre | **le mode manuel** | mode libre, édition libre, brief |
| Hébergement | **un hôtel** (recherche) / **un hébergement** (catégorie large) | — |
| Personnes | **un voyageur / des voyageurs** | pax, personnes (rester sur voyageur) |
| Déconnexion | **Déconnexion** | Logout |
| Statut « prêt » d'un jour | **Prêt** | Cadré |
| Statut « à compléter » | **À compléter** | À creuser |

### Offres (noms produit — à NE PAS traduire/renommer)

`Découverte` (gratuit), `Voyageur`, `Pilote`. Toujours « offre » et non « plan »
ou « tier » côté utilisateur (« l'offre Voyageur »).

### Mots-clés métier conservés

`Triply`, codes IATA (CDG, BCN…), `Booking.com`, `Stripe` (contexte paiement),
`PWA`/hors-ligne. Les noms de fournisseurs techniques (Amadeus, Mapbox) ne
doivent pas apparaître dans la copie utilisateur.

## Microcopie — règles rapides

- **Boutons** : verbe + objet. « Créer un voyage », « Rechercher un vol »,
  « Voir le récap », « Réessayer ».
- **Chargement** : honnête et spécifique. « Création de votre itinéraire… »
  plutôt que « Chargement… » quand on connaît l'action.
- **Erreurs** : `[Ce qui s'est passé]. [Quoi faire].` Ex. « Connexion perdue.
  Vérifiez votre réseau puis réessayez. »
- **États vides** : reconnaître + inviter. « Aucun voyage pour l'instant.
  Créez-en un pour commencer. »
- **Toasts** : titre court (2-4 mots) + description actionnable si utile.

## Apostrophes & accents

Le JSX est en UTF-8 : conserver les vraies apostrophes typographiques `'` et les
accents (é, è, à, ç…). Échapper `'` / `"` en `&apos;` / `&quot;` uniquement dans
le texte JSX nu où c'est nécessaire pour le lint, comme le fait déjà le code.
