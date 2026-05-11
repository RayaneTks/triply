<?php

namespace App\Http\Controllers\Api\V1;

use App\Services\Contracts\PlacesServiceInterface;
use App\Services\Contracts\TripServiceInterface;

class TripRouteController extends ApiController
{
    public function __construct(
        private readonly PlacesServiceInterface $placesService,
        private readonly TripServiceInterface $tripService,
    ) {
    }

    public function routes(string $trip)
    {
        return $this->successResponse([
            'trip_id' => $trip,
            'segments' => $this->tripService->listRoutes($trip),
        ]);
    }

    public function travelTimes(string $trip)
    {
        return $this->successResponse($this->placesService->travelTimes($trip));
    }
}
