<?php

namespace App\Services;

use App\Models\Voyage;
use App\Services\Contracts\RouteServiceInterface;

class RouteService implements RouteServiceInterface
{
    public function buildSegments(Voyage $voyage): array
    {
        $segments = [];

        foreach ($voyage->journees->sortBy('numero_jour') as $journee) {
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
}
