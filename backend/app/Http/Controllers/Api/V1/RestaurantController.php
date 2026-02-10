<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Places\NearbyRestaurantsRequest;
use App\Services\Contracts\PlacesServiceInterface;

class RestaurantController extends ApiController
{
    public function __construct(private readonly PlacesServiceInterface $placesService)
    {
    }

    public function nearby(NearbyRestaurantsRequest $request)
    {
        return $this->successResponse($this->placesService->nearbyRestaurants($request->validated()));
    }
}
