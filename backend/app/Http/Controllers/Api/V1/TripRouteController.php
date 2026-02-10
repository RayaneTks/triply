<?php

namespace App\Http\Controllers\Api\V1;

use App\Services\Contracts\PlacesServiceInterface;

class TripRouteController extends ApiController
{
    public function __construct(private readonly PlacesServiceInterface $placesService)
    {
    }

    public function routes(string $trip)
    {
        return $this->successResponse($this->placesService->routes($trip));
    }

    public function travelTimes(string $trip)
    {
        return $this->successResponse($this->placesService->travelTimes($trip));
    }
}
