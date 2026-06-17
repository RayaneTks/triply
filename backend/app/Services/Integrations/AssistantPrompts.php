<?php

namespace App\Services\Integrations;

/**
 * Blocs de prompts assistant (équivalent historique côté client).
 * Renforce l’itinéraire **multi-jours** en une seule réponse JSON.
 */
class AssistantPrompts
{
    public const REFUSAL_TEXT = "Désolé, en tant qu'assistant Triply, je suis spécialisé dans l'organisation de vos voyages. Je ne peux pas vous aider sur ce sujet, mais je suis disponible pour planifier votre prochaine destination !";

    public static function systemPrompt(): string
    {
        $path = resource_path('prompts/triply_system.txt');

        return is_readable($path) ? (string) file_get_contents($path) : '';
    }

    /**
     * @param  list<string>  $userPreferences
     */
    public static function preferencesInstructions(array $userPreferences): string
    {
        if ($userPreferences === []) {
            return '';
        }
        $labels = [
            'plage' => 'plage / mer',
            'montagne' => 'montagne',
            'ville' => 'ville',
            'campagne' => 'campagne',
            'aventure' => 'aventure',
            'detente' => 'détente',
            'budget' => 'budget raisonnable',
            'luxe' => 'luxe / confort',
        ];
        $resolved = array_map(fn ($p) => $labels[$p] ?? $p, $userPreferences);

        return "\n\nPRÉFÉRENCES UTILISATEUR (à prendre en compte dans tes recommandations) :\n"
            .implode(', ', $resolved)
            ."\n- Adapte tes suggestions (destinations, activités, hébergements) en fonction de ces préférences.\n"
            ."- Tu peux les mentionner naturellement si pertinent, sans les répéter systématiquement.\n";
    }

    public static function geoInstructions(string $destinationContext, string $refusalText): string
    {
        $d = $destinationContext !== '' ? $destinationContext : 'non spécifié';

        return <<<TXT


Contexte destination actuel: "{$d}".

En plus de ta réponse, si l'utilisateur mentionne un lieu (ville, pays, région) : identifie-le et fournis les coordonnées GPS.
- Pour un PAYS: suggestedZoom entre 4 et 6.
- Pour une VILLE: suggestedZoom entre 11 et 13.

Format JSON STRICT attendu (sans markdown, sans texte autour) :
{
  "reply": "Ta réponse conversationnelle...",
  "targetLocation": "Nom du lieu ou null",
  "coordinates": { "lat": number, "lng": number } ou null,
  "suggestedZoom": number (ex: 5 ou 12),
  "suggestedActivities": [
    { "title": string, "lat": number, "lng": number, "durationHours": number optionnel, "day": number optionnel }
  ],
  "step1FormPatch": null ou objet partiel pour préremplir l'étape 1 (voir bloc FORMULAIRE ÉTAPE 1)
}

Règles pour suggestedActivities (CRITIQUES) :
- Chaque élément DOIT inclure un entier **day** (1 = premier jour du séjour, jusqu’à travelDays du contexte planificateur). **day** indique le jour où placer l’activité dans l’app. N’utilise pas la même valeur **day** pour toutes les activités si travelDays > 1, sauf demande explicite d’un seul jour.
- Si l’utilisateur demande un programme pour **tout le voyage**, **tous les jours**, « l’intégralité du séjour », « jour par jour », ou équivalent : tu DOIS couvrir **chaque jour** de 1 à travelDays avec au moins **2** activités distinctes par jour (lieux différents), en respectant le budget horaire **par jour** (maxActivityHoursPerDay). Répartis explicitement **day** sur chaque activité. Ne limite pas la proposition au seul « jour sélectionné » ni au dernier jour du séjour.
- Si travelDays > 1 et que la demande est générale (« propose un programme », « des idées », etc.) sans cibler un jour unique : traite comme une demande **multi-jours** (couverture 1..travelDays) même si selectedDay vaut 1.
- Si la demande porte **uniquement** sur le jour en cours (jour « selectedDay » du contexte) ou une modification ponctuelle d’une journée : mets **day** = selectedDay pour chaque nouvelle activité (ou omet **day**, équivalent à selectedDay).
- Tableau de lieux concrets (monuments, musées, quartiers, parcs, etc.) dans la zone de la destination ou [] si hors sujet.
- Coordonnées GPS plausibles (pas 0,0). Si la question ne demande pas d'idées d'activités pour le voyage, renvoie [].
- durationHours optionnel (ex. 1.5). La somme des durées suggérées **pour un même day** ne doit pas dépasser le budget horaire du jour (maxActivityHoursPerDay) quand il est fourni ; sinon base-toi sur 6 heures par jour.

Si la demande est hors périmètre, réponds avec reply contenant EXACTEMENT ce message de refus :
"{$refusalText}"

Important : une demande d'activités, d'itinéraire, de lieux à visiter, de budget voyage ou d'organisation de séjour est TOUJOURS considérée dans le périmètre voyage.

TXT;
    }

    /**
     * @param  list<string>  $currentDayActivityTitles
     */
    public static function tripPlanningContext(
        string $destinationContext,
        float $maxActivityHoursPerDay,
        int $selectedDay,
        int $travelDays,
        string $planningMode,
        array $currentDayActivityTitles,
        bool $requestFullItinerary,
    ): string {
        $titles = $currentDayActivityTitles !== []
            ? implode(', ', $currentDayActivityTitles)
            : 'aucune activité encore';

        $minActivities = $travelDays * 3;
        $obligationHeader = ($requestFullItinerary || $travelDays > 1)
            ? "\n=== OBLIGATION ABSOLUE — COUVERTURE MULTI-JOURS ===\nLe séjour fait {$travelDays} jours. Tu dois retourner AU MOINS {$minActivities} activités au total (3 par jour × {$travelDays} jours), avec le champ **day** entier entre 1 et {$travelDays} sur CHAQUE activité.\nDistribution OBLIGATOIRE : day=1 doit apparaître, day=2 doit apparaître, ..., day={$travelDays} doit apparaître. Aucun jour omis.\nUne réponse qui ne couvre pas tous les jours sera rejetée et la requête sera renvoyée. Tu N'es PAS autorisé à proposer uniquement le jour {$selectedDay} ou uniquement le dernier jour.\n===================================================\n"
            : '';

        return <<<TXT

{$obligationHeader}
CONTEXTE PLANIFICATEUR (session courante) :
- Destination : "{$destinationContext}"
- Jour affiché / édité dans l’UI : {$selectedDay} / {$travelDays} (selectedDay = jour focal dans l’interface, travelDays = durée totale du séjour)
- Budget temps activités **par jour** : environ {$maxActivityHoursPerDay} h
- Mode utilisateur : {$planningMode}
- Activités déjà ajoutées sur le jour focal : {$titles}
- Pour suggestedActivities : complète sans dupliquer les titres déjà listés pour le jour concerné quand tu enrichis ce jour précis.

TXT;
    }

    /**
     * @param  array<string, mixed>  $snapshot
     * @param  list<string>  $hotelPreferenceLabels
     * @param  list<string>  $dietaryLabels
     */
    public static function step1FormInstructions(
        array $snapshot,
        array $hotelPreferenceLabels,
        array $dietaryLabels,
    ): string {
        $snap = json_encode($snapshot, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $hotelOpts = implode(', ', array_map(fn ($s) => json_encode($s, JSON_UNESCAPED_UNICODE), $hotelPreferenceLabels));
        $diets = implode(', ', array_map(fn ($s) => json_encode($s, JSON_UNESCAPED_UNICODE), $dietaryLabels));

        return <<<TXT


FORMULAIRE ÉTAPE 1 (Triply) — remplissage assisté :
- État actuel des champs (JSON) : {$snap}
- Quand l'utilisateur décrit un voyage, demande de préremplir / compléter le formulaire, ou donne assez d'informations (villes, dates, voyageurs, budget, horaires de vol, préférences hôtel, régime alimentaire), tu complètes "step1FormPatch" avec UNIQUEMENT les champs que tu peux en déduire. Sinon step1FormPatch vaut null.
- Champs possibles (tous optionnels dans le patch) :
  - departureCity, arrivalCity : codes IATA à 3 lettres (ex: CDG, ORY, NCE, JFK, NRT) quand tu les connais ; sinon omets.
  - arrivalCityName : nom affiché de la destination (ville ou aéroport).
  - travelerCount : entier entre 1 et 50.
  - budget : texte libre (montant ou fourchette).
  - activityTime : nombre d'heures d'activités par jour (chaîne numérique, ex: "6" ou "8").
  - outboundDate, returnDate : dates ISO AAAA-MM-JJ ; returnDate >= outboundDate.
  - outboundDepartureTime, outboundArrivalTime, returnDepartureTime, returnArrivalTime : format HH:mm (24h).
  - travelDays : nombre de jours de séjour (1–365) si l'utilisateur ne donne pas les deux dates mais donne une durée.
  - selectedOptions : sous-ensemble EXACT parmi [{$hotelOpts}] (libellés identiques caractère par caractère).
  - dietarySelections : sous-ensemble EXACT parmi [{$diets}].
- Ne mets pas de valeurs inventées douteuses : mieux vaut omettre un champ que de deviner un mauvais code IATA.
- Dans "reply", résume ce que tu as rempli ou ce qui manque encore.

Suggestions d'activités (suggestedActivities) et itinéraire :
- Le JSON ci-dessus décrit aussi le voyage déjà saisi par l'utilisateur. Pour toute proposition de POI ou d'activités, tu DOIS t'aligner sur ces données : nombre de voyageurs, budget, rythme (activityTime), dates, préférences hôtel (selectedOptions), régime alimentaire (dietarySelections), vol/hôtel manuels ou sélectionnés si présents.
- Choisis des lieux et types d'expérience cohérents (ex. familles, budget serré, contraintes alimentaires, style plage / ville / luxe, proximité logique avec l'hébergement ou la ville d'arrivée).

TXT;
    }

    public static function qaOnlyInstructions(): string
    {
        return <<<'TXT'


MODE Q&A (strict) :
- L'utilisateur pose des questions (conseils, culture, logistique, budget, etc.) sans modifier son itinéraire dans l'app.
- Tu réponds dans "reply" uniquement avec du contenu utile et concis.
- Tu DOIS renvoyer exactement :
  - "targetLocation": null
  - "coordinates": null
  - "suggestedZoom": null ou omis
  - "suggestedActivities": [] (tableau vide)
  - "step1FormPatch": null
- Ne propose pas d'ajouter des POI ni de remplir le formulaire étape 1 dans ce mode.

TXT;
    }

    public static function regenerateActivityInstructions(
        string $title,
        float $lat,
        float $lng,
        int $dayIndex,
        string $destinationContext,
    ): string {
        $dc = $destinationContext !== '' ? $destinationContext : 'non spécifié';

        return <<<TXT


TÂCHE : REMPLACER UNE ACTIVITÉ DU VOYAGE
- Jour : {$dayIndex}
- Destination / contexte : "{$dc}"
- Activité actuelle : "{$title}"
- Coordonnées actuelles : lat {$lat}, lng {$lng}

Propose UNE alternative concrète (autre lieu réel à proximité ou même ville, même type d'expérience) avec des coordonnées GPS plausibles (pas 0,0).

Format JSON STRICT (sans markdown) :
{
  "reply": "Phrase courte à l'utilisateur (pourquoi cette alternative).",
  "replacement": {
    "title": string,
    "lat": number,
    "lng": number,
    "durationHours": number optionnel (> 0)
  } ou null si impossible
}

Si tu ne peux pas proposer d'alternative fiable, mets "replacement": null et explique dans "reply".

TXT;
    }

    /**
     * Instructions pour le mode "replan sous contrainte".
     * Le modèle doit réécrire les jours affectés en préservant les étapes verrouillées
     * et en respectant la destination, les horaires d'ouverture plausibles, et les temps
     * de transit. Sortie = nouveau days[] complet avec activités.
     *
     * @param  list<array{day: int, title: string, lat: float, lng: float, durationHours?: float, locked?: bool}>  $currentActivities
     * @param  list<int>  $affectedDays
     */
    public static function replanInstructions(
        string $destinationContext,
        string $reason,
        string $details,
        int $travelDays,
        array $currentActivities,
        array $affectedDays,
    ): string {
        $destination = $destinationContext !== '' ? $destinationContext : 'destination du voyage';
        $reasonLabels = [
            'flight_delay' => "le vol de l'utilisateur est retardé",
            'weather' => 'la météo rend certaines activités impossibles',
            'health' => "l'utilisateur ou un membre du groupe est souffrant",
            'over_budget' => "l'utilisateur dépasse son budget et veut alléger",
            'time_lost' => "l'utilisateur a perdu du temps imprévu",
            'other' => "une contrainte imprévue est survenue",
        ];
        $reasonText = $reasonLabels[$reason] ?? $reasonLabels['other'];
        $affectedList = $affectedDays === [] ? 'tous les jours du séjour' : 'jours '.implode(', ', $affectedDays);

        $locked = array_values(array_filter($currentActivities, fn ($a) => ! empty($a['locked'])));
        $unlocked = array_values(array_filter($currentActivities, fn ($a) => empty($a['locked'])));

        $lockedBlock = "Aucune activité n'est verrouillée.";
        if ($locked !== []) {
            $lines = array_map(
                fn ($a) => sprintf('- jour %d : "%s" (%.4f, %.4f)', (int) $a['day'], (string) $a['title'], (float) $a['lat'], (float) $a['lng']),
                $locked
            );
            $lockedBlock = "Étapes VERROUILLÉES — à préserver telles quelles (même jour, même horaire approximatif) :\n".implode("\n", $lines);
        }

        $unlockedBlock = '';
        if ($unlocked !== []) {
            $lines = array_map(
                fn ($a) => sprintf('- jour %d : "%s"', (int) $a['day'], (string) $a['title']),
                $unlocked
            );
            $unlockedBlock = "\n\nÉtapes ré-arrangeables (à déplacer / remplacer / retirer selon la contrainte) :\n".implode("\n", $lines);
        }

        return <<<TXT


MODE REPLAN SOUS CONTRAINTE — destination "{$destination}", durée {$travelDays} jour(s).

Contrainte : {$reasonText}.
Précision utilisateur : {$details}.

Jours affectés à réécrire : {$affectedList}.

{$lockedBlock}{$unlockedBlock}

Règles de replan (CRITIQUES) :
- Tu DOIS conserver toutes les étapes verrouillées telles que listées (titre, coordonnées, jour). Ne les supprime pas, ne les déplace pas.
- Pour les autres jours affectés, propose un nouveau programme cohérent : déplace les activités, remplace celles devenues impossibles, comprime ou étale selon le temps disponible.
- Pense géographie : regroupe par zone pour limiter les transits ; ordre logique matin → après-midi → soir.
- Pense réalisme : horaires d'ouverture plausibles, temps de marche, météo si pertinente à la contrainte.
- Pour over_budget : privilégie activités gratuites/peu chères, garde 1-2 expériences fortes.
- Pour flight_delay/time_lost : compresse les jours impactés, conserve les "must-do" verrouillés.
- Pour weather : remplace l'extérieur par de l'intérieur si météo défavorable, ou inversement.
- Pour health : retire les activités physiques exigeantes, garde calme et flexible.

Format JSON STRICT (sans markdown, sans texte autour) :
{
  "reply": "Phrase courte expliquant à l'utilisateur le résumé du nouveau plan (1-2 phrases).",
  "summary": "Bullet list courte (3-5 lignes max) listant les principaux changements (déplacements, suppressions, ajouts).",
  "replannedActivities": [
    { "title": string, "lat": number, "lng": number, "durationHours": number optionnel, "day": number entier, "locked": bool optionnel }
  ],
  "affectedDays": [ entiers — jours réellement modifiés ]
}

`replannedActivities` doit contenir TOUTES les activités finales pour les jours affectés (y compris les verrouillées repositionnées si besoin). Les jours non listés dans `affectedDays` ne sont pas renvoyés.

TXT;
    }
}
