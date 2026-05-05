<?php

namespace App\Http\Controllers\Api\V1\Integrations;

use App\Http\Controllers\Api\V1\ApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GooglePlaceReviewsController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $key = config('integrations.google_places.api_key');
        if (! is_string($key) || $key === '') {
            return response()->json(['error' => 'GOOGLE_PLACES_API_KEY non configurée'], 503);
        }

        $name = trim((string) $request->query('name', ''));
        $lat = $request->query('lat');
        $lng = $request->query('lng');
        if ($name === '' || ! is_string($lat) || ! is_string($lng) || $lat === '' || $lng === '') {
            return response()->json(['error' => 'Paramètres manquants: name, lat, lng'], 400);
        }

        try {
            $findUrl = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json'
                .'?input='.rawurlencode($name)
                .'&inputtype=textquery&locationbias=point:'.$lat.','.$lng
                .'&fields=place_id&key='.rawurlencode($key);

            $findRes = Http::timeout(20)->get($findUrl);
            $findData = $findRes->json();
            if (($findData['status'] ?? '') !== 'OK' || empty($findData['candidates'][0]['place_id'])) {
                return response()->json([
                    'name' => $name,
                    'rating' => null,
                    'reviews' => [],
                    'url' => null,
                    'error' => 'Lieu non trouvé',
                ]);
            }

            $placeId = $findData['candidates'][0]['place_id'];
            $detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json'
                .'?place_id='.rawurlencode($placeId)
                .'&fields=name,rating,reviews,url&language=fr&key='.rawurlencode($key);

            $detailsRes = Http::timeout(20)->get($detailsUrl);
            $detailsData = $detailsRes->json();
            if (($detailsData['status'] ?? '') !== 'OK' || empty($detailsData['result'])) {
                return response()->json([
                    'name' => $name,
                    'rating' => null,
                    'reviews' => [],
                    'url' => null,
                ]);
            }

            $result = $detailsData['result'];
            $reviews = [];
            foreach ($result['reviews'] ?? [] as $r) {
                if (! is_array($r)) {
                    continue;
                }
                $reviews[] = [
                    'author_name' => $r['author_name'] ?? '',
                    'rating' => $r['rating'] ?? 0,
                    'text' => $r['text'] ?? '',
                    'relative_time_description' => $r['relative_time_description'] ?? '',
                ];
            }

            return response()->json([
                'name' => $result['name'] ?? $name,
                'rating' => $result['rating'] ?? null,
                'reviews' => $reviews,
                'url' => $result['url'] ?? null,
            ]);
        } catch (\Throwable) {
            return response()->json(['error' => 'Erreur lors de la récupération des avis'], 500);
        }
    }
}
