<?php

namespace App\Services;

use App\Models\Journee;
use App\Models\Voyage;
use App\Services\Contracts\CurrencyConverterInterface;
use App\Services\Contracts\TripServiceInterface;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Arr;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;

class TripService implements TripServiceInterface
{
    public function __construct(private readonly CurrencyConverterInterface $currencyConverter)
    {
    }

    public function createTrip(array $payload): array
    {
        // #region agent log
        $agentLog = static function (string $hypothesisId, string $location, string $message, array $data = []): void {
            $p = storage_path('logs/debug-cc5fd8.log');
            file_put_contents(
                $p,
                json_encode([
                    'sessionId' => 'cc5fd8',
                    'hypothesisId' => $hypothesisId,
                    'location' => $location,
                    'message' => $message,
                    'data' => $data,
                    'timestamp' => (int) round(microtime(true) * 1000),
                ], JSON_UNESCAPED_UNICODE)."\n",
                FILE_APPEND | LOCK_EX
            );
        };
        // #endregion

        try {
            $agentLog('A', 'TripService::createTrip', 'entry', ['payload_keys' => array_keys($payload)]);

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

            $agentLog('B', 'TripService::createTrip', 'after_voyage_create', ['voyage_id' => $voyage->id]);

            if (is_array($planSnapshot)) {
                $agentLog('C', 'TripService::createTrip', 'before_sync', []);
                $this->syncStructuredTripData($voyage, $planSnapshot);
                $agentLog('D', 'TripService::createTrip', 'after_sync', []);
            }

            $out = $this->serializeTrip($voyage->fresh(['transports', 'hebergements', 'journees.etapes']));
            $agentLog('E', 'TripService::createTrip', 'success', []);

            return $out;
        } catch (\Throwable $e) {
            // #region agent log
            $agentLog('X', 'TripService::createTrip', 'exception', [
                'class' => $e::class,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            // #endregion
            throw $e;
        }
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

        return [
            'id' => (string) $trip->id,
            'trip' => $this->serializeTrip($trip),
            'sections' => [],
        ];
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

                $journee->etapes()->create([
                    'temps_estime' => $this->formatDurationHours($duration),
                    'titre' => $title,
                    'description' => $extra !== [] ? json_encode($extra, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
                    'prix_estime' => 0,
                    'ville' => $voyage->destination,
                    'pays' => null,
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

        $hotelSummary = Arr::get($snapshot, 'hotelSummary');
        if (is_array($hotelSummary)) {
            $compactHotel = [];
            foreach (['name', 'address', 'cityCode', 'cityName', 'totalPrice', 'currency', 'checkInDate', 'checkOutDate', 'bookingUrl'] as $key) {
                $val = $this->asNullableString($hotelSummary[$key] ?? null);
                if ($val !== null) {
                    $compactHotel[$key] = $val;
                }
            }

            $latitude = $hotelSummary['latitude'] ?? null;
            if (is_numeric($latitude)) {
                $compactHotel['latitude'] = (float) $latitude;
            }

            $longitude = $hotelSummary['longitude'] ?? null;
            if (is_numeric($longitude)) {
                $compactHotel['longitude'] = (float) $longitude;
            }

            if ($compactHotel !== []) {
                $stored['hotelSummary'] = $compactHotel;
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
