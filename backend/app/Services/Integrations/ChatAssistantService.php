<?php

namespace App\Services\Integrations;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatAssistantService
{
    public function __construct(
        private readonly AmadeusClient $amadeus,
    ) {}

    /**
     * @param  array<string, mixed>  $body
     * @return array<string, mixed>
     */
    public function handle(array $body): array
    {
        $apiKey = config('integrations.openai.api_key');
        if (! is_string($apiKey) || $apiKey === '') {
            return ['error' => 'Clé API OpenAI manquante côté serveur.', '_httpStatus' => 500];
        }

        $messages = is_array($body['messages'] ?? null) ? $body['messages'] : [];
        $destinationContext = is_string($body['destinationContext'] ?? null) ? $body['destinationContext'] : '';
        $userPreferences = is_array($body['userPreferences'] ?? null) ? $body['userPreferences'] : [];
        $userPreferences = array_values(array_filter($userPreferences, fn ($x) => is_string($x)));
        $chatMode = ($body['chatMode'] ?? '') === 'qa' ? 'qa' : 'itinerary';
        $intent = is_string($body['intent'] ?? null) ? $body['intent'] : '';

        $maxRaw = $body['maxActivityHoursPerDay'] ?? 0;
        $maxActivityHoursPerDay = is_numeric($maxRaw) ? (float) $maxRaw : 0.0;
        $selectedDay = is_numeric($body['selectedDay'] ?? null) ? (int) $body['selectedDay'] : 1;
        $travelDays = is_numeric($body['travelDays'] ?? null) ? (int) $body['travelDays'] : 1;
        $selectedDay = max(1, $selectedDay);
        $travelDays = max(1, $travelDays);
        $planningMode = is_string($body['planningMode'] ?? null) ? $body['planningMode'] : 'semi_ai';
        $currentDayActivityTitles = [];
        if (is_array($body['currentDayActivityTitles'] ?? null)) {
            foreach ($body['currentDayActivityTitles'] as $x) {
                if (is_string($x)) {
                    $currentDayActivityTitles[] = $x;
                }
            }
        }
        $requestFullItinerary = filter_var($body['requestFullItinerary'] ?? false, FILTER_VALIDATE_BOOL);

        $lastUserForText = null;
        foreach ($messages as $m) {
            if (is_array($m) && ($m['role'] ?? '') === 'user') {
                $lastUserForText = $m;
            }
        }
        $userText = is_array($lastUserForText) && is_string($lastUserForText['content'] ?? null) ? $lastUserForText['content'] : '';

        if (! $requestFullItinerary && $chatMode !== 'qa' && $travelDays > 1 && $userText !== '') {
            $t = mb_strtolower($userText);
            $hints = ['tous les jours', 'chaque jour', 'jour par jour', 'tout le séjour', 'toute la semaine', 'programme complet', 'intégral', 'planning complet', 'emploi du temps', 'pour chaque jour', 'sur plusieurs jours'];
            foreach ($hints as $h) {
                if (str_contains($t, $h)) {
                    $requestFullItinerary = true;
                    break;
                }
            }
        }

        $step1FormSnapshot = is_array($body['step1FormSnapshot'] ?? null) && ! array_is_list($body['step1FormSnapshot'])
            ? $body['step1FormSnapshot'] : [];
        $step1HotelOptionLabels = [];
        if (is_array($body['step1HotelOptionLabels'] ?? null)) {
            foreach ($body['step1HotelOptionLabels'] as $x) {
                if (is_string($x)) {
                    $step1HotelOptionLabels[] = $x;
                }
            }
        }
        $step1DietaryLabels = [];
        if (is_array($body['step1DietaryLabels'] ?? null)) {
            foreach ($body['step1DietaryLabels'] as $x) {
                if (is_string($x)) {
                    $step1DietaryLabels[] = $x;
                }
            }
        }

        $refusal = AssistantPrompts::REFUSAL_TEXT;

        if ($intent === 'regenerate_activity') {
            return $this->handleRegenerateActivity($body, $destinationContext, $selectedDay, $userPreferences, $refusal, $apiKey);
        }

        $gate = $this->quickGate($userText, $refusal);
        if (! $gate['allow']) {
            return [
                'reply' => $gate['response'],
                'locations' => [],
                'suggestedActivities' => [],
                'step1FormPatch' => null,
                'replacement' => null,
            ];
        }

        $planningBlock = '';
        if ($chatMode !== 'qa' && (trim($destinationContext) !== '' || $maxActivityHoursPerDay > 0)) {
            $planningBlock = AssistantPrompts::tripPlanningContext(
                $destinationContext,
                $maxActivityHoursPerDay > 0 ? $maxActivityHoursPerDay : 8.0,
                $selectedDay,
                $travelDays,
                $planningMode,
                $currentDayActivityTitles,
                $requestFullItinerary,
            );
        }

        $step1Block = $chatMode === 'qa' ? '' : AssistantPrompts::step1FormInstructions(
            $step1FormSnapshot,
            $step1HotelOptionLabels,
            $step1DietaryLabels,
        );

        $geoBlock = $chatMode === 'qa' ? '' : AssistantPrompts::geoInstructions($destinationContext, $refusal);
        $qaBlock = $chatMode === 'qa' ? AssistantPrompts::qaOnlyInstructions() : '';
        $prefBlock = AssistantPrompts::preferencesInstructions($userPreferences);

        $systemContent = AssistantPrompts::systemPrompt().$planningBlock.$step1Block.$geoBlock.$qaBlock.$prefBlock;

        $openaiMessages = [['role' => 'system', 'content' => $systemContent]];
        foreach ($messages as $m) {
            if (! is_array($m)) {
                continue;
            }
            $role = $m['role'] ?? '';
            $content = $m['content'] ?? '';
            if (($role === 'user' || $role === 'assistant') && is_string($content)) {
                $openaiMessages[] = ['role' => $role, 'content' => $content];
            }
        }

        $model = (string) config('integrations.openai.model');
        $baseUrl = (string) config('integrations.openai.base_url');

        $res = Http::withToken($apiKey)
            ->acceptJson()
            ->timeout(120)
            ->post($baseUrl.'/chat/completions', [
                'model' => $model,
                'response_format' => ['type' => 'json_object'],
                'messages' => $openaiMessages,
            ]);

        if (! $res->successful()) {
            Log::warning('OpenAI assistant error', ['status' => $res->status(), 'body' => $res->body()]);

            return ['error' => 'Le service de messagerie est temporairement indisponible.', '_httpStatus' => 502];
        }

        $rawContent = $res->json('choices.0.message.content');
        $parsedAI = [];
        try {
            $parsedAI = is_string($rawContent) ? json_decode($rawContent, true, 512, JSON_THROW_ON_ERROR) : [];
        } catch (\Throwable) {
            return ['error' => 'Réponse du service invalide.', '_httpStatus' => 502];
        }
        if (! is_array($parsedAI)) {
            $parsedAI = [];
        }

        $finalLocations = [];
        $suggestedActivities = $this->normalizeSuggestedActivities($parsedAI['suggestedActivities'] ?? null);
        $step1FormPatch = Step1FormPatchNormalizer::normalize(
            $parsedAI['step1FormPatch'] ?? null,
            $step1HotelOptionLabels,
            $step1DietaryLabels,
        );

        if ($chatMode === 'qa') {
            $suggestedActivities = [];
            $step1FormPatch = null;
        } else {
            $targetLocation = $parsedAI['targetLocation'] ?? $destinationContext;
            $aiCoordinates = is_array($parsedAI['coordinates'] ?? null) ? $parsedAI['coordinates'] : null;
            $aiZoom = $parsedAI['suggestedZoom'] ?? null;
            $finalLat = is_array($aiCoordinates) && isset($aiCoordinates['lat']) ? (float) $aiCoordinates['lat'] : null;
            $finalLng = is_array($aiCoordinates) && isset($aiCoordinates['lng']) ? (float) $aiCoordinates['lng'] : null;
            $finalName = is_string($targetLocation) ? $targetLocation : $destinationContext;
            $finalZoom = is_numeric($aiZoom) ? (float) $aiZoom : 10.0;

            if (is_string($targetLocation) && trim($targetLocation) !== '' && ($finalLat === null || $finalLng === null)) {
                $geo = $this->amadeus->firstCityGeo($targetLocation);
                if ($geo !== null) {
                    $finalLat = $geo['lat'];
                    $finalLng = $geo['lng'];
                    $finalName = $geo['name'];
                }
            }

            if ($finalLat !== null && $finalLng !== null && is_finite($finalLat) && is_finite($finalLng)) {
                $finalLocations[] = [
                    'id' => 'city-center',
                    'title' => $finalName !== '' ? $finalName : 'Destination',
                    'coordinates' => ['latitude' => $finalLat, 'longitude' => $finalLng],
                    'zoom' => $finalZoom,
                    'type' => 'city-center',
                ];
            }
        }

        return [
            'reply' => is_string($parsedAI['reply'] ?? null) ? $parsedAI['reply'] : '',
            'locations' => $finalLocations,
            'suggestedActivities' => $suggestedActivities,
            'step1FormPatch' => $step1FormPatch,
            'replacement' => null,
        ];
    }

    /**
     * @param  array<string, mixed>  $body
     * @param  list<string>  $userPreferences
     * @return array<string, mixed>
     */
    private function handleRegenerateActivity(
        array $body,
        string $destinationContext,
        int $selectedDay,
        array $userPreferences,
        string $refusal,
        string $apiKey,
    ): array {
        $ra = $body['regenerateActivity'] ?? null;
        if (! is_array($ra)) {
            return ['error' => 'regenerateActivity requis.', '_httpStatus' => 400];
        }
        $title = is_string($ra['title'] ?? null) ? trim($ra['title']) : '';
        $lat = isset($ra['lat']) ? (float) $ra['lat'] : NAN;
        $lng = isset($ra['lng']) ? (float) $ra['lng'] : NAN;
        $dayIndex = isset($ra['dayIndex']) && is_numeric($ra['dayIndex']) ? (int) $ra['dayIndex'] : $selectedDay;
        $dest = is_string($ra['destinationContext'] ?? null) ? $ra['destinationContext'] : $destinationContext;
        if ($title === '' || ! is_finite($lat) || ! is_finite($lng)) {
            return ['error' => 'title, lat, lng invalides.', '_httpStatus' => 400];
        }

        $regenSystem = AssistantPrompts::systemPrompt()
            .AssistantPrompts::regenerateActivityInstructions($title, $lat, $lng, $dayIndex, $dest)
            .AssistantPrompts::preferencesInstructions($userPreferences);

        $model = (string) config('integrations.openai.model');
        $baseUrl = (string) config('integrations.openai.base_url');

        $res = Http::withToken($apiKey)
            ->acceptJson()
            ->timeout(90)
            ->post($baseUrl.'/chat/completions', [
                'model' => $model,
                'response_format' => ['type' => 'json_object'],
                'messages' => [
                    ['role' => 'system', 'content' => $regenSystem],
                    ['role' => 'user', 'content' => 'Propose une alternative concrète pour remplacer cette activité. Réponds uniquement en JSON.'],
                ],
            ]);

        if (! $res->successful()) {
            return ['error' => 'Le service de messagerie est temporairement indisponible.', '_httpStatus' => 502];
        }

        $rawContent = $res->json('choices.0.message.content');
        try {
            $parsedAI = is_string($rawContent) ? json_decode($rawContent, true, 512, JSON_THROW_ON_ERROR) : [];
        } catch (\Throwable) {
            return ['error' => 'Réponse du service invalide.', '_httpStatus' => 502];
        }
        if (! is_array($parsedAI)) {
            $parsedAI = [];
        }

        return [
            'reply' => is_string($parsedAI['reply'] ?? null) ? $parsedAI['reply'] : '',
            'replacement' => $this->normalizeReplacement($parsedAI['replacement'] ?? null),
            'locations' => [],
            'suggestedActivities' => [],
            'step1FormPatch' => null,
        ];
    }

    /**
     * @return list<array{title: string, lat: float, lng: float, durationHours?: float, day?: int}>
     */
    private function normalizeSuggestedActivities(mixed $raw): array
    {
        if (! is_array($raw)) {
            return [];
        }
        $out = [];
        foreach ($raw as $item) {
            if (! is_array($item)) {
                continue;
            }
            $title = isset($item['title']) && is_string($item['title']) ? trim($item['title']) : '';
            $lat = isset($item['lat']) ? (float) $item['lat'] : NAN;
            $lng = isset($item['lng']) ? (float) $item['lng'] : NAN;
            if ($title === '' || ! is_finite($lat) || ! is_finite($lng)) {
                continue;
            }
            if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
                continue;
            }
            $row = ['title' => $title, 'lat' => $lat, 'lng' => $lng];
            if (isset($item['durationHours']) && is_numeric($item['durationHours']) && (float) $item['durationHours'] > 0) {
                $row['durationHours'] = (float) $item['durationHours'];
            }
            if (isset($item['day']) && is_numeric($item['day'])) {
                $d = (int) $item['day'];
                if ($d >= 1 && $d <= 365) {
                    $row['day'] = $d;
                }
            }
            $out[] = $row;
            if (count($out) >= 24) {
                break;
            }
        }

        return $out;
    }

    /**
     * @return array{title: string, lat: float, lng: float, durationHours?: float}|null
     */
    private function normalizeReplacement(mixed $raw): ?array
    {
        if (! is_array($raw)) {
            return null;
        }
        $title = isset($raw['title']) && is_string($raw['title']) ? trim($raw['title']) : '';
        $lat = isset($raw['lat']) ? (float) $raw['lat'] : NAN;
        $lng = isset($raw['lng']) ? (float) $raw['lng'] : NAN;
        if ($title === '' || ! is_finite($lat) || ! is_finite($lng)) {
            return null;
        }
        if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
            return null;
        }
        $row = ['title' => $title, 'lat' => $lat, 'lng' => $lng];
        if (isset($raw['durationHours']) && is_numeric($raw['durationHours']) && (float) $raw['durationHours'] > 0) {
            $row['durationHours'] = (float) $raw['durationHours'];
        }

        return $row;
    }

    /**
     * @return array{allow: bool, response: string}
     */
    private function quickGate(string $userText, string $refusalText): array
    {
        $t = trim($userText);
        if ($t === '') {
            return ['allow' => false, 'response' => $refusalText];
        }
        $patterns = [
            '/ignore (all|previous|above) (instructions?|prompt)/i',
            '/(system|reveal|show|display|print)\s*(prompt|instructions?)/i',
            '/jailbreak/i',
            '/\bdan\s+mode\b/i',
            '/developer\s*(mode|message)/i',
            '/bypass\s*(safety|restrictions)/i',
            '/prompt\s*injection/i',
            '/(forget|ignore)\s*(your|these)\s*(rules|instructions)/i',
        ];
        foreach ($patterns as $re) {
            if (preg_match($re, $t)) {
                return ['allow' => false, 'response' => $refusalText];
            }
        }

        return ['allow' => true, 'response' => ''];
    }
}
