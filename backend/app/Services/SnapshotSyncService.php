<?php

namespace App\Services;

use App\Models\Journee;
use App\Models\Voyage;
use App\Services\Contracts\CurrencyConverterInterface;
use App\Services\Contracts\SnapshotSyncServiceInterface;
use App\Services\Geo\CityCountryResolverInterface;
use Carbon\Carbon;
use Illuminate\Support\Arr;

class SnapshotSyncService implements SnapshotSyncServiceInterface
{
    public function __construct(
        private readonly CurrencyConverterInterface $currencyConverter,
        private readonly CityCountryResolverInterface $cityCountryResolver,
    ) {
    }

    public function syncFromSnapshot(Voyage $voyage, array $snapshot): void
    {
        $this->clearStructured($voyage);

        $this->syncTransportFromSnapshot($voyage, $snapshot);
        $this->syncHebergementFromSnapshot($voyage, $snapshot);
        $this->syncDaysAndStepsFromSnapshot($voyage, $snapshot);
    }

    public function clearStructured(Voyage $voyage): void
    {
        $voyage->transports()->delete();
        $voyage->hebergements()->delete();
        $voyage->journees()->with('etapes')->get()->each(function (Journee $journee): void {
            $journee->etapes()->delete();
        });
        $voyage->journees()->delete();
    }

    public function duplicateStructured(Voyage $source, Voyage $copy): void
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

    public function compactForStorage(mixed $snapshot): ?array
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

        $tripBudget = Arr::get($snapshot, 'trip_budget_eur');
        if (is_numeric($tripBudget) && (float) $tripBudget > 0) {
            $stored['trip_budget_eur'] = (int) round((float) $tripBudget);
        }

        $origin = Arr::get($snapshot, 'origin');
        if (is_array($origin)) {
            $compactOrigin = [];
            foreach (['cityName', 'iataCode', 'airportName', 'countryName'] as $key) {
                $val = $this->asNullableString($origin[$key] ?? null);
                if ($val !== null) {
                    $compactOrigin[$key] = $val;
                }
            }
            foreach (['lat', 'lng'] as $key) {
                if (isset($origin[$key]) && is_numeric($origin[$key])) {
                    $compactOrigin[$key] = (float) $origin[$key];
                }
            }
            if ($compactOrigin !== []) {
                $stored['origin'] = $compactOrigin;
            }
        }

        return $stored !== [] ? $stored : null;
    }

    public function buildFromStructured(Voyage $voyage): array
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

    public function refreshCompactSnapshot(Voyage $voyage): void
    {
        $stored = is_array($voyage->plan_snapshot) ? $voyage->plan_snapshot : [];
        $merged = array_replace_recursive($this->buildFromStructured($voyage), $stored);
        $voyage->plan_snapshot = $this->compactForStorage($merged);
        $voyage->save();
    }

    public function extractBudgetTotal(mixed $snapshot): int
    {
        if (! is_array($snapshot)) {
            return 0;
        }

        $tripBudgetRaw = Arr::get($snapshot, 'trip_budget_eur');
        if (is_numeric($tripBudgetRaw) && (float) $tripBudgetRaw > 0) {
            return (int) round((float) $tripBudgetRaw);
        }

        $flightPrice = $this->extractMoney($this->getStringFromSnapshot($snapshot, ['flightSummary', 'price']));
        $hotelPrice = $this->extractMoney($this->getStringFromSnapshot($snapshot, ['hotelSummary', 'totalPrice']));

        $flightCurrency = $this->getStringFromSnapshot($snapshot, ['flightSummary', 'currency']);
        $hotelCurrency = $this->getStringFromSnapshot($snapshot, ['hotelSummary', 'currency']);

        $flightEur = $this->toEur($flightPrice, $flightCurrency);
        $hotelEur = $this->toEur($hotelPrice, $hotelCurrency);

        return (int) round($flightEur + $hotelEur);
    }

    public function resolveDestination(string $fallback, mixed $snapshot): string
    {
        if (! is_array($snapshot)) {
            return $fallback;
        }

        $city = $this->getStringFromSnapshot($snapshot, ['destinationSummary', 'cityName'])
            ?? $this->getStringFromSnapshot($snapshot, ['hotelSummary', 'cityName']);

        return $city ?: $fallback;
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
