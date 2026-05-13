<?php

namespace App\Http\Controllers\Api\V1\Integrations;

use App\Http\Controllers\Api\V1\ApiController;
use App\Services\Integrations\AmadeusClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AmadeusHotelsProxyController extends ApiController
{
    public function index(Request $request, AmadeusClient $amadeus): JsonResponse
    {
        $lat = $request->query('lat');
        $lng = $request->query('lng');
        if (! is_string($lat) || ! is_string($lng) || $lat === '' || $lng === '') {
            return response()->json([
                'errors' => [
                    [
                        'title' => 'Invalid geocode',
                        'detail' => 'Latitude et longitude sont obligatoires.',
                    ],
                ],
            ], 422);
        }

        $ratings = $request->query('ratings');

        try {
            $data = $amadeus->hotelsByGeocode($lat, $lng, is_string($ratings) ? $ratings : null);
        } catch (\Throwable $e) {
            Log::warning('amadeus hotels by geocode proxy', ['message' => $e->getMessage()]);

            return response()->json([
                'errors' => [
                    [
                        'title' => 'Hotel search unavailable',
                        'detail' => 'Impossible de contacter le service hotels. Reessayez plus tard.',
                    ],
                ],
                'locations' => [],
            ], 502);
        }

        return response()->json($data);
    }

    public function store(Request $request, AmadeusClient $amadeus): JsonResponse
    {
        return $this->search($request, $amadeus);
    }

    public function search(Request $request, AmadeusClient $amadeus): JsonResponse
    {
        $payload = $request->all();

        try {
            $data = $amadeus->hotelOffersSearch($payload);
        } catch (\Throwable $e) {
            Log::warning('amadeus hotels proxy', ['message' => $e->getMessage()]);

            return response()->json([
                'errors' => [
                    [
                        'title' => 'Hotel search unavailable',
                        'detail' => 'Impossible de contacter le service hotels. Reessayez plus tard.',
                    ],
                ],
            ], 502);
        }

        if (isset($data['errors']) && is_array($data['errors']) && $data['errors'] !== []) {
            Log::warning('amadeus hotels rejected', [
                'request' => $payload,
                'errors' => $data['errors'],
            ]);

            return response()->json($data, 422);
        }

        if (isset($data['error']) && is_string($data['error'])) {
            Log::warning('amadeus hotels error payload', [
                'request' => $payload,
                'error' => $data['error'],
                'details' => $data['details'] ?? null,
            ]);

            return response()->json([
                'errors' => [
                    [
                        'title' => 'Hotel search failed',
                        'detail' => $data['error'],
                    ],
                ],
            ], 422);
        }

        return response()->json($data, 200);
    }
}
