<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Sharing\CreateShareLinkRequest;
use App\Http\Resources\Api\V1\StubResource;
use App\Services\Contracts\SharingServiceInterface;

class TripSharingController extends ApiController
{
    public function __construct(private readonly SharingServiceInterface $sharingService)
    {
    }

    public function create(CreateShareLinkRequest $request, string $trip)
    {
        return $this->successResponse(new StubResource($this->sharingService->createShareLink($trip, $request->validated())), status: 201);
    }

    public function showPublic(string $token)
    {
        return $this->successResponse(new StubResource($this->sharingService->publicRecap($token)));
    }
}
