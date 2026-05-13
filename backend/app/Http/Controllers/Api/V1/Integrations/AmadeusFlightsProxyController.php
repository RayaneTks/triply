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
        return $this->search($request, $amadeus);
    }

    public function search(Request $request, AmadeusClient $amadeus): JsonResponse
    {
        $payload = $request->all();

        try {
            $data = $amadeus->flightOffers($payload);
        } catch (\Throwable $e) {
            Log::warning('amadeus flights proxy', ['message' => $e->getMessage()]);

            return response()->json([
                'errors' => [
                    [
                        'title' => 'Flight search unavailable',
                        'detail' => 'Impossible de contacter le service de vols. Reessayez plus tard.',
                    ],
                ],
            ], 502);
        }

        if (isset($data['errors']) && is_array($data['errors']) && $data['errors'] !== []) {
            Log::warning('amadeus flights rejected', [
                'request' => $payload,
                'errors' => $data['errors'],
            ]);

            return response()->json($data, 422);
        }

        if (isset($data['error']) && is_string($data['error'])) {
            Log::warning('amadeus flights error payload', [
                'request' => $payload,
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
