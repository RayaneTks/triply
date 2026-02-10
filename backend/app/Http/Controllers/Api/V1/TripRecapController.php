<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\Api\V1\StubResource;
use App\Services\Contracts\TripServiceInterface;

class TripRecapController extends ApiController
{
    public function __construct(private readonly TripServiceInterface $tripService)
    {
    }

    public function show(string $trip)
    {
        return $this->successResponse(new StubResource($this->tripService->recap($trip)));
    }
}
