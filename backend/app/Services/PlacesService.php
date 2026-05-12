<?php

namespace App\Services;

use App\Models\Etape;
use App\Services\Contracts\PlacesServiceInterface;
use App\Services\Integrations\AmadeusClient;
use Illuminate\Support\Facades\Auth;

class PlacesService implements PlacesServiceInterface
{
    public function __construct(private readonly AmadeusClient $amadeus)
    {
    }

    public function details(string $placeId): array
    {
        return [
            'id' => $placeId,
            'type' => 'place',
            'attributes' => ['name' => 'Place'],
        ];
    }

    public function reviews(string $placeId): array
    {
        return ['place_id' => $placeId, 'items' => []];
    }

    public function routes(string $tripId): array
    {
        return ['trip_id' => $tripId, 'segments' => []];
    }

    public function travelTimes(string $tripId): array
    {
        return ['trip_id' => $tripId, 'items' => []];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function nearbyRestaurants(array $payload): array
    {
        $lat = null;
        $lng = null;
        $activityId = isset($payload['activity_id']) ? (string) $payload['activity_id'] : null;
        $activitySnapshot = null;

        if ($activityId !== null && $activityId !== '') {
            $resolved = $this->resolveCoordinatesFromActivity($activityId);
            if ($resolved !== null) {
                [$lat, $lng, $activitySnapshot] = [$resolved['lat'], $resolved['lng'], $resolved['activity']];
            }
        }

        if ($lat === null && isset($payload['lat']) && is_numeric($payload['lat'])) {
            $lat = (float) $payload['lat'];
        }
        if ($lng === null && isset($payload['lng']) && is_numeric($payload['lng'])) {
            $lng = (float) $payload['lng'];
        }

        if ($lat === null || $lng === null) {
            return [
                'query' => $payload,
                'activity_id' => $activityId,
                'items' => [],
                'message' => 'Coordonnees manquantes : fournir lat/lng ou activity_id avec coordonnees.',
            ];
        }

        $radius = isset($payload['radius']) && is_numeric($payload['radius'])
            ? max(50, min(10000, (int) $payload['radius']))
            : 800;
        $limit = isset($payload['limit']) && is_numeric($payload['limit'])
            ? max(1, min(20, (int) $payload['limit']))
            : 10;

        $pois = $this->amadeus->pointsOfInterest($lat, $lng, $radius, ['RESTAURANT']);

        $items = array_map(function (array $p) use ($lat, $lng) {
            $dist = $this->haversineMeters($lat, $lng, (float) $p['lat'], (float) $p['lng']);
            $p['distance_meters'] = (int) round($dist);

            return $p;
        }, $pois);

        usort($items, function ($a, $b) {
            $ra = $a['rank'] ?? 0;
            $rb = $b['rank'] ?? 0;
            if ($ra !== $rb) {
                return $rb <=> $ra;
            }

            return ($a['distance_meters'] ?? PHP_INT_MAX) <=> ($b['distance_meters'] ?? PHP_INT_MAX);
        });

        $items = array_slice($items, 0, $limit);

        return [
            'query' => [
                'lat' => $lat,
                'lng' => $lng,
                'radius' => $radius,
                'limit' => $limit,
                'activity_id' => $activityId,
            ],
            'activity' => $activitySnapshot,
            'items' => $items,
        ];
    }

    /**
     * @return array{lat: float, lng: float, activity: array<string, mixed>}|null
     */
    private function resolveCoordinatesFromActivity(string $activityId): ?array
    {
        $user = Auth::user();
        if (! $user) {
            return null;
        }

        $etape = Etape::query()
            ->whereKey($activityId)
            ->whereHas('journee.voyage', fn ($q) => $q->where('user_id', $user->id))
            ->first();

        if ($etape === null) {
            return null;
        }

        $extra = [];
        if (is_string($etape->description) && trim($etape->description) !== '') {
            $decoded = json_decode($etape->description, true);
            if (is_array($decoded)) {
                $extra = $decoded;
            }
        }
        if (! isset($extra['lat'], $extra['lng']) || ! is_numeric($extra['lat']) || ! is_numeric($extra['lng'])) {
            return null;
        }

        return [
            'lat' => (float) $extra['lat'],
            'lng' => (float) $extra['lng'],
            'activity' => [
                'id' => (string) $etape->id,
                'title' => $etape->titre,
                'city' => $etape->ville,
                'country' => $etape->pays,
            ],
        ];
    }

    private function haversineMeters(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earth = 6371000.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earth * $c;
    }
}
