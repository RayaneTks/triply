<?php

namespace App\Services;

use App\Models\Journee;
use App\Models\Voyage;
use App\Services\Contracts\CurrencyConverterInterface;
use App\Services\Contracts\TripServiceInterface;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;

class TripService implements TripServiceInterface
{
    public function __construct(private readonly CurrencyConverterInterface $currencyConverter)
    {
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

        $voyage = Voyage::query()->create([
            'titre' => $payload['title'],
            'destination' => $this->resolveDestination($payload['destination'], $planSnapshot),
            'date_debut' => $startDate,
            'date_fin' => $endDate,
            'budget_total' => $this->extractBudgetTotal($planSnapshot),
            'nb_voyageurs' => $payload['travelers_count'] ?? 1,
            'description' => null,
            'user_id' => $user->id,
            'plan_snapshot' => $planSnapshot,
        ]);

        return $this->serializeTrip($voyage->fresh(['transports', 'hebergements']));
    }

    public function listTrips(): array
    {
        $user = Auth::user();
        if (! $user) {
            return ['items' => []];
        }

        $voyages = Voyage::query()
            ->where('user_id', $user->id)
            ->with(['transports', 'hebergements'])
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
            $updates['plan_snapshot'] = $payload['plan_snapshot'];

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

        return $this->serializeTrip($voyage->fresh(['transports', 'hebergements']));
    }

    public function duplicateTrip(string $tripId): array
    {
        $source = $this->findUserTrip($tripId);

        $copy = $source->replicate();
        $copy->titre = $source->titre.' (copie)';
        $copy->save();

        return $this->serializeTrip($copy->fresh(['transports', 'hebergements']));
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
            ->with(['transports', 'hebergements'])
            ->firstOrFail();
    }

    private function serializeTrip(Voyage $voyage): array
    {
        $firstTransport = $voyage->transports->sortBy('depart_le')->first();
        $snapshot = is_array($voyage->plan_snapshot) ? $voyage->plan_snapshot : [];
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
            'plan_snapshot' => $voyage->plan_snapshot,
            'created_at' => $voyage->created_at?->toISOString(),
            'updated_at' => $voyage->updated_at?->toISOString(),
        ];
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
