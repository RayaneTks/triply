<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\Api\V1\StubResource;
use App\Services\Contracts\PlacesServiceInterface;

class PlacesController extends ApiController
{
    public function __construct(private readonly PlacesServiceInterface $placesService)
    {
    }

    public function show(string $placeId)
    {
        return $this->successResponse(new StubResource($this->placesService->details($placeId)));
    }

    public function reviews(string $placeId)
    {
        return $this->successResponse($this->placesService->reviews($placeId));
    }
}
