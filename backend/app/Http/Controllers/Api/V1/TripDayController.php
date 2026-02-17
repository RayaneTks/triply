<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Trips\UpdateDayRequest;
use App\Http\Resources\Api\V1\StubResource;
use App\Services\Contracts\TripServiceInterface;

class TripDayController extends ApiController
{
    public function __construct(private readonly TripServiceInterface $tripService)
    {
    }

    public function index(string $trip)
    {
        return $this->successResponse($this->tripService->listDays($trip));
    }

    public function update(UpdateDayRequest $request, string $trip, string $day)
    {
        return $this->successResponse(new StubResource($this->tripService->updateDay($trip, $day, $request->validated())));
    }
}
