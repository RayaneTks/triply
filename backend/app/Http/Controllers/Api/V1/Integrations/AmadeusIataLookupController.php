<?php

namespace App\Http\Controllers\Api\V1\Integrations;

use App\Http\Controllers\Api\V1\ApiController;
use App\Services\Integrations\AmadeusClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AmadeusIataLookupController extends ApiController
{
    public function index(Request $request, AmadeusClient $amadeus): JsonResponse
    {
        $keyword = (string) $request->query('keyword', '');
        $subType = strtoupper((string) $request->query('subType', 'AIRPORT,CITY'));

        if (strlen(trim($keyword)) < 2) {
            return $this->successResponse([]);
        }

        // Never surface a 5xx to the autocomplete UI: a failed lookup must
        // degrade to "no results" so the frontend can show its own message.
        try {
            $items = $amadeus->iataLookup($keyword, $subType);
        } catch (\Throwable $e) {
            Log::warning('iata-lookup controller exception', ['message' => $e->getMessage()]);
            $items = [];
        }

        return $this->successResponse($items);
    }
}
