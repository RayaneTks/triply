<?php

namespace App\Http\Controllers\Api\V1\Integrations;

use App\Http\Controllers\Api\V1\ApiController;
use App\Services\Integrations\AmadeusClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AmadeusIataLookupController extends ApiController
{
    public function index(Request $request, AmadeusClient $amadeus): JsonResponse
    {
        $keyword = (string) $request->query('keyword', '');
        $subType = strtoupper((string) $request->query('subType', 'AIRPORT,CITY'));

        if (strlen(trim($keyword)) < 2) {
            return $this->successResponse([]);
        }

        $items = $amadeus->iataLookup($keyword, $subType);

        return $this->successResponse($items);
    }
}
