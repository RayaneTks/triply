<?php

namespace App\Http\Controllers\Api\V1\Integrations;

use App\Http\Controllers\Api\V1\ApiController;
use App\Services\Integrations\AmadeusClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AmadeusPlacesSearchController extends ApiController
{
    public function index(Request $request, AmadeusClient $amadeus): JsonResponse
    {
        $keyword = (string) $request->query('keyword', '');
        if (strlen(trim($keyword)) < 2) {
            return $this->successResponse([]);
        }

        try {
            $items = $amadeus->locationsByKeyword($keyword);
        } catch (\Throwable $e) {
            Log::warning('Amadeus places search failed', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse(
                'AMADEUS_UNAVAILABLE',
                'La recherche de lieux est momentanément indisponible. Vérifiez les identifiants Amadeus (AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET) sur le serveur.',
                [],
                503
            );
        }

        return $this->successResponse($items);
    }
}
