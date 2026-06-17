<?php

namespace App\Services;

use App\Models\Voyage;
use App\Services\Integrations\AmadeusClient;

/**
 * Free-time Concierge — detects unused capacity in a day and proposes
 * walkable nearby POIs (Amadeus) to fill the gap.
 *
 * The MVP heuristic uses (maxActivityHoursPerDay × 60) − sum(durations) as
 * "free minutes". When this exceeds the floor (60min) we treat it as an
 * opportunity to surface suggestions.
 */
class TripFreeTimeService
{
    public function __construct(private readonly AmadeusClient $amadeus) {}

    private const DEFAULT_MAX_HOURS_PER_DAY = 8.0;
    private const MIN_FREE_MINUTES_TO_SUGGEST = 60;
    private const DEFAULT_RADIUS_METERS = 1200;
    private const POI_CATEGORIES = ['SIGHTS', 'RESTAURANT', 'SHOPPING'];

    /**
     * @return array{
     *   day: int,
     *   has_free_time: bool,
     *   free_minutes: int,
     *   max_minutes: int,
     *   used_minutes: int,
     *   anchor: ?array{lat: float, lng: float},
     *   suggestions: list<array{id: ?string, name: string, category: string, lat: float, lng: float, distance_km: float, walking_minutes: int}>
     * }
     */
    public function computeForDay(Voyage $voyage, int $dayNumber): array
    {
        $snapshot = is_array($voyage->plan_snapshot) ? $voyage->plan_snapshot : [];
        $maxHours = $this->resolveMaxHours($snapshot);
        $activities = $this->extractDayActivities($snapshot, $dayNumber);

        $usedMinutes = 0;
        foreach ($activities as $a) {
            $dur = $a['durationHours'] ?? 1.0;
            $usedMinutes += (int) round($dur * 60);
        }

        $maxMinutes = (int) round($maxHours * 60);
        $freeMinutes = max(0, $maxMinutes - $usedMinutes);
        $hasFreeTime = $freeMinutes >= self::MIN_FREE_MINUTES_TO_SUGGEST;

        $anchor = $this->resolveAnchor($activities, $snapshot, $voyage);

        $suggestions = [];
        if ($hasFreeTime && $anchor !== null) {
            $suggestions = $this->buildSuggestions($anchor, $activities, $freeMinutes);
        }

        return [
            'day' => $dayNumber,
            'has_free_time' => $hasFreeTime,
            'free_minutes' => $freeMinutes,
            'max_minutes' => $maxMinutes,
            'used_minutes' => $usedMinutes,
            'anchor' => $anchor,
            'suggestions' => $suggestions,
        ];
    }

    /**
     * @param  array{lat: float, lng: float}  $anchor
     * @param  list<array{title: string, lat: float, lng: float, durationHours?: float}>  $activities
     * @return list<array{id: ?string, name: string, category: string, lat: float, lng: float, distance_km: float, walking_minutes: int}>
     */
    private function buildSuggestions(array $anchor, array $activities, int $freeMinutes): array
    {
        $rawPois = $this->amadeus->pointsOfInterest(
            $anchor['lat'],
            $anchor['lng'],
            self::DEFAULT_RADIUS_METERS,
            self::POI_CATEGORIES,
        );

        if ($rawPois === []) {
            return [];
        }

        $existingTitles = [];
        foreach ($activities as $a) {
            $existingTitles[mb_strtolower(trim($a['title']))] = true;
        }

        $scored = [];
        foreach ($rawPois as $poi) {
            $name = isset($poi['name']) && is_string($poi['name']) ? trim($poi['name']) : '';
            if ($name === '' || isset($existingTitles[mb_strtolower($name)])) {
                continue;
            }
            $plat = isset($poi['lat']) && is_numeric($poi['lat']) ? (float) $poi['lat'] : null;
            $plng = isset($poi['lng']) && is_numeric($poi['lng']) ? (float) $poi['lng'] : null;
            if ($plat === null || $plng === null) {
                continue;
            }
            $distanceKm = $this->haversineKm($anchor['lat'], $anchor['lng'], $plat, $plng);
            // 12 min/km walking (5 km/h baseline).
            $walkingMinutes = (int) round($distanceKm * 12);
            // Only include POIs reachable within half the free time (round-trip).
            if ($walkingMinutes > 0 && ($walkingMinutes * 2) > $freeMinutes) {
                continue;
            }
            $scored[] = [
                'id' => isset($poi['id']) && (is_string($poi['id']) || is_numeric($poi['id'])) ? (string) $poi['id'] : null,
                'name' => $name,
                'category' => isset($poi['category']) && is_string($poi['category']) ? $poi['category'] : 'POI',
                'lat' => $plat,
                'lng' => $plng,
                'distance_km' => round($distanceKm, 2),
                'walking_minutes' => $walkingMinutes,
                'rank' => isset($poi['rank']) && is_numeric($poi['rank']) ? (int) $poi['rank'] : 999,
            ];
        }

        usort($scored, fn ($a, $b) => $a['rank'] <=> $b['rank'] ?: $a['distance_km'] <=> $b['distance_km']);

        $top = array_slice($scored, 0, 6);

        return array_values(array_map(static function (array $row): array {
            unset($row['rank']);

            return $row;
        }, $top));
    }

    /**
     * @return list<array{title: string, lat: float, lng: float, durationHours?: float}>
     */
    private function extractDayActivities(array $snapshot, int $dayNumber): array
    {
        if (! isset($snapshot['days']) || ! is_array($snapshot['days'])) {
            return [];
        }
        foreach ($snapshot['days'] as $idx => $day) {
            if (! is_array($day)) {
                continue;
            }
            $thisDay = isset($day['dayIndex']) && is_numeric($day['dayIndex'])
                ? (int) $day['dayIndex']
                : (is_int($idx) ? $idx + 1 : 0);
            if ($thisDay !== $dayNumber) {
                continue;
            }
            $activities = $day['activities'] ?? $day['etapes'] ?? null;
            if (! is_array($activities)) {
                return [];
            }
            $out = [];
            foreach ($activities as $a) {
                if (! is_array($a)) {
                    continue;
                }
                $title = isset($a['title']) && is_string($a['title']) ? trim($a['title']) : '';
                $lat = isset($a['lat']) && is_numeric($a['lat']) ? (float) $a['lat'] : NAN;
                $lng = isset($a['lng']) && is_numeric($a['lng']) ? (float) $a['lng'] : NAN;
                if ($title === '' || ! is_finite($lat) || ! is_finite($lng)) {
                    continue;
                }
                $row = ['title' => $title, 'lat' => $lat, 'lng' => $lng];
                $dur = $a['durationHours'] ?? $a['duration_hours'] ?? null;
                if (is_numeric($dur) && (float) $dur > 0) {
                    $row['durationHours'] = (float) $dur;
                }
                $out[] = $row;
            }

            return $out;
        }

        return [];
    }

    /**
     * @param  list<array{lat: float, lng: float}>  $activities
     * @return ?array{lat: float, lng: float}
     */
    private function resolveAnchor(array $activities, array $snapshot, Voyage $voyage): ?array
    {
        if ($activities !== []) {
            // Geographic centroid keeps POIs walkable from any etape of the day.
            $sumLat = 0.0;
            $sumLng = 0.0;
            foreach ($activities as $a) {
                $sumLat += $a['lat'];
                $sumLng += $a['lng'];
            }
            $count = count($activities);

            return [
                'lat' => $sumLat / $count,
                'lng' => $sumLng / $count,
            ];
        }

        // No activities yet — fall back to the hotel summary or destination summary.
        $hotel = $snapshot['hotelSummary'] ?? null;
        if (is_array($hotel)) {
            $lat = isset($hotel['latitude']) && is_numeric($hotel['latitude']) ? (float) $hotel['latitude'] : null;
            $lng = isset($hotel['longitude']) && is_numeric($hotel['longitude']) ? (float) $hotel['longitude'] : null;
            if ($lat !== null && $lng !== null && is_finite($lat) && is_finite($lng)) {
                return ['lat' => $lat, 'lng' => $lng];
            }
        }

        $dest = $voyage->destination ?? '';
        if (is_string($dest) && $dest !== '') {
            $geo = $this->amadeus->firstCityGeo($dest);
            if ($geo !== null && isset($geo['lat'], $geo['lng'])) {
                return ['lat' => (float) $geo['lat'], 'lng' => (float) $geo['lng']];
            }
        }

        return null;
    }

    private function resolveMaxHours(array $snapshot): float
    {
        if (isset($snapshot['maxActivityHoursPerDay']) && is_numeric($snapshot['maxActivityHoursPerDay'])) {
            $v = (float) $snapshot['maxActivityHoursPerDay'];
            if ($v > 0 && $v <= 16) {
                return $v;
            }
        }

        return self::DEFAULT_MAX_HOURS_PER_DAY;
    }

    private function haversineKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthR = 6371.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthR * $c;
    }
}
