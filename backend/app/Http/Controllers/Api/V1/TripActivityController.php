<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Activities\ReorderActivitiesRequest;
use App\Http\Requests\Api\V1\Activities\StoreActivityRequest;
use App\Http\Requests\Api\V1\Activities\UpdateActivityRequest;
use App\Http\Resources\Api\V1\StubResource;
use App\Services\Contracts\ActivityServiceInterface;

class TripActivityController extends ApiController
{
    public function __construct(private readonly ActivityServiceInterface $activityService)
    {
    }

    public function store(StoreActivityRequest $request, string $trip)
    {
        return $this->successResponse(new StubResource($this->activityService->create($trip, $request->validated())), status: 201);
    }

    public function index(string $trip)
    {
        return $this->successResponse($this->activityService->list($trip, request()->query()));
    }

    public function groupedByDay(string $trip)
    {
        return $this->successResponse($this->activityService->groupedByDay($trip));
    }

    public function show(string $trip, string $activity)
    {
        return $this->successResponse(new StubResource($this->activityService->show($trip, $activity)));
    }

    public function update(UpdateActivityRequest $request, string $trip, string $activity)
    {
        return $this->successResponse(new StubResource($this->activityService->update($trip, $activity, $request->validated())));
    }

    public function regenerate(string $trip, string $activity)
    {
        return $this->successResponse(new StubResource($this->activityService->regenerate($trip, $activity)), status: 202);
    }

    public function reorder(ReorderActivitiesRequest $request, string $trip)
    {
        return $this->successResponse(new StubResource($this->activityService->reorder($trip, $request->validated())));
    }

    public function destroy(string $trip, string $activity)
    {
        return $this->successResponse(new StubResource($this->activityService->delete($trip, $activity)));
    }

    public function restore(string $trip, string $activity)
    {
        return $this->successResponse(new StubResource($this->activityService->restore($trip, $activity)));
    }
}
