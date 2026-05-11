<?php

namespace App\Services;

use App\Models\Journee;
use App\Models\Voyage;
use App\Services\Contracts\CurrencyConverterInterface;
use App\Services\Contracts\TripServiceInterface;
use App\Services\Geo\CityCountryResolverInterface;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Arr;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;

class TripService implements TripServiceInterface
{
    public function __construct(
        private readonly CurrencyConverterInterface $currencyConverter,
        private readonly CityCountryResolverInterface $cityCountryResolver,
    ) {
    }

    public function createTrip(array $payload): array
    {
        $user = Auth::user();
        if (! $user) {
            throw new ModelNotFoundException('Utilisateur non authentifie.');
        }

        $startDate = $payload['start_date'] ?? now()->toDateString();
        $endDate = $payload['end_date'] ?? $startDate;
        $planSnapshot = $payload['plan_snapshot'] ?? null;
        $storedSnapshot = $this->compactSnapshotForStorage($planSnapshot);

        $voyage = Voyage::query()->create([
            'titre' => $payload['title'],
            'destination' => $this->resolveDestination($payload['destination'], $planSnapshot),
            'date_debut' => $startDate,
            'date_fin' => $endDate,
            'budget_total' => $this->extractBudgetTotal($planSnapshot),
            'nb_voyageurs' => $payload['travelers_count'] ?? 1,
            'description' => null,
            'user_id' => $user->id,
            'plan_snapshot' => $storedSnapshot,
        ]);

        if (is_array($planSnapshot)) {
            $this->syncStructuredTripData($voyage, $planSnapshot);
        }

        return $this->serializeTrip($voyage->fresh(['transports', 'hebergements', 'journees.etapes']));
    }

    public function listTrips(): array
    {
        $user = Auth::user();
        if (! $user) {
            return ['items' => []];
        }

        $voyages = Voyage::query()
            ->where('user_id', $user->id)
            ->with(['transports', 'hebergements', 'journees.etapes'])
            ->orderByDesc('date_debut')
            ->get();

        return [
            'items' => $voyages->map(fn (Voyage $voyage) => $this->serializeTrip($voyage))->values()->all(),
        ];
    }

    public function showTrip(string $tripId): array
    {
        return $this->serializeTrip($this->findUserTrip($tripId));
    }

    public function updateTrip(string $tripId, array $payload): array
    {
        $voyage = $this->findUserTrip($tripId);

        $updates = [];
        if (array_key_exists('title', $payload)) {
            $updates['titre'] = $payload['title'];
        }
        if (array_key_exists('arrival_location', $payload)) {
            $updates['destination'] = $payload['arrival_location'];
        }
        if (array_key_exists('start_date', $payload)) {
            $updates['date_debut'] = $payload['start_date'];
        }
        if (array_key_exists('end_date', $payload)) {
            $updates['date_fin'] = $payload['end_date'];
        }
        if (array_key_exists('travelers_count', $payload)) {
            $updates['nb_voyageurs'] = $payload['travelers_count'];
        }
        if (array_key_exists('max_budget', $payload)) {
            $updates['budget_total'] = (int) $payload['max_budget'];
        }
        if (array_key_exists('plan_snapshot', $payload)) {
            $updates['plan_snapshot'] = $this->compactSnapshotForStorage($payload['plan_snapshot']);

            if (! array_key_exists('max_budget', $payload)) {
                $updates['budget_total'] = $this->extractBudgetTotal($payload['plan_snapshot']);
            }

            if (! array_key_exists('arrival_location', $payload)) {
                $updates['destination'] = $this->resolveDestination($voyage->destination, $payload['plan_snapshot']);
            }
        }

        if ($updates !== []) {
            $voyage->fill($updates);
            $voyage->save();
        }

        if (array_key_exists('plan_snapshot', $payload)) {
            if (is_array($payload['plan_snapshot'])) {
                $this->syncStructuredTripData($voyage, $payload['plan_snapshot']);
            } else {
                $this->clearStructuredTripData($voyage);
            }
        }

        return $this->serializeTrip($voyage->fresh(['transports', 'hebergements', 'journees.etapes']));
    }

    public function duplicateTrip(string $tripId): array
    {
        $source = $this->findUserTrip($tripId);

        $copy = $source->replicate();
        $copy->titre = $source->titre.' (copie)';
        $copy->save();

        $source->loadMissing(['transports', 'hebergements', 'journees.etapes']);
        $this->duplicateStructuredTripData($source, $copy);

        return $this->serializeTrip($copy->fresh(['transports', 'hebergements', 'journees.etapes']));
    }

    public function validateTrip(string $tripId): array
    {
        $trip = $this->findUserTrip($tripId);

        return [
            'trip_id' => $trip->id,
            'validated' => true,
        ];
    }

    public function deleteTrip(string $tripId): void
    {
        $trip = $this->findUserTrip($tripId);

        // Suppression en cascade : étapes (soft delete via le trait SoftDeletes du modèle),
        // journées, hébergements, transports puis le voyage lui-même.
        foreach ($trip->journees as $journee) {
            $journee->etapes()->delete();
        }
        $trip->journees()->delete();
        $trip->hebergements()->delete();
        $trip->transports()->delete();
        $trip->delete();
    }

    public function deleteTripCity(string $tripId, string $city): array
    {
        $trip = $this->findUserTrip($tripId);
        $cityName = trim($city);
        if ($cityName === '') {
            throw new ModelNotFoundException('Nom de ville invalide.');
        }

        // Soft-delete de toutes les etapes du voyage rattachees a cette ville (insensible a la casse).
        $deletedCount = 0;
        foreach ($trip->journees as $journee) {
            foreach ($journee->etapes()->whereRaw('LOWER(ville) = ?', [mb_strtolower($cityName)])->get() as $etape) {
                $etape->delete();
                $deletedCount++;
            }
        }

        // Nettoyer aussi le plan_snapshot pour eviter que la ville reapparaisse lors d'un refresh.
        $snapshot = is_array($trip->plan_snapshot) ? $trip->plan_snapshot : [];
        if (isset($snapshot['days']) && is_array($snapshot['days'])) {
            $cityLower = mb_strtolower($cityName);
            $snapshot['days'] = array_values(array_map(function ($day) use ($cityLower) {
                if (! is_array($day) || ! isset($day['activities']) || ! is_array($day['activities'])) {
                    return $day;
                }
                $day['activities'] = array_values(array_filter(
                    $day['activities'],
                    function ($activity) use ($cityLower) {
                        if (! is_array($activity)) {
                            return true;
                        }
                        $aCity = isset($activity['city']) && is_string($activity['city']) ? $activity['city'] : '';

                        return mb_strtolower($aCity) !== $cityLower;
                    }
                ));

                return $day;
            }, $snapshot['days']));
        }
        $trip->plan_snapshot = $snapshot;
        $trip->save();

        return [
            'trip_id' => (string) $trip->id,
            'city' => $cityName,
            'deleted_count' => $deletedCount,
        ];
    }

    public function listDays(string $tripId): array
    {
        $trip = $this->findUserTrip($tripId);

        $days = Journee::query()
            ->where('voyage_id', $trip->id)
            ->orderBy('numero_jour')
            ->get(['id', 'numero_jour', 'date_jour'])
            ->map(fn (Journee $day) => [
                'id' => (string) $day->id,
                'index' => $day->numero_jour,
                'date' => $day->date_jour,
            ])
            ->values()
            ->all();

        return [
            'trip_id' => (string) $trip->id,
            'items' => $days,
        ];
    }

    public function updateDay(string $tripId, string $dayId, array $payload): array
    {
        $trip = $this->findUserTrip($tripId);

        $day = Journee::query()
            ->where('id', $dayId)
            ->where('voyage_id', $trip->id)
            ->firstOrFail();

        if (array_key_exists('date', $payload)) {
            $day->date_jour = $payload['date'];
        }
        if (array_key_exists('index', $payload)) {
            $day->numero_jour = $payload['index'];
        }
        $day->save();

        return [
            'id' => (string) $day->id,
            'trip_id' => (string) $trip->id,
            'date' => $day->date_jour,
            'index' => $day->numero_jour,
        ];
    }

    public function recap(string $tripId): array
    {
        $trip = $this->findUserTrip($tripId);
        $tripData = $this->serializeTrip($trip);

        $sections = [];

        // Section 1 : Vols
        foreach ($trip->transports->sortBy('depart_le') as $transport) {
            $type = strtolower((string) ($transport->type ?? ''));
            if ($type === '' || str_contains($type, 'vol') || str_contains($type, 'flight') || str_contains($type, 'avion')) {
                $sections[] = [
                    'type' => 'flight',
                    'transport_id' => (string) $transport->id,
                    'depart_lieu' => $transport->depart_lieu,
                    'arrivee_lieu' => $transport->arrivee_lieu,
                    'depart_le' => $transport->depart_le?->toIso8601String(),
                    'arrivee_le' => $transport->arrivee_le?->toIso8601String(),
                    'information_supplementaire' => $transport->information_supplementaire,
                    'prix' => $transport->prix,
                    'devise' => $transport->devise,
                ];
            }
        }

        // Section 2 : Hebergements
        foreach ($trip->hebergements->sortBy('arrivee_le') as $hebergement) {
            $sections[] = [
                'type' => 'hotel',
                'nom' => $hebergement->nom,
                'adresse' => $hebergement->adresse,
                'ville' => $hebergement->ville,
                'arrivee_le' => $hebergement->arrivee_le?->toIso8601String(),
                'depart_le' => $hebergement->depart_le?->toIso8601String(),
                'prix' => $hebergement->prix,
                'devise' => $hebergement->devise,
                'latitude' => $hebergement->latitude,
                'longitude' => $hebergement->longitude,
            ];
        }

        // Section 3 : Journees + activites + polyline simplifiee
        foreach ($trip->journees->sortBy('numero_jour') as $journee) {
            $activities = [];
            $waypoints = [];

            foreach ($journee->etapes->sortBy('ordre') as $etape) {
                $extra = [];
                if (is_string($etape->description) && trim($etape->description) !== '') {
                    $decoded = json_decode($etape->description, true);
                    if (is_array($decoded)) {
                        $extra = $decoded;
                    }
                }
                $lat = isset($extra['lat']) && is_numeric($extra['lat']) ? (float) $extra['lat'] : null;
                $lng = isset($extra['lng']) && is_numeric($extra['lng']) ? (float) $extra['lng'] : null;

                $activities[] = [
                    'id' => (string) $etape->id,
                    'title' => $etape->titre,
                    'city' => $etape->ville,
                    'country' => $etape->pays,
                    'duration' => $etape->temps_estime,
                    'cost' => $etape->prix_estime,
                    'liked_state' => $etape->liked_state ?? 'neutral',
                    'lat' => $lat,
                    'lng' => $lng,
                ];

                if ($lat !== null && $lng !== null) {
                    $waypoints[] = ['lat' => $lat, 'lng' => $lng];
                }
            }

            $sections[] = [
                'type' => 'day',
                'day_id' => (string) $journee->id,
                'day_index' => $journee->numero_jour,
                'date' => $journee->date_jour,
                'activities' => $activities,
                'route_polyline' => $waypoints,
            ];
        }

        return [
            'id' => (string) $trip->id,
            'trip' => $tripData,
            'sections' => $sections,
        ];
    }

    /**
     * Construit la liste des segments « activite -> activite » par journee, avec un profil
     * de transport par defaut (driving) ou marche (< 2km).
     *
     * @return array<int, array<string, mixed>>
     */
    public function listRoutes(string $tripId): array
    {
        $trip = $this->findUserTrip($tripId);
        $segments = [];

        foreach ($trip->journees->sortBy('numero_jour') as $journee) {
            $points = [];
            foreach ($journee->etapes->sortBy('ordre') as $etape) {
                $extra = [];
                if (is_string($etape->description) && trim($etape->description) !== '') {
                    $decoded = json_decode($etape->description, true);
                    if (is_array($decoded)) {
                        $extra = $decoded;
                    }
                }
                if (! isset($extra['lat'], $extra['lng']) || ! is_numeric($extra['lat']) || ! is_numeric($extra['lng'])) {
                    continue;
                }
                $points[] = [
                    'id' => (string) $etape->id,
                    'title' => $etape->titre,
                    'lat' => (float) $extra['lat'],
                    'lng' => (float) $extra['lng'],
                ];
            }

            for ($i = 0; $i < count($points) - 1; $i++) {
                $a = $points[$i];
                $b = $points[$i + 1];
                $distanceKm = $this->haversineKm($a['lat'], $a['lng'], $b['lat'], $b['lng']);
                $profile = $distanceKm < 2.0 ? 'walking' : 'driving';
                $segments[] = [
                    'day_id' => (string) $journee->id,
                    'day_index' => $journee->numero_jour,
                    'from' => $a,
                    'to' => $b,
                    'profile' => $profile,
                    'distance_km' => round($distanceKm, 2),
                    'estimated_minutes' => $this->estimateMinutes($distanceKm, $profile),
                ];
            }
        }

        return $segments;
    }

    private function haversineKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthKm = 6371.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthKm * $c;
    }

    private function estimateMinutes(float $distanceKm, string $profile): int
    {
        $speedKmh = $profile === 'walking' ? 5.0 : ($profile === 'cycling' ? 15.0 : 35.0);

        return (int) max(1, round(($distanceKm / max(0.1, $speedKmh)) * 60));
    }

    private function findUserTrip(string $tripId): Voyage
    {
        $user = Auth::user();
        if (! $user) {
            throw new ModelNotFoundException('Utilisateur non authentifie.');
        }

        return Voyage::query()
            ->where('id', $tripId)
            ->where('user_id', $user->id)
            ->with(['transports', 'hebergements', 'journees.etapes'])
            ->firstOrFail();
    }

    private function serializeTrip(Voyage $voyage): array
    {
        $firstTransport = $voyage->transports->sortBy('depart_le')->first();
        $structuredSnapshot = $this->buildSnapshotFromStructuredData($voyage);
        $storedSnapshot = is_array($voyage->plan_snapshot) ? $voyage->plan_snapshot : [];
        $snapshot = array_replace_recursive($structuredSnapshot, $storedSnapshot);
        $start = Carbon::parse($voyage->date_debut);
        $end = Carbon::parse($voyage->date_fin);
        $today = now()->startOfDay();

        $status = 'En cours';
        if ($end->lt($today)) {
            $status = 'Termine';
        } elseif ($start->gt($today)) {
            $status = 'A venir';
        }

        return [
            'id' => (string) $voyage->id,
            'title' => $voyage->titre,
            'destination' => $voyage->destination,
            'start_date' => $this->normalizeDateString($voyage->date_debut),
            'end_date' => $this->normalizeDateString($voyage->date_fin),
            'travel_days' => max(1, $start->diffInDays($end) + 1),
            'travelers_count' => $voyage->nb_voyageurs,
            'budget_total' => $voyage->budget_total,
            'currency' => 'EUR',
            'status' => $status,
            'flight' => [
                'carrier' => $firstTransport?->type
                    ?? $this->getStringFromSnapshot($snapshot, ['flightSummary', 'carrier']),
                'price' => $firstTransport
                    ? $this->toEur((float) $firstTransport->prix, $firstTransport->devise)
                    : $this->toEur(
                        $this->extractMoney($this->getStringFromSnapshot($snapshot, ['flightSummary', 'price'])),
                        $this->getStringFromSnapshot($snapshot, ['flightSummary', 'currency'])
                    ),
            ],
            'plan_snapshot' => $snapshot,
            'created_at' => $voyage->created_at?->toISOString(),
            'updated_at' => $voyage->updated_at?->toISOString(),
        ];
    }

    /**
     * @param array<string, mixed> $snapshot
     */
    private function syncStructuredTripData(Voyage $voyage, array $snapshot): void
    {
        $this->clearStructuredTripData($voyage);

        $this->syncTransportFromSnapshot($voyage, $snapshot);
        $this->syncHebergementFromSnapshot($voyage, $snapshot);
        $this->syncDaysAndStepsFromSnapshot($voyage, $snapshot);
    }

    private function clearStructuredTripData(Voyage $voyage): void
    {
        $voyage->transports()->delete();
        $voyage->hebergements()->delete();
        $voyage->journees()->delete();
    }

    private function duplicateStructuredTripData(Voyage $source, Voyage $copy): void
    {
        foreach ($source->transports as $transport) {
            $new = $transport->replicate();
            $new->voyage_id = $copy->id;
            $new->save();
        }

        foreach ($source->hebergements as $hebergement) {
            $new = $hebergement->replicate();
            $new->voyage_id = $copy->id;
            $new->save();
        }

        foreach ($source->journees as $journee) {
            $newDay = $journee->replicate();
            $newDay->voyage_id = $copy->id;
            $newDay->save();

            foreach ($journee->etapes as $etape) {
                $newStep = $etape->replicate();
                $newStep->journee_id = $newDay->id;
                $newStep->save();
            }
        }
    }

    /**
     * @param array<string, mixed> $snapshot
     */
    private function syncTransportFromSnapshot(Voyage $voyage, array $snapshot): void
    {
        $flight = Arr::get($snapshot, 'flightSummary');
        if (! is_array($flight)) {
            return;
        }

        $price = $this->extractMoney($this->asNullableString(Arr::get($flight, 'price')));
        $currency = $this->asNullableString(Arr::get($flight, 'currency'));
        $priceEur = (int) round($this->toEur($price, $currency));

        $voyage->transports()->create([
            'type' => $this->asNullableString(Arr::get($flight, 'carrier')) ?: 'Avion',
            'depart_lieu' => $this->asNullableString(Arr::get($flight, 'originIata')) ?: 'Depart',
            'arrivee_lieu' => $this->asNullableString(Arr::get($flight, 'destinationIata')) ?: $voyage->destination,
            'depart_le' => $this->resolveDateTime(
                $this->asNullableString(Arr::get($flight, 'outboundAt')),
                Carbon::parse($voyage->date_debut)->setTime(9, 0)
            ),
            'arrivee_le' => $this->resolveDateTime(
                $this->asNullableString(Arr::get($flight, 'returnAt')),
                Carbon::parse($voyage->date_fin)->setTime(19, 0)
            ),
            'prix' => $priceEur,
            'devise' => 'EUR',
            'information_supplementaire' => $this->asNullableString(Arr::get($flight, 'bookingUrl')),
        ]);
    }

    /**
     * @param array<string, mixed> $snapshot
     */
    private function syncHebergementFromSnapshot(Voyage $voyage, array $snapshot): void
    {
        $hotel = Arr::get($snapshot, 'hotelSummary');
        if (! is_array($hotel)) {
            return;
        }

        $price = $this->extractMoney($this->asNullableString(Arr::get($hotel, 'totalPrice')));
        $currency = $this->asNullableString(Arr::get($hotel, 'currency'));
        $priceEur = (int) round($this->toEur($price, $currency));

        $voyage->hebergements()->create([
            'type' => 'Hotel',
            'nom' => $this->asNullableString(Arr::get($hotel, 'name')) ?: 'Hebergement principal',
            'adresse' => $this->asNullableString(Arr::get($hotel, 'address'))
                ?: $this->asNullableString(Arr::get($hotel, 'cityName'))
                ?: $voyage->destination,
            'code_postal' => null,
            'ville' => $this->asNullableString(Arr::get($hotel, 'cityName')) ?: $voyage->destination,
            'latitude' => is_numeric(Arr::get($hotel, 'latitude')) ? (float) Arr::get($hotel, 'latitude') : null,
            'longitude' => is_numeric(Arr::get($hotel, 'longitude')) ? (float) Arr::get($hotel, 'longitude') : null,
            'arrivee_le' => $this->resolveDateTime(
                $this->asNullableString(Arr::get($hotel, 'checkInDate')),
                Carbon::parse($voyage->date_debut)->setTime(15, 0)
            ),
            'depart_le' => $this->resolveDateTime(
                $this->asNullableString(Arr::get($hotel, 'checkOutDate')),
                Carbon::parse($voyage->date_fin)->setTime(11, 0)
            ),
            'prix' => $priceEur,
            'devise' => 'EUR',
            'informations_supplementaire' => $this->asNullableString(Arr::get($hotel, 'bookingUrl')),
        ]);
    }

    /**
     * @param array<string, mixed> $snapshot
     */
    private function syncDaysAndStepsFromSnapshot(Voyage $voyage, array $snapshot): void
    {
        $daysFromSnapshot = Arr::get($snapshot, 'days');
        $snapshotDays = [];
        if (is_array($daysFromSnapshot)) {
            foreach ($daysFromSnapshot as $entry) {
                if (! is_array($entry)) {
                    continue;
                }

                $index = (int) ($entry['dayIndex'] ?? 0);
                if ($index <= 0) {
                    continue;
                }

                $snapshotDays[$index] = $entry;
            }
        }

        $start = Carbon::parse($voyage->date_debut)->startOfDay();
        $end = Carbon::parse($voyage->date_fin)->startOfDay();
        $travelDays = max(1, $start->diffInDays($end) + 1);

        for ($dayIndex = 1; $dayIndex <= $travelDays; $dayIndex++) {
            $journee = $voyage->journees()->create([
                'numero_jour' => $dayIndex,
                'date_jour' => $start->copy()->addDays($dayIndex - 1)->toDateString(),
            ]);

            $activities = Arr::get($snapshotDays, $dayIndex.'.activities');
            if (! is_array($activities)) {
                continue;
            }

            foreach (array_values($activities) as $idx => $activity) {
                if (! is_array($activity)) {
                    continue;
                }

                $title = $this->asNullableString($activity['title'] ?? null) ?: 'Activite '.($idx + 1);
                $duration = $activity['durationHours'] ?? null;
                $extra = [];
                if (is_numeric($activity['lng'] ?? null)) {
                    $extra['lng'] = (float) $activity['lng'];
                }
                if (is_numeric($activity['lat'] ?? null)) {
                    $extra['lat'] = (float) $activity['lat'];
                }
                $layerId = $this->asNullableString($activity['layerId'] ?? null);
                if ($layerId !== null) {
                    $extra['layerId'] = $layerId;
                }

                $cityName = $this->asNullableString($activity['city'] ?? null) ?? $voyage->destination;
                $journee->etapes()->create([
                    'temps_estime' => $this->formatDurationHours($duration),
                    'titre' => $title,
                    'description' => $extra !== [] ? json_encode($extra, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
                    'prix_estime' => 0,
                    'ville' => $cityName,
                    'pays' => $this->cityCountryResolver->resolve($cityName),
                    'source_lien' => null,
                    'ordre' => $idx + 1,
                ]);
            }
        }
    }

    private function buildSnapshotFromStructuredData(Voyage $voyage): array
    {
        $firstTransport = $voyage->transports->sortBy('depart_le')->first();
        $firstHebergement = $voyage->hebergements->sortBy('arrivee_le')->first();

        $days = $voyage->journees
            ->sortBy('numero_jour')
            ->map(function (Journee $journee) {
                return [
                    'dayIndex' => $journee->numero_jour,
                    'activities' => $journee->etapes
                        ->sortBy('ordre')
                        ->map(function ($etape) {
                            $activity = [
                                'title' => $etape->titre,
                                'durationHours' => $this->parseDurationHours($etape->temps_estime),
                            ];
                            if (is_string($etape->description) && trim($etape->description) !== '') {
                                $decoded = json_decode($etape->description, true);
                                if (is_array($decoded)) {
                                    if (isset($decoded['lng']) && is_numeric($decoded['lng'])) {
                                        $activity['lng'] = (float) $decoded['lng'];
                                    }
                                    if (isset($decoded['lat']) && is_numeric($decoded['lat'])) {
                                        $activity['lat'] = (float) $decoded['lat'];
                                    }
                                    if (isset($decoded['layerId']) && is_scalar($decoded['layerId'])) {
                                        $activity['layerId'] = (string) $decoded['layerId'];
                                    }
                                }
                            }

                            return $activity;
                        })
                        ->values()
                        ->all(),
                ];
            })
            ->values()
            ->all();

        $snapshot = ['days' => $days];

        if ($firstTransport) {
            $snapshot['flightSummary'] = [
                'carrier' => $firstTransport->type,
                'price' => (string) $firstTransport->prix,
                'currency' => $firstTransport->devise ?: 'EUR',
                'originIata' => $firstTransport->depart_lieu,
                'destinationIata' => $firstTransport->arrivee_lieu,
                'outboundAt' => $firstTransport->depart_le?->toISOString(),
                'returnAt' => $firstTransport->arrivee_le?->toISOString(),
                'bookingUrl' => $firstTransport->information_supplementaire,
            ];
        }

        if ($firstHebergement) {
            $snapshot['hotelSummary'] = [
                'name' => $firstHebergement->nom,
                'address' => $firstHebergement->adresse,
                'latitude' => $firstHebergement->latitude,
                'longitude' => $firstHebergement->longitude,
                'cityName' => $firstHebergement->ville,
                'totalPrice' => (string) $firstHebergement->prix,
                'currency' => $firstHebergement->devise ?: 'EUR',
                'checkInDate' => $firstHebergement->arrivee_le?->toDateString(),
                'checkOutDate' => $firstHebergement->depart_le?->toDateString(),
                'bookingUrl' => $firstHebergement->informations_supplementaire,
            ];
        }

        return $snapshot;
    }

    private function resolveDateTime(?string $raw, Carbon $fallback): Carbon
    {
        if ($raw !== null && trim($raw) !== '') {
            return Carbon::parse($raw);
        }

        return $fallback;
    }

    private function asNullableString(mixed $value): ?string
    {
        if (! is_scalar($value)) {
            return null;
        }

        $str = trim((string) $value);

        return $str !== '' ? $str : null;
    }

    private function formatDurationHours(mixed $hours): string
    {
        if (is_numeric($hours)) {
            $num = (float) $hours;
            if ($num > 0) {
                return rtrim(rtrim(number_format($num, 2, '.', ''), '0'), '.').'h';
            }
        }

        return '0h';
    }

    private function parseDurationHours(?string $duration): ?float
    {
        if ($duration === null) {
            return null;
        }

        $normalized = trim(str_ireplace('h', '', $duration));
        if ($normalized === '' || ! is_numeric($normalized)) {
            return null;
        }

        return (float) $normalized;
    }

    private function compactSnapshotForStorage(mixed $snapshot): ?array
    {
        if (! is_array($snapshot)) {
            return null;
        }

        $stored = [];

        $planningMode = $this->asNullableString($snapshot['planningMode'] ?? null);
        if ($planningMode !== null) {
            $stored['planningMode'] = $planningMode;
        }

        $destinationSummary = Arr::get($snapshot, 'destinationSummary');
        if (is_array($destinationSummary)) {
            $compactDestination = [];
            foreach (['cityName', 'airportName', 'iataCode'] as $key) {
                $val = $this->asNullableString($destinationSummary[$key] ?? null);
                if ($val !== null) {
                    $compactDestination[$key] = $val;
                }
            }
            if ($compactDestination !== []) {
                $stored['destinationSummary'] = $compactDestination;
            }
        }

        return $stored !== [] ? $stored : null;
    }

    private function normalizeDateString(mixed $value): string
    {
        if ($value instanceof CarbonInterface) {
            return $value->toDateString();
        }

        return Carbon::parse((string) $value)->toDateString();
    }

    private function resolveDestination(string $fallback, mixed $snapshot): string
    {
        if (! is_array($snapshot)) {
            return $fallback;
        }

        $city = $this->getStringFromSnapshot($snapshot, ['destinationSummary', 'cityName'])
            ?? $this->getStringFromSnapshot($snapshot, ['hotelSummary', 'cityName']);

        return $city ?: $fallback;
    }

    private function extractBudgetTotal(mixed $snapshot): int
    {
        if (! is_array($snapshot)) {
            return 0;
        }

        $flightPrice = $this->extractMoney($this->getStringFromSnapshot($snapshot, ['flightSummary', 'price']));
        $hotelPrice = $this->extractMoney($this->getStringFromSnapshot($snapshot, ['hotelSummary', 'totalPrice']));

        $flightCurrency = $this->getStringFromSnapshot($snapshot, ['flightSummary', 'currency']);
        $hotelCurrency = $this->getStringFromSnapshot($snapshot, ['hotelSummary', 'currency']);

        $flightEur = $this->toEur($flightPrice, $flightCurrency);
        $hotelEur = $this->toEur($hotelPrice, $hotelCurrency);

        return (int) round($flightEur + $hotelEur);
    }

    private function toEur(float $amount, ?string $currency): float
    {
        return $this->currencyConverter->convert($amount, (string) ($currency ?? 'EUR'), 'EUR');
    }

    private function extractMoney(?string $value): float
    {
        if ($value === null) {
            return 0.0;
        }

        $normalized = str_replace(',', '.', trim($value));
        if ($normalized === '') {
            return 0.0;
        }

        return is_numeric($normalized) ? (float) $normalized : 0.0;
    }

    /**
     * @param  array<string, mixed>  $snapshot
     * @param  array<int, string>  $path
     */
    private function getStringFromSnapshot(array $snapshot, array $path): ?string
    {
        $current = $snapshot;
        foreach ($path as $segment) {
            if (! is_array($current) || ! array_key_exists($segment, $current)) {
                return null;
            }

            $current = $current[$segment];
        }

        if (! is_scalar($current)) {
            return null;
        }

        $value = trim((string) $current);

        return $value !== '' ? $value : null;
    }
}
