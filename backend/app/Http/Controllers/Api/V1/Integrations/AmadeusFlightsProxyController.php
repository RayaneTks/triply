<?php

namespace App\Http\Controllers\Api\V1\Integrations;

use App\Http\Controllers\Api\V1\ApiController;
use App\Services\Integrations\AmadeusClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AmadeusFlightsProxyController extends ApiController
{
    public function store(Request $request, AmadeusClient $amadeus): JsonResponse
    {
        try {
            $data = $amadeus->flightOffers($request->all());
        } catch (\Throwable $e) {
            Log::warning('amadeus flights proxy', ['message' => $e->getMessage()]);

            return response()->json([
                'errors' => [
                    [
                        'title' => 'Flight search unavailable',
                        'detail' => 'Impossible de contacter le service de vols. Réessayez plus tard.',
                    ],
                ],
            ], 502);
        }

        if (isset($data['errors']) && is_array($data['errors']) && $data['errors'] !== []) {
            Log::warning('amadeus flights rejected', [
                'request' => $request->all(),
                'errors' => $data['errors'],
            ]);
            return response()->json($data, 422);
        }

        if (isset($data['error']) && is_string($data['error'])) {
            Log::warning('amadeus flights error payload', [
                'request' => $request->all(),
                'error' => $data['error'],
            ]);
            return response()->json([
                'errors' => [
                    [
                        'title' => 'Flight search failed',
                        'detail' => $data['error'],
                    ],
                ],
            ], 422);
        }

        return response()->json($data, 200);
    }
}
