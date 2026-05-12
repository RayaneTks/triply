<?php

namespace App\Services;

use App\Models\Voyage;
use App\Services\Contracts\TripRecapServiceInterface;

class TripRecapService implements TripRecapServiceInterface
{
    public function build(Voyage $voyage, array $serializedTrip): array
    {
        $sections = [];

        foreach ($voyage->transports->sortBy('depart_le') as $transport) {
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

        foreach ($voyage->hebergements->sortBy('arrivee_le') as $hebergement) {
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

        foreach ($voyage->journees->sortBy('numero_jour') as $journee) {
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
            'id' => (string) $voyage->id,
            'trip' => $serializedTrip,
            'sections' => $sections,
        ];
    }
}
