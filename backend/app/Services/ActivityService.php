<?php

namespace App\Services;

use App\Models\Etape;
use App\Models\Journee;
use App\Models\Voyage;
use App\Services\Contracts\ActivityServiceInterface;
use App\Services\Geo\CityCountryResolverInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ActivityService implements ActivityServiceInterface
{
    public function __construct(private readonly CityCountryResolverInterface $cityCountryResolver)
    {
    }

    public function create(string $tripId, array $payload): array
    {
        $trip = $this->findUserTrip($tripId);

        $dayId = $payload['day_id'] ?? null;
        $journee = null;
        if ($dayId !== null) {
            $journee = Journee::query()
                ->where('voyage_id', $trip->id)
                ->where('id', $dayId)
                ->first();
        }

        if ($journee === null) {
            $journee = $trip->journees()->orderBy('numero_jour')->first();
        }

        if ($journee === null) {
            throw new ModelNotFoundException('Aucune journee disponible pour ce voyage.');
        }

        $title = (string) ($payload['title'] ?? 'Nouvelle activite');
        $city = $payload['city'] ?? $trip->destination;
        $duration = $payload['estimated_duration_minutes'] ?? null;
        $extra = $this->buildGeoExtra($payload);

        $ordre = $payload['ordre'] ?? $this->nextOrderForDay($journee);

        $etape = $journee->etapes()->create([
            'titre' => $title,
            'description' => $extra !== []
                ? json_encode($extra, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                : ($payload['notes'] ?? null),
            'temps_estime' => $this->formatDuration($duration),
            'prix_estime' => isset($payload['cost']) ? (int) round((float) $payload['cost']) : 0,
            'ville' => $city,
            'pays' => $this->cityCountryResolver->resolve(is_string($city) ? $city : null),
            'source_lien' => $payload['source_lien'] ?? null,
            'ordre' => $ordre,
            'liked_state' => $payload['liked_state'] ?? 'neutral',
        ]);

        return $this->serializeActivity($etape, $trip->id);
    }

    public function list(string $tripId, array $filters): array
    {
        $trip = $this->findUserTrip($tripId);

        $query = Etape::query()
            ->whereHas('journee', fn ($q) => $q->where('voyage_id', $trip->id))
            ->orderBy('journee_id')
            ->orderBy('ordre');

        if (! empty($filters['liked_state']) && in_array($filters['liked_state'], ['liked', 'disliked', 'neutral'], true)) {
            $query->where('liked_state', $filters['liked_state']);
        }

        if (! empty($filters['city'])) {
            $query->where('ville', $filters['city']);
        }

        $items = $query->get()->map(fn (Etape $etape) => $this->serializeActivity($etape, $trip->id))->all();

        return [
            'trip_id' => (string) $trip->id,
            'items' => $items,
        ];
    }

    public function groupedByDay(string $tripId): array
    {
        $trip = $this->findUserTrip($tripId);

        $days = $trip->journees()->orderBy('numero_jour')->with('etapes')->get();

        return [
            'trip_id' => (string) $trip->id,
            'days' => $days->map(fn (Journee $day) => [
                'day_id' => (string) $day->id,
                'index' => $day->numero_jour,
                'date' => $day->date_jour,
                'activities' => $day->etapes
                    ->sortBy('ordre')
                    ->map(fn (Etape $etape) => $this->serializeActivity($etape, $trip->id))
                    ->values()
                    ->all(),
            ])->values()->all(),
        ];
    }

    public function show(string $tripId, string $activityId): array
    {
        $trip = $this->findUserTrip($tripId);
        $etape = $this->findTripActivity($trip, $activityId, withTrashed: true);

        return $this->serializeActivity($etape, $trip->id);
    }

    public function update(string $tripId, string $activityId, array $payload): array
    {
        $trip = $this->findUserTrip($tripId);
        $etape = $this->findTripActivity($trip, $activityId);

        if (array_key_exists('title', $payload)) {
            $etape->titre = (string) $payload['title'];
        }
        if (array_key_exists('estimated_duration_minutes', $payload) && is_numeric($payload['estimated_duration_minutes'])) {
            $etape->temps_estime = $this->formatDuration((int) $payload['estimated_duration_minutes']);
        }
        if (array_key_exists('cost', $payload) && is_numeric($payload['cost'])) {
            $etape->prix_estime = (int) round((float) $payload['cost']);
        }
        if (array_key_exists('notes', $payload)) {
            $etape->description = $payload['notes'];
        }
        if (array_key_exists('liked_state', $payload)
            && in_array($payload['liked_state'], ['liked', 'disliked', 'neutral'], true)
        ) {
            $etape->liked_state = $payload['liked_state'];
        }
        if (array_key_exists('city', $payload) && is_string($payload['city']) && trim($payload['city']) !== '') {
            $etape->ville = trim($payload['city']);
            $etape->pays = $this->cityCountryResolver->resolve($etape->ville);
        }

        $geoKeys = array_intersect_key($payload, array_flip(['lat', 'lng', 'layer_id']));
        if ($geoKeys !== []) {
            $extra = $this->readGeoExtra($etape);
            $extra = $this->mergeGeoExtra($extra, $geoKeys);
            $etape->description = json_encode($extra, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        $etape->save();

        return $this->serializeActivity($etape->fresh(), $trip->id);
    }

    public function regenerate(string $tripId, string $activityId): array
    {
        $trip = $this->findUserTrip($tripId);
        // On verifie au moins que l'activite appartient bien au voyage.
        $this->findTripActivity($trip, $activityId);

        return [
            'id' => 'job_'.uniqid(),
            'type' => 'ai_job',
            'attributes' => [
                'trip_id' => (string) $trip->id,
                'activity_id' => $activityId,
                'status' => 'queued',
            ],
            'todo' => 'Queue activity regeneration (AI service stub a brancher en Phase 3).',
        ];
    }

    public function reorder(string $tripId, array $payload): array
    {
        $trip = $this->findUserTrip($tripId);

        $order = [];
        if (isset($payload['order']) && is_array($payload['order'])) {
            $order = $payload['order'];
        } elseif (isset($payload['activity_ids']) && is_array($payload['activity_ids'])) {
            $order = $payload['activity_ids'];
        }
        $updated = [];
        $activityIds = array_values(array_filter($order, static fn ($id) => is_scalar($id) && (string) $id !== ''));
        if ($activityIds === []) {
            return [
                'trip_id' => (string) $trip->id,
                'updated' => $updated,
            ];
        }

        $activities = Etape::query()
            ->whereHas('journee', fn ($q) => $q->where('voyage_id', $trip->id))
            ->whereIn('id', $activityIds)
            ->get()
            ->keyBy(fn (Etape $etape) => (string) $etape->id);

        DB::transaction(function () use ($order, $activities, $trip, &$updated): void {
            $orderedIdsByDay = [];
            foreach ($order as $activityId) {
                $key = is_scalar($activityId) ? (string) $activityId : '';
                if ($key === '' || ! $activities->has($key)) {
                    continue;
                }

                /** @var Etape $etape */
                $etape = $activities->get($key);
                $dayId = $etape->journee_id;
                if ($dayId === null) {
                    continue;
                }
                if (! isset($orderedIdsByDay[$dayId])) {
                    $orderedIdsByDay[$dayId] = [];
                }
                $orderedIdsByDay[$dayId][] = (int) $etape->id;
            }

            foreach ($orderedIdsByDay as $dayId => $orderedIds) {
                if ($orderedIds === []) {
                    continue;
                }

                $dayActivities = Etape::query()
                    ->where('journee_id', $dayId)
                    ->whereHas('journee', fn ($q) => $q->where('voyage_id', $trip->id))
                    ->orderBy('ordre')
                    ->orderBy('id')
                    ->get();

                if ($dayActivities->isEmpty()) {
                    continue;
                }

                $selected = collect($orderedIds)->flip();
                $orderedSelection = $dayActivities
                    ->whereIn('id', $orderedIds)
                    ->sortBy(fn (Etape $etape) => array_search((int) $etape->id, $orderedIds, true))
                    ->values();
                $remaining = $dayActivities
                    ->reject(fn (Etape $etape) => $selected->has((int) $etape->id))
                    ->values();
                $final = $orderedSelection->concat($remaining)->values();

                // Two-phase update prevents transient duplicates on unique(day_id, ordre).
                foreach ($final as $idx => $etape) {
                    $etape->ordre = 100000 + $idx + 1;
                    $etape->save();
                }
                foreach ($final as $idx => $etape) {
                    $etape->ordre = $idx + 1;
                    $etape->save();
                }

                $updated = [...$updated, ...$orderedSelection->map(fn (Etape $etape) => (string) $etape->id)->all()];
            }
        });

        return [
            'trip_id' => (string) $trip->id,
            'updated' => $updated,
        ];
    }

    public function delete(string $tripId, string $activityId): array
    {
        $trip = $this->findUserTrip($tripId);
        $etape = $this->findTripActivity($trip, $activityId);
        $etape->delete();

        return [
            'id' => (string) $etape->id,
            'type' => 'activity_deletion',
            'attributes' => [
                'trip_id' => (string) $trip->id,
                'deleted' => true,
            ],
        ];
    }

    public function restore(string $tripId, string $activityId): array
    {
        $trip = $this->findUserTrip($tripId);
        $etape = Etape::withTrashed()
            ->whereHas('journee', fn ($q) => $q->where('voyage_id', $trip->id))
            ->where('id', $activityId)
            ->first();

        if ($etape === null) {
            throw new ModelNotFoundException('Activite introuvable.');
        }

        $etape->restore();

        return [
            'id' => (string) $etape->id,
            'type' => 'activity_restore',
            'attributes' => [
                'trip_id' => (string) $trip->id,
                'restored' => true,
            ],
        ];
    }

    /** Next slot for (journee_id, ordre); includes soft-deleted rows (unique index does). */
    private function nextOrderForDay(Journee $journee): int
    {
        $max = $journee->etapes()->withTrashed()->max('ordre');

        return (int) ($max ?? 0) + 1;
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
            ->firstOrFail();
    }

    private function findTripActivity(Voyage $trip, string $activityId, bool $withTrashed = false): Etape
    {
        $query = Etape::query()->whereHas('journee', fn ($q) => $q->where('voyage_id', $trip->id));
        if ($withTrashed) {
            $query->withTrashed();
        }

        $etape = $query->where('id', $activityId)->first();
        if ($etape === null) {
            throw new ModelNotFoundException('Activite introuvable.');
        }

        return $etape;
    }

    private function serializeActivity(Etape $etape, int|string $tripId): array
    {
        $extra = [];
        if (is_string($etape->description) && trim($etape->description) !== '') {
            $decoded = json_decode($etape->description, true);
            if (is_array($decoded)) {
                $extra = $decoded;
            }
        }

        return [
            'id' => (string) $etape->id,
            'type' => 'activity',
            'attributes' => [
                'trip_id' => (string) $tripId,
                'day_id' => $etape->journee_id !== null ? (string) $etape->journee_id : null,
                'title' => $etape->titre,
                'duration' => $etape->temps_estime,
                'cost' => $etape->prix_estime,
                'city' => $etape->ville,
                'country' => $etape->pays,
                'order' => $etape->ordre,
                'liked_state' => $etape->liked_state ?? 'neutral',
                'lat' => isset($extra['lat']) && is_numeric($extra['lat']) ? (float) $extra['lat'] : null,
                'lng' => isset($extra['lng']) && is_numeric($extra['lng']) ? (float) $extra['lng'] : null,
                'layer_id' => isset($extra['layerId']) && is_string($extra['layerId']) ? $extra['layerId'] : null,
                'notes' => is_string($etape->description) ? $etape->description : null,
                'deleted_at' => $etape->deleted_at?->toISOString(),
            ],
        ];
    }

    private function formatDuration(mixed $minutes): string
    {
        if (! is_numeric($minutes)) {
            return $minutes === null ? '0h' : (string) $minutes;
        }
        $hours = (float) $minutes / 60;

        return rtrim(rtrim(number_format($hours, 2, '.', ''), '0'), '.').'h';
    }

    /** @param array<string, mixed> $payload */
    private function buildGeoExtra(array $payload): array
    {
        $extra = [];
        if (isset($payload['lat']) && is_numeric($payload['lat'])) {
            $extra['lat'] = (float) $payload['lat'];
        }
        if (isset($payload['lng']) && is_numeric($payload['lng'])) {
            $extra['lng'] = (float) $payload['lng'];
        }
        $layerId = $payload['layer_id'] ?? $payload['layerId'] ?? null;
        if (is_string($layerId) && trim($layerId) !== '') {
            $extra['layerId'] = trim($layerId);
        }

        return $extra;
    }

    /** @return array<string, mixed> */
    private function readGeoExtra(Etape $etape): array
    {
        if (! is_string($etape->description) || trim($etape->description) === '') {
            return [];
        }
        $decoded = json_decode($etape->description, true);

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * @param  array<string, mixed>  $extra
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function mergeGeoExtra(array $extra, array $payload): array
    {
        if (array_key_exists('lat', $payload)) {
            if ($payload['lat'] === null) {
                unset($extra['lat']);
            } elseif (is_numeric($payload['lat'])) {
                $extra['lat'] = (float) $payload['lat'];
            }
        }
        if (array_key_exists('lng', $payload)) {
            if ($payload['lng'] === null) {
                unset($extra['lng']);
            } elseif (is_numeric($payload['lng'])) {
                $extra['lng'] = (float) $payload['lng'];
            }
        }
        $layerId = $payload['layer_id'] ?? $payload['layerId'] ?? null;
        if (array_key_exists('layer_id', $payload) || array_key_exists('layerId', $payload)) {
            if ($layerId === null || (is_string($layerId) && trim($layerId) === '')) {
                unset($extra['layerId']);
            } elseif (is_string($layerId)) {
                $extra['layerId'] = trim($layerId);
            }
        }

        return $extra;
    }
}
