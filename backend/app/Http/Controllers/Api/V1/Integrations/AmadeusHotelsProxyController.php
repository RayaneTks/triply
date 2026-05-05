<?php

namespace App\Http\Controllers\Api\V1\Integrations;

use App\Http\Controllers\Api\V1\ApiController;
use App\Services\Integrations\AmadeusClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AmadeusHotelsProxyController extends ApiController
{
    public function index(Request $request, AmadeusClient $amadeus): JsonResponse
    {
        $lat = $request->query('lat');
        $lng = $request->query('lng');
        if (! is_string($lat) || ! is_string($lng) || $lat === '' || $lng === '') {
            return response()->json(['error' => 'Lat/Lng required'], 400);
        }
        $ratings = $request->query('ratings');
        try {
            $data = $amadeus->hotelsByGeocode($lat, $lng, is_string($ratings) ? $ratings : null);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage(), 'locations' => []], 500);
        }

        return response()->json($data);
    }

    public function store(Request $request, AmadeusClient $amadeus): JsonResponse
    {
        try {
            $data = $amadeus->hotelOffersSearch($request->all());
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
        $status = isset($data['error']) ? 500 : 200;

        return response()->json($data, $status);
    }
}
