<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Trips\StoreTripRequest;
use App\Http\Requests\Api\V1\Trips\UpdateTripRequest;
use App\Http\Resources\Api\V1\StubResource;
use App\Services\Contracts\TripServiceInterface;

class TripController extends ApiController
{
    public function __construct(private readonly TripServiceInterface $tripService)
    {
    }

    public function store(StoreTripRequest $request)
    {
        return $this->successResponse(new StubResource($this->tripService->createTrip($request->validated())), status: 201);
    }

    public function index()
    {
        return $this->successResponse($this->tripService->listTrips());
    }

    public function show(string $trip)
    {
        return $this->successResponse(new StubResource($this->tripService->showTrip($trip)));
    }

    public function update(UpdateTripRequest $request, string $trip)
    {
        return $this->successResponse(new StubResource($this->tripService->updateTrip($trip, $request->validated())));
    }

    public function duplicate(string $trip)
    {
        return $this->successResponse(new StubResource($this->tripService->duplicateTrip($trip)), status: 201);
    }

    public function validateTrip(string $trip)
    {
        return $this->successResponse(new StubResource($this->tripService->validateTrip($trip)));
    }
}
