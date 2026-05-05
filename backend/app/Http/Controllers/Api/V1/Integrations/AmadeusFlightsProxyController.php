<?php

namespace App\Http\Controllers\Api\V1\Integrations;

use App\Http\Controllers\Api\V1\ApiController;
use App\Services\Integrations\AmadeusClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AmadeusFlightsProxyController extends ApiController
{
    public function store(Request $request, AmadeusClient $amadeus): JsonResponse
    {
        try {
            $data = $amadeus->flightOffers($request->all());
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }

        $status = isset($data['error']) ? 500 : 200;

        return response()->json($data, $status);
    }
}
